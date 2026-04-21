-- Run this in your Supabase SQL Editor.
-- It is the generic version of the locking function, allowing ANY microservice to claim tasks!

CREATE OR REPLACE FUNCTION claim_task(p_task_type text)
RETURNS setof public.background_tasks
LANGUAGE sql
AS $$
  UPDATE public.background_tasks
  SET status = 'processing',
      locked_at = now()
  WHERE id = (
      SELECT id
      FROM public.background_tasks
      WHERE status = 'pending' AND task_type = p_task_type
      ORDER BY created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
$$;
