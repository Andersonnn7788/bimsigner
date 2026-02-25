"use client";

import { CONFIDENCE_THRESHOLD } from "@/lib/constants";
import type { DetectionResult } from "@/types";

interface Props {
  detection: DetectionResult | null;
}

export default function ConfidenceDisplay({ detection }: Props) {
  const confidence = detection?.confidence ?? 0;
  const aboveThreshold = confidence >= CONFIDENCE_THRESHOLD;
  const barWidth = `${(confidence * 100).toFixed(1)}%`;
  const barColor = aboveThreshold
    ? "#00ff88"
    : confidence > 0.3
    ? "#facc15"
    : "rgba(148,163,184,0.3)";

  return (
    <div
      className="flex flex-col gap-2 rounded-lg border p-3"
      style={{
        background: "rgba(0,0,0,0.72)",
        borderColor: "rgba(0,255,136,0.25)",
        backdropFilter: "blur(6px)",
      }}
    >
      {/* Title */}
      <div className="flex items-center gap-1.5">
        {aboveThreshold && (
          <span
            className="animate-pulse"
            style={{ color: "#00ff88", fontSize: 9 }}
          >
            ◉
          </span>
        )}
        <span
          style={{
            color: "#00ff88",
            fontFamily: "monospace",
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Sign Detection
        </span>
      </div>

      {/* Confidence bar */}
      <div
        className="overflow-hidden rounded-full"
        style={{
          height: 6,
          background: "rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: barWidth,
            background: barColor,
            borderRadius: 9999,
            transition: "width 150ms ease, background 150ms ease",
          }}
        />
      </div>

      {/* Percentage + detected sign */}
      <div className="flex items-center justify-between">
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 10,
            color: aboveThreshold ? "#00ff88" : "rgba(0,255,136,0.45)",
          }}
        >
          {aboveThreshold && detection
            ? `DETECTED: ${detection.sign}`
            : "NO SIGN"}
        </span>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 11,
            color: aboveThreshold ? "#00ff88" : "rgba(0,255,136,0.45)",
            fontWeight: 600,
          }}
        >
          {confidence > 0.005 ? `${(confidence * 100).toFixed(0)}%` : "0%"}
        </span>
      </div>
    </div>
  );
}
