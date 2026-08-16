-- Restore admin PIN security for projects that were provisioned without the
-- original admin migrations. PINs are bcrypt hashes and are never returned.
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL DEFAULT jsonb_build_object(),
  description text,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can read settings" ON public.admin_settings;
CREATE POLICY "Admins can read settings" ON public.admin_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can create settings" ON public.admin_settings;
CREATE POLICY "Admins can create settings" ON public.admin_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can update settings" ON public.admin_settings;
CREATE POLICY "Admins can update settings" ON public.admin_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.admin_access_pin_is_set()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((setting_value ? 'hash') AND NULLIF(setting_value->>'hash', '') IS NOT NULL, false)
  FROM public.admin_settings WHERE setting_key = 'admin_access_pin'
$$;

CREATE OR REPLACE FUNCTION public.set_admin_access_pin(_pin text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF length(trim(_pin)) < 4 THEN RAISE EXCEPTION 'PIN must be at least 4 characters'; END IF;
  INSERT INTO public.admin_settings (setting_key, setting_value, updated_by, description, updated_at)
  VALUES ('admin_access_pin', jsonb_build_object('hash', extensions.crypt(trim(_pin), extensions.gen_salt('bf'))), auth.uid(), 'Hashed admin access PIN', now())
  ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_by = EXCLUDED.updated_by, updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_admin_access_pin(_pin text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE stored_hash text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN RETURN false; END IF;
  SELECT setting_value->>'hash' INTO stored_hash FROM public.admin_settings WHERE setting_key = 'admin_access_pin';
  RETURN stored_hash IS NOT NULL AND extensions.crypt(trim(_pin), stored_hash) = stored_hash;
END;
$$;
