-- Let Me Tell You: Database Schema Setup Script
-- Compatible with Supabase PostgreSQL
-- Ensure you run this inside the Supabase SQL Editor.

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-------------------------------------------------------------------------------
-- 1. PROFILES TABLE
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    tag TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(username, tag)
);

-- Enable RLS (Service Role Key bypasses this)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);


-------------------------------------------------------------------------------
-- 2. AUTH USER TRIGGER (Auto-create profile)
-------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  base_username text;
  new_tag text;
  is_unique boolean := false;
BEGIN
  -- Extract base username from email (everything before @)
  base_username := split_part(NEW.email, '@', 1);
  
  -- Generate a unique 4-digit tag
  WHILE NOT is_unique LOOP
    new_tag := lpad(floor(random() * 10000)::text, 4, '0');
    
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE username = base_username AND tag = new_tag) THEN
      is_unique := true;
    END IF;
  END LOOP;

  INSERT INTO public.profiles (id, username, tag)
  VALUES (NEW.id, base_username, new_tag);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to allow safe re-running
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-------------------------------------------------------------------------------
-- 3. STORIES TABLE
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT,
    refined_story TEXT,
    audio_path TEXT,
    refined_audio_path TEXT,
    language TEXT,
    cover_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own stories" ON public.stories FOR SELECT USING (auth.uid() = user_id);
-- The backend uses Service Role to insert/update, so explicit insert/update policies for the user aren't strictly necessary but good practice:
CREATE POLICY "Users can insert own stories" ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own stories" ON public.stories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own stories" ON public.stories FOR DELETE USING (auth.uid() = user_id);


-------------------------------------------------------------------------------
-- 4. FAMILY CIRCLES (GROUPS) TABLE
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Group read access" ON public.groups FOR SELECT USING (true);
CREATE POLICY "Group delete access" ON public.groups FOR DELETE USING (auth.uid() = creator_id);
CREATE POLICY "Group update access" ON public.groups FOR UPDATE USING (auth.uid() = creator_id);


-------------------------------------------------------------------------------
-- 5. GROUP MEMBERS TABLE
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.group_members (
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Group members read" ON public.group_members FOR SELECT USING (true);
CREATE POLICY "Users can delete own membership" ON public.group_members FOR DELETE USING (auth.uid() = user_id);


-------------------------------------------------------------------------------
-- 6. STORY GROUPS TABLE (Story Sharing)
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.story_groups (
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    PRIMARY KEY (story_id, group_id)
);

ALTER TABLE public.story_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Story groups read" ON public.story_groups FOR SELECT USING (true);


-------------------------------------------------------------------------------
-- 7. FRIEND REQUESTS TABLE
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.friend_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(sender_id, receiver_id)
);

ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Friend requests read" ON public.friend_requests FOR SELECT USING (auth.uid() IN (sender_id, receiver_id));


-------------------------------------------------------------------------------
-- 8. BACKGROUND TASKS TABLE
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.background_tasks (
    id UUID PRIMARY KEY,
    status TEXT NOT NULL,
    result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.background_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tasks read" ON public.background_tasks FOR SELECT USING (true);


-------------------------------------------------------------------------------
-- 9. GENERATE INVITE CODE FUNCTION
-------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS text AS $$
DECLARE
  new_code text;
  is_unique boolean := false;
BEGIN
  WHILE NOT is_unique LOOP
    -- Generate a random 6-character uppercase alphanumeric code
    new_code := upper(substring(md5(random()::text) from 1 for 6));
    
    IF NOT EXISTS (SELECT 1 FROM public.groups WHERE invite_code = new_code) THEN
      is_unique := true;
    END IF;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-------------------------------------------------------------------------------
-- 10. STORAGE BUCKETS SETUP
-------------------------------------------------------------------------------
-- Note: Requires superuser or specific Supabase privileges to execute.
-- In Supabase, the storage schema handles file storage.

INSERT INTO storage.buckets (id, name, public) 
VALUES ('stories-audio', 'stories-audio', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('story-covers', 'story-covers', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for Storage
-- Note: These policies may need to be run separately if your SQL editor 
-- lacks privileges over the storage schema.

DROP POLICY IF EXISTS "Public Access stories-audio" ON storage.objects;
CREATE POLICY "Public Access stories-audio" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'stories-audio');

DROP POLICY IF EXISTS "Public Access story-covers" ON storage.objects;
CREATE POLICY "Public Access story-covers" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'story-covers');

DROP POLICY IF EXISTS "Auth Users Insert Audio" ON storage.objects;
CREATE POLICY "Auth Users Insert Audio" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'stories-audio' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth Users Insert Covers" ON storage.objects;
CREATE POLICY "Auth Users Insert Covers" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'story-covers' AND auth.role() = 'authenticated');
