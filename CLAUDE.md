# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BimSigner is a BIM (Bahasa Isyarat Malaysia) sign language application with three components:
- **bimsigner1/**: Next.js 16 web frontend (React 19, shadcn/ui, TypeScript, Tailwind CSS v4)
- **backend/**: FastAPI Python backend (inference, Gemini API, TTS)
- **training/**: Python scripts for collecting sign data and training the LSTM model
- **models/**: Shared directory for trained model artifacts (`.h5` files)

## Commands

### Frontend (bimsigner1/)

```bash
cd bimsigner1
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint (flat config, eslint-config-next with core-web-vitals + typescript)
```

### Backend (backend/)

```bash
cd backend
.venv\Scripts\activate       # Windows
uvicorn main:app --reload --ws websockets-sansio  # Start FastAPI dev server
# Or: python main.py                               # Uses uvicorn.run() with same config
```

### Training Pipeline (training/)

```bash
cd training
python -m venv .venv && .venv\Scripts\activate && pip install -r requirements.txt
python collect_data.py       # Collect BIM sign data via webcam (saves to MP_Data/)
python train_model.py        # Train LSTM model (saves to models/action.h5)
python test_realtime.py      # Verify model locally with webcam
```

## Architecture

### Next.js App (bimsigner1/)
- Uses the **App Router** (`src/app/` directory)
- **React Compiler** is enabled (`reactCompiler: true` in next.config.ts)
- COOP/COEP headers configured in `next.config.ts` (required for MediaPipe WebAssembly)
- All components are client-side (`"use client"`)
- **Tailwind CSS v4** via PostCSS (not the older config-based setup — styles use `@import "tailwindcss"` and `@theme inline` in globals.css)
- Fonts: Geist Sans and Geist Mono loaded via `next/font/google`
- Path alias: `@/*` maps to `./src/*`
- TypeScript strict mode enabled

### Frontend-Backend Communication
- **HTTP endpoints**: `/api/predict`, `/api/gloss-to-sentence`, `/api/tts`, `/api/text-to-bim`, `/api/health`
- **WebSocket**: `ws://127.0.0.1:8000/ws/detect` for real-time sign detection (base64 JPEG frames → predictions)
- API base URL configured via `NEXT_PUBLIC_API_URL` in `.env.local`
- API client functions in `src/lib/api.ts`

### Stage Machine Flow
- Cycle: `SIGNING → TRANSLATING → SPEAKING → LISTENING → AVATAR → SIGNING`
- Managed by `useReducer` in `page.tsx` with reducer from `src/lib/stageMachine.ts`
- Auto-transitions trigger API calls on stage entry (e.g., entering TRANSLATING calls `glossToSentence`)

### UI Layout
- 3-column fixed viewport: CameraPanel (34%) | AvatarPanel (33%) | OfficerControls (33%)
- Header (h-11) + RecognitionBar (h-14) bottom strip
- Design system reference: `SKILL.md` at project root
- shadcn/ui components installed: button, badge, card, progress, scroll-area, separator

### Dual MediaPipe Strategy
- **Local (browser)**: `useMediaPipe` hook — visualization only via `@mediapipe/tasks-vision`
- **Backend**: `HolisticDetector` in `mediapipe_service.py` — keypoint extraction for LSTM inference
- Both produce 1662-dim vectors; backend masks face landmarks [132:1536] to zeros

### WebSocket Detection Pipeline
- Max 3 concurrent connections
- 30-frame sliding buffer → LSTM prediction
- Temporal smoothing: 5 consecutive identical predictions required
- Per-connection MediaPipe state
- CPU-bound work offloaded via `asyncio.to_thread()`

### Backend (backend/)
- FastAPI with Pydantic settings loaded from `.env`
- Model path: `../models/action.h5` (relative to backend/)
- **External services**:
  - Gemini 2.5 Flash Lite — gloss→sentence and text→BIM translation
  - ElevenLabs — Malay TTS (eleven_multilingual_v2)
  - API keys in `backend/.env`

### Critical Sync Constraint
- ACTIONS list order hardcoded in `training/config.py` AND `backend/services/model_service.py` — **must match exactly**
- Face landmark masking [132:1536] applied identically in training (`train_model.py`) and inference (`model_service.py`, `mediapipe_service.py`)

### Training Pipeline (training/)
- `config.py`: Shared constants (ACTIONS, paths, sequence params)
- `utils.py`: MediaPipe helpers (detection, keypoint extraction, landmark drawing)
- `collect_data.py`: Webcam data collection → `MP_Data/{action}/{sequence}/{frame}.npy`
- `train_model.py`: 3-layer LSTM training with EarlyStopping → `models/action.h5`
- `test_realtime.py`: Local webcam inference test with temporal smoothing
- Model input: 30 frames × 1662 keypoints (pose 132 + face 1404 + hands 126)

### Models (models/)
- Shared artifact directory for trained `.h5` files
- `.h5` files are gitignored; `.gitkeep` keeps the directory tracked
