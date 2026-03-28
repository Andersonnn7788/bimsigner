export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export const ACTION_LABELS = ["Hai", "Saya", "Encik", "Puan", "Tolong", "Terima Kasih", "Nama", "Nombor", "Tunggu", "Mana", "Borang", "Renew", "Idle"] as const;

// Backend model returns confidences in this order (must match backend ACTIONS list)
export const BACKEND_ACTIONS = ["Idle", "Hai", "Saya", "Encik", "Puan", "Tolong", "Terima Kasih", "Nama", "Nombor", "Tunggu", "Mana", "Borang", "Renew"] as const;

// Demo subset: only these signs are required for the stage machine demo flow
export const REQUIRED_SIGNS = ["Hai", "Encik", "Tolong", "Borang"] as const;

export const CONFIDENCE_THRESHOLD = 0.5;

export const SEQUENCE_LENGTH = 30;

export const SLIDE_STEP = 5;

// Landmark dimensions matching Python extract_keypoints:
// pose(33*4) + face(468*3) + leftHand(21*3) + rightHand(21*3) = 1662
export const LANDMARK_DIM = 1662;
