-- ACC AI-8: retention and production hardening.
-- Aggregate metrics must be refreshed before raw event pruning. Social graph,
-- moderation, messaging and event attendance records are never touched here.

CREATE OR REPLACE FUNCTION public.purge_old_recommendation_events(
  p_before DATE DEFAULT (CURRENT_DATE - 180)
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE deleted_count BIGINT := 0;
BEGIN
  IF p_before > CURRENT_DATE - 90 OR p_before < CURRENT_DATE - 3650 THEN
    RAISE EXCEPTION 'Retention boundary must be between 90 days and 10 years ago';
  END IF;

  DELETE FROM public.recommendation_events
  WHERE created_at < p_before::timestamptz;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_old_recommendation_events(DATE) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.purge_old_recommendation_events(DATE) FROM anon;
REVOKE ALL ON FUNCTION public.purge_old_recommendation_events(DATE) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.purge_old_recommendation_events(DATE) TO service_role;

COMMENT ON FUNCTION public.purge_old_recommendation_events(DATE) IS
  'Service-only raw recommendation event retention. Refresh daily aggregate metrics before pruning.';

NOTIFY pgrst, 'reload schema';
