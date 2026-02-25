from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services import model_service
from routers import predict, gemini, tts


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load the LSTM model on startup
    try:
        model_service.load_model()
        print("Model loaded successfully")
    except Exception as e:
        print(f"Warning: Could not load model: {e}")
    yield


app = FastAPI(title="BIM Signer API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict.router)
app.include_router(gemini.router)
app.include_router(tts.router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "model_loaded": model_service.is_loaded()}
