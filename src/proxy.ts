import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request)

  const url = request.nextUrl.clone()
  const pathname = url.pathname

  // Bypass public assets, API routes, and OAuth callbacks
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth/callback") ||
    pathname === "/favicon.ico"
  ) {
    return supabaseResponse
  }

  // Check auth state
  if (user) {
    // User is logged in
    const { data: profile } = await supabase
      .from("profiles")
      .select("completeness_percentage")
      .eq("id", user.id)
      .maybeSingle()

    const isOnboarded = profile ? profile.completeness_percentage > 0 : false

    if (pathname === "/login" || pathname === "/signup") {
      if (isOnboarded) {
        url.pathname = "/dashboard"
      } else {
        url.pathname = "/onboarding"
      }
      return NextResponse.redirect(url)
    }

    if (pathname.startsWith("/dashboard") && !isOnboarded) {
      url.pathname = "/onboarding"
      return NextResponse.redirect(url)
    }

    if (pathname === "/onboarding" && isOnboarded) {
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }
  } else {
    // User is not logged in
    if (pathname.startsWith("/dashboard") || pathname === "/onboarding") {
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
