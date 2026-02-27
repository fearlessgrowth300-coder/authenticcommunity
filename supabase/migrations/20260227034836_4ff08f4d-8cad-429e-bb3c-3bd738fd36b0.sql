
-- Just verify the story_highlights table exists (it was created in previous migration)
-- Add the missing stories policy if it wasn't created
DO $$ 
BEGIN
  -- Check if policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'stories' AND policyname = 'Users can view own stories always'
  ) THEN
    CREATE POLICY "Users can view own stories always" ON public.stories FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;
