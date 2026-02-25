"use client";

import { useRef, useEffect } from "react";
import type { Landmark } from "@/types";

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  poseLandmarks?: Landmark[];
  leftHandLandmarks?: Landmark[];
  rightHandLandmarks?: Landmark[];
}

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
];

const POSE_CONNECTIONS = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24],
];

function drawLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  connections: number[][],
  color: string,
  w: number,
  h: number
) {
  // Draw connections
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  for (const [a, b] of connections) {
    if (landmarks[a] && landmarks[b]) {
      ctx.beginPath();
      ctx.moveTo(landmarks[a].x * w, landmarks[a].y * h);
      ctx.lineTo(landmarks[b].x * w, landmarks[b].y * h);
      ctx.stroke();
    }
  }

  // Draw points
  ctx.fillStyle = color;
  for (const lm of landmarks) {
    ctx.beginPath();
    ctx.arc(lm.x * w, lm.y * h, 3, 0, 2 * Math.PI);
    ctx.fill();
  }
}

export default function DetectionOverlay({
  videoRef,
  poseLandmarks,
  leftHandLandmarks,
  rightHandLandmarks,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;

    if (poseLandmarks) {
      drawLandmarks(ctx, poseLandmarks, POSE_CONNECTIONS, "#00ff88", w, h);
    }
    if (leftHandLandmarks) {
      drawLandmarks(ctx, leftHandLandmarks, HAND_CONNECTIONS, "#ff4444", w, h);
    }
    if (rightHandLandmarks) {
      drawLandmarks(ctx, rightHandLandmarks, HAND_CONNECTIONS, "#4444ff", w, h);
    }
  }, [videoRef, poseLandmarks, leftHandLandmarks, rightHandLandmarks]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
