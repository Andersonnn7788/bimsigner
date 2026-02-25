from pydantic import BaseModel


class PredictRequest(BaseModel):
    landmarks: list[list[float]]  # 30 frames × 1662 floats each


class PredictResponse(BaseModel):
    sign: str
    confidence: float
    action_index: int
    confidences: list[float]


class GlossRequest(BaseModel):
    glosses: list[str]


class SentenceResponse(BaseModel):
    sentence: str


class TTSRequest(BaseModel):
    text: str


class BIMRequest(BaseModel):
    text: str


class BIMResponse(BaseModel):
    bim_text: str
    signs: list[str]
