"use client";

import { Button } from "@/components/ui/button";

interface Props {
  transcript: string;
  isListening: boolean;
  onToggleMic: () => void;
  onSend: () => void;
}

export default function StaffInput({
  transcript,
  isListening,
  onToggleMic,
  onSend,
}: Props) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3 shadow-sm">
      <div className="panel-title">Staff Input (Speech)</div>

      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant={isListening ? "destructive" : "outline"}
          onClick={onToggleMic}
          title={isListening ? "Stop listening" : "Start listening"}
          className={isListening ? "animate-pulse" : ""}
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        </Button>

        <div className="min-h-[2.5rem] flex-1 rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground">
          {transcript || (
            <span className="text-muted-foreground">
              {isListening ? "Listening..." : "Tap mic to speak"}
            </span>
          )}
        </div>

        <Button size="sm" onClick={onSend} disabled={!transcript.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
}
