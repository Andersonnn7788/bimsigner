import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services import model_service
from routers import predict, gemini, tts, ws_detect

# Configure root logging — DEBUG for our modules, WARNING for noisy libs
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%H:%M:%S",
)
# Silence noisy third-party loggers
for _name in ("uvicorn.access", "multipart", "httpcore"):
    logging.getLogger(_name).setLevel(logging.WARNING)
# Keep uvicorn.error at INFO so startup/shutdown messages are visible

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load the LSTM model on startup
    try:
        logger.info("Loading LSTM model via model_service...")
        model_service.load_model()
        logger.info("Model loaded successfully. ACTIONS=%s", model_service.ACTIONS)
    except Exception as e:
        logger.error("Could not load model: %s", e, exc_info=True)
    yield


app = FastAPI(title="BIM Signer API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict.router)
app.include_router(gemini.router)
app.include_router(tts.router)
app.include_router(ws_detect.router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "model_loaded": model_service.is_loaded()}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, ws="websockets-sansio")
