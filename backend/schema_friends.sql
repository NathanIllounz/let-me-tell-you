-- ==========================================
-- PHASE 5: THE SOCIAL LAYER SCHEMA
-- Run this script in your Supabase SQL Editor
-- ==========================================

-- 1. Create the secure Public Profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY
);

-- Safely add columns in case the user already has a standard Supabase Profiles table!
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tag TEXT;

-- Safely populate any null handles so the UNIQUE constraint doesn't crash on existing empty rows
UPDATE public.profiles 
SET 
  username = 'user', 
  tag = LPAD(TRUNC(RANDOM() * 8999 + 1000)::text, 4, '0') 
WHERE username IS NULL OR tag IS NULL;

-- Backfill missing users entirely from auth.users
INSERT INTO public.profiles (id, username, tag)
SELECT 
    id, 
    COALESCE(LOWER(SPLIT_PART(email, '@', 1)), 'user'),
    LPAD(TRUNC(RANDOM() * 8999 + 1000)::text, 4, '0')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Enforce constraints now that rows are safe
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS unique_username_tag;
ALTER TABLE public.profiles ADD CONSTRAINT unique_username_tag UNIQUE (username, tag);
ALTER TABLE public.profiles ALTER COLUMN username SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN tag SET NOT NULL;

-- Index for insanely fast Discord-style lookups
CREATE INDEX IF NOT EXISTS idx_profiles_handle ON public.profiles(username, tag);

-- 2. Backfill existing authenticated users with generated tags!
-- This transforms 'nathan@example.com' into 'nathan#4852'
INSERT INTO public.profiles (id, username, tag)
SELECT 
    id, 
    -- Clean the prefix of their email to create a safe username, default to 'user' if null
    COALESCE(LOWER(SPLIT_PART(email, '@', 1)), 'user'),
    -- Generate a solid 4 digit string securely from 1000 to 9999
    LPAD(TRUNC(RANDOM() * 8999 + 1000)::text, 4, '0')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 3. Setup the continuous Trigger for completely new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user_profile() 
RETURNS trigger AS $$
DECLARE
    gen_username text;
    gen_tag text;
    is_unique boolean := false;
BEGIN
    -- Base username extracted from email
    gen_username := COALESCE(LOWER(SPLIT_PART(NEW.email, '@', 1)), 'user');
    
    -- Ensure the combined handle is completely unique by rerolling tag if a collision somehow happens
    WHILE NOT is_unique LOOP
        gen_tag := LPAD(TRUNC(RANDOM() * 8999 + 1000)::text, 4, '0');
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE username = gen_username AND tag = gen_tag) THEN
            is_unique := true;
        END IF;
    END LOOP;

    INSERT INTO public.profiles (id, username, tag)
    VALUES (NEW.id, gen_username, gen_tag);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_profile();

-- 4. Create the Friend Requests Engine Table
CREATE TABLE IF NOT EXISTS public.friend_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
    
    -- Safety constraint: prevent multiple active friend requests identically sent both directions
    -- Moved to an Index below to support LEAST/GREATEST expressions
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_friend_link ON public.friend_requests (
    LEAST(sender_id, receiver_id), 
    GREATEST(sender_id, receiver_id)
);

-- Fast lookup indexes for checking connection statuses
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON public.friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON public.friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON public.friend_requests(status);
