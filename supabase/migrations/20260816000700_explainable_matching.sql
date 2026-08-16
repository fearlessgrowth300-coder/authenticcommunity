-- Explainable matching data. No AI-generated score is used for eligibility or enforcement.
CREATE TABLE IF NOT EXISTS public.recommendation_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  candidate_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  signal text NOT NULL CHECK (signal IN ('viewed','liked','passed','connected','message_sent','message_replied','not_interested')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.recommendation_feedback ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS recommendation_feedback_user_candidate_idx ON public.recommendation_feedback(user_id, candidate_id, created_at DESC);
DROP POLICY IF EXISTS "Members manage own recommendation feedback" ON public.recommendation_feedback;
CREATE POLICY "Members manage own recommendation feedback" ON public.recommendation_feedback FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Members read own recommendation feedback" ON public.recommendation_feedback;
CREATE POLICY "Members read own recommendation feedback" ON public.recommendation_feedback FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.user_social_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_group_size text CHECK (preferred_group_size IN ('small','mixed','large')),
  meetup_frequency text CHECK (meetup_frequency IN ('often','weekly','monthly','occasionally')),
  connection_style text CHECK (connection_style IN ('close_friends','professional','hobby','accountability','local_community','activity_partner')),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_social_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members manage own social preferences" ON public.user_social_preferences;
CREATE POLICY "Members manage own social preferences" ON public.user_social_preferences FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.recommendation_scores (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  candidate_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  overall_score integer NOT NULL, breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  reasons jsonb NOT NULL DEFAULT '[]'::jsonb, generated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, candidate_id)
);
ALTER TABLE public.recommendation_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members read own recommendation scores" ON public.recommendation_scores;
CREATE POLICY "Members read own recommendation scores" ON public.recommendation_scores FOR SELECT TO authenticated USING (auth.uid() = user_id);
