import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { GoogleGenAI } from "@google/genai"
import { generateATSResumePDF, ResumeData } from "@/lib/resume-pdf-generator"
import { callGeminiWithRetry, cleanGeminiErrorMessage } from "@/lib/gemini"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const { job_id, application_id } = await req.json()
    if (!job_id) return NextResponse.json({ error: "job_id is required" }, { status: 400 })

    // Authenticate user
    const authHeader = req.headers.get("authorization") || ""
    const token = authHeader.replace("Bearer ", "")
    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Fetch job
    const { data: job } = await supabaseAdmin
      .from("jobs")
      .select("title, company, description, tags")
      .eq("id", job_id)
      .maybeSingle()
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 })

    // Fetch profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

    // ── STRICT PROFILE VALIDATION ────────────────────────────
    const validationErrors: string[] = []
    if (!profile.full_name?.trim()) validationErrors.push("Full name is required in your profile")
    if (!profile.email?.trim()) validationErrors.push("Email is required in your profile")
    if (!(profile.skills && profile.skills.length > 0)) validationErrors.push("At least one skill is required in your profile")
    if (!(profile.experience && profile.experience.length > 0)) validationErrors.push("At least one work experience entry is required in your profile")

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: `Incomplete Profile: ${validationErrors.join("; ")}. Please complete your profile before generating tailored resumes.` },
        { status: 400 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 })
    const gemini = new GoogleGenAI({ apiKey })

    const warnings: string[] = []
    if (!profile.phone?.trim()) warnings.push("Phone number missing from profile — omitted from contact header.")
    if (!profile.location?.trim()) warnings.push("Location missing from profile.")
    if (!profile.linkedin_url?.trim()) warnings.push("LinkedIn URL missing from profile.")

    const skillsText = (profile.skills || []).join(", ")
    const skillsCategorizedText = profile.skills_categorized
      ? JSON.stringify(profile.skills_categorized, null, 2)
      : "Not explicitly categorized yet"

    const experienceText = (profile.experience || [])
      .map((e: any, i: number) => {
        const metricsStr = e.metrics ? ` | Explicit Metrics: ${JSON.stringify(e.metrics)}` : ""
        return `[Experience ${i + 1}] Role: ${e.title || "Software Engineer"} | Company: ${e.company || "Company"} | Dates: ${e.start || e.start_date || ""} - ${e.end || e.end_date || "Present"} | Location: ${e.location || ""}${metricsStr}\nDetails: ${e.details || e.description || (e.bullets ? e.bullets.join("; ") : "")}`
      })
      .join("\n\n")

    const projectsText = (profile.projects || [])
      .map((p: any, i: number) => {
        const metricsStr = p.metrics ? ` | Explicit Metrics: ${JSON.stringify(p.metrics)}` : ""
        return `[Project ${i + 1}] Name: ${p.title || p.name || "Project"} | Tech: ${(p.tech || p.technologies || []).join(", ")} | Link: ${p.link || p.url || p.github_url || ""}${metricsStr}\nDescription: ${p.description || ""}`
      })
      .join("\n\n")

    const educationText = (profile.education || [])
      .map((e: any) => `${e.degree || "Degree"} in ${e.field || e.field_of_study || "Field"} at ${e.school || e.institution || "University"} (${e.graduation || e.year || ""})`)
      .join("\n")

    const jobDescription = `${job.title} at ${job.company}\n\n${job.description || ""}\nTags: ${(job.tags || []).join(", ")}`

    // ── ZERO-HALLUCINATION PROMPT ─────────────────────────────
    const tailorPrompt = `You are an executive resume editor specializing in FAANG-level ATS optimization. Your absolute priority is factual accuracy — NEVER invent metrics, percentages, dates, company names, or achievements not explicitly present in the candidate profile source data.

CANDIDATE PROFILE (STRICT SOURCE OF TRUTH):
Full Name: ${profile.full_name}
Target Role / Headline: ${profile.title || profile.bio || job.title}
Contact: Email: ${profile.email} | Phone: ${profile.phone || "N/A"} | Location: ${profile.location || "N/A"}
Links: LinkedIn: ${profile.linkedin_url || "N/A"} | GitHub: ${profile.github_url || "N/A"} | Portfolio: ${profile.website_url || "N/A"}

Professional Summary: ${profile.summary || "N/A"}

Skills (Flat): ${skillsText}
Categorized Skills: ${skillsCategorizedText}

Work Experience:
${experienceText}

Projects:
${projectsText}

Education:
${educationText}

Certifications & Achievements: ${(profile.certifications || []).join(", ")}
Awards: ${JSON.stringify(profile.awards || [])}

TARGET JOB DESCRIPTION:
${jobDescription.slice(0, 6000)}

STRICT RULES (ZERO HALLUCINATION):
1. Headline: Create a concise professional headline (max 80 chars) reflecting actual experience relevant to the job.
2. Skills Categorization: Group candidate's ACTUAL skills into standard categories ("Programming Languages", "Frameworks & Libraries", "Databases", "Tools & Platforms"). Do NOT invent new skills not in candidate profile, and do NOT categorize spoken human languages (e.g. English, Hindi) into technical skills.
3. Experience Bullets: Rewrite bullet points using strong STAR/XYZ action verbs. IF AND ONLY IF explicit metrics/numbers exist in candidate source data, include them. DO NOT fabricate percentages (e.g. "reduced latency by 40%") or metrics if not provided.
4. Projects: Retain exact project names and tech stack. Format description as concise bullet points.
5. Education: Retain exact institution names, degrees, and dates.
6. Links & URLs: DO NOT output generic domain placeholders (e.g. "github.com", "linkedin.com", "portfolio.com"). Leave URLs empty unless complete candidate profile URLs exist.
7. Calculate ATS match score (0-100) based strictly on keyword overlap.

Return ONLY valid JSON matching the schema.`

    const tailorResponse = await callGeminiWithRetry(gemini, {
      contents: [{ role: "user", parts: [{ text: tailorPrompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          required: ["ats_score", "headline", "skills_categorized", "tailored_experience"],
          properties: {
            ats_score: { type: "INTEGER" },
            headline: { type: "STRING" },
            keyword_matches: { type: "ARRAY", items: { type: "STRING" } },
            missing_keywords: { type: "ARRAY", items: { type: "STRING" } },
            tailored_summary: { type: "STRING" },
            skills_categorized: {
              type: "OBJECT",
              additionalProperties: {
                type: "ARRAY",
                items: { type: "STRING" }
              }
            },
            tailored_experience: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                required: ["title", "company", "bullets"],
                properties: {
                  title: { type: "STRING" },
                  company: { type: "STRING" },
                  role_type: { type: "STRING" },
                  start_date: { type: "STRING" },
                  end_date: { type: "STRING" },
                  location: { type: "STRING" },
                  bullets: { type: "ARRAY", items: { type: "STRING" } },
                  tech_used: { type: "ARRAY", items: { type: "STRING" } },
                },
              },
            },
            tailored_projects: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  name: { type: "STRING" },
                  role_type: { type: "STRING" },
                  start_date: { type: "STRING" },
                  end_date: { type: "STRING" },
                  bullets: { type: "ARRAY", items: { type: "STRING" } },
                  tech_used: { type: "ARRAY", items: { type: "STRING" } },
                  github_url: { type: "STRING" },
                  live_url: { type: "STRING" },
                },
              },
            },
            education: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  degree: { type: "STRING" },
                  institution: { type: "STRING" },
                  year: { type: "STRING" },
                  field_of_study: { type: "STRING" },
                  cgpa_marks: { type: "STRING" },
                },
              },
            },
            awards: { type: "ARRAY", items: { type: "STRING" } },
          },
        },
      },
    })

    const raw = tailorResponse.candidates?.[0]?.content?.parts?.[0]?.text || "{}"
    const tailored = JSON.parse(raw)

    // ── STRICT PROFILE-FIRST MERGING ENGINE ──────────────────
    // 1. Projects Merge
    const profileProjects = profile.projects || []
    const tailoredProjects = tailored.tailored_projects || []
    const finalProjects: any[] = []

    if (profileProjects.length > 0) {
      for (let i = 0; i < profileProjects.length; i++) {
        const p = profileProjects[i]
        const tp = tailoredProjects[i] || {}
        const pName = p.title || p.name || tp.name || `Project ${i + 1}`

        finalProjects.push({
          title: pName,
          name: pName,
          role: p.role || tp.role_type || "",
          start_date: p.start_date || p.start || tp.start_date || "",
          end_date: p.end_date || p.end || tp.end_date || "",
          description: tp.bullets?.length ? tp.bullets.join("\n") : (p.description || ""),
          bullets: tp.bullets?.length ? tp.bullets : (p.description ? [p.description] : []),
          techUsed: p.tech || p.technologies || tp.tech_used || [],
          githubUrl: p.github_url || p.link || p.url || tp.github_url || "",
          liveUrl: p.live_url || p.live || tp.live_url || "",
        })
      }
    }

    // 2. Experience Merge
    const profileExp = profile.experience || []
    const tailoredExp = tailored.tailored_experience || []
    const finalExperience: any[] = []

    for (let i = 0; i < profileExp.length; i++) {
      const exp = profileExp[i]
      const te = tailoredExp[i] || {}

      const title = exp.title || te.title || "Software Engineer"
      const company = exp.company || te.company || "Company"

      finalExperience.push({
        title,
        company,
        employment_type: exp.employment_type || exp.role_type || te.role_type || "",
        startDate: exp.start || exp.start_date || te.start_date || "",
        endDate: exp.end || exp.end_date || te.end_date || "Present",
        location: exp.location || profile.location || te.location || "",
        description: te.bullets?.length ? te.bullets.join("\n") : (exp.details || exp.description || ""),
        bullets: te.bullets?.length ? te.bullets : (exp.details ? [exp.details] : []),
        techUsed: te.tech_used?.length ? te.tech_used : (exp.tech || exp.technologies || []),
      })
    }

    // 3. Education Merge
    const profileEdu = profile.education || []
    const tailoredEdu = tailored.education || []
    const finalEducation = profileEdu.length > 0
      ? profileEdu.map((e: any, i: number) => {
          const te = tailoredEdu[i] || {}
          return {
            degree: e.degree || te.degree || "Degree",
            institution: e.school || e.institution || te.institution || "University",
            school: e.school || e.institution || te.institution,
            year: e.graduation || e.year || te.year || "",
            fieldOfStudy: e.field || e.field_of_study || te.field_of_study || "",
          }
        })
      : tailoredEdu.map((te: any) => ({
          degree: te.degree || "Degree",
          institution: te.institution || "University",
          year: te.year || "",
          fieldOfStudy: te.field_of_study || "",
        }))

    // 4. Categorized Skills
    const categorizedSkills = (tailored.skills_categorized && Object.keys(tailored.skills_categorized).length > 0)
      ? tailored.skills_categorized
      : (profile.skills_categorized || { "Technical Skills": profile.skills || [] })

    // 5. Awards & Certifications
    const awardsList = Array.from(new Set([
      ...(profile.awards?.map((a: any) => typeof a === 'string' ? a : a.title) || []),
      ...(profile.certifications || []),
      ...(tailored.awards || []),
    ]))

    // ── STEP 2: Generate PDF via React-PDF Engine ─────────────
    const resumeData: ResumeData = {
      fullName: profile.full_name,
      headline: tailored.headline || profile.title || `${job.title} Specialist`,
      email: profile.email,
      phone: profile.phone || "",
      location: profile.location || "",
      linkedinUrl: profile.linkedin_url || "",
      githubUrl: profile.github_url || "",
      portfolioUrl: profile.website_url || "",

      summary: tailored.tailored_summary || profile.summary || "",
      skillsCategorized: categorizedSkills,
      skills: profile.skills || [],

      experience: finalExperience,
      projects: finalProjects,
      education: finalEducation,

      certifications: profile.certifications || [],
      awards: awardsList,
      publications: profile.publications || [],
    }

    const pdfBytes = await generateATSResumePDF(resumeData)

    // ── STEP 3: Upload PDF to Supabase Storage ──────────────
    const timestamp = Date.now()
    const storagePath = `${user.id}/tailored_${job_id}_${timestamp}.pdf`

    const { error: uploadError } = await supabaseAdmin.storage
      .from("resumes")
      .upload(storagePath, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      })

    if (uploadError) {
      console.error("PDF upload failed:", uploadError)
    }

    // ── STEP 4: Save resume_versions record ────────────────
    const { data: versionRecord, error: insertError } = await supabaseAdmin
      .from("resume_versions")
      .insert({
        user_id: user.id,
        job_id,
        application_id: application_id || null,
        ats_score: tailored.ats_score || 0,
        keyword_matches: tailored.keyword_matches || [],
        missing_keywords: tailored.missing_keywords || [],
        tailored_summary: tailored.tailored_summary,
        tailored_skills: categorizedSkills,
        tailored_bullets: finalExperience,
        pdf_storage_path: uploadError ? null : storagePath,
      })
      .select("id")
      .maybeSingle()

    if (insertError) console.error("resume_versions insert error:", insertError)

    // Generate signed download URL
    let downloadUrl: string | null = null
    if (!uploadError) {
      const { data: signed } = await supabaseAdmin.storage
        .from("resumes")
        .createSignedUrl(storagePath, 60 * 60)
      downloadUrl = signed?.signedUrl || null
    }

    return NextResponse.json({
      success: true,
      version_id: versionRecord?.id || null,
      ats_score: tailored.ats_score,
      keyword_matches: tailored.keyword_matches || [],
      missing_keywords: tailored.missing_keywords || [],
      tailored_summary: tailored.tailored_summary,
      skills_categorized: categorizedSkills,
      pdf_storage_path: uploadError ? null : storagePath,
      download_url: downloadUrl,
      warnings,
    })
  } catch (err: any) {
    console.error("Resume tailor error:", err)
    const cleanMsg = cleanGeminiErrorMessage(err)
    return NextResponse.json({ error: cleanMsg }, { status: 500 })
  }
}
