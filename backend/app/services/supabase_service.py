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

def upload_story_cover(
    *,
    client: Client,
    file_bytes: bytes,
    original_filename: str,
    bucket_name: str = "story-covers",
) -> str:
    extension = Path(original_filename).suffix or ".jpg"
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    object_path = f"covers/{timestamp}-{uuid4().hex}{extension}"

    client.storage.from_(bucket_name).upload(
        object_path,
        file_bytes,
        file_options={"upsert": False, "contentType": f"image/{extension.lstrip('.')}"},
    )
    return client.storage.from_(bucket_name).get_public_url(object_path)

def get_signed_url(client: Client, file_path: str, bucket_name: str = "stories-audio") -> str:
    """Returns a temporary signed URL (valid for 3600 seconds) for an audio file."""
    res = client.storage.from_(bucket_name).create_signed_url(file_path, 3600)
    if isinstance(res, dict) and "signedURL" in res:
        return res["signedURL"]
    if hasattr(res, "signed_url"):
        return res.signed_url
    return str(res)

import urllib.parse

def get_remote_file_size(url: str) -> int:
    import urllib.request
    try:
        req = urllib.request.Request(url, method='HEAD')
        with urllib.request.urlopen(req, timeout=5) as resp:
            return int(resp.headers.get('Content-Length', 0))
    except Exception:
        return 0

def delete_storage_file(client: Client, file_url_or_path: str, bucket_name: str) -> int:
    """Deletes a file from Supabase storage and returns its size in bytes."""
    if not file_url_or_path or file_url_or_path == "manual_entry":
        return 0
        
    try:
        # Get size first
        file_size = get_remote_file_size(file_url_or_path) if "http" in file_url_or_path else 0
        
        path = file_url_or_path
        if "http" in path:
            parsed = urllib.parse.urlparse(path)
            if bucket_name in parsed.path:
                path = parsed.path.split(f"/{bucket_name}/")[-1]
                path = urllib.parse.unquote(path)
        
        path = path.split('?')[0]
        
        if path:
            client.storage.from_(bucket_name).remove([path])
            print(f"DEBUG: Deleted orphaned file {path} from {bucket_name} ({file_size} bytes)", flush=True)
            return file_size
    except Exception as e:
        print(f"Failed to delete {file_url_or_path} from {bucket_name}: {e}", flush=True)
    return 0

def update_user_storage_stat(client: Client, user_id: str, stat_type: str, bytes_delta: int) -> None:
    """Updates user storage stats for audio, narrator, or cover bytes.
       stat_type must be 'audio_bytes', 'narrator_bytes', or 'cover_bytes'."""
    if not user_id or bytes_delta == 0:
        return
    try:
        client.rpc("increment_user_storage", {
            "p_user_id": user_id,
            "p_col_name": stat_type,
            "p_delta": bytes_delta
        }).execute()
    except Exception as e:
        print(f"Failed to update storage stats for user {user_id}: {e}", flush=True)

def log_ai_usage(client: Client, user_id: str, service_type: str) -> None:
    """Logs an AI generation event."""
    if not user_id:
        return
    try:
        client.table("ai_usage_logs").insert({
            "user_id": user_id,
            "service_type": service_type
        }).execute()
    except Exception as e:
        print(f"Failed to log AI usage for user {user_id}: {e}", flush=True)
