import asyncio
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from tts_engine import generate_audio
from urllib.parse import quote

# Load environment variables
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") # Need service role to bypass RLS for tasks

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

async def upload_audio_to_storage(file_path: str, user_id: str, story_id: str) -> str:
    """Uploads the generated MP3 to Supabase storage and returns the path."""
    with open(file_path, "rb") as f:
        file_bytes = f.read()
        
    storage_path = f"{user_id}/{story_id}_narrator.mp3"
    
    # Upload to storage bucket
    response = supabase.storage.from_("stories-audio").upload(
        path=storage_path,
        file=file_bytes,
        file_options={"content-type": "audio/mpeg", "upsert": "true"} # overwrite if exists
    )
    
    # Wait, the response returned by Supabase Python client can throw or return dict.
    # It returns a httpx response or dict, let's assume it passes if no exception.
    return storage_path


async def daemon_loop():
    print("Narrator Microservice Started. Listening for TTS exactly tasks...")
    
    while True:
        try:
            # 1. atomic fetch and lock task
            # Using the RPC strategy for the 'SKIP LOCKED' transaction we built
            task_res = supabase.rpc('claim_tts_task').execute()
            
            if not task_res.data:
                # No pending tasks, wait before polling again
                await asyncio.sleep(3)
                continue
                
            task = task_res.data[0]
            task_id = task["id"]
            payload = task.get("payload", {})
            
            story_id = payload.get("story_id")
            text = payload.get("text", "")
            language = payload.get("language", "English")
            
            if not story_id or not text:
                print(f"DEBUG: Task {task_id} missing critical payload parts. Failing task.")
                supabase.table("background_tasks").update({"status": "failed", "error_message": "Missing story_id or text"}).eq("id", task_id).execute()
                continue
                
            print(f"--> [NARRATOR] Picked up task {task_id} for Story {story_id} ({language})")
            
            # Fetch story to get user_id for the bucket path
            story_res = supabase.table("stories").select("user_id").eq("id", story_id).execute()
            user_id = "anonymous"
            if story_res.data:
                user_id = story_res.data[0].get("user_id", "anonymous")
            
            # 2. Generate Audio
            print(f"Generating audio for: {story_id}...", flush=True)
            mp3_path = await generate_audio(text, language)
            
            # 3. Upload to Storage
            print("Uploading to Storage...", flush=True)
            storage_path = await upload_audio_to_storage(mp3_path, user_id, story_id)
            
            # 4. Update the Story Record
            supabase.table("stories").update({"refined_audio_path": storage_path}).eq("id", story_id).execute()
            
            # 5. Complete the Task
            supabase.table("background_tasks").update({"status": "completed"}).eq("id", task_id).execute()
            
            # 6. Cleanup
            if os.path.exists(mp3_path):
                os.remove(mp3_path)
            
            print(f"--> [NARRATOR] Story {story_id} audio totally complete & saved!\n")
            
        except Exception as e:
            error_msg = str(e)
            print(f"Narrator encounter error: {error_msg}")
            # we might want to fail the task if we know its ID
            await asyncio.sleep(5)
            
if __name__ == "__main__":
    try:
        asyncio.run(daemon_loop())
    except KeyboardInterrupt:
        print("\nNarrator daemon terminated cleanly.")
