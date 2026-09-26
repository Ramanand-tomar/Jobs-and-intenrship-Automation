import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Ensure authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { planName, planLimit } = await request.json()
    if (!planName) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    // Update subscriptions table directly for simulation purposes
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        plan_name: planName,
        plan_limit: planLimit === "-1" ? null : parseInt(planLimit),
        status: "active",
        payment_status: "paid",
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        updated_at: new Date().toISOString()
      })
      .eq("user_id", user.id)

    if (updateError) {
      return NextResponse.json({ error: "Failed to update mock subscription: " + updateError.message }, { status: 500 })
    }

    // Insert mock billing history item
    await supabase
      .from("billing_history")
      .insert({
        user_id: user.id,
        stripe_invoice_id: `mock_inv_${Date.now()}`,
        amount: planName === "Pro" ? 999 : planName === "Unlimited" ? 4999 : 0,
        currency: "usd",
        status: "paid"
      })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Mock activation error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
