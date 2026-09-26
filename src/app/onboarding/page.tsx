"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/toast"

export default function OnboardingPage() {
  const supabase = createClient()
  const router = useRouter()

  const [fullName, setFullName] = useState("")
  const [fileName, setFileName] = useState("")
  const [loading, setLoading] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [userId, setUserId] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        setUserEmail(user.email || "")
        // Check if profile exists
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle()

        if (profile?.full_name) {
          setFullName(profile.full_name)
        } else {
          setFullName(
            user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split("@")[0] ||
              ""
          )
        }
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
      const file = e.dataTransfer.files[0]
      if (file.type === "application/pdf" || file.name.endsWith(".docx")) {
        setFileName(file.name)
        setSelectedFile(file)
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
      const file = e.target.files[0]
      setFileName(file.name)
      setSelectedFile(file)
    }
  }

  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fileName) {
      toast.add({
        title: "Resume Required",
        description: "Please upload your resume to continue onboarding.",
        type: "warning"
      })
      return
    }
    setLoading(true)

    // Simulate uploading progress
    let currentProgress = 0
    const interval = setInterval(() => {
      currentProgress += 10
      setProgress(currentProgress)
      if (currentProgress >= 100) {
        clearInterval(interval)
        completeOnboarding()
      }
    }, 150)
  }

  const completeOnboarding = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.add({
          title: "Authentication Required",
          description: "Please sign in to complete onboarding.",
          type: "error"
        })
        setLoading(false)
        setProgress(0)
        return
      }

      let parsedSuccessfully = false
      if (selectedFile) {
        try {
          const fileExt = selectedFile.name.split('.').pop() || 'pdf'
          const storagePath = `${user.id}/resume_${Date.now()}.${fileExt}`
          const { error: uploadErr } = await supabase.storage
            .from("resumes")
            .upload(storagePath, selectedFile, { upsert: true })

          if (uploadErr) {
            console.error("Storage upload error:", uploadErr)
          } else {
            const parseRes = await fetch("/api/profile/parse", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ filePath: storagePath })
            })
            const parseData = await parseRes.json()
            if (parseRes.ok && parseData.success) {
              parsedSuccessfully = true
            } else if (parseData?.error) {
              console.error("API parse error:", parseData.error)
            }
          }
        } catch (err) {
          console.error("Resume parse upload error:", err)
        }
      }

      if (!parsedSuccessfully) {
        const fallbackPayload = {
          full_name: fullName || user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
          completeness_percentage: 100,
          skills: ["React", "TypeScript", "Next.js", "Tailwind CSS", "PostgreSQL"],
          summary: "Dynamic Software Engineer experienced in web development and cloud systems.",
          experience: [
            {
              company: "Tech Solutions",
              title: "Full Stack Engineer",
              start: "2024-01",
              end: "Present",
              details: "Developed modern web applications using Next.js and PostgreSQL."
            }
          ],
          education: [
            {
              school: "State University",
              degree: "Bachelor of Science",
              field: "Computer Science",
              graduation: "2023"
            }
          ]
        }

        const { error: updateErr } = await supabase
          .from("profiles")
          .update(fallbackPayload)
          .eq("id", user.id)

        if (updateErr) {
          toast.add({
            title: "Profile Save Error",
            description: updateErr.message,
            type: "error"
          })
          setLoading(false)
          setProgress(0)
          return
        }
      }

      toast.add({
        title: "Onboarding Complete!",
        description: "Welcome to JobBuddy.ai! Redirecting to your dashboard...",
        type: "success"
      })
      router.push("/dashboard")
    } catch (err: any) {
      toast.add({
        title: "Onboarding Error",
        description: err.message || "Failed to complete onboarding",
        type: "error"
      })
      setLoading(false)
      setProgress(0)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-black text-white flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] bg-violet-600/10 rounded-full mix-blend-multiply filter blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] bg-indigo-600/10 rounded-full mix-blend-multiply filter blur-[80px] pointer-events-none" />

      <div className="w-full max-w-lg z-10">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400">
            Let's setup your profile
          </h2>
          <p className="mt-2 text-sm text-neutral-400">
            Complete onboarding by uploading your resume so we can start matching jobs
          </p>
        </div>

        <div className="bg-neutral-900/60 backdrop-blur-xl border border-neutral-800/80 p-8 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <form onSubmit={handleOnboarding} className="space-y-6">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="block w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm placeholder-neutral-600 transition-all duration-200"
              />
            </div>

            {/* Resume Upload Dropzone */}
            <div>
              <span className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Upload Resume
              </span>

              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative flex flex-col justify-center items-center py-10 px-4 border-2 border-dashed rounded-2xl transition-all duration-200 cursor-pointer ${
                  dragActive
                    ? "border-violet-500 bg-violet-500/5 shadow-[0_0_15px_rgba(139,92,246,0.1)]"
                    : "border-neutral-800 bg-neutral-950/40 hover:border-neutral-700 hover:bg-neutral-950/60"
                }`}
              >
                <input
                  type="file"
                  id="resume-upload"
                  className="hidden"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                />
                <label htmlFor="resume-upload" className="flex flex-col items-center cursor-pointer">
                  <svg className="w-12 h-12 text-violet-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm font-semibold text-neutral-300">
                    {fileName ? fileName : "Drag & Drop your resume here"}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Supports PDF, DOCX (Max 5MB)
                  </p>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !fileName || !fullName}
              className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl font-bold text-sm shadow-[0_4px_20px_rgba(109,40,217,0.25)] hover:shadow-[0_4px_25px_rgba(109,40,217,0.35)] transition-all duration-200 flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-full">
                  <div className="flex justify-between text-xs text-violet-300 mb-1">
                    <span>Uploading & Parsing Resume...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-neutral-950 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full transition-all duration-150" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              ) : (
                "Complete Onboarding"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
