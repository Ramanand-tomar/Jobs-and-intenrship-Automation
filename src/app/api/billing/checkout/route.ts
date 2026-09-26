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

    const { planName, amount, interval } = await request.json()
    if (!planName || amount === undefined) {
      return NextResponse.json({ error: "Missing checkout parameters" }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // If Stripe key is missing or is the default mock key, simulate successful checkout URL
    if (!process.env.STRIPE_SECRET_KEY) {
      const mockLimit = planName === "Pro" ? "25" : planName === "Unlimited" ? "-1" : "5"
      const mockRedirectUrl = `${appUrl}/dashboard/billing?success=true&mock_plan=${planName}&mock_limit=${mockLimit}`
      return NextResponse.json({ url: mockRedirectUrl })
    }

    // 1. Get or create user subscription record to check stripe_customer_id
    let { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()

    let stripeCustomerId = subscription?.stripe_customer_id

    if (!stripeCustomerId) {
      // Create a customer in Stripe
      const customer = await stripe.customers.create({
        email: user.email!,
        name: user.user_metadata?.full_name || "Applicant",
        metadata: { userId: user.id }
      })
      stripeCustomerId = customer.id

      // Update database
      await supabase
        .from("subscriptions")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("user_id", user.id)
    }

    // 2. Create Stripe Product & Price dynamically
    const product = await stripe.products.create({
      name: `${planName} Plan`,
      metadata: { planName, limit: planName === "Pro" ? "25" : planName === "Unlimited" ? "-1" : "5" }
    })

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(amount * 100), // in cents
      currency: "usd",
      recurring: { interval: interval || "month" }
    })

    // 3. Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: price.id,
          quantity: 1
        }
      ],
      mode: "subscription",
      success_url: `${appUrl}/dashboard/billing?success=true`,
      cancel_url: `${appUrl}/dashboard/billing?canceled=true`,
      metadata: {
        userId: user.id,
        planName,
        planLimit: planName === "Pro" ? "25" : planName === "Unlimited" ? "-1" : "5"
      }
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error("Stripe checkout error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to initiate Stripe session" },
      { status: 500 }
    )
  }
}
