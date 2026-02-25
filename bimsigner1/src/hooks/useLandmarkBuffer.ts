"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { extractKeypoints } from "@/lib/landmarkUtils";
import { predictSign } from "@/lib/api";
import {
  SEQUENCE_LENGTH,
  SLIDE_STEP,
  CONFIDENCE_THRESHOLD,
} from "@/lib/constants";
import type { HolisticResult } from "./useMediaPipe";
import type { DetectionResult } from "@/types";

interface UseLandmarkBufferOptions {
  onSignDetected?: (sign: string) => void;
  enabled?: boolean;
}

export function useLandmarkBuffer(options: UseLandmarkBufferOptions = {}) {
  const { onSignDetected, enabled = true } = options;
  const bufferRef = useRef<number[][]>([]);
  const frameCountRef = useRef(0);
  const isPredictingRef = useRef(false);
  const enabledRef = useRef(enabled);
  const onSignDetectedRef = useRef(onSignDetected);
  useEffect(() => {
    enabledRef.current = enabled;
    onSignDetectedRef.current = onSignDetected;
  });

  const [lastDetection, setLastDetection] = useState<DetectionResult | null>(
    null
  );

  const addFrame = useCallback(
    (result: HolisticResult) => {
      const keypoints = extractKeypoints(
        result.poseLandmarks,
        result.faceLandmarks,
        result.leftHandLandmarks,
        result.rightHandLandmarks
      );

      bufferRef.current.push(keypoints);
      frameCountRef.current++;

      // Keep buffer at max SEQUENCE_LENGTH
      if (bufferRef.current.length > SEQUENCE_LENGTH) {
        bufferRef.current = bufferRef.current.slice(-SEQUENCE_LENGTH);
      }

      // Skip prediction when disabled (use ref to avoid stale closure)
      if (!enabledRef.current) return;

      // Predict every SLIDE_STEP frames once we have a full buffer
      if (
        bufferRef.current.length === SEQUENCE_LENGTH &&
        frameCountRef.current % SLIDE_STEP === 0 &&
        !isPredictingRef.current
      ) {
        isPredictingRef.current = true;
        const snapshot = [...bufferRef.current];

        predictSign(snapshot)
          .then((res) => {
            const detection: DetectionResult = {
              sign: res.sign,
              confidence: res.confidence,
              confidences: res.confidences,
            };
            setLastDetection(detection);

            if (
              res.confidence >= CONFIDENCE_THRESHOLD &&
              res.sign !== "Idle"
            ) {
              onSignDetectedRef.current?.(res.sign);
            }
          })
          .catch((err) => {
            console.error("Prediction error:", err);
          })
          .finally(() => {
            isPredictingRef.current = false;
          });
      }
    },
    []
  );

  const resetBuffer = useCallback(() => {
    bufferRef.current = [];
    frameCountRef.current = 0;
    setLastDetection(null);
  }, []);

  return { lastDetection, addFrame, resetBuffer };
}
