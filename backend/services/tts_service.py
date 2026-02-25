import httpx

from config import settings

ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech"


async def synthesize(text: str) -> bytes:
    """Send text to ElevenLabs TTS and return audio bytes (mp3)."""
    url = f"{ELEVENLABS_API_URL}/{settings.elevenlabs_voice_id}"
    headers = {
        "xi-api-key": settings.elevenlabs_api_key,
        "Content-Type": "application/json",
    }
    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload, headers=headers, timeout=30.0)
        response.raise_for_status()
        return response.content
