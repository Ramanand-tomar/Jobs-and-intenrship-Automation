"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import ApplyDialog from "@/components/apply-dialog"
import ResumeTailorPanel from "@/components/resume-tailor-panel"
import { CandidateProfile, JobPost, JobApplication } from "@/types"
import { toast } from "@/components/ui/toast"

interface Job {
  id: string
  platform: "greenhouse" | "lever" | "workable" | "wellfound"
  title: string
  company: string
  company_logo: string | null
  location: string
  salary: string
  job_type: string
  experience_level: string
  description: string
  tags: string[]
  matched_skills?: string[]
  missing_skills?: string[]
  match_score: number
  job_url: string
  source_url: string
  applied_status: boolean
  saved_status: boolean
  fetched_at: string
}

export default function JobsPage() {
  const supabase = createClient()

  // Profile and jobs states
  const [profile, setProfile] = useState<CandidateProfile | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")

  // Filter states
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all")
  const [savingJobId, setSavingJobId] = useState<string | null>(null)
  const [selectedApplyJob, setSelectedApplyJob] = useState<Job | null>(null)
  const [selectedTailorJob, setSelectedTailorJob] = useState<Job | null>(null)
  const [applications, setApplications] = useState<Partial<JobApplication>[]>([])

  // Fetch data
  const fetchData = async (forceRefresh = false) => {
    try {
      if (forceRefresh) setRefreshing(true)
      else setLoading(true)
      setError("")

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError("User session expired. Please log in.")
        setLoading(false)
        setRefreshing(false)
        return
      }

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()

      setProfile(profileData)

      // Fetch active application statuses
      const { data: appsData } = await supabase
        .from("job_applications")
        .select("id, url, status, missing_fields, title, company, platform")
        .eq("user_id", user.id)
      setApplications(appsData || [])

      // Fetch jobs from our custom API (handles Brave + Cache TTL logic)
      const url = forceRefresh ? "/api/jobs?refresh=true" : "/api/jobs"
      const res = await fetch(url)
      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.error || "Failed to retrieve matching jobs")
      }

      const data = await res.json()
      setJobs(data.jobs || [])
    } catch (err: unknown) {
      console.error(err)
      const message = err instanceof Error ? err.message : "An error occurred while loading jobs."
      setError(message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Toggle Save job
  const handleToggleSave = async (jobId: string, currentSaved: boolean) => {
    setSavingJobId(jobId)
    try {
      const { error: updateError } = await supabase
        .from("jobs")
        .update({ saved_status: !currentSaved })
        .eq("id", jobId)

      if (updateError) throw updateError

      // Update local state
      setJobs(jobs.map(j => j.id === jobId ? { ...j, saved_status: !currentSaved } : j))
      toast.add({
        title: currentSaved ? "Job Removed" : "Job Bookmarked",
        description: currentSaved ? "Removed from saved jobs list." : "Added to your saved jobs list.",
        type: "success"
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update saved job status"
      toast.add({
        title: "Error Saving Job",
        description: message,
        type: "error"
      })
    } finally {
      setSavingJobId(null)
    }
  }

  // Completeness items check
  const calculateCompleteness = () => {
    if (!profile) return 0
    let score = 0
    if (profile.full_name?.trim()) score += 15
    if (profile.email?.trim()) score += 10
    if (profile.phone?.trim()) score += 10
    if (profile.summary?.trim()) score += 15
    if (profile.skills && profile.skills.length > 0) score += 15
    if (profile.experience && profile.experience.length > 0) score += 15
    if (profile.education && profile.education.length > 0) score += 10
    if (
      (profile.projects && profile.projects.length > 0) ||
      profile.github_url?.trim() ||
      profile.linkedin_url?.trim() ||
      (profile.certifications && profile.certifications.length > 0)
    ) {
      score += 10
    }
    return score
  }

  const completeness = calculateCompleteness()

  // Dynamic Recent Activity logs
  const getRecentActivity = () => {
    const activityList: { text: string; time: string; icon: React.ReactNode }[] = []

    if (jobs.length > 0) {
      const oldestFetched = new Date(jobs[0].fetched_at)
      const hoursAgo = Math.max(1, Math.floor((Date.now() - oldestFetched.getTime()) / (1000 * 60 * 60)))
      activityList.push({
        text: `Fetched ${jobs.length} job matches`,
        time: `${hoursAgo}h ago`,
        icon: (
          <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5" />
          </svg>
        )
      })
    }

    const savedCount = jobs.filter(j => j.saved_status).length
    if (savedCount > 0) {
      const savedJob = jobs.find(j => j.saved_status)
      activityList.push({
        text: `Saved ${savedJob?.company} role`,
        time: `3h ago`,
        icon: (
          <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        )
      })
    }

    if (profile?.updated_at) {
      const updatedDate = new Date(profile.updated_at)
      const daysAgo = Math.floor((Date.now() - updatedDate.getTime()) / (1000 * 60 * 60 * 24))
      activityList.push({
        text: "Updated preferences",
        time: daysAgo === 0 ? "Today" : `${daysAgo}d ago`,
        icon: (
          <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        )
      })
    }

    // Default fallback logs if profile updated is too old
    if (activityList.length < 4) {
      activityList.push({
        text: "Connected Google Auth",
        time: "1d ago",
        icon: (
          <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        )
      })
    }

    return activityList
  }

  // Filtered jobs list
  const filteredJobs = jobs.filter((job) => {
    if (selectedPlatform === "all") return true
    return job.platform.toLowerCase() === selectedPlatform.toLowerCase()
  })

  // Helper colors for platforms
  const getPlatformBadge = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "greenhouse":
        return <span className="px-2.5 py-0.5 bg-emerald-950/60 border border-emerald-800/50 rounded-md text-[10px] font-black text-emerald-400 uppercase tracking-wider">Greenhouse</span>
      case "lever":
        return <span className="px-2.5 py-0.5 bg-indigo-950/60 border border-indigo-800/50 rounded-md text-[10px] font-black text-indigo-400 uppercase tracking-wider">Lever</span>
      case "workable":
        return <span className="px-2.5 py-0.5 bg-teal-950/60 border border-teal-800/50 rounded-md text-[10px] font-black text-teal-400 uppercase tracking-wider">Workable</span>
      case "wellfound":
        return <span className="px-2.5 py-0.5 bg-violet-950/60 border border-violet-800/50 rounded-md text-[10px] font-black text-violet-400 uppercase tracking-wider">Wellfound</span>
      default:
        return <span className="px-2.5 py-0.5 bg-neutral-900 border border-neutral-800 rounded-md text-[10px] font-black text-neutral-400 uppercase tracking-wider">{platform}</span>
    }
  }

  // Color generator based on Company Name for logos
  const getCompanyLogo = (company: string) => {
    const firstLetter = company.charAt(0).toUpperCase()
    const colors = [
      "from-primary/30 to-violet-500/30 text-primary border-primary/20",
      "from-rose-500/30 to-pink-500/30 text-rose-400 border-rose-500/20",
      "from-cyan-500/30 to-blue-500/30 text-cyan-400 border-cyan-500/20",
      "from-amber-500/30 to-orange-500/30 text-amber-400 border-amber-500/20",
    ]
    const colorIndex = company.charCodeAt(0) % colors.length
    return (
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr border flex items-center justify-center font-black text-lg flex-shrink-0 ${colors[colorIndex]}`}>
        {firstLetter}
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="bg-neutral-900/40 border border-neutral-900/60 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden shadow-xl">
        <div className="space-y-2 z-10">
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            Welcome back, {profile?.full_name?.split(" ")[0] || "Alex"}! 👋
          </h2>
          <p className="text-neutral-400 text-sm max-w-lg font-medium leading-relaxed">
            We found some high-match positions that line up with your skills and preferred job search settings.
          </p>
        </div>

        <button
          onClick={() => fetchData(true)}
          disabled={refreshing || loading}
          className="px-5 py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl font-bold text-sm text-neutral-200 hover:text-white transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 z-10"
        >
          {refreshing ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Refreshing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5" />
              </svg>
              Refresh Jobs Feed
            </>
          )}
        </button>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left main job feed column (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Platform Filters Card */}
          <div className="bg-neutral-900/60 border border-neutral-800/80 p-5 rounded-2xl shadow-md">
            <span className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">
              Filter by Platform
            </span>
            <div className="flex flex-wrap gap-2.5">
              {[
                { id: "all", label: "All Platforms (All)", color: "border-neutral-800 hover:border-neutral-700 text-neutral-300" },
                { id: "greenhouse", label: "Greenhouse", color: "border-emerald-900/40 hover:border-emerald-800/50 text-emerald-400" },
                { id: "lever", label: "Lever", color: "border-indigo-900/40 hover:border-indigo-800/50 text-indigo-400" },
                { id: "workable", label: "Workable", color: "border-teal-900/40 hover:border-teal-800/50 text-teal-400" },
                { id: "wellfound", label: "Wellfound", color: "border-violet-900/40 hover:border-violet-800/50 text-violet-400" }
              ].map((plat) => {
                const active = selectedPlatform === plat.id
                return (
                  <button
                    key={plat.id}
                    onClick={() => setSelectedPlatform(plat.id)}
                    className={`px-4 py-2.5 border rounded-xl font-bold text-xs cursor-pointer transition-all flex items-center gap-2 ${
                      active
                        ? "bg-primary text-black border-transparent shadow-[0_0_15px_rgba(172,244,23,0.15)]"
                        : `bg-neutral-950/40 ${plat.color}`
                    }`}
                  >
                    {active && <span className="text-black">✓</span>}
                    {plat.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Jobs List / Feed */}
          {loading ? (
            /* Skeletons */
            <div className="space-y-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className="bg-neutral-900/30 border border-neutral-850 p-6 rounded-2xl flex flex-col md:flex-row gap-6 animate-pulse">
                  <div className="w-12 h-12 rounded-xl bg-neutral-800 flex-shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-neutral-800 rounded w-1/3" />
                    <div className="h-3 bg-neutral-800 rounded w-1/4" />
                    <div className="flex gap-2 pt-2">
                      <div className="h-5 bg-neutral-800 rounded w-12" />
                      <div className="h-5 bg-neutral-800 rounded w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            /* Error Card */
            <div className="p-8 bg-red-950/40 border border-red-800/40 rounded-3xl text-center space-y-4">
              <p className="text-red-400 text-sm font-semibold">{error}</p>
              <button
                onClick={() => fetchData()}
                className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold text-xs rounded-xl border border-neutral-800 cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : filteredJobs.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center min-h-[40vh] border border-dashed border-neutral-850 rounded-3xl p-8 bg-neutral-900/10 text-center">
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl mb-4 text-primary">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-neutral-200">No job matches found</h3>
              <p className="text-sm text-neutral-500 mt-1 max-w-sm">
                No matching jobs found on the selected platform. Expand your filter or click Refresh to query again.
              </p>
            </div>
          ) : (
            /* Live Job Cards */
            <div className="space-y-4">
              {filteredJobs.map((job) => {
                const matchingApp = applications.find(app => app.url === job.job_url)
                const appStatus = matchingApp?.status
                return (
                  <div
                    key={job.id}
                    className="bg-neutral-900/60 border border-neutral-800/80 p-6 rounded-2xl shadow-xl hover:border-neutral-700/60 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                  >
                    {/* Left Info section */}
                    <div className="flex gap-4 items-start flex-1 min-w-0">
                      {getCompanyLogo(job.company)}
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-extrabold text-[17px] text-neutral-100 truncate pr-2">
                            {job.title}
                          </h4>
                          {getPlatformBadge(job.platform)}
                          {appStatus && (
                            <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md uppercase tracking-wider ${
                              appStatus === "submitted" ? "bg-emerald-950/80 border border-emerald-800/40 text-emerald-400" :
                              appStatus === "failed" ? "bg-red-950/80 border border-red-800/40 text-red-400" :
                              appStatus === "missing_profile_info" ? "bg-orange-950/80 border border-orange-850/40 text-orange-400 animate-pulse" :
                              "bg-yellow-950/80 border border-yellow-800/40 text-yellow-400 animate-pulse"
                            }`}>
                              {appStatus === "in_queue" ? "In Queue" :
                               appStatus === "detecting_fields" ? "Scanning Fields" :
                               appStatus === "missing_profile_info" ? "Action Required" :
                               appStatus === "submitting" ? "Applying" :
                               appStatus === "submitted" ? "Applied" :
                               appStatus === "failed" ? "Failed" : appStatus}
                            </span>
                          )}
                        </div>
                      <p className="text-sm font-semibold text-neutral-300">{job.company}</p>

                      {/* Job details banner */}
                      <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-neutral-400 font-medium pt-1">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {job.salary}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {job.job_type}
                        </span>
                      </div>

                      {/* Skill breakdown pills */}
                      <div className="flex flex-wrap gap-1.5 pt-2.5">
                        {job.matched_skills && job.matched_skills.length > 0 ? (
                          job.matched_skills.map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-0.5 bg-emerald-950/60 border border-emerald-800/40 rounded text-[11px] font-bold text-emerald-400 flex items-center gap-1"
                            >
                              ✓ {skill}
                            </span>
                          ))
                        ) : (
                          job.tags?.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-neutral-950 border border-neutral-800 rounded text-[11px] font-semibold text-neutral-400"
                            >
                              {tag}
                            </span>
                          ))
                        )}
                        {job.missing_skills?.map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 bg-neutral-950 border border-neutral-800/80 rounded text-[11px] font-medium text-neutral-400 flex items-center gap-1"
                            title="Missing skill in your candidate profile"
                          >
                            + {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Score & Actions section */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center w-full md:w-auto gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-neutral-850">
                    <div className="text-left md:text-right space-y-1">
                      <span className="text-sm font-black text-primary block">{job.match_score}% Match</span>
                      <div className="w-24 bg-neutral-950 h-1 rounded-full overflow-hidden border border-neutral-800/40">
                        <div
                          className="bg-primary h-full rounded-full"
                          style={{ width: `${job.match_score}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-neutral-500 font-bold block uppercase tracking-wider">
                        {job.match_score >= 90 ? "Excellent Match" : "Great Match"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* ATS Score Button */}
                      <button
                        onClick={() => setSelectedTailorJob(job)}
                        title="Check ATS score & generate tailored resume"
                        className="px-3 py-2.5 bg-violet-950/60 hover:bg-violet-900/70 border border-violet-800/50 text-violet-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                      >
                        🎯 ATS
                      </button>

                      <button
                        onClick={() => handleToggleSave(job.id, job.saved_status)}
                        disabled={savingJobId === job.id}
                        className={`p-2.5 rounded-xl border transition-colors cursor-pointer disabled:opacity-50 ${
                          job.saved_status
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-neutral-950 hover:bg-neutral-800 border-neutral-800 text-neutral-400 hover:text-white"
                        }`}
                        title={job.saved_status ? "Bookmark Saved" : "Bookmark Job"}
                        aria-label={job.saved_status ? "Remove bookmark" : "Bookmark job"}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                          />
                        </svg>
                      </button>

                      {appStatus === "submitted" ? (
                        <button
                          disabled
                          className="px-4 py-2.5 bg-neutral-800 text-neutral-400 font-bold text-xs rounded-xl border border-neutral-700 flex items-center gap-1 text-center cursor-not-allowed"
                        >
                          Applied ✓
                        </button>
                      ) : appStatus === "missing_profile_info" ? (
                        <button
                          onClick={() => setSelectedApplyJob(job)}
                          className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-black font-bold text-xs rounded-xl shadow-[0_4px_15px_rgba(249,115,22,0.2)] transition-all flex items-center gap-1 text-center cursor-pointer"
                        >
                          Resolve Info
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </button>
                      ) : appStatus && appStatus !== "failed" ? (
                        <button
                          disabled
                          className="px-4 py-2.5 bg-neutral-900 text-neutral-500 font-bold text-xs rounded-xl border border-neutral-800 flex items-center gap-1 text-center cursor-not-allowed animate-pulse"
                        >
                          Applying...
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedApplyJob(job)}
                          className="px-4 py-2.5 bg-primary hover:bg-primary/95 text-black font-bold text-xs rounded-xl shadow-[0_4px_15px_rgba(172,244,23,0.15)] transition-all flex items-center gap-1 text-center cursor-pointer"
                        >
                          Apply Now
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 00-2 2v4a2 2 0 002 2h10a2 2 0 002-2v-4a2 2 0 00-2-2h-4" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>

        {/* Right sidebar column (1 col) */}
        <div className="space-y-6">
          {/* Profile Completeness reusable card */}
          <div className="bg-neutral-900/60 border border-neutral-800/80 p-6 rounded-2xl shadow-xl flex flex-col items-center text-center">
            <span className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">
              Completeness
            </span>

            {/* Circular Progress SVG */}
            <div className="relative flex items-center justify-center mb-4">
              <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  className="text-neutral-800"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                  r="40"
                  cx="50"
                  cy="50"
                />
                {/* Foreground Filled Ring */}
                <circle
                  className="text-primary transition-all duration-700 ease-out"
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * completeness) / 100}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="40"
                  cx="50"
                  cy="50"
                />
              </svg>
              {/* Central Text */}
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-black text-white">{completeness}%</span>
                <span className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider">Ready</span>
              </div>
            </div>

            {/* Checklist items */}
            <div className="w-full border-t border-neutral-800 mt-5 pt-4 space-y-2.5 text-left text-xs font-medium">
              {[
                { label: "Basic Info", isDone: !!profile?.full_name?.trim() && !!profile?.phone?.trim() },
                { label: "Work Experience", isDone: (profile?.experience_years ?? 0) > 0 || (profile?.work_experience?.length ?? 0) > 0 },
                { label: "Education", isDone: !!profile?.education },
                { label: "Skills", isDone: (profile?.skills?.length ?? 0) > 0 },
                { label: "Resume", isDone: completeness >= 100 }
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-neutral-400">
                  <span>{item.label}</span>
                  {item.isDone ? (
                    <span className="text-primary font-bold">✓</span>
                  ) : (
                    <span className="text-red-500/80 font-bold">✗</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity card */}
          <div className="bg-neutral-900/60 border border-neutral-800/80 p-6 rounded-2xl shadow-xl space-y-4">
            <span className="block text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-800 pb-3">
              Recent Activity
            </span>

            <div className="space-y-4">
              {getRecentActivity().map((activity, idx) => (
                <div key={idx} className="flex gap-3 items-start text-xs">
                  <div className="p-1.5 bg-neutral-950 border border-neutral-800 rounded-lg flex-shrink-0">
                    {activity.icon}
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-semibold text-neutral-200 leading-snug">{activity.text}</p>
                    <span className="text-[10px] text-neutral-500 font-bold block">{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Apply Options Dialog */}
      {selectedApplyJob && (
        <ApplyDialog
          job={selectedApplyJob}
          onClose={() => setSelectedApplyJob(null)}
          onSuccess={() => {
            fetchData()
          }}
        />
      )}

      {/* ATS Resume Tailor Panel */}
      {selectedTailorJob && (
        <ResumeTailorPanel
          job={selectedTailorJob}
          onClose={() => setSelectedTailorJob(null)}
        />
      )}
    </div>
  )
}
