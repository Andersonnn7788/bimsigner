"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

interface Props {
  signs: string[];
  onDone?: () => void;
}

export default function AvatarPlayer({ signs, onDone }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [queueIndex, setQueueIndex] = useState(0);
  const [activeQueue, setActiveQueue] = useState<string[]>([]);

  // Detect new signs during render and reset queue
  if (signs.length > 0 && signs !== activeQueue) {
    setActiveQueue(signs);
    setQueueIndex(0);
  }

  // Detect completion during render and reset
  if (activeQueue.length > 0 && queueIndex >= activeQueue.length) {
    setActiveQueue([]);
    setQueueIndex(0);
    // Fire callback asynchronously to avoid side effects in render
    queueMicrotask(() => onDone?.());
  }

  const isPlaying = activeQueue.length > 0 && queueIndex < activeQueue.length;
  const currentSign = isPlaying ? activeQueue[queueIndex] : "";

  // Play video via effect (syncing with external DOM — this is what effects are for)
  useEffect(() => {
    if (!isPlaying) return;

    const video = videoRef.current;
    if (!video) return;

    const src = `/avatars/${currentSign.toLowerCase()}.mp4`;
    video.src = src;
    video.load();
    video.play().catch(() => {
      setQueueIndex((prev) => prev + 1);
    });
  }, [isPlaying, currentSign]);

  const handleNext = useCallback(() => {
    setQueueIndex((prev) => prev + 1);
  }, []);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-secondary shadow-sm">
        <video
          ref={videoRef}
          className="h-full w-full object-contain"
          playsInline
          onEnded={handleNext}
          onError={handleNext}
        />
        {!isPlaying && signs.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            Avatar signs will play here
          </div>
        )}
      </div>
      {currentSign && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          Signing:{" "}
          <Badge variant="outline" className="text-primary border-primary/30">
            {currentSign}
          </Badge>
        </div>
      )}
    </div>
  );
}
