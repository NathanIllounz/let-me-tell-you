import asyncio
import os
from app.services.supabase_service import get_supabase_client, update_user_storage_stat, log_ai_usage
from app.workers.tts_engine import generate_audio

async def upload_audio_to_storage(client, file_path: str, user_id: str, story_id: str) -> str:
    """Uploads the generated MP3 to Supabase storage and returns the path."""
    with open(file_path, "rb") as f:
        file_bytes = f.read()
        
    storage_path = f"{user_id}/{story_id}_narrator.mp3"
    
    client.storage.from_("stories-audio").upload(
        path=storage_path,
        file=file_bytes,
        file_options={"content-type": "audio/mpeg", "upsert": "true"}
    )
    return storage_path

async def narrator_daemon_loop():
    print("Narrator Worker Thread Started.")
    supabase = get_supabase_client()
    
    while True:
        try:
            task_res = supabase.rpc('claim_tts_task').execute()
            
            if not task_res.data:
                await asyncio.sleep(5) # Poll less frequently in consolidated mode
                continue
                
            task = task_res.data[0]
            task_id = task["id"]
            payload = task.get("payload", {})
            
            story_id = payload.get("story_id")
            user_id = payload.get("user_id")
            text = payload.get("text", "")
            language = payload.get("language", "English")
            gender = payload.get("gender", "female")
            
            if not story_id or not text:
                supabase.table("background_tasks").update({"status": "failed", "error_message": "Missing story_id or text"}).eq("id", task_id).execute()
                continue
                
            print(f"--> [NARRATOR] Processing Story {story_id}")
            
            story_res = supabase.table("stories").select("user_id, refined_audio_path").eq("id", story_id).execute()
            old_audio_path = None
            old_size = 0
            if story_res.data:
                if not user_id:
                    user_id = story_res.data[0].get("user_id", "anonymous")
                old_audio_path = story_res.data[0].get("refined_audio_path")
                if old_audio_path and "http" in old_audio_path:
                    import urllib.request
                    try:
                        req = urllib.request.Request(old_audio_path, method='HEAD')
                        with urllib.request.urlopen(req, timeout=5) as resp:
                            old_size = int(resp.headers.get('Content-Length', 0))
                    except Exception:
                        pass
            
            mp3_path = await generate_audio(text, language, gender)
            storage_path = await upload_audio_to_storage(supabase, mp3_path, user_id, story_id)
            
            supabase.table("stories").update({"refined_audio_path": storage_path}).eq("id", story_id).execute()
            
            if user_id and user_id != "anonymous":
                new_size = os.path.getsize(mp3_path) if os.path.exists(mp3_path) else 0
                delta = new_size - old_size
                update_user_storage_stat(supabase, user_id, 'narrator_bytes', delta)
                log_ai_usage(supabase, user_id, "narrator")
            
            supabase.table("background_tasks").update({"status": "completed"}).eq("id", task_id).execute()
            
            if os.path.exists(mp3_path):
                os.remove(mp3_path)
            
            print(f"--> [NARRATOR] Story {story_id} audio complete!")
            
        except Exception as e:
            print(f"Narrator Worker Error: {e}")
            await asyncio.sleep(10)
