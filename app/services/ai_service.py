import json
from typing import Any

from google import genai

from app.core.config import settings


class AIService:
    def __init__(self) -> None:
        if not settings.GEMINI_API_KEY:
            raise ValueError("Gemini configuration is missing in .env")

        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_name = "gemini-2.0-flash"

    def process_voice_story(self, audio_file_path: str) -> dict[str, str]:
        prompt = (
            "You are a professional biographer. Listen to this audio of an elderly "
            "person telling a life story. Transcribe it accurately, but remove "
            "stutters, long pauses, and filler words. Preserve their authentic "
            "voice, emotion, and any cultural slang (Hebrew/French/English). "
            "Output a beautiful, titled story in the original language.\n\n"
            "Return valid JSON with exactly these keys:\n"
            '{"suggested_title":"...","cleaned_text":"..."}'
        )

        uploaded_file_name = ""
        try:
            uploaded_file = self.client.files.upload(file=audio_file_path)
            uploaded_file_name = uploaded_file.name or ""
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[uploaded_file, prompt],
            )
        except Exception as exc:  # noqa: BLE001
            raise RuntimeError("Gemini audio processing failed") from exc
        finally:
            if uploaded_file_name:
                try:
                    self.client.files.delete(name=uploaded_file_name)
                except Exception:
                    pass

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
