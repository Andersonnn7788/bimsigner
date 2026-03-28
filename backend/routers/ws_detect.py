"""WebSocket endpoint for real-time sign language detection.

Receives JPEG frames from the frontend, runs MediaPipe landmark extraction
using the same legacy Python API used during training, then feeds the
30-frame sliding buffer into the LSTM model for prediction.

Optimisations (v2):
- Early prediction from 15 frames (zero-padded) for lower latency
- Per-class confidence thresholds based on evaluation metrics
- Confusion-pair disambiguation to reduce Hi/Encik mix-ups
- Majority-vote smoothing (per-class window sizes)
- Sequence-context boost for expected sign order
- Processing lock to drop frames during inference
"""

import asyncio
import base64
import json
import logging
import time
from collections import Counter, deque

import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from services import model_service
from services.mediapipe_service import HolisticDetector

logger = logging.getLogger(__name__)

router = APIRouter()

# Limit concurrent WebSocket connections
_active_connections = 0
_MAX_CONNECTIONS = 3

ACTIONS = model_service.ACTIONS

# ---------------------------------------------------------------------------
# Per-class confidence floors (predictions below are treated as Idle)
# Derived from eval_outputs/classification_report.csv
# ---------------------------------------------------------------------------
_CLASS_CONFIDENCE: dict[str, float] = {
    "Idle":         0.35,
    "Hai":          0.35,
    "Saya":         0.40,
    "Encik":        0.40,
    "Puan":         0.50,
    "Tolong":       0.40,
    "Terima Kasih": 0.40,
    "Nama":         0.40,
    "Nombor":       0.40,
    "Tunggu":       0.40,
    "Mana":         0.70,
    "Borang":       0.45,
    "Renew":        0.45,
}

# ---------------------------------------------------------------------------
# Per-class majority-vote smoothing (window size, min votes required)
# ---------------------------------------------------------------------------
_CLASS_SMOOTHING: dict[str, tuple[int, int]] = {
    "Borang":  (3, 2),   # tightened: was (2,2) — false positives after Tolong
    "Hai":     (3, 2),   # 2/3 majority
    "Tolong":  (3, 2),   # 2/3 majority
    "Encik":   (3, 2),   # 2/3 majority (sequence filter handles confusion)
    "Puan":    (4, 3),   # not in demo sequence, kept stricter
}
_DEFAULT_SMOOTHING = (3, 2)  # 2/3 majority

# ---------------------------------------------------------------------------
# Confused pairs: reject prediction when gap between top-2 is too small
# ---------------------------------------------------------------------------
_CONFUSED_PAIRS: list[tuple[set[str], float]] = [
    ({"Encik", "Puan"},   0.08),
    ({"Tolong", "Renew"}, 0.03),
]

# Expected demo sign sequence (for sequence-context boost)
_EXPECTED_SEQUENCE = ["Hai", "Encik", "Tolong", "Borang"]
_SEQUENCE_BOOST = 0.20

# Minimum frames before prediction (zero-pad if < 30)
_MIN_FRAMES = 15

# Cooldown between successive sign detections (seconds)
_DETECTION_COOLDOWN = 0.6


def _disambiguate(
    sign: str,
    confidence: float,
    confidences: list[float],
) -> tuple[str, float]:
    """Reject prediction if top-2 classes form a known confused pair
    with a small confidence gap."""
    sorted_indices = np.argsort(confidences)[::-1]
    top1_idx, top2_idx = int(sorted_indices[0]), int(sorted_indices[1])
    top1_name = ACTIONS[top1_idx]
    top2_name = ACTIONS[top2_idx]
    gap = confidences[top1_idx] - confidences[top2_idx]

    for pair, min_gap in _CONFUSED_PAIRS:
        if {top1_name, top2_name} == pair and gap < min_gap:
            logger.debug(
                "Disambiguation: rejecting %s (%.3f) vs %s (%.3f), gap=%.3f < %.3f",
                top1_name, confidences[top1_idx],
                top2_name, confidences[top2_idx],
                gap, min_gap,
            )
            return "Idle", 0.0

    return sign, confidence


def _apply_sequence_boost(
    confidences: list[float],
    detected_so_far: list[str],
) -> list[float]:
    """Boost confidence for the next expected sign in the sequence."""
    boosted = list(confidences)
    for expected_sign in _EXPECTED_SEQUENCE:
        if expected_sign not in detected_so_far:
            idx = ACTIONS.index(expected_sign)
            boosted[idx] = min(1.0, boosted[idx] + _SEQUENCE_BOOST)
            logger.debug("Sequence boost: +%.2f to %s (now %.3f)",
                         _SEQUENCE_BOOST, expected_sign, boosted[idx])
            break
    return boosted


def _process_and_predict(
    detector: HolisticDetector,
    jpeg_bytes: bytes,
    frame_buffer: deque,
    detected_so_far: list[str] | None = None,
) -> dict | None:
    """Run MediaPipe + LSTM prediction (CPU-bound, called via to_thread).

    Returns prediction dict when buffer has >= _MIN_FRAMES frames.
    For buffers with 15-29 frames, zero-pads the front.
    """
    logger.debug("Processing frame (%d bytes JPEG)", len(jpeg_bytes))
    keypoints, has_hands = detector.process_frame(jpeg_bytes)
    frame_buffer.append(keypoints)

    if not has_hands:
        return {
            "sign": "Idle",
            "confidence": 0.0,
            "action_index": ACTIONS.index("Idle"),
            "confidences": [0.0] * len(ACTIONS),
            "passes_threshold": False,
            "no_hands": True,
        }

    buf_len = len(frame_buffer)
    if buf_len < _MIN_FRAMES:
        logger.debug("Buffer: %d/%d frames (min %d)", buf_len, 30, _MIN_FRAMES)
        return None

    # Build 30-frame sequence (zero-pad front if buffer < 30)
    frames = list(frame_buffer)
    if buf_len < 30:
        pad_count = 30 - buf_len
        zero_frame = np.zeros(1662, dtype=np.float32)
        frames = [zero_frame] * pad_count + frames

    sequence = np.array(frames, dtype=np.float32).reshape(1, 30, 1662)
    sign, confidence, action_index, confidences = model_service.predict(
        sequence.reshape(30, 1662).tolist()
    )

    # Apply gentle confidence penalty for short buffers
    if buf_len < 30:
        scale = 0.8 + 0.2 * (buf_len / 30.0)
        confidence *= scale
        confidences = [c * scale for c in confidences]

    # Apply sequence-context boost (always, even when detectedSoFar is empty)
    if detected_so_far is not None:
        confidences = _apply_sequence_boost(confidences, detected_so_far)
        # Recompute top prediction after boost
        action_index = int(np.argmax(confidences))
        sign = ACTIONS[action_index]
        confidence = confidences[action_index]

    # Confusion-pair disambiguation
    sign, confidence = _disambiguate(sign, confidence, confidences)

    # Enforce strict sequence order — only accept the NEXT expected sign
    # (prevents out-of-order detections like Borang before Tolong)
    if detected_so_far is not None and sign != "Idle":
        next_sign = None
        for s in _EXPECTED_SEQUENCE:
            if s not in detected_so_far:
                next_sign = s
                break
        if sign != next_sign:
            logger.debug("Sequence filter: rejecting %s (next expected: %s)",
                         sign, next_sign)
            sign = "Idle"
            confidence = 0.0

    # Per-class confidence threshold
    threshold = _CLASS_CONFIDENCE.get(sign, 0.45)
    passes_threshold = confidence >= threshold

    logger.debug(
        "LSTM prediction: sign=%s conf=%.3f (thresh=%.2f, pass=%s) buf=%d | all=%s",
        sign, confidence, threshold, passes_threshold, buf_len,
        {a: f"{c:.2f}" for a, c in zip(ACTIONS, confidences)},
    )

    return {
        "sign": sign,
        "confidence": confidence,
        "action_index": action_index if passes_threshold else ACTIONS.index("Idle"),
        "confidences": confidences,
        "passes_threshold": passes_threshold,
    }


def _majority_vote_smooth(
    prediction_history: list[int],
    last_smoothed_sign: str | None,
) -> str | None:
    """Per-class majority-vote smoothing.

    Finds the most common non-Idle class in a recent window and accepts
    it if it meets the vote threshold. Does NOT bail when the last
    prediction is Idle — this allows detection even when the model
    alternates between the correct sign and Idle.
    """
    if len(prediction_history) < 2:
        return None

    idle_idx = ACTIONS.index("Idle")

    # Look at a generous window to find dominant non-Idle class
    lookback = min(len(prediction_history), 5)
    recent = prediction_history[-lookback:]
    counts = Counter(recent)

    # Remove Idle from consideration
    counts.pop(idle_idx, None)
    if not counts:
        return None

    # Get the most common non-Idle class
    top_idx, top_count = counts.most_common(1)[0]
    candidate = ACTIONS[top_idx]

    # Check against this candidate's smoothing config
    window, min_votes = _CLASS_SMOOTHING.get(candidate, _DEFAULT_SMOOTHING)

    if top_count >= min_votes and candidate != last_smoothed_sign:
        logger.debug("Smoothing: %s got %d/%d votes in last %d",
                     candidate, top_count, min_votes, lookback)
        return candidate

    return None


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
    last_detection_time: float = 0.0
    frame_count = 0
    processing = False  # lightweight lock to drop frames during inference

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

            # Drop frame if still processing the previous one
            if processing:
                continue

            # Decode base64 JPEG
            try:
                jpeg_bytes = base64.b64decode(msg["data"])
            except Exception as e:
                logger.warning("base64 decode failed on frame #%d: %s", frame_count, e)
                continue

            if frame_count % 30 == 1:
                logger.info("Frame #%d received (%d bytes JPEG)", frame_count, len(jpeg_bytes))

            # Read sequence context from frontend
            detected_so_far = msg.get("detectedSoFar")

            # Run MediaPipe + prediction off the event loop
            processing = True
            try:
                result = await asyncio.to_thread(
                    _process_and_predict, detector, jpeg_bytes, frame_buffer,
                    detected_so_far,
                )
            finally:
                processing = False

            if result is None:
                # Buffer not full yet — send progress
                await websocket.send_text(json.dumps({
                    "type": "buffering",
                    "frames": len(frame_buffer),
                    "needed": _MIN_FRAMES,
                }))
                continue

            # Only enter smoothing pipeline if prediction passes its class threshold
            if result["passes_threshold"]:
                prediction_history.append(result["action_index"])
            else:
                # Below threshold → treat as Idle for smoothing purposes
                prediction_history.append(ACTIONS.index("Idle"))

            # Majority-vote temporal smoothing
            smoothed_sign = _majority_vote_smooth(prediction_history, last_smoothed_sign)
            now = time.time()
            if (smoothed_sign is not None
                    and (now - last_detection_time) >= _DETECTION_COOLDOWN):
                last_smoothed_sign = smoothed_sign
                last_detection_time = now
                # Clear history so the next sign starts fresh
                prediction_history.clear()
                logger.info("SMOOTHED sign detected: %s", smoothed_sign)
            elif smoothed_sign is not None:
                logger.debug("Cooldown: suppressed %s (%.2fs since last)",
                             smoothed_sign, now - last_detection_time)
                smoothed_sign = None

            response = {
                "type": "prediction",
                "raw": {
                    "sign": result["sign"],
                    "confidence": result["confidence"],
                    "confidences": result["confidences"],
                },
                "no_hands": result.get("no_hands", False),
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
