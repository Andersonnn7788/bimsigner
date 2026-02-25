import { API_URL } from "./constants";
import type { PredictResponse, SentenceResponse, BIMResponse } from "@/types";

export async function predictSign(
  landmarks: number[][]
): Promise<PredictResponse> {
  const res = await fetch(`${API_URL}/api/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ landmarks }),
  });
  if (!res.ok) throw new Error(`Predict failed: ${res.status}`);
  return res.json();
}

export async function glossToSentence(
  glosses: string[]
): Promise<SentenceResponse> {
  const res = await fetch(`${API_URL}/api/gloss-to-sentence`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ glosses }),
  });
  if (!res.ok) throw new Error(`Gloss-to-sentence failed: ${res.status}`);
  return res.json();
}

export async function textToSpeech(text: string): Promise<Blob> {
  const res = await fetch(`${API_URL}/api/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`TTS failed: ${res.status}`);
  return res.blob();
}

export async function textToBIM(text: string): Promise<BIMResponse> {
  const res = await fetch(`${API_URL}/api/text-to-bim`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`Text-to-BIM failed: ${res.status}`);
  return res.json();
}
