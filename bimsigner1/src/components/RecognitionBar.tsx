"use client";

import { Check, Zap, Sparkles } from "lucide-react";
import { REQUIRED_SIGNS } from "@/lib/constants";
import type { Stage } from "@/lib/stageMachine";
import type { DetectionResult } from "@/types";

interface Props {
  detectedSequence: string[];
  sentence: string;
  isLoading: boolean;
  stage: Stage;
  lastDetection: DetectionResult | null;
}

export default function RecognitionBar({
  detectedSequence,
  sentence,
  isLoading,
  stage,
  lastDetection,
}: Props) {
  const isTranslating = stage === "TRANSLATING" && isLoading;
  const hasSentence = sentence.length > 0 && !isTranslating;

  return (
    <div className="flex h-14 shrink-0 border-t border-border bg-card">
      {/* Left: Detected signs */}
      <div className="flex flex-1 min-w-0 items-center gap-3 border-r border-border px-4">
        <span className="panel-title shrink-0">Detected Signs</span>

        {/* Sign chips — only show detected signs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {detectedSequence.length === 0 && (
            <span className="text-xs text-muted-foreground italic">Waiting for signs...</span>
          )}
          {REQUIRED_SIGNS.filter((sign) => detectedSequence.includes(sign)).map((sign) => (
            <div
              key={sign}
              className="flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition-all duration-300 border-emerald-400/60 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
            >
              <Check className="h-3 w-3 text-emerald-500" />
              {sign}
            </div>
          ))}
        </div>

        {/* Live detection pulse */}
        {lastDetection && stage === "SIGNING" && lastDetection.confidence > 0.5 && (
          <div className="flex items-center gap-1 ml-1 text-[10px] text-muted-foreground">
            <Zap className="h-3 w-3 text-amber-500" />
            <span className="text-amber-600 font-medium">
              {lastDetection.sign}
            </span>
          </div>
        )}
      </div>

      {/* Right: AI Interpretation */}
      <div className="flex flex-1 min-w-0 items-center gap-3 px-4">
        <span className="panel-title shrink-0">AI Interpretation</span>

        {isTranslating && (
          <div className="flex flex-col gap-1 w-full max-w-[60%]">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-primary animate-pulse shrink-0" />
              <span className="text-[10px] font-medium text-primary">Gemini translating...</span>
            </div>
            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-primary/10">
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-[shimmer_1.5s_ease-in-out_infinite]" />
            </div>
          </div>
        )}

        {hasSentence && (
          <p className="text-sm text-foreground truncate italic animate-in fade-in duration-500">
            &ldquo;{sentence}&rdquo;
          </p>
        )}

        {!isTranslating && !hasSentence && (
          <p className="text-xs text-muted-foreground italic">
            AI will interpret signs...
          </p>
        )}
      </div>
    </div>
  );
}
