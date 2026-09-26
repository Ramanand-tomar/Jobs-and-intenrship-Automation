"use client"

import React, { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

interface ApplyDialogProps {
  job: {
    id: string
    title: string
    company: string
    job_url: string
    platform: string
  }
  onClose: () => void
  onSuccess: () => void
}

type ViewState = "decision" | "loading" | "missing_fields" | "success" | "failed"

export default function ApplyDialog({ job, onClose, onSuccess }: ApplyDialogProps) {
  const supabase = createClient()
  const [viewState, setViewState] = useState<ViewState>("decision")
  const [loadingText, setLoadingText] = useState("Queueing AI Agent...")
  const [errorMsg, setErrorMsg] = useState("")
  
  const [applicationId, setApplicationId] = useState("")
  const [missingFields, setMissingFields] = useState<Array<{ key: string; label: string; type: string }>>([])
  const [formInputs, setFormInputs] = useState<Record<string, string>>({})
  const [savingMissing, setSavingMissing] = useState(false)
  const [autofilling, setAutofilling] = useState(false)
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Cleanup polling interval on unmount
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [])

  const handleApplyManually = () => {
    window.open(job.job_url, "_blank", "noopener,noreferrer")
    onClose()
  }

  const startPolling = (appId: string) => {
    setViewState("loading")
    setLoadingText("AI Agent is starting a new Browserbase session...")
    
    let attempts = 0
    pollIntervalRef.current = setInterval(async () => {
      attempts++
      if (attempts > 50) { // Stop polling after 100 seconds
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
        setErrorMsg("Task timeout. The background agent is taking longer than expected. You can check status in the activity logs later.")
        setViewState("decision")
        return
      }

      const { data: app, error } = await supabase
        .from("job_applications")
        .select("*")
        .eq("id", appId)
        .maybeSingle()

      if (error || !app) {
        console.error("Polling database error:", error)
        return
      }

      if (app.status === "detecting_fields") {
        setLoadingText("AI Agent is scanning the page using Stagehand & detecting required fields...")
      } else if (app.status === "missing_profile_info") {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
        setMissingFields(app.missing_fields || [])
        
        // Initialize form inputs for missing keys
        const inputs: Record<string, string> = {}
        ;(app.missing_fields || []).forEach((f: { key: string }) => {
          inputs[f.key] = ""
        })
        setFormInputs(inputs)
        setViewState("missing_fields")
      } else if (app.status === "submitting") {
        setLoadingText("Form requirements met! AI Agent is auto-filling form inputs and uploading resume...")
      } else if (app.status === "submitted") {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
        setViewState("success")
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 2500)
      } else if (app.status === "failed") {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
        setViewState("failed")
      }
    }, 2000)
  }

  const handleApplyAutomatically = async () => {
    setViewState("loading")
    setErrorMsg("")
    try {
      const res = await fetch("/api/jobs/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId: job.id,
          jobUrl: job.job_url,
          platform: job.platform,
          title: job.title,
          company: job.company,
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to trigger automated application")
      }

      setApplicationId(data.applicationId)
      startPolling(data.applicationId)
    } catch (err: unknown) {
      console.error(err)
      const message = err instanceof Error ? err.message : "An error occurred while queuing application"
      setErrorMsg(message)
      setViewState("decision")
    }
  }

  const handleInputChange = (key: string, val: string) => {
    setFormInputs(prev => ({ ...prev, [key]: val }))
  }

  const handleAIAutofill = async () => {
    setAutofilling(true)
    setErrorMsg("")
    try {
      const res = await fetch("/api/profile/autofill-missing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          missingFields,
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to extract values using AI")
      }

      if (data.values) {
        setFormInputs(prev => ({
          ...prev,
          ...data.values
        }))
      }
    } catch (err: unknown) {
      console.error(err)
      const message = err instanceof Error ? err.message : "Failed to autofill values using AI"
      setErrorMsg(message)
    } finally {
      setAutofilling(false)
    }
  }

  const handleSaveMissingData = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingMissing(true)
    setErrorMsg("")
    try {
      const res = await fetch("/api/jobs/apply/resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicationId,
          profileFields: formInputs,
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to submit missing details")
      }

      // Resume polling
      setSavingMissing(false)
      startPolling(applicationId)
    } catch (err: unknown) {
      console.error(err)
      const message = err instanceof Error ? err.message : "Failed to save missing fields"
      setErrorMsg(message)
      setSavingMissing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 pointer-events-auto">
      {/* Dialog container */}
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl relative">
        {/* Header Title */}
        {viewState !== "loading" && viewState !== "success" && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* DECISION VIEW */}
        {viewState === "decision" && (
          <div>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center p-3.5 bg-primary/10 border border-primary/20 rounded-2xl mb-4 text-primary">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-neutral-100">Apply to Position</h3>
              <p className="text-sm text-neutral-400 mt-2 max-w-xs mx-auto">
                {job.title} at <span className="text-neutral-200 font-semibold">{job.company}</span>
              </p>
            </div>

            {errorMsg && (
              <div className="mb-6 p-3.5 bg-red-950/60 border border-red-800/50 rounded-2xl text-red-400 text-sm flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={handleApplyAutomatically}
                className="w-full p-4 bg-primary hover:bg-primary/95 text-black rounded-2xl font-bold text-sm shadow-[0_4px_20px_rgba(172,244,23,0.25)] transition-all cursor-pointer flex items-center justify-center gap-2.5"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Apply Automatically using AI Agent
              </button>

              <button
                onClick={handleApplyManually}
                className="w-full p-4 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 hover:text-white rounded-2xl font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2.5"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Apply Manually (Direct Link)
              </button>
            </div>
          </div>
        )}

        {/* LOADING & POLLING VIEW */}
        {viewState === "loading" && (
          <div className="text-center py-8 space-y-6">
            <div className="flex justify-center">
              <svg className="animate-spin h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-neutral-200">Executing Background Task...</h4>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
                {loadingText}
              </p>
            </div>
          </div>
        )}

        {/* MISSING FIELDS POPUP (Gate dialog) */}
        {viewState === "missing_fields" && (
          <div>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center p-3 bg-red-950/40 border border-red-800/40 rounded-2xl mb-4 text-red-400 animate-pulse">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-neutral-100">Missing Information Detected</h3>
              <p className="text-xs text-neutral-400 mt-2 max-w-xs mx-auto leading-relaxed">
                The AI Agent scanned the form but found required fields that are missing from your profile. Fill them in to proceed.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-950/60 border border-red-800/50 rounded-xl text-red-400 text-xs">
                {errorMsg}
              </div>
            )}

            <div className="mb-5">
              <button
                type="button"
                onClick={handleAIAutofill}
                disabled={autofilling || savingMissing}
                className="w-full py-3 px-4 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary hover:text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {autofilling ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    AI Agent Extracting Values...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI Agent Autofill (Extract from Profile & Resume)
                  </>
                )}
              </button>
            </div>

            <form onSubmit={handleSaveMissingData} className="space-y-4 max-h-[35vh] overflow-y-auto pr-1 mb-6 scrollbar-thin">
              {missingFields.map((field) => (
                <div key={field.key} className="space-y-1">
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    {field.label} <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type={field.type === "email" ? "email" : field.type === "tel" ? "text" : "text"}
                    required
                    disabled={savingMissing}
                    placeholder={`Enter your ${field.label.toLowerCase()}`}
                    value={formInputs[field.key] || ""}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    className="block w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-sm transition-all"
                  />
                </div>
              ))}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingMissing}
                  className="w-full py-3 px-4 bg-primary hover:bg-primary/95 text-black rounded-xl font-bold text-sm shadow-[0_4px_15px_rgba(172,244,23,0.15)] flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingMissing ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-black" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving & Resuming...
                    </>
                  ) : (
                    "Save & Continue Application"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SUCCESS VIEW */}
        {viewState === "success" && (
          <div className="text-center py-8 space-y-4">
            <div className="inline-flex items-center justify-center p-3 bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 rounded-full animate-bounce">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-bold text-neutral-100">Application Submitted!</h4>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
                The AI Agent successfully filled the form fields, attached your resume, and clicked submit. Check status logs for details.
              </p>
            </div>
          </div>
        )}

        {/* FAILED VIEW */}
        {viewState === "failed" && (
          <div>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center p-3.5 bg-red-950/40 border border-red-850/40 text-red-400 rounded-2xl mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-neutral-100">Automation Session Failed</h3>
              <p className="text-xs text-neutral-400 mt-2 max-w-xs mx-auto leading-relaxed">
                The background Playwright script encountered an issue loading or submitting the application. You can complete it manually.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleApplyManually}
                className="w-full p-3.5 bg-primary hover:bg-primary/95 text-black rounded-xl font-bold text-sm shadow-[0_4px_15px_rgba(172,244,23,0.15)] cursor-pointer"
              >
                Apply Manually (Open URL)
              </button>
              
              <button
                onClick={() => setViewState("decision")}
                className="w-full p-3.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded-xl font-bold text-sm cursor-pointer"
              >
                Back to Selection
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
