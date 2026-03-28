"use client";

import { useState, useEffect } from "react";
import { UserRound, Volume2, Sparkles } from "lucide-react";
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
  detectedSequence: string[];
}

export default function AvatarPanel({
  signs,
  isLoading,
  error,
  onDone,
  stage,
  sentence,
  messages,
  detectedSequence,
}: Props) {
  const isTranslating = stage === "TRANSLATING";
  const isSpeaking = stage === "SPEAKING";
  const isAvatarStage = stage === "AVATAR";

  // Typewriter effect: builds displayedSentence char-by-char when SPEAKING begins
  const [displayedSentence, setDisplayedSentence] = useState("");
  useEffect(() => {
    if (!isSpeaking || !sentence) {
      setDisplayedSentence("");
      return;
    }
    setDisplayedSentence("");
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplayedSentence(sentence.slice(0, i));
      if (i >= sentence.length) clearInterval(iv);
    }, 35);
    return () => clearInterval(iv);
  }, [sentence, isSpeaking]);

  const isTypewriterDone = displayedSentence.length >= sentence.length;

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

          {/* Avatar player — single instance across AVATAR→SIGNING transition */}
          {signs.length > 0 && !isSpeaking && !isTranslating && !(isAvatarStage && isLoading) && (
            <div className="w-full h-full p-3 flex flex-col gap-2">
              <AvatarPlayer signs={signs} onDone={isAvatarStage ? onDone : undefined} />
              {!isAvatarStage && sentence && (
                <p className="text-xs text-center text-muted-foreground italic max-w-[85%] mx-auto">
                  &ldquo;{sentence}&rdquo;
                </p>
              )}
            </div>
          )}

          {/* SPEAKING stage: audio playing indicator */}
          {isSpeaking && (
            <div className="flex flex-col items-center gap-4 px-4">
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
                  &ldquo;
                  {displayedSentence}
                  {!isTypewriterDone && (
                    <span className="inline-block w-px h-3 bg-emerald-500 ml-px align-middle animate-pulse" />
                  )}
                  &rdquo;
                </p>
              )}
            </div>
          )}

          {/* TRANSLATING stage: Gemini thinking animation */}
          {isTranslating && (
            <div className="flex flex-col items-center justify-center gap-5 px-5 py-6 w-full">

              {/* Detected gloss pills — staggered primary pulse */}
              <div className="flex flex-col items-center gap-2 w-full">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-primary/70">
                  Detected Signs
                </span>
                <div className="flex flex-wrap justify-center gap-2">
                  {detectedSequence.map((gloss, i) => (
                    <span
                      key={`${gloss}-${i}`}
                      className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold border-primary/30 bg-primary/10 text-primary animate-pulse"
                      style={{ animationDelay: `${i * 150}ms`, animationDuration: "1.8s" }}
                    >
                      {gloss}
                    </span>
                  ))}
                </div>
              </div>

              {/* Arrow divider */}
              <div className="flex items-center gap-2 text-primary/40">
                <div className="h-px w-8 bg-primary/30" />
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                <div className="h-px w-8 bg-primary/30" />
              </div>

              {/* Gemini thinking indicator with bouncing dots */}
              <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-primary">Gemini is translating...</span>
                <div className="flex items-end gap-0.5 pb-0.5">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="inline-block h-1 w-1 rounded-full bg-primary animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>

              {/* Skeleton shimmer — where sentence will appear */}
              <div className="w-full max-w-[85%] rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                <div className="relative h-4 w-full overflow-hidden rounded-full bg-primary/10">
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-[shimmer_1.5s_ease-in-out_infinite]" />
                </div>
                <div className="mt-2 relative h-3 w-3/5 overflow-hidden rounded-full bg-primary/5">
                  <div
                    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_1.5s_ease-in-out_infinite]"
                    style={{ animationDelay: "0.3s" }}
                  />
                </div>
              </div>

            </div>
          )}

          {/* Idle state — no signs yet */}
          {!isAvatarStage && !isSpeaking && !isTranslating && signs.length === 0 && (
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
