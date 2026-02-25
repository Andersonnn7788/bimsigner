"use client";

import { ACTION_LABELS, CONFIDENCE_THRESHOLD } from "@/lib/constants";
import type { DetectionResult } from "@/types";

interface Props {
  detection: DetectionResult | null;
}

export default function ConfidenceDisplay({ detection }: Props) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg bg-black/60 p-3 backdrop-blur-sm">
      <div className="mb-1 text-xs font-medium uppercase tracking-wider text-white/70">
        Detection
      </div>
      {ACTION_LABELS.map((label) => {
        const isActive = detection?.sign === label;
        const confidence =
          isActive && detection ? detection.confidence : 0;
        const aboveThreshold = confidence >= CONFIDENCE_THRESHOLD;

        return (
          <div key={label} className="flex items-center gap-2">
            <span className="w-14 text-xs font-medium text-white">
              {label}
            </span>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{
                  width: `${confidence * 100}%`,
                  backgroundColor:
                    aboveThreshold ? "#22c55e" : isActive ? "#eab308" : "#6b7280",
                }}
              />
            </div>
            <span className="w-10 text-right font-mono text-xs text-white/80">
              {isActive ? `${(confidence * 100).toFixed(0)}%` : "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
