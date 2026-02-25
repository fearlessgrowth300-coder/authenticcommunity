
-- Create contact submissions table
CREATE TABLE public.contact_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert
CREATE POLICY "Authenticated users can submit contact forms"
ON public.contact_submissions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow anonymous submissions too (for logged-out users)
CREATE POLICY "Anyone can submit contact forms"
ON public.contact_submissions
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);

-- Only admins/service role can read submissions
CREATE POLICY "Service role can read submissions"
ON public.contact_submissions
FOR SELECT
TO service_role
USING (true);
