from fastapi import APIRouter, HTTPException

from schemas import BIMRequest, BIMResponse, GlossRequest, SentenceResponse
from services import gemini_service
from config import settings

router = APIRouter()


@router.post("/api/gloss-to-sentence", response_model=SentenceResponse)
async def gloss_to_sentence(request: GlossRequest):
    if not settings.gemini_api_key:
        raise HTTPException(status_code=503, detail="Gemini API key not configured")

    sentence = await gemini_service.gloss_to_sentence(request.glosses)
    return SentenceResponse(sentence=sentence)


@router.post("/api/text-to-bim", response_model=BIMResponse)
async def text_to_bim(request: BIMRequest):
    if not settings.gemini_api_key:
        raise HTTPException(status_code=503, detail="Gemini API key not configured")

    bim_text, signs = await gemini_service.text_to_bim(request.text)
    return BIMResponse(bim_text=bim_text, signs=signs)
