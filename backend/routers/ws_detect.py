"""WebSocket endpoint for real-time sign language detection.

Receives JPEG frames from the frontend, runs MediaPipe landmark extraction
using the same legacy Python API used during training, then feeds the
30-frame sliding buffer into the LSTM model for prediction.
"""

import asyncio
import base64
import json
import logging
from collections import deque

import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from services import model_service
from services.mediapipe_service import HolisticDetector

logger = logging.getLogger(__name__)

router = APIRouter()

# Limit concurrent WebSocket connections
_active_connections = 0
_MAX_CONNECTIONS = 3

# Temporal smoothing: require N consecutive identical predictions
_SMOOTHING_WINDOW = 5

ACTIONS = model_service.ACTIONS


def _process_and_predict(
    detector: HolisticDetector,
    jpeg_bytes: bytes,
    frame_buffer: deque,
) -> dict | None:
    """Run MediaPipe + LSTM prediction (CPU-bound, called via to_thread).

    Returns prediction dict when buffer is full, else None.
    """
    logger.debug("Processing frame (%d bytes JPEG)", len(jpeg_bytes))
    keypoints = detector.process_frame(jpeg_bytes)
    frame_buffer.append(keypoints)

    if len(frame_buffer) < 30:
        logger.debug("Buffer: %d/30 frames", len(frame_buffer))
        return None

    # Run LSTM prediction
    sequence = np.array(list(frame_buffer), dtype=np.float32).reshape(1, 30, 1662)
    sign, confidence, action_index, confidences = model_service.predict(
        sequence.reshape(30, 1662).tolist()
    )

    logger.debug(
        "LSTM prediction: sign=%s confidence=%.3f idx=%d | all=%s",
        sign, confidence, action_index,
        {a: f"{c:.2f}" for a, c in zip(ACTIONS, confidences)},
    )

    return {
        "sign": sign,
        "confidence": confidence,
        "action_index": action_index,
        "confidences": confidences,
    }


@router.websocket("/ws/detect")
async def ws_detect(websocket: WebSocket):
    global _active_connections
    logger.info("WebSocket request from %s", websocket.client)

    if _active_connections >= _MAX_CONNECTIONS:
        logger.warning("Rejecting connection — at max (%d)", _MAX_CONNECTIONS)
        await websocket.close(code=1013, reason="Too many connections")
        return

    await websocket.accept()
    _active_connections += 1
    logger.info("WebSocket accepted (active: %d)", _active_connections)

    detector = HolisticDetector()
    frame_buffer: deque = deque(maxlen=30)
    prediction_history: list[int] = []
    last_smoothed_sign: str | None = None
    frame_count = 0

    try:
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)
            msg_type = msg.get("type")

            if msg_type == "reset":
                logger.info("Reset requested — clearing buffers")
                frame_buffer.clear()
                prediction_history.clear()
                last_smoothed_sign = None
                await websocket.send_text(json.dumps({"type": "reset_ack"}))
                continue

            if msg_type != "frame":
                logger.debug("Ignoring message type: %s", msg_type)
                continue

            frame_count += 1

            # Decode base64 JPEG
            try:
                jpeg_bytes = base64.b64decode(msg["data"])
            except Exception as e:
                logger.warning("base64 decode failed on frame #%d: %s", frame_count, e)
                continue

            if frame_count % 30 == 1:
                logger.info("Frame #%d received (%d bytes JPEG)", frame_count, len(jpeg_bytes))

            # Run MediaPipe + prediction off the event loop
            result = await asyncio.to_thread(
                _process_and_predict, detector, jpeg_bytes, frame_buffer
            )

            if result is None:
                # Buffer not full yet — send progress
                await websocket.send_text(json.dumps({
                    "type": "buffering",
                    "frames": len(frame_buffer),
                    "needed": 30,
                }))
                continue

            # Temporal smoothing
            prediction_history.append(result["action_index"])
            smoothed_sign: str | None = None

            if len(prediction_history) >= _SMOOTHING_WINDOW:
                recent = prediction_history[-_SMOOTHING_WINDOW:]
                if len(set(recent)) == 1:
                    candidate = ACTIONS[recent[0]]
                    if candidate != "Idle" and candidate != last_smoothed_sign:
                        smoothed_sign = candidate
                        last_smoothed_sign = candidate
                        logger.info("SMOOTHED sign detected: %s", smoothed_sign)
                    elif candidate == "Idle":
                        last_smoothed_sign = None

            response = {
                "type": "prediction",
                "raw": {
                    "sign": result["sign"],
                    "confidence": result["confidence"],
                    "confidences": result["confidences"],
                },
            }
            if smoothed_sign is not None:
                response["smoothed"] = {"sign": smoothed_sign}

            await websocket.send_text(json.dumps(response))

    except WebSocketDisconnect:
        logger.info("Client disconnected (received %d frames)", frame_count)
    except Exception as e:
        logger.error("WebSocket error after %d frames: %s", frame_count, e, exc_info=True)
    finally:
        detector.close()
        _active_connections -= 1
        logger.info("Cleaned up (active: %d)", _active_connections)
