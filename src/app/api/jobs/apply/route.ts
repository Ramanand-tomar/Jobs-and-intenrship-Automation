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

    const { jobId, jobUrl, platform, title, company } = await request.json()
    if (!jobUrl || !platform || !title || !company) {
      return NextResponse.json({ error: "Missing required application parameters" }, { status: 400 })
    }

    // Check user subscription plan limits and usage
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()

    const planName = sub?.plan_name || "Free"
    const limit = sub?.plan_limit ?? 5
    const usage = sub?.daily_usage_count || 0

    if (planName !== "Unlimited" && usage >= limit) {
      return NextResponse.json(
        { error: `Upgrade required: You have reached your limit of ${limit} applications on the ${planName} plan today. Go to the Billing section to upgrade.` },
        { status: 403 }
      )
    }

    // 1. Create a new record in job_applications
    const { data: application, error: insertError } = await supabase
      .from("job_applications")
      .insert({
        user_id: user.id,
        title,
        company,
        platform: platform.toLowerCase(),
        url: jobUrl,
        status: "in_queue", // initially set to in_queue
        match_percentage: 90 // fallback estimate
      })
      .select()
      .single()

    if (insertError || !application) {
      return NextResponse.json(
        { error: `Failed to create application record: ${insertError?.message || "Insert failed"}` },
        { status: 500 }
      )
    }

    // 2. Dispatch the scan event to Inngest queue
    await inngest.send({
      name: "job/application.scan",
      data: {
        applicationId: application.id,
        jobUrl,
        platform: platform.toLowerCase(),
        userId: user.id
      }
    })

    return NextResponse.json({ success: true, applicationId: application.id })
  } catch (error: any) {
    console.error("Queue apply error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
