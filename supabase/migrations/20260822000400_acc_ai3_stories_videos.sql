-- ACC AI-3: semantic candidates plus inspectable Stories and Videos rankers.

CREATE OR REPLACE FUNCTION public.get_semantic_recommendation_scores(
  p_item_type TEXT,
  p_item_ids UUID[]
)
RETURNS TABLE(item_id UUID, semantic_score DOUBLE PRECISION)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  caller_id UUID := auth.uid();
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_item_type NOT IN ('post', 'video', 'story', 'profile', 'community', 'event') THEN
    RAISE EXCEPTION 'Unsupported recommendation item type';
  END IF;
  IF COALESCE(cardinality(p_item_ids), 0) = 0 THEN
    RETURN;
  END IF;
  IF cardinality(p_item_ids) > 200 THEN
    RAISE EXCEPTION 'Candidate limit exceeded';
  END IF;

  RETURN QUERY
  SELECT metadata.item_id,
    GREATEST(0.0, LEAST(1.0,
      1.0 - (metadata.embedding <=> profile.preference_embedding)
    ))::DOUBLE PRECISION
  FROM public.user_recommendation_profiles profile
  JOIN public.recommendation_item_metadata metadata
    ON metadata.item_type = p_item_type
   AND metadata.item_id = ANY(p_item_ids)
   AND metadata.enrichment_status = 'completed'
   AND metadata.embedding IS NOT NULL
  WHERE profile.user_id = caller_id
    AND profile.preference_embedding IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.get_semantic_recommendation_scores(TEXT, UUID[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_semantic_recommendation_scores(TEXT, UUID[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_semantic_recommendation_scores(TEXT, UUID[]) TO authenticated;

UPDATE public.recommendation_algorithm_versions
SET weights = '{
  "relationship_strength": 0.30,
  "recent_interaction": 0.25,
  "story_engagement_history": 0.15,
  "content_relevance": 0.10,
  "community_relationship": 0.10,
  "freshness": 0.10,
  "viewed_penalty_multiplier": 0.45
}'::jsonb,
major_changes = 'ACC AI-3: relationship-first active-story ordering with recent interaction, engagement history and viewed-story demotion.',
activated_at = COALESCE(activated_at, now())
WHERE algorithm_version = 'stories_v1';

UPDATE public.recommendation_algorithm_versions
SET weights = '{
  "topic_relevance": 0.25,
  "watch_quality": 0.15,
  "saves_and_shares": 0.15,
  "social_relevance": 0.15,
  "creator_quality": 0.10,
  "community_relevance": 0.10,
  "location_relevance": 0.05,
  "exploration": 0.05
}'::jsonb,
major_changes = 'ACC AI-3: semantic topic relevance plus bounded watch quality and relationship-producing outcomes; raw watch time never dominates.',
activated_at = COALESCE(activated_at, now())
WHERE algorithm_version = 'video_v1';

CREATE INDEX IF NOT EXISTS idx_recommendation_events_surface_item_time
  ON public.recommendation_events(surface, item_type, item_id, created_at DESC);
