-- Add unique constraint on profiles.user_id so upsert works correctly
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);