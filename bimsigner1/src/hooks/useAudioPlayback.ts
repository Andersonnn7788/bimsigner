"use client";

import { useRef, useState, useCallback } from "react";

export function useAudioPlayback() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const play = useCallback((audioBlob: Blob, onEnded?: () => void) => {
    const url = URL.createObjectURL(audioBlob);

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;
    audio.src = url;
    audio.onended = () => {
      setIsPlaying(false);
      URL.revokeObjectURL(url);
      onEnded?.();
    };
    audio.onerror = () => {
      setIsPlaying(false);
      URL.revokeObjectURL(url);
      onEnded?.();
    };

    setIsPlaying(true);
    audio.play().catch(() => {
      setIsPlaying(false);
      onEnded?.();
    });
  }, []);

  const fallbackSpeak = useCallback((text: string, onEnded?: () => void) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ms-MY";
    utterance.onend = () => {
      setIsPlaying(false);
      onEnded?.();
    };
    setIsPlaying(true);
    speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    speechSynthesis.cancel();
    setIsPlaying(false);
  }, []);

  return { isPlaying, play, fallbackSpeak, stop };
}
