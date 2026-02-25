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
