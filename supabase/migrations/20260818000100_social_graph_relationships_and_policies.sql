-- Phase 4: Social Graph Relationship Policies and Performance Indexes

-- Ensure connections table has UPDATE and DELETE policies for accepting and removing connections
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'connections' AND policyname = 'Users can update own connections'
  ) THEN
    CREATE POLICY "Users can update own connections"
      ON public.connections FOR UPDATE TO authenticated
      USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2)
      WITH CHECK (auth.uid() = user_id_1 OR auth.uid() = user_id_2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'connections' AND policyname = 'Users can delete own connections'
  ) THEN
    CREATE POLICY "Users can delete own connections"
      ON public.connections FOR DELETE TO authenticated
      USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);
  END IF;
END $$;

-- Allow users to both unfollow (follower_id) and remove followers (following_id)
DROP POLICY IF EXISTS "Users can unfollow" ON public.user_follows;
CREATE POLICY "Users manage follows and followers"
  ON public.user_follows FOR DELETE TO authenticated
  USING (auth.uid() = follower_id OR auth.uid() = following_id);

-- Ensure matches table has DELETE policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'matches' AND policyname = 'Users can delete own matches'
  ) THEN
    CREATE POLICY "Users can delete own matches"
      ON public.matches FOR DELETE TO authenticated
      USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);
  END IF;
END $$;

-- Indexes for lightning fast graph lookups
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON public.user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_connections_pair ON public.connections(user_id_1, user_id_2);
CREATE INDEX IF NOT EXISTS idx_follow_requests_target ON public.follow_requests(target_id, status);

NOTIFY pgrst, 'reload schema';
