export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const ACTION_LABELS = ["Encik", "Tolong", "Saya"] as const;

export const CONFIDENCE_THRESHOLD = 0.7;

export const SEQUENCE_LENGTH = 30;

export const SLIDE_STEP = 15;

// Landmark dimensions matching Python extract_keypoints:
// pose(33*4) + face(468*3) + leftHand(21*3) + rightHand(21*3) = 1662
export const LANDMARK_DIM = 1662;
