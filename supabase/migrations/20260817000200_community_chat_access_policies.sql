-- Access policies for the realtime community/chat tables added in 00100.

CREATE POLICY "Users create conversations" ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "Conversation creators add members" ON public.conversation_members FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.created_by = auth.uid()));
CREATE POLICY "Users leave conversations" ON public.conversation_members FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Members read conversation reactions" ON public.message_reactions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.messages m JOIN public.conversation_members cm ON cm.conversation_id = m.conversation_id WHERE m.id = message_id AND cm.user_id = auth.uid() AND cm.status = 'active'));
CREATE POLICY "Members react in conversations" ON public.message_reactions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.messages m JOIN public.conversation_members cm ON cm.conversation_id = m.conversation_id WHERE m.id = message_id AND cm.user_id = auth.uid() AND cm.status = 'active'));
CREATE POLICY "Users remove own message reactions" ON public.message_reactions FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Participants read message requests" ON public.message_requests FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());
CREATE POLICY "Users create one message request" ON public.message_requests FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Recipients resolve message requests" ON public.message_requests FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid()) WITH CHECK (recipient_id = auth.uid());

CREATE POLICY "Moderators read moderation history" ON public.moderation_actions FOR SELECT TO authenticated
  USING (community_id IS NULL OR public.is_community_moderator(community_id, auth.uid()));
CREATE POLICY "Moderators create moderation history" ON public.moderation_actions FOR INSERT TO authenticated
  WITH CHECK (moderator_id = auth.uid() AND (community_id IS NULL OR public.is_community_moderator(community_id, auth.uid())));

NOTIFY pgrst, 'reload schema';
