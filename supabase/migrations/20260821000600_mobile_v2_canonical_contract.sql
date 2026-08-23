-- Mobile V2 canonical contract.
-- Existing production tables remain the source of truth. Compatibility tables
-- are retained for older clients, but new mobile code writes only to the
-- canonical event_attendees and post_saves tables.

CREATE TABLE IF NOT EXISTS public.conversation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  other_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_muted BOOLEAN NOT NULL DEFAULT false,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, other_user_id),
  CHECK (user_id <> other_user_id)
);

ALTER TABLE public.conversation_settings
  ADD COLUMN IF NOT EXISTS other_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.conversation_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own conversation settings" ON public.conversation_settings;
CREATE POLICY "Users can manage own conversation settings"
  ON public.conversation_settings FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND user_id <> other_user_id);

-- Compatibility mirrors for legacy clients. Mobile V2 does not dual-write.
CREATE TABLE IF NOT EXISTS public.event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'going',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read event rsvps" ON public.event_rsvps;
DROP POLICY IF EXISTS "Users can manage own event rsvps" ON public.event_rsvps;
CREATE POLICY "Public read event rsvps" ON public.event_rsvps FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage own event rsvps" ON public.event_rsvps FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.saved_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own saved posts" ON public.saved_posts;
CREATE POLICY "Users can manage own saved posts" ON public.saved_posts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.event_saves (
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(event_id, user_id)
);
ALTER TABLE public.event_saves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own saved events" ON public.event_saves;
CREATE POLICY "Users manage own saved events" ON public.event_saves FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Persist all Mobile V2 privacy and recommendation controls.
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS privacy TEXT NOT NULL DEFAULT 'public'
    CHECK (privacy IN ('public', 'followers', 'connections', 'community', 'private'));

CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  messages_from TEXT NOT NULL DEFAULT 'connections'
    CHECK (messages_from IN ('everyone', 'followers', 'connections', 'nobody')),
  location_visibility TEXT NOT NULL DEFAULT 'city'
    CHECK (location_visibility IN ('city', 'distance', 'hidden')),
  show_online_status BOOLEAN NOT NULL DEFAULT true,
  read_receipts BOOLEAN NOT NULL DEFAULT true,
  discovery_area TEXT NOT NULL DEFAULT 'nearby'
    CHECK (discovery_area IN ('nearby', 'country', 'worldwide')),
  feed_balance TEXT NOT NULL DEFAULT 'balanced'
    CHECK (feed_balance IN ('local', 'balanced', 'global')),
  learned_interests JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own preferences" ON public.user_preferences;
CREATE POLICY "Users manage own preferences" ON public.user_preferences FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  notify_matches BOOLEAN NOT NULL DEFAULT true,
  notify_messages BOOLEAN NOT NULL DEFAULT true,
  notify_communities BOOLEAN NOT NULL DEFAULT true,
  notify_events BOOLEAN NOT NULL DEFAULT true,
  notify_digest BOOLEAN NOT NULL DEFAULT true,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  notify_followers BOOLEAN NOT NULL DEFAULT true,
  notify_stories BOOLEAN NOT NULL DEFAULT true,
  push_notifications BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can insert own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can update own notification settings" ON public.notification_settings;
CREATE POLICY "Users can view own notification settings" ON public.notification_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notification settings" ON public.notification_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notification settings" ON public.notification_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.notification_settings
  ADD COLUMN IF NOT EXISTS notify_followers BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_stories BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN NOT NULL DEFAULT true;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.notification_settings'::regclass
      AND contype = 'f' AND conname = 'notification_settings_user_id_fkey'
  ) THEN
    ALTER TABLE public.notification_settings
      ADD CONSTRAINT notification_settings_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE public.feed_interactions
  ADD COLUMN IF NOT EXISTS target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS dwell_time_ms INTEGER;
ALTER TABLE public.feed_interactions DROP CONSTRAINT IF EXISTS feed_interactions_interaction_type_check;
ALTER TABLE public.feed_interactions ADD CONSTRAINT feed_interactions_interaction_type_check
  CHECK (interaction_type IN (
    'impression', 'like', 'comment', 'save', 'share', 'profile_open', 'follow',
    'connect', 'community_join', 'event_rsvp', 'hidden', 'reported'
  ));
ALTER TABLE public.feed_interactions DROP CONSTRAINT IF EXISTS feed_interactions_check;
ALTER TABLE public.feed_interactions DROP CONSTRAINT IF EXISTS feed_interactions_target_check;
ALTER TABLE public.feed_interactions ADD CONSTRAINT feed_interactions_target_check
  CHECK (
    post_id IS NOT NULL OR story_id IS NOT NULL OR target_user_id IS NOT NULL OR
    community_id IS NOT NULL OR event_id IS NOT NULL
  );
DROP POLICY IF EXISTS "Users reset own feed interactions" ON public.feed_interactions;
CREATE POLICY "Users reset own feed interactions" ON public.feed_interactions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users delete own notifications" ON public.notifications;
CREATE POLICY "Users delete own notifications" ON public.notifications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- The original community-chat migration created requests around a mandatory
-- conversation and an already-inserted message. Mobile V2 stores exactly one
-- pending first message on the request instead, so it cannot bypass approval.
ALTER TABLE public.message_requests
  ADD COLUMN IF NOT EXISTS initial_message TEXT,
  ADD COLUMN IF NOT EXISTS match_score INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.message_requests ALTER COLUMN conversation_id DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_message_requests_sender_recipient
  ON public.message_requests(sender_id, recipient_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversation_settings_user_pair
  ON public.conversation_settings(user_id, other_user_id)
  WHERE other_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_event_attendees_user_event ON public.event_attendees(user_id, event_id);
CREATE INDEX IF NOT EXISTS idx_post_saves_user_post ON public.post_saves(user_id, post_id);

-- Enforce message requests in the database, not only in the UI.
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Approved participants send messages" ON public.messages;
CREATE POLICY "Approved participants send messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND sender_id <> recipient_id AND
    NOT EXISTS (
      SELECT 1 FROM public.blocked_users b
      WHERE (b.blocker_id = sender_id AND b.blocked_id = recipient_id)
         OR (b.blocker_id = recipient_id AND b.blocked_id = sender_id)
    ) AND (
      EXISTS (
        SELECT 1 FROM public.connections c
        WHERE c.status IN ('active', 'accepted') AND
          ((c.user_id_1 = sender_id AND c.user_id_2 = recipient_id) OR
           (c.user_id_2 = sender_id AND c.user_id_1 = recipient_id))
      ) OR EXISTS (
        SELECT 1 FROM public.message_requests mr
        WHERE mr.status = 'accepted' AND
          ((mr.sender_id = sender_id AND mr.recipient_id = recipient_id) OR
           (mr.sender_id = recipient_id AND mr.recipient_id = sender_id))
      )
    )
  );

DROP POLICY IF EXISTS "Users create one message request" ON public.message_requests;
DROP POLICY IF EXISTS "Users can create message requests" ON public.message_requests;
DROP POLICY IF EXISTS "Users create rate limited message requests" ON public.message_requests;
CREATE POLICY "Users create rate limited message requests" ON public.message_requests FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND sender_id <> recipient_id AND
    NOT EXISTS (
      SELECT 1 FROM public.blocked_users b
      WHERE (b.blocker_id = sender_id AND b.blocked_id = recipient_id)
         OR (b.blocker_id = recipient_id AND b.blocked_id = sender_id)
    )
  );

CREATE OR REPLACE FUNCTION public.enforce_message_request_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT count(*) FROM public.message_requests
      WHERE sender_id = NEW.sender_id AND created_at >= now() - interval '1 day') >= 5 THEN
    RAISE EXCEPTION 'Daily message request limit reached';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_message_request_rate_limit ON public.message_requests;
CREATE TRIGGER trg_message_request_rate_limit
  BEFORE INSERT ON public.message_requests
  FOR EACH ROW EXECUTE FUNCTION public.enforce_message_request_rate_limit();

CREATE OR REPLACE FUNCTION public.accept_message_request(p_request_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_row public.message_requests%ROWTYPE;
BEGIN
  SELECT * INTO request_row FROM public.message_requests
  WHERE id = p_request_id AND recipient_id = auth.uid() AND status = 'pending'
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Message request not found or already resolved'; END IF;

  UPDATE public.message_requests
    SET status = 'accepted', updated_at = now()
    WHERE id = p_request_id;

  IF NULLIF(trim(request_row.initial_message), '') IS NOT NULL THEN
    INSERT INTO public.messages(sender_id, recipient_id, content, is_read)
    VALUES (request_row.sender_id, request_row.recipient_id, request_row.initial_message, false);
  END IF;
  RETURN request_row.sender_id;
END;
$$;
REVOKE ALL ON FUNCTION public.accept_message_request(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_message_request(UUID) TO authenticated;

-- Atomic community moderation actions. Clients cannot grant themselves roles
-- or create membership rows while a request is still pending.
CREATE OR REPLACE FUNCTION public.resolve_community_join_request(
  p_request_id UUID,
  p_approve BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_row public.community_join_requests%ROWTYPE;
BEGIN
  SELECT * INTO request_row FROM public.community_join_requests
  WHERE id = p_request_id AND status = 'pending'
  FOR UPDATE;
  IF NOT FOUND OR NOT public.is_community_moderator(request_row.community_id, auth.uid()) THEN
    RAISE EXCEPTION 'Join request not found or permission denied';
  END IF;

  UPDATE public.community_join_requests
    SET status = CASE WHEN p_approve THEN 'approved' ELSE 'declined' END,
        reviewed_by = auth.uid(), reviewed_at = now()
    WHERE id = p_request_id;

  IF p_approve THEN
    INSERT INTO public.community_members(community_id, user_id, role, status)
    VALUES(request_row.community_id, request_row.user_id, 'member', 'active')
    ON CONFLICT(community_id, user_id)
    DO UPDATE SET status = 'active';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.resolve_community_join_request(UUID, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_community_join_request(UUID, BOOLEAN) TO authenticated;

CREATE OR REPLACE FUNCTION public.moderate_community_member(
  p_community_id UUID,
  p_target_user_id UUID,
  p_action TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_role TEXT;
  target_role TEXT;
BEGIN
  SELECT role INTO actor_role FROM public.community_members
    WHERE community_id = p_community_id AND user_id = auth.uid() AND status = 'active';
  SELECT role INTO target_role FROM public.community_members
    WHERE community_id = p_community_id AND user_id = p_target_user_id;
  IF actor_role NOT IN ('owner', 'admin') OR target_role = 'owner' OR auth.uid() = p_target_user_id THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  IF p_action = 'make_moderator' THEN
    UPDATE public.community_members SET role = 'moderator' WHERE community_id = p_community_id AND user_id = p_target_user_id;
  ELSIF p_action = 'make_member' THEN
    UPDATE public.community_members SET role = 'member' WHERE community_id = p_community_id AND user_id = p_target_user_id;
  ELSIF p_action = 'mute' THEN
    UPDATE public.community_members SET status = 'muted', muted_until = now() + interval '24 hours'
      WHERE community_id = p_community_id AND user_id = p_target_user_id;
  ELSIF p_action = 'ban' THEN
    UPDATE public.community_members SET status = 'banned', muted_until = NULL
      WHERE community_id = p_community_id AND user_id = p_target_user_id;
  ELSIF p_action = 'unban' THEN
    UPDATE public.community_members SET status = 'active', muted_until = NULL
      WHERE community_id = p_community_id AND user_id = p_target_user_id;
  ELSIF p_action = 'remove' THEN
    DELETE FROM public.community_members WHERE community_id = p_community_id AND user_id = p_target_user_id;
  ELSE
    RAISE EXCEPTION 'Unsupported moderation action';
  END IF;

  INSERT INTO public.moderation_actions(community_id, moderator_id, target_user_id, action, reason, duration_seconds)
  VALUES(
    p_community_id,
    auth.uid(),
    p_target_user_id,
    CASE p_action WHEN 'make_moderator' THEN 'warn' WHEN 'make_member' THEN 'warn' WHEN 'remove' THEN 'remove_member' ELSE p_action END,
    p_reason,
    CASE WHEN p_action = 'mute' THEN 86400 ELSE NULL END
  );
END;
$$;
REVOKE ALL ON FUNCTION public.moderate_community_member(UUID, UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.moderate_community_member(UUID, UUID, TEXT, TEXT) TO authenticated;

DROP POLICY IF EXISTS "Community moderators read reports" ON public.reports;
CREATE POLICY "Community moderators read reports" ON public.reports FOR SELECT TO authenticated
  USING (community_id IS NOT NULL AND public.is_community_moderator(community_id, auth.uid()));
DROP POLICY IF EXISTS "Community moderators update reports" ON public.reports;
CREATE POLICY "Community moderators update reports" ON public.reports FOR UPDATE TO authenticated
  USING (community_id IS NOT NULL AND public.is_community_moderator(community_id, auth.uid()))
  WITH CHECK (community_id IS NOT NULL AND public.is_community_moderator(community_id, auth.uid()));

DROP POLICY IF EXISTS "Authors and moderators update community messages" ON public.community_messages;
CREATE POLICY "Authors and moderators update community messages" ON public.community_messages FOR UPDATE TO authenticated
  USING (sender_id = auth.uid() OR public.is_community_moderator(community_id, auth.uid()))
  WITH CHECK (sender_id = auth.uid() OR public.is_community_moderator(community_id, auth.uid()));

NOTIFY pgrst, 'reload schema';
