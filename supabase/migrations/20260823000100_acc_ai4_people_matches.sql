-- ACC AI-4: deterministic People/Matches scoring, bounded semantic assistance,
-- cached safe explanations, and authenticated feedback.

-- These three tables originated in the explainable-matching migration. Create
-- them here as well so AI-4 remains forward-safe for projects where that older
-- migration was skipped; existing installations are extended in place.
CREATE TABLE IF NOT EXISTS public.recommendation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  signal TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_social_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_group_size TEXT CHECK (preferred_group_size IN ('small', 'mixed', 'large')),
  meetup_frequency TEXT CHECK (meetup_frequency IN ('often', 'weekly', 'monthly', 'occasionally')),
  connection_style TEXT CHECK (connection_style IN ('close_friends', 'professional', 'hobby', 'accountability', 'local_community', 'activity_partner')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.recommendation_scores (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL,
  breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, candidate_id)
);

ALTER TABLE public.recommendation_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_social_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_scores ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS recommendation_feedback_user_candidate_idx
  ON public.recommendation_feedback(user_id, candidate_id, created_at DESC);

DROP POLICY IF EXISTS "Members read own recommendation feedback" ON public.recommendation_feedback;
CREATE POLICY "Members read own recommendation feedback"
  ON public.recommendation_feedback FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Members manage own social preferences" ON public.user_social_preferences;
CREATE POLICY "Members manage own social preferences"
  ON public.user_social_preferences FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Members read own recommendation scores" ON public.recommendation_scores;
CREATE POLICY "Members read own recommendation scores"
  ON public.recommendation_scores FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

ALTER TABLE public.recommendation_scores
  ADD COLUMN IF NOT EXISTS algorithm_version TEXT NOT NULL DEFAULT 'people_v1',
  ADD COLUMN IF NOT EXISTS semantic_score DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS ai_explanation TEXT,
  ADD COLUMN IF NOT EXISTS conversation_starters JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.recommendation_scores
  DROP CONSTRAINT IF EXISTS recommendation_scores_semantic_score_check;
ALTER TABLE public.recommendation_scores
  ADD CONSTRAINT recommendation_scores_semantic_score_check
  CHECK (semantic_score IS NULL OR semantic_score BETWEEN 0 AND 1);

ALTER TABLE public.recommendation_scores
  DROP CONSTRAINT IF EXISTS recommendation_scores_ai_explanation_size_check;
ALTER TABLE public.recommendation_scores
  ADD CONSTRAINT recommendation_scores_ai_explanation_size_check
  CHECK (ai_explanation IS NULL OR octet_length(ai_explanation) <= 2000);

ALTER TABLE public.recommendation_scores
  DROP CONSTRAINT IF EXISTS recommendation_scores_starters_size_check;
ALTER TABLE public.recommendation_scores
  ADD CONSTRAINT recommendation_scores_starters_size_check
  CHECK (octet_length(conversation_starters::text) <= 8000);

ALTER TABLE public.recommendation_feedback
  DROP CONSTRAINT IF EXISTS recommendation_feedback_signal_check;
ALTER TABLE public.recommendation_feedback
  ADD CONSTRAINT recommendation_feedback_signal_check CHECK (signal IN (
    'viewed', 'profile_open', 'liked', 'saved', 'passed', 'followed',
    'connected', 'connection_requested', 'connection_accepted',
    'conversation_started', 'message_sent', 'message_replied',
    'repeat_interaction', 'not_interested'
  ));

DROP POLICY IF EXISTS "Members manage own recommendation feedback" ON public.recommendation_feedback;

CREATE OR REPLACE FUNCTION public.log_people_recommendation_feedback(
  p_candidate_id UUID,
  p_signal TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE caller_id UUID := auth.uid();
BEGIN
  IF caller_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_candidate_id IS NULL OR p_candidate_id = caller_id THEN RAISE EXCEPTION 'Invalid candidate'; END IF;
  IF p_signal NOT IN (
    'viewed', 'profile_open', 'liked', 'saved', 'passed', 'followed',
    'connected', 'connection_requested', 'connection_accepted',
    'conversation_started', 'message_sent', 'message_replied',
    'repeat_interaction', 'not_interested'
  ) THEN RAISE EXCEPTION 'Unsupported recommendation feedback'; END IF;
  INSERT INTO public.recommendation_feedback(user_id, candidate_id, signal)
  VALUES (caller_id, p_candidate_id, p_signal);
END;
$$;

REVOKE ALL ON FUNCTION public.log_people_recommendation_feedback(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.log_people_recommendation_feedback(UUID, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.log_people_recommendation_feedback(UUID, TEXT) TO authenticated;

CREATE INDEX IF NOT EXISTS idx_recommendation_scores_user_rank
  ON public.recommendation_scores(user_id, overall_score DESC, updated_at DESC);

UPDATE public.recommendation_algorithm_versions
SET weights = '{
  "values_compatibility": 0.30,
  "interest_compatibility": 0.20,
  "social_compatibility": 0.15,
  "shared_community_signals": 0.10,
  "geographic_compatibility": 0.10,
  "activity_availability": 0.05,
  "trust_account_quality": 0.05,
  "recommendation_feedback": 0.05,
  "semantic_share_of_interest_signal_max": 0.20
}'::jsonb,
major_changes = 'ACC AI-4: eligibility-first structured matching; profile embeddings assist only a bounded part of interest compatibility; Gemini never sets the score.',
activated_at = COALESCE(activated_at, now())
WHERE algorithm_version = 'people_v1';
