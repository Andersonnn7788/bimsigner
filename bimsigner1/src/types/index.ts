export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface PredictResponse {
  sign: string;
  confidence: number;
  action_index: number;
  confidences: number[];
}

export interface SentenceResponse {
  sentence: string;
}

export interface BIMResponse {
  bim_text: string;
  signs: string[];
}

export interface Message {
  id: string;
  sender: "deaf" | "staff";
  text: string;
  timestamp: number;
}

export interface DetectionResult {
  sign: string;
  confidence: number;
  confidences: number[];
}

// --- Check-in / Visitor Profile ---

export type VisitOutcome = "COMPLETED" | "IN_PROGRESS" | "INCOMPLETE";

export interface UserProfile {
  id: string;
  name: string;
  ic_number: string;
  deaf: true;
  photo_placeholder_initials: string;
  visit_count: number;
  registered_since: string; // "YYYY-MM-DD"
}

export interface VisitRecord {
  id: string;
  date: string;
  department: string;
  counter: string;
  purpose: string;
  outcome: VisitOutcome;
  notes?: string;
}

export type ConfidenceLabel = "Very Likely" | "Likely" | "Possible";

export interface IntentPrediction {
  primary_intent: string;
  alternatives: [string, string, string];
  reasoning: string;
  confidence_label: ConfidenceLabel;
}

// --- Deaf-Friendly Locations Directory ---

export type PlaceCategory = "BALAI_POLIS" | "JPJ" | "HOSPITAL";
export type DeafFeature =
  | "BIM_SIGNER_KIOSK"
  | "SIGN_INTERPRETER"
  | "VISUAL_ALERTS"
  | "INDUCTION_LOOP"
  | "VISUAL_QUEUE";
export type LocationStatus = "ACTIVE" | "COMING_SOON" | "MAINTENANCE";

export interface GovernmentLocation {
  id: string;
  name: string;
  category: PlaceCategory;
  address: string;
  city: string;
  state: string;
  features: DeafFeature[];
  status: LocationStatus;
  coordinates: { lat: number; lng: number }; // reserved for Google Maps
  hours?: string;
}
