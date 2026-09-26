"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/toast"
import AvatarUpload from "@/components/avatar-upload"
import ConfirmDialog from "@/components/confirm-dialog"
import { validatePhone, validateURL } from "@/lib/validation"

export default function ProfilePage() {
  const supabase = createClient()

  const [activeSubTab, setActiveSubTab] = useState("personal")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [userId, setUserId] = useState("")

  // Profile Form States
  const [fullName, setFullName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [jobTitle, setJobTitle] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [location, setLocation] = useState("")
  const [bio, setBio] = useState("")
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const [githubUrl, setGithubUrl] = useState("")
  const [summary, setSummary] = useState("")
  const [skills, setSkills] = useState<string[]>([])
  const [skillsCategorized, setSkillsCategorized] = useState<Record<string, string[]>>({})
  const [newSkill, setNewSkill] = useState("")
  
  // JSONB Array states
  const [experience, setExperience] = useState<Array<{
    company: string
    title: string
    start: string
    end: string
    location?: string
    employment_type?: string
    details: string
    metrics?: {
      revenue?: string
      users?: string
      performance_improvement?: string
      team_size?: string
      budget?: string
    }
  }>>([])

  const [education, setEducation] = useState<Array<{ school: string; degree: string; field?: string; graduation?: string; year?: string; details?: string; cgpa?: string }>>([])
  const [projects, setProjects] = useState<Array<{ title: string; tech: string[]; description: string; link: string }>>([])
  const [certifications, setCertifications] = useState<string[]>([])
  const [newCert, setNewCert] = useState("")

  const [awards, setAwards] = useState<Array<{ title: string; issuer: string; date: string; description?: string }>>([])
  const [publications, setPublications] = useState<Array<{ title: string; venue: string; date: string; url?: string }>>([])

  // Destructive Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    description: string
    onConfirm: () => void
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  })

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle()

        if (profile) {
          setFullName(profile.full_name || "")
          setAvatarUrl(profile.avatar_url || null)
          setJobTitle(profile.title || "")
          setEmail(profile.email || user.email || "")
          setPhone(profile.phone || "")
          setLocation(profile.location || "")
          setBio(profile.bio || "")
          setWebsiteUrl(profile.website_url || "")
          setLinkedinUrl(profile.linkedin_url || "")
          setGithubUrl(profile.github_url || "")
          setSummary(profile.summary || "")
          setSkills(profile.skills || [])
          setSkillsCategorized((profile.skills_categorized as Record<string, string[]>) || {})
          setExperience((profile.experience as any) || [])
          setEducation((profile.education as any) || [])
          setProjects((profile.projects as any) || [])
          setCertifications(profile.certifications || [])
          setAwards((profile.awards as any) || [])
          setPublications((profile.publications as any) || [])
        }
      }
      setLoading(false)
    }
    fetchProfile()
  }, [])

  // Calculate completeness dynamically
  const calculateCompleteness = () => {
    let score = 0
    if (fullName.trim()) score += 15
    if (email.trim()) score += 10
    if (phone.trim() && validatePhone(phone)) score += 10
    if (summary.trim()) score += 15
    if (skills.length > 0) score += 15
    if (experience.length > 0) score += 15
    if (education.length > 0) score += 10
    if (
      projects.length > 0 ||
      githubUrl.trim() ||
      linkedinUrl.trim() ||
      websiteUrl.trim() ||
      avatarUrl
    ) {
      score += 10
    }
    return score
  }

  const completeness = calculateCompleteness()

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveSuccess(false)

    // Form Validations
    if (phone.trim() && !validatePhone(phone)) {
      toast.add({
        title: "Invalid Phone Format",
        description: "Please enter a valid phone number (e.g. +1 555-0199).",
        type: "error",
      })
      setSaving(false)
      return
    }

    if (linkedinUrl.trim() && !validateURL(linkedinUrl)) {
      toast.add({
        title: "Invalid LinkedIn URL",
        description: "Please enter a valid web URL for LinkedIn.",
        type: "error",
      })
      setSaving(false)
      return
    }

    if (githubUrl.trim() && !validateURL(githubUrl)) {
      toast.add({
        title: "Invalid GitHub URL",
        description: "Please enter a valid web URL for GitHub.",
        type: "error",
      })
      setSaving(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from("profiles").update({
      full_name: fullName,
      avatar_url: avatarUrl,
      title: jobTitle,
      phone,
      location,
      bio,
      website_url: websiteUrl,
      linkedin_url: linkedinUrl,
      github_url: githubUrl,
      summary,
      skills,
      skills_categorized: skillsCategorized,
      experience,
      education,
      projects,
      certifications,
      awards,
      publications,
      completeness_percentage: completeness,
      updated_at: new Date().toISOString()
    }).eq("id", user.id)

    setSaving(false)
    if (error) {
      toast.add({
        title: "Error Saving Profile",
        description: error.message,
        type: "error"
      })
    } else {
      setSaveSuccess(true)
      toast.add({
        title: "Profile Saved",
        description: "Your candidate profile has been updated successfully.",
        type: "success"
      })
      setTimeout(() => setSaveSuccess(false), 2000)
    }
  }

  // Experience Handlers
  const addExperience = () => {
    setExperience([...experience, { company: "", title: "", start: "", end: "", details: "" }])
  }
  const updateExperience = (index: number, key: string, value: string) => {
    const updated = [...experience]
    ;(updated[index] as any)[key] = value
    setExperience(updated)
  }
  const updateExperienceMetric = (index: number, metricKey: string, value: string) => {
    const updated = [...experience]
    const currentMetrics = updated[index].metrics || {}
    updated[index].metrics = { ...currentMetrics, [metricKey]: value }
    setExperience(updated)
  }
  const removeExperience = (index: number) => {
    setConfirmDialog({
      isOpen: true,
      title: "Remove Work Experience?",
      description: "Are you sure you want to remove this experience entry?",
      onConfirm: () => {
        setExperience(experience.filter((_, i) => i !== index))
        setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  // Education Handlers
  const addEducation = () => {
    setEducation([...education, { school: "", degree: "", field: "", graduation: "" }])
  }
  const updateEducation = (index: number, key: string, value: string) => {
    const updated = [...education]
    ;(updated[index] as unknown as Record<string, string>)[key] = value
    setEducation(updated)
  }
  const removeEducation = (index: number) => {
    setConfirmDialog({
      isOpen: true,
      title: "Remove Education Entry?",
      description: "Are you sure you want to remove this education entry?",
      onConfirm: () => {
        setEducation(education.filter((_, i) => i !== index))
        setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  // Project Handlers
  const addProject = () => {
    setProjects([...projects, { title: "", tech: [], description: "", link: "" }])
  }
  const updateProject = (index: number, key: string, value: unknown) => {
    const updated = [...projects]
    ;(updated[index] as unknown as Record<string, unknown>)[key] = value
    setProjects(updated)
  }
  const addProjectTech = (projectIndex: number, techTag: string) => {
    if (!techTag.trim()) return
    const updated = [...projects]
    const currentTech = updated[projectIndex].tech || []
    if (!currentTech.includes(techTag.trim())) {
      updated[projectIndex].tech = [...currentTech, techTag.trim()]
      setProjects(updated)
    }
  }
  const removeProjectTech = (projectIndex: number, techTag: string) => {
    const updated = [...projects]
    updated[projectIndex].tech = (updated[projectIndex].tech || []).filter(t => t !== techTag)
    setProjects(updated)
  }
  const removeProject = (index: number) => {
    setConfirmDialog({
      isOpen: true,
      title: "Remove Project?",
      description: "Are you sure you want to remove this project entry?",
      onConfirm: () => {
        setProjects(projects.filter((_, i) => i !== index))
        setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  // Skills handlers
  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill("")
    }
  }
  const removeSkill = (target: string | number) => {
    if (typeof target === "number") {
      setSkills(skills.filter((_, i) => i !== target))
    } else {
      setSkills(skills.filter(s => s !== target))
    }
  }

  // Certifications handlers
  const addCert = () => {
    if (newCert.trim() && !certifications.includes(newCert.trim())) {
      setCertifications([...certifications, newCert.trim()])
      setNewCert("")
    }
  }
  const removeCert = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-neutral-900/60 border border-neutral-800 rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-neutral-900/60 border border-neutral-800 rounded-2xl" />
          <div className="h-80 bg-neutral-900/60 border border-neutral-800 rounded-2xl" />
        </div>
      </div>
    )
  }

  const subTabs = [
    {
      id: "personal",
      label: "Profile",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      id: "skills",
      label: "Skills",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      )
    },
    {
      id: "work",
      label: "Work Exp.",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: "education",
      label: "Education",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
        </svg>
      )
    },
    {
      id: "other",
      label: "Other",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      )
    }
  ]

  const checklistItems = [
    { label: "Personal Details", isDone: !!fullName.trim() && !!phone.trim(), tab: "personal" },
    { label: "Professional Summary", isDone: !!summary.trim(), tab: "personal" },
    { label: "Skills Tagging", isDone: skills.length > 0, tab: "skills" },
    { label: "Work Experience", isDone: experience.length > 0, tab: "work" },
    { label: "Education Log", isDone: education.length > 0, tab: "education" },
    { label: "URLs / Projects", isDone: projects.length > 0 || !!githubUrl.trim() || !!linkedinUrl.trim(), tab: "other" }
  ]

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-300 to-indigo-200">
            My Professional Profile
          </h2>
          <p className="text-neutral-400 text-sm mt-1">
            Keep your details up-to-date. This profile will autofill job application fields.
          </p>
        </div>

        {saveSuccess && (
          <span className="self-start sm:self-auto px-4 py-2 bg-emerald-950/60 border border-emerald-800/50 rounded-xl text-emerald-400 text-sm font-semibold flex items-center gap-2 animate-bounce">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
            </svg>
            Changes Saved!
          </span>
        )}
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Form area (Left 3 columns) */}
        <form onSubmit={handleSave} className="lg:col-span-3 space-y-6">
          {/* Navigation Tabs */}
          <div className="flex border-b border-neutral-800 gap-2 mb-2 overflow-x-auto pb-1 scrollbar-thin">
            {subTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 font-bold text-sm transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                  activeSubTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-neutral-400 hover:text-white"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Contents */}
          <div className="bg-neutral-900/60 border border-neutral-800/80 p-6 rounded-2xl shadow-xl min-h-[45vh]">
            {/* PERSONAL INFO */}
            {activeSubTab === "personal" && (
              <div className="space-y-6">
                {/* Avatar Upload */}
                <div className="pb-4 border-b border-neutral-800">
                  <AvatarUpload
                    userId={userId}
                    currentAvatarUrl={avatarUrl}
                    fullName={fullName}
                    onAvatarChange={(newUrl) => setAvatarUrl(newUrl)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="block w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm placeholder-neutral-600 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                      Target Job Title
                    </label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. Senior Full Stack Engineer"
                      className="block w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm placeholder-neutral-600 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      disabled
                      value={email}
                      className="block w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-neutral-500 opacity-60 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 234 567 890"
                      className="block w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm placeholder-neutral-600 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                      Preferred Location
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Remote, San Francisco"
                      className="block w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm placeholder-neutral-600 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                      Personal Website / Portfolio
                    </label>
                    <input
                      type="text"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://yourportfolio.com"
                      className="block w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm placeholder-neutral-600 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    Short Bio
                  </label>
                  <input
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Brief 1-sentence headline bio for recruiter profiles..."
                    className="block w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm placeholder-neutral-600 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    Professional Summary
                  </label>
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    rows={5}
                    placeholder="Tell us about yourself..."
                    className="block w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm placeholder-neutral-600 transition-all resize-none"
                  />
                </div>
              </div>
            )}

            {/* SKILLS */}
            {activeSubTab === "skills" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    Add Skill Tag
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="e.g. Docker, Python, Figma"
                      className="block w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm placeholder-neutral-600 transition-all"
                    />
                    <button
                      type="button"
                      onClick={addSkill}
                      className="px-5 py-3 bg-primary text-black font-bold text-sm rounded-xl cursor-pointer hover:bg-primary/95 transition-all"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                    Current Skills
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {skills.length === 0 ? (
                      <p className="text-neutral-500 text-sm">No skills added yet.</p>
                    ) : (
                      skills.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-300 font-medium group hover:border-red-800 transition-all"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(index)}
                            className="text-neutral-500 hover:text-red-400 cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* WORK EXPERIENCE */}
            {activeSubTab === "work" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Work History
                  </span>
                  <button
                    type="button"
                    onClick={addExperience}
                    className="text-primary text-sm font-bold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Experience
                  </button>
                </div>

                {experience.length === 0 ? (
                  <div className="text-center py-10 text-neutral-500 text-sm border-2 border-dashed border-neutral-800/40 rounded-xl">
                    No work experience entries added.
                  </div>
                ) : (
                  <div className="space-y-5">
                    {experience.map((exp, index) => (
                      <div key={index} className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl relative space-y-4">
                        <button
                          type="button"
                          onClick={() => removeExperience(index)}
                          className="absolute top-4 right-4 p-1 text-neutral-500 hover:text-red-400 hover:bg-neutral-900 rounded-lg cursor-pointer transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-semibold text-neutral-500 uppercase mb-1">
                              Company
                            </label>
                            <input
                              type="text"
                              required
                              value={exp.company || ""}
                              onChange={(e) => updateExperience(index, "company", e.target.value)}
                              className="block w-full px-3 py-2 bg-neutral-900 border border-neutral-850 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-neutral-500 uppercase mb-1">
                              Job Title
                            </label>
                            <input
                              type="text"
                              required
                              value={exp.title || ""}
                              onChange={(e) => updateExperience(index, "title", e.target.value)}
                              className="block w-full px-3 py-2 bg-neutral-900 border border-neutral-850 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent text-sm"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-semibold text-neutral-500 uppercase mb-1">
                              Start Date / Period
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Jan 2023"
                              value={exp.start || ""}
                              onChange={(e) => updateExperience(index, "start", e.target.value)}
                              className="block w-full px-3 py-2 bg-neutral-900 border border-neutral-850 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-neutral-500 uppercase mb-1">
                              End Date
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Present"
                              value={exp.end || ""}
                              onChange={(e) => updateExperience(index, "end", e.target.value)}
                              className="block w-full px-3 py-2 bg-neutral-900 border border-neutral-850 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-500 uppercase mb-1">
                            Details & Key Responsibilities
                          </label>
                          <textarea
                            rows={3}
                            value={exp.details || ""}
                            onChange={(e) => updateExperience(index, "details", e.target.value)}
                            className="block w-full px-3 py-2 bg-neutral-900 border border-neutral-850 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent text-sm resize-none"
                          />
                        </div>

                        {/* Explicit Quantified Metrics (Zero-Hallucination Source) */}
                        <div className="pt-2 border-t border-neutral-900">
                          <span className="block text-[11px] font-bold text-primary uppercase tracking-wider mb-2">
                            Verified Metrics (Zero-Hallucination Source Data)
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[10px] text-neutral-400 mb-1">Performance Gain %</label>
                              <input
                                type="text"
                                placeholder="e.g. 40% latency drop"
                                value={exp.metrics?.performance_improvement || ""}
                                onChange={(e) => updateExperienceMetric(index, "performance_improvement", e.target.value)}
                                className="block w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-neutral-400 mb-1">Team / User Scale</label>
                              <input
                                type="text"
                                placeholder="e.g. 500k active users"
                                value={exp.metrics?.users || ""}
                                onChange={(e) => updateExperienceMetric(index, "users", e.target.value)}
                                className="block w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-neutral-400 mb-1">Revenue / Business Impact</label>
                              <input
                                type="text"
                                placeholder="e.g. $2.4M ARR increase"
                                value={exp.metrics?.revenue || ""}
                                onChange={(e) => updateExperienceMetric(index, "revenue", e.target.value)}
                                className="block w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* EDUCATION */}
            {activeSubTab === "education" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Education Background
                  </span>
                  <button
                    type="button"
                    onClick={addEducation}
                    className="text-primary text-sm font-bold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Education
                  </button>
                </div>

                {education.length === 0 ? (
                  <div className="text-center py-10 text-neutral-500 text-sm border-2 border-dashed border-neutral-800/40 rounded-xl">
                    No education entries added.
                  </div>
                ) : (
                  <div className="space-y-5">
                    {education.map((edu, index) => (
                      <div key={index} className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl relative space-y-4">
                        <button
                          type="button"
                          onClick={() => removeEducation(index)}
                          className="absolute top-4 right-4 p-1 text-neutral-500 hover:text-red-400 hover:bg-neutral-900 rounded-lg cursor-pointer transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-semibold text-neutral-500 uppercase mb-1">
                              School / University
                            </label>
                            <input
                              type="text"
                              required
                              value={edu.school || ""}
                              onChange={(e) => updateEducation(index, "school", e.target.value)}
                              className="block w-full px-3 py-2 bg-neutral-900 border border-neutral-850 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-neutral-500 uppercase mb-1">
                              Degree / Certificate
                            </label>
                            <input
                              type="text"
                              required
                              value={edu.degree || ""}
                              onChange={(e) => updateEducation(index, "degree", e.target.value)}
                              className="block w-full px-3 py-2 bg-neutral-900 border border-neutral-850 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent text-sm"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[11px] font-semibold text-neutral-500 uppercase mb-1">
                              Field of Study
                            </label>
                            <input
                              type="text"
                              value={edu.field || ""}
                              onChange={(e) => updateEducation(index, "field", e.target.value)}
                              placeholder="Computer Science"
                              className="block w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-neutral-500 uppercase mb-1">
                              Graduation Year / Date
                            </label>
                            <input
                              type="text"
                              value={edu.graduation || ""}
                              onChange={(e) => updateEducation(index, "graduation", e.target.value)}
                              placeholder="Jul 2023 - Jun 2027"
                              className="block w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-neutral-500 uppercase mb-1">
                              CGPA / Marks
                            </label>
                            <input
                              type="text"
                              value={edu.cgpa || ""}
                              onChange={(e) => updateEducation(index, "cgpa", e.target.value)}
                              placeholder="8.32 or 85%"
                              className="block w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* OTHER DETAILS */}
            {activeSubTab === "other" && (
              <div className="space-y-6">
                {/* URLs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 border-b border-neutral-800 pb-6">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                      GitHub URL
                    </label>
                    <input
                      type="text"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/..."
                      className="block w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm placeholder-neutral-600 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                      LinkedIn URL
                    </label>
                    <input
                      type="text"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                      className="block w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm placeholder-neutral-600 transition-all"
                    />
                  </div>
                </div>

                {/* Projects */}
                <div className="border-b border-neutral-800 pb-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Projects
                    </span>
                    <button
                      type="button"
                      onClick={addProject}
                      className="text-primary text-sm font-bold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Add Project
                    </button>
                  </div>

                  {projects.length === 0 ? (
                    <p className="text-neutral-500 text-sm">No projects listed.</p>
                  ) : (
                    <div className="space-y-4">
                      {projects.map((proj, index) => (
                        <div key={index} className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl relative space-y-3">
                          <button
                            type="button"
                            onClick={() => removeProject(index)}
                            className="absolute top-4 right-4 p-1 text-neutral-500 hover:text-red-400 hover:bg-neutral-900 rounded-lg cursor-pointer"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[11px] font-semibold text-neutral-500 uppercase mb-1">
                                Project Title
                              </label>
                              <input
                                type="text"
                                required
                                value={proj.title || ""}
                                onChange={(e) => updateProject(index, "title", e.target.value)}
                                className="block w-full px-3 py-2 bg-neutral-900 border border-neutral-850 rounded-lg text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-neutral-500 uppercase mb-1">
                                Project Link
                              </label>
                              <input
                                type="text"
                                value={proj.link || ""}
                                onChange={(e) => updateProject(index, "link", e.target.value)}
                                className="block w-full px-3 py-2 bg-neutral-900 border border-neutral-850 rounded-lg text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-neutral-500 uppercase mb-1">
                              Description
                            </label>
                            <textarea
                              rows={2}
                              value={proj.description || ""}
                              onChange={(e) => updateProject(index, "description", e.target.value)}
                              className="block w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm resize-none"
                            />
                          </div>

                          {/* Tech Stack management */}
                          <div>
                            <label className="block text-[11px] font-semibold text-neutral-500 uppercase mb-1">
                              Technologies Used
                            </label>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {proj.tech?.map((t) => (
                                <span
                                  key={t}
                                  className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-neutral-900 border border-neutral-800 rounded-md text-xs font-semibold text-neutral-300"
                                >
                                  {t}
                                  <button
                                    type="button"
                                    onClick={() => removeProjectTech(index, t)}
                                    className="text-neutral-500 hover:text-red-400 font-bold ml-0.5"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                id={`proj-tech-${index}`}
                                placeholder="Add tech (e.g. Next.js, PostgreSQL)"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault()
                                    addProjectTech(index, (e.target as HTMLInputElement).value)
                                    ;(e.target as HTMLInputElement).value = ""
                                  }
                                }}
                                className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs w-full text-neutral-200"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Certifications */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                      Add Certification
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCert}
                        onChange={(e) => setNewCert(e.target.value)}
                        placeholder="e.g. AWS Certified Solutions Architect"
                        className="block w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl focus:outline-none text-sm placeholder-neutral-600"
                      />
                      <button
                        type="button"
                        onClick={addCert}
                        className="px-5 py-3 bg-primary text-black font-bold text-sm rounded-xl cursor-pointer hover:bg-primary/95"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                      Certifications List
                    </label>
                    <div className="space-y-2">
                      {certifications.length === 0 ? (
                        <p className="text-neutral-500 text-sm">No certifications listed.</p>
                      ) : (
                        certifications.map((cert, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-neutral-300"
                          >
                            <span>{cert}</span>
                            <button
                              type="button"
                              onClick={() => removeCert(index)}
                              className="text-neutral-500 hover:text-red-400 cursor-pointer"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action controls */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-primary hover:bg-primary/90 text-black font-bold text-base rounded-xl shadow-[0_4px_20px_rgba(172,244,23,0.25)] transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-black" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>

        {/* Circular Progress Completeness Sidebar Card (Right 1 column) */}
        <div className="space-y-6">
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

            <p className="text-xs text-neutral-400 font-medium px-2 leading-relaxed">
              Complete your profile to increase automated application accuracy.
            </p>

            {/* Checklist items */}
            <div className="w-full border-t border-neutral-850 mt-5 pt-4 space-y-2.5 text-left">
              {checklistItems.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveSubTab(item.tab)}
                  className="w-full flex items-center justify-between text-xs text-neutral-400 hover:text-neutral-200 transition-colors group cursor-pointer"
                >
                  <span className="font-medium group-hover:underline">{item.label}</span>
                  {item.isDone ? (
                    <span className="text-primary font-bold">✓</span>
                  ) : (
                    <span className="text-red-500/80 font-bold">✗</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Destructive Removes */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
