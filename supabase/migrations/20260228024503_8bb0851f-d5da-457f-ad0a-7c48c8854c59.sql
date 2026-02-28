
-- =====================================================
-- VOICE MESSAGES: Add columns to messages table
-- =====================================================
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS voice_url TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS voice_duration INTEGER;

-- =====================================================
-- COMMUNITY POSTS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view community posts" ON public.community_posts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.community_members WHERE community_id = community_posts.community_id AND user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Members can create posts" ON public.community_posts
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.community_members WHERE community_id = community_posts.community_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update own posts" ON public.community_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON public.community_posts
  FOR DELETE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- COMMUNITY POST COMMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.community_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.community_post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view comments" ON public.community_post_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.community_posts cp
      JOIN public.community_members cm ON cm.community_id = cp.community_id
      WHERE cp.id = community_post_comments.post_id AND cm.user_id = auth.uid()
    ) OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Members can create comments" ON public.community_post_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON public.community_post_comments
  FOR DELETE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- COMMUNITY POST LIKES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.community_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.community_post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view post likes" ON public.community_post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can like posts" ON public.community_post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts" ON public.community_post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- COMMUNITY RESOURCES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.community_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  resource_url TEXT NOT NULL,
  resource_type TEXT DEFAULT 'link',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.community_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view resources" ON public.community_resources
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.community_members WHERE community_id = community_resources.community_id AND user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Members can add resources" ON public.community_resources
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.community_members WHERE community_id = community_resources.community_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete own resources" ON public.community_resources
  FOR DELETE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- EVENT CHAT MESSAGES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.event_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.event_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attendees can view event chat" ON public.event_chat_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.event_attendees WHERE event_id = event_chat_messages.event_id AND user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Attendees can send messages" ON public.event_chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.event_attendees WHERE event_id = event_chat_messages.event_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete own event messages" ON public.event_chat_messages
  FOR DELETE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- EVENT PHOTOS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.event_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.event_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view event photos" ON public.event_photos
  FOR SELECT USING (true);

CREATE POLICY "Attendees can upload photos" ON public.event_photos
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.event_attendees WHERE event_id = event_photos.event_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete own photos" ON public.event_photos
  FOR DELETE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- EVENT REVIEWS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.event_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL,
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" ON public.event_reviews
  FOR SELECT USING (true);

CREATE POLICY "Attendees can review" ON public.event_reviews
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.event_attendees WHERE event_id = event_reviews.event_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update own review" ON public.event_reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own review" ON public.event_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('voice-messages', 'voice-messages', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('event-photos', 'event-photos', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies for voice-messages
CREATE POLICY "Users can upload voice messages" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'voice-messages' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view voice messages" ON storage.objects
  FOR SELECT USING (bucket_id = 'voice-messages');

-- Storage policies for event-photos
CREATE POLICY "Users can upload event photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'event-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view event photos storage" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-photos');

-- Realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_post_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_chat_messages;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_community_posts_community ON public.community_posts(community_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_user ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_post_comments_post ON public.community_post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_post_likes_post ON public.community_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_resources_community ON public.community_resources(community_id);
CREATE INDEX IF NOT EXISTS idx_event_chat_messages_event ON public.event_chat_messages(event_id);
CREATE INDEX IF NOT EXISTS idx_event_photos_event ON public.event_photos(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reviews_event ON public.event_reviews(event_id);

-- Validation trigger for rating
CREATE OR REPLACE FUNCTION public.validate_event_review_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_review_rating
  BEFORE INSERT OR UPDATE ON public.event_reviews
  FOR EACH ROW EXECUTE FUNCTION public.validate_event_review_rating();
