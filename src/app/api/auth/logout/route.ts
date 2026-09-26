import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const url = new URL("/login", request.url)
  const response = NextResponse.redirect(url)

  // Clear all Supabase auth cookies
  const cookieHeader = request.headers.get("cookie") || ""
  cookieHeader.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0].trim()
    if (name) {
      response.cookies.set(name, "", { maxAge: 0, path: "/" })
    }
  })

  return response
}
