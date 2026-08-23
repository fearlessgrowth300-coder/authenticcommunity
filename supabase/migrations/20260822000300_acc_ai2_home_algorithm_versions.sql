-- ACC AI-2: make the three Home ranker weight contracts inspectable.
-- The mobile client never controls these values; changes require a server release.

UPDATE public.recommendation_algorithm_versions
SET
  weights = '{
    "relationship": 0.25,
    "interest": 0.20,
    "community": 0.15,
    "engagement_quality": 0.10,
    "freshness": 0.10,
    "local_relevance": 0.10,
    "content_quality": 0.05,
    "exploration_cap": 0.08
  }'::jsonb,
  major_changes = 'ACC AI-2: deterministic relationship, interest, community, quality, freshness and local relevance with bounded exploration and diversity.',
  activated_at = COALESCE(activated_at, now())
WHERE algorithm_version = 'feed_foryou_v1';

UPDATE public.recommendation_algorithm_versions
SET
  weights = '{
    "freshness": 0.80,
    "relationship": 0.15,
    "content_quality": 0.05,
    "relevance_reorder_cap": 0.20
  }'::jsonb,
  major_changes = 'ACC AI-2: mostly chronological followed-account feed with only bounded relationship and quality reordering.',
  activated_at = COALESCE(activated_at, now())
WHERE algorithm_version = 'feed_following_v1';

UPDATE public.recommendation_algorithm_versions
SET
  weights = '{
    "local_relevance": 0.42,
    "interest": 0.18,
    "relationship": 0.14,
    "community": 0.10,
    "freshness": 0.10,
    "content_quality": 0.06
  }'::jsonb,
  major_changes = 'ACC AI-2: general-area local-first ranking that never returns or explains with exact coordinates.',
  activated_at = COALESCE(activated_at, now())
WHERE algorithm_version = 'feed_nearby_v1';
