from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from schemas import TTSRequest
from services import tts_service
from config import settings

router = APIRouter()


@router.post("/api/tts")
async def text_to_speech(request: TTSRequest):
    if not settings.elevenlabs_api_key or not settings.elevenlabs_voice_id:
        raise HTTPException(status_code=503, detail="ElevenLabs API not configured")

    audio_bytes = await tts_service.synthesize(request.text)
    return Response(content=audio_bytes, media_type="audio/mpeg")
