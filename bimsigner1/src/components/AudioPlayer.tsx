"use client";

import { useEffect, useRef } from "react";

interface Props {
  audioBlob: Blob | null;
  onEnded?: () => void;
}

export default function AudioPlayer({ audioBlob, onEnded }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!audioBlob || !audioRef.current) return;

    // Clean up previous URL
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
    }

    const url = URL.createObjectURL(audioBlob);
    urlRef.current = url;
    audioRef.current.src = url;
    audioRef.current.play().catch(console.error);

    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, [audioBlob]);

  return <audio ref={audioRef} onEnded={onEnded} className="hidden" />;
}
