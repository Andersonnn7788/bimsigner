"""Test trained model with real-time webcam inference.

Loads models/action.h5 and runs prediction with temporal smoothing
to verify the model works before using the backend API.
"""

import cv2
import numpy as np
import mediapipe as mp
from tensorflow.keras.models import load_model

from config import ACTIONS, SEQUENCE_LENGTH, MODEL_PATH
from utils import mediapipe_detection, draw_styled_landmarks, extract_keypoints

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------
model = load_model(MODEL_PATH)
print(f"Model loaded from: {MODEL_PATH}")

colors = [(128, 128, 128), (245, 117, 16), (117, 245, 16), (16, 117, 245)]
threshold = 0.5


def prob_viz(res, actions, image, colors):
    """Draw prediction probability bars on the frame."""
    output_frame = image.copy()
    for num, prob in enumerate(res):
        cv2.rectangle(output_frame, (0, 60 + num * 40), (int(prob * 100), 90 + num * 40), colors[num], -1)
        cv2.putText(output_frame, f"{actions[num]}: {prob:.2f}", (0, 85 + num * 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2, cv2.LINE_AA)
    return output_frame


# ---------------------------------------------------------------------------
# Real-time inference loop
# ---------------------------------------------------------------------------
sequence = []
sentence = []
predictions = []

cap = cv2.VideoCapture(0)

with mp.solutions.holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5) as holistic:
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        image, results = mediapipe_detection(frame, holistic)
        draw_styled_landmarks(image, results)

        keypoints = extract_keypoints(results)
        keypoints[132:1536] = 0.0  # Zero face landmarks (must match training mask)
        sequence.append(keypoints)
        sequence = sequence[-SEQUENCE_LENGTH:]

        if len(sequence) == SEQUENCE_LENGTH:
            res = model(np.expand_dims(sequence, axis=0), training=False)[0].numpy()
            predictions.append(np.argmax(res))

            # Temporal smoothing: require 10 consecutive same predictions
            if len(predictions) >= 10 and np.unique(predictions[-10:])[0] == np.argmax(res):
                if res[np.argmax(res)] > threshold:
                    if ACTIONS[np.argmax(res)] != "Idle" and (len(sentence) == 0 or ACTIONS[np.argmax(res)] != sentence[-1]):
                        sentence.append(ACTIONS[np.argmax(res)])

            if len(sentence) > 5:
                sentence = sentence[-5:]

            image = prob_viz(res, ACTIONS, image, colors)

        # Draw sentence bar
        cv2.rectangle(image, (0, 0), (640, 40), (245, 117, 16), -1)
        cv2.putText(image, " ".join(sentence), (3, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2, cv2.LINE_AA)

        cv2.imshow("BIM Sign Language Test", image)

        if cv2.waitKey(10) & 0xFF == ord("q"):
            break

cap.release()
cv2.destroyAllWindows()
