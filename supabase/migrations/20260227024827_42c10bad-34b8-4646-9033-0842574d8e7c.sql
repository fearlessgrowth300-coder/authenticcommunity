
-- Sticker packs table
CREATE TABLE public.sticker_packs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  creator_id UUID,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.sticker_packs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view sticker packs" ON public.sticker_packs FOR SELECT USING (true);
CREATE POLICY "Users can create sticker packs" ON public.sticker_packs FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Stickers table
CREATE TABLE public.stickers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pack_id UUID REFERENCES public.sticker_packs(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.stickers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view stickers" ON public.stickers FOR SELECT USING (true);
CREATE POLICY "Pack creators can add stickers" ON public.stickers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.sticker_packs WHERE id = pack_id AND creator_id = auth.uid())
);

-- User saved stickers (when users save stickers from conversations)
CREATE TABLE public.user_saved_stickers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sticker_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, sticker_url)
);
ALTER TABLE public.user_saved_stickers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own saved stickers" ON public.user_saved_stickers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save stickers" ON public.user_saved_stickers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove saved stickers" ON public.user_saved_stickers FOR DELETE USING (auth.uid() = user_id);

-- Add disappearing messages columns
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS disappears_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS sticker_url TEXT;

-- Conversation settings for disappearing messages
CREATE TABLE public.conversation_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  other_user_id UUID NOT NULL,
  disappearing_duration INTEGER, -- in seconds, NULL = off
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, other_user_id)
);
ALTER TABLE public.conversation_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own conversation settings" ON public.conversation_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create conversation settings" ON public.conversation_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversation settings" ON public.conversation_settings FOR UPDATE USING (auth.uid() = user_id);

-- Call signaling table for WebRTC
CREATE TABLE public.call_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  caller_id UUID NOT NULL,
  callee_id UUID NOT NULL,
  signal_type TEXT NOT NULL, -- 'offer', 'answer', 'ice-candidate', 'hangup'
  signal_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.call_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their call signals" ON public.call_signals FOR SELECT USING (auth.uid() = caller_id OR auth.uid() = callee_id);
CREATE POLICY "Users can send call signals" ON public.call_signals FOR INSERT WITH CHECK (auth.uid() = caller_id);
CREATE POLICY "Users can delete call signals" ON public.call_signals FOR DELETE USING (auth.uid() = caller_id OR auth.uid() = callee_id);

-- Enable realtime for call signals
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_signals;

-- Storage bucket for stickers
INSERT INTO storage.buckets (id, name, public) VALUES ('stickers', 'stickers', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Anyone can view stickers" ON storage.objects FOR SELECT USING (bucket_id = 'stickers');
CREATE POLICY "Authenticated users can upload stickers" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'stickers' AND auth.uid() IS NOT NULL);
