-- Phase 9: Production Security, Moderation Guards, and Performance Indexes

-- 1. Security Trigger: Prevent non-admin users from altering moderation columns on profiles
CREATE OR REPLACE FUNCTION public.protect_profiles_moderation_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if client is standard authenticated role and not an admin
  IF current_setting('role', true) = 'authenticated' AND NOT public.has_role(auth.uid(), 'admin') THEN
    -- Allow user to self-delete their own account
    IF NEW.account_status = 'deleted' AND OLD.account_status = 'active' THEN
      RETURN NEW;
    END IF;

    -- Prevent regular user from changing account_status (e.g. from suspended to active)
    IF OLD.account_status IS DISTINCT FROM NEW.account_status THEN
      RAISE EXCEPTION 'account_status can only be modified by system administrators';
    END IF;

    -- Prevent regular user from modifying suspended_until
    IF OLD.suspended_until IS DISTINCT FROM NEW.suspended_until THEN
      RAISE EXCEPTION 'suspended_until can only be modified by system administrators';
    END IF;

    -- Prevent regular user from modifying suspension_reason
    IF OLD.suspension_reason IS DISTINCT FROM NEW.suspension_reason THEN
      RAISE EXCEPTION 'suspension_reason can only be modified by system administrators';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_protect_profiles_moderation ON public.profiles;
CREATE TRIGGER trg_protect_profiles_moderation
  BEFORE UPDATE OF account_status, suspended_until, suspension_reason ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profiles_moderation_fields();

-- 2. Performance Indexes for Query Optimization & Scalability

-- Posts & Feed Indexes
CREATE INDEX IF NOT EXISTS idx_posts_active_community ON public.posts(community_id, created_at DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_posts_visibility_feed ON public.posts(visibility, created_at DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_post_media_post_order ON public.post_media(post_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_created ON public.post_comments(post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON public.post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_saves_user ON public.post_saves(user_id, created_at DESC);

-- Social Graph & Connections Indexes
CREATE INDEX IF NOT EXISTS idx_user_follows_compound ON public.user_follows(follower_id, following_id);
CREATE INDEX IF NOT EXISTS idx_connections_user1 ON public.connections(user_id_1);
CREATE INDEX IF NOT EXISTS idx_connections_user2 ON public.connections(user_id_2);
CREATE INDEX IF NOT EXISTS idx_follow_requests_requester ON public.follow_requests(requester_id, status);

-- Direct & Community Messaging Indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_messages_channel ON public.community_messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_members_composite ON public.community_members(community_id, user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_members_user ON public.conversation_members(user_id, conversation_id);

-- Events & Stories Indexes
CREATE INDEX IF NOT EXISTS idx_events_date_active ON public.events(event_date) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_event_attendees_composite ON public.event_attendees(event_id, user_id);
CREATE INDEX IF NOT EXISTS idx_stories_active_expires ON public.stories(expires_at DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_story_views_composite ON public.story_views(story_id, viewer_id);

-- Notifications & Safety Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON public.blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON public.blocked_users(blocked_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status, created_at DESC);

NOTIFY pgrst, 'reload schema';
