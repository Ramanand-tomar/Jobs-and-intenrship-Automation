import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Ensure authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 1. Get stripe_customer_id from user subscription
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()

    const stripeCustomerId = subscription?.stripe_customer_id
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // If Stripe key is missing or no customer exists, return mock billing portal message
    if (!process.env.STRIPE_SECRET_KEY || !stripeCustomerId) {
      return NextResponse.json({
        url: `${appUrl}/dashboard/billing?info=billing_portal_simulated`
      })
    }

    // 2. Create Billing Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${appUrl}/dashboard/billing`
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error("Stripe portal error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to launch billing portal" },
      { status: 500 }
    )
  }
}
