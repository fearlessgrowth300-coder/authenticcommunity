-- ACC AI-7: deterministic notification ranking, fatigue controls, and
-- privacy-safe behavioral learning. No LLM is used in this phase.

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS priority_score INTEGER NOT NULL DEFAULT 45
    CHECK (priority_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS algorithm_version TEXT NOT NULL DEFAULT 'notifications_v1',
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dismissed_at TIMESTAMPTZ;

ALTER TABLE public.notification_settings
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS daily_notification_limit INTEGER NOT NULL DEFAULT 30
    CHECK (daily_notification_limit BETWEEN 5 AND 100),
  ADD COLUMN IF NOT EXISTS low_priority_daily_limit INTEGER NOT NULL DEFAULT 5
    CHECK (low_priority_daily_limit BETWEEN 0 AND 20);

CREATE INDEX IF NOT EXISTS idx_notifications_priority_inbox
  ON public.notifications(user_id, is_read, priority_score DESC, created_at DESC)
  WHERE dismissed_at IS NULL;

CREATE OR REPLACE FUNCTION public.notification_priority(p_type TEXT)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT CASE
    WHEN lower(COALESCE(p_type, '')) ~ '(direct_message|new_message|message|chat)' THEN 100
    WHEN lower(COALESCE(p_type, '')) ~ '(connection_accepted|connection_accept)' THEN 95
    WHEN lower(COALESCE(p_type, '')) ~ '(message_request|connection_request|join_request)' THEN 85
    WHEN lower(COALESCE(p_type, '')) ~ '(event_reminder|event_starting)' THEN 80
    WHEN lower(COALESCE(p_type, '')) ~ '(community_reply|community_mention|mention|reply)' THEN 70
    WHEN lower(COALESCE(p_type, '')) ~ '(followed|new_follower|follower)' THEN 55
    WHEN lower(COALESCE(p_type, '')) ~ '(community_activity|community_post|community_event)' THEN 50
    WHEN lower(COALESCE(p_type, '')) ~ '(recommended|recommendation|trending|content)' THEN 25
    ELSE 45
  END
$$;

UPDATE public.notifications
SET priority_score = public.notification_priority(type),
    algorithm_version = 'notifications_v1'
WHERE priority_score = 45 OR algorithm_version IS NULL;

CREATE OR REPLACE FUNCTION public.get_prioritized_notifications(p_limit INTEGER DEFAULT 100)
RETURNS TABLE(
  id UUID,
  type TEXT,
  title TEXT,
  message TEXT,
  is_read BOOLEAN,
  data JSONB,
  created_at TIMESTAMPTZ,
  priority_score INTEGER,
  algorithm_version TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  WITH preferences AS (
    SELECT
      COALESCE(settings.notify_matches, true) AS notify_matches,
      COALESCE(settings.notify_messages, true) AS notify_messages,
      COALESCE(settings.notify_communities, true) AS notify_communities,
      COALESCE(settings.notify_events, true) AS notify_events,
      COALESCE(settings.notify_followers, true) AS notify_followers,
      COALESCE(settings.notify_stories, true) AS notify_stories,
      settings.quiet_hours_start,
      settings.quiet_hours_end,
      COALESCE(settings.timezone, 'UTC') AS timezone,
      COALESCE(settings.daily_notification_limit, 30) AS daily_limit,
      COALESCE(settings.low_priority_daily_limit, 5) AS low_limit
    FROM (SELECT auth.uid() AS user_id) auth_context
    LEFT JOIN public.notification_settings settings ON settings.user_id = auth_context.user_id
  ), candidates AS (
    SELECT notification.*,
      public.notification_priority(notification.type) AS computed_priority,
      preferences.*,
      (now() AT TIME ZONE preferences.timezone)::time AS local_time,
      (notification.created_at AT TIME ZONE preferences.timezone)::date AS local_day
    FROM public.notifications notification
    CROSS JOIN preferences
    WHERE notification.user_id = auth.uid()
      AND notification.dismissed_at IS NULL
      AND CASE
        WHEN lower(notification.type) ~ '(direct_message|new_message|message|chat)' THEN preferences.notify_messages
        WHEN lower(notification.type) ~ '(community)' THEN preferences.notify_communities
        WHEN lower(notification.type) ~ '(event)' THEN preferences.notify_events
        WHEN lower(notification.type) ~ '(followed|new_follower|follower)' THEN preferences.notify_followers
        WHEN lower(notification.type) ~ '(story)' THEN preferences.notify_stories
        WHEN lower(notification.type) ~ '(connection|match|request)' THEN preferences.notify_matches
        ELSE true
      END
  ), scored AS (
    SELECT candidates.*,
      CASE
        WHEN quiet_hours_start IS NULL OR quiet_hours_end IS NULL THEN false
        WHEN quiet_hours_start <= quiet_hours_end THEN local_time BETWEEN quiet_hours_start AND quiet_hours_end
        ELSE local_time >= quiet_hours_start OR local_time <= quiet_hours_end
      END AS is_quiet,
      EXISTS (
        SELECT 1 FROM public.notifications high
        WHERE high.user_id = auth.uid() AND high.is_read = false
          AND high.dismissed_at IS NULL
          AND high.created_at >= now() - interval '24 hours'
          AND public.notification_priority(high.type) >= 80
      ) AS has_high_priority
    FROM candidates
  ), ranked AS (
    SELECT scored.*,
      row_number() OVER (PARTITION BY local_day ORDER BY computed_priority DESC, created_at DESC) AS daily_rank,
      count(*) FILTER (WHERE computed_priority < 40)
        OVER (PARTITION BY local_day ORDER BY created_at DESC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS low_rank
    FROM scored
  )
  SELECT ranked.id, ranked.type, ranked.title, ranked.message, ranked.is_read,
    COALESCE(ranked.data, '{}'::jsonb), ranked.created_at,
    ranked.computed_priority, 'notifications_v1'::TEXT
  FROM ranked
  WHERE ranked.daily_rank <= ranked.daily_limit
    AND (ranked.computed_priority >= 40 OR ranked.low_rank <= ranked.low_limit)
    AND NOT (ranked.is_quiet AND ranked.computed_priority < 80)
    AND NOT (ranked.has_high_priority AND ranked.computed_priority < 40)
  ORDER BY ranked.is_read ASC, ranked.computed_priority DESC, ranked.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 100), 1), 200)
$$;

REVOKE ALL ON FUNCTION public.get_prioritized_notifications(INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_prioritized_notifications(INTEGER) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_prioritized_notifications(INTEGER) TO authenticated;

CREATE OR REPLACE FUNCTION public.recommendation_signal_weight(p_event_type TEXT)
RETURNS DOUBLE PRECISION
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT CASE p_event_type
    WHEN 'recommendation_open' THEN 0.25
    WHEN 'post_open' THEN 0.25
    WHEN 'post_like' THEN 0.8
    WHEN 'post_comment' THEN 1.5
    WHEN 'post_save' THEN 1.2
    WHEN 'post_share' THEN 1.8
    WHEN 'story_view' THEN 0.2
    WHEN 'story_complete' THEN 0.7
    WHEN 'story_reply' THEN 2.5
    WHEN 'video_watch' THEN 0.4
    WHEN 'video_complete' THEN 1.0
    WHEN 'video_replay' THEN 1.2
    WHEN 'profile_view' THEN 0.3
    WHEN 'follow' THEN 2.0
    WHEN 'connection_request' THEN 3.0
    WHEN 'connection_accept' THEN 4.0
    WHEN 'community_join' THEN 3.0
    WHEN 'community_post' THEN 2.0
    WHEN 'event_save' THEN 1.5
    WHEN 'event_rsvp' THEN 3.0
    WHEN 'event_attend' THEN 5.0
    WHEN 'see_more' THEN 1.0
    WHEN 'not_interested' THEN -2.0
    WHEN 'see_fewer' THEN -1.0
    WHEN 'mute' THEN -3.0
    WHEN 'hide' THEN -2.5
    WHEN 'block' THEN -5.0
    WHEN 'report' THEN -5.0
    ELSE 0.0
  END
$$;

CREATE OR REPLACE FUNCTION public.refresh_user_recommendation_learning(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE learned_count INTEGER := 0;
BEGIN
  IF p_user_id IS NULL THEN RAISE EXCEPTION 'User id is required'; END IF;

  DELETE FROM public.user_topic_affinities
  WHERE user_id = p_user_id AND source = 'learned';

  WITH reset_boundary AS (
    SELECT COALESCE(recommendation_reset_at, '-infinity'::timestamptz) AS reset_at
    FROM public.user_preferences WHERE user_id = p_user_id
  ), weighted_topics AS (
    SELECT lower(left(topic.value, 100)) AS topic,
      public.recommendation_signal_weight(event.event_type)
        * exp(-EXTRACT(EPOCH FROM (now() - event.created_at)) / 2592000.0) AS decayed_weight
    FROM public.recommendation_events event
    JOIN public.recommendation_item_metadata metadata
      ON metadata.item_type = event.item_type AND metadata.item_id = event.item_id
    CROSS JOIN LATERAL jsonb_array_elements_text(
      CASE WHEN jsonb_typeof(metadata.topics) = 'array' THEN metadata.topics ELSE '[]'::jsonb END
    ) topic
    LEFT JOIN reset_boundary ON true
    WHERE event.user_id = p_user_id
      AND event.created_at >= now() - interval '90 days'
      AND event.created_at >= COALESCE(reset_boundary.reset_at, '-infinity'::timestamptz)
      AND public.recommendation_signal_weight(event.event_type) <> 0
  ), aggregated AS (
    SELECT topic,
      GREATEST(-100.0, LEAST(100.0, sum(decayed_weight)))::DOUBLE PRECISION AS score,
      count(*) FILTER (WHERE decayed_weight > 0)::INTEGER AS positive_count,
      count(*) FILTER (WHERE decayed_weight < 0)::INTEGER AS negative_count
    FROM weighted_topics
    WHERE length(topic) BETWEEN 1 AND 100
    GROUP BY topic
  )
  INSERT INTO public.user_topic_affinities(
    user_id, topic, score, source, confidence,
    positive_signal_count, negative_signal_count, last_signal_at, updated_at
  )
  SELECT p_user_id, topic, score, 'learned',
    LEAST(1.0, (positive_count + negative_count) / 10.0),
    positive_count, negative_count, now(), now()
  FROM aggregated
  WHERE abs(score) >= 0.05;

  GET DIAGNOSTICS learned_count = ROW_COUNT;

  INSERT INTO public.user_preferences(user_id, learned_interests, updated_at)
  VALUES (
    p_user_id,
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', affinity.topic,
        'name', initcap(affinity.topic),
        'strength', CASE WHEN affinity.score >= 3 THEN 'High' WHEN affinity.score >= 1 THEN 'Medium' ELSE 'Low' END
      ) ORDER BY affinity.score DESC)
      FROM (
        SELECT topic, score FROM public.user_topic_affinities
        WHERE user_id = p_user_id AND source = 'learned' AND score > 0
        ORDER BY score DESC LIMIT 20
      ) affinity
    ), '[]'::jsonb),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    learned_interests = EXCLUDED.learned_interests,
    updated_at = EXCLUDED.updated_at;

  RETURN learned_count;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_user_recommendation_learning(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refresh_user_recommendation_learning(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.refresh_user_recommendation_learning(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_user_recommendation_learning(UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.refresh_my_recommendation_learning()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE current_user_id UUID := auth.uid();
BEGIN
  IF current_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF NOT public.consume_ai_action_quota(current_user_id, 'learning_refresh', 2, 60) THEN
    RETURN 0;
  END IF;
  RETURN public.refresh_user_recommendation_learning(current_user_id);
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_my_recommendation_learning() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refresh_my_recommendation_learning() FROM anon;
GRANT EXECUTE ON FUNCTION public.refresh_my_recommendation_learning() TO authenticated;

CREATE OR REPLACE FUNCTION public.refresh_recommendation_metrics(p_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE metric_count INTEGER := 0;
BEGIN
  INSERT INTO public.recommendation_metrics_daily(
    date, surface, algorithm_version, impressions, opens, likes, comments,
    saves, shares, follows, connection_requests, connection_accepts,
    community_joins, event_rsvps, story_replies, meaningful_conversations,
    not_interested, mutes, blocks, reports, updated_at
  )
  SELECT p_date, surface, algorithm_version,
    count(*) FILTER (WHERE event_type = 'recommendation_impression'),
    count(*) FILTER (WHERE event_type IN ('recommendation_open', 'post_open', 'profile_view', 'community_view', 'event_view')),
    count(*) FILTER (WHERE event_type = 'post_like'),
    count(*) FILTER (WHERE event_type = 'post_comment'),
    count(*) FILTER (WHERE event_type IN ('post_save', 'event_save')),
    count(*) FILTER (WHERE event_type = 'post_share'),
    count(*) FILTER (WHERE event_type = 'follow'),
    count(*) FILTER (WHERE event_type = 'connection_request'),
    count(*) FILTER (WHERE event_type = 'connection_accept'),
    count(*) FILTER (WHERE event_type = 'community_join'),
    count(*) FILTER (WHERE event_type = 'event_rsvp'),
    count(*) FILTER (WHERE event_type = 'story_reply'),
    count(*) FILTER (WHERE event_type IN ('story_reply', 'post_comment', 'community_post', 'event_attend')),
    count(*) FILTER (WHERE event_type = 'not_interested'),
    count(*) FILTER (WHERE event_type = 'mute'),
    count(*) FILTER (WHERE event_type = 'block'),
    count(*) FILTER (WHERE event_type = 'report'),
    now()
  FROM public.recommendation_events
  WHERE created_at >= p_date::timestamptz
    AND created_at < (p_date + 1)::timestamptz
  GROUP BY surface, algorithm_version
  ON CONFLICT (date, surface, algorithm_version) DO UPDATE SET
    impressions = EXCLUDED.impressions, opens = EXCLUDED.opens,
    likes = EXCLUDED.likes, comments = EXCLUDED.comments,
    saves = EXCLUDED.saves, shares = EXCLUDED.shares,
    follows = EXCLUDED.follows,
    connection_requests = EXCLUDED.connection_requests,
    connection_accepts = EXCLUDED.connection_accepts,
    community_joins = EXCLUDED.community_joins,
    event_rsvps = EXCLUDED.event_rsvps,
    story_replies = EXCLUDED.story_replies,
    meaningful_conversations = EXCLUDED.meaningful_conversations,
    not_interested = EXCLUDED.not_interested,
    mutes = EXCLUDED.mutes, blocks = EXCLUDED.blocks, reports = EXCLUDED.reports,
    updated_at = now();
  GET DIAGNOSTICS metric_count = ROW_COUNT;
  RETURN metric_count;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_recommendation_metrics(DATE) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refresh_recommendation_metrics(DATE) FROM anon;
REVOKE ALL ON FUNCTION public.refresh_recommendation_metrics(DATE) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_recommendation_metrics(DATE) TO service_role;

UPDATE public.recommendation_algorithm_versions
SET weights = '{
  "direct_message": 1.00,
  "connection_accepted": 0.95,
  "requests": 0.85,
  "event_reminder": 0.80,
  "community_reply": 0.70,
  "follower": 0.55,
  "community_activity": 0.50,
  "recommended_content": 0.25,
  "daily_limit": 30,
  "low_priority_daily_limit": 5,
  "quiet_hours_respect": true,
  "llm_per_notification": false
}'::jsonb,
major_changes = 'ACC AI-7: deterministic urgency, preference filtering, quiet hours, fatigue caps and decayed topic learning.',
activated_at = COALESCE(activated_at, now())
WHERE algorithm_version = 'notifications_v1';

NOTIFY pgrst, 'reload schema';
