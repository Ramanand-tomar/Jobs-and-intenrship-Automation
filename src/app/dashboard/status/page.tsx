"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import ApplyDialog from "@/components/apply-dialog"
import { toast } from "@/components/ui/toast"

interface Application {
  id: string
  job_id: string | null
  title: string
  company: string
  platform: string
  url: string
  status: "in_queue" | "detecting_fields" | "missing_profile_info" | "submitting" | "submitted" | "failed" | "interviewing" | "offered" | "rejected"
  browserbase_session_id: string | null
  created_at: string
  updated_at: string
  match_percentage: number
  missing_fields: unknown[] | null
}

export default function StatusPage() {
  const supabase = createClient()
  const [applications, setApplications] = useState<Application[]>([])
  const [resumeVersions, setResumeVersions] = useState<Record<string, { ats_score?: number; pdf_storage_path?: string }>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  
  // Search, Filters & View Mode
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban")
  
  // Modal for resolving missing fields
  const [selectedApplyJob, setSelectedApplyJob] = useState<{ id: string; title: string; company: string; job_url: string; platform: string } | null>(null)

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError("Session expired. Please log in.")
        setLoading(false)
        return
      }

      const { data, error: fetchError } = await supabase
        .from("job_applications")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })

      if (fetchError) throw fetchError
      setApplications(data || [])

      // Fetch latest resume_versions keyed by job_id
      const { data: versions } = await supabase
        .from("resume_versions")
        .select("job_id, ats_score, missing_keywords, keyword_matches, pdf_storage_path, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (versions) {
        // Keep only the latest version per job
        const versionMap: Record<string, { ats_score?: number; pdf_storage_path?: string }> = {}
        for (const v of versions) {
          if (v.job_id && !versionMap[v.job_id]) {
            versionMap[v.job_id] = v
          }
        }
        setResumeVersions(versionMap)
      }
    } catch (err: unknown) {
      console.error(err)
      const message = err instanceof Error ? err.message : "Failed to load applications"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [])

  const handleUpdateStatus = async (appId: string, newStatus: Application["status"]) => {
    try {
      const { error: updateError } = await supabase
        .from("job_applications")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", appId)

      if (updateError) throw updateError

      setApplications(prev =>
        prev.map(app => (app.id === appId ? { ...app, status: newStatus } : app))
      )
      toast.add({
        title: "Status Updated",
        description: `Application stage changed to ${newStatus.replace("_", " ")}.`,
        type: "success"
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update status"
      toast.add({ title: "Update Error", description: message, type: "error" })
    }
  }

  const handleDeleteApplication = async (id: string) => {
    if (!confirm("Are you sure you want to delete this application record?")) return
    try {
      const { error: delError } = await supabase
        .from("job_applications")
        .delete()
        .eq("id", id)

      if (delError) throw delError
      setApplications(applications.filter(app => app.id !== id))
      toast.add({
        title: "Record Deleted",
        description: "Application record removed successfully.",
        type: "success"
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete application record"
      toast.add({
        title: "Delete Error",
        description: message,
        type: "error"
      })
    }
  }

  // Stats calculation
  const totalApps = applications.length
  const successApps = applications.filter(a => a.status === "submitted").length
  const failedApps = applications.filter(a => a.status === "failed").length
  const processingApps = applications.filter(a => ["in_queue", "detecting_fields", "submitting"].includes(a.status)).length
  const actionRequiredApps = applications.filter(a => a.status === "missing_profile_info").length

  // Filtered list
  const filteredApps = applications.filter(app => {
    const matchesSearch = 
      app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.company.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || app.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: Application["status"]) => {
    switch (status) {
      case "submitted":
        return (
          <span className="px-2.5 py-1 text-xs font-bold bg-emerald-950/80 border border-emerald-800/40 text-emerald-400 rounded-lg flex items-center gap-1.5 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Applied
          </span>
        )
      case "failed":
        return (
          <span className="px-2.5 py-1 text-xs font-bold bg-red-950/80 border border-red-800/40 text-red-400 rounded-lg flex items-center gap-1.5 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Failed
          </span>
        )
      case "missing_profile_info":
        return (
          <span className="px-2.5 py-1 text-xs font-bold bg-orange-950/80 border border-orange-850/40 text-orange-400 rounded-lg flex items-center gap-1.5 w-fit animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            Action Required
          </span>
        )
      case "detecting_fields":
        return (
          <span className="px-2.5 py-1 text-xs font-bold bg-yellow-950/80 border border-yellow-800/40 text-yellow-400 rounded-lg flex items-center gap-1.5 w-fit animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
            Scanning Form
          </span>
        )
      case "submitting":
        return (
          <span className="px-2.5 py-1 text-xs font-bold bg-primary/20 border border-primary/30 text-primary rounded-lg flex items-center gap-1.5 w-fit animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
            Submitting
          </span>
        )
      case "in_queue":
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-bold bg-neutral-900 border border-neutral-800 text-neutral-400 rounded-lg flex items-center gap-1.5 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
            Queued
          </span>
        )
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-1 lg:p-4 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border border-neutral-800 p-6 md:p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1.5 z-10">
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-100">
            Application Status Hub
          </h2>
          <p className="text-xs font-medium text-neutral-400 max-w-lg">
            Track real-time background sessions of your AI agents. Resolve missing application requirements or view debugger sessions instantly.
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Card */}
        <div className="bg-neutral-900/40 border border-neutral-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
          <span className="text-neutral-500 text-xs font-bold uppercase tracking-wider block">Total Triggered</span>
          <h3 className="text-3xl font-black text-neutral-100 mt-2">{totalApps}</h3>
        </div>

        {/* Processing Card */}
        <div className="bg-neutral-900/40 border border-neutral-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
          <span className="text-primary text-xs font-bold uppercase tracking-wider block">AI Processing</span>
          <h3 className="text-3xl font-black text-primary mt-2">{processingApps}</h3>
        </div>

        {/* Action Required Card */}
        <div className="bg-neutral-900/40 border border-neutral-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
          <span className="text-orange-400 text-xs font-bold uppercase tracking-wider block">Action Needed</span>
          <h3 className="text-3xl font-black text-orange-400 mt-2">{actionRequiredApps}</h3>
        </div>

        {/* Success Card */}
        <div className="bg-neutral-900/40 border border-neutral-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
          <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider block">Applied Successful</span>
          <h3 className="text-3xl font-black text-emerald-400 mt-2">{successApps}</h3>
        </div>
      </div>

      {/* Filters & View Switcher Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-neutral-950/40 border border-neutral-800 p-4 rounded-2xl">
        <div className="flex-1 max-w-md relative">
          <input
            type="text"
            placeholder="Search by company or job title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-neutral-200"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-neutral-900 border border-neutral-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "kanban" ? "bg-primary text-black" : "text-neutral-400 hover:text-white"
              }`}
            >
              Kanban Board
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "list" ? "bg-primary text-black" : "text-neutral-400 hover:text-white"
              }`}
            >
              List View
            </button>
          </div>

          {/* Status Tabs (List mode) */}
          {viewMode === "list" && (
            <div className="flex gap-2 items-center overflow-x-auto scrollbar-none">
              {[
                { id: "all", label: "All" },
                { id: "submitted", label: "Applied" },
                { id: "missing_profile_info", label: "Action Needed" },
                { id: "submitting", label: "Processing" },
                { id: "failed", label: "Failed" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap cursor-pointer ${
                    statusFilter === tab.id
                      ? "bg-neutral-800 border-neutral-700 text-white"
                      : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content: Kanban vs List View */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-24 bg-neutral-900/40 border border-neutral-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : viewMode === "kanban" ? (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {[
            {
              id: "in_queue",
              title: "Queued / Scanning",
              color: "text-yellow-400 border-yellow-800/40 bg-yellow-950/20",
              statuses: ["in_queue", "detecting_fields", "submitting"]
            },
            {
              id: "missing_profile_info",
              title: "Action Needed",
              color: "text-orange-400 border-orange-800/40 bg-orange-950/20",
              statuses: ["missing_profile_info"]
            },
            {
              id: "submitted",
              title: "Applied / Submitted",
              color: "text-emerald-400 border-emerald-800/40 bg-emerald-950/20",
              statuses: ["submitted"]
            },
            {
              id: "interviewing",
              title: "Interviewing",
              color: "text-purple-400 border-purple-800/40 bg-purple-950/20",
              statuses: ["interviewing"]
            },
            {
              id: "offered",
              title: "Offered / Closed",
              color: "text-blue-400 border-blue-800/40 bg-blue-950/20",
              statuses: ["offered", "rejected", "failed"]
            }
          ].map(col => {
            const colApps = filteredApps.filter(a => col.statuses.includes(a.status))
            return (
              <div key={col.id} className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-4 space-y-3 min-w-[220px]">
                <div className={`p-2.5 rounded-xl border flex justify-between items-center ${col.color}`}>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider">{col.title}</h4>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-neutral-950/60 border border-neutral-800/40">
                    {colApps.length}
                  </span>
                </div>

                <div className="space-y-3 min-h-[300px]">
                  {colApps.length === 0 ? (
                    <div className="border border-dashed border-neutral-800/60 rounded-xl p-4 text-center text-xs text-neutral-600">
                      Empty column
                    </div>
                  ) : (
                    colApps.map(app => (
                      <div key={app.id} className="bg-neutral-950 border border-neutral-800/80 p-3.5 rounded-xl space-y-2.5 shadow-md hover:border-neutral-700 transition-all">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="text-xs font-bold text-neutral-100 line-clamp-1">{app.title}</h5>
                            <p className="text-[11px] font-semibold text-neutral-400">{app.company}</p>
                          </div>
                          <span className="text-[10px] font-bold text-primary">{app.match_percentage || 85}%</span>
                        </div>

                        {app.status === "missing_profile_info" && (
                          <button
                            onClick={() => setSelectedApplyJob({
                              id: app.job_id || app.id,
                              title: app.title,
                              company: app.company,
                              job_url: app.url,
                              platform: app.platform
                            })}
                            className="w-full py-1.5 bg-orange-500 hover:bg-orange-400 text-black rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            Resolve Required Info
                          </button>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-neutral-850 text-[10px]">
                          <select
                            value={app.status}
                            onChange={(e) => handleUpdateStatus(app.id, e.target.value as Application["status"])}
                            className="bg-neutral-900 border border-neutral-800 text-neutral-300 rounded px-1.5 py-0.5 text-[10px] cursor-pointer"
                          >
                            <option value="in_queue">In Queue</option>
                            <option value="missing_profile_info">Action Needed</option>
                            <option value="submitted">Applied</option>
                            <option value="interviewing">Interviewing</option>
                            <option value="offered">Offered</option>
                            <option value="rejected">Rejected</option>
                            <option value="failed">Failed</option>
                          </select>

                          <button
                            onClick={() => handleDeleteApplication(app.id)}
                            className="text-neutral-500 hover:text-red-400 transition-colors p-1"
                            title="Delete"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : filteredApps.length === 0 ? (
        /* Empty State */
        <div className="border-2 border-dashed border-neutral-800 rounded-3xl p-10 text-center bg-neutral-900/5">
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl mb-4 text-primary inline-block">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-neutral-200">No applications matched</h3>
          <p className="text-xs text-neutral-500 max-w-xs mx-auto mt-1">
            We couldn't find any application history matching the query or status filter. Try triggering an automated apply from the Jobs tab.
          </p>
        </div>
      ) : (
        /* Records List */
        <div className="space-y-4">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className="bg-neutral-900/60 border border-neutral-800/80 p-5 rounded-2xl hover:border-neutral-700/60 transition-all flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6"
            >
              {/* Job Information */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <h4 className="font-extrabold text-[17px] text-neutral-100 truncate pr-2">
                    {app.title}
                  </h4>
                  <span className="px-2 py-0.5 text-[9px] font-bold bg-neutral-950 border border-neutral-800 rounded text-neutral-400 capitalize">
                    {app.platform}
                  </span>
                </div>
                <p className="text-sm font-semibold text-neutral-300 mb-2">{app.company}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500 font-medium">
                  <span>Match Score: {app.match_percentage}%</span>
                  <span>•</span>
                  <span>Scanned: {new Date(app.created_at).toLocaleDateString()}</span>
                  {/* ATS Score badge */}
                  {(() => {
                    const rv = app.job_id ? resumeVersions[app.job_id] : null
                    if (!rv || rv.ats_score === undefined) return null
                    const score = rv.ats_score
                    return (
                      <>
                        <span>•</span>
                        <span style={{
                          color: score >= 75 ? "#4ade80"
                            : score >= 50 ? "#fbbf24" : "#f87171",
                          fontWeight: 700,
                        }}>
                          🎯 ATS: {score}/100
                        </span>
                      </>
                    )
                  })()}
                </div>
                {/* Tailored resume download link */}
                {app.job_id && resumeVersions[app.job_id]?.pdf_storage_path && (
                  <div className="mt-1.5">
                    <span className="text-[11px] text-violet-400 font-semibold flex items-center gap-1">
                      📄 Tailored resume generated for this job
                    </span>
                  </div>
                )}
              </div>

              {/* Status and Action controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 justify-end">
                {/* Live Badge */}
                <div>{getStatusBadge(app.status)}</div>

                {/* Actions */}
                <div className="flex gap-2 items-center">
                  {/* Resolve Missing Data */}
                  {app.status === "missing_profile_info" && (
                    <button
                      onClick={() => setSelectedApplyJob({
                        id: app.id,
                        title: app.title,
                        company: app.company,
                        job_url: app.url,
                        platform: app.platform
                      })}
                      className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-black font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      Fill Info
                    </button>
                  )}

                  {/* View Browserbase Session Debugger */}
                  {app.browserbase_session_id && (
                    <a
                      href={`https://www.browserbase.com/sessions/${app.browserbase_session_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-1"
                    >
                      Session Log
                    </a>
                  )}

                  {/* Open Job Link */}
                  <a
                    href={app.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white font-semibold text-xs rounded-xl transition-all"
                  >
                    Open URL
                  </a>

                  {/* Delete application log */}
                  <button
                    onClick={() => handleDeleteApplication(app.id)}
                    className="p-2 bg-neutral-950 hover:bg-red-950/40 border border-neutral-800 hover:border-red-900/40 text-neutral-500 hover:text-red-400 rounded-xl transition-all cursor-pointer"
                    title="Delete Log"
                  >
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Apply Options Dialog */}
      {selectedApplyJob && (
        <ApplyDialog
          job={selectedApplyJob}
          onClose={() => setSelectedApplyJob(null)}
          onSuccess={() => {
            fetchApplications()
          }}
        />
      )}
    </div>
  )
}
