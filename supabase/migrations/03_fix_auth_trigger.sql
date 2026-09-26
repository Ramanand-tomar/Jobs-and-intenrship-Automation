-- 03_fix_auth_trigger.sql
-- Fix database trigger error on auth user creation (ON CONFLICT + Exception handling)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_full_name TEXT;
  user_email TEXT;
BEGIN
  user_full_name := COALESCE(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1),
    'User'
  );

  user_email := COALESCE(new.email, new.id::text || '@placeholder.local');

  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    new.id,
    user_full_name,
    user_email,
    COALESCE(new.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    avatar_url = CASE WHEN EXCLUDED.avatar_url <> '' THEN EXCLUDED.avatar_url ELSE profiles.avatar_url END,
    updated_at = CURRENT_TIMESTAMP;

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Catch any unforeseen DB error (e.g. duplicate email constraint) so auth signups/logins never fail
  RAISE WARNING 'handle_new_user trigger error: %', SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Re-grant execute permissions safely
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public;
