from fastapi import APIRouter, HTTPException

from schemas import PredictRequest, PredictResponse
from services import model_service

router = APIRouter()


@router.post("/api/predict", response_model=PredictResponse)
async def predict(request: PredictRequest):
    if not model_service.is_loaded():
        raise HTTPException(status_code=503, detail="Model not loaded")

    if len(request.landmarks) != 30:
        raise HTTPException(status_code=400, detail="Expected 30 frames of landmarks")

    for i, frame in enumerate(request.landmarks):
        if len(frame) != 1662:
            raise HTTPException(
                status_code=400,
                detail=f"Frame {i} has {len(frame)} values, expected 1662",
            )

    sign, confidence, action_index = model_service.predict(request.landmarks)
    return PredictResponse(sign=sign, confidence=confidence, action_index=action_index)
