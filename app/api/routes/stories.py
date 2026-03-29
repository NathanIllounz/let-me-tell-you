import tempfile
import traceback
from pathlib import Path
from typing import Any

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from pydantic import BaseModel

from app.services.ai_service import AIService, GeminiRateLimitError
from app.services.supabase_service import get_supabase_client, upload_story_audio


router = APIRouter(prefix="/stories", tags=["stories"])


@router.post("/upload-audio")
async def upload_audio(file: UploadFile = File(...)) -> dict[str, str]:
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
        }).execute()

        print("Success: Story saved to Supabase Table.", flush=True)

        return {
            "object_path": object_path,
            "title": result["suggested_title"],
            "refined_story": result["cleaned_text"],
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
    use_ai_refinement: bool = False

@router.post("/manual")
async def create_manual_story(request: ManualStoryRequest) -> dict[str, Any]:
    client = get_supabase_client()
    
    title = request.title
    refined_story = request.content
    
    if request.use_ai_refinement:
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
    try:
        data = client.table("stories").insert({
            "title": title,
            "refined_story": refined_story,
            "audio_path": "manual_entry",
        }).execute()
        print("Success: Manual story saved to Supabase Table.", flush=True)
        return data.data[0] if data.data else {}
    except Exception as exc:
        print(f"Failed to save manual story to database: {exc}", flush=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save story to database. Check server logs.",
        ) from exc
