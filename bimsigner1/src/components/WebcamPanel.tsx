"use client";

import type { DetectionResult, Landmark } from "@/types";
import DetectionOverlay from "./DetectionOverlay";
import ConfidenceDisplay from "./ConfidenceDisplay";
import GlossBar from "./GlossBar";
import { Button } from "@/components/ui/button";

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
    <div className="flex min-h-0 h-full flex-col gap-3">
      {/* Video container */}
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-secondary shadow-sm">
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
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-secondary">
            <svg
              className="h-12 w-12 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
              />
            </svg>
            <Button onClick={onStart} size="lg">
              Start Camera
            </Button>
          </div>
        )}

        {webcamError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-secondary p-4 text-center">
            <svg
              className="h-10 w-10 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
            <p className="text-sm text-destructive">{webcamError}</p>
          </div>
        )}

        {isMediaPipeLoading && (
          <div className="absolute left-3 top-3 flex items-center gap-2 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-1.5 text-sm font-medium text-yellow-700">
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
