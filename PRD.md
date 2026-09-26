Product Requirements Document (PRD): AI Job Application Agent (JobBuddy AI)
1. Project Overview
Goal: Build a full-stack AI-powered job application agent that automates the entire lifecycle of a job hunt, from uploading a resume and matching candidates with relevant jobs to automatically filling out and submitting applications on platforms like Greenhouse, Lever, Workable, and Wellfound.
Key Tenets: User control, data security, intelligent automation, and scalable billing integration.

2. Technology Stack
Frontend
Framework: Next.js (App Router).

Language: TypeScript.

Styling: Tailwind CSS.

UI Components: shadcn/ui (for buttons, dialogs, cards, tabs, and skeletons).

Icons: Lucide Icons.

State Management: React Context/Zustand (for Auth and User Context).

Backend & Database
Database & Auth: Supabase (PostgreSQL for data, auth.users for authentication, Storage for resumes).

Background Jobs / Orchestration: Inngest (for long-running processes like Resume Parsing and Auto-Apply execution).

AI & Automation
Job Search API: Brave Search API (for scraping job postings via site-specific queries).

Browser Automation: Browserbase (for headless browser sessions) paired with Stagehand (for DOM detection and form filling).

Resume Parsing: Implicitly requires an AI service (e.g., OpenAI GPT-4o or Llama 3 via an API) to extract structured data from uploaded PDFs/DOCX files.

Payments
Payment Gateway: Stripe Checkout + Stripe Billing Portal.

Webhooks: Stripe webhook endpoints for subscription lifecycle management.

Development Tools
IDE: Cursor (leveraging Supabase MCP tools for rapid DB/Auth setup).

CI/CD: GitHub Actions with CodeRabbit for automated PR reviews.

3. Core Features & Technical Implementation
3.1. User Authentication & Middleware Protection
Authentication Methods: Supabase Email/Password and Google OAuth.

Session Management: Managed via @supabase/auth-helpers-nextjs.

Middleware Protection:

A middleware.ts file will inspect the request path.

If a user attempts to access /dashboard/* or protected API routes (/api/jobs/*, /api/apply/*) without a valid Supabase session, they will be redirected to /sign-in.

The Auth flow (Sign-Up/Sign-In pages) will utilize shadcn/ui components to create a clean, modern UI.

3.2. Dashboard Architecture
Layout: A full-page dashboard with a collapsible left sidebar (fixed, responsive) and a dynamic main content area.

Sidebar (Top):

Branding: Logo icon + "JobBuddy AI" text (visible in expanded mode).

Navigation Links:

Jobs (Icon: Briefcase)

Resume (Icon: FileText)

Profile (Icon: User)

Application Status (Icon: Clock)

Sidebar (Bottom):

Billing / Credits (Icon: CreditCard): Shows remaining credits or active plan.

Profile Settings (Icon: Settings).

Content Area: Placeholders (e.g., "Main Content Area"). Actual pages will be injected via Next.js page.tsx components within the (dashboard) route group.

3.3. User Onboarding & Resume Processing
State: The first time a user logs in and navigates to the Dashboard, a "Non-Closable" Dialog overlays the dashboard.

Workflow:

Upload: User uploads a PDF or DOCX file to a specific drop-zone.
Storage: The file is streamed to supabase.storage under the user's private folder (user_id/resume.pdf).
Parsing (Inngest Background Worker):
An Inngest function is triggered upon upload.
The function extracts text and uses an AI model to parse JSON data: Profile Info, Professional Summary, Skills (array), Work Experience (array of objects with Company, Title, Duration, Responsibilities), Education, Projects, Links, Certifications.
State Update: The database profiles table is populated.
UI Update: The Profile page form inputs are pre-filled with this parsed data (user can edit and save back to DB). The Resume page lists the uploaded file, showing metadata (Name, Upload Date, Size, Version status).
3.4. Job Search & Caching (The "Jobs" Page)
Job Search API: Integrate Brave Search API.

Platform Selection: Job Platform Cards for Greenhouse, Lever, Workable, and Wellfound. Toggle states for enabling/disabling each platform.

Query Building: Constructs platform-specific queries based on the user's profiles data (Skills, Experience, Preferred Location).

Example: site:greenhouse.io/jobs React Frontend Developer Remote San Francisco.

Caching Logic (6-Hour Rule):

Before calling Brave API, the app queries the jobs table: SELECT * FROM jobs WHERE user_id = $1 AND fetched_at > NOW() - INTERVAL '6 hours'.

If cached: Return records from Supabase immediately.

If expired: Call Brave API -> Normalize data -> Bulk Insert/Update into jobs table -> Return new results.

UI Elements:

Job Card: Company Logo, Job Title, Company Name, Location, Salary, Job Type, Experience Level, Tags, Match Score (%), Progress Bar, Apply Now button, Save button.

Right Sidebar: "Profile Completeness" visual ring (progress %), and a "Recent Activity" feed (fetched jobs, applied jobs, updated profile).

Loading/Empty/Error: shadcn/ui Skeleton loaders, empty state illustrations, and toast notifications for errors.

3.5. Auto-Apply Workflow (Browserbase & Stagehand)
Trigger: Clicking Apply Now opens a dialog with two options: Apply Manually (open new tab) or Apply Automatically.

Platform Detection: When auto-apply is selected, the system detects the URL origin (e.g., greenhouse.io, lever.co).

Background Processing (Inngest):

Session Creation: A Browserbase session is initiated with a deterministic session ID.
Field Detection (Stagehand): Stagehand inspects the DOM, identifying Input Fields (Name, Email, Phone, Resume upload, LinkedIn, Portfolio, etc.).
Data Mapping: Saved in a platform_schema table. The system compares required fields against the user's profiles table.
Validation:
Success: If all fields match, proceed to Step 5.

Failure: If missing (e.g., missing LinkedIn, missing Portfolio), the DB status updates to Missing Profile Info. The UI redirects the user to the Profile page, highlighting the missing fields. Note: The application flow pauses until the user updates their profile.

Submission: An Inngest function executes the browser script to:
Fill in the fields (form values, resume file insertion).

Click the "Submit" button.

Verify submission success.

Finalization: Update the jobs table applied_status to Applied or Submission Failed (based on verification). Save the Browserbase session_id in the DB for debugging.
3.6. Saved Jobs
Database State: saved_status: boolean.

UI Button: On the main Jobs page, the "Save" button toggles saved_status to true.

Dashboard Menu: New Sidebar option Saved Jobs.

Display: This page creates a view specifically querying WHERE saved_status = true. It re-uses the exact same Job Card component from the main page. The card also displays the latest applied_status (Pending, Applied, Rejected, etc.) maintained by the Auto-Apply logic.

3.7. Pricing & Subscription System (Stripe Integration)
Plan Structure:

Free: Max 5 Auto-Apply / day.

Pro ($9.99/mo): Max 25 Auto-Apply / day.

Unlimited ($49.99/mo): Unlimited Auto-Apply / day.

Stripe Integration Details:

Dynamic Checkout: The backend dynamically constructs Stripe Checkout Sessions rather than hardcoding Price IDs. It passes amount, plan_name, interval, and metadata (plan_limit).

Webhooks:

Listen to checkout.session.completed to activate the subscription in Supabase.

Listen to customer.subscription.updated and customer.subscription.deleted to update the subscriptions table status and expiry.

Usage & Limits:

A subscriptions table stores daily_usage_count.

Pre-Apply Check: Before triggering the Browserbase flow, the frontend calls an internal API route /api/check-usage.

If the user_plan is Free and daily_usage_count >= 5, block the flow and show the "Upgrade Now" prompt.

If Pro and >= 25, block and suggest Unlimited.

If Unlimited, proceed.

Post-Apply Update: After a successful apply, an API call increments daily_usage_count (resetting daily at 00:00 UTC).

Billing Dashboard Page:

Current Plan Card: Shows Plan name, renewal date, active status.

Usage Card: Visualizes usage limits (e.g., 3/5, 0/25, or "Unlimited").

Manage Subscription: Manage Subscription button redirects to the Stripe Billing Portal.

Available Plans: Upsell cards for Free, Pro, Unlimited.

4. Database Schema Design (Supabase PostgreSQL)
sql
-- 1. Profiles (Auto-populated from Resume)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  headline TEXT,
  summary TEXT,
  phone TEXT,
  location TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  skills JSONB, -- Array of strings
  experience JSONB, -- Array of objects {company, title, duration, responsibilities}
  education JSONB, -- Array of objects {school, degree, year}
  projects JSONB,
  resume_file_id UUID -- Reference to storage file
);

-- 2. Jobs
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT, -- 'greenhouse', 'lever', 'workable', 'wellfound'
  title TEXT,
  company TEXT,
  company_logo TEXT,
  location TEXT,
  salary TEXT,
  job_type TEXT, -- 'Full-time', 'Remote', 'Hybrid'
  experience_level TEXT,
  description TEXT,
  tags JSONB,
  match_score INT, -- 0 to 100
  job_url TEXT,
  source_url TEXT,
  applied_status TEXT DEFAULT 'Pending', -- 'Pending', 'Applied', 'Failed', 'Manual_Apply'
  saved_status BOOLEAN DEFAULT false,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  browserbase_session_id TEXT -- For debugging
);

-- 3. User Subscriptions
CREATE TABLE subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan_name TEXT, -- 'Free', 'Pro', 'Unlimited'
  plan_limit INT, -- 5, 25, NULL
  status TEXT, -- 'active', 'canceled', 'past_due'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  daily_usage_count INT DEFAULT 0,
  last_usage_reset TIMESTAMPTZ DEFAULT NOW(),
  payment_status TEXT, -- 'paid', 'unpaid'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Billing History (Optional but recommended)
CREATE TABLE billing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT,
  amount BIGINT,
  currency TEXT,
  status TEXT,
  invoice_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
5. Workflow & State Logic Deep Dive
5.1. Job Fetching Logic
The Jobs page mounts.

Invokes GET /api/jobs.

API queries jobs table for user_id.

If the latest fetched_at is within 6 hours: returns array.

Else:

Triggers an Inngest Background Function.

User profile data is pulled.

4 parallel queries to Brave Search using site:greenhouse.io, etc.

Results are normalized (e.g., all strings trim, salary ranges split).

Upsert into DB (avoiding duplicates by job_url).

Invalidate the frontend cache to refresh the page data.

5.2. Auto-Apply (Browserbase) Logic
User clicks "Apply Automatically".

Frontend: POST /api/start-apply with job_id.

Backend / Inngest:

Validate usage limits first (check subscriptions.daily_usage_count against plan_limit).

Fetch job_url from DB.

Start a Browserbase session.

Use Stagehand to parse the DOM into a required_fields_map.

Comparison loop: Check required_fields against profiles data.

If missing: Update job status to Missing_Info. Return status: 400 with fields ['LinkedIn', 'Portfolio'].

Frontend: Receives error, displays "Missing Info" modal, redirects to Profile, highlights fields.

If complete: Inngest progresses to the next step.

Run the Browserbase script:

page.fill(...) for inputs.

page.setInputFiles(...) for the resume (fetched from Supabase Storage URL).

page.click('button[type="submit"]').

Wait for redirect/success indicator.

Save browserbase_session_id and applied_status='Applied' into the jobs table.

Increment daily_usage_count in subscriptions table.

6. UI/UX Requirements & Interaction Notes
Dialog Management: The initial onboarding dialog must have a preventClose property (or similar shadcn/ui prop) to force the user to complete the resume upload before accessing the rest of the dashboard.

Job Cards: The match percentage is displayed via a colored progress bar (Green = >80%, Yellow = 60-80%, Red = <60%).

Sidebar Animations: The collapsible sidebar should leverage smooth CSS transitions (e.g., width transition and opacity animation for the text labels when collapsing).

Toast Notifications: Use shadcn/ui Toasts to confirm "Job Saved", "Application Submitted", or "Plan Upgraded".

Stripe Flow: Do not build custom UI for credit card forms. Strictly rely on Stripe Checkout for security and PCI compliance. The Checkout page will open in the same browser context or redirect to Stripe's hosted domain and return via success URL.

7. Development Roadmap (Chapter-based execution)
Setup Phase (Ch 1 & 2): Initialize Next.js, Tailwind, shadcn/ui. Configure Supabase Auth (Email + Google). Implement middleware.ts. Implement the bare-bones dashboard layout (Ch 3).

Onboarding Phase (Ch 4): Build the upload UI. Integrate Supabase Storage. Implement resume parsing background worker. Build the "Profile" page (read/write).

Job Search Phase (Ch 5): Integrate Brave Search. Build the 6-hour caching layer. Design and implement the Job Card components.

Automation Phase (Ch 6.1): Setup Browserbase + Stagehand integration. Build Inngest workers for field detection and form submission. Handle missing info states.

Billing Phase (Ch 8): Set up Stripe Checkout, Webhooks, and the Subscription table. Implement daily usage logic in the Auto-Apply loop.

Saved & Status Tracking Phase (Ch 7 & 9): Implement Saved Jobs logic. Enhance Job Card to show real-time application statuses. Finalize UI polish.