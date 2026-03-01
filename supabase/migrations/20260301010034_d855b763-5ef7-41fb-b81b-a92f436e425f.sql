
-- Community join requests for private communities
CREATE TABLE public.community_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  UNIQUE(community_id, user_id)
);

ALTER TABLE public.community_join_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own join requests"
  ON public.community_join_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Community admins can view join requests"
  ON public.community_join_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.community_members
      WHERE community_members.community_id = community_join_requests.community_id
        AND community_members.user_id = auth.uid()
        AND community_members.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Users can create join requests"
  ON public.community_join_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Community admins can update join requests"
  ON public.community_join_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.community_members
      WHERE community_members.community_id = community_join_requests.community_id
        AND community_members.user_id = auth.uid()
        AND community_members.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Users can cancel own requests"
  ON public.community_join_requests FOR DELETE
  USING (auth.uid() = user_id AND status = 'pending');

-- Add extra profile fields for better matching
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS religion TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ethnicity TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS relationship_status TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS height_cm INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS smoking TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS drinking TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS children TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS languages TEXT[];

-- Create community-posts storage bucket for post images
INSERT INTO storage.buckets (id, name, public) VALUES ('community-posts', 'community-posts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for community-posts bucket
CREATE POLICY "Anyone can view community post images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'community-posts');

CREATE POLICY "Authenticated users can upload community post images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'community-posts' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete own community post images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'community-posts' AND auth.uid()::text = (storage.foldername(name))[1]);
