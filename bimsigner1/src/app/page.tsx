"use client";

import { useState, useCallback } from "react";
import WebcamPanel from "@/components/WebcamPanel";
import ConversationPanel from "@/components/ConversationPanel";
import { useWebcam } from "@/hooks/useWebcam";
import { useMediaPipe } from "@/hooks/useMediaPipe";
import type { HolisticResult } from "@/hooks/useMediaPipe";
import { useLandmarkBuffer } from "@/hooks/useLandmarkBuffer";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useAudioPlayback } from "@/hooks/useAudioPlayback";
import { glossToSentence, textToSpeech, textToBIM } from "@/lib/api";
import type { Message, Landmark } from "@/types";

export default function Home() {
  // Webcam & MediaPipe
  const webcam = useWebcam();
  const mediapipe = useMediaPipe();
  const buffer = useLandmarkBuffer();

  // Current landmarks for overlay drawing
  const [landmarks, setLandmarks] = useState<{
    pose?: Landmark[];
    leftHand?: Landmark[];
    rightHand?: Landmark[];
  }>({});

  // Conversation state
  const [messages, setMessages] = useState<Message[]>([]);
  const [sentence, setSentence] = useState("");
  const [avatarSigns, setAvatarSigns] = useState<string[]>([]);

  // Staff speech
  const speech = useSpeechRecognition();
  const audio = useAudioPlayback();

  // Start camera + mediapipe
  const handleStart = useCallback(async () => {
    await webcam.start();
    await mediapipe.initialize();

    // Small delay to let video element mount
    setTimeout(() => {
      if (webcam.videoRef.current) {
        mediapipe.startDetection(
          webcam.videoRef.current,
          (result: HolisticResult) => {
            buffer.addFrame(result);
            setLandmarks({
              pose: result.poseLandmarks,
              leftHand: result.leftHandLandmarks,
              rightHand: result.rightHandLandmarks,
            });
          }
        );
      }
    }, 500);
  }, [webcam, mediapipe, buffer]);

  // Speak glosses: convert to sentence, then TTS
  const handleSpeak = useCallback(async () => {
    if (buffer.glosses.length === 0) return;

    try {
      const res = await glossToSentence(buffer.glosses);
      setSentence(res.sentence);

      // Add message to conversation
      const msg: Message = {
        id: Date.now().toString(),
        sender: "deaf",
        text: res.sentence,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, msg]);

      // Try TTS
      try {
        const audioBlob = await textToSpeech(res.sentence);
        audio.play(audioBlob);
      } catch {
        audio.fallbackSpeak(res.sentence);
      }
    } catch (err) {
      console.error("Failed to generate sentence:", err);
      // Fallback: use glosses as-is
      const text = buffer.glosses.join(" ");
      setSentence(text);
      audio.fallbackSpeak(text);
    }
  }, [buffer.glosses, audio]);

  // Clear glosses
  const handleClear = useCallback(() => {
    buffer.clearGlosses();
    setSentence("");
  }, [buffer]);

  // Staff sends message
  const handleSendStaffMessage = useCallback(async () => {
    const text = speech.transcript.trim();
    if (!text) return;

    speech.stop();

    const msg: Message = {
      id: Date.now().toString(),
      sender: "staff",
      text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, msg]);

    // Convert to BIM
    try {
      const bimResult = await textToBIM(text);
      setAvatarSigns(bimResult.signs);
    } catch (err) {
      console.error("Failed to convert to BIM:", err);
    }

    speech.reset();
  }, [speech]);

  // Toggle mic
  const handleToggleMic = useCallback(() => {
    if (speech.isListening) {
      speech.stop();
    } else {
      speech.start();
    }
  }, [speech]);

  const handleAvatarDone = useCallback(() => {
    setAvatarSigns([]);
  }, []);

  return (
    <div className="flex h-screen flex-col bg-gray-950 p-3 text-white">
      {/* Header */}
      <header className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-emerald-400">BIM</span> Signer
        </h1>
        <div className="flex items-center gap-2 text-xs text-white/50">
          {mediapipe.isReady && (
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
              MediaPipe Ready
            </span>
          )}
        </div>
      </header>

      {/* Chrome warning */}
      {typeof window !== "undefined" &&
        !("webkitSpeechRecognition" in window) &&
        !("SpeechRecognition" in window) && (
          <div className="mb-2 rounded-md bg-yellow-500/20 px-3 py-2 text-xs text-yellow-300">
            Speech recognition requires Chrome. Some features may not work in
            this browser.
          </div>
        )}

      {/* Split screen */}
      <div className="grid flex-1 grid-cols-2 gap-3 overflow-hidden">
        {/* Left: Webcam */}
        <WebcamPanel
          videoRef={webcam.videoRef}
          isWebcamReady={webcam.isReady}
          webcamError={webcam.error}
          isMediaPipeLoading={mediapipe.isLoading}
          isMediaPipeReady={mediapipe.isReady}
          poseLandmarks={landmarks.pose}
          leftHandLandmarks={landmarks.leftHand}
          rightHandLandmarks={landmarks.rightHand}
          detection={buffer.lastDetection}
          glosses={buffer.glosses}
          sentence={sentence}
          onSpeak={handleSpeak}
          onClear={handleClear}
          isSpeaking={audio.isPlaying}
          onStart={handleStart}
        />

        {/* Right: Conversation */}
        <ConversationPanel
          messages={messages}
          avatarSigns={avatarSigns}
          transcript={speech.transcript}
          isListening={speech.isListening}
          onToggleMic={handleToggleMic}
          onSendStaffMessage={handleSendStaffMessage}
          onAvatarDone={handleAvatarDone}
        />
      </div>
    </div>
  );
}
