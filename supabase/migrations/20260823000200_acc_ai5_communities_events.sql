-- ACC AI-5: local/global community rankers and geography-first events.

ALTER TABLE public.communities
  ADD COLUMN IF NOT EXISTS delivery_mode TEXT NOT NULL DEFAULT 'local'
    CHECK (delivery_mode IN ('local', 'online', 'hybrid'));

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS attendance_mode TEXT NOT NULL DEFAULT 'in_person'
    CHECK (attendance_mode IN ('in_person', 'online', 'hybrid')),
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('draft', 'scheduled', 'cancelled', 'completed'));

CREATE INDEX IF NOT EXISTS idx_communities_recommendation_candidates
  ON public.communities(is_active, delivery_mode, location_country, location_city, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_recommendation_candidates
  ON public.events(is_active, status, event_date, attendance_mode, privacy);

UPDATE public.recommendation_algorithm_versions
SET weights = '{
  "interest_relevance": 0.25,
  "geographic_relevance": 0.25,
  "connection_overlap": 0.15,
  "topic_value_fit": 0.10,
  "community_activity": 0.10,
  "quality_trust": 0.10,
  "exploration": 0.05,
  "semantic_share_of_interest_signal_max": 0.20
}'::jsonb,
major_changes = 'ACC AI-5: local and hybrid community ranking with strong geography, connection overlap, activity and bounded semantic assistance.',
activated_at = COALESCE(activated_at, now())
WHERE algorithm_version = 'communities_local_v1';

UPDATE public.recommendation_algorithm_versions
SET weights = '{
  "interest_relevance": 0.35,
  "topic_value_fit": 0.20,
  "connection_overlap": 0.15,
  "community_activity": 0.15,
  "quality": 0.10,
  "exploration": 0.05,
  "semantic_share_of_interest_signal_max": 0.20
}'::jsonb,
major_changes = 'ACC AI-5: online community ranking where topic fit and healthy activity replace geographic proximity.',
activated_at = COALESCE(activated_at, now())
WHERE algorithm_version = 'communities_global_v1';

UPDATE public.recommendation_algorithm_versions
SET weights = '{
  "distance_geography": 0.30,
  "date_time_suitability": 0.20,
  "interest_match": 0.20,
  "social_attendance": 0.10,
  "community_relevance": 0.10,
  "event_quality": 0.05,
  "freshness_trending": 0.05,
  "semantic_share_of_interest_signal_max": 0.20
}'::jsonb,
major_changes = 'ACC AI-5: eligibility-first upcoming event ranking; practical distance, date, visibility and capacity constraints precede relevance.',
activated_at = COALESCE(activated_at, now())
WHERE algorithm_version = 'events_v1';

NOTIFY pgrst, 'reload schema';
