"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { API_URL } from "@/lib/constants";
import type { DetectionResult } from "@/types";

interface UseDetectionSocketOptions {
  onSignDetected?: (sign: string) => void;
  enabled?: boolean;
  detectedSequence?: string[];
}

/**
 * WebSocket-based sign detection hook.
 *
 * Captures video frames, sends them to the backend via WebSocket,
 * and receives predictions from the backend which uses the same
 * Python MediaPipe + LSTM pipeline as training.
 */
export function useDetectionSocket(options: UseDetectionSocketOptions = {}) {
  const { onSignDetected, enabled = true, detectedSequence = [] } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enabledRef = useRef(enabled);
  const onSignDetectedRef = useRef(onSignDetected);
  const detectedSequenceRef = useRef(detectedSequence);
  const intentionalCloseRef = useRef(false);

  useEffect(() => {
    enabledRef.current = enabled;
    onSignDetectedRef.current = onSignDetected;
    detectedSequenceRef.current = detectedSequence;
  });

  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastDetection, setLastDetection] = useState<DetectionResult | null>(
    null
  );

  const connect = useCallback((): Promise<void> => {
    return new Promise<void>((resolve) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        console.log("[useDetectionSocket] connect() called but already OPEN — skipping");
        resolve();
        return;
      }

      intentionalCloseRef.current = false;

      // Convert http(s):// to ws(s)://
      const wsUrl = API_URL.replace(/^http/, "ws") + "/ws/detect";
      console.log("[useDetectionSocket] connect() → opening WebSocket to", wsUrl);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("[useDetectionSocket] Connected successfully");
        setIsConnected(true);
        setConnectionError(null);
        resolve();
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
              (msg.smoothed ? ` → SMOOTHED: ${msg.smoothed.sign}` : "") +
              (msg.no_hands ? " [no hands]" : "")
            );

            // Update raw detection for confidence HUD
            const detection: DetectionResult = {
              sign: msg.raw.sign,
              confidence: msg.raw.confidence,
              confidences: msg.raw.confidences,
              noHands: msg.no_hands ?? false,
            };
            setLastDetection(detection);

            // Fire sign detected callback for smoothed results only
            // (backend handles per-class confidence thresholds)
            if (
              msg.smoothed &&
              enabledRef.current
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
        wsRef.current = null;

        // Auto-reconnect if not intentionally closed (e.g. backend not ready yet)
        if (!intentionalCloseRef.current && event.code !== 1000) {
          console.log("[useDetectionSocket] Will retry in 2s...");
          setConnectionError("Connecting to backend...");
          retryRef.current = setTimeout(() => {
            console.log("[useDetectionSocket] Retrying connection...");
            connect();
          }, 2000);
        } else if (event.code !== 1000) {
          setConnectionError(`Connection lost (code ${event.code})`);
        }
      };

      ws.onerror = () => {
        console.error("[useDetectionSocket] WebSocket error. Is the backend running at", wsUrl, "?");
        resolve(); // Don't block startup on connection error — reconnect will handle it
      };

      wsRef.current = ws;
    });
  }, []);

  const disconnect = useCallback(() => {
    intentionalCloseRef.current = true;
    if (retryRef.current) {
      clearTimeout(retryRef.current);
      retryRef.current = null;
    }
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
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d")!;

    let framesSent = 0;
    let framesSkipped = 0;

    // Capture and send frames at ~20fps
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

      ctx.drawImage(video, 0, 0, 640, 480);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      // Strip "data:image/jpeg;base64," prefix
      const base64 = dataUrl.split(",")[1];

      wsRef.current.send(JSON.stringify({
        type: "frame",
        data: base64,
        detectedSoFar: detectedSequenceRef.current,
      }));
      framesSent++;
      if (framesSent % 30 === 0) {
        console.log("[useDetectionSocket] Sent %d frames so far (payload ~%d KB)", framesSent, Math.round(base64.length / 1024));
      }
    }, 50); // ~20fps
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
      intentionalCloseRef.current = true;
      if (retryRef.current) clearTimeout(retryRef.current);
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
