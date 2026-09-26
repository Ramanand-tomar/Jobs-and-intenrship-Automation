import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard/jobs"

  const authError = searchParams.get("error_description") || searchParams.get("error")
  if (authError) {
    console.error("Auth callback error param:", authError)
    const message = encodeURIComponent(authError)
    return NextResponse.redirect(`${origin}/login?error=${message}`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("No authentication code provided")}`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error("Auth callback error:", error.message)
    const message = encodeURIComponent(error.message || "Could not authenticate user")
    return NextResponse.redirect(`${origin}/login?error=${message}`)
  }

  const forwardedHost = request.headers.get("x-forwarded-host")
  const isLocalEnv = process.env.NODE_ENV === "development"

  if (isLocalEnv) {
    return NextResponse.redirect(`${origin}${next}`)
  } else if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${next}`)
  } else {
    return NextResponse.redirect(`${origin}${next}`)
  }
}
