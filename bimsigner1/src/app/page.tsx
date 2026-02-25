"use client";

import { useState, useCallback, useReducer, useEffect, useRef } from "react";
import { useWebcam } from "@/hooks/useWebcam";
import { useMediaPipe } from "@/hooks/useMediaPipe";
import type { HolisticResult } from "@/hooks/useMediaPipe";
import { useLandmarkBuffer } from "@/hooks/useLandmarkBuffer";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useAudioPlayback } from "@/hooks/useAudioPlayback";
import { glossToSentence, textToSpeech, textToBIM } from "@/lib/api";
import { stageReducer, initialState } from "@/lib/stageMachine";
import StepperBar from "@/components/StepperBar";
import ConversationStrip from "@/components/ConversationStrip";
import SigningStage from "@/components/stages/SigningStage";
import TranslatingStage from "@/components/stages/TranslatingStage";
import SpeakingStage from "@/components/stages/SpeakingStage";
import ListeningStage from "@/components/stages/ListeningStage";
import AvatarStage from "@/components/stages/AvatarStage";
import type { Landmark } from "@/types";

export default function Home() {
  const [state, dispatch] = useReducer(stageReducer, initialState);

  // Webcam & MediaPipe — destructure to satisfy React Compiler ref rules
  const {
    videoRef,
    isReady: isWebcamReady,
    error: webcamError,
    start: startWebcam,
    stop: _stopWebcam,
  } = useWebcam();
  void _stopWebcam;

  const {
    initialize: initMediaPipe,
    startDetection,
    isLoading: isMediaPipeLoading,
    isReady: isMediaPipeReady,
  } = useMediaPipe();

  // Landmark buffer with sign detection callback
  const buffer = useLandmarkBuffer({
    onSignDetected: useCallback((sign: string) => {
      dispatch({ type: "SIGN_DETECTED", sign });
    }, []),
    enabled: state.stage === "SIGNING",
  });

  // Current landmarks for overlay drawing
  const [landmarks, setLandmarks] = useState<{
    pose?: Landmark[];
    face?: Landmark[];
    leftHand?: Landmark[];
    rightHand?: Landmark[];
  }>({});

  // Staff speech
  const {
    transcript,
    isListening,
    start: startSpeech,
    stop: stopSpeech,
    reset: resetSpeech,
  } = useSpeechRecognition();
  const audio = useAudioPlayback();

  // Track if transitions are in progress to prevent double-firing
  const transitionRef = useRef(false);

  // Keep sentence accessible in effects without stale closures
  const sentenceRef = useRef(state.sentence);
  useEffect(() => {
    sentenceRef.current = state.sentence;
  });

  // Keep addFrame always fresh via ref (avoids stale closure in rAF loop)
  const addFrameRef = useRef(buffer.addFrame);
  useEffect(() => {
    addFrameRef.current = buffer.addFrame;
  });

  // --- Start camera + mediapipe ---
  const handleStart = useCallback(async () => {
    await startWebcam();
    await initMediaPipe();

    setTimeout(() => {
      if (videoRef.current) {
        startDetection(
          videoRef.current,
          (result: HolisticResult) => {
            addFrameRef.current(result);
            setLandmarks({
              pose: result.poseLandmarks,
              face: result.faceLandmarks,
              leftHand: result.leftHandLandmarks,
              rightHand: result.rightHandLandmarks,
            });
          }
        );
      }
    }, 500);
  }, [startWebcam, initMediaPipe, videoRef, startDetection]);

  // --- Auto-transition: TRANSLATING (call glossToSentence) ---
  useEffect(() => {
    if (state.stage !== "TRANSLATING" || !state.isLoading) return;
    if (transitionRef.current) return;
    transitionRef.current = true;

    glossToSentence(state.detectedSequence)
      .then((res) => {
        dispatch({ type: "TRANSLATION_SUCCESS", sentence: res.sentence });
      })
      .catch((err) => {
        console.error("Translation error:", err);
        dispatch({
          type: "TRANSLATION_ERROR",
          error: "Translation failed, using glosses",
        });
      })
      .finally(() => {
        transitionRef.current = false;
      });
  }, [state.stage, state.isLoading, state.detectedSequence]);

  // --- Auto-transition: SPEAKING (call textToSpeech) ---
  useEffect(() => {
    if (state.stage !== "SPEAKING" || !state.isPlaying) return;
    if (transitionRef.current) return;
    transitionRef.current = true;

    const sentence = sentenceRef.current;
    const onTTSDone = () => {
      dispatch({ type: "TTS_COMPLETE" });
      transitionRef.current = false;
    };

    textToSpeech(sentence)
      .then((audioBlob) => {
        audio.play(audioBlob, onTTSDone);
      })
      .catch(() => {
        audio.fallbackSpeak(sentence, onTTSDone);
      });
  }, [state.stage, state.isPlaying, audio]);

  // --- Auto-transition: LISTENING (start mic) ---
  useEffect(() => {
    if (state.stage === "LISTENING") {
      startSpeech();
    }
  }, [state.stage, startSpeech]);

  // --- Sync speech transcript to state ---
  useEffect(() => {
    if (state.stage === "LISTENING" && transcript) {
      dispatch({ type: "TRANSCRIPT_UPDATE", text: transcript });
    }
  }, [state.stage, transcript]);

  // --- Staff send ---
  const handleStaffSend = useCallback(() => {
    stopSpeech();
    dispatch({ type: "STAFF_SEND" });
    resetSpeech();
  }, [stopSpeech, resetSpeech]);

  // --- Auto-transition: AVATAR (call textToBIM) ---
  useEffect(() => {
    if (state.stage !== "AVATAR" || !state.isLoading) return;
    if (transitionRef.current) return;
    transitionRef.current = true;

    const staffText = state.messages[state.messages.length - 1]?.text || "";

    textToBIM(staffText)
      .then((bimResult) => {
        dispatch({ type: "AVATAR_START", signs: bimResult.signs });
      })
      .catch((err) => {
        console.error("Text-to-BIM error:", err);
        dispatch({ type: "AVATAR_ERROR", error: "Failed to convert to signs" });
      })
      .finally(() => {
        transitionRef.current = false;
      });
  }, [state.stage, state.isLoading, state.messages]);

  // --- Avatar done ---
  const handleAvatarDone = useCallback(() => {
    dispatch({ type: "AVATAR_COMPLETE" });
    buffer.resetBuffer();
  }, [buffer]);

  // --- Reset buffer when cycling back to SIGNING ---
  useEffect(() => {
    if (state.stage === "SIGNING" && state.detectedSequence.length === 0) {
      buffer.resetBuffer();
    }
  }, [state.stage, state.detectedSequence.length, buffer]);

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-card px-6 py-3 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          <span className="text-primary">BIM</span> Signer
        </h1>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isMediaPipeReady && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              Ready
            </span>
          )}
        </div>
      </header>

      {/* Stepper Bar */}
      <StepperBar currentStage={state.stage} />

      {/* Active Stage */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-2">
        {state.stage === "SIGNING" && (
          <SigningStage
            videoRef={videoRef}
            isWebcamReady={isWebcamReady}
            webcamError={webcamError}
            isMediaPipeLoading={isMediaPipeLoading}
            isMediaPipeReady={isMediaPipeReady}
            poseLandmarks={landmarks.pose}
            faceLandmarks={landmarks.face}
            leftHandLandmarks={landmarks.leftHand}
            rightHandLandmarks={landmarks.rightHand}
            detection={buffer.lastDetection}
            detectedSequence={state.detectedSequence}
            onStart={handleStart}
          />
        )}

        {state.stage === "TRANSLATING" && (
          <TranslatingStage
            glosses={state.detectedSequence}
            sentence={state.sentence}
            isLoading={state.isLoading}
            error={state.error}
          />
        )}

        {state.stage === "SPEAKING" && (
          <SpeakingStage
            sentence={state.sentence}
            isPlaying={state.isPlaying}
          />
        )}

        {state.stage === "LISTENING" && (
          <ListeningStage
            transcript={state.staffTranscript}
            isListening={isListening}
            onSend={handleStaffSend}
          />
        )}

        {state.stage === "AVATAR" && (
          <AvatarStage
            signs={state.avatarSigns}
            isLoading={state.isLoading}
            error={state.error}
            onDone={handleAvatarDone}
          />
        )}

        {/* Hidden video element to keep webcam stream alive when not in SIGNING stage */}
        {state.stage !== "SIGNING" && isWebcamReady && (
          <video
            ref={videoRef}
            className="hidden"
            playsInline
            muted
          />
        )}
      </div>

      {/* Conversation Strip */}
      <ConversationStrip messages={state.messages} />
    </div>
  );
}
