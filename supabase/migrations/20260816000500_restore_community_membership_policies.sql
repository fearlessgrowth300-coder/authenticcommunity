-- Fresh projects can have the community tables without the policies that make
-- membership readable after a page reload. Keep participation checks reliable.
ALTER TABLE IF EXISTS public.community_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view members" ON public.community_members;
DROP POLICY IF EXISTS "Users can join communities" ON public.community_members;
DROP POLICY IF EXISTS "Users can leave communities" ON public.community_members;

CREATE POLICY "Anyone can view members"
  ON public.community_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join communities"
  ON public.community_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave communities"
  ON public.community_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER TABLE IF EXISTS public.community_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view community messages" ON public.community_messages;
DROP POLICY IF EXISTS "Members can send community messages" ON public.community_messages;

CREATE POLICY "Members can view community messages"
  ON public.community_messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_id = community_messages.community_id AND user_id = auth.uid()
  ));
CREATE POLICY "Members can send community messages"
  ON public.community_messages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_id = community_messages.community_id AND user_id = auth.uid()
  ) AND auth.uid() = sender_id);

NOTIFY pgrst, 'reload schema';
