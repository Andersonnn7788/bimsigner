import type { Message } from "@/types";
import { TARGET_SEQUENCE } from "./constants";

export type Stage =
  | "SIGNING"
  | "TRANSLATING"
  | "SPEAKING"
  | "LISTENING"
  | "AVATAR";

export interface StageState {
  stage: Stage;
  detectedSequence: string[];
  sentence: string;
  staffTranscript: string;
  avatarSigns: string[];
  messages: Message[];
  isLoading: boolean;
  isPlaying: boolean;
  error: string | null;
}

export type StageAction =
  | { type: "SIGN_DETECTED"; sign: string }
  | { type: "TRANSLATION_SUCCESS"; sentence: string }
  | { type: "TRANSLATION_ERROR"; error: string }
  | { type: "TTS_COMPLETE" }
  | { type: "TTS_ERROR"; error: string }
  | { type: "TRANSCRIPT_UPDATE"; text: string }
  | { type: "STAFF_SEND" }
  | { type: "AVATAR_START"; signs: string[] }
  | { type: "AVATAR_COMPLETE" }
  | { type: "AVATAR_ERROR"; error: string }
  | { type: "RESET" };

export const initialState: StageState = {
  stage: "SIGNING",
  detectedSequence: [],
  sentence: "",
  staffTranscript: "",
  avatarSigns: [],
  messages: [],
  isLoading: false,
  isPlaying: false,
  error: null,
};

export function stageReducer(
  state: StageState,
  action: StageAction
): StageState {
  switch (action.type) {
    case "SIGN_DETECTED": {
      if (state.stage !== "SIGNING") return state;

      const nextIndex = state.detectedSequence.length;
      if (nextIndex >= TARGET_SEQUENCE.length) return state;

      // Only accept the sign if it matches the next expected sign
      if (action.sign !== TARGET_SEQUENCE[nextIndex]) return state;

      const newSequence = [...state.detectedSequence, action.sign];

      // If sequence is complete, auto-transition to TRANSLATING
      if (newSequence.length === TARGET_SEQUENCE.length) {
        return {
          ...state,
          detectedSequence: newSequence,
          stage: "TRANSLATING",
          isLoading: true,
          error: null,
        };
      }

      return {
        ...state,
        detectedSequence: newSequence,
      };
    }

    case "TRANSLATION_SUCCESS":
      if (state.stage !== "TRANSLATING") return state;
      return {
        ...state,
        sentence: action.sentence,
        stage: "SPEAKING",
        isLoading: false,
        isPlaying: true,
        messages: [
          ...state.messages,
          {
            id: Date.now().toString(),
            sender: "deaf",
            text: action.sentence,
            timestamp: Date.now(),
          },
        ],
      };

    case "TRANSLATION_ERROR":
      if (state.stage !== "TRANSLATING") return state;
      return {
        ...state,
        isLoading: false,
        error: action.error,
        // Fallback: use glosses as sentence
        sentence: state.detectedSequence.join(" "),
        stage: "SPEAKING",
        isPlaying: true,
        messages: [
          ...state.messages,
          {
            id: Date.now().toString(),
            sender: "deaf",
            text: state.detectedSequence.join(" "),
            timestamp: Date.now(),
          },
        ],
      };

    case "TTS_COMPLETE":
      if (state.stage !== "SPEAKING") return state;
      return {
        ...state,
        isPlaying: false,
        stage: "LISTENING",
      };

    case "TTS_ERROR":
      if (state.stage !== "SPEAKING") return state;
      return {
        ...state,
        isPlaying: false,
        error: action.error,
        stage: "LISTENING",
      };

    case "TRANSCRIPT_UPDATE":
      if (state.stage !== "LISTENING") return state;
      return {
        ...state,
        staffTranscript: action.text,
      };

    case "STAFF_SEND": {
      if (state.stage !== "LISTENING") return state;
      const text = state.staffTranscript.trim();
      if (!text) return state;
      return {
        ...state,
        stage: "AVATAR",
        isLoading: true,
        messages: [
          ...state.messages,
          {
            id: Date.now().toString(),
            sender: "staff",
            text,
            timestamp: Date.now(),
          },
        ],
      };
    }

    case "AVATAR_START":
      if (state.stage !== "AVATAR") return state;
      return {
        ...state,
        avatarSigns: action.signs,
        isLoading: false,
        isPlaying: true,
      };

    case "AVATAR_COMPLETE":
      if (state.stage !== "AVATAR") return state;
      return {
        ...state,
        isPlaying: false,
        // Reset for next cycle but keep messages
        stage: "SIGNING",
        detectedSequence: [],
        sentence: "",
        staffTranscript: "",
        avatarSigns: [],
        error: null,
      };

    case "AVATAR_ERROR":
      if (state.stage !== "AVATAR") return state;
      return {
        ...state,
        isLoading: false,
        isPlaying: false,
        error: action.error,
        // Reset to signing even on error
        stage: "SIGNING",
        detectedSequence: [],
        sentence: "",
        staffTranscript: "",
        avatarSigns: [],
      };

    case "RESET":
      return {
        ...initialState,
        messages: state.messages,
      };

    default:
      return state;
  }
}
