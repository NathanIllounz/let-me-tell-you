from fastapi import APIRouter, Depends, HTTPException, status
from typing import Any
from app.api.deps import get_current_user
from app.services.supabase_service import get_supabase_client
from app.services.dispatcher import TaskDispatcher

router = APIRouter()

@router.post("/test")
def test_enqueue_task(current_user: dict = Depends(get_current_user)) -> dict[str, Any]:
    """
    Dummy endpoint for testing the Task Dispatcher queue mechanism.
    Queues a sample task into public.background_tasks.
    """
    dispatcher = TaskDispatcher()
    task_id = dispatcher.enqueue_task(
        task_type="dummy_test_task",
        payload={"message": "Hello from the test endpoint", "sleep_time": 5}
    )
    
    if not task_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to enqueue test task. Ensure the public.background_tasks table exists."
        )
        
    return {
        "status": "queued",
        "task_id": task_id,
        "message": "Task queued successfully. You can poll it using GET /tasks/{task_id}"
    }

@router.get("/{task_id}")
def get_task_status(task_id: str, current_user: dict = Depends(get_current_user)) -> dict[str, Any]:
    """
    Checks the status of a scheduled background task.
    Allows the frontend to gracefully poll for completion without freezing.
    """
    try:
        client = get_supabase_client()
        # Since the task table has no dedicated user_id right now in your schema,
        # we allow the requester to check it. If security becomes a concern, 
        # we can inject a user_id footprint into the payload or table later.
        response = client.table("background_tasks").select("*").eq("id", task_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found."
            )
            
        task = response.data[0]
        return {
            "id": task["id"],
            "status": task["status"],
            "task_type": task["task_type"],
            "result": task.get("payload", {}) # we can map a result or leave it here depending on the microservice logic
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch task: {str(e)}"
        )
