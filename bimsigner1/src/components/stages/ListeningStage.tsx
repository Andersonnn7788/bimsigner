"use client";

import { Mic, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  transcript: string;
  isListening: boolean;
  onSend: () => void;
}

export default function ListeningStage({
  transcript,
  isListening,
  onSend,
}: Props) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      {/* Large mic icon */}
      <div className="relative flex items-center justify-center">
        {isListening && (
          <div className="absolute h-24 w-24 animate-ping rounded-full bg-destructive/10" />
        )}
        <div
          className={cn(
            "flex h-20 w-20 items-center justify-center rounded-full transition-colors",
            isListening ? "bg-destructive/10" : "bg-muted"
          )}
        >
          <Mic
            className={cn(
              "h-10 w-10",
              isListening
                ? "text-destructive animate-pulse"
                : "text-muted-foreground"
            )}
          />
        </div>
      </div>

      {/* Status */}
      <p className="text-sm text-muted-foreground">
        {isListening
          ? "Listening... Speak your reply"
          : "Microphone starting..."}
      </p>

      {/* Live transcript */}
      <div className="min-h-[60px] w-full max-w-md rounded-xl border border-border bg-card px-4 py-3 text-center">
        {transcript ? (
          <p className="text-base text-foreground">{transcript}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Your words will appear here...
          </p>
        )}
      </div>

      {/* Send button */}
      <Button
        onClick={onSend}
        disabled={!transcript.trim()}
        size="lg"
        className="gap-2"
      >
        <Send className="h-4 w-4" />
        Send
      </Button>
    </div>
  );
}
