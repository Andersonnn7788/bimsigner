"""MediaPipe Holistic wrapper using the legacy Python API.

Uses the same mp.solutions.holistic.Holistic that the training pipeline uses,
ensuring landmark extraction produces identical values to what the LSTM was
trained on.
"""

import logging

import cv2
import numpy as np
import mediapipe as mp

logger = logging.getLogger(__name__)


class HolisticDetector:
    """Per-connection MediaPipe Holistic wrapper.

    Each WebSocket connection should create its own instance because MediaPipe
    maintains temporal tracking state internally.
    """

    def __init__(self):
        logger.info("Creating HolisticDetector instance")
        self._holistic = mp.solutions.holistic.Holistic(
            min_detection_confidence=0.3,
            min_tracking_confidence=0.3,
        )
        logger.info("HolisticDetector ready")

    def process_frame(self, jpeg_bytes: bytes) -> tuple[np.ndarray, bool]:
        """Decode JPEG, run MediaPipe, extract & return 1662-dim keypoints.

        Returns (keypoints, has_hands) — has_hands is True when at least one
        hand was detected. Sign language requires hands, so predictions
        without hand landmarks are meaningless.
        Face landmarks are zeroed out to match the training mask.
        """
        # Decode JPEG → BGR numpy array
        buf = np.frombuffer(jpeg_bytes, dtype=np.uint8)
        frame = cv2.imdecode(buf, cv2.IMREAD_COLOR)
        if frame is None:
            logger.warning("cv2.imdecode returned None (corrupt/empty JPEG, %d bytes)", len(jpeg_bytes))
            return np.zeros(1662, dtype=np.float32), False

        logger.debug("Decoded frame: shape=%s dtype=%s", frame.shape, frame.dtype)

        # MediaPipe expects RGB
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        rgb.flags.writeable = False
        results = self._holistic.process(rgb)

        has_pose = results.pose_landmarks is not None
        has_face = results.face_landmarks is not None
        has_lh = results.left_hand_landmarks is not None
        has_rh = results.right_hand_landmarks is not None
        has_hands = has_lh or has_rh
        logger.debug(
            "MediaPipe results — pose=%s face=%s left_hand=%s right_hand=%s",
            has_pose, has_face, has_lh, has_rh,
        )

        keypoints = self._extract_keypoints(results)
        # Zero face landmarks (indices 132..1536) to match training mask
        keypoints[132:1536] = 0.0

        non_zero = int(np.count_nonzero(keypoints))
        logger.debug("Keypoints: %d/1662 non-zero (hands=%s)", non_zero, has_hands)
        return keypoints, has_hands

    def close(self):
        logger.info("Closing HolisticDetector")
        self._holistic.close()

    @staticmethod
    def _extract_keypoints(results) -> np.ndarray:
        """Flatten MediaPipe Holistic landmarks into a 1662-dim array.

        Identical to training/utils.py:extract_keypoints().
        Breakdown: pose(33×4=132) + face(468×3=1404) + lh(21×3=63) + rh(21×3=63)
        """
        pose = (
            np.array(
                [[r.x, r.y, r.z, r.visibility] for r in results.pose_landmarks.landmark]
            ).flatten()
            if results.pose_landmarks
            else np.zeros(33 * 4)
        )
        face = (
            np.array(
                [[r.x, r.y, r.z] for r in results.face_landmarks.landmark]
            ).flatten()
            if results.face_landmarks
            else np.zeros(468 * 3)
        )
        lh = (
            np.array(
                [[r.x, r.y, r.z] for r in results.left_hand_landmarks.landmark]
            ).flatten()
            if results.left_hand_landmarks
            else np.zeros(21 * 3)
        )
        rh = (
            np.array(
                [[r.x, r.y, r.z] for r in results.right_hand_landmarks.landmark]
            ).flatten()
            if results.right_hand_landmarks
            else np.zeros(21 * 3)
        )
        return np.concatenate([pose, face, lh, rh]).astype(np.float32)
