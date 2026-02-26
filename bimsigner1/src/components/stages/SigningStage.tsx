"use client";

import { Check } from "lucide-react";
import { REQUIRED_SIGNS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Props {
  detectedSequence: string[];
}

export default function SigningStage({ detectedSequence }: Props) {
  const remaining = REQUIRED_SIGNS.filter((s) => !detectedSequence.includes(s));
  const isDone = remaining.length === 0;

  return (
    <div className="flex flex-col gap-5 p-4">
      <p className="panel-title">Sign Detection</p>

      {/* Remaining signs card */}
      <div className="rounded-xl border border-border bg-secondary/50 px-4 py-4">
        <p className="text-xs text-muted-foreground mb-1">Signs remaining:</p>
        {isDone ? (
          <p className="text-base font-semibold text-emerald-600">All signs detected!</p>
        ) : (
          <p className="text-2xl font-bold text-foreground">{remaining.join(", ")}</p>
        )}
      </div>

      {/* Progress bar */}
      <div className="flex flex-col gap-1.5">
        <p className="text-xs text-muted-foreground">
          Progress: {detectedSequence.length} / {REQUIRED_SIGNS.length} signs
        </p>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{
              width: `${(detectedSequence.length / REQUIRED_SIGNS.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Detected signs */}
      {detectedSequence.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-muted-foreground">Detected so far:</p>
          <div className="flex flex-wrap gap-2">
            {REQUIRED_SIGNS.map((sign) => {
              const isDetected = detectedSequence.includes(sign);
              return (
                <div
                  key={sign}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-300",
                    isDetected
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-border bg-secondary text-muted-foreground"
                  )}
                >
                  {isDetected ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-muted-foreground/30" />
                  )}
                  {sign}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="rounded-xl border border-border bg-card px-4 py-3">
        <p className="panel-title mb-2">Tips</p>
        <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
          <li>• Sign in any order you prefer</li>
          <li>• Face the camera directly</li>
          <li>• Keep both hands visible in frame</li>
          <li>• Hold each sign clearly for 1–2 seconds</li>
          <li>• Ensure good lighting</li>
        </ul>
      </div>
    </div>
  );
}
