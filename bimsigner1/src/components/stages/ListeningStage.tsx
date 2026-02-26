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
    <div className="flex flex-col gap-4 p-4">
      <p className="panel-title">Staff Reply</p>

      {/* Compact mic row */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center">
          {isListening && (
            <div className="absolute h-12 w-12 animate-ping rounded-full bg-destructive/10" />
          )}
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
              isListening ? "bg-destructive/10" : "bg-muted"
            )}
          >
            <Mic
              className={cn(
                "h-5 w-5",
                isListening ? "text-destructive animate-pulse" : "text-muted-foreground"
              )}
            />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {isListening ? "Listening... Speak your reply" : "Microphone starting..."}
        </p>
      </div>

      {/* Live transcript */}
      <div className="min-h-[80px] rounded-xl border border-border bg-card px-4 py-3">
        {transcript ? (
          <p className="text-sm text-foreground">{transcript}</p>
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
        className="w-full gap-2"
      >
        <Send className="h-4 w-4" />
        Send Reply
      </Button>
    </div>
  );
}
