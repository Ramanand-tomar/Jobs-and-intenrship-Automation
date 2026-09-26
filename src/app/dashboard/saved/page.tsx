"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import ApplyDialog from "@/components/apply-dialog"
import { CandidateProfile, JobApplication } from "@/types"
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
  match_score: number
  job_url: string
  source_url: string
  applied_status: boolean
  saved_status: boolean
  fetched_at: string
}

export default function SavedJobsPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<CandidateProfile | null>(null)
  const [savedJobs, setSavedJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<Partial<JobApplication>[]>([])
  const [loading, setLoading] = useState(true)
  const [savingJobId, setSavingJobId] = useState<string | null>(null)
  const [selectedApplyJob, setSelectedApplyJob] = useState<Job | null>(null)
  const [error, setError] = useState("")

  const fetchData = async () => {
    try {
      setLoading(true)
      setError("")
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError("User session expired. Please log in.")
        setLoading(false)
        return
      }

      // 1. Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()
      setProfile(profileData)

      // 2. Fetch saved jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from("jobs")
        .select("*")
        .eq("user_id", user.id)
        .eq("saved_status", true)
        .order("fetched_at", { ascending: false })

      if (jobsError) throw jobsError
      setSavedJobs(jobsData || [])

      // 3. Fetch active application statuses
      const { data: appsData } = await supabase
        .from("job_applications")
        .select("id, url, status, missing_fields, title, company, platform")
        .eq("user_id", user.id)
      setApplications(appsData || [])

    } catch (err: unknown) {
      console.error(err)
      const message = err instanceof Error ? err.message : "An error occurred while loading saved jobs."
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Toggle Save job (removes from saved page)
  const handleRemoveSave = async (jobId: string) => {
    setSavingJobId(jobId)
    try {
      const { error: updateError } = await supabase
        .from("jobs")
        .update({ saved_status: false })
        .eq("id", jobId)

      if (updateError) throw updateError

      // Update local state by filtering out the removed job
      setSavedJobs(savedJobs.filter(j => j.id !== jobId))
      toast.add({
        title: "Bookmark Removed",
        description: "Job removed from your saved positions.",
        type: "success"
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to remove bookmark"
      toast.add({
        title: "Error Removing Bookmark",
        description: message,
        type: "error"
      })
    } finally {
      setSavingJobId(null)
    }
  }

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
    <div className="max-w-6xl mx-auto space-y-8 p-1 lg:p-4">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border border-neutral-800 p-6 md:p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl">
        <div className="space-y-1.5 z-10">
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-100 flex items-center gap-2">
            Saved Positions <span className="text-primary font-black">★</span>
          </h2>
          <p className="text-neutral-400 text-xs font-medium max-w-lg">
            Review your bookmarked opportunities, monitor live status changes, or trigger automated AI agent applications.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/60 border border-red-800/50 rounded-2xl text-red-400 text-sm flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-28 bg-neutral-900/40 border border-neutral-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : savedJobs.length === 0 ? (
        /* Empty State */
        <div className="border-2 border-dashed border-neutral-800 rounded-3xl p-12 text-center bg-neutral-900/5 max-w-xl mx-auto">
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl mb-4 text-primary inline-block">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-neutral-200">No saved jobs</h3>
          <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
            You haven't bookmarked any jobs yet. Browse matching jobs in the feed and click the bookmark star to save them here.
          </p>
        </div>
      ) : (
        /* Live Job Cards */
        <div className="space-y-4 max-w-4xl">
          {savedJobs.map((job) => {
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
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                          appStatus === "submitted" ? "bg-emerald-950/80 border border-emerald-800/40 text-emerald-400" :
                          appStatus === "failed" ? "bg-red-950/80 border border-red-800/40 text-red-400" :
                          appStatus === "missing_profile_info" ? "bg-orange-950/80 border border-orange-850/40 text-orange-400 animate-pulse" :
                          "bg-yellow-950/80 border border-yellow-800/40 text-yellow-400 animate-pulse"
                        }`}>
                          {appStatus === "in_queue" ? "In Queue" :
                           appStatus === "detecting_fields" ? "Scanning" :
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
                      {job.salary && (
                        <>
                          <span>•</span>
                          <span>{job.salary}</span>
                        </>
                      )}
                      <span>•</span>
                      <span className="capitalize">{job.job_type}</span>
                      {job.experience_level && (
                        <>
                          <span>•</span>
                          <span className="px-1.5 py-0.5 bg-neutral-950 border border-neutral-800 rounded text-[10px] font-bold text-neutral-300 uppercase tracking-wider">{job.experience_level}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right actions and matching score */}
                <div className="flex flex-row md:flex-col items-start md:items-end justify-between md:justify-center gap-4 w-full md:w-auto border-t md:border-t-0 border-neutral-800 pt-4 md:pt-0">
                  {/* Matching score progress ring */}
                  <div className="space-y-1 text-left md:text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-400 font-bold">Match Score</span>
                      <span className="text-sm font-black text-primary">{job.match_score}%</span>
                    </div>
                    <div className="w-28 bg-neutral-950 h-1.5 rounded-full overflow-hidden border border-neutral-800">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{ width: `${job.match_score}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Unsave job button */}
                    <button
                      onClick={() => handleRemoveSave(job.id)}
                      disabled={savingJobId === job.id}
                      className="p-2.5 bg-primary/10 border border-primary text-primary hover:bg-neutral-800 hover:border-neutral-700 hover:text-neutral-400 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                      title="Remove Bookmark"
                      aria-label="Remove bookmark"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </button>

                    {/* Apply actions */}
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
            )
          })}
        </div>
      )}

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
    </div>
  )
}
