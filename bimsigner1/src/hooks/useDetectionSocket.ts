"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { API_URL, CONFIDENCE_THRESHOLD } from "@/lib/constants";
import type { DetectionResult } from "@/types";

interface UseDetectionSocketOptions {
  onSignDetected?: (sign: string) => void;
  enabled?: boolean;
}

/**
 * WebSocket-based sign detection hook.
 *
 * Captures video frames, sends them to the backend via WebSocket,
 * and receives predictions from the backend which uses the same
 * Python MediaPipe + LSTM pipeline as training.
 */
export function useDetectionSocket(options: UseDetectionSocketOptions = {}) {
  const { onSignDetected, enabled = true } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const enabledRef = useRef(enabled);
  const onSignDetectedRef = useRef(onSignDetected);

  useEffect(() => {
    enabledRef.current = enabled;
    onSignDetectedRef.current = onSignDetected;
  });

  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastDetection, setLastDetection] = useState<DetectionResult | null>(
    null
  );

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("[useDetectionSocket] connect() called but already OPEN — skipping");
      return;
    }

    // Convert http(s):// to ws(s)://
    const wsUrl = API_URL.replace(/^http/, "ws") + "/ws/detect";
    console.log("[useDetectionSocket] connect() → opening WebSocket to", wsUrl);
    console.log("[useDetectionSocket] API_URL =", API_URL);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("[useDetectionSocket] Connected successfully");
      setIsConnected(true);
      setConnectionError(null);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "buffering") {
          // Log buffering progress periodically
          if (msg.frames % 10 === 0 || msg.frames === 1) {
            console.log(`[useDetectionSocket] Buffering: ${msg.frames}/${msg.needed} frames`);
          }
        } else if (msg.type === "prediction") {
          console.log(
            `[useDetectionSocket] Prediction: ${msg.raw.sign} (${(msg.raw.confidence * 100).toFixed(1)}%)` +
            (msg.smoothed ? ` → SMOOTHED: ${msg.smoothed.sign}` : "")
          );

          // Update raw detection for confidence HUD
          const detection: DetectionResult = {
            sign: msg.raw.sign,
            confidence: msg.raw.confidence,
            confidences: msg.raw.confidences,
          };
          setLastDetection(detection);

          // Fire sign detected callback for smoothed results only
          if (
            msg.smoothed &&
            enabledRef.current &&
            msg.raw.confidence >= CONFIDENCE_THRESHOLD
          ) {
            console.log("[useDetectionSocket] Firing onSignDetected:", msg.smoothed.sign);
            onSignDetectedRef.current?.(msg.smoothed.sign);
          }
        } else {
          console.log("[useDetectionSocket] Received message type:", msg.type);
        }
      } catch {
        console.warn("[useDetectionSocket] Failed to parse message:", event.data);
      }
    };

    ws.onclose = (event) => {
      console.log("[useDetectionSocket] Disconnected — code:", event.code, "reason:", event.reason);
      setIsConnected(false);
      if (event.code !== 1000) {
        setConnectionError(`Connection lost (code ${event.code})`);
      }
    };

    ws.onerror = () => {
      console.error("[useDetectionSocket] WebSocket error. Is the backend running at", wsUrl, "?");
    };

    wsRef.current = ws;
  }, []);

  const disconnect = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setLastDetection(null);
  }, []);

  const startSending = useCallback((video: HTMLVideoElement) => {
    console.log("[useDetectionSocket] startSending() called", {
      videoReadyState: video.readyState,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      wsState: wsRef.current?.readyState,
    });

    // Stop any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Create offscreen canvas for frame capture
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }
    const canvas = canvasRef.current;
    canvas.width = 480;
    canvas.height = 360;
    const ctx = canvas.getContext("2d")!;

    let framesSent = 0;
    let framesSkipped = 0;

    // Capture and send frames at ~15fps
    intervalRef.current = setInterval(() => {
      if (
        !wsRef.current ||
        wsRef.current.readyState !== WebSocket.OPEN ||
        video.readyState < 2
      ) {
        framesSkipped++;
        if (framesSkipped % 30 === 1) {
          console.warn("[useDetectionSocket] Frame skipped (#%d) — ws=%s videoReady=%d",
            framesSkipped,
            wsRef.current ? ["CONNECTING","OPEN","CLOSING","CLOSED"][wsRef.current.readyState] : "null",
            video.readyState,
          );
        }
        return;
      }

      ctx.drawImage(video, 0, 0, 480, 360);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.65);
      // Strip "data:image/jpeg;base64," prefix
      const base64 = dataUrl.split(",")[1];

      wsRef.current.send(JSON.stringify({ type: "frame", data: base64 }));
      framesSent++;
      if (framesSent % 30 === 0) {
        console.log("[useDetectionSocket] Sent %d frames so far (payload ~%d KB)", framesSent, Math.round(base64.length / 1024));
      }
    }, 66); // ~15fps
  }, []);

  const stopSending = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resetBuffer = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "reset" }));
    }
    setLastDetection(null);
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  return useMemo(() => ({
    connect,
    startSending,
    stopSending,
    disconnect,
    resetBuffer,
    isConnected,
    connectionError,
    lastDetection,
  }), [connect, startSending, stopSending, disconnect, resetBuffer, isConnected, connectionError, lastDetection]);
}
