-- Hide admin profiles from non-admin users
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view allowed profiles" ON public.profiles;

CREATE POLICY "Users can view allowed profiles"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR NOT has_role(user_id, 'admin'::app_role)
);

-- Add secure admin PIN functions (hashed, server-side verification)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.admin_access_pin_is_set()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_settings
    WHERE setting_key = 'admin_access_pin'
      AND setting_value ? 'hash'
      AND NULLIF(setting_value->>'hash', '') IS NOT NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.set_admin_access_pin(_pin text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  hashed text;
BEGIN
  IF auth.uid() IS NULL OR NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF _pin IS NULL OR char_length(trim(_pin)) < 4 THEN
    RAISE EXCEPTION 'PIN must be at least 4 characters';
  END IF;

  hashed := crypt(trim(_pin), gen_salt('bf'));

  UPDATE public.admin_settings
  SET setting_value = jsonb_build_object('hash', hashed),
      updated_by = auth.uid(),
      updated_at = now(),
      description = COALESCE(description, 'Hashed admin access PIN')
  WHERE setting_key = 'admin_access_pin';

  IF NOT FOUND THEN
    INSERT INTO public.admin_settings (setting_key, setting_value, updated_by, description)
    VALUES ('admin_access_pin', jsonb_build_object('hash', hashed), auth.uid(), 'Hashed admin access PIN');
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_admin_access_pin(_pin text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_hash text;
BEGIN
  IF auth.uid() IS NULL OR NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN false;
  END IF;

  SELECT setting_value->>'hash'
  INTO stored_hash
  FROM public.admin_settings
  WHERE setting_key = 'admin_access_pin'
  ORDER BY updated_at DESC NULLS LAST
  LIMIT 1;

  IF stored_hash IS NULL OR _pin IS NULL THEN
    RETURN false;
  END IF;

  RETURN stored_hash = crypt(trim(_pin), stored_hash);
END;
$$;