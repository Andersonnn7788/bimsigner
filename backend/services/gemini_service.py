import logging

from google import genai
from google.genai import types

from config import settings

logger = logging.getLogger(__name__)

_client: genai.Client | None = None

BIM_SYSTEM_INSTRUCTION = (
    "You are a Bahasa Isyarat Malaysia (BIM) interpreter at a Malaysian government service counter. "
    "A deaf person communicates with counter staff using BIM signs.\n\n"
    "BIM grammar rules you must apply:\n"
    "- Topic-comment structure: the topic comes first, then the comment (e.g., KEDAI SAYA PERGI = 'Saya pergi ke kedai')\n"
    "- Function words are dropped: no 'yang', 'di', 'ke', 'dari', 'untuk' in glosses — you must add them\n"
    "- Pronouns may be implied by context or sign directionality\n"
    "- Honorifics like ENCIK, PUAN are forms of address, not subjects — treat as vocatives\n"
    "- Time signs come first: SEMALAM SAYA MAKAN = 'Semalam saya makan'\n\n"
    "Output rules:\n"
    "- Produce exactly ONE natural spoken Malay sentence, polite register (formal 'saya', not 'aku')\n"
    "- The sentence will be spoken aloud to counter staff via TTS, so it must sound natural\n"
    "- Do NOT include labels, quotation marks, or explanations — return the sentence only"
)


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.gemini_api_key)
    return _client


async def gloss_to_sentence(
    glosses: list[str],
    conversation_history: list[dict] | None = None,
) -> str:
    """Convert a list of BIM gloss tokens into a natural Malay sentence."""
    parts: list[str] = []

    if conversation_history:
        parts.append("Recent conversation for context:")
        for msg in conversation_history[-6:]:
            role = "Staff" if msg["sender"] == "staff" else "Deaf person"
            parts.append(f"  {role}: {msg['text']}")
        parts.append("")

    gloss_str = ", ".join(glosses)
    parts.append(f"BIM glosses to convert: {gloss_str}")
    parts.append("Convert these glosses into a natural Malay sentence considering the grammar rules and conversation context.")

    user_prompt = "\n".join(parts)
    logger.info("Gloss-to-sentence prompt: %s", user_prompt)

    client = _get_client()
    response = client.models.generate_content(
        model="gemini-2.5-flash-lite",
        contents=user_prompt,
        config=types.GenerateContentConfig(
            system_instruction=BIM_SYSTEM_INSTRUCTION,
            temperature=0.3,
            max_output_tokens=150,
        ),
    )

    text = (response.text or "").strip().strip('"').strip("'")
    if not text:
        logger.warning("Empty Gemini response, falling back to joined glosses")
        text = " ".join(glosses) + "."

    logger.info("Gloss-to-sentence result: %s", text)
    return text


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
