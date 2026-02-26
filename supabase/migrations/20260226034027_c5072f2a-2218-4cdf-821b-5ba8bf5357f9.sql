
-- Add new columns to profiles table for enhanced onboarding
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS occupation TEXT,
  ADD COLUMN IF NOT EXISTS looking_for TEXT,
  ADD COLUMN IF NOT EXISTS target_countries TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS min_age INTEGER DEFAULT 18,
  ADD COLUMN IF NOT EXISTS max_age INTEGER DEFAULT 80,
  ADD COLUMN IF NOT EXISTS max_distance_km INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;
