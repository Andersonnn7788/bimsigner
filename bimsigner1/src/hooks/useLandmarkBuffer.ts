"use client";

import { useRef, useState, useCallback } from "react";
import { extractKeypoints } from "@/lib/landmarkUtils";
import { predictSign } from "@/lib/api";
import {
  SEQUENCE_LENGTH,
  SLIDE_STEP,
  CONFIDENCE_THRESHOLD,
} from "@/lib/constants";
import type { HolisticResult } from "./useMediaPipe";
import type { DetectionResult } from "@/types";

export function useLandmarkBuffer() {
  const bufferRef = useRef<number[][]>([]);
  const frameCountRef = useRef(0);
  const isPredictingRef = useRef(false);
  const [glosses, setGlosses] = useState<string[]>([]);
  const [lastDetection, setLastDetection] = useState<DetectionResult | null>(
    null
  );

  const addFrame = useCallback((result: HolisticResult) => {
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
            confidences: [], // Backend only returns top prediction
          };
          setLastDetection(detection);

          if (res.confidence >= CONFIDENCE_THRESHOLD && res.sign !== "Idle") {
            setGlosses((prev) => {
              // Deduplicate: only append if different from last
              if (prev.length === 0 || prev[prev.length - 1] !== res.sign) {
                return [...prev, res.sign];
              }
              return prev;
            });
          }
        })
        .catch((err) => {
          console.error("Prediction error:", err);
        })
        .finally(() => {
          isPredictingRef.current = false;
        });
    }
  }, []);

  const clearGlosses = useCallback(() => {
    setGlosses([]);
    setLastDetection(null);
  }, []);

  const resetBuffer = useCallback(() => {
    bufferRef.current = [];
    frameCountRef.current = 0;
  }, []);

  return { glosses, lastDetection, addFrame, clearGlosses, resetBuffer };
}
