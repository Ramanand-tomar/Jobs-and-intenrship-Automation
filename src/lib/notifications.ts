import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
})

export interface NotificationPayload {
  userId: string
  title: string
  message: string
  type: "info" | "warning" | "success" | "error"
  actionUrl?: string
}

export async function sendApplicationNotification(payload: NotificationPayload) {
  try {
    // 1. Fetch user email
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, full_name")
      .eq("id", payload.userId)
      .maybeSingle()

    const email = profile?.email
    if (!email) {
      console.log(`Notification skipped for user ${payload.userId}: No email on profile.`)
      return
    }

    console.log(`[Notification Dispatch] To: ${email} | Subject: ${payload.title} | Content: ${payload.message}`)

    // If Resend API Key is set, deliver via email API
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: "JobBuddy.ai <notifications@jobbuddy.ai>",
            to: [email],
            subject: payload.title,
            html: `
              <div style="font-family: sans-serif; padding: 20px; color: #111;">
                <h2>${payload.title}</h2>
                <p>${payload.message}</p>
                ${payload.actionUrl ? `<p><a href="${payload.actionUrl}" style="background:#acf417; color:#000; padding:10px 18px; border-radius:8px; text-decoration:none; font-weight:bold;">View Details</a></p>` : ""}
              </div>
            `
          })
        })
      } catch (emailErr) {
        console.error("Failed to send email via Resend API:", emailErr)
      }
    }
  } catch (err) {
    console.error("sendApplicationNotification error:", err)
  }
}
