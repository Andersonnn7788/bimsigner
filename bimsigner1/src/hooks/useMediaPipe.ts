"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { Landmark } from "@/types";

interface HolisticResult {
  poseLandmarks: Landmark[] | undefined;
  faceLandmarks: Landmark[] | undefined;
  leftHandLandmarks: Landmark[] | undefined;
  rightHandLandmarks: Landmark[] | undefined;
}

export function useMediaPipe() {
  const landmarkerRef = useRef<unknown>(null);
  const rafIdRef = useRef<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const resultRef = useRef<HolisticResult>({
    poseLandmarks: undefined,
    faceLandmarks: undefined,
    leftHandLandmarks: undefined,
    rightHandLandmarks: undefined,
  });

  const initialize = useCallback(async () => {
    if (landmarkerRef.current) return;
    setIsLoading(true);

    try {
      const vision = await import("@mediapipe/tasks-vision");
      const { HolisticLandmarker, FilesetResolver } = vision;

      const wasmFileset = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      const landmarker = await HolisticLandmarker.createFromOptions(
        wasmFileset,
        {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/holistic_landmarker/holistic_landmarker/float16/latest/holistic_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
        }
      );

      landmarkerRef.current = landmarker;
      setIsReady(true);
    } catch (err) {
      console.error("MediaPipe init failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startDetection = useCallback(
    (
      video: HTMLVideoElement,
      onResult: (result: HolisticResult) => void
    ) => {
      const landmarker = landmarkerRef.current as {
        detectForVideo: (
          video: HTMLVideoElement,
          timestamp: number
        ) => {
          poseLandmarks?: { x: number; y: number; z: number; visibility?: number }[][];
          faceLandmarks?: { x: number; y: number; z: number }[][];
          leftHandLandmarks?: { x: number; y: number; z: number }[][];
          rightHandLandmarks?: { x: number; y: number; z: number }[][];
        };
      } | null;
      if (!landmarker) return;

      let lastTimestamp = -1;

      const detect = () => {
        if (video.readyState >= 2) {
          const now = performance.now();
          if (now !== lastTimestamp) {
            lastTimestamp = now;
            const raw = landmarker.detectForVideo(video, now);
            const result: HolisticResult = {
              poseLandmarks: raw.poseLandmarks?.[0] as Landmark[] | undefined,
              faceLandmarks: raw.faceLandmarks?.[0] as Landmark[] | undefined,
              leftHandLandmarks: raw.leftHandLandmarks?.[0] as Landmark[] | undefined,
              rightHandLandmarks: raw.rightHandLandmarks?.[0] as Landmark[] | undefined,
            };
            resultRef.current = result;
            onResult(result);
          }
        }
        rafIdRef.current = requestAnimationFrame(detect);
      };

      rafIdRef.current = requestAnimationFrame(detect);
    },
    []
  );

  const stopDetection = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = 0;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  return {
    initialize,
    startDetection,
    stopDetection,
    isLoading,
    isReady,
    currentResult: resultRef,
  };
}

export type { HolisticResult };
