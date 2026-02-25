"use client";

import { ACTION_LABELS, CONFIDENCE_THRESHOLD } from "@/lib/constants";
import type { DetectionResult } from "@/types";

interface Props {
  detection: DetectionResult | null;
}

export default function ConfidenceDisplay({ detection }: Props) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-white/90 p-3 shadow-sm backdrop-blur-sm">
      <div className="panel-title" style={{ color: "hsl(215 16% 47%)" }}>
        Detection
      </div>
      {ACTION_LABELS.map((label) => {
        const isActive = detection?.sign === label;
        const confidence =
          isActive && detection ? detection.confidence : 0;
        const aboveThreshold = confidence >= CONFIDENCE_THRESHOLD;

        return (
          <div key={label} className="flex items-center gap-2">
            <span className="w-14 text-xs font-medium text-foreground">
              {label}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary border border-border">
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{
                  width: `${confidence * 100}%`,
                  backgroundColor: aboveThreshold
                    ? "hsl(221 83% 53%)"
                    : isActive
                      ? "#eab308"
                      : "#94a3b8",
                }}
              />
            </div>
            <span className="w-10 text-right font-mono text-xs text-muted-foreground">
              {isActive ? `${(confidence * 100).toFixed(0)}%` : "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
