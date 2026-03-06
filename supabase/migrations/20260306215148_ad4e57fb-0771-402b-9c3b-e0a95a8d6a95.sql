
CREATE TABLE IF NOT EXISTS public.story_highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Highlight',
  cover_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, story_id)
);

ALTER TABLE public.story_highlights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view any highlights" ON public.story_highlights
  FOR SELECT USING (true);

CREATE POLICY "Users can create own highlights" ON public.story_highlights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own highlights" ON public.story_highlights
  FOR DELETE USING (auth.uid() = user_id);
