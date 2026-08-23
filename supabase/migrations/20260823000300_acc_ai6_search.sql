-- ACC AI-6: rate-limited hybrid multi-category search.

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.ai_action_rate_limits (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, action)
);
ALTER TABLE public.ai_action_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.consume_ai_action_quota(
  p_user_id UUID,
  p_action TEXT,
  p_limit INTEGER,
  p_window_minutes INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE current_row public.ai_action_rate_limits%ROWTYPE;
BEGIN
  IF p_user_id IS NULL OR p_action IS NULL OR length(p_action) > 80 OR p_limit < 1 OR p_limit > 100 OR p_window_minutes < 1 OR p_window_minutes > 1440 THEN
    RAISE EXCEPTION 'Invalid AI quota request';
  END IF;
  SELECT * INTO current_row FROM public.ai_action_rate_limits
    WHERE user_id = p_user_id AND action = p_action FOR UPDATE;
  IF NOT FOUND OR current_row.window_start <= now() - make_interval(mins => p_window_minutes) THEN
    INSERT INTO public.ai_action_rate_limits(user_id, action, window_start, request_count, updated_at)
    VALUES (p_user_id, p_action, now(), 1, now())
    ON CONFLICT (user_id, action) DO UPDATE SET window_start = EXCLUDED.window_start, request_count = 1, updated_at = now();
    RETURN true;
  END IF;
  IF current_row.request_count >= p_limit THEN RETURN false; END IF;
  UPDATE public.ai_action_rate_limits SET request_count = request_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND action = p_action;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_ai_action_quota(UUID, TEXT, INTEGER, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consume_ai_action_quota(UUID, TEXT, INTEGER, INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.consume_ai_action_quota(UUID, TEXT, INTEGER, INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ai_action_quota(UUID, TEXT, INTEGER, INTEGER) TO service_role;

CREATE OR REPLACE FUNCTION public.search_recommendation_metadata(
  p_query_embedding extensions.vector(768),
  p_item_types TEXT[],
  p_limit INTEGER DEFAULT 60
)
RETURNS TABLE(item_type TEXT, item_id UUID, semantic_score DOUBLE PRECISION)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, extensions, pg_temp
AS $$
  SELECT metadata.item_type, metadata.item_id,
    GREATEST(0.0, LEAST(1.0, 1.0 - (metadata.embedding <=> p_query_embedding)))::DOUBLE PRECISION
  FROM public.recommendation_item_metadata metadata
  WHERE metadata.item_type = ANY(p_item_types)
    AND metadata.enrichment_status = 'completed'
    AND metadata.embedding IS NOT NULL
  ORDER BY metadata.embedding <=> p_query_embedding
  LIMIT LEAST(GREATEST(p_limit, 1), 100)
$$;
REVOKE ALL ON FUNCTION public.search_recommendation_metadata(extensions.vector, TEXT[], INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.search_recommendation_metadata(extensions.vector, TEXT[], INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.search_recommendation_metadata(extensions.vector, TEXT[], INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.search_recommendation_metadata(extensions.vector, TEXT[], INTEGER) TO service_role;

CREATE INDEX IF NOT EXISTS idx_profiles_search_name_trgm ON public.profiles
  USING gin ((coalesce(first_name, '') || ' ' || coalesce(last_name, '')) extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_communities_search_name_trgm ON public.communities
  USING gin (community_name extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_events_search_name_trgm ON public.events
  USING gin (name extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_posts_search_content_trgm ON public.posts
  USING gin (content extensions.gin_trgm_ops);

UPDATE public.recommendation_algorithm_versions
SET weights = '{
  "text_relevance": 0.45,
  "semantic_relevance": 0.30,
  "type_specific_relevance": 0.15,
  "freshness_quality": 0.10,
  "simple_query_skips_intent_llm": true,
  "intent_ai_hourly_limit": 20,
  "embedding_hourly_limit": 30
}'::jsonb,
major_changes = 'ACC AI-6: multi-category hybrid text/vector search with deterministic intent first, rate-limited Gemini ambiguity handling and text fallback.',
activated_at = COALESCE(activated_at, now())
WHERE algorithm_version = 'search_v1';

NOTIFY pgrst, 'reload schema';
