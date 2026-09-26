"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/toast"

interface ResumeFile {
  name: string;
  id?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  last_accessed_at?: string | null;
  metadata?: Record<string, unknown> | null;
}

export default function ResumePage() {
  const supabase = createClient()

  const [resumes, setResumes] = useState<ResumeFile[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState("")
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 1. File Type Validation
    const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    const isDocx = file.name.endsWith(".docx")
    if (!allowedTypes.includes(file.type) && !isDocx) {
      toast.add({
        title: "Invalid File Type",
        description: "Please upload a PDF or DOCX file.",
        type: "error",
      })
      return
    }

    // 2. File Size Validation (Max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.add({
        title: "File Too Large",
        description: "Resume file size must not exceed 5MB.",
        type: "error",
      })
      return
    }

    setUploading(true)
    try {
      // Get userId directly from auth to avoid race condition with state
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("You must be logged in to upload a resume")

      const fileExt = file.name.split(".").pop()
      const cleanedFileName = `${Date.now()}_resume.${fileExt}`
      const filePath = `${user.id}/${cleanedFileName}`

      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(filePath, file, {
          upsert: true,
        })

      if (uploadError) throw uploadError

      // Trigger the profile parsing endpoint to extract all resume details into the database profile
      const parseResponse = await fetch("/api/profile/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filePath }),
      })

      const parseResult = await parseResponse.json()
      if (!parseResponse.ok || parseResult.error) {
        throw new Error(parseResult.error || "Failed to parse resume information")
      }

      toast.add({
        title: "Resume Uploaded & Parsed",
        description: "Resume uploaded and profile information extracted successfully!",
        type: "success"
      })
      fetchResumes()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to upload or parse resume"
      toast.add({
        title: "Upload Error",
        description: message,
        type: "error"
      })
    } finally {
      setUploading(false)
    }
  }

  const fetchResumes = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setUserId(user.id)

    // List files in the user's directory
    const { data: files, error } = await supabase.storage
      .from("resumes")
      .list(user.id, {
        limit: 20,
        sortBy: { column: "created_at", order: "desc" },
      })

    if (error) {
      console.error("Error listing resumes:", error)
    } else if (files) {
      // Filter out folder placeholders if any
      setResumes(files.filter(f => f.name !== ".emptyFolderPlaceholder"))
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchResumes()
  }, [])

  const handlePreview = async (fileName: string) => {
    // Generate signed URL to view the private file
    const { data, error } = await supabase.storage
      .from("resumes")
      .createSignedUrl(`${userId}/${fileName}`, 600) // 10 minutes expiry

    if (error) {
      toast.add({
        title: "Preview Error",
        description: error.message,
        type: "error"
      })
    } else if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank", "noopener,noreferrer")
    }
  }

  const handleDelete = async (fileName: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${fileName}"? This will permanently remove the document from storage.`)
    if (!confirmDelete) return

    try {
      const { error } = await supabase.storage
        .from("resumes")
        .remove([`${userId}/${fileName}`])

      if (error) throw error

      toast.add({
        title: "Resume Deleted",
        description: "Resume document deleted successfully.",
        type: "success"
      })
      fetchResumes()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete resume"
      toast.add({
        title: "Delete Error",
        description: message,
        type: "error"
      })
    }
  }


  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-300 to-indigo-200">
            My Resume Documents
          </h2>
          <p className="text-neutral-400 text-sm mt-1">
            Your resumes are securely stored and linked to your profile for background job submissions.
          </p>
        </div>
        <div>
          <label className={`px-4 py-2.5 bg-primary hover:bg-primary/95 text-black font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}>
            {uploading ? "Uploading..." : "Upload Resume"}
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {resumes.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] border-2 border-dashed border-neutral-800/80 rounded-3xl p-8 bg-neutral-900/10 text-center">
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl mb-4 text-primary">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-neutral-200">No resumes found</h3>
          <p className="text-sm text-neutral-500 mt-1 max-w-sm">
            Please upload your resume to populate this page and match with jobs.
          </p>
          <div className="mt-6">
            <label className={`px-4 py-2.5 bg-primary hover:bg-primary/95 text-black font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}>
              {uploading ? "Uploading..." : "Upload Your Resume"}
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {resumes.map((fileRecord) => (
            <div
              key={fileRecord.id}
              className="bg-neutral-900/60 border border-neutral-800/80 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
            >
              {/* File Icon & Info */}
              <div className="flex gap-4 items-start">
                <div className="p-3.5 bg-red-950/40 border border-red-800/40 text-red-400 rounded-xl flex-shrink-0 flex items-center justify-center font-black">
                  PDF
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-neutral-100 text-[16px] break-all max-w-md">
                    {fileRecord.name}
                  </h4>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-400 font-medium">
                    <span>Uploaded: {formatDate(fileRecord.created_at || "")}</span>
                    <span>Size: {formatBytes((fileRecord.metadata as Record<string, number> | null)?.size || 0)}</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-950/60 border border-emerald-800/50 rounded-md text-[10px] font-black text-emerald-400 uppercase tracking-wider">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                      </svg>
                      Stored in Supabase Storage
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-primary/10 border border-primary/20 rounded-md text-[10px] font-black text-primary uppercase tracking-wider">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      Linked to profile
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={() => handlePreview(fileRecord.name)}
                  className="w-full sm:w-auto px-5 py-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl text-sm font-bold text-neutral-200 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Preview
                </button>
                <button
                  onClick={() => handleDelete(fileRecord.name)}
                  className="w-full sm:w-auto px-5 py-3 bg-red-950/20 hover:bg-red-950/40 border border-red-900/50 hover:border-red-800/80 rounded-xl text-sm font-bold text-red-400 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
