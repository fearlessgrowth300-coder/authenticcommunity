-- Measure whether events create the relationships the product exists for.
-- Responses are private to the member and aggregate reporting can be added for hosts later.
CREATE TABLE public.event_connection_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attended BOOLEAN NOT NULL DEFAULT true,
  made_connection BOOLEAN,
  wants_follow_up BOOLEAN,
  feedback TEXT CHECK (char_length(feedback) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_connection_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their own event outcomes"
  ON public.event_connection_outcomes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Attendees can record their own outcome"
  ON public.event_connection_outcomes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.event_attendees
      WHERE event_attendees.event_id = event_connection_outcomes.event_id
        AND event_attendees.user_id = auth.uid()
        AND event_attendees.rsvp_status = 'going'
    )
  );

CREATE POLICY "Members can update their own event outcome"
  ON public.event_connection_outcomes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_event_connection_outcomes_updated_at
  BEFORE UPDATE ON public.event_connection_outcomes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_event_connection_outcomes_event ON public.event_connection_outcomes(event_id);
