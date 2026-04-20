from typing import Any
import json
from app.services.supabase_service import get_supabase_client

class TaskDispatcher:
    def __init__(self):
        self.client = get_supabase_client()

    def enqueue_task(self, task_type: str, payload: dict) -> str | None:
        """
        Inserts a new task into the background_tasks table.
        The microservices (like TTS or Image Gen) will poll this table securely
        and process jobs independently.
        
        Args:
            task_type: A string identifying the microservice routing (e.g. 'tts_generation', 'image_generation')
            payload: A dictionary of required args for the job
            
        Returns:
            The generated UUID task_id as a string, or None if failed.
        """
        try:
            # We don't supply a status as it defaults to 'pending' as defined in the user's DB schema
            response = self.client.table("background_tasks").insert({
                "task_type": task_type,
                "payload": payload
            }).execute()
            
            if response.data and len(response.data) > 0:
                print(f"DEBUG: Task [{task_type}] Enqueued: {response.data[0]['id']}", flush=True)
                return response.data[0]["id"]
            return None
        except Exception as e:
            print(f"Error enqueueing task {task_type}: {str(e)}", flush=True)
            return None
