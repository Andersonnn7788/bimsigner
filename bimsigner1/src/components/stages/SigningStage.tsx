"use client";

import { Check, Hand } from "lucide-react";
import DetectionOverlay from "@/components/DetectionOverlay";
import ConfidenceDisplay from "@/components/ConfidenceDisplay";
import { TARGET_SEQUENCE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Landmark, DetectionResult } from "@/types";

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isWebcamReady: boolean;
  webcamError: string | null;
  isMediaPipeLoading: boolean;
  isMediaPipeReady: boolean;
  poseLandmarks?: Landmark[];
  faceLandmarks?: Landmark[];
  leftHandLandmarks?: Landmark[];
  rightHandLandmarks?: Landmark[];
  detection: DetectionResult | null;
  detectedSequence: string[];
  onStart: () => void;
}

export default function SigningStage({
  videoRef,
  isWebcamReady,
  webcamError,
  isMediaPipeLoading,
  isMediaPipeReady,
  poseLandmarks,
  faceLandmarks,
  leftHandLandmarks,
  rightHandLandmarks,
  detection,
  detectedSequence,
  onStart,
}: Props) {
  return (
    <div className="flex flex-1 flex-col items-center gap-4 overflow-hidden">
      {/* Webcam */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-black shadow-lg aspect-video">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          style={{ transform: "scaleX(-1)" }}
          playsInline
          muted
        />
        {isWebcamReady && (
          <div className="absolute inset-0" style={{ transform: "scaleX(-1)" }}>
            <DetectionOverlay
              videoRef={videoRef}
              poseLandmarks={poseLandmarks}
              faceLandmarks={faceLandmarks}
              leftHandLandmarks={leftHandLandmarks}
              rightHandLandmarks={rightHandLandmarks}
            />
          </div>
        )}

        {/* Overlays */}
        {!isWebcamReady && !webcamError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            {isMediaPipeLoading ? (
              <div className="flex flex-col items-center gap-3 text-white">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span className="text-sm">Loading MediaPipe...</span>
              </div>
            ) : (
              <button
                onClick={onStart}
                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg transition hover:bg-primary/90"
              >
                <Hand className="h-4 w-4" />
                Start Camera
              </button>
            )}
          </div>
        )}
        {webcamError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="text-sm text-destructive">{webcamError}</span>
          </div>
        )}

        {/* Confidence overlay (bottom-right) */}
        {isMediaPipeReady && (
          <div className="absolute right-2 bottom-2 w-48">
            <ConfidenceDisplay detection={detection} />
          </div>
        )}
      </div>

      {/* Sign progress tracker */}
      <div className="flex items-center gap-3">
        {TARGET_SEQUENCE.map((sign, i) => {
          const isDetected = i < detectedSequence.length;
          const isCurrent = i === detectedSequence.length;

          return (
            <div
              key={sign}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-300",
                isDetected &&
                  "border-emerald-200 bg-emerald-50 text-emerald-700",
                isCurrent &&
                  "border-primary/30 bg-primary/5 text-primary ring-2 ring-primary/20",
                !isDetected &&
                  !isCurrent &&
                  "border-border bg-secondary text-muted-foreground"
              )}
            >
              {isDetected ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                  {i + 1}
                </span>
              )}
              {sign}
            </div>
          );
        })}
      </div>
    </div>
  );
}
