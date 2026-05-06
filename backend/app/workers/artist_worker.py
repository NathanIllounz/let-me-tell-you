import asyncio
import os
import urllib.parse
from app.services.supabase_service import get_supabase_client, update_user_storage_stat, log_ai_usage, get_remote_file_size
from app.workers.image_engine import generate_cover_image

async def upload_image_to_storage(client, file_path: str, user_id: str, story_id: str) -> str:
    """Uploads the generated JPG to Supabase storage and returns the public url."""
    with open(file_path, "rb") as f:
        file_bytes = f.read()
        
    storage_path = f"{user_id}/{story_id}_cover.jpg"
    
    client.storage.from_("story-covers").upload(
        path=storage_path,
        file=file_bytes,
        file_options={"content-type": "image/jpeg", "upsert": "true"}
    )
    
    return client.storage.from_("story-covers").get_public_url(storage_path)

async def artist_daemon_loop():
    print("Artist Worker Thread Started.")
    supabase = get_supabase_client()
    
    while True:
        try:
            task_res = supabase.rpc('claim_task', {'p_task_type': 'image_generation'}).execute()
            
            if not task_res.data:
                await asyncio.sleep(5)
                continue
                
            task = task_res.data[0]
            task_id = task["id"]
            payload = task.get("payload", {})
            
            story_id = payload.get("story_id")
            user_id = payload.get("user_id")
            title = payload.get("title", "")
            context = payload.get("context", "")
            
            if not story_id or not title:
                supabase.table("background_tasks").update({"status": "failed", "error_message": "Missing story_id or title"}).eq("id", task_id).execute()
                continue
                
            print(f"--> [ARTIST] Processing Story {story_id}")
            
            story_res = supabase.table("stories").select("user_id, cover_url").eq("id", story_id).execute()
            old_cover_url = None
            old_size = 0
            if story_res.data:
                if not user_id:
                    user_id = story_res.data[0].get("user_id", "anonymous")
                old_cover_url = story_res.data[0].get("cover_url")
                if old_cover_url and "http" in old_cover_url:
                    old_size = get_remote_file_size(old_cover_url)
            
            # generate_cover_image is sync, but that's fine in a dedicated thread/task
            jpg_path = generate_cover_image(title, context)
            public_url = await upload_image_to_storage(supabase, jpg_path, user_id, story_id)
            
            supabase.table("stories").update({"cover_url": public_url}).eq("id", story_id).execute()
            
            # Clean up old orphaned cover
            if old_cover_url and old_cover_url != public_url:
                try:
                    path = old_cover_url
                    if "http" in path:
                        parsed = urllib.parse.urlparse(path)
                        if "story-covers" in parsed.path:
                            path = parsed.path.split("/story-covers/")[-1]
                            path = urllib.parse.unquote(path)
                    path = path.split('?')[0]
                    if path:
                        supabase.storage.from_("story-covers").remove([path])
                except Exception as e:
                    print(f"Warning: Failed to delete old cover: {e}")

            if user_id and user_id != "anonymous":
                new_size = os.path.getsize(jpg_path) if os.path.exists(jpg_path) else 0
                delta = new_size - old_size
                update_user_storage_stat(supabase, user_id, 'cover_bytes', delta)
                log_ai_usage(supabase, user_id, "artist")
            
            supabase.table("background_tasks").update({"status": "completed"}).eq("id", task_id).execute()
            
            if os.path.exists(jpg_path):
                os.remove(jpg_path)
            
            print(f"--> [ARTIST] Story {story_id} cover complete!")
            
        except Exception as e:
            print(f"Artist Worker Error: {e}")
            await asyncio.sleep(10)
