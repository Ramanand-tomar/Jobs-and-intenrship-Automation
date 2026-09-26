-- 1. Profiles Table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    github_url TEXT,
    linkedin_url TEXT,
    summary TEXT,
    skills TEXT[] DEFAULT '{}',
    experience JSONB DEFAULT '[]'::jsonb, -- Array of company, title, start, end, details
    education JSONB DEFAULT '[]'::jsonb,  -- Array of school, degree, field, graduation
    projects JSONB DEFAULT '[]'::jsonb,   -- Array of title, tech, description, link
    certifications TEXT[] DEFAULT '{}',
    completeness_percentage INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Job Applications Table
CREATE TABLE public.job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    platform TEXT CHECK (platform IN ('greenhouse', 'lever', 'workable', 'wellfound')),
    url TEXT NOT NULL,
    location TEXT,
    salary_range TEXT,
    match_percentage INT,
    status TEXT CHECK (status IN ('in_queue', 'detecting_fields', 'missing_profile_info', 'submitting', 'submitted', 'failed')),
    browserbase_session_id TEXT,
    is_saved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on job_applications
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- 3. Daily Apply Usage Table
CREATE TABLE public.daily_apply_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    apply_date DATE DEFAULT CURRENT_DATE,
    apply_count INT DEFAULT 0,
    CONSTRAINT unique_user_date UNIQUE (user_id, apply_date)
);

-- Enable RLS on daily_apply_usage
ALTER TABLE public.daily_apply_usage ENABLE ROW LEVEL SECURITY;

-- 4. Billing History Table
CREATE TABLE public.billing_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    stripe_invoice_id TEXT UNIQUE,
    amount_paid INT NOT NULL, -- Stored in cents
    currency TEXT NOT NULL,
    payment_status TEXT NOT NULL,
    billing_plan TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on billing_history
ALTER TABLE public.billing_history ENABLE ROW LEVEL SECURITY;

-- 5. Create Indexes for foreign keys
CREATE INDEX idx_job_applications_user_id ON public.job_applications(user_id);
CREATE INDEX idx_daily_apply_usage_user_id ON public.daily_apply_usage(user_id);
CREATE INDEX idx_billing_history_user_id ON public.billing_history(user_id);

-- 6. Trigger Function to sync auth.users with public.profiles
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
  RAISE WARNING 'handle_new_user trigger error: %', SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Revoke execute permissions from public role on this security definer trigger
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public;

-- Create the trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. RLS Policies
-- Profiles policies
CREATE POLICY select_own_profile ON public.profiles
  FOR SELECT
  TO authenticated
  USING ( (SELECT auth.uid()) = id );

CREATE POLICY update_own_profile ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ( (SELECT auth.uid()) = id )
  WITH CHECK ( (SELECT auth.uid()) = id );

-- Job Applications policies
CREATE POLICY select_own_job_applications ON public.job_applications
  FOR SELECT
  TO authenticated
  USING ( (SELECT auth.uid()) = user_id );

CREATE POLICY insert_own_job_applications ON public.job_applications
  FOR INSERT
  TO authenticated
  WITH CHECK ( (SELECT auth.uid()) = user_id );

CREATE POLICY update_own_job_applications ON public.job_applications
  FOR UPDATE
  TO authenticated
  USING ( (SELECT auth.uid()) = user_id )
  WITH CHECK ( (SELECT auth.uid()) = user_id );

CREATE POLICY delete_own_job_applications ON public.job_applications
  FOR DELETE
  TO authenticated
  USING ( (SELECT auth.uid()) = user_id );

-- Daily Apply Usage policies
CREATE POLICY select_own_daily_apply_usage ON public.daily_apply_usage
  FOR SELECT
  TO authenticated
  USING ( (SELECT auth.uid()) = user_id );

CREATE POLICY insert_own_daily_apply_usage ON public.daily_apply_usage
  FOR INSERT
  TO authenticated
  WITH CHECK ( (SELECT auth.uid()) = user_id );

CREATE POLICY update_own_daily_apply_usage ON public.daily_apply_usage
  FOR UPDATE
  TO authenticated
  USING ( (SELECT auth.uid()) = user_id )
  WITH CHECK ( (SELECT auth.uid()) = user_id );

-- Billing History policies
CREATE POLICY select_own_billing_history ON public.billing_history
  FOR SELECT
  TO authenticated
  USING ( (SELECT auth.uid()) = user_id );
