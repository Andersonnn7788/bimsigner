"use client";

import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Stage } from "@/lib/stageMachine";

interface Props {
  transcript: string;
  isListening: boolean;
  silenceProgress: number;
  stage: Stage;
}

export default function OfficerControls({
  transcript,
  isListening,
  silenceProgress,
  stage,
}: Props) {
  const canSpeak = stage === "LISTENING";

  return (
    <div className="flex flex-col h-full bg-card overflow-hidden">
      {/* Panel header */}
      <div className="flex h-10 shrink-0 items-center border-b border-border px-3">
        <span className="panel-title">Officer Controls</span>
      </div>

      <div className="flex flex-1 min-h-0 flex-col overflow-y-auto">
        {/* Officer profile card */}
        <div className="p-3">
          <div className="flex items-start gap-3 rounded-xl border border-border bg-background/60 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
              <UserRound className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground leading-tight">
                Government Officer
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Counter Service Staff
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  BIM Signer
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 border-primary/30 text-primary"
                >
                  Interpreter
                </Badge>
              </div>
            </div>
          </div>

          <Button variant="ghost" size="sm" className="mt-2 w-full text-xs">
            View Full Profile
          </Button>
        </div>

        <Separator />

        {/* Speak response section */}
        <div className="flex flex-col gap-3 p-3">
          <p className="panel-title">Speak Response (Malay/English)</p>

          {/* Auto-listening indicator */}
          {canSpeak && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50/60 px-3 py-2 dark:border-red-900/40 dark:bg-red-950/20">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
              </span>
              <span className="text-xs text-red-600 dark:text-red-400">
                {isListening ? "Listening automatically..." : "Mic starting..."}
              </span>
            </div>
          )}

          {/* Live transcript area */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                Live Transcript
              </span>
              {isListening && (
                <span className="flex items-center gap-1 text-[10px] text-red-500 font-medium">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                  Recording
                </span>
              )}
            </div>
            <ScrollArea className="h-28 rounded-lg border border-border bg-background/50">
              <div className="p-2.5">
                {transcript ? (
                  <p className="text-xs text-foreground leading-relaxed">
                    {transcript}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    {canSpeak
                      ? "Say: Apa yang saya boleh bantu?"
                      : "Waiting for your turn..."}
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Silence countdown bar */}
          {silenceProgress > 0 && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Auto-sending</span>
                <span>{(2.5 * (1 - silenceProgress / 100)).toFixed(1)}s</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${silenceProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Stage status indicator */}
        <div className="p-3">
          <p className="panel-title mb-2">System Status</p>
          <div className="grid grid-cols-2 gap-1.5">
            {(
              [
                "SIGNING",
                "TRANSLATING",
                "SPEAKING",
                "LISTENING",
                "AVATAR",
              ] as const
            ).map((s) => (
              <div
                key={s}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-medium transition-all",
                  stage === s
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground/50"
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    stage === s ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                />
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
