export interface ExperienceMetrics {
  revenue?: string;
  users?: string;
  performance_improvement?: string;
  team_size?: string;
  budget?: string;
  [key: string]: string | undefined;
}

export interface Award {
  title: string;
  issuer: string;
  date: string;
  description?: string;
}

export interface Publication {
  title: string;
  venue: string;
  date: string;
  url?: string;
  authors?: string;
}

export interface Language {
  language: string;
  proficiency: string;
}

export interface ExperienceEntry {
  company: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  employment_type?: string;
  details?: string;
  description?: string;
  description_rich?: string[];
  bullets?: string[];
  metrics?: ExperienceMetrics;
  tech_used?: string[];
}

export interface ProjectEntry {
  title: string;
  name?: string;
  role?: string;
  tech?: string[];
  technologies?: string[];
  description: string;
  link?: string;
  url?: string;
  github_url?: string;
  live_url?: string;
  start_date?: string;
  end_date?: string;
  metrics?: ExperienceMetrics;
}

export interface EducationEntry {
  school?: string;
  institution?: string;
  degree: string;
  field?: string;
  field_of_study?: string;
  graduation?: string;
  year?: string;
  gpa?: string;
  honors?: string;
}

export interface CandidateProfile {
  id?: string;
  user_id?: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  title?: string | null;
  bio?: string | null;
  website_url?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  skills?: string[] | null;
  skills_categorized?: Record<string, string[]> | null;
  experience_years?: number | null;
  education?: EducationEntry[] | string | null;
  summary?: string | null;
  experience?: ExperienceEntry[] | null;
  work_experience?: any;
  projects?: ProjectEntry[] | null;
  certifications?: string[] | null;
  awards?: Award[] | null;
  publications?: Publication[] | null;
  languages?: Language[] | null;
  volunteer_experience?: Array<{
    role: string;
    organization: string;
    start: string;
    end: string;
    description: string;
  }> | null;
  completeness_percentage?: number | null;
  resume_url?: string | null;
  resume_parsed_data?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
}

export interface JobPost {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  platform: "greenhouse" | "lever" | "workable" | "wellfound" | "custom" | string;
  url: string;
  job_url?: string;
  salary_range?: string;
  description?: string;
  posted_at?: string;
  match_score?: number;
  skills?: string[];
  matched_skills?: string[];
  missing_skills?: string[];
  is_saved?: boolean;
}

export type ApplicationStatus =
  | "in_queue"
  | "detecting_fields"
  | "missing_profile_info"
  | "submitting"
  | "submitted"
  | "failed"
  | "applied"
  | "interviewing"
  | "rejected"
  | "offered"
  | "saved"
  | "pending";

export interface JobApplication {
  id: string;
  user_id: string;
  job_id?: string | null;
  job_title?: string;
  title?: string;
  company: string;
  platform: string;
  job_url?: string;
  url?: string;
  status: ApplicationStatus;
  applied_at?: string;
  created_at?: string;
  updated_at?: string;
  notes?: string;
  tailored_resume_url?: string;
  missing_fields?: unknown[] | null;
}

export interface SavedJob {
  id: string;
  user_id: string;
  job_id: string;
  job_title: string;
  company: string;
  location: string;
  job_url: string;
  platform: string;
  saved_at: string;
  match_score?: number;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan: "free" | "pro" | "unlimited";
  status: "active" | "canceled" | "past_due" | "trialing";
  credits_remaining: number;
  current_period_end: string;
  stripe_customer_id?: string;
}

export interface TailoredResume {
  id: string;
  user_id: string;
  target_job_title: string;
  company: string;
  resume_url: string;
  tailored_content?: string;
  created_at: string;
}

export interface BillingRecord {
  id: string;
  user_id: string;
  billing_plan: string;
  amount_paid: number;
  currency: string;
  payment_status: string;
  stripe_invoice_id?: string | null;
  created_at: string | null;
}
