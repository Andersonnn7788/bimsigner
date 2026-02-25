"use client";

import { Volume2 } from "lucide-react";

interface Props {
  sentence: string;
  isPlaying: boolean;
}

export default function SpeakingStage({ sentence, isPlaying }: Props) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      {/* Pulsating speaker icon */}
      <div className="relative flex items-center justify-center">
        {isPlaying && (
          <div className="absolute h-24 w-24 animate-ping rounded-full bg-primary/10" />
        )}
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Volume2 className="h-10 w-10 text-primary animate-pulse" />
        </div>
      </div>

      {/* Sentence text */}
      <div className="max-w-md rounded-xl border border-primary/20 bg-primary/5 px-6 py-4 text-center">
        <p className="text-lg font-medium text-foreground">{sentence}</p>
      </div>

      <p className="text-sm text-muted-foreground">
        {isPlaying ? "Speaking to staff..." : "Preparing audio..."}
      </p>
    </div>
  );
}
