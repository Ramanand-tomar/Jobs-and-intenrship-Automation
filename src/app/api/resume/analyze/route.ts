import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { GoogleGenAI } from "@google/genai"
import { callGeminiWithRetry, cleanGeminiErrorMessage } from "@/lib/gemini"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const { job_id } = await req.json()
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

    // Fetch job details
    const { data: job } = await supabaseAdmin
      .from("jobs")
      .select("title, company, description, tags")
      .eq("id", job_id)
      .maybeSingle()
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 })

    // Fetch user profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, summary, skills, experience, education, projects, certifications")
      .eq("id", user.id)
      .maybeSingle()
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 })

    const gemini = new GoogleGenAI({ apiKey })

    const skillsText    = (profile.skills || []).join(", ")
    const experienceText = (profile.experience || [])
      .map((e: any) => `${e.title} at ${e.company}: ${e.description || ""}`)
      .join("\n")
    const jobDescription = `${job.title} at ${job.company}\n\n${job.description || ""}\nTags: ${(job.tags || []).join(", ")}`

    const prompt = `You are a professional ATS (Applicant Tracking System) resume analyst.

Analyze this candidate's profile against the job description and return a JSON object.

CANDIDATE PROFILE:
- Skills: ${skillsText}
- Experience: ${experienceText}
- Summary: ${profile.summary || ""}

JOB DESCRIPTION:
${jobDescription.slice(0, 8000)}

Return JSON with these exact fields:
- ats_score: integer 0-100 (how well the resume matches the ATS requirements)
- keyword_matches: string[] (important JD keywords present in the candidate's profile)
- missing_keywords: string[] (important JD keywords NOT found in profile — max 10)
- gap_analysis: string (2-3 sentence summary of main gaps)
- recommendations: string[] (3-5 specific actionable recommendations to improve ATS score)`

    const response = await callGeminiWithRetry(gemini, {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            ats_score:        { type: "INTEGER" },
            keyword_matches:  { type: "ARRAY", items: { type: "STRING" } },
            missing_keywords: { type: "ARRAY", items: { type: "STRING" } },
            gap_analysis:     { type: "STRING" },
            recommendations:  { type: "ARRAY", items: { type: "STRING" } },
          },
          required: ["ats_score", "keyword_matches", "missing_keywords", "gap_analysis", "recommendations"],
        },
      },
    })

    const raw = response.candidates?.[0]?.content?.parts?.[0]?.text || "{}"
    const analysis = JSON.parse(raw)

    return NextResponse.json({ success: true, ...analysis })
  } catch (err: any) {
    console.error("Resume analyze error:", err)
    const cleanMsg = cleanGeminiErrorMessage(err)
    return NextResponse.json({ error: cleanMsg }, { status: 500 })
  }
}
