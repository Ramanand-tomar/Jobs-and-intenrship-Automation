"use client"

import React, { useState } from "react"
import Link from "next/link"

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"agent" | "ats" | "kanban">("agent")
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly")
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const faqList = [
    {
      q: "How does the AI Agent apply to jobs automatically?",
      a: "JobBuddy launches secure Playwright browser sessions connected to cloud automation servers. It navigates directly to job posts on Greenhouse, Lever, Workable, and Wellfound, dynamically detects required input fields, auto-fills your profile information, attaches your job-tailored resume PDF, and submits the form."
    },
    {
      q: "How does the ATS Resume Tailor increase match scores?",
      a: "Using Google Gemini AI, JobBuddy analyzes the job description to extract target keywords, required technical skills, and key responsibilities. It then re-aligns your summary, highlights matching skills, and optimizes bullet points specifically for that position, boosting your ATS pass rate to 90%+."
    },
    {
      q: "Will my data and resume be kept private?",
      a: "Yes, absolutely. Your personal details, contact information, and resumes are encrypted and stored securely in Supabase with strict Row Level Security (RLS). Your data is never sold or shared with third parties."
    },
    {
      q: "Can I monitor what applications the AI has submitted?",
      a: "Yes! JobBuddy provides a real-time Application Status Hub (Kanban board) where you can track every application step-by-step (Queued, Scanning, Applying, Applied, Failed). You can also view exact submission timestamps and session logs."
    },
    {
      q: "Can I use JobBuddy for free?",
      a: "Yes! Our Free plan includes up to 5 automated job applications per day, standard AI job matching, and ATS resume optimization. You can upgrade anytime for higher limits or unlimited submissions."
    }
  ]

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans overflow-x-hidden selection:bg-[#acf417] selection:text-black">
      {/* Dynamic Background Glow & Grid Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-[#acf417]/15 via-violet-600/10 to-transparent blur-[140px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-emerald-500/5 blur-[160px] rounded-full" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-neutral-950/70 border-b border-white/10 transition-all">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#acf417]/10 border border-[#acf417]/30 rounded-2xl shadow-[0_0_15px_rgba(172,244,23,0.2)]">
              <svg className="w-6 h-6 text-[#acf417]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight">JobBuddy<span className="text-[#acf417]">.ai</span></span>
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest -mt-1">Autonomous AI Agent</span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-neutral-300">
            <a href="#features" className="hover:text-[#acf417] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[#acf417] transition-colors">How It Works</a>
            <a href="#demo" className="hover:text-[#acf417] transition-colors">Live Preview</a>
            <a href="#pricing" className="hover:text-[#acf417] transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-[#acf417] transition-colors">FAQ</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-neutral-300 hover:text-white transition-colors font-bold px-4 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2.5 bg-[#acf417] hover:bg-[#acf417]/90 text-black text-sm font-black rounded-xl transition-all shadow-[0_0_25px_rgba(172,244,23,0.3)] hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            >
              Launch App
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 pt-16 md:pt-24 pb-20 text-center flex flex-col items-center">
        {/* Animated Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-neutral-900/80 border border-[#acf417]/40 rounded-full text-neutral-200 text-xs font-bold tracking-wider uppercase mb-8 backdrop-blur-md shadow-[0_0_20px_rgba(172,244,23,0.15)]">
          <span className="w-2 h-2 rounded-full bg-[#acf417] animate-ping" />
          <span>Next-Gen Autonomous Job Search Agent</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05] max-w-5xl mb-8">
          Land Your Next Role <br />
          <span className="bg-gradient-to-r from-[#acf417] via-emerald-400 to-teal-300 bg-clip-text text-transparent">
            10x Faster
          </span>{" "}
          with Autonomous AI
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-neutral-400 max-w-3xl mb-10 leading-relaxed font-normal">
          JobBuddy matches high-paying roles from <span className="text-white font-semibold">Greenhouse, Lever, Workable & Wellfound</span>, tailors your resume for <span className="text-emerald-400 font-semibold">95%+ ATS scores</span>, and automatically submits applications while you sleep.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full max-w-md mb-12">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-4 bg-[#acf417] hover:bg-[#acf417]/95 text-black font-black text-base rounded-2xl transition-all shadow-[0_0_35px_rgba(172,244,23,0.35)] hover:scale-[1.03] active:scale-[0.97] flex items-center justify-center gap-3 cursor-pointer"
          >
            Start Applying Free
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
            </svg>
          </Link>

          <a
            href="#demo"
            className="w-full sm:w-auto px-8 py-4 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700 text-white font-bold text-base rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer hover:border-neutral-500"
          >
            <svg className="w-5 h-5 text-[#acf417]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Watch Agent Demo
          </a>
        </div>

        {/* Social Proof Trust Bar */}
        <div className="pt-6 border-t border-white/10 w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-neutral-400">
          <span className="flex items-center gap-2">
            <span className="text-[#acf417] text-base">★★★★★</span> Over 10,000+ Applications Automated
          </span>
          <div className="flex items-center gap-6 text-neutral-500 font-bold uppercase tracking-wider text-[11px]">
            <span>Greenhouse</span>
            <span>•</span>
            <span>Lever</span>
            <span>•</span>
            <span>Workable</span>
            <span>•</span>
            <span>Wellfound</span>
          </div>
        </div>
      </section>

      {/* Interactive Product Demo Showcase */}
      <section id="demo" className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <span className="text-xs font-black text-[#acf417] uppercase tracking-widest block mb-2">Live Agent Simulation</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">See JobBuddy in Action</h2>
        </div>

        {/* Tab Selector */}
        <div className="flex justify-center gap-2 mb-8 bg-neutral-900/80 p-1.5 rounded-2xl border border-neutral-800 max-w-md mx-auto backdrop-blur-md">
          {[
            { id: "agent", label: "🤖 Browser Agent" },
            { id: "ats", label: "🎯 ATS Resume Tailor" },
            { id: "kanban", label: "📊 Live Status Board" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[#acf417] text-black shadow-lg"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Interactive Mockup Container */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs font-mono text-neutral-400">jobbuddy.ai/dashboard</span>
            </div>
            <span className="px-3 py-1 bg-emerald-950/80 border border-emerald-800/50 rounded-full text-[11px] font-black text-emerald-400 uppercase tracking-wider animate-pulse flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Live Simulation
            </span>
          </div>

          {/* TAB 1: BROWSER AGENT AUTOMATION */}
          {activeTab === "agent" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-neutral-850 pb-4">
                  <div>
                    <h4 className="text-lg font-bold text-neutral-100">Senior Full Stack Engineer</h4>
                    <p className="text-xs text-neutral-400 font-medium">Stripe • San Francisco, CA (Remote) • $160k - $210k</p>
                  </div>
                  <span className="px-3 py-1 bg-[#acf417]/10 border border-[#acf417]/30 rounded-lg text-xs font-black text-[#acf417] uppercase">
                    98% Match
                  </span>
                </div>

                {/* Agent Activity Terminal */}
                <div className="bg-black/90 rounded-xl p-4 font-mono text-xs space-y-2 border border-neutral-800">
                  <div className="text-neutral-500">[00:01] 🚀 Initializing Browserbase headless browser session...</div>
                  <div className="text-neutral-400">[00:03] 🌐 Navigating to target URL: <span className="text-indigo-400 underline">https://boards.greenhouse.io/stripe/jobs/748201</span></div>
                  <div className="text-yellow-400">[00:05] 🔍 Gemini AI scanned 8 form fields (Full Name, Email, Phone, Resume, LinkedIn, Portfolio)</div>
                  <div className="text-emerald-400">[00:08] ⚡ Generating job-tailored resume PDF matching keywords: React, TypeScript, Node.js</div>
                  <div className="text-emerald-400">[00:12] 📎 Uploading custom PDF resume to form file input...</div>
                  <div className="text-[#acf417] font-bold">[00:15] ✅ Form submitted successfully! Status updated to 'Applied'.</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ATS RESUME TAILOR */}
          {activeTab === "ats" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
              <div className="bg-neutral-950 border border-red-900/30 p-6 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-red-400 uppercase tracking-wider">Before Tailoring</span>
                  <span className="text-xl font-black text-red-400">62% Match</span>
                </div>
                <div className="h-2 bg-neutral-900 rounded-full overflow-hidden">
                  <div className="w-[62%] h-full bg-red-500" />
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Generic resume summary lacks required keywords: <span className="text-red-400 font-semibold">PostgreSQL, Microservices, CI/CD, Next.js</span>. Lower chance of clearing ATS.
                </p>
              </div>

              <div className="bg-neutral-950 border border-emerald-900/40 p-6 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">After Gemini AI Tailoring</span>
                  <span className="text-xl font-black text-emerald-400">96% Match</span>
                </div>
                <div className="h-2 bg-neutral-900 rounded-full overflow-hidden">
                  <div className="w-[96%] h-full bg-[#acf417]" />
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  <span className="text-[#acf417] font-bold">✓ Optimized:</span> Re-aligned summary, highlighted PostgreSQL & Microservices experience, aligned bullet points to match job responsibilities.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: LIVE STATUS KANBAN BOARD */}
          {activeTab === "kanban" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fadeIn">
              <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-2xl space-y-3">
                <div className="flex justify-between text-xs font-bold text-neutral-400 uppercase">
                  <span>Queued / Scanning</span>
                  <span className="px-2 py-0.5 bg-neutral-900 rounded">2</span>
                </div>
                <div className="p-3 bg-neutral-900/80 border border-neutral-800 rounded-xl space-y-1">
                  <span className="text-xs font-bold text-white block">Full Stack Developer</span>
                  <span className="text-[10px] text-neutral-400 font-medium">Vercel • Greenhouse</span>
                </div>
              </div>

              <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-2xl space-y-3">
                <div className="flex justify-between text-xs font-bold text-yellow-400 uppercase">
                  <span>Applying</span>
                  <span className="px-2 py-0.5 bg-yellow-950/60 border border-yellow-800/40 rounded">1</span>
                </div>
                <div className="p-3 bg-yellow-950/20 border border-yellow-800/40 rounded-xl space-y-1">
                  <span className="text-xs font-bold text-white block">Senior Frontend Engineer</span>
                  <span className="text-[10px] text-yellow-400 font-medium">Linear • Lever</span>
                </div>
              </div>

              <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-2xl space-y-3">
                <div className="flex justify-between text-xs font-bold text-emerald-400 uppercase">
                  <span>Applied Successfully</span>
                  <span className="px-2 py-0.5 bg-emerald-950/60 border border-emerald-800/40 rounded text-emerald-400">14</span>
                </div>
                <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-xl space-y-1">
                  <span className="text-xs font-bold text-white block">Lead Software Engineer</span>
                  <span className="text-[10px] text-emerald-400 font-medium">Supabase • Workable</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Feature Deep Dive Grid */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 py-24">
        <div className="text-center mb-16">
          <span className="text-xs font-black text-[#acf417] uppercase tracking-widest block mb-3">Complete Automation Engine</span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">Everything You Need to Land Interviews</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: "🚀",
              title: "Autonomous Browser Agent",
              desc: "Executes real Playwright browser sessions on Browserbase cloud infrastructure to fill and submit application forms accurately."
            },
            {
              icon: "🎯",
              title: "Gemini ATS Resume Tailor",
              desc: "Rewrites summary sections, matches skill tags, and optimizes experience bullets for every job to achieve 90%+ ATS compatibility."
            },
            {
              icon: "🔍",
              title: "Multi-Platform Job Matcher",
              desc: "Aggregates fresh job listings from Greenhouse, Lever, Workable, and Wellfound, filtering strictly by your preferred role and salary."
            },
            {
              icon: "⚡",
              title: "Instant Profile Extraction",
              desc: "Upload your existing PDF resume and our AI instantly extracts your work history, education, and skills into your structured profile."
            },
            {
              icon: "📊",
              title: "Real-Time Application Hub",
              desc: "Track every applied job in a live Kanban board. Monitor agent session logs, status changes, and application timestamps."
            },
            {
              icon: "🛡️",
              title: "Missing Field AI Resolver",
              desc: "If a job application requires specific inputs missing from your profile, our AI extracts the answers from your resume background."
            }
          ].map((feature, idx) => (
            <div
              key={idx}
              className="p-8 bg-neutral-900/40 border border-neutral-800/80 rounded-3xl hover:border-[#acf417]/30 hover:bg-neutral-900/80 transition-all duration-300 group hover:-translate-y-1 shadow-xl"
            >
              <div className="w-14 h-14 bg-neutral-950 border border-neutral-800 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#acf417] transition-colors">{feature.title}</h3>
              <p className="text-sm text-neutral-400 leading-relaxed font-normal">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Step-by-Step "How It Works" */}
      <section id="how-it-works" className="relative z-10 border-y border-white/10 bg-white/[0.015] py-24 px-6 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-xs font-black text-[#acf417] uppercase tracking-widest block mb-3">Simple 4-Step Process</span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">How JobBuddy Automates Your Job Search</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Upload Resume",
                desc: "Upload your current PDF resume. AI parses your profile automatically."
              },
              {
                step: "02",
                title: "Set Preferences",
                desc: "Choose target roles, preferred location (Remote/Hybrid), and salary minimum."
              },
              {
                step: "03",
                title: "AI Matches & Tailors",
                desc: "We search Greenhouse, Lever, & Workable, ranking high-match positions."
              },
              {
                step: "04",
                title: "Automated Apply",
                desc: "Click once to apply. Our browser agent fills forms and submits automatically."
              }
            ].map((s, idx) => (
              <div key={idx} className="relative p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl space-y-3">
                <span className="text-4xl font-mono font-black text-[#acf417]/30 block">{s.step}</span>
                <h3 className="text-lg font-bold text-white">{s.title}</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 py-24">
        <div className="text-center mb-12">
          <span className="text-xs font-black text-[#acf417] uppercase tracking-widest block mb-3">Flexible Plans</span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-6">Invest in Your Career Acceleration</h2>
          <p className="text-neutral-400 max-w-lg mx-auto text-sm">Start for free with no credit card required. Upgrade as your job search scales.</p>

          {/* Monthly / Annual Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-xs font-bold ${billingCycle === "monthly" ? "text-white" : "text-neutral-400"}`}>Monthly Billing</span>
            <button
              onClick={() => setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")}
              className="w-14 h-8 bg-neutral-800 rounded-full p-1 border border-neutral-700 transition-colors relative cursor-pointer"
            >
              <div className={`w-6 h-6 rounded-full bg-[#acf417] transition-transform ${billingCycle === "annual" ? "translate-x-6" : "translate-x-0"}`} />
            </button>
            <span className={`text-xs font-bold flex items-center gap-1.5 ${billingCycle === "annual" ? "text-white" : "text-neutral-400"}`}>
              Annual Billing <span className="px-2 py-0.5 bg-[#acf417]/20 border border-[#acf417]/40 text-[#acf417] text-[10px] rounded-full font-black">Save 20%</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
          {/* Free Plan */}
          <div className="bg-neutral-900/40 border border-neutral-800 rounded-3xl p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest block">Free Starter</span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">$0</span>
                <span className="text-xs text-neutral-400 font-semibold">/ month</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">Perfect for testing JobBuddy and exploring AI job matching.</p>
              <ul className="space-y-3 text-xs font-medium text-neutral-300 pt-4 border-t border-neutral-850">
                <li className="flex items-center gap-2">✓ 5 AI Job Applications / day</li>
                <li className="flex items-center gap-2">✓ Greenhouse & Lever Matching</li>
                <li className="flex items-center gap-2">✓ Standard ATS Resume Tailor</li>
                <li className="flex items-center gap-2 text-neutral-500">✗ Priority Cloud Browser Sessions</li>
              </ul>
            </div>
            <Link
              href="/signup"
              className="w-full py-3.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-white font-bold text-xs rounded-xl text-center transition-all cursor-pointer block"
            >
              Get Started Free
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="bg-neutral-900/90 border-2 border-[#acf417] rounded-3xl p-8 flex flex-col justify-between space-y-6 relative shadow-[0_0_35px_rgba(172,244,23,0.15)]">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#acf417] text-black font-black text-[10px] uppercase tracking-widest rounded-full shadow-md">
              Most Popular
            </span>
            <div className="space-y-4">
              <span className="text-xs font-bold text-[#acf417] uppercase tracking-widest block">Pro Agent</span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">{billingCycle === "monthly" ? "$19" : "$15"}</span>
                <span className="text-xs text-neutral-400 font-semibold">/ month</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">Designed for active job seekers looking for daily interviews.</p>
              <ul className="space-y-3 text-xs font-medium text-neutral-200 pt-4 border-t border-neutral-800">
                <li className="flex items-center gap-2">✓ 25 AI Job Applications / day</li>
                <li className="flex items-center gap-2">✓ All 4 ATS Platforms (Greenhouse, Lever, Workable, Wellfound)</li>
                <li className="flex items-center gap-2">✓ Unlimited Gemini ATS Resume Tailoring</li>
                <li className="flex items-center gap-2">✓ Priority Browserbase Automation Sessions</li>
              </ul>
            </div>
            <Link
              href="/signup"
              className="w-full py-3.5 bg-[#acf417] hover:bg-[#acf417]/90 text-black font-black text-xs rounded-xl text-center transition-all shadow-[0_0_20px_rgba(172,244,23,0.25)] cursor-pointer block"
            >
              Start 7-Day Free Trial
            </Link>
          </div>

          {/* Unlimited Plan */}
          <div className="bg-neutral-900/40 border border-neutral-800 rounded-3xl p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-xs font-bold text-violet-400 uppercase tracking-widest block">Unlimited Power</span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">{billingCycle === "monthly" ? "$39" : "$31"}</span>
                <span className="text-xs text-neutral-400 font-semibold">/ month</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">Maximum application throughput for aggressive job hunting.</p>
              <ul className="space-y-3 text-xs font-medium text-neutral-300 pt-4 border-t border-neutral-850">
                <li className="flex items-center gap-2">✓ Unlimited AI Job Applications</li>
                <li className="flex items-center gap-2">✓ Dedicated Fast-Track Cloud Sessions</li>
                <li className="flex items-center gap-2">✓ ATS Score Guarantee Optimization</li>
                <li className="flex items-center gap-2">✓ 1-on-1 Priority Support</li>
              </ul>
            </div>
            <Link
              href="/signup"
              className="w-full py-3.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-white font-bold text-xs rounded-xl text-center transition-all cursor-pointer block"
            >
              Upgrade to Unlimited
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="relative z-10 max-w-4xl mx-auto px-6 py-24 border-t border-white/10">
        <div className="text-center mb-16">
          <span className="text-xs font-black text-[#acf417] uppercase tracking-widest block mb-3">Got Questions?</span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {faqList.map((faq, idx) => {
            const isOpen = openFaq === idx
            return (
              <div
                key={idx}
                className="bg-neutral-900/40 border border-neutral-800 rounded-2xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-6 text-left font-bold text-sm text-neutral-100 flex justify-between items-center gap-4 cursor-pointer hover:text-[#acf417]"
                >
                  <span>{faq.q}</span>
                  <span className="text-lg font-mono text-[#acf417]">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-xs text-neutral-400 leading-relaxed border-t border-neutral-850/60 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Bottom Call to Action */}
      <section className="relative z-10 border-t border-white/10 bg-gradient-to-b from-transparent to-[#acf417]/5 py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight">Stop Wasting Hours Applying Manually</h2>
          <p className="text-neutral-400 text-base max-w-lg mx-auto">Let JobBuddy handle the repetitive application process so you can focus on acing interviews.</p>
          <div className="pt-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-3 px-10 py-5 bg-[#acf417] hover:bg-[#acf417]/95 text-black font-black text-lg rounded-2xl transition-all shadow-[0_0_40px_rgba(172,244,23,0.35)] hover:scale-[1.03] active:scale-[0.97]"
            >
              Get Started Free Now
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-neutral-950 py-10 px-6 sm:px-8 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white">JobBuddy<span className="text-[#acf417]">.ai</span></span>
            <span>© 2026 JobBuddy.ai. All rights reserved.</span>
          </div>

          <div className="flex gap-6 font-semibold text-neutral-400">
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link href="/signup" className="hover:text-white transition-colors">Sign Up</Link>
            <Link href="/dashboard/jobs" className="hover:text-white transition-colors">Dashboard</Link>
            <a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
