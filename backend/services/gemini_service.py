from google import genai

from config import settings

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.gemini_api_key)
    return _client


async def gloss_to_sentence(glosses: list[str]) -> str:
    """Convert a list of BIM gloss tokens into a natural Malay sentence."""
    gloss_str = " ".join(glosses)
    prompt = (
        "You are a Bahasa Isyarat Malaysia (BIM) interpreter. "
        "Convert the following BIM gloss tokens into a natural, grammatically correct Malay sentence. "
        "Only return the sentence, nothing else.\n\n"
        f"Gloss: {gloss_str}"
    )
    client = _get_client()
    response = client.models.generate_content(
        model="gemini-2.5-flash-lite",
        contents=prompt,
    )
    return response.text.strip()


async def text_to_bim(text: str) -> tuple[str, list[str]]:
    """Convert spoken Malay text into simplified BIM-friendly output and a list of signs."""
    prompt = (
        "You are a Bahasa Isyarat Malaysia (BIM) translator. "
        "Convert the following spoken Malay text into simplified BIM-friendly output. "
        "Return ONLY a JSON object with two fields:\n"
        '- "bim_text": a simplified Malay sentence suitable for sign language\n'
        '- "signs": an array of individual sign words\n\n'
        "Do not include any markdown formatting or code blocks. Return only the raw JSON.\n\n"
        f"Text: {text}"
    )
    client = _get_client()
    response = client.models.generate_content(
        model="gemini-2.5-flash-lite",
        contents=prompt,
    )

    import json

    result = json.loads(response.text.strip())
    return result["bim_text"], result["signs"]
