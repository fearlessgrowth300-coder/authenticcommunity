-- 20260818000400_storage_policies_and_conversation_settings.sql
-- 1. Storage RLS policies for all 5 public buckets

DROP POLICY IF EXISTS "Public Read All Media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated User Upload Community Posts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated User Upload Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated User Upload Stories" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated User Upload Event Photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated User Upload Post Media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated User Update Own Media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated User Delete Own Media" ON storage.objects;

CREATE POLICY "Public Read All Media"
ON storage.objects FOR SELECT
USING (bucket_id IN ('community-posts', 'avatars', 'event-photos', 'post_media', 'stories'));

CREATE POLICY "Authenticated User Upload Community Posts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'community-posts');

CREATE POLICY "Authenticated User Upload Avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Authenticated User Upload Stories"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'stories');

CREATE POLICY "Authenticated User Upload Event Photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-photos');

CREATE POLICY "Authenticated User Upload Post Media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'post_media');

CREATE POLICY "Authenticated User Update Own Media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id IN ('community-posts', 'avatars', 'event-photos', 'post_media', 'stories'));

CREATE POLICY "Authenticated User Delete Own Media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id IN ('community-posts', 'avatars', 'event-photos', 'post_media', 'stories'));

-- 2. Ensure conversation_settings table exists
CREATE TABLE IF NOT EXISTS public.conversation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_muted BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  custom_theme VARCHAR(50) DEFAULT 'indigo',
  disappearing_duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

ALTER TABLE public.conversation_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own conversation settings" ON public.conversation_settings;
DROP POLICY IF EXISTS "Users insert/update own conversation settings" ON public.conversation_settings;

CREATE POLICY "Users read own conversation settings" ON public.conversation_settings
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users insert/update own conversation settings" ON public.conversation_settings
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

NOTIFY pgrst, 'reload schema';
