import tempfile
import traceback
from pathlib import Path
from typing import Any

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from pydantic import BaseModel

from app.services.ai_service import AIService, GeminiRateLimitError
from app.services.supabase_service import get_supabase_client, upload_story_audio, get_signed_url


router = APIRouter(prefix="/stories", tags=["stories"])


@router.post("/upload-audio")
async def upload_audio(file: UploadFile = File(...)) -> dict[str, Any]:
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must have a filename",
        )

    temp_path = ""
    try:
        suffix = Path(file.filename).suffix or ".wav"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name

        with Path(temp_path).open("rb") as binary_file:
            client = get_supabase_client()
            object_path = upload_story_audio(
                client=client,
                file_obj=binary_file,
                original_filename=file.filename,
            )
        print("File uploaded to Supabase", flush=True)

        print("Starting Gemini processing...", flush=True)
        try:
            ai_service = AIService()
            result = ai_service.process_voice_story(temp_path)
        except GeminiRateLimitError:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    "The AI service is temporarily busy. Please wait a few seconds "
                    "and try again."
                ),
            ) from None
        except Exception as ai_exc:  # noqa: BLE001
            print(f"Gemini processing failed: {ai_exc}", flush=True)
            traceback.print_exc()
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=(
                    "Story generation failed. The audio was saved to storage; "
                    "check server logs for the full error."
                ),
            ) from ai_exc

        print("Story generated successfully", flush=True)

        # Save to Supabase stories table
        client.table("stories").insert({
            "title": result["suggested_title"],
            "refined_story": result["cleaned_text"],
            "audio_path": object_path,
            "refined_audio_path": None,
        }).execute()

        print("Success: Story saved to Supabase Table.", flush=True)

        signed_url = get_signed_url(client, object_path)
        return {
            "title": result["suggested_title"],
            "refined_story": result["cleaned_text"],
            "audio_path": signed_url,
            "refined_audio_path": None,
        }
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        print(f"Upload or pipeline failed: {exc}", flush=True)
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not upload audio or complete processing. Check server logs.",
        ) from exc
    finally:
        if temp_path:
            Path(temp_path).unlink(missing_ok=True)
        await file.close()


@router.post("/process")
async def process_story(file: UploadFile = File(...)) -> dict[str, str]:
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must have a filename",
        )

    temp_path = ""
    try:
        suffix = Path(file.filename).suffix or ".wav"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name

        ai_service = AIService()
        result = ai_service.process_voice_story(temp_path)
    except GeminiRateLimitError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "The AI service is temporarily busy. Please wait a few seconds "
                "and try again."
            ),
        ) from None
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Processing failed: {exc}",
        ) from exc
    finally:
        if temp_path:
            Path(temp_path).unlink(missing_ok=True)
        await file.close()

    return {
        "suggested_title": result["suggested_title"],
        "cleaned_text": result["cleaned_text"],
    }

class ManualStoryRequest(BaseModel):
    title: str
    content: str
    should_refine: bool = False
    story_content: str | None = None
    user_id: str | None = None

@router.post("/manual")
async def create_manual_story(request: ManualStoryRequest) -> dict[str, Any]:
    client = get_supabase_client()
    
    title = request.title
    refined_story = request.content
    user_id = request.user_id
    
    if request.should_refine:
        print("Starting manual story Gemini refinement...", flush=True)
        try:
            ai_service = AIService()
            result = ai_service.refine_text_story(request.content)
            title = result["suggested_title"]
            refined_story = result["cleaned_text"]
            print("Manual story refined successfully", flush=True)
        except GeminiRateLimitError:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="The AI service is temporarily busy. Please wait a few seconds and try again.",
            ) from None
        except Exception as exc:
            print(f"Gemini processing failed: {exc}", flush=True)
            traceback.print_exc()
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Story generation failed. Check server logs for the full error.",
            ) from exc

    # Save to Supabase stories table
    print("Saving manual story to Supabase...", flush=True)
    print(f"DEBUG: Saving story for user: {user_id}", flush=True)
    try:
        data = client.table("stories").insert({
            "title": title,
            "refined_story": refined_story,
            "audio_path": "manual_entry",
            "refined_audio_path": None,
            "user_id": user_id,
        }).execute()
        print("Success: Manual story saved to Supabase Table.", flush=True)
        return data.data[0] if data.data else {}
    except Exception as exc:
        print(f"Failed to save manual story to database: {exc}", flush=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save story to database. Check server logs.",
        ) from exc

@router.get("")
async def get_stories(user_id: str) -> list[dict[str, Any]]:
    client = get_supabase_client()
    try:
        response = client.table("stories").select("id, created_at, title, refined_story, audio_path, refined_audio_path, user_id").or_(f"user_id.eq.{user_id},user_id.is.null").order("created_at", desc=True).execute()
        
        stories = response.data
        for story in stories:
            path_val = story.get("audio_path")
            if path_val and path_val != "manual_entry":
                # Fix any mistakenly saved public URLs by extracting just the filename
                if path_val.startswith("http"):
                    path_val = path_val.split("/")[-1]
                story["audio_path"] = get_signed_url(client, path_val)
                
        print(f"SUCCESS: Fetched {len(stories)} stories with signed URLs.", flush=True)
        return stories
    except Exception as exc:
        print(f"Failed to fetch all stories from database: {exc}", flush=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not fetch stories from database. Check server logs.",
        ) from exc
