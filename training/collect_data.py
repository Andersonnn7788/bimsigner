"""Collect sign language training data via webcam.

Interactive per-sign collection: shows each sign one at a time with a
live webcam preview.  Press SPACE to start collecting, S to skip, Q to quit.
"""

import os
import cv2
import numpy as np
import mediapipe as mp

from config import ACTIONS, NO_SEQUENCES, SEQUENCE_LENGTH, DATA_PATH
from utils import mediapipe_detection, draw_styled_landmarks, extract_keypoints


def has_existing_data(action):
    """Check if an action already has collected data."""
    action_dir = os.path.join(DATA_PATH, action)
    if not os.path.isdir(action_dir):
        return False
    sequences = [d for d in os.listdir(action_dir) if os.path.isdir(os.path.join(action_dir, d))]
    return len(sequences) >= NO_SEQUENCES


def wait_for_ready(cap, holistic, action_name, action_idx, total_actions, data_exists):
    """Show live webcam with sign prompt, wait for SPACE/S/Q."""
    status = "(data exists)" if data_exists else "(no data)"

    while True:
        ret, frame = cap.read()
        if not ret:
            return "quit"

        image, results = mediapipe_detection(frame, holistic)
        draw_styled_landmarks(image, results)

        h, w = image.shape[:2]

        # Dark overlay for readability
        overlay = image.copy()
        cv2.rectangle(overlay, (0, 0), (w, h), (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.5, image, 0.5, 0, image)

        # Sign name (large)
        cv2.putText(image, action_name.upper(), (w // 2 - len(action_name) * 20, h // 2 - 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 255, 0), 4, cv2.LINE_AA)

        # Progress
        cv2.putText(image, f"Sign {action_idx + 1} of {total_actions}  {status}",
                    (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (200, 200, 200), 2, cv2.LINE_AA)

        # Instructions
        cv2.putText(image, "SPACE = Collect  |  S = Skip  |  Q = Quit",
                    (20, h - 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2, cv2.LINE_AA)

        if data_exists:
            cv2.putText(image, "Data already exists. SPACE to re-collect, S to skip.",
                        (20, h - 60), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 200, 255), 1, cv2.LINE_AA)

        cv2.imshow("BIM Data Collection", image)

        key = cv2.waitKey(30) & 0xFF
        if key == ord(" "):
            return "collect"
        elif key == ord("s"):
            return "skip"
        elif key == ord("q"):
            return "quit"


def collect_action(cap, holistic, action, start_folder=0):
    """Collect NO_SEQUENCES sequences for a single action."""
    # Create folders
    for sequence in range(NO_SEQUENCES):
        os.makedirs(os.path.join(DATA_PATH, action, str(sequence)), exist_ok=True)

    for sequence in range(start_folder, start_folder + NO_SEQUENCES):
        for frame_num in range(SEQUENCE_LENGTH):
            ret, frame = cap.read()
            if not ret:
                return

            image, results = mediapipe_detection(frame, holistic)
            draw_styled_landmarks(image, results)

            h, w = image.shape[:2]

            if frame_num == 0:
                # Brief pause at start of each sequence
                cv2.putText(image, "GET READY", (w // 2 - 120, h // 2),
                            cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 0), 4, cv2.LINE_AA)
                cv2.putText(image, f"Sign: {action}  |  Sequence {sequence + 1}/{NO_SEQUENCES}",
                            (20, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2, cv2.LINE_AA)
                cv2.imshow("BIM Data Collection", image)
                cv2.waitKey(500)
            else:
                # Progress display
                cv2.putText(image, f"Sign: {action}  |  Seq {sequence + 1}/{NO_SEQUENCES}  |  Frame {frame_num + 1}/{SEQUENCE_LENGTH}",
                            (20, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1, cv2.LINE_AA)
                cv2.imshow("BIM Data Collection", image)

            # Save keypoints
            keypoints = extract_keypoints(results)
            npy_path = os.path.join(DATA_PATH, action, str(sequence), str(frame_num))
            np.save(npy_path, keypoints)

            if cv2.waitKey(10) & 0xFF == ord("q"):
                raise SystemExit("Collection cancelled by user.")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print("BIM Sign Language Data Collection")
    print("=" * 50)
    print(f"Actions: {list(ACTIONS)}")
    print(f"Sequences per action: {NO_SEQUENCES}")
    print(f"Frames per sequence: {SEQUENCE_LENGTH}")
    print(f"Data path: {DATA_PATH}")
    print()

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("ERROR: Cannot open webcam")
        return

    collected = []
    skipped = []

    with mp.solutions.holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5) as holistic:
        for idx, action in enumerate(ACTIONS):
            data_exists = has_existing_data(action)
            decision = wait_for_ready(cap, holistic, action, idx, len(ACTIONS), data_exists)

            if decision == "quit":
                print(f"\nQuit at sign '{action}'")
                break
            elif decision == "skip":
                print(f"  Skipped: {action}")
                skipped.append(action)
                continue
            elif decision == "collect":
                print(f"  Collecting: {action} ...")
                collect_action(cap, holistic, action)
                print(f"  Done: {action}")
                collected.append(action)

    cap.release()
    cv2.destroyAllWindows()

    print("\n" + "=" * 50)
    print(f"Collected: {collected if collected else 'None'}")
    print(f"Skipped:   {skipped if skipped else 'None'}")
    print(f"Data saved to: {DATA_PATH}")


if __name__ == "__main__":
    main()
