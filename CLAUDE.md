# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BimSigner is a BIM (Bahasa Isyarat Malaysia) sign language application with three components:
- **bimsigner1/**: Next.js 16 web frontend (React 19, TypeScript, Tailwind CSS v4)
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
uvicorn main:app --reload    # Start FastAPI dev server
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
- **Tailwind CSS v4** via PostCSS (not the older config-based setup — styles use `@import "tailwindcss"` and `@theme inline` in globals.css)
- Fonts: Geist Sans and Geist Mono loaded via `next/font/google`
- Path alias: `@/*` maps to `./src/*`
- TypeScript strict mode enabled

### Backend (backend/)
- FastAPI with Pydantic settings loaded from `.env`
- Model path: `../models/action.h5` (relative to backend/)
- ACTIONS list in `services/model_service.py` must match `training/config.py` order

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
