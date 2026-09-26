import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { inngest } from "@/lib/inngest/client"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Get current user to ensure authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { applicationId, profileFields } = await request.json()
    if (!applicationId || !profileFields) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // 1. Save profile fields to database profiles table
    const cleanedFields: any = {}
    if (profileFields.phone !== undefined) cleanedFields.phone = profileFields.phone
    if (profileFields.linkedin_url !== undefined) cleanedFields.linkedin_url = profileFields.linkedin_url
    if (profileFields.github_url !== undefined) cleanedFields.github_url = profileFields.github_url
    if (profileFields.location !== undefined) cleanedFields.location = profileFields.location
    if (profileFields.summary !== undefined) cleanedFields.summary = profileFields.summary

    if (Object.keys(cleanedFields).length > 0) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update(cleanedFields)
        .eq("id", user.id)

      if (profileError) {
        return NextResponse.json({ error: "Failed to update profile: " + profileError.message }, { status: 500 })
      }
    }

    // 2. Fetch the original application details
    const { data: application, error: appError } = await supabase
      .from("job_applications")
      .select("*")
      .eq("id", applicationId)
      .single()

    if (appError || !application) {
      return NextResponse.json({ error: "Application record not found" }, { status: 404 })
    }

    // 3. Update the application status to in_queue
    await supabase
      .from("job_applications")
      .update({ status: "in_queue", updated_at: new Date().toISOString() })
      .eq("id", applicationId)

    // 4. Fire the submit event to Inngest to resume the auto-apply submission!
    await inngest.send({
      name: "job/application.submit",
      data: {
        applicationId,
        jobUrl: application.url,
        platform: application.platform,
        userId: user.id
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Resume apply error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
