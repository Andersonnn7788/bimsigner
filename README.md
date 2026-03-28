# BimSigner — Real-Time BIM Sign Language Communication Bridge

> Breaking the communication barrier between deaf BIM users and government services using AI-powered sign language recognition.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-green)](https://fastapi.tiangolo.com)
[![Gemini](https://img.shields.io/badge/Google_AI-Gemini_2.5_Flash_Lite-blue)](https://ai.google.dev)
[![Google Maps](https://img.shields.io/badge/Google_Maps-API-red)](https://developers.google.com/maps)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-Keras-orange)](https://tensorflow.org)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-yellow)](https://firebase.google.com)

---

## The Problem

Roughly **44,000 deaf Malaysians** communicate primarily through **Bahasa Isyarat Malaysia (BIM)** — a fully distinct language with its own grammar, vocabulary, and structure. Yet when they visit government counters, hospitals, or public offices, they face an invisible wall: no staff member is trained in BIM, and no bridge exists between their language and the spoken Bahasa Malaysia used by officers.

This is not just inconvenient — it is a fundamental inequality.

### UN Sustainable Development Goal Alignment

| SDG | Relevance |
|-----|-----------|
| **SDG 10 — Reduced Inequalities** | Deaf Malaysians are systematically excluded from accessing equal public services due to the communication gap |
| **SDG 3 — Good Health & Well-being** | In healthcare settings, miscommunication can be life-threatening. Deaf patients cannot describe symptoms or understand diagnoses |
| **SDG 16 — Peace, Justice & Strong Institutions** | Equal access to government institutions (police, JPJ, immigration) is a fundamental right denied by the absence of sign language support |

BimSigner directly addresses all three SDGs by deploying AI to demolish the language barrier at the point of service.

---

## Our Solution

BimSigner is a **real-time, AI-powered communication bridge** deployed at government service counters. It gives deaf BIM users a voice — and gives officers the ability to understand and respond in plain language.

The system consists of four tightly integrated modules:

| Module | Function |
|--------|----------|
| **Sign Recognition** | Webcam captures BIM gestures → LSTM model identifies signs in real time |
| **AI Translation** | Gemini converts sign tokens (glosses) into grammatically correct Malay sentences |
| **Officer Interface** | Officer speaks; TTS converts their response into BIM-friendly simplified text |
| **3D BIM Sign Avatar** | Officer's spoken Malay → Gemini generates a BIM gloss sequence → avatar renders the signed gestures back to the deaf user |

Unlike one-way assistive tools, BimSigner completes the **full bidirectional communication loop**. The sign language avatar gives deaf users a visual BIM response in return — removing the need for officers to know sign language in either direction.

---

## User Research & Iteration

We conducted interviews and observations with a BIM sign language interpreter, deaf users and government counter officers. Three key insights shaped our entire design:

### Insight 1: Government staff have zero BIM training
**Finding:** Not a single counter officer we interviewed had received any BIM training. They resorted to writing notes, miming, or asking hearing companions to translate.

**How we iterated:** We designed BimSigner to require **zero BIM knowledge from the officer**. The AI handles all translation automatically, so officers only see natural Malay output on their screen.

### Insight 2: Deaf users feel unsafe and anxious going to government buildings alone
**Finding:** Deaf users described feeling deeply vulnerable in public spaces — especially in emergencies or unfamiliar institutions. Without a companion, they had no way to communicate. Several had actively avoided important government appointments because of this anxiety. The situation becomes critical in emergencies where rapid communication is life-saving.

**How we iterated:** We built the **Check-in Page** — a pre-visit tool where users can register their intent and profile upon reaching the counter, dramatically reducing uncertainty. We also added the **Locations Directory** with deaf-friendly facility information so users can research accessibility and services before they travel.

### Insight 3: Deaf users cannot easily read complex Bahasa Malaysia
**Finding:** BIM grammar (topic-comment structure, no tense inflection, different word order) and glosses are fundamentally different from standard written Bahasa Malaysia. Most deaf users are native BIM speakers for whom written Malay is a second, difficult language. Standard government documents and counter responses are largely inaccessible to them.

**How we iterated:** We instructed Gemini to translate officer responses into **BIM-friendly simplified text** — short sentences & glosses, plain vocabulary, BIM-compatible word order — displayed prominently on the deaf-facing interface. This bridges the written language gap without requiring the officer to know BIM.

---

## AI Integration

### Google AI: Gemini 2.5 Flash Lite

BimSigner uses **Google Gemini 2.5 Flash Lite** (via Google AI Studio) as its core language intelligence layer. Gemini powers three critical AI functions across the application:

#### 1. Gloss-to-Sentence Translation
BIM recognition produces raw **gloss tokens** (e.g., `["Encik", "Tolong", "Saya"]`) — the structural skeleton of a sentence, stripped of grammar. Standard language models cannot reliably reconstruct grammatically correct Malay from these tokens because they lack knowledge of BIM's unique linguistic rules.

**We chose Gemini because** its advanced instruction-following capability and multilingual understanding allow us to encode BIM-specific grammar rules (topic-comment structure, honorific insertion, function word recovery) directly in the system prompt. **This allows** the model to convert raw gloss tokens like `["Encik", "Tolong", "Saya"]` into a natural, professional sentence like *"Encik, tolong bantu saya"* — **leading to** officers receiving fully readable, contextually appropriate requests rather than fragmented keywords that create confusion.

#### 2. Text-to-BIM Simplification
When officers respond verbally, their speech is transcribed and sent to Gemini, which simplifies the Malay sentence into BIM-compatible plain output — short, direct, and structured for BIM comprehension.

**We chose Gemini because** while ElevenLabs TTS handles audio output for the hearing officer side, deaf users need a visual response in their own language. Gemini's generation quality and configurable low temperature (0.3) ensure consistent, deterministic output — **leading to** an ordered BIM gloss sequence (e.g., `["RUMAH", "PERGI", "BUKA"]`) that is passed directly to the sign language avatar, which renders each sign as an animated gesture in the centre panel and completes the return channel of the communication bridge.

#### 3. Check-in Intent Prediction
On the check-in page, Gemini analyses a visitor's profile, past visit history, and contextual signals to intelligently predict the most likely purpose of the current visit.

**We chose Gemini because** intent prediction from unstructured visit history requires nuanced contextual reasoning that rule-based systems cannot provide. **This allows** the system to surface the most probable visit intent with a confidence score before the visitor even reaches the counter — **leading to** shorter service times, reduced officer confusion, and a more confident, prepared experience for deaf visitors.

```
Model:       gemini-2.5-flash-lite
Temperature: 0.3
Max tokens:  150
API:         Google AI Studio (google-genai SDK)
```

---

## Google Technologies

| Technology | Role in BimSigner | Why Google |
|------------|-------------------|------------|
| **Gemini 2.5 Flash Lite** (Google AI Studio) | Core AI: BIM gloss→sentence, text→BIM simplification, and check-in intent prediction | Best-in-class multilingual instruction following; reliably handles BIM grammar rules at low latency |
| **MediaPipe** (Google) | Real-time holistic pose estimation — extracts 1662-dimensional hand, body, and face landmark vectors per frame | GPU-accelerated landmark detection; dual deployment in-browser (WASM) and server-side (Python) |
| **TensorFlow / Keras** (Google) | LSTM model training and inference for BIM sign classification | Native integration with MediaPipe outputs; robust LSTM support; fully on-device inference |
| **Google Maps API** | Interactive map of deaf-accessible government locations across Malaysia | Native place data, directions, and category filtering |
| **Firebase Firestore** | Visitor profile storage, visit history, and real-time check-in records | Real-time sync, offline support, and seamless Next.js integration |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BimSigner System                             │
│                                                                     │
│  ┌────────────────┐    WebSocket     ┌───────────────────────────┐  │
│  │  Next.js 16    │◄────────────────►│    FastAPI Backend        │  │
│  │  (React 19)    │                  │                           │  │
│  │                │  HTTP REST API   │  ┌─────────────────────┐  │  │
│  │  / Main Page   │◄────────────────►│  │  MediaPipe Service  │  │  │
│  │  /checkin      │                  │  │  (Google MediaPipe) │  │  │
│  │  /locations    │                  │  └─────────┬───────────┘  │  │
│  │                │                  │            │ 1662-dim     │  │
│  │  MediaPipe     │                  │  ┌─────────▼───────────┐  │  │
│  │  (browser,     │                  │  │  LSTM Model Service │  │  │
│  │   Google WASM) │                  │  │  (TensorFlow/Keras) │  │  │
│  │                │                  │  └─────────┬───────────┘  │  │
│  │  Google Maps   │                  │            │ gloss tokens │  │
│  │  API           │                  │  ┌─────────▼───────────┐  │  │
│  └────────────────┘                  │  │   Gemini Service    │  │  │
│                                      │  │  (Google AI Studio) │  │  │
│           Firebase Firestore         │  └─────────┬───────────┘  │  │
│         (Profiles, Visit History,    │            │ Malay text   │  │
│          Check-in Records)           │  ┌─────────▼───────────┐  │  │
│                                      │  │   TTS Service       │  │  │
│                                      │  │   (ElevenLabs)      │  │  │
│                                      │  └─────────────────────┘  │  │
│                                      └───────────────────────────┘  │
│  ┌────────────────┐                                                 │
│  │  Training      │                                                 │
│  │  Pipeline      │                                                 │
│  │  MediaPipe +   │                                                 │
│  │  TF/Keras LSTM │                                                 │
│  └────────────────┘                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility |
|-----------|---------------|
| **Next.js Frontend** | 3-panel UI: CameraPanel (sign input), AvatarPanel (BIM gesture output/return channel), OfficerControls; Google Maps; WebSocket client; check-in flow |
| **FastAPI Backend** | WebSocket sign detection server; REST API orchestration; MediaPipe + LSTM + Gemini + TTS coordination |
| **MediaPipe Service** | Per-frame holistic landmark extraction → 1662-dim feature vectors; CPU work offloaded via `asyncio.to_thread()` |
| **LSTM Model Service** | 30-frame sliding window inference; per-class confidence thresholds; majority-vote temporal smoothing; confusion-pair disambiguation (Encik/Puan, Tolong/Renew) |
| **Gemini Service** | BIM gloss-to-sentence; Malay-to-BIM gloss sequence generation (drives avatar); check-in intent prediction with confidence scoring |
| **Avatar Renderer** | Receives BIM gloss sequence from Gemini; renders signed gesture animations in the AvatarPanel; overlays live sign badges per active gloss |
| **TTS Service** | Malay text-to-speech for officer-facing audio output (ElevenLabs multilingual v2) |
| **Firebase Firestore** | Visitor profile storage; visit history records; real-time check-in state |
| **Training Pipeline** | Webcam data collection → MediaPipe feature extraction → LSTM training (EarlyStopping, ReduceLROnPlateau, ModelCheckpoint, TensorBoard) → model export → evaluation (confusion matrix, per-class metrics, latency benchmark) |

### Bidirectional Communication Flow

```
[Deaf User signs]
      ↓
 CameraPanel → WebSocket → MediaPipe → LSTM → gloss tokens
                                                    ↓
                                             Gemini (gloss→sentence)
                                                    ↓
                                         Officer hears (ElevenLabs TTS)
                                                    ↓
                                           Officer speaks response
                                                    ↓
                                         Gemini (text→BIM gloss sequence)
                                                    ↓
                                       Avatar renders signed gestures
                                                    ↓
                                           [Deaf User sees BIM]
```

---

## Features

### Main Page — Real-Time BIM Communication
The primary interface deployed at government service counters. Three-panel layout optimised for simultaneous deaf user and officer interaction:

- **Camera Panel (34%)**: Live webcam feed with MediaPipe landmark overlay, real-time detected sign chips, and confidence HUD
- **Avatar Panel (33%)**: 3D BIM sign language avatar that renders the officer's response as signed gesture animations; active sign badges displayed in real time; full conversation history log below
- **Officer Controls (33%)**: Microphone input, live transcript display, and BIM-simplified officer response

**Full Communication Cycle (SIGNING → TRANSLATING → SPEAKING → LISTENING → AVATAR → SIGNING):**
1. Webcam frames are streamed via WebSocket to the FastAPI backend
2. MediaPipe extracts 1662 holistic landmarks per frame (pose + face + hands)
3. 30-frame sequences are fed into the LSTM model; majority-vote temporal smoothing with per-class confidence thresholds and confusion-pair disambiguation confirms each sign
4. Confirmed gloss tokens are sent to Gemini, which reconstructs a grammatically correct Malay sentence
5. ElevenLabs TTS plays the sentence aloud for the officer
6. Officer speaks their response; speech is transcribed in real time
7. Transcription is sent to Gemini (`/api/text-to-bim`), which generates an ordered BIM gloss sequence
8. The avatar renders each sign as an animated gesture in the centre panel, with live sign badges overlaid
9. Cycle returns to SIGNING for the next deaf user input

### Avatar — 3D BIM Sign Language Renderer

The sign language avatar is the critical return channel that makes BimSigner a true communication bridge rather than a one-way transcription tool. It ensures the deaf user receives the officer's response in BIM — their native language — without requiring the officer to know a single sign.

**How it works:**
- The officer's spoken response is transcribed and sent to Gemini (`/api/text-to-bim`)
- Gemini 2.5 Flash Lite converts the sentence into a BIM-ordered gloss sequence and a simplified Malay caption
- The avatar renders the signed gesture sequence in the centre panel, sign by sign, with gloss badges overlaid to reinforce comprehension
- On completion, the system returns to SIGNING — ready for the next round of interaction

**Why this matters:** Without the avatar, a deaf user could communicate to the officer but receive no response in BIM. The avatar eliminates the asymmetry and closes the loop entirely — both parties communicate in their own language, with AI bridging every step.

### Check-in Page — AI-Powered Pre-Visit Intent Prediction
A pre-visit tool that reduces anxiety and wait times by letting visitors(deaf) register and declare intent upon reaching the counter:

- Visitor profile card with Firebase-synced visit history
- **Gemini 2.5 Flash Lite** analyses visit history and context to predict the most likely purpose of the current visit
- AI-generated confidence scores and alternative intent options for the visitor to confirm
- Deaf-friendly confirmation popup with large, plain-language CTA designed for low written Malay literacy

### Locations Page — Deaf-Accessible Government Directory
A searchable directory of government service locations with real-time map integration:

- 12+ government locations (Balai Polis, JPJ, Hospital) across Malaysia
- Live **Google Maps** with category-coloured AdvancedMarker pins
- Deaf facility information (sign interpreter availability, accessibility features)
- One-tap directions via Google Maps for pre-trip planning

---

## Technical Implementation & Challenges

### Challenge 1: Ensuring Exact Training-Inference Consistency

**The problem:** MediaPipe's holistic model produces 1662 landmarks (pose 132 + face 1404 + hands 126). Raw face landmarks introduce significant noise for BIM sign classification, as facial expressions are not part of BIM signing. If the masking applied during training differs even slightly from inference, the model silently produces wrong class predictions — a subtle but catastrophic failure mode.

**Our solution:** We hardcoded an identical face landmark masking operation (`landmarks[132:1536] = 0`) across three separate files that must remain in sync:
- `training/train_model.py` — applied at training time
- `backend/services/model_service.py` — applied at inference time
- `backend/services/mediapipe_service.py` — applied during feature extraction

The `ACTIONS` class label list is also hardcoded identically in `training/config.py` and `backend/services/model_service.py`. A mismatch in either would produce silent misclassification.

**Outcome:** Consistent 1662-dimensional input vectors across the full pipeline, enabling reliable sign classification.

### Challenge 2: Real-Time WebSocket Stability Under MediaPipe Load

**The problem:** MediaPipe holistic inference is CPU-bound. Running it synchronously inside FastAPI's async event loop caused frame drops and WebSocket disconnections when multiple users connected simultaneously.

**Our solution:** All MediaPipe processing is offloaded via `asyncio.to_thread()`, keeping the event loop non-blocking. We enforce a maximum of 3 concurrent WebSocket connections with per-connection isolated MediaPipe state to prevent cross-contamination of landmark buffers.

### Challenge 3: BIM Grammar Reconstruction from Gloss Tokens

**The problem:** BIM grammar differs fundamentally from Bahasa Malaysia — topic-comment structure, dropped function words, no tense marking. Simply joining gloss tokens produces unnatural, unprofessional output that undermines the communication bridge.

**Our solution:** We engineered a Gemini system prompt that encodes BIM linguistic rules explicitly, including honorific insertion (`Encik`/`Puan`), function word recovery (`tolong`, `boleh`), and topic-first ordering. The low temperature (0.3) ensures deterministic, professional output on every call.

### Challenge 4: Accurate Detection Despite Confused Sign Pairs

**The problem:** Our evaluation pipeline revealed that visually similar sign pairs (Encik/Puan, Tolong/Renew) confused the LSTM model, and several signs required different confidence thresholds to avoid false positives. Naive temporal smoothing with a single global threshold produced unreliable detections for these edge cases.

**Our solution:** We built a multi-layered post-processing pipeline in the WebSocket detection server (`ws_detect.py`):
- **Per-class confidence thresholds** — each of the 13 signs has a tuned minimum confidence floor derived from evaluation metrics, replacing the single global threshold
- **Confusion-pair disambiguation** — when the model's top-2 predictions are a known confused pair (e.g., Encik vs Puan), additional score-gap and ratio checks disambiguate the prediction
- **Majority-vote smoothing windows** — instead of requiring N consecutive identical predictions, a sliding window tallies votes and requires a supermajority, tolerating occasional frame-level noise
- **Sequence-context boosting** — expected next signs in the conversation flow receive a small confidence boost, improving accuracy in real dialogue
- **Early prediction** — inference begins from 15 frames (zero-padded to 30) for faster response, with full 30-frame confirmation following

**Outcome:** This train → evaluate → engineer iteration loop significantly improved real-world detection reliability beyond raw model accuracy, demonstrating that post-processing intelligence is as critical as model training.

---

## Model Evaluation

We built a comprehensive evaluation pipeline (`training/evaluate.py`) that generates publication-quality metrics and artifacts for every trained model.

### Results Summary

| Metric | Value |
|--------|-------|
| Test Accuracy | 83.1% (59 test samples) |
| Macro F1-Score | 0.81 |
| Weighted F1-Score | 0.80 |
| Mean Inference Latency | 75.6 ms |
| P95 Inference Latency | 102.1 ms |
| Signs at Perfect F1 (1.00) | 7 / 13 |

### Per-Class Performance

| Sign | Precision | Recall | F1-Score | Status |
|------|-----------|--------|----------|--------|
| Idle | 1.00 | 1.00 | 1.00 | Perfect |
| Hai | 0.56 | 1.00 | 0.71 | High recall, precision improving |
| Saya | 1.00 | 1.00 | 1.00 | Perfect |
| Encik | 0.50 | 0.40 | 0.44 | Confused with Puan — mitigated by disambiguation |
| Puan | 0.57 | 0.80 | 0.67 | Confused with Encik — mitigated by disambiguation |
| Tolong | 1.00 | 0.75 | 0.86 | Strong |
| Terima Kasih | 1.00 | 1.00 | 1.00 | Perfect |
| Nama | 1.00 | 1.00 | 1.00 | Perfect |
| Nombor | 1.00 | 1.00 | 1.00 | Perfect |
| Tunggu | 1.00 | 1.00 | 1.00 | Perfect |
| Mana | 0.00 | 0.00 | 0.00 | Data-starved — priority for Phase 2 |
| Borang | 1.00 | 1.00 | 1.00 | Perfect |
| Renew | 0.83 | 1.00 | 0.91 | Strong |

**Key findings:** 7 of 13 signs achieve perfect classification. The Encik/Puan confusion pair is addressed by the disambiguation logic in Challenge 4. Mana requires additional training data — a priority for Phase 2 vocabulary expansion.

### Evaluation Artifacts

The evaluation pipeline generates the following artifacts in `training/eval_outputs/`:

| Artifact | Description |
|----------|-------------|
| `confusion_matrix.png` | Confusion matrix with raw counts |
| `confusion_matrix_normalized.png` | Confusion matrix normalized by recall (%) |
| `training_curves.png` | Loss and accuracy curves over epochs |
| `classification_report.txt` | Per-class precision, recall, and F1-score |
| `classification_report.csv` | Machine-readable version of the classification report |
| `evaluation_summary.txt` | Complete evaluation summary with all metrics |
| `inference_latency.txt` | Latency benchmark (mean, median, P95, P99) |
| `model_summary.txt` | Keras model architecture and parameter count |
| `training_history.json` | Full training history for curve reproduction |

---

## Success Metrics

| Metric | Current | Target (Phase 2) |
|--------|---------|-----------------|
| Sign recognition accuracy | 83% (59 test samples) | >90% |
| BIM signs in vocabulary | 13 signs (including Idle) | 50+ signs |
| Signs at perfect F1 (1.00) | 7 / 13 | 40+ / 50+ |
| Inference latency (mean) | 75.6 ms | <50 ms |
| Avg. transaction time | Baseline established | <5 min (vs. 20+ min today) |
| Government institution types supported | 3 (Police, JPJ, Hospital) | 10 |
| Active Firebase user profiles | Deployed | Multi-institution scale |
| Locations in directory | 12 | 50+ nationwide |

---

## Roadmap

### Phase 1 — Core Communication Bridge (Current)
- [x] Real-time BIM sign detection (13 BIM signs)
- [x] Gemini-powered gloss-to-sentence translation
- [x] Officer TTS audio output (Malay)
- [x] 3D BIM sign language avatar (return channel for officer→deaf communication)
- [x] Gemini-powered text-to-BIM gloss sequence generation
- [x] Gemini-powered check-in intent prediction
- [x] Firebase profile & visit history storage
- [x] Google Maps deaf-accessible locations directory
- [x] Comprehensive model evaluation pipeline (confusion matrix, per-class metrics, latency benchmark)
- [x] Advanced detection post-processing (per-class thresholds, confusion-pair disambiguation, majority-vote smoothing)

### Phase 2 — Expanded Vocabulary & Reach
- [ ] Expand LSTM vocabulary to 50+ BIM signs
- [ ] Mobile/tablet-responsive layout for counter deployment
- [ ] Offline-capable inference (TensorFlow.js)
- [ ] Push notifications for check-in queue updates

### Phase 3 — Institution-Scale Deployment
- [ ] Multi-institution rollout (JPJ, Hospital, Immigration, LHDN)
- [ ] Officer-facing BimSigner onboarding module
- [ ] Android app for deaf users (Google Android Studio)
- [ ] Anonymised interaction data for continuous model improvement

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui |
| Backend | FastAPI (Python), Uvicorn, WebSockets |
| AI (Google) | Gemini 2.5 Flash Lite (Google AI Studio) |
| ML (Google) | TensorFlow/Keras LSTM, MediaPipe 0.10.14 |
| Maps (Google) | Google Maps API (`@vis.gl/react-google-maps`) |
| Database (Google) | Firebase Firestore |
| TTS | ElevenLabs `eleven_multilingual_v2` |
| Training | MediaPipe + NumPy + Keras (EarlyStopping, ReduceLROnPlateau, ModelCheckpoint, TensorBoard) |
| Evaluation | scikit-learn + seaborn + matplotlib |

---

## Local Development Setup

### Prerequisites
- Node.js 18+, Python 3.10+, Webcam

### Frontend
```bash
cd bimsigner1
npm install
# .env.local:
# NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key
npm run dev   # → http://localhost:3000
```

### Backend
```bash
cd backend
python -m venv .venv && .venv/Scripts/activate
pip install -r requirements.txt
# .env:
# GEMINI_API_KEY=your_key
# ELEVENLABS_API_KEY=your_key
# ELEVENLABS_VOICE_ID=your_voice_id
uvicorn main:app --reload --ws websockets-sansio
```

### Training (optional — model artifact included)
```bash
cd training
python collect_data.py   # Collect BIM sign data via webcam
python train_model.py    # Train LSTM → models/action.h5
python evaluate.py       # Evaluate model → eval_outputs/ (confusion matrix, metrics, latency)
```

---

## Project Structure

```
bimsigner/
├── bimsigner1/               # Next.js 16 frontend
│   └── src/
│       ├── app/
│       │   ├── page.tsx               # Main sign recognition page
│       │   ├── checkin/page.tsx       # AI-powered check-in
│       │   └── locations/page.tsx     # Google Maps directory
│       ├── components/                # CameraPanel, AvatarPanel, OfficerControls, etc.
│       │   ├── checkin/               # ProfilePanel, HistoryPanel, IntentConfirmCard
│       │   └── locations/             # LocationListPanel, MapPanel
│       ├── hooks/                     # useDetectionSocket, useMediaPipe, useSpeechRecognition, etc.
│       ├── lib/                       # API client, stage machine, constants, mock data
│       └── types/                     # TypeScript interfaces
├── backend/                  # FastAPI Python backend
│   ├── routers/               # predict, gemini, tts, ws_detect
│   ├── services/              # mediapipe_service, model_service, gemini_service, tts_service
│   └── main.py
├── training/                 # LSTM training & evaluation pipeline
│   ├── collect_data.py        # Webcam data collection
│   ├── train_model.py         # LSTM training with callbacks
│   ├── evaluate.py            # Model evaluation → eval_outputs/
│   ├── test_realtime.py       # Local webcam inference test
│   ├── utils.py               # MediaPipe helpers & landmark utilities
│   ├── config.py              # ACTIONS list — must match backend exactly
│   └── eval_outputs/          # Confusion matrices, metrics, latency benchmarks
└── models/                   # Trained .h5 model artifacts
```

---

*Built for Kitahack 2026 — addressing SDG 10, SDG 3, and SDG 16 through AI-powered sign language accessibility in Malaysian public services.*
