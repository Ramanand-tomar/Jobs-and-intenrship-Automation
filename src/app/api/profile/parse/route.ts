import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { parseResume } from "@/lib/gemini"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(request: NextRequest) {
  try {
    const supabaseUser = await createServerClient()
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { filePath } = body
    if (!filePath) {
      return NextResponse.json({ error: "Missing filePath" }, { status: 400 })
    }

    // Download file from Supabase Storage using admin client
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from("resumes")
      .download(filePath)

    if (downloadError || !fileData) {
      console.error("Parse route download error:", downloadError)
      return NextResponse.json(
        { error: `Failed to download file: ${downloadError?.message || "File empty"}` },
        { status: 400 }
      )
    }

    // Convert file to base64
    const arrayBuffer = await fileData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString("base64")

    // Determine mimeType
    const ext = filePath.split('.').pop()?.toLowerCase() || ''
    let mimeType = "application/pdf"
    if (ext === "docx") {
      mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    } else if (ext === "doc") {
      mimeType = "application/msword"
    }

    // Parse with Gemini
    const parsed = await parseResume(base64, mimeType)

    // Save parsed data to profiles using supabaseAdmin by user.id
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle()

    const profilePayload = {
      full_name: parsed.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
      title: parsed.title || parsed.headline || null,
      bio: parsed.bio || null,
      phone: parsed.phone || null,
      location: parsed.location || null,
      github_url: parsed.github_url || parsed.github || null,
      linkedin_url: parsed.linkedin_url || parsed.linkedin || null,
      website_url: parsed.website_url || parsed.portfolio_url || parsed.portfolio || null,
      summary: parsed.summary || "",
      skills: parsed.skills || [],
      skills_categorized: parsed.skills_categorized || {},
      experience: parsed.experience || [],
      education: parsed.education || [],
      projects: parsed.projects || [],
      certifications: parsed.certifications || [],
      awards: parsed.awards || [],
      publications: parsed.publications || [],
      languages: parsed.languages || [],
      volunteer_experience: parsed.volunteer_experience || [],
      completeness_percentage: 100, // Onboarding completes!
      updated_at: new Date().toISOString()
    }

    let upsertError
    if (existingProfile) {
      const { error: updateErr } = await supabaseAdmin
        .from("profiles")
        .update(profilePayload)
        .eq("id", user.id)
      upsertError = updateErr
    } else {
      const { error: insertErr } = await supabaseAdmin
        .from("profiles")
        .upsert(
          {
            id: user.id,
            email: user.email!,
            ...profilePayload
          },
          { onConflict: "id" }
        )
      upsertError = insertErr
    }

    if (upsertError) {
      console.error("Parse route profile update error:", upsertError)
      return NextResponse.json(
        { error: `Failed to save profile: ${upsertError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, profile: parsed })
  } catch (error: any) {
    console.error("Parse API route exception:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
