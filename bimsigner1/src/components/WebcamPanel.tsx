"use client";

import type { DetectionResult, Landmark } from "@/types";
import DetectionOverlay from "./DetectionOverlay";
import ConfidenceDisplay from "./ConfidenceDisplay";
import GlossBar from "./GlossBar";

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isWebcamReady: boolean;
  webcamError: string | null;
  isMediaPipeLoading: boolean;
  isMediaPipeReady: boolean;
  poseLandmarks?: Landmark[];
  leftHandLandmarks?: Landmark[];
  rightHandLandmarks?: Landmark[];
  detection: DetectionResult | null;
  glosses: string[];
  sentence: string;
  onSpeak: () => void;
  onClear: () => void;
  isSpeaking: boolean;
  onStart: () => void;
}

export default function WebcamPanel({
  videoRef,
  isWebcamReady,
  webcamError,
  isMediaPipeLoading,
  isMediaPipeReady,
  poseLandmarks,
  leftHandLandmarks,
  rightHandLandmarks,
  detection,
  glosses,
  sentence,
  onSpeak,
  onClear,
  isSpeaking,
  onStart,
}: Props) {
  return (
    <div className="flex h-full flex-col gap-3">
      {/* Video container */}
      <div className="relative flex-1 overflow-hidden rounded-xl bg-gray-900">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          muted
          style={{ transform: "scaleX(-1)" }}
        />

        {isWebcamReady && (
          <div style={{ transform: "scaleX(-1)" }}>
            <DetectionOverlay
              videoRef={videoRef}
              poseLandmarks={poseLandmarks}
              leftHandLandmarks={leftHandLandmarks}
              rightHandLandmarks={rightHandLandmarks}
            />
          </div>
        )}

        {/* Status overlays */}
        {!isWebcamReady && !webcamError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-900">
            <div className="text-6xl">📷</div>
            <button
              onClick={onStart}
              className="rounded-lg bg-emerald-500 px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-emerald-600"
            >
              Start Camera
            </button>
          </div>
        )}

        {webcamError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-900 p-4 text-center">
            <div className="text-4xl">⚠</div>
            <p className="text-sm text-red-400">{webcamError}</p>
          </div>
        )}

        {isMediaPipeLoading && (
          <div className="absolute left-3 top-3 flex items-center gap-2 rounded-md bg-yellow-500/80 px-3 py-1.5 text-sm font-medium text-white">
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Loading MediaPipe...
          </div>
        )}

        {isWebcamReady && isMediaPipeReady && (
          <div className="absolute right-3 top-3">
            <ConfidenceDisplay detection={detection} />
          </div>
        )}
      </div>

      {/* Gloss bar */}
      <GlossBar
        glosses={glosses}
        sentence={sentence}
        onSpeak={onSpeak}
        onClear={onClear}
        isSpeaking={isSpeaking}
      />
    </div>
  );
}
