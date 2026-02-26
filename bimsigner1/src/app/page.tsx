"use client";

import { useState, useCallback, useReducer, useEffect, useRef } from "react";
import { useWebcam } from "@/hooks/useWebcam";
import { useMediaPipe } from "@/hooks/useMediaPipe";
import type { HolisticResult } from "@/hooks/useMediaPipe";
import { useDetectionSocket } from "@/hooks/useDetectionSocket";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useAudioPlayback } from "@/hooks/useAudioPlayback";
import { glossToSentence, textToSpeech, textToBIM } from "@/lib/api";
import { stageReducer, initialState } from "@/lib/stageMachine";
import { cn } from "@/lib/utils";
import CameraPanel from "@/components/CameraPanel";
import AvatarPanel from "@/components/AvatarPanel";
import OfficerControls from "@/components/OfficerControls";
import RecognitionBar from "@/components/RecognitionBar";
import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
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

  // WebSocket-based detection (backend runs MediaPipe + LSTM)
  const detection = useDetectionSocket({
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

  // Silence detection for auto-send
  const [silenceProgress, setSilenceProgress] = useState(0);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep sentence & messages accessible in effects without stale closures
  const sentenceRef = useRef(state.sentence);
  const messagesRef = useRef(state.messages);
  useEffect(() => {
    sentenceRef.current = state.sentence;
    messagesRef.current = state.messages;
  });

  // --- Start camera + mediapipe + WebSocket ---
  const handleStart = useCallback(async () => {
    await startWebcam();
    await initMediaPipe();

    // Connect WebSocket for backend detection
    detection.connect();

    setTimeout(() => {
      if (videoRef.current) {
        // MediaPipe detection loop for visualization only
        startDetection(
          videoRef.current,
          (result: HolisticResult) => {
            setLandmarks({
              pose: result.poseLandmarks,
              face: result.faceLandmarks,
              leftHand: result.leftHandLandmarks,
              rightHand: result.rightHandLandmarks,
            });
          }
        );
        // Start sending video frames to backend via WebSocket
        detection.startSending(videoRef.current);
      }
    }, 500);
  }, [startWebcam, initMediaPipe, videoRef, startDetection, detection.connect, detection.startSending]);

  // --- Auto-transition: TRANSLATING (call glossToSentence) ---
  useEffect(() => {
    if (state.stage !== "TRANSLATING" || !state.isLoading) return;
    if (transitionRef.current) return;
    transitionRef.current = true;

    glossToSentence(state.detectedSequence, messagesRef.current)
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

  // --- Auto-send: silence detection (2.5s after last transcript change) ---
  useEffect(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    if (state.stage !== "LISTENING" || !transcript.trim()) {
      setSilenceProgress(0);
      return;
    }

    const SILENCE_MS = 2500;
    const startTime = Date.now();
    countdownIntervalRef.current = setInterval(() => {
      setSilenceProgress(Math.min(((Date.now() - startTime) / SILENCE_MS) * 100, 100));
    }, 50);

    silenceTimerRef.current = setTimeout(() => {
      clearInterval(countdownIntervalRef.current!);
      setSilenceProgress(0);
      handleStaffSend();
    }, SILENCE_MS);

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [transcript, state.stage, handleStaffSend]);

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
    detection.resetBuffer();
  }, [detection.resetBuffer]);

  // --- Reset buffer when cycling back to SIGNING ---
  useEffect(() => {
    if (state.stage === "SIGNING" && state.detectedSequence.length === 0) {
      detection.resetBuffer();
    }
  }, [state.stage, state.detectedSequence.length, detection.resetBuffer]);


  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">

      {/* ── HEADER ── */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-card px-4 shadow-sm">
        <h1 className="text-sm font-bold tracking-tight text-foreground">
          <span className="text-primary">BIM</span> Signer
        </h1>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link
            href="/checkin"
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ClipboardCheck className="h-3.5 w-3.5" />
            Check-in
          </Link>
          {isMediaPipeLoading && (
            <div className="h-3 w-3 animate-spin rounded-full border border-muted-foreground/30 border-t-muted-foreground" />
          )}
          {isMediaPipeReady && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              MediaPipe Ready
            </span>
          )}
        </div>
      </header>

      {/* ── BODY: THREE-COLUMN LAYOUT ── */}
      <div className={cn("flex flex-1 min-h-0 overflow-hidden")}>

        {/* ── LEFT: CAMERA (34%) ── */}
        <div className="w-[34%] shrink-0 overflow-hidden">
          <CameraPanel
            videoRef={videoRef}
            isWebcamReady={isWebcamReady}
            isMediaPipeReady={isMediaPipeReady}
            isMediaPipeLoading={isMediaPipeLoading}
            webcamError={webcamError}
            onStart={handleStart}
            landmarks={landmarks}
            lastDetection={detection.lastDetection}
            detectedSequence={state.detectedSequence}
            currentStage={state.stage}
          />
        </div>

        {/* ── MIDDLE: AVATAR (33%) ── */}
        <div className="w-[33%] border-x border-border shrink-0 overflow-hidden">
          <AvatarPanel
            signs={state.avatarSigns}
            isLoading={state.isLoading}
            error={state.error}
            onDone={handleAvatarDone}
            stage={state.stage}
            sentence={state.sentence}
            messages={state.messages}
            detectedSequence={state.detectedSequence}
          />
        </div>

        {/* ── RIGHT: OFFICER CONTROLS (33%) ── */}
        <div className="w-[33%] shrink-0 overflow-hidden">
          <OfficerControls
            transcript={state.staffTranscript}
            isListening={isListening}
            silenceProgress={silenceProgress}
            stage={state.stage}
          />
        </div>

      </div>

      {/* ── BOTTOM: RECOGNITION BAR ── */}
      <RecognitionBar
        detectedSequence={state.detectedSequence}
        sentence={state.sentence}
        isLoading={state.isLoading}
        stage={state.stage}
        lastDetection={detection.lastDetection}
      />

    </div>
  );
}
