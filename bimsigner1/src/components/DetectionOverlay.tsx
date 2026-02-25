"use client";

import { useRef, useEffect } from "react";
import type { Landmark } from "@/types";

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  poseLandmarks?: Landmark[];
  faceLandmarks?: Landmark[];
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

// Full MediaPipe POSE_CONNECTIONS (matches mp_holistic.POSE_CONNECTIONS)
const POSE_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 7],           // head right
  [0, 4], [4, 5], [5, 6], [6, 8],           // head left
  [9, 10],                                    // mouth
  [11, 12],                                   // shoulders
  [11, 13], [13, 15],                         // left arm
  [12, 14], [14, 16],                         // right arm
  [11, 23], [12, 24], [23, 24],              // torso
  [15, 17], [15, 19], [15, 21], [17, 19],    // left hand wrist
  [16, 18], [16, 20], [16, 22], [18, 20],    // right hand wrist
  [23, 25], [25, 27], [27, 29], [27, 31], [29, 31], // left leg
  [24, 26], [26, 28], [28, 30], [28, 32], [30, 32], // right leg
];

// MediaPipe FACEMESH_CONTOURS — face oval, eyes, eyebrows, nose, lips
const FACE_OVAL: number[][] = [
  [10, 338], [338, 297], [297, 332], [332, 284], [284, 251], [251, 389],
  [389, 356], [356, 454], [454, 323], [323, 361], [361, 288], [288, 397],
  [397, 365], [365, 379], [379, 378], [378, 400], [400, 377], [377, 152],
  [152, 148], [148, 176], [176, 149], [149, 150], [150, 136], [136, 172],
  [172, 58], [58, 132], [132, 93], [93, 234], [234, 127], [127, 162],
  [162, 21], [21, 54], [54, 103], [103, 67], [67, 109], [109, 10],
];

const LEFT_EYE: number[][] = [
  [263, 249], [249, 390], [390, 373], [373, 374], [374, 380], [380, 381],
  [381, 382], [382, 362], [362, 398], [398, 384], [384, 385], [385, 386],
  [386, 387], [387, 388], [388, 466], [466, 263],
];

const RIGHT_EYE: number[][] = [
  [33, 7], [7, 163], [163, 144], [144, 145], [145, 153], [153, 154],
  [154, 155], [155, 133], [133, 173], [173, 157], [157, 158], [158, 159],
  [159, 160], [160, 161], [161, 246], [246, 33],
];

const LEFT_EYEBROW: number[][] = [
  [276, 283], [283, 282], [282, 295], [295, 285],
  [300, 293], [293, 334], [334, 296], [296, 336],
];

const RIGHT_EYEBROW: number[][] = [
  [46, 53], [53, 52], [52, 65], [65, 55],
  [70, 63], [63, 105], [105, 66], [66, 107],
];

const NOSE: number[][] = [
  [168, 6], [6, 197], [197, 195], [195, 5], [5, 4],
  [4, 45], [45, 220], [220, 115], [115, 48],
  [4, 275], [275, 440], [440, 344], [344, 278],
  [48, 64], [64, 98], [98, 97], [97, 2], [2, 326],
  [326, 327], [327, 294], [294, 278],
];

const LIPS: number[][] = [
  [61, 146], [146, 91], [91, 181], [181, 84], [84, 17],
  [17, 314], [314, 405], [405, 321], [321, 375], [375, 291],
  [61, 185], [185, 40], [40, 39], [39, 37], [37, 0],
  [0, 267], [267, 269], [269, 270], [270, 409], [409, 291],
  [291, 375], [375, 321], [321, 405], [405, 314], [314, 17],
  [17, 84], [84, 181], [181, 91], [91, 146], [146, 61],
];

const ALL_FACE_CONNECTIONS = [
  ...FACE_OVAL, ...LEFT_EYE, ...RIGHT_EYE,
  ...LEFT_EYEBROW, ...RIGHT_EYEBROW, ...NOSE, ...LIPS,
];

function drawLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  connections: number[][],
  color: string,
  w: number,
  h: number,
  lineWidth = 2,
  dotRadius = 3,
  dotColor?: string
) {
  const resolvedDotColor = dotColor ?? color;

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  for (const [a, b] of connections) {
    if (landmarks[a] && landmarks[b]) {
      ctx.beginPath();
      ctx.moveTo(landmarks[a].x * w, landmarks[a].y * h);
      ctx.lineTo(landmarks[b].x * w, landmarks[b].y * h);
      ctx.stroke();
    }
  }

  ctx.fillStyle = resolvedDotColor;
  for (const lm of landmarks) {
    ctx.beginPath();
    ctx.arc(lm.x * w, lm.y * h, dotRadius, 0, 2 * Math.PI);
    ctx.fill();
  }
}

function drawCornerBrackets(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number
) {
  const arm = 20;
  const pad = 8;
  ctx.strokeStyle = "rgba(0,255,136,0.7)";
  ctx.lineWidth = 2;

  const corners = [
    // [x, y, dx, dy] — start point and arm directions
    [pad, pad, arm, 0, 0, arm],           // top-left
    [w - pad, pad, -arm, 0, 0, arm],      // top-right
    [pad, h - pad, arm, 0, 0, -arm],      // bottom-left
    [w - pad, h - pad, -arm, 0, 0, -arm], // bottom-right
  ] as [number, number, number, number, number, number][];

  for (const [x, y, dx1, dy1, dx2, dy2] of corners) {
    ctx.beginPath();
    ctx.moveTo(x + dx1, y + dy1);
    ctx.lineTo(x, y);
    ctx.lineTo(x + dx2, y + dy2);
    ctx.stroke();
  }
}

function drawHUDText(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  hasLandmarks: boolean,
  frameCount: number
) {
  ctx.font = "bold 11px monospace";
  ctx.textBaseline = "top";

  // Status — top-left
  if (hasLandmarks) {
    ctx.fillStyle = "rgba(0,255,136,0.9)";
    ctx.fillText("● TRACKING", 12, 12);
  } else {
    ctx.fillStyle = "rgba(0,255,136,0.35)";
    ctx.fillText("○ SCANNING", 12, 12);
  }

  // Frame counter — bottom-left
  ctx.fillStyle = "rgba(0,255,136,0.55)";
  ctx.textBaseline = "bottom";
  const frameStr = `FRAME  ${String(frameCount).padStart(4, "0")}`;
  ctx.fillText(frameStr, 12, h - 8);
}

export default function DetectionOverlay({
  videoRef,
  poseLandmarks,
  faceLandmarks,
  leftHandLandmarks,
  rightHandLandmarks,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameCountRef = useRef(0);

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

    // Colors matched from training/utils.py draw_styled_landmarks (BGR→RGB)
    if (faceLandmarks) {
      drawLandmarks(ctx, faceLandmarks, ALL_FACE_CONNECTIONS, "rgb(10,110,80)", w, h, 1, 1, "rgb(121,255,80)");
    }
    if (poseLandmarks) {
      drawLandmarks(ctx, poseLandmarks, POSE_CONNECTIONS, "rgb(10,22,80)", w, h, 2, 2, "rgb(121,44,80)");
    }
    if (leftHandLandmarks) {
      drawLandmarks(ctx, leftHandLandmarks, HAND_CONNECTIONS, "rgb(76,22,121)", w, h, 2, 2, "rgb(250,44,121)");
    }
    if (rightHandLandmarks) {
      drawLandmarks(ctx, rightHandLandmarks, HAND_CONNECTIONS, "rgb(66,117,245)", w, h, 2, 2, "rgb(230,66,245)");
    }

    frameCountRef.current = (frameCountRef.current + 1) % 10000;
    const hasLandmarks = !!(poseLandmarks || faceLandmarks || leftHandLandmarks || rightHandLandmarks);
    drawCornerBrackets(ctx, w, h);
    drawHUDText(ctx, w, h, hasLandmarks, frameCountRef.current);
  }, [videoRef, poseLandmarks, faceLandmarks, leftHandLandmarks, rightHandLandmarks]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
