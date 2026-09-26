"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/toast"

interface OnboardingDialogProps {
  onSuccess?: () => void
}

export default function OnboardingDialog({ onSuccess }: OnboardingDialogProps) {
  const supabase = createClient()

  const [fullName, setFullName] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState("")
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState("")
  const [dragActive, setDragActive] = useState(false)
  const [statusStep, setStatusStep] = useState(0) // 0: Idle, 1: Uploading, 2: Parsing, 3: Completed
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        setFullName(
          user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            ""
        )
      }
    }
    fetchUser()
  }, [])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0]
      if (selectedFile.type === "application/pdf" || selectedFile.name.endsWith(".docx")) {
        setFile(selectedFile)
        setFileName(selectedFile.name)
      } else {
        toast.add({
          title: "Invalid File Format",
          description: "Please upload a PDF or DOCX file.",
          type: "error"
        })
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      setFileName(selectedFile.name)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !fullName || !userId) return

    setLoading(true)
    setErrorMsg("")
    setStatusStep(1) // Uploading
    setProgress(20)

    try {
      // 1. Upload file to Supabase Storage
      const fileExt = file.name.split(".").pop()
      // Generate clean filename
      const cleanedFileName = `${Date.now()}_resume.${fileExt}`
      const filePath = `${userId}/${cleanedFileName}`

      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(filePath, file, {
          upsert: true,
        })

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`)
      }

      setProgress(50)
      setStatusStep(2) // Parsing with Gemini

      // 2. Trigger the Gemini parser API
      const parseResponse = await fetch("/api/profile/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filePath }),
      })

      const parseResult = await parseResponse.json()
      if (!parseResponse.ok || parseResult.error) {
        throw new Error(parseResult.error || "Failed to parse resume")
      }

      setProgress(100)
      setStatusStep(3) // Completed

      setTimeout(() => {
        if (onSuccess) {
          onSuccess()
        } else {
          window.location.reload()
        }
      }, 500)
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || "An error occurred during onboarding")
      setLoading(false)
      setStatusStep(0)
      setProgress(0)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 pointer-events-auto">
      {/* Dialog container */}
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl relative">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 border border-primary/20 rounded-2xl mb-4 text-primary">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-neutral-100">Resume Required to Continue</h3>
          <p className="text-sm text-neutral-400 mt-2">
            Upload your resume to let our AI build your profile and unlock the dashboard.
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name input */}
          <div>
            <label htmlFor="onb-name" className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              Full Name
            </label>
            <input
              id="onb-name"
              type="text"
              required
              disabled={loading}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Aman Kumar"
              className="block w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm placeholder-neutral-600 transition-all duration-200 disabled:opacity-55"
            />
          </div>

          {/* Drag & Drop Resume zone */}
          <div>
            <span className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              Upload Resume (PDF/DOCX)
            </span>

            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`relative flex flex-col justify-center items-center py-10 px-4 border-2 border-dashed rounded-2xl transition-all duration-200 cursor-pointer ${
                dragActive
                  ? "border-primary bg-primary/5 shadow-[0_0_15px_rgba(172,244,23,0.1)]"
                  : "border-neutral-800 bg-neutral-950/40 hover:border-neutral-700 hover:bg-neutral-950/60"
              }`}
            >
              <input
                type="file"
                id="onboard-file-upload"
                className="hidden"
                accept=".pdf,.docx"
                disabled={loading}
                onChange={handleFileChange}
              />
              <label htmlFor="onboard-file-upload" className="flex flex-col items-center cursor-pointer text-center w-full">
                <svg className="w-12 h-12 text-primary mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm font-semibold text-neutral-200 px-4 truncate max-w-xs">
                  {fileName ? fileName : "Drag & Drop your resume here"}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  Supports PDF or DOCX (Max 5MB)
                </p>
              </label>
            </div>
          </div>

          {/* Progress Section */}
          {loading && (
            <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-3">
              <div className="flex justify-between items-center text-xs text-neutral-400 font-semibold">
                <span className="flex items-center gap-2">
                  {statusStep === 1 && (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                      </span>
                      <span>Uploading File to Storage...</span>
                    </>
                  )}
                  {statusStep === 2 && (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                      </span>
                      <span>AI Parsing in Progress...</span>
                    </>
                  )}
                  {statusStep === 3 && <span>Completing Setup!</span>}
                </span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action button */}
          <button
            type="submit"
            disabled={loading || !file || !fullName}
            className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-black rounded-xl font-bold text-sm shadow-[0_4px_20px_rgba(172,244,23,0.25)] transition-all duration-200 flex justify-center items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Please Wait..." : "Upload & Parse Resume"}
          </button>
        </form>
      </div>
    </div>
  )
}
