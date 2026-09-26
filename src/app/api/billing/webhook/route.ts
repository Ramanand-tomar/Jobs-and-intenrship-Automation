import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const reqHeaders = await headers()
    const signature = reqHeaders.get("Stripe-Signature") as string
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    let event: any

    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`)
        return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 })
      }
    } else {
      // Fallback parser if no webhook secret is configured (for local testing scripts)
      event = JSON.parse(body)
    }

    const session = event.data.object

    // 1. Handle completed checkouts
    if (event.type === "checkout.session.completed") {
      const subscriptionId = session.subscription as string
      const customerId = session.customer as string

      // Retrieve full subscription details from Stripe
      const subscription = (await stripe.subscriptions.retrieve(subscriptionId)) as any
      
      const userId = session.metadata?.userId
      const planName = session.metadata?.planName || "Free"
      const planLimit = session.metadata?.planLimit || "5"

      if (userId) {
        // Update subscriptions record in DB
        await supabaseAdmin
          .from("subscriptions")
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            plan_name: planName,
            plan_limit: planLimit === "-1" ? null : parseInt(planLimit),
            status: subscription.status,
            payment_status: "paid",
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("user_id", userId)

        // Insert into billing_history
        const price = subscription.items.data[0]?.price
        await supabaseAdmin
          .from("billing_history")
          .insert({
            user_id: userId,
            stripe_invoice_id: subscription.latest_invoice as string,
            amount: price?.unit_amount ? BigInt(price.unit_amount) : BigInt(0),
            currency: subscription.currency || "usd",
            status: "paid"
          })
      }
    }

    // 2. Handle subscription updates
    if (event.type === "customer.subscription.updated") {
      const customerId = session.customer as string
      
      await supabaseAdmin
        .from("subscriptions")
        .update({
          status: session.status,
          current_period_start: new Date(session.current_period_start * 1000).toISOString(),
          current_period_end: new Date(session.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("stripe_customer_id", customerId)
    }

    // 3. Handle cancellations
    if (event.type === "customer.subscription.deleted") {
      const customerId = session.customer as string

      await supabaseAdmin
        .from("subscriptions")
        .update({
          plan_name: "Free",
          plan_limit: 5,
          stripe_subscription_id: null,
          status: "canceled",
          payment_status: "unpaid",
          updated_at: new Date().toISOString()
        })
        .eq("stripe_customer_id", customerId)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("Webhook processing error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
