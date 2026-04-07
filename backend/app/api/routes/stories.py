import tempfile
import traceback
from pathlib import Path
from typing import Any

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel

from app.services.ai_service import AIService, GeminiRateLimitError
from app.services.supabase_service import get_supabase_client, upload_story_audio, get_signed_url, upload_story_cover


router = APIRouter(prefix="/stories", tags=["stories"])


@router.post("/upload-audio")
async def upload_audio(
    file: UploadFile = File(...),
    user_id: str | None = Form(None),
    group_id: str | None = Form(None),
    language: str | None = Form("English")
) -> dict[str, Any]:
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
            result = ai_service.process_voice_story(temp_path, language=language or "English")
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
            "user_id": user_id,
            "group_id": group_id,
            "language": language or "English",
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

@router.post("/upload-cover")
async def upload_cover(
    file: UploadFile = File(...),
) -> dict[str, Any]:
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided.")
    try:
        client = get_supabase_client()
        content = await file.read()
        cover_url = upload_story_cover(
            client=client,
            file_bytes=content,
            original_filename=file.filename,
        )
        return {"cover_url": cover_url}
    except Exception as e:
        print(f"Error uploading cover: {e}", flush=True)
        raise HTTPException(status_code=500, detail=str(e))


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
    group_id: str | None = None
    language: str = "English"
    cover_url: str | None = None

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
            result = ai_service.refine_text_story(request.content, language=request.language)
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
            "group_id": request.group_id,
            "language": request.language,
            "cover_url": request.cover_url,
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
async def get_stories(user_id: str, group_id: str | None = None, filter_me: bool = False) -> list[dict[str, Any]]:
    client = get_supabase_client()
    try:
        stories_query = client.table("stories").select("id, created_at, title, refined_story, audio_path, refined_audio_path, user_id, group_id, language, cover_url")
        
        if filter_me:
            stories_query = stories_query.eq("user_id", user_id)
        elif group_id:
            stories_query = stories_query.eq("group_id", group_id)
        else:
            memberships_data = client.table("group_members").select("group_id").eq("user_id", user_id).execute()
            group_ids = [m["group_id"] for m in (memberships_data.data or [])]
            if group_ids:
                group_ids_str = ",".join([f'"{gid}"' for gid in group_ids])
                stories_query = stories_query.or_(f"user_id.eq.{user_id},user_id.is.null,group_id.in.({group_ids_str})")
            else:
                stories_query = stories_query.or_(f"user_id.eq.{user_id},user_id.is.null")
                
        response = stories_query.order("created_at", desc=True).execute()
        
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

class UpdateStoryRequest(BaseModel):
    title: str
    content: str
    should_refine: bool = False
    user_id: str
    group_id: str | None = None
    language: str | None = None
    cover_url: str | None = None

@router.delete("/{story_id}")
async def delete_story(story_id: str, user_id: str) -> dict[str, str]:
    if not user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="user_id is required")
        
    client = get_supabase_client()
    try:
        client.table("stories").delete().eq("id", story_id).eq("user_id", user_id).execute()
        return {"message": "Story deleted successfully"}
    except Exception as exc:
        print(f"Failed to delete story: {exc}", flush=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not delete story from database.",
        ) from exc

@router.put("/{story_id}")
async def update_story(story_id: str, request: UpdateStoryRequest) -> dict[str, Any]:
    if not request.user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="user_id is required")

    client = get_supabase_client()
    title = request.title
    refined_story = request.content
    
    if request.should_refine:
        try:
            ai_service = AIService()
            result = ai_service.refine_text_story(request.content)
            title = result["suggested_title"]
            refined_story = result["cleaned_text"]
        except GeminiRateLimitError:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="The AI service is temporarily busy.",
            ) from None
        except Exception as exc:
            traceback.print_exc()
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Story refinement failed.",
            ) from exc

    try:
        update_data = {
            "title": title,
            "refined_story": refined_story,
        }
        
        req_dict = request.model_dump(exclude_unset=True) if hasattr(request, "model_dump") else request.dict(exclude_unset=True)
        if "group_id" in req_dict:
             update_data["group_id"] = request.group_id
        if "language" in req_dict:
             update_data["language"] = request.language
        if "cover_url" in req_dict:
             update_data["cover_url"] = request.cover_url
             
        # Update matching both story_id and user_id for security
        data = client.table("stories").update(update_data).eq("id", story_id).eq("user_id", request.user_id).execute()
        
        if not data.data:
            raise HTTPException(status_code=404, detail="Story not found or unauthorized")
            
        return data.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        print(f"Failed to update story: {exc}", flush=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not update story.",
        ) from exc

