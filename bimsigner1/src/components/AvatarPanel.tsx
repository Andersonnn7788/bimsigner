"use client";

import { UserRound, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AvatarPlayer from "@/components/AvatarPlayer";
import ConversationStrip from "@/components/ConversationStrip";
import { cn } from "@/lib/utils";
import type { Stage } from "@/lib/stageMachine";
import type { Message } from "@/types";

interface Props {
  signs: string[];
  isLoading: boolean;
  error: string | null;
  onDone: () => void;
  stage: Stage;
  sentence: string;
  messages: Message[];
}

export default function AvatarPanel({
  signs,
  isLoading,
  error,
  onDone,
  stage,
  sentence,
  messages,
}: Props) {
  const isSpeaking = stage === "SPEAKING";
  const isAvatarStage = stage === "AVATAR";

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Panel header */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-3">
        <div className="flex items-center gap-2">
          <UserRound className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="panel-title">BIM Avatar</span>
        </div>
        <span className="text-[10px] text-muted-foreground">
          AI Sign Language
        </span>
      </div>

      {/* Avatar viewport */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Main avatar area */}
        <div className="relative flex-1 min-h-0 bg-muted/20 flex items-center justify-center overflow-hidden">
          {/* AVATAR stage: loading */}
          {isAvatarStage && isLoading && (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
              <p className="text-sm">Converting to sign language...</p>
            </div>
          )}

          {/* AVATAR stage: playing */}
          {isAvatarStage && !isLoading && signs.length > 0 && (
            <div className="w-full h-full p-3 flex flex-col gap-2">
              <AvatarPlayer signs={signs} onDone={onDone} />
            </div>
          )}

          {/* SPEAKING stage: audio playing indicator */}
          {isSpeaking && (
            <div className="flex flex-col items-center gap-4">
              <div className="relative flex items-center justify-center">
                <div className="absolute h-16 w-16 animate-ping rounded-full bg-emerald-500/20" />
                <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30">
                  <Volume2 className="h-6 w-6 text-emerald-500" />
                </div>
              </div>
              <p className="text-sm font-medium text-emerald-600">
                Speaking to staff...
              </p>
              {sentence && (
                <p className="text-xs text-center text-muted-foreground max-w-[80%] italic">
                  &ldquo;{sentence}&rdquo;
                </p>
              )}
            </div>
          )}

          {/* Idle state — all other stages */}
          {!isAvatarStage && !isSpeaking && (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <div
                className={cn(
                  "flex h-16 w-16 items-center justify-center rounded-full border-2",
                  "border-border bg-muted/40"
                )}
              >
                <UserRound className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="text-sm">Waiting for response...</p>
            </div>
          )}

          {/* Error */}
          {error && isAvatarStage && (
            <div className="absolute bottom-3 left-3 right-3">
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            </div>
          )}

          {/* Sign badges overlay when avatar playing */}
          {isAvatarStage && !isLoading && signs.length > 0 && (
            <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1">
              {signs.map((sign, i) => (
                <Badge
                  key={`${sign}-${i}`}
                  variant="outline"
                  className="text-primary border-primary/30 text-[10px]"
                >
                  {sign}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Conversation history at bottom */}
        <ConversationStrip messages={messages} />
      </div>
    </div>
  );
}
