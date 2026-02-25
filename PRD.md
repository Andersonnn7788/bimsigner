# BIM Signer - Product Requirements Document

## 1. Overview

**Product Name:** BIM Signer
**Type:** Hackathon prototype
**Purpose:** Real-time two-way communication bridge between deaf individuals using Bahasa Isyarat Malaysia (BIM) and government counter staff, powered by AI sign language recognition and speech synthesis.

## 2. Problem Statement

Deaf individuals face significant communication barriers when interacting with government counter services in Malaysia. Staff typically cannot understand sign language, and deaf individuals cannot hear spoken responses. This creates frustration, delays, and unequal access to public services.

## 3. Solution

BIM Signer provides a split-screen web application that:

1. **Deaf user → Staff:** Captures BIM signs via webcam, recognizes them using an LSTM model, converts sign glosses into natural Malay sentences, and speaks them aloud via text-to-speech.
2. **Staff → Deaf user:** Captures staff speech via microphone, transcribes it, converts it into simplified BIM-friendly text, and plays pre-recorded 3D avatar sign language videos.

## 4. Target Users

| User | Role |
|------|------|
| Deaf individual | Signs in BIM at the government counter |
| Government counter staff | Speaks in Malay to respond |

## 5. Core Features

### 5.1 Sign Language Recognition (Deaf → Staff)

- Real-time webcam feed with MediaPipe holistic landmark detection (pose, face, hands)
- 30-frame sliding window buffered and sent to backend LSTM model for prediction
- Trained on common BIM vocabulary used in government counter scenarios (greetings, pronouns, requests, common nouns)
- Confidence display with real-time probability indicators
- Gloss bar showing detected sign tokens as chips
- Gemini AI converts accumulated glosses into a natural Malay sentence
- ElevenLabs TTS speaks the sentence aloud for the staff to hear

### 5.2 Speech-to-Sign (Staff → Deaf)

- Staff presses mic button to start speech recognition (Web Speech API, `ms-MY` locale)
- Live transcript displayed during speech
- Gemini AI converts spoken Malay text into simplified BIM-friendly output + list of sign names
- Pre-recorded 3D avatar `.mp4` videos play sequentially for each sign
- Conversation log displays both sides of the exchange

### 5.3 Conversation Panel

- Scrollable message history (deaf user messages on left, staff messages on right)
- Each message shows source, original text, and translated output
- Clear visual distinction between the two participants

## 6. Architecture

### 6.1 System Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   Browser (Chrome)                       │
│                                                         │
│  ┌──────────────┐          ┌──────────────────────────┐ │
│  │  Webcam Feed  │          │  Conversation Panel      │ │
│  │  + MediaPipe  │          │  + Staff Mic Input       │ │
│  │  + Landmarks  │          │  + Avatar Video Player   │ │
│  └──────┬───────┘          └────────────┬─────────────┘ │
│         │ 30 frames × 1662              │ speech text    │
└─────────┼───────────────────────────────┼───────────────┘
          │                               │
          ▼                               ▼
┌─────────────────────────────────────────────────────────┐
│                  FastAPI Backend (:8000)                  │
│                                                         │
│  POST /api/predict ──► LSTM Model (action.h5)           │
│  POST /api/gloss-to-sentence ──► Gemini API             │
│  POST /api/text-to-bim ──► Gemini API                   │
│  POST /api/tts ──► ElevenLabs API                       │
│  GET  /api/health                                       │
└─────────────────────────────────────────────────────────┘
```

### 6.2 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| Landmark Detection | MediaPipe Holistic (in-browser via WASM) |
| Backend | FastAPI (Python) |
| Sign Recognition | TensorFlow LSTM model |
| Language AI | Google Gemini API |
| Text-to-Speech | ElevenLabs REST API |
| Speech-to-Text | Web Speech API (`webkitSpeechRecognition`) |
| Avatar Playback | Pre-recorded `.mp4` videos |

### 6.3 Data Flow: Sign → Speech

```
Webcam frames
  → MediaPipe extracts landmarks (1662-dim vector per frame)
  → Buffer 30 frames (sliding window, stride 15)
  → POST /api/predict → LSTM inference → sign label + confidence
  → Accumulate glosses (deduplicated, confidence > 0.7)
  → User clicks "Speak"
  → POST /api/gloss-to-sentence → Gemini → natural Malay sentence
  → POST /api/tts → ElevenLabs → audio stream → speaker
```

### 6.4 Data Flow: Speech → Sign

```
Staff clicks mic button
  → Web Speech API captures speech (ms-MY)
  → Staff clicks send
  → POST /api/text-to-bim → Gemini → BIM-friendly text + sign list
  → Avatar player queues /avatars/{sign}.mp4 videos
  → Videos play sequentially
```

## 7. Landmark Format (Critical)

Each frame produces a 1662-dimensional vector in this exact order:

| Body Part | Landmarks | Values per Landmark | Total |
|-----------|-----------|-------------------|-------|
| Pose | 33 | 4 (x, y, z, visibility) | 132 |
| Face | 468 | 3 (x, y, z) | 1404 |
| Left Hand | 21 | 3 (x, y, z) | 63 |
| Right Hand | 21 | 3 (x, y, z) | 63 |
| **Total** | | | **1662** |

This must match the Python `extract_keypoints` function exactly.

## 8. API Specification

### POST /api/predict

**Request:**
```json
{
  "landmarks": [[...1662 floats], ...30 frames]
}
```

**Response:**
```json
{
  "sign": "Terima Kasih",
  "confidence": 0.94,
  "action_index": 5
}
```

### POST /api/gloss-to-sentence

**Request:**
```json
{
  "glosses": ["Saya", "Nak", "Renew", "Lesen"]
}
```

**Response:**
```json
{
  "sentence": "Saya nak renew lesen saya."
}
```

### POST /api/text-to-bim

**Request:**
```json
{
  "text": "Sila ambil nombor giliran anda."
}
```

**Response:**
```json
{
  "bim_text": "AMBIL NOMBOR GILIRAN",
  "signs": ["Ambil", "Nombor", "Giliran"]
}
```

### POST /api/tts

**Request:**
```json
{
  "text": "Saya nak renew lesen saya."
}
```

**Response:** `audio/mpeg` stream

### GET /api/health

**Response:**
```json
{
  "status": "ok",
  "model_loaded": true
}
```

## 9. UI Layout

```
┌────────────────────────┬────────────────────────┐
│                        │   Conversation Panel    │
│     Webcam Feed        │  ┌──────────────────┐  │
│   + Landmark Overlay   │  │  Message History  │  │
│                        │  │  (scrollable)     │  │
│                        │  │                   │  │
│  ┌──────────────────┐  │  └──────────────────┘  │
│  │  Detected Sign    │  │                        │
│  │  ██████░░ 87%     │  │  ┌──────────────────┐  │
│  └──────────────────┘  │  │  Avatar Player    │  │
│                        │  └──────────────────┘  │
│  ┌──────────────────┐  │                        │
│  │ Gloss tokens:     │  │  ┌──────────────────┐  │
│  │ [Sign] [Sign] ... │  │  │ 🎤 Staff Input   │  │
│  │ 🔊 Speak | Clear │  │  │ [Speak] [Send]   │  │
│  └──────────────────┘  │  └──────────────────┘  │
└────────────────────────┴────────────────────────┘
```

## 10. Project Structure

```
bimsigner/
├── backend/
│   ├── main.py              # FastAPI app, CORS, lifespan
│   ├── config.py            # Pydantic settings
│   ├── schemas.py           # Request/response models
│   ├── requirements.txt
│   ├── .env                 # API keys (gitignored)
│   ├── routers/
│   │   ├── predict.py       # /api/predict
│   │   ├── gemini.py        # /api/gloss-to-sentence, /api/text-to-bim
│   │   └── tts.py           # /api/tts
│   └── services/
│       ├── model_service.py # LSTM model loader + inference
│       ├── gemini_service.py# Gemini API wrapper
│       └── tts_service.py   # ElevenLabs wrapper
├── bimsigner1/              # Next.js frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx     # Main split-screen page
│   │   │   ├── layout.tsx   # App layout
│   │   │   └── globals.css  # Theme + layout styles
│   │   ├── components/
│   │   │   ├── WebcamPanel.tsx
│   │   │   ├── DetectionOverlay.tsx
│   │   │   ├── ConfidenceDisplay.tsx
│   │   │   ├── GlossBar.tsx
│   │   │   ├── ConversationPanel.tsx
│   │   │   ├── StaffInput.tsx
│   │   │   ├── AvatarPlayer.tsx
│   │   │   └── AudioPlayer.tsx
│   │   ├── hooks/
│   │   │   ├── useWebcam.ts
│   │   │   ├── useMediaPipe.ts
│   │   │   ├── useLandmarkBuffer.ts
│   │   │   ├── useSpeechRecognition.ts
│   │   │   └── useAudioPlayback.ts
│   │   ├── lib/
│   │   │   ├── constants.ts
│   │   │   ├── api.ts
│   │   │   └── landmarkUtils.ts
│   │   └── types/
│   │       └── index.ts
│   └── public/
│       └── avatars/         # Pre-recorded sign videos (.mp4)
├── ActionDetectionforSignLanguage/
│   └── Action Detection Refined.ipynb
├── CLAUDE.md
└── PRD.md
```

## 11. Environment Variables

| Variable | Location | Purpose |
|----------|----------|---------|
| `GEMINI_API_KEY` | `backend/.env` | Google Gemini API key |
| `ELEVENLABS_API_KEY` | `backend/.env` | ElevenLabs TTS API key |
| `ELEVENLABS_VOICE_ID` | `backend/.env` | ElevenLabs voice selection |
| `MODEL_PATH` | `backend/.env` | Path to LSTM `.h5` model file |
| `NEXT_PUBLIC_API_URL` | `bimsigner1/.env.local` | Backend URL for frontend |

## 12. Browser Requirements

- **Chrome** (required for Web Speech API `webkitSpeechRecognition`)
- Camera permission for webcam access
- Microphone permission for staff speech input

## 13. Performance Targets

| Metric | Target |
|--------|--------|
| Full sign→speech pipeline | < 2 seconds |
| Frame buffer collection | ~1 second (30 frames) |
| LSTM inference | < 50ms |
| HTTP round-trip | < 50ms (localhost) |
| MediaPipe WASM init | ~15 seconds (first load, cached after) |

## 14. Startup Instructions

```bash
# Terminal 1 - Backend
cd backend
python -m venv .venv
.venv/Scripts/activate        # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 2 - Frontend
cd bimsigner1
npm install
npm run dev
# Open http://localhost:3000 in Chrome
```

## 15. Future Enhancements (Out of Scope)

- Continuously expand BIM vocabulary with more domain-specific signs
- Real-time 3D avatar generation (replace pre-recorded clips)
- Mobile responsive layout
- Multi-language support (Malay, English, Mandarin)
- Session recording and analytics dashboard
- WebSocket for lower-latency streaming predictions
- Integration with MyGov queue management systems
