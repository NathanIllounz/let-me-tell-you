from typing import Any
from fastapi import APIRouter, HTTPException, status
from app.services.supabase_service import get_supabase_client
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/usage", tags=["usage"])

@router.get("/{user_id}")
async def get_user_usage(user_id: str) -> dict[str, Any]:
    if not user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="user_id is required")

    client = get_supabase_client()
    try:
        # Fetch Storage Stats
        storage_res = client.table("user_storage_stats").select("*").eq("user_id", user_id).execute()
        storage = {"audio_bytes": 0, "narrator_bytes": 0, "cover_bytes": 0}
        if storage_res.data:
            stats = storage_res.data[0]
            storage["audio_bytes"] = stats.get("audio_bytes", 0)
            storage["narrator_bytes"] = stats.get("narrator_bytes", 0)
            storage["cover_bytes"] = stats.get("cover_bytes", 0)

        # Fetch AI Usage Logs
        logs_res = client.table("ai_usage_logs").select("service_type, created_at").eq("user_id", user_id).execute()
        
        ai_stats = {
            "artist": {"today": 0, "this_week": 0, "all_time": 0},
            "narrator": {"today": 0, "this_week": 0, "all_time": 0},
            "ghostwriter": {"today": 0, "this_week": 0, "all_time": 0}
        }
        
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=now.weekday())

        for log in logs_res.data or []:
            svc = log.get("service_type")
            if svc not in ai_stats:
                continue
            
            created_str = log.get("created_at")
            if not created_str: continue
            
            try:
                # Handle ISO format from Supabase (usually 2023-10-12T15:30:00+00:00)
                # python 3.11 fromisoformat handles Z, but let's be safe
                created_str = created_str.replace("Z", "+00:00")
                created_dt = datetime.fromisoformat(created_str)
                
                ai_stats[svc]["all_time"] += 1
                if created_dt >= week_start:
                    ai_stats[svc]["this_week"] += 1
                if created_dt >= today_start:
                    ai_stats[svc]["today"] += 1
            except ValueError:
                pass
                
        return {
            "storage": storage,
            "ai_stats": ai_stats
        }

    except Exception as exc:
        print(f"Failed to fetch usage stats: {exc}", flush=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not fetch usage statistics."
        ) from exc
