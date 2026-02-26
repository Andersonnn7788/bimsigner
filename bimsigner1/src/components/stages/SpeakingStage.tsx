"use client";

import { Volume2 } from "lucide-react";

interface Props {
  sentence: string;
  isPlaying: boolean;
}

export default function SpeakingStage({ sentence, isPlaying }: Props) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="panel-title">Speaking</p>

      {/* Compact speaker icon row */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center">
          {isPlaying && (
            <div className="absolute h-12 w-12 animate-ping rounded-full bg-primary/10" />
          )}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Volume2 className="h-5 w-5 text-primary animate-pulse" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {isPlaying ? "Speaking to staff..." : "Preparing audio..."}
        </p>
      </div>

      {/* Sentence card */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
        <p className="text-base font-medium text-foreground">{sentence}</p>
      </div>
    </div>
  );
}
