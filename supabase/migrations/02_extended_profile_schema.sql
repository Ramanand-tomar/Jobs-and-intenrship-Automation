-- 02_extended_profile_schema.sql
-- Migration to add extended profile fields for FAANG-level ATS resumes and zero-hallucination metrics

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS skills_categorized JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS awards JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS publications JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS volunteer_experience JSONB DEFAULT '[]'::jsonb;

-- Comment on extended profile JSONB structures
COMMENT ON COLUMN public.profiles.skills_categorized IS 'Categorized skills object mapping category name to array of skills, e.g. {"Programming Languages": ["TypeScript", "Python"]}';
COMMENT ON COLUMN public.profiles.awards IS 'Array of structured award objects: [{title, issuer, date, description}]';
COMMENT ON COLUMN public.profiles.publications IS 'Array of publication objects: [{title, venue, date, url, authors}]';
COMMENT ON COLUMN public.profiles.languages IS 'Array of language objects: [{language, proficiency}]';
COMMENT ON COLUMN public.profiles.volunteer_experience IS 'Array of volunteer experience objects: [{role, organization, start, end, description}]';
