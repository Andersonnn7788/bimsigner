/**
 * Converts MediaPipe HolisticLandmarker results into a flat 1662-dim array
 * matching the Python extract_keypoints order:
 *   pose(33×4) + face(468×3) + leftHand(21×3) + rightHand(21×3) = 1662
 */

import type { Landmark } from "@/types";

type LandmarkList = Landmark[] | undefined;

export function extractKeypoints(
  poseLandmarks: LandmarkList,
  faceLandmarks: LandmarkList,
  leftHandLandmarks: LandmarkList,
  rightHandLandmarks: LandmarkList
): number[] {
  // Pose: 33 landmarks × 4 (x, y, z, visibility) = 132
  const pose = poseLandmarks
    ? poseLandmarks
        .slice(0, 33)
        .flatMap((l) => [l.x, l.y, l.z, l.visibility ?? 0])
    : new Array(33 * 4).fill(0);

  // Face: 468 landmarks × 3 (x, y, z) = 1404
  const face = faceLandmarks
    ? faceLandmarks.slice(0, 468).flatMap((l) => [l.x, l.y, l.z])
    : new Array(468 * 3).fill(0);

  // Left hand: 21 landmarks × 3 (x, y, z) = 63
  const lh = leftHandLandmarks
    ? leftHandLandmarks.slice(0, 21).flatMap((l) => [l.x, l.y, l.z])
    : new Array(21 * 3).fill(0);

  // Right hand: 21 landmarks × 3 (x, y, z) = 63
  const rh = rightHandLandmarks
    ? rightHandLandmarks.slice(0, 21).flatMap((l) => [l.x, l.y, l.z])
    : new Array(21 * 3).fill(0);

  return [...pose, ...face, ...lh, ...rh];
}
