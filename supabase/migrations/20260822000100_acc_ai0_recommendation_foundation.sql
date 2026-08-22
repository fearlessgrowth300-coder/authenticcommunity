-- ACC AI Recommendation Platform V1 - Phase AI-0 foundation.
-- Forward-only migration. Derived AI/recommendation data is server managed;
-- authenticated clients may only submit bounded, validated event batches.

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Content & Discovery remains the user-owned source for explicit controls.
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  messages_from TEXT NOT NULL DEFAULT 'connections',
  location_visibility TEXT NOT NULL DEFAULT 'city',
  show_online_status BOOLEAN NOT NULL DEFAULT true,
  read_receipts BOOLEAN NOT NULL DEFAULT true,
  discovery_area TEXT NOT NULL DEFAULT 'nearby',
  feed_balance TEXT NOT NULL DEFAULT 'balanced',
  learned_interests JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS personalization_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS exploration_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS recommendation_reset_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.user_preferences
  DROP CONSTRAINT IF EXISTS user_preferences_discovery_area_check,
  DROP CONSTRAINT IF EXISTS user_preferences_feed_balance_check;
ALTER TABLE public.user_preferences
  ADD CONSTRAINT user_preferences_discovery_area_check
    CHECK (discovery_area IN ('nearby', 'country', 'worldwide')),
  ADD CONSTRAINT user_preferences_feed_balance_check
    CHECK (feed_balance IN ('local', 'local_first', 'balanced', 'global', 'global_heavy'));

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own preferences" ON public.user_preferences;
CREATE POLICY "Users manage own preferences"
  ON public.user_preferences FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.recommendation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  surface TEXT NOT NULL CHECK (surface IN (
    'for_you', 'following', 'nearby', 'stories', 'videos', 'people',
    'communities', 'events', 'search', 'notifications'
  )),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'recommendation_impression', 'recommendation_open',
    'post_open', 'post_like', 'post_comment', 'post_save', 'post_share',
    'story_view', 'story_complete', 'story_reply',
    'video_start', 'video_watch', 'video_complete', 'video_replay',
    'profile_view', 'follow', 'unfollow', 'connection_request',
    'connection_accept', 'connection_remove', 'community_view',
    'community_join', 'community_leave', 'community_post', 'event_view',
    'event_save', 'event_rsvp', 'event_attend', 'not_interested',
    'see_more', 'see_fewer', 'mute', 'hide', 'block', 'report'
  )),
  item_type TEXT NOT NULL CHECK (item_type IN (
    'post', 'video', 'story', 'profile', 'community', 'event',
    'search_result', 'notification'
  )),
  item_id UUID,
  algorithm_version TEXT NOT NULL,
  rank_position INTEGER CHECK (rank_position IS NULL OR rank_position BETWEEN 1 AND 1000),
  reason_codes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  safe_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (session_id IS NULL OR length(session_id) <= 120),
  CHECK (length(algorithm_version) BETWEEN 1 AND 80),
  CHECK (cardinality(reason_codes) <= 12),
  CHECK (octet_length(safe_metadata::text) <= 4096)
);

CREATE INDEX IF NOT EXISTS idx_recommendation_events_user_created
  ON public.recommendation_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendation_events_surface_created
  ON public.recommendation_events(surface, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendation_events_item
  ON public.recommendation_events(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_events_algorithm_created
  ON public.recommendation_events(algorithm_version, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendation_events_type_created
  ON public.recommendation_events(event_type, created_at DESC);

ALTER TABLE public.recommendation_events ENABLE ROW LEVEL SECURITY;
-- No direct client policies: ingestion is only through log_recommendation_events.

CREATE TABLE IF NOT EXISTS public.recommendation_item_metadata (
  item_type TEXT NOT NULL CHECK (item_type IN ('post', 'video', 'story', 'profile', 'community', 'event')),
  item_id UUID NOT NULL,
  content_hash TEXT NOT NULL,
  topics JSONB NOT NULL DEFAULT '[]'::jsonb,
  language TEXT,
  location_scope TEXT NOT NULL DEFAULT 'unknown'
    CHECK (location_scope IN ('local', 'regional', 'country', 'global', 'unknown')),
  quality_features JSONB NOT NULL DEFAULT '{}'::jsonb,
  embedding extensions.vector(768),
  embedding_model TEXT,
  classification_model TEXT,
  metadata_version TEXT NOT NULL DEFAULT 'content_metadata_v1',
  enrichment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (enrichment_status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
  last_enriched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (item_type, item_id),
  CHECK (length(content_hash) BETWEEN 16 AND 128),
  CHECK (octet_length(topics::text) <= 16384),
  CHECK (octet_length(quality_features::text) <= 8192)
);

CREATE INDEX IF NOT EXISTS idx_recommendation_item_metadata_status
  ON public.recommendation_item_metadata(enrichment_status, updated_at);
CREATE INDEX IF NOT EXISTS idx_recommendation_item_metadata_type
  ON public.recommendation_item_metadata(item_type, updated_at DESC);
-- The production dataset is currently small. Exact cosine search is preferable
-- until row volume justifies an HNSW/IVFFlat index; avoid an empty ANN index now.

ALTER TABLE public.recommendation_item_metadata ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_topic_affinities (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  score DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (score BETWEEN -100 AND 100),
  source TEXT NOT NULL CHECK (source IN ('explicit', 'learned')),
  confidence DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 1),
  positive_signal_count INTEGER NOT NULL DEFAULT 0 CHECK (positive_signal_count >= 0),
  negative_signal_count INTEGER NOT NULL DEFAULT 0 CHECK (negative_signal_count >= 0),
  last_signal_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, topic, source),
  CHECK (length(topic) BETWEEN 1 AND 100)
);

CREATE INDEX IF NOT EXISTS idx_user_topic_affinities_rank
  ON public.user_topic_affinities(user_id, score DESC, updated_at DESC);
ALTER TABLE public.user_topic_affinities ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_recommendation_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preference_embedding extensions.vector(768),
  embedding_version TEXT,
  last_recomputed_at TIMESTAMPTZ,
  recommendation_reset_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_recommendation_profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.ai_enrichment_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type TEXT NOT NULL CHECK (item_type IN ('post', 'video', 'story', 'profile', 'community', 'event')),
  item_id UUID NOT NULL,
  content_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count BETWEEN 0 AND 10),
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (item_type, item_id, content_hash),
  CHECK (length(content_hash) BETWEEN 16 AND 128),
  CHECK (last_error_code IS NULL OR length(last_error_code) <= 120)
);

CREATE INDEX IF NOT EXISTS idx_ai_enrichment_jobs_queue
  ON public.ai_enrichment_jobs(status, next_attempt_at, created_at);
ALTER TABLE public.ai_enrichment_jobs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.ai_usage_daily (
  date DATE NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  task TEXT NOT NULL,
  calls BIGINT NOT NULL DEFAULT 0 CHECK (calls >= 0),
  success_count BIGINT NOT NULL DEFAULT 0 CHECK (success_count >= 0),
  failure_count BIGINT NOT NULL DEFAULT 0 CHECK (failure_count >= 0),
  input_units BIGINT NOT NULL DEFAULT 0 CHECK (input_units >= 0),
  output_units BIGINT NOT NULL DEFAULT 0 CHECK (output_units >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (date, provider, model, task)
);
ALTER TABLE public.ai_usage_daily ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.recommendation_metrics_daily (
  date DATE NOT NULL,
  surface TEXT NOT NULL,
  algorithm_version TEXT NOT NULL,
  impressions BIGINT NOT NULL DEFAULT 0,
  opens BIGINT NOT NULL DEFAULT 0,
  likes BIGINT NOT NULL DEFAULT 0,
  comments BIGINT NOT NULL DEFAULT 0,
  saves BIGINT NOT NULL DEFAULT 0,
  shares BIGINT NOT NULL DEFAULT 0,
  follows BIGINT NOT NULL DEFAULT 0,
  connection_requests BIGINT NOT NULL DEFAULT 0,
  connection_accepts BIGINT NOT NULL DEFAULT 0,
  community_joins BIGINT NOT NULL DEFAULT 0,
  event_rsvps BIGINT NOT NULL DEFAULT 0,
  story_replies BIGINT NOT NULL DEFAULT 0,
  meaningful_conversations BIGINT NOT NULL DEFAULT 0,
  not_interested BIGINT NOT NULL DEFAULT 0,
  mutes BIGINT NOT NULL DEFAULT 0,
  blocks BIGINT NOT NULL DEFAULT 0,
  reports BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (date, surface, algorithm_version),
  CHECK (
    impressions >= 0 AND opens >= 0 AND likes >= 0 AND comments >= 0 AND
    saves >= 0 AND shares >= 0 AND follows >= 0 AND connection_requests >= 0 AND
    connection_accepts >= 0 AND community_joins >= 0 AND event_rsvps >= 0 AND
    story_replies >= 0 AND meaningful_conversations >= 0 AND not_interested >= 0 AND
    mutes >= 0 AND blocks >= 0 AND reports >= 0
  )
);
ALTER TABLE public.recommendation_metrics_daily ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.recommendation_algorithm_versions (
  algorithm_version TEXT PRIMARY KEY,
  surface TEXT NOT NULL,
  weights JSONB NOT NULL DEFAULT '{}'::jsonb,
  major_changes TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'retired')),
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (octet_length(weights::text) <= 16384)
);
ALTER TABLE public.recommendation_algorithm_versions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.log_recommendation_events(p_events JSONB)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  event_row JSONB;
  inserted_count INTEGER := 0;
  event_item_id UUID;
  safe_metadata JSONB;
  safe_reason_codes TEXT[];
  allowed_metadata_keys CONSTANT TEXT[] := ARRAY[
    'dwell_time_ms', 'watch_time_ms', 'watch_percent', 'is_complete',
    'source', 'query_category', 'network_type', 'result_count'
  ];
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF jsonb_typeof(p_events) <> 'array' THEN
    RAISE EXCEPTION 'Events must be a JSON array';
  END IF;
  IF jsonb_array_length(p_events) < 1 OR jsonb_array_length(p_events) > 50 THEN
    RAISE EXCEPTION 'Event batch size must be between 1 and 50';
  END IF;

  FOR event_row IN SELECT value FROM jsonb_array_elements(p_events)
  LOOP
    IF jsonb_typeof(event_row) <> 'object' THEN
      RAISE EXCEPTION 'Each event must be an object';
    END IF;

    BEGIN
      event_item_id := NULLIF(event_row->>'item_id', '')::UUID;
    EXCEPTION WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'Invalid item id';
    END;

    SELECT COALESCE(jsonb_object_agg(key, value), '{}'::jsonb)
      INTO safe_metadata
      FROM jsonb_each(COALESCE(event_row->'safe_metadata', '{}'::jsonb))
      WHERE key = ANY (allowed_metadata_keys);

    IF octet_length(safe_metadata::text) > 4096 THEN
      RAISE EXCEPTION 'Event metadata is too large';
    END IF;

    SELECT COALESCE(array_agg(left(value, 80)), ARRAY[]::TEXT[])
      INTO safe_reason_codes
      FROM (
        SELECT value
        FROM jsonb_array_elements_text(COALESCE(event_row->'reason_codes', '[]'::jsonb))
        LIMIT 12
      ) reasons;

    INSERT INTO public.recommendation_events (
      user_id, session_id, surface, event_type, item_type, item_id,
      algorithm_version, rank_position, reason_codes, safe_metadata
    ) VALUES (
      current_user_id,
      NULLIF(left(event_row->>'session_id', 120), ''),
      event_row->>'surface',
      event_row->>'event_type',
      event_row->>'item_type',
      event_item_id,
      left(COALESCE(NULLIF(event_row->>'algorithm_version', ''), 'unknown_v1'), 80),
      CASE WHEN event_row ? 'rank_position' THEN (event_row->>'rank_position')::INTEGER ELSE NULL END,
      safe_reason_codes,
      safe_metadata
    );
    inserted_count := inserted_count + 1;
  END LOOP;

  RETURN inserted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.log_recommendation_events(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_recommendation_events(JSONB) TO authenticated;

CREATE OR REPLACE FUNCTION public.reset_my_recommendations()
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  reset_time TIMESTAMPTZ := now();
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO public.user_preferences (
    user_id, learned_interests, recommendation_reset_at, updated_at
  ) VALUES (
    current_user_id, '[]'::jsonb, reset_time, reset_time
  )
  ON CONFLICT (user_id) DO UPDATE SET
    learned_interests = '[]'::jsonb,
    recommendation_reset_at = EXCLUDED.recommendation_reset_at,
    updated_at = EXCLUDED.updated_at;

  DELETE FROM public.user_topic_affinities
    WHERE user_id = current_user_id AND source = 'learned';

  INSERT INTO public.user_recommendation_profiles (
    user_id, preference_embedding, embedding_version,
    last_recomputed_at, recommendation_reset_at, updated_at
  ) VALUES (
    current_user_id, NULL, NULL, NULL, reset_time, reset_time
  )
  ON CONFLICT (user_id) DO UPDATE SET
    preference_embedding = NULL,
    embedding_version = NULL,
    last_recomputed_at = NULL,
    recommendation_reset_at = EXCLUDED.recommendation_reset_at,
    updated_at = EXCLUDED.updated_at;

  RETURN reset_time;
END;
$$;

REVOKE ALL ON FUNCTION public.reset_my_recommendations() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reset_my_recommendations() TO authenticated;

CREATE OR REPLACE FUNCTION public.record_ai_usage(
  p_provider TEXT,
  p_model TEXT,
  p_task TEXT,
  p_success BOOLEAN,
  p_input_units BIGINT DEFAULT 0,
  p_output_units BIGINT DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF length(p_provider) NOT BETWEEN 1 AND 40 OR
     length(p_model) NOT BETWEEN 1 AND 120 OR
     length(p_task) NOT BETWEEN 1 AND 80 THEN
    RAISE EXCEPTION 'Invalid usage dimensions';
  END IF;

  INSERT INTO public.ai_usage_daily (
    date, provider, model, task, calls, success_count, failure_count,
    input_units, output_units, updated_at
  ) VALUES (
    CURRENT_DATE, p_provider, p_model, p_task, 1,
    CASE WHEN p_success THEN 1 ELSE 0 END,
    CASE WHEN p_success THEN 0 ELSE 1 END,
    GREATEST(COALESCE(p_input_units, 0), 0),
    GREATEST(COALESCE(p_output_units, 0), 0), now()
  )
  ON CONFLICT (date, provider, model, task) DO UPDATE SET
    calls = public.ai_usage_daily.calls + 1,
    success_count = public.ai_usage_daily.success_count + CASE WHEN p_success THEN 1 ELSE 0 END,
    failure_count = public.ai_usage_daily.failure_count + CASE WHEN p_success THEN 0 ELSE 1 END,
    input_units = public.ai_usage_daily.input_units + GREATEST(COALESCE(p_input_units, 0), 0),
    output_units = public.ai_usage_daily.output_units + GREATEST(COALESCE(p_output_units, 0), 0),
    updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.record_ai_usage(TEXT, TEXT, TEXT, BOOLEAN, BIGINT, BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_ai_usage(TEXT, TEXT, TEXT, BOOLEAN, BIGINT, BIGINT) TO service_role;

-- Seed explicit algorithm identities. Weights are documented and changed only
-- by migrations/server releases, never by mobile clients.
INSERT INTO public.recommendation_algorithm_versions (
  algorithm_version, surface, weights, major_changes, status, activated_at
) VALUES
  ('feed_foryou_v1', 'for_you', '{}'::jsonb, 'Initial ACC relevance, quality, diversity and exploration contract.', 'active', now()),
  ('feed_following_v1', 'following', '{}'::jsonb, 'Relationship-first mostly chronological following feed.', 'active', now()),
  ('feed_nearby_v1', 'nearby', '{}'::jsonb, 'Location-aware feed without exposing exact coordinates.', 'active', now()),
  ('stories_v1', 'stories', '{}'::jsonb, 'Close-relationship and freshness story ordering.', 'active', now()),
  ('video_v1', 'videos', '{}'::jsonb, 'Semantic relevance plus meaningful-action video ranking.', 'active', now()),
  ('people_v1', 'people', '{}'::jsonb, 'Deterministic compatibility with semantic assistance.', 'active', now()),
  ('communities_local_v1', 'communities', '{}'::jsonb, 'Local community relevance and quality.', 'active', now()),
  ('communities_global_v1', 'communities', '{}'::jsonb, 'Online/global community relevance and quality.', 'active', now()),
  ('events_v1', 'events', '{}'::jsonb, 'Strong local and schedule-aware event relevance.', 'active', now()),
  ('search_v1', 'search', '{}'::jsonb, 'Hybrid text and semantic retrieval.', 'active', now()),
  ('notifications_v1', 'notifications', '{}'::jsonb, 'Priority and fatigue-aware notifications.', 'active', now())
ON CONFLICT (algorithm_version) DO NOTHING;

NOTIFY pgrst, 'reload schema';
