"use client";

import { useRef, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";

interface Props {
  signs: string[];
  onDone?: () => void;
}

export default function AvatarPlayer({ signs, onDone }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const lastSignsRef = useRef<string | null>(null);

  // Derive a key from signs to detect new sign sets
  const signsKey = signs.length > 0 ? signs.join(",") : null;

  // Start playback via ref callback on the video element
  const videoCallbackRef = useCallback(
    (video: HTMLVideoElement | null) => {
      // Also set the persistent ref
      (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current =
        video;

      if (!video || !signsKey || signsKey === lastSignsRef.current) return;

      lastSignsRef.current = signsKey;
      setIsPlaying(true);
      setHasPlayed(true);

      video.src = `/avatars/avatar.mp4`;
      video.load();
      video.play().catch(() => {
        setIsPlaying(false);
        lastSignsRef.current = null;
        onDone?.();
      });
    },
    [signsKey, onDone]
  );

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    onDone?.();
  }, [onDone]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-secondary shadow-sm">
        <video
          ref={videoCallbackRef}
          className="h-full w-full object-contain"
          playsInline
          onEnded={handleEnded}
          onError={handleEnded}
        />
        {!isPlaying && !hasPlayed && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            Avatar signs will play here
          </div>
        )}
      </div>
      {signs.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          {isPlaying ? "Signing:" : "Signed:"}{" "}
          {signs.map((sign, i) => (
            <Badge
              key={`${sign}-${i}`}
              variant="outline"
              className="text-primary border-primary/30"
            >
              {sign}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
