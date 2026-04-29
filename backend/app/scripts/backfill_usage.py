import os
import sys
from pathlib import Path

# Add the app directory to sys.path so we can import modules
sys.path.append(str(Path(__file__).resolve().parents[2]))

from app.services.supabase_service import get_supabase_client, get_remote_file_size, get_public_audio_url

def backfill():
    client = get_supabase_client()
    print("Fetching stories...")
    stories = client.table("stories").select("*").execute()
    
    if not stories.data:
        print("No stories found.")
        return

    print(f"Processing {len(stories.data)} stories...")
    
    # First, clear existing stats to avoid double counting if run twice
    print("Clearing existing usage stats...")
    client.table("user_storage_stats").delete().neq("user_id", "00000000-0000-0000-0000-000000000000").execute()
    client.table("ai_usage_logs").delete().neq("user_id", "00000000-0000-0000-0000-000000000000").execute()

    # Cache for folder listings to avoid redundant API calls
    folder_cache = {}

    def get_supabase_file_size(bucket, obj_path):
        folder = ""
        filename = obj_path
        if "/" in obj_path:
            folder, filename = obj_path.rsplit("/", 1)
        
        cache_key = f"{bucket}:{folder}"
        if cache_key not in folder_cache:
            try:
                folder_cache[cache_key] = client.storage.from_(bucket).list(folder, {"limit": 1000})
            except:
                folder_cache[cache_key] = []
        
        for item in folder_cache[cache_key]:
            if item["name"] == filename:
                return item.get("metadata", {}).get("size", 0)
        return 0

    for story in stories.data:
        try:
            user_id = story.get("user_id")
            if not user_id: continue
            
            title = story.get('title', 'Untitled')
            # Safe print for Windows console
            print(f"  --> Processing story: {title.encode('ascii', 'ignore').decode()} (User: {user_id})")
            
            def get_object_path(val, bucket):
                if not val: return None
                if val.startswith("http"):
                    try:
                        # Extract part after bucket name
                        return val.split(f"/{bucket}/")[-1].split("?")[0]
                    except: return None
                return val

            # 1. Original Audio
            audio_path = story.get("audio_path")
            if audio_path and audio_path != "manual_entry":
                obj_path = get_object_path(audio_path, "stories-audio")
                if obj_path:
                    size = get_supabase_file_size("stories-audio", obj_path)
                    if size > 0:
                        client.rpc("increment_user_storage", {"p_user_id": user_id, "p_col_name": "audio_bytes", "p_delta": size}).execute()
                        print(f"      - Original Audio: {size} bytes")
                    else:
                        print(f"      - Original Audio: NOT FOUND in storage (Obj: {obj_path})")
            
            # 2. Narrator Audio
            refined_path = story.get("refined_audio_path")
            if refined_path:
                obj_path = get_object_path(refined_path, "stories-audio")
                if obj_path:
                    size = get_supabase_file_size("stories-audio", obj_path)
                    if size > 0:
                        client.rpc("increment_user_storage", {"p_user_id": user_id, "p_col_name": "narrator_bytes", "p_delta": size}).execute()
                        client.table("ai_usage_logs").insert({"user_id": user_id, "service_type": "narrator"}).execute()
                        print(f"      - Narrator Audio: {size} bytes")
                    else:
                        print(f"      - Narrator Audio: NOT FOUND in storage (Obj: {obj_path})")

            # 3. Covers
            cover_url = story.get("cover_url")
            if cover_url:
                obj_path = get_object_path(cover_url, "story-covers")
                if obj_path:
                    size = get_supabase_file_size("story-covers", obj_path)
                    if size > 0:
                        client.rpc("increment_user_storage", {"p_user_id": user_id, "p_col_name": "cover_bytes", "p_delta": size}).execute()
                        if f"{user_id}/{story.get('id')}_cover.jpg" in cover_url:
                            client.table("ai_usage_logs").insert({"user_id": user_id, "service_type": "artist"}).execute()
                        print(f"      - Cover: {size} bytes")
                    else:
                        print(f"      - Cover: NOT FOUND in storage (Obj: {obj_path})")

            # 4. Ghostwriter
            if story.get("refined_story") and story.get("audio_path") != "manual_entry":
                 client.table("ai_usage_logs").insert({"user_id": user_id, "service_type": "ghostwriter"}).execute()
        except Exception as story_err:
            print(f"    ERROR processing story: {story_err}")

    print("Backfill complete!")

if __name__ == "__main__":
    backfill()
