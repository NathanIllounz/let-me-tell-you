import json
import time
from pathlib import Path
from typing import Any

from google import genai
from google.genai import types as genai_types
from google.genai.errors import ClientError

from app.core.config import settings

_GEMINI_RATE_LIMIT_RETRIES = 3

# Gemini File API + multimodal: correct MIME helps ingestion (esp. m4a/webm).
_AUDIO_MIME_BY_SUFFIX: dict[str, str] = {
    ".wav": "audio/wav",
    ".wave": "audio/wav",
    ".mp3": "audio/mpeg",
    ".mpeg": "audio/mpeg",
    ".mp4": "audio/mp4",
    ".m4a": "audio/mp4",
    ".aac": "audio/aac",
    ".ogg": "audio/ogg",
    ".oga": "audio/ogg",
    ".opus": "audio/opus",
    ".webm": "audio/webm",
    ".flac": "audio/flac",
}


def _mime_type_for_audio_path(file_path: str) -> str | None:
    suffix = Path(file_path).suffix.lower()
    return _AUDIO_MIME_BY_SUFFIX.get(suffix)


def _validate_audio_file(file_path: str) -> None:
    path = Path(file_path)
    if not path.is_file():
        raise RuntimeError("Audio path is not a readable file")
    if path.stat().st_size == 0:
        raise RuntimeError("Audio file is empty")


def _is_too_many_requests(exc: ClientError) -> bool:
    if getattr(exc, "code", None) == 429:
        return True
    msg = (getattr(exc, "message", None) or str(exc)).lower()
    return "too many requests" in msg or "resource_exhausted" in msg


def _rate_limit_delay_seconds(attempt_index: int) -> float:
    """Short backoff: ~1s, 2s, 4s (capped) so the terminal shows a brief pause."""
    return min(1.0 * (2**attempt_index), 8.0)


class GeminiRateLimitError(Exception):
    """Raised when the Gemini API returns 429 after retry/backoff attempts."""


class AIService:
    def __init__(self) -> None:
        if not settings.GEMINI_API_KEY:
            raise ValueError("Gemini configuration is missing in .env")

        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        # Stable multimodal (incl. audio) on the Gemini API.
        self.model_name = "gemini-2.5-flash"


    def process_voice_story(self, audio_file_path: str, language: str = "English", literal_transcription: bool = False) -> dict[str, str]:
        _validate_audio_file(audio_file_path)

        if literal_transcription:
            prompt = f"""You are a professional, highly accurate transcriptionist.
Your goal is to transcribe the raw speech in the audio exactly as spoken. 
CRITICAL INSTRUCTION: The final output MUST strictly be written in {language}. If the original audio is in a different language, translate it faithfully and literally without adding narrative flair.

STYLE GUIDELINES:
1. Do not embellish, summarize, or rewrite the content into a story.
2. Maintain the raw, unfiltered spoken words as much as possible.
3. Provide a very basic, short descriptive title based on the content.

Return valid JSON with exactly two keys: 'suggested_title' and 'cleaned_text'.
"""
        else:
            prompt = f"""You are a world-class memoir ghostwriter.
Your goal is to transform raw, rambling speech (detect the source language automatically) into a polished, first-person narrative memoir.
CRITICAL INSTRUCTION: The final output MUST strictly be translated and written in {language}. 

STYLE GUIDELINES:
1. Preserve the "Voice" of a warm, wise, elderly person lovingly telling a precious life story to their grandchildren. The tone should be deeply emotional, nostalgic, and heartfelt.
2. Strictly remove all filler words, self-corrections (e.g., 'it was 85, no 86'), and verbal stumbles.
3. Combine repetitive thoughts into elegant sentences, focusing heavily on sensory details and emotions.
4. The final output should read like a beautifully published book.

PUNCTUATION GUIDELINES:
If the target language is Hebrew (or any RTL language), absolutely DO NOT mix in English/LTR punctuation. Use strictly native punctuation to prevent breaking the Right-to-Left formatting flow.

Return valid JSON with exactly two keys: 'suggested_title' and 'cleaned_text'.
"""

        mime = _mime_type_for_audio_path(audio_file_path) or "audio/mp3"
        with open(audio_file_path, "rb") as f:
            audio_data = f.read()

        audio_part = genai_types.Part.from_bytes(data=audio_data, mime_type=mime)

        response = None
        for attempt in range(_GEMINI_RATE_LIMIT_RETRIES):
            try:
                print("DEBUG: Sending audio to Gemini 2.5 Flash...", flush=True)
                # Order: audio first, then instructions (multimodal convention).
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=[audio_part, prompt],
                    config=genai_types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.4
                    ),
                )
                print("DEBUG: Gemini response received!", flush=True)
                break
            except ClientError as exc:
                if _is_too_many_requests(exc):
                    delay = _rate_limit_delay_seconds(attempt)
                    print(
                        "Warning: Gemini API Too Many Requests (rate limit). "
                        f"Wait ~{delay:.0f}s, then retrying "
                        f"({attempt + 1}/{_GEMINI_RATE_LIMIT_RETRIES})...",
                        flush=True,
                    )
                    if attempt < _GEMINI_RATE_LIMIT_RETRIES - 1:
                        time.sleep(delay)
                        continue
                    raise GeminiRateLimitError(
                        "Gemini generate_content rate limited after retries"
                    ) from exc
                raise RuntimeError("Gemini audio processing failed") from exc

        if response is None:
            raise RuntimeError("Gemini returned no response")

        raw_output = (response.text or "").strip()
        if not raw_output:
            raise RuntimeError("Gemini returned an empty response")

        try:
            parsed = self._parse_json_output(raw_output)
        except Exception as exc:  # noqa: BLE001
            raise RuntimeError("Gemini response format is invalid JSON") from exc

        suggested_title = str(parsed.get("suggested_title", "")).strip()
        cleaned_text = str(parsed.get("cleaned_text", "")).strip()
        if not suggested_title or not cleaned_text:
            raise RuntimeError("Gemini response is missing required fields")

        return {"suggested_title": suggested_title, "cleaned_text": cleaned_text}

    def refine_text_story(self, text: str, language: str = "English") -> dict[str, str]:
        prompt = f"""You are a world-class memoir ghostwriter.
Your goal is to transform raw text entries (detect the source language automatically) into a polished, first-person narrative memoir.
CRITICAL INSTRUCTION: The final output MUST strictly be translated and written in {language}. 

STYLE GUIDELINES:
1. Preserve the "Voice" of a warm, wise, elderly person lovingly telling a precious life story to their grandchildren. The tone should be deeply emotional, nostalgic, and heartfelt.
2. Strictly remove all filler words, self-corrections (e.g., 'it was 85, no 86'), and disorganized stumbles.
3. Combine repetitive thoughts into elegant sentences, focusing heavily on sensory details and emotions.
4. The final output should read like a beautifully published book.

PUNCTUATION GUIDELINES:
If the target language is Hebrew (or any RTL language), absolutely DO NOT mix in English/LTR punctuation. Use strictly native punctuation to prevent breaking the Right-to-Left formatting flow.

Return valid JSON with exactly two keys: 'suggested_title' and 'cleaned_text'.
"""

        response = None
        for attempt in range(_GEMINI_RATE_LIMIT_RETRIES):
            try:
                print("DEBUG: Sending text to Gemini 2.5 Flash...", flush=True)
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=[text, prompt],
                    config=genai_types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.4
                    ),
                )
                print("DEBUG: Gemini response received!", flush=True)
                break
            except ClientError as exc:
                if _is_too_many_requests(exc):
                    delay = _rate_limit_delay_seconds(attempt)
                    print(
                        "Warning: Gemini API Too Many Requests (rate limit). "
                        f"Wait ~{delay:.0f}s, then retrying "
                        f"({attempt + 1}/{_GEMINI_RATE_LIMIT_RETRIES})...",
                        flush=True,
                    )
                    if attempt < _GEMINI_RATE_LIMIT_RETRIES - 1:
                        time.sleep(delay)
                        continue
                    raise GeminiRateLimitError(
                        "Gemini generate_content rate limited after retries"
                    ) from exc
                raise RuntimeError("Gemini text processing failed") from exc

        if response is None:
            raise RuntimeError("Gemini returned no response")

        raw_output = (response.text or "").strip()
        if not raw_output:
            raise RuntimeError("Gemini returned an empty response")

        try:
            parsed = self._parse_json_output(raw_output)
        except Exception as exc:  # noqa: BLE001
            raise RuntimeError("Gemini response format is invalid JSON") from exc

        suggested_title = str(parsed.get("suggested_title", "")).strip()
        cleaned_text = str(parsed.get("cleaned_text", "")).strip()
        if not suggested_title or not cleaned_text:
            raise RuntimeError("Gemini response is missing required fields")

        return {"suggested_title": suggested_title, "cleaned_text": cleaned_text}

    @staticmethod
    def _parse_json_output(raw_output: str) -> dict[str, Any]:
        normalized = raw_output.strip()
        if normalized.startswith("```"):
            normalized = normalized.strip("`")
            if normalized.lower().startswith("json"):
                normalized = normalized[4:].strip()
        return json.loads(normalized)
