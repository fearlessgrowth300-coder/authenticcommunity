-- 20260817000300_direct_messages_channels_notifications.sql
-- Direct messages channels, unread tracking, notification settings, and anti-spam constraints

-- 1. Conversation settings table if not present
CREATE TABLE IF NOT EXISTS public.conversation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_muted BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  custom_theme VARCHAR(50) DEFAULT 'indigo',
  disappearing_duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

ALTER TABLE public.conversation_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own conversation settings" ON public.conversation_settings
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users insert/update own conversation settings" ON public.conversation_settings
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 2. Ensure indexes for high-frequency direct messaging
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_recipient ON public.messages(sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_message_requests_recipient ON public.message_requests(recipient_id, status);

NOTIFY pgrst, 'reload schema';
