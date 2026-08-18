-- Phase 6: Production Identity Verification Architecture

-- 1. Ensure profiles table has server-controlled verification columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- 2. Dedicated identity_verifications table
CREATE TABLE IF NOT EXISTS public.identity_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'mock', -- 'mock', 'stripe_identity', 'persona', 'veriff', 'sumsub', 'onfido'
  provider_reference TEXT,
  document_country TEXT NOT NULL DEFAULT 'US',
  document_type TEXT NOT NULL DEFAULT 'drivers_license'
    CHECK (document_type IN ('passport', 'drivers_license', 'national_id', 'residence_permit')),
  status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (status IN (
      'unverified',
      'pending',
      'requires_action',
      'manual_review',
      'verified',
      'failed',
      'expired',
      'revoked'
    )),
  identity_verified BOOLEAN NOT NULL DEFAULT false,
  liveness_verified BOOLEAN NOT NULL DEFAULT false,
  face_match_verified BOOLEAN NOT NULL DEFAULT false,
  failure_reason TEXT,
  failure_code TEXT,
  client_secret TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id)
);

-- 3. Enable RLS
ALTER TABLE public.identity_verifications ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Authenticated users can view their own verification record
DROP POLICY IF EXISTS "Users view own identity verification" ON public.identity_verifications;
CREATE POLICY "Users view own identity verification"
  ON public.identity_verifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Authenticated users can initiate verification records in non-verified statuses only
DROP POLICY IF EXISTS "Users initiate own identity verification" ON public.identity_verifications;
CREATE POLICY "Users initiate own identity verification"
  ON public.identity_verifications FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    status IN ('unverified', 'pending', 'requires_action') AND
    identity_verified = false AND
    liveness_verified = false AND
    face_match_verified = false
  );

-- Users can update draft document parameters before submission, but CANNOT self-approve
DROP POLICY IF EXISTS "Users update own draft verification" ON public.identity_verifications;
CREATE POLICY "Users update own draft verification"
  ON public.identity_verifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND
    status IN ('unverified', 'pending', 'requires_action') AND
    identity_verified = false AND
    liveness_verified = false AND
    face_match_verified = false
  );

-- 5. Trigger to prevent normal users from modifying is_verified directly on public.profiles
CREATE OR REPLACE FUNCTION public.protect_profiles_is_verified()
RETURNS TRIGGER AS $$
BEGIN
  -- If invoked by normal authenticated client role, prevent changing is_verified
  IF current_setting('role', true) = 'authenticated' THEN
    IF OLD.is_verified IS DISTINCT FROM NEW.is_verified AND NEW.is_verified = true THEN
      RAISE EXCEPTION 'is_verified cannot be updated directly by client applications';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_profiles_is_verified ON public.profiles;
CREATE TRIGGER trg_protect_profiles_is_verified
  BEFORE UPDATE OF is_verified ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profiles_is_verified();

-- 6. Indexes for verification lookups
CREATE INDEX IF NOT EXISTS idx_identity_verifications_user ON public.identity_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_identity_verifications_status ON public.identity_verifications(status);
CREATE INDEX IF NOT EXISTS idx_identity_verifications_provider_ref ON public.identity_verifications(provider_reference);

NOTIFY pgrst, 'reload schema';
