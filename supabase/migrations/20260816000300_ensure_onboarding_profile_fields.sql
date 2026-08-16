-- Makes onboarding safe on freshly provisioned projects where earlier
-- incremental migrations may not have been applied.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS occupation TEXT,
  ADD COLUMN IF NOT EXISTS looking_for TEXT,
  ADD COLUMN IF NOT EXISTS target_countries TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS min_age INTEGER DEFAULT 18,
  ADD COLUMN IF NOT EXISTS max_age INTEGER DEFAULT 80,
  ADD COLUMN IF NOT EXISTS max_distance_km INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;

NOTIFY pgrst, 'reload schema';
