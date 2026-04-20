import asyncio
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from image_engine import generate_cover_image

# Load environment variables
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

async def upload_image_to_storage(file_path: str, user_id: str, story_id: str) -> str:
    """Uploads the generated JPG to Supabase storage and returns the public url."""
    with open(file_path, "rb") as f:
        file_bytes = f.read()
        
    # We store covers locally in the "covers" folder if required, but user_id is safer
    storage_path = f"{user_id}/{story_id}_cover.jpg"
    
    # Upload to storage bucket
    response = supabase.storage.from_("story-covers").upload(
        path=storage_path,
        file=file_bytes,
        file_options={"content-type": "image/jpeg", "upsert": "true"}
    )
    
    # Covers are public, so grab the public URL directly!
    public_url = supabase.storage.from_("story-covers").get_public_url(storage_path)
    return public_url


async def daemon_loop():
    print("Artist Microservice Started. Running easel and brushes...")
    
    while True:
        try:
            # 1. atomic fetch and lock task using the GENERIC rpc
            task_res = supabase.rpc('claim_task', {'p_task_type': 'image_generation'}).execute()
            
            if not task_res.data:
                await asyncio.sleep(3)
                continue
                
            task = task_res.data[0]
            task_id = task["id"]
            payload = task.get("payload", {})
            
            story_id = payload.get("story_id")
            title = payload.get("title", "")
            context = payload.get("context", "")
            
            if not story_id or not title:
                print(f"DEBUG: Task {task_id} missing critical payload parts. Failing task.")
                supabase.table("background_tasks").update({"status": "failed", "error_message": "Missing story_id or title"}).eq("id", task_id).execute()
                continue
                
            print(f"--> [ARTIST] Picked up canvas {task_id} for Story {story_id} ({title})")
            
            story_res = supabase.table("stories").select("user_id").eq("id", story_id).execute()
            user_id = "anonymous"
            if story_res.data:
                user_id = story_res.data[0].get("user_id", "anonymous")
            
            # 2. Generate Image
            print(f"Painting image for: {title}...", flush=True)
            # running sync function in async context just directly for simplicity since edge_tts was async but requests is sync
            jpg_path = generate_cover_image(title, context)
            
            # 3. Upload to Storage
            print("Varnishing and Uploading to Storage...", flush=True)
            public_url = await upload_image_to_storage(jpg_path, user_id, story_id)
            
            # 4. Update the Story Record
            supabase.table("stories").update({"cover_url": public_url}).eq("id", story_id).execute()
            
            # 5. Complete the Task
            supabase.table("background_tasks").update({"status": "completed"}).eq("id", task_id).execute()
            
            # 6. Cleanup
            if os.path.exists(jpg_path):
                os.remove(jpg_path)
            
            print(f"--> [ARTIST] Story {story_id} cover art officially framed & hung!\n")
            
        except Exception as e:
            error_msg = str(e)
            print(f"Artist encounter error: {error_msg}")
            await asyncio.sleep(5)
            
if __name__ == "__main__":
    try:
        asyncio.run(daemon_loop())
    except KeyboardInterrupt:
        print("\nArtist daemon closed the studio cleanly.")
