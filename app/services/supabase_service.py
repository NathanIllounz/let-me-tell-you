from datetime import datetime, timezone
from pathlib import Path
from typing import BinaryIO
from uuid import uuid4

from supabase import Client, create_client

from app.core.config import settings


def get_supabase_client() -> Client:
    client_key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
    if not settings.SUPABASE_URL or not client_key:
        raise ValueError("Supabase configuration is missing in .env")

    return create_client(settings.SUPABASE_URL, client_key)


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
        file_options={"upsert": False},
    )
    return object_path

def get_public_audio_url(client: Client, object_path: str, bucket_name: str = "stories-audio") -> str:
    """Returns the public URL for an audio file stored in Supabase."""
    return client.storage.from_(bucket_name).get_public_url(object_path)

def get_signed_url(client: Client, file_path: str, bucket_name: str = "stories-audio") -> str:
    """Returns a temporary signed URL (valid for 3600 seconds) for an audio file."""
    res = client.storage.from_(bucket_name).create_signed_url(file_path, 3600)
    if isinstance(res, dict) and "signedURL" in res:
        return res["signedURL"]
    if hasattr(res, "signed_url"):
        return res.signed_url
    return str(res)
