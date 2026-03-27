from datetime import datetime, timezone
from pathlib import Path
from typing import BinaryIO
from uuid import uuid4

from supabase import Client, create_client

from app.core.config import settings


def get_supabase_client() -> Client:
    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        raise ValueError("Supabase configuration is missing in .env")

    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)


def upload_story_audio(
    *,
    client: Client,
    file_obj: BinaryIO,
    original_filename: str,
    bucket_name: str = "stories-audio",
) -> str:
    extension = Path(original_filename).suffix or ".wav"
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    object_path = f"{timestamp}-{uuid4().hex}{extension}"

    file_obj.seek(0)
    client.storage.from_(bucket_name).upload(
        object_path,
        file_obj,
        file_options={"upsert": "false"},
    )
    return object_path
