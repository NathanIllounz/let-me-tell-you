-- Run this heavily-optimized SQL block inside your Supabase SQL Editor!
-- It creates an RPC function called `claim_tts_task` that your Python daemon relies on.
-- This guarantees absolutely zero race conditions using your SKIP LOCKED strategy!

CREATE OR REPLACE FUNCTION claim_tts_task()
RETURNS setof public.background_tasks
LANGUAGE sql
AS $$
  UPDATE public.background_tasks
  SET status = 'processing',
      locked_at = now()
  WHERE id = (
      SELECT id
      FROM public.background_tasks
      WHERE status = 'pending' AND task_type = 'tts_generation'
      ORDER BY created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
$$;
