import React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import DashboardSidebar from "@/components/dashboard-sidebar"
import OnboardingDialog from "@/components/onboarding-dialog"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Get current user to ensure authorization
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect("/login")
  }

  // Check completeness
  const { data: profile } = await supabase
    .from("profiles")
    .select("completeness_percentage")
    .eq("id", user.id)
    .maybeSingle()

  const showOnboarding = !profile || !profile.completeness_percentage || profile.completeness_percentage === 0

  return (
    <div className="flex min-h-screen bg-neutral-950 text-white font-sans antialiased">
      {/* Interactive Left Sidebar */}
      <DashboardSidebar />

      {/* Main Scrollable Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <main className="p-8 flex-1">
          {children}
        </main>
      </div>

      {/* Non-closable Onboarding Dialog */}
      {showOnboarding && <OnboardingDialog />}
    </div>
  )
}
