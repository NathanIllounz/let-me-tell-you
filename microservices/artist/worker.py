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
            user_id = payload.get("user_id") # Get from payload first
            title = payload.get("title", "")
            context = payload.get("context", "")
            
            if not story_id or not title:
                print(f"DEBUG: Task {task_id} missing critical payload parts. Failing task.")
                supabase.table("background_tasks").update({"status": "failed", "error_message": "Missing story_id or title"}).eq("id", task_id).execute()
                continue
                
            print(f"--> [ARTIST] Picked up canvas {task_id} for Story {story_id} ({title})")
            
            story_res = supabase.table("stories").select("user_id, cover_url").eq("id", story_id).execute()
            old_cover_url = None
            old_size = 0
            if story_res.data:
                if not user_id:
                    user_id = story_res.data[0].get("user_id", "anonymous")
                old_cover_url = story_res.data[0].get("cover_url")
                if old_cover_url and "http" in old_cover_url:
                    import urllib.request
                    try:
                        req = urllib.request.Request(old_cover_url, method='HEAD')
                        with urllib.request.urlopen(req, timeout=5) as resp:
                            old_size = int(resp.headers.get('Content-Length', 0))
                    except Exception:
                        pass
            
            # 2. Generate Image
            print(f"Painting image for: {title}...", flush=True)
            # running sync function in async context just directly for simplicity since edge_tts was async but requests is sync
            jpg_path = generate_cover_image(title, context)
            
            # 3. Upload to Storage
            print("Varnishing and Uploading to Storage...", flush=True)
            public_url = await upload_image_to_storage(jpg_path, user_id, story_id)
            
            # 4. Update the Story Record
            supabase.table("stories").update({"cover_url": public_url}).eq("id", story_id).execute()
            
            # Clean up old orphaned cover if it was replaced
            if old_cover_url and old_cover_url != public_url:
                import urllib.parse
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
                        print(f"DEBUG: Deleted old orphaned cover {path}")
                except Exception as e:
                    print(f"DEBUG: Failed to delete old cover {old_cover_url}: {e}")
                    
            # Update Usage Stats
            if user_id != "anonymous":
                new_size = os.path.getsize(jpg_path) if os.path.exists(jpg_path) else 0
                delta = new_size - old_size
                try:
                    supabase.rpc("increment_user_storage", {
                        "p_user_id": user_id,
                        "p_col_name": "cover_bytes",
                        "p_delta": delta
                    }).execute()
                    
                    supabase.table("ai_usage_logs").insert({
                        "user_id": user_id,
                        "service_type": "artist"
                    }).execute()
                    print(f"DEBUG: Logged AI usage and storage delta ({delta} bytes) for user {user_id}")
                except Exception as e:
                    print(f"DEBUG: Failed to update usage stats: {e}")
            
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
