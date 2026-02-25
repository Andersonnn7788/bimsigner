from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    gemini_api_key: str = ""
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = ""
    model_path: str = "../ActionDetectionforSignLanguage/action.h5"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
