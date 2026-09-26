# JobBuddy.ai — Autonomous AI Job Application Agent

<div align="center">

  ![JobBuddy.ai Logo Banner](docs/images/hero_landing.png)

  ### *Apply to 100s of Jobs Automatically while maintaining 95%+ ATS Compatibility*

  [![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
  [![Gemini AI](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)
  [![Inngest](https://img.shields.io/badge/Inngest-Event%20Queue-FF5A5F?style=for-the-badge&logo=inngest)](https://www.inngest.com/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

</div>

---

## 🌟 Overview

**JobBuddy.ai** is an autonomous AI-powered job application platform designed to eliminate the tedious manual grind of applying to engineering jobs. 

It aggregates real-time job listings from major Applicant Tracking Systems (**Greenhouse, Lever, Workable, & Wellfound**), parses job requirements, uses **Google Gemini AI** to rewrite and tailor candidate resumes for **95%+ ATS compatibility**, and executes automated Playwright browser submission sessions in the cloud.

---

## ✨ Key Features

- 🤖 **Autonomous Playwright Browser Agent**: Launches cloud Playwright sessions (via Browserbase) to navigate job application pages, detect input fields, auto-fill candidate profiles, and submit forms.
- 🎯 **Gemini ATS Resume Optimizer**: Analyzes target job descriptions and dynamically rewrites summaries, re-aligns skill tags, and optimizes experience bullet points for maximum ATS pass rates.
- 🔍 **Multi-Platform Job Matcher**: Fetches live jobs from Greenhouse, Lever, Workable, and Wellfound, scoring candidate match percentages in real-time.
- 📊 **Real-Time Kanban Application Tracker**: Monitor every application through live pipeline stages (`In Queue` → `Scanning Fields` → `Action Required` → `Submitting` → `Applied`).
- ⚡ **Instant Resume Parsing**: Upload your PDF resume to instantly extract work experience, skills, education, and contact info into a structured profile.
- 🛡️ **Missing Field AI Resolver**: If an ATS form requests specific questions missing from your profile, Gemini AI extracts the optimal response from your career history.

---

## 📸 Screenshots & Visual Walkthrough

### 🚀 Hero Landing Page
![Hero Landing Page](docs/images/hero_landing.png)

---

### 🔍 Live Job Matches & ATS Compatibility Scores
![Jobs Feed Dashboard](docs/images/jobs_feed.png)

---

### 🤖 Automated AI Agent Application Dialog
![Automated Apply Dialog](docs/images/apply_modal.png)

---

### 🎯 Gemini ATS Resume Optimization
![ATS Resume Tailor](docs/images/ats_tailor.png)

---

### 📊 Real-Time Application Kanban Tracker
![Status Kanban Board](docs/images/status_kanban.png)

---

### 💳 Pricing & Subscription Management
![Flexible Pricing](docs/images/pricing.png)

---

## 🏗️ System Architecture

```mermaid
sequenceDiagram
    autonumber
    actor User as Applicant
    participant App as Next.js 16 Dashboard
    participant API as /api/jobs/apply
    participant DB as Supabase DB
    participant Queue as Inngest Queue
    participant Agent as Playwright Browser Worker

    User->>App: Click "Apply Now" on Job
    App->>User: Display Apply Options Modal
    User->>App: Click "Apply Automatically using AI Agent"
    App->>API: POST /api/jobs/apply
    API->>DB: Create application record (status = "in_queue")
    API->>Queue: Dispatch "job/application.scan" event
    
    loop Real-time UI Polling (every 2s)
        App->>DB: Query job_applications status
        DB-->>App: Return updated status
        App->>User: Update UI state (Scanning -> Submitting -> Applied)
    end

    Queue->>Agent: Execute scanApplicationForm & submitApplicationForm
    Agent->>DB: Update status to "submitted" & increment daily usage
```

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (App Router with Turbopack)](https://nextjs.org/)
- **Frontend**: [React 19](https://react.dev/), [TailwindCSS 4](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, Storage)
- **AI & LLM**: [Google Gemini 2.5 Flash (`@google/genai`)](https://ai.google.dev/)
- **Event Queue & Background Jobs**: [Inngest](https://www.inngest.com/) (`inngest/next`)
- **Browser Automation**: [Playwright Core](https://playwright.dev/) & [Browserbase CDP](https://www.browserbase.com/)

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- **Node.js**: `v18+` or `v20+`
- **npm** or **pnpm**
- A **Supabase** project (URL + Anon Key + Service Role Key)
- A **Google Gemini API Key**
- *(Optional)* **Browserbase API Key & Project ID** for cloud browser sessions
- *(Optional)* **Tavily API Key** for enhanced live job scraping

---

### Environment Setup

Create a `.env` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GEMINI_API_KEY=your-gemini-api-key
TAVILY_API_KEY=your-tavily-api-key
BROWSERBASE_API_KEY=your-browserbase-api-key
BROWSERBASE_PROJECT_ID=your-browserbase-project-id
INNGEST_DEV=1
```

---

### Installation & Running Locally

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Ramanand-tomar/Jobs-and-intenrship-Automation.git
   cd Jobs-and-intenrship-Automation
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run Next.js Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Run Inngest Dev Server** (in a separate terminal window):
   ```bash
   npx inngest-cli dev -u http://localhost:3000/api/inngest
   ```
   Open the Inngest Dev Dashboard at [http://localhost:8288](http://localhost:8288).

---

## 📁 Repository Structure

```text
AI-job-agent/
├── docs/
│   └── images/                # Screenshots & visual assets
├── src/
│   ├── app/
│   │   ├── api/               # Next.js API Routes (apply, jobs, inngest, profile, auth)
│   │   ├── dashboard/         # Dashboard views (jobs, status, profile, resume, billing)
│   │   ├── login/             # Auth pages
│   │   ├── onboarding/        # Profile onboarding wizard
│   │   └── page.tsx           # Professional landing page
│   ├── components/            # Reusable UI components (ApplyDialog, ResumeTailor, etc.)
│   ├── lib/
│   │   ├── inngest/           # Inngest client & background event functions
│   │   ├── supabase/          # Supabase client & middleware helpers
│   │   └── gemini.ts          # Gemini AI prompt helpers
│   └── types/                 # TypeScript interfaces & database definitions
├── supabase/
│   └── migrations/            # SQL schemas, triggers & RLS policy migrations
├── package.json
└── README.md
```

---

## 🤝 Contributing

Contributions are always welcome! Feel free to open an issue or submit a pull request:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">

Made with ❤️ by [Ramanand Tomar](https://github.com/Ramanand-tomar)

</div>
