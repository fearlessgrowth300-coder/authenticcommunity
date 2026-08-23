-- ACC AI Recommendation Platform V1 - Phase AI-1 content intelligence.
-- Public content is queued asynchronously; content creation never waits for AI.

CREATE OR REPLACE FUNCTION public.get_recommendation_item_source(
  p_item_type TEXT,
  p_item_id UUID
)
RETURNS TABLE(content_hash TEXT, safe_input JSONB, eligible BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  source JSONB;
  allowed BOOLEAN := false;
  row_json JSONB;
BEGIN
  IF p_item_type IN ('post', 'video') THEN
    SELECT to_jsonb(p) INTO row_json FROM public.posts p WHERE p.id = p_item_id;
    IF row_json IS NULL THEN RETURN; END IF;
    allowed := COALESCE(row_json->>'visibility', 'public') = 'public'
      AND COALESCE(row_json->>'status', 'active') = 'active'
      AND (
        (p_item_type = 'video' AND row_json->>'content_type' = 'video') OR
        (p_item_type = 'post' AND COALESCE(row_json->>'content_type', 'text') <> 'video')
      );
    source := jsonb_strip_nulls(jsonb_build_object(
      'item_type', p_item_type,
      'text', left(COALESCE(row_json->>'content', ''), 8000),
      'topics', COALESCE(row_json->'interest_tags', '[]'::jsonb),
      'location_label', left(COALESCE(row_json->>'location_label', ''), 120)
    ));
  ELSIF p_item_type = 'profile' THEN
    SELECT to_jsonb(p) INTO row_json FROM public.profiles p WHERE p.id = p_item_id;
    IF row_json IS NULL THEN RETURN; END IF;
    allowed := COALESCE(row_json->>'profile_visibility', 'public') = 'public'
      AND COALESCE((row_json->>'is_active')::BOOLEAN, true)
      AND COALESCE(row_json->>'account_status', 'active') = 'active';
    source := jsonb_strip_nulls(jsonb_build_object(
      'item_type', 'profile',
      'text', left(COALESCE(row_json->>'bio', ''), 4000),
      'city', left(COALESCE(row_json->>'location_city', ''), 100),
      'country', left(COALESCE(row_json->>'location_country', ''), 100),
      'explicit_interests', COALESCE((
        SELECT jsonb_agg(ui.interest_name ORDER BY ui.interest_name)
        FROM public.user_interests ui
        WHERE ui.user_id = (row_json->>'user_id')::UUID
      ), '[]'::jsonb)
    ));
  ELSIF p_item_type = 'community' THEN
    SELECT to_jsonb(c) INTO row_json FROM public.communities c WHERE c.id = p_item_id;
    IF row_json IS NULL THEN RETURN; END IF;
    allowed := COALESCE(row_json->>'visibility', row_json->>'community_type', 'public') = 'public'
      AND COALESCE((row_json->>'is_active')::BOOLEAN, true);
    source := jsonb_strip_nulls(jsonb_build_object(
      'item_type', 'community',
      'name', left(COALESCE(row_json->>'community_name', ''), 160),
      'text', left(COALESCE(row_json->>'description', ''), 6000),
      'category', left(COALESCE(row_json->>'category', ''), 100),
      'city', left(COALESCE(row_json->>'location_city', ''), 100),
      'country', left(COALESCE(row_json->>'location_country', ''), 100)
    ));
  ELSIF p_item_type = 'event' THEN
    SELECT to_jsonb(e) INTO row_json FROM public.events e WHERE e.id = p_item_id;
    IF row_json IS NULL THEN RETURN; END IF;
    allowed := COALESCE(row_json->>'privacy', 'public') = 'public'
      AND COALESCE((row_json->>'is_active')::BOOLEAN, true);
    source := jsonb_strip_nulls(jsonb_build_object(
      'item_type', 'event',
      'name', left(COALESCE(row_json->>'name', ''), 160),
      'text', left(COALESCE(row_json->>'description', ''), 6000),
      'category', left(COALESCE(row_json->>'category', ''), 100)
    ));
  ELSE
    RAISE EXCEPTION 'Unsupported enrichment item type';
  END IF;

  safe_input := source;
  eligible := allowed AND length(trim(COALESCE(source->>'text', '') || ' ' || COALESCE(source->>'name', ''))) > 0;
  content_hash := encode(digest(source::TEXT, 'sha256'), 'hex');
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.get_recommendation_item_source(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_recommendation_item_source(TEXT, UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.enqueue_ai_enrichment(
  p_item_type TEXT,
  p_item_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  source_row RECORD;
BEGIN
  SELECT * INTO source_row
  FROM public.get_recommendation_item_source(p_item_type, p_item_id);

  IF NOT FOUND OR NOT source_row.eligible THEN
    DELETE FROM public.ai_enrichment_jobs
      WHERE item_type = p_item_type AND item_id = p_item_id
        AND status IN ('pending', 'processing');
    UPDATE public.recommendation_item_metadata
      SET enrichment_status = 'skipped', embedding = NULL,
          updated_at = now(), last_enriched_at = now()
      WHERE item_type = p_item_type AND item_id = p_item_id;
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.recommendation_item_metadata
    WHERE item_type = p_item_type AND item_id = p_item_id
      AND content_hash = source_row.content_hash
      AND enrichment_status = 'completed'
  ) THEN
    RETURN;
  END IF;

  UPDATE public.ai_enrichment_jobs
    SET status = 'skipped', updated_at = now(), last_error_code = 'SUPERSEDED'
    WHERE item_type = p_item_type AND item_id = p_item_id
      AND content_hash <> source_row.content_hash
      AND status IN ('pending', 'processing');

  INSERT INTO public.ai_enrichment_jobs (
    item_type, item_id, content_hash, status, attempt_count,
    next_attempt_at, last_error_code, created_at, updated_at
  ) VALUES (
    p_item_type, p_item_id, source_row.content_hash, 'pending', 0,
    now(), NULL, now(), now()
  )
  ON CONFLICT (item_type, item_id, content_hash) DO UPDATE SET
    status = CASE
      WHEN public.ai_enrichment_jobs.status = 'completed' THEN 'completed'
      ELSE 'pending'
    END,
    next_attempt_at = CASE
      WHEN public.ai_enrichment_jobs.status = 'completed' THEN public.ai_enrichment_jobs.next_attempt_at
      ELSE now()
    END,
    last_error_code = CASE
      WHEN public.ai_enrichment_jobs.status = 'completed' THEN public.ai_enrichment_jobs.last_error_code
      ELSE NULL
    END,
    updated_at = now();

  INSERT INTO public.recommendation_item_metadata (
    item_type, item_id, content_hash, enrichment_status, created_at, updated_at
  ) VALUES (
    p_item_type, p_item_id, source_row.content_hash, 'pending', now(), now()
  )
  ON CONFLICT (item_type, item_id) DO UPDATE SET
    content_hash = EXCLUDED.content_hash,
    enrichment_status = CASE
      WHEN public.recommendation_item_metadata.content_hash = EXCLUDED.content_hash
        AND public.recommendation_item_metadata.enrichment_status = 'completed'
      THEN 'completed' ELSE 'pending' END,
    updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_ai_enrichment(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_ai_enrichment(TEXT, UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.trigger_enqueue_post_enrichment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.enqueue_ai_enrichment(
    CASE WHEN COALESCE(to_jsonb(NEW)->>'content_type', 'text') = 'video' THEN 'video' ELSE 'post' END,
    NEW.id
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_enqueue_profile_enrichment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.enqueue_ai_enrichment('profile', NEW.id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_enqueue_profile_interest_enrichment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  profile_id UUID;
  target_user_id UUID;
BEGIN
  target_user_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.user_id ELSE NEW.user_id END;
  SELECT id INTO profile_id FROM public.profiles WHERE user_id = target_user_id;
  IF profile_id IS NOT NULL THEN
    PERFORM public.enqueue_ai_enrichment('profile', profile_id);
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_enqueue_community_enrichment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.enqueue_ai_enrichment('community', NEW.id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_enqueue_event_enrichment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.enqueue_ai_enrichment('event', NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_posts_ai_enrichment ON public.posts;
CREATE TRIGGER trg_posts_ai_enrichment
  AFTER INSERT OR UPDATE OF content, content_type, visibility, interest_tags, location_label, status
  ON public.posts FOR EACH ROW
  EXECUTE FUNCTION public.trigger_enqueue_post_enrichment();

DROP TRIGGER IF EXISTS trg_profiles_ai_enrichment ON public.profiles;
CREATE TRIGGER trg_profiles_ai_enrichment
  AFTER INSERT OR UPDATE OF bio, profile_visibility, location_city, location_country, is_active, account_status
  ON public.profiles FOR EACH ROW
  EXECUTE FUNCTION public.trigger_enqueue_profile_enrichment();

DROP TRIGGER IF EXISTS trg_user_interests_ai_enrichment ON public.user_interests;
CREATE TRIGGER trg_user_interests_ai_enrichment
  AFTER INSERT OR UPDATE OF interest_name, proficiency_level OR DELETE
  ON public.user_interests FOR EACH ROW
  EXECUTE FUNCTION public.trigger_enqueue_profile_interest_enrichment();

DROP TRIGGER IF EXISTS trg_communities_ai_enrichment ON public.communities;
CREATE TRIGGER trg_communities_ai_enrichment
  AFTER INSERT OR UPDATE OF community_name, description, category, visibility,
    location_city, location_country, is_active
  ON public.communities FOR EACH ROW
  EXECUTE FUNCTION public.trigger_enqueue_community_enrichment();

-- Event privacy is read through to_jsonb so the source helper remains compatible
-- with older projects while the canonical privacy migration is being applied.
DROP TRIGGER IF EXISTS trg_events_ai_enrichment ON public.events;
CREATE TRIGGER trg_events_ai_enrichment
  AFTER INSERT OR UPDATE OF name, description, category, is_active
  ON public.events FOR EACH ROW
  EXECUTE FUNCTION public.trigger_enqueue_event_enrichment();

CREATE OR REPLACE FUNCTION public.claim_ai_enrichment_jobs(p_limit INTEGER DEFAULT 5)
RETURNS SETOF public.ai_enrichment_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_limit < 1 OR p_limit > 10 THEN
    RAISE EXCEPTION 'Job claim limit must be between 1 and 10';
  END IF;
  RETURN QUERY
  WITH claimable AS (
    SELECT id
    FROM public.ai_enrichment_jobs
    WHERE status IN ('pending', 'failed')
      AND next_attempt_at <= now()
      AND attempt_count < 5
    ORDER BY created_at
    FOR UPDATE SKIP LOCKED
    LIMIT p_limit
  )
  UPDATE public.ai_enrichment_jobs jobs
    SET status = 'processing', attempt_count = jobs.attempt_count + 1,
        updated_at = now(), last_error_code = NULL
    FROM claimable
    WHERE jobs.id = claimable.id
    RETURNING jobs.*;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_ai_enrichment_jobs(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_ai_enrichment_jobs(INTEGER) TO service_role;

-- Queue existing eligible public material without making this migration depend
-- on Gemini availability. Each call is content-hash idempotent.
DO $$
DECLARE item RECORD;
BEGIN
  FOR item IN SELECT id FROM public.posts LOOP
    PERFORM public.enqueue_ai_enrichment(
      CASE WHEN COALESCE((SELECT content_type FROM public.posts WHERE id = item.id), 'text') = 'video'
        THEN 'video' ELSE 'post' END,
      item.id
    );
  END LOOP;
  FOR item IN SELECT id FROM public.profiles LOOP
    PERFORM public.enqueue_ai_enrichment('profile', item.id);
  END LOOP;
  FOR item IN SELECT id FROM public.communities LOOP
    PERFORM public.enqueue_ai_enrichment('community', item.id);
  END LOOP;
  FOR item IN SELECT id FROM public.events LOOP
    PERFORM public.enqueue_ai_enrichment('event', item.id);
  END LOOP;
END;
$$;

NOTIFY pgrst, 'reload schema';
