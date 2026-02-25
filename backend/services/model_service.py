import numpy as np
import tensorflow as tf

from config import settings

ACTIONS = ["Encik", "Tolong", "Saya"]

_model: tf.keras.Model | None = None


def load_model() -> None:
    global _model
    _model = tf.keras.models.load_model(settings.model_path)


def is_loaded() -> bool:
    return _model is not None


def predict(landmarks: list[list[float]]) -> tuple[str, float, int]:
    """Predict sign from 30 frames of 1662-dim landmark vectors."""
    if _model is None:
        raise RuntimeError("Model not loaded")

    sequence = np.array(landmarks, dtype=np.float32).reshape(1, 30, 1662)
    prediction = _model.predict(sequence, verbose=0)[0]
    action_index = int(np.argmax(prediction))
    confidence = float(prediction[action_index])
    return ACTIONS[action_index], confidence, action_index
