"""Collect sign language training data via webcam.

Opens a webcam feed, prompts you to perform each BIM sign, and saves
30 sequences × 30 frames of MediaPipe keypoints as .npy files.
"""

import os
import cv2
import numpy as np
import mediapipe as mp

from config import ACTIONS, NO_SEQUENCES, SEQUENCE_LENGTH, DATA_PATH
from utils import mediapipe_detection, draw_styled_landmarks, extract_keypoints

# ---------------------------------------------------------------------------
# Create folder structure: MP_Data/{action}/{sequence_number}/
# ---------------------------------------------------------------------------
for action in ACTIONS:
    for sequence in range(NO_SEQUENCES):
        os.makedirs(os.path.join(DATA_PATH, action, str(sequence)), exist_ok=True)

# ---------------------------------------------------------------------------
# Collect data
# ---------------------------------------------------------------------------
start_folder = 0  # Starting sequence index (set to 0 for fresh collection)

cap = cv2.VideoCapture(0)

with mp.solutions.holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5) as holistic:
    for action in ACTIONS:
        for sequence in range(start_folder, start_folder + NO_SEQUENCES):
            for frame_num in range(SEQUENCE_LENGTH):

                ret, frame = cap.read()
                if not ret:
                    break

                image, results = mediapipe_detection(frame, holistic)
                draw_styled_landmarks(image, results)

                # Show collection prompt
                if frame_num == 0:
                    cv2.putText(image, "STARTING COLLECTION", (120, 200),
                                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 4, cv2.LINE_AA)
                    cv2.putText(image, f"Collecting frames for '{action}' — Video {sequence}",
                                (15, 12), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1, cv2.LINE_AA)
                    cv2.imshow("OpenCV Feed", image)
                    cv2.waitKey(2000)  # 2-second pause before each sequence
                else:
                    cv2.putText(image, f"Collecting frames for '{action}' — Video {sequence}",
                                (15, 12), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1, cv2.LINE_AA)
                    cv2.imshow("OpenCV Feed", image)

                # Save keypoints
                keypoints = extract_keypoints(results)
                npy_path = os.path.join(DATA_PATH, action, str(sequence), str(frame_num))
                np.save(npy_path, keypoints)

                if cv2.waitKey(10) & 0xFF == ord("q"):
                    cap.release()
                    cv2.destroyAllWindows()
                    raise SystemExit("Collection cancelled by user.")

cap.release()
cv2.destroyAllWindows()
print("Data collection complete!")
print(f"Saved to: {DATA_PATH}")
print(f"Actions: {list(ACTIONS)}, Sequences: {NO_SEQUENCES}, Frames/seq: {SEQUENCE_LENGTH}")
