"use client";

import { Camera, Hand, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DetectionOverlay from "@/components/DetectionOverlay";
import ConfidenceDisplay from "@/components/ConfidenceDisplay";
import { REQUIRED_SIGNS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Stage } from "@/lib/stageMachine";
import type { Landmark, DetectionResult } from "@/types";

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isWebcamReady: boolean;
  isMediaPipeReady: boolean;
  isMediaPipeLoading: boolean;
  webcamError: string | null;
  onStart: () => void;
  landmarks: {
    pose?: Landmark[];
    face?: Landmark[];
    leftHand?: Landmark[];
    rightHand?: Landmark[];
  };
  lastDetection: DetectionResult | null;
  detectedSequence: string[];
  currentStage: Stage;
}

const STAGE_LABELS: Record<Stage, string> = {
  SIGNING: "Signing",
  TRANSLATING: "Translating",
  SPEAKING: "Speaking",
  LISTENING: "Listening",
  AVATAR: "Avatar",
};

const STAGE_COLORS: Record<Stage, string> = {
  SIGNING: "bg-primary/20 text-primary border-primary/30",
  TRANSLATING: "bg-amber-500/20 text-amber-600 border-amber-500/30",
  SPEAKING: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30",
  LISTENING: "bg-red-500/20 text-red-600 border-red-500/30",
  AVATAR: "bg-violet-500/20 text-violet-600 border-violet-500/30",
};

export default function CameraPanel({
  videoRef,
  isWebcamReady,
  isMediaPipeReady,
  isMediaPipeLoading,
  webcamError,
  onStart,
  landmarks,
  lastDetection,
  detectedSequence,
  currentStage,
}: Props) {
  return (
    <div className="flex flex-col h-full bg-card">
      {/* Panel header */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-3">
        <div className="flex items-center gap-2">
          <Camera className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="panel-title">Your Camera</span>
        </div>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
            STAGE_COLORS[currentStage]
          )}
        >
          {STAGE_LABELS[currentStage]}
        </span>
      </div>

      {/* Camera viewport */}
      <div className="relative flex-1 min-h-0 bg-black overflow-hidden">
        {/* Video element — always mounted */}
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ transform: "scaleX(-1)" }}
          playsInline
          muted
        />

        {/* Landmark overlay */}
        {isWebcamReady && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ transform: "scaleX(-1)" }}
          >
            <DetectionOverlay
              videoRef={videoRef}
              poseLandmarks={landmarks.pose}
              faceLandmarks={landmarks.face}
              leftHandLandmarks={landmarks.leftHand}
              rightHandLandmarks={landmarks.rightHand}
            />
          </div>
        )}

        {/* Pre-start overlay */}
        {!isWebcamReady && !webcamError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80">
            {isMediaPipeLoading ? (
              <>
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                <span className="text-sm font-medium text-white">
                  Loading MediaPipe...
                </span>
              </>
            ) : (
              <>
                <Camera className="h-10 w-10 text-white/30" />
                <p className="text-sm text-white/60">
                  Sign using Bahasa Isyarat Malaysia (BIM)
                </p>
                <Button onClick={onStart} size="sm" className="mt-1 gap-2">
                  <Hand className="h-4 w-4" />
                  Start Camera
                </Button>
              </>
            )}
          </div>
        )}

        {/* Error overlay */}
        {webcamError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <span className="text-sm text-destructive">{webcamError}</span>
          </div>
        )}

        {/* No-hands hint — center */}
        {isWebcamReady && lastDetection?.noHands && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center z-10 pointer-events-none">
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-black/70 px-3 py-1.5 backdrop-blur-sm">
              <Hand className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-medium text-amber-300">
                Show your hands to sign
              </span>
            </div>
          </div>
        )}

        {/* Confidence HUD — bottom-right */}
        {isMediaPipeReady && (
          <div className="absolute bottom-3 right-3 w-44 z-10">
            <ConfidenceDisplay detection={lastDetection} />
          </div>
        )}

        {/* Sign sequence chips — bottom-left (only show detected signs) */}
        {isWebcamReady && (
          <div className="absolute bottom-3 left-3 z-10 flex gap-1.5">
            {detectedSequence.length === 0 && (
              <span className="text-[10px] text-white/30 italic">No signs detected</span>
            )}
            {REQUIRED_SIGNS.filter((sign) => detectedSequence.includes(sign)).map((sign) => (
              <div
                key={sign}
                className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium backdrop-blur-sm transition-all duration-300 border-emerald-400/60 bg-emerald-900/70 text-emerald-300"
              >
                <Check className="h-3 w-3 text-emerald-400" />
                {sign}
              </div>
            ))}
          </div>
        )}

        {/* MediaPipe ready indicator — top-right */}
        {isMediaPipeReady && (
          <div className="absolute top-2 right-2 z-10">
            <Badge
              variant="secondary"
              className="gap-1 text-[10px] bg-black/60 border-emerald-500/30 text-emerald-400 backdrop-blur-sm"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Ready
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
