-- Comprehensive compatibility for a newly provisioned Authentic Community project.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS occupation TEXT,
  ADD COLUMN IF NOT EXISTS looking_for TEXT,
  ADD COLUMN IF NOT EXISTS target_countries TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS min_age INTEGER DEFAULT 18,
  ADD COLUMN IF NOT EXISTS max_age INTEGER DEFAULT 80,
  ADD COLUMN IF NOT EXISTS max_distance_km INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS account_status VARCHAR(50) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Some fresh projects are provisioned before the optional social-content tables.
-- Keep the core profile and moderation migration runnable in that state.
ALTER TABLE IF EXISTS public.stories ADD COLUMN IF NOT EXISTS interest_tags TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE IF EXISTS public.community_posts ADD COLUMN IF NOT EXISTS interest_tags TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE TABLE IF NOT EXISTS public.content_dismissals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, content_type, content_id)
);
ALTER TABLE public.content_dismissals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own content dismissals" ON public.content_dismissals;
CREATE POLICY "Users manage own content dismissals" ON public.content_dismissals
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_content_dismissals_user_content ON public.content_dismissals(user_id, content_type, content_id);
NOTIFY pgrst, 'reload schema';
