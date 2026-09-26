"use client"

import React, { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function DashboardSidebar() {
  const supabase = useMemo(() => createClient(), [])
  const pathname = usePathname()
  const router = useRouter()

  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const [{ data: profileData }, { data: subData }] = await Promise.all([
          supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
          supabase.from("subscriptions").select("plan_name, daily_apply_limit, daily_usage_count").eq("user_id", user.id).maybeSingle(),
        ])
        setProfile(profileData)
        setSubscription(subData)
      }
      setLoading(false)
    }
    fetchData()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const isActive = (path: string) => pathname.startsWith(path)

  // Real credits from subscription, with sensible defaults
  const creditsUsed = subscription?.daily_usage_count ?? 0
  const totalCredits = subscription?.daily_apply_limit ?? 10
  const creditsPercentage = totalCredits > 0 ? Math.min((creditsUsed / totalCredits) * 100, 100) : 0
  const planName = subscription?.plan_name || "Free"

  const navItems = [
    {
      name: "Jobs",
      path: "/dashboard/jobs",
      icon: (
        <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      name: "Resume",
      path: "/dashboard/resume",
      icon: (
        <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      name: "Application Status",
      path: "/dashboard/status",
      icon: (
        <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
        </svg>
      )
    },
    {
      name: "Saved Jobs",
      path: "/dashboard/saved",
      icon: (
        <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      )
    },
    {
      name: "Profile",
      path: "/dashboard/profile",
      icon: (
        <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    }
  ]

  return (
    <>
      {/* Mobile Top Header (Visible on screens < md) */}
      <div className="md:hidden sticky top-0 z-40 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-primary/10 border border-primary/20 rounded-lg">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-white">
            JobBuddy<span className="text-primary font-black">.ai</span>
          </span>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-300 hover:text-white transition-all cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
        />
      )}

      {/* Sidebar (Desktop sticky, Mobile fixed drawer) */}
      <aside
        className={`border-r border-neutral-800 bg-neutral-950 flex flex-col justify-between h-screen fixed md:sticky top-0 left-0 transition-all duration-300 z-50 ${
          mobileOpen ? "translate-x-0 w-72" : "-translate-x-full md:translate-x-0"
        } ${isCollapsed ? "md:w-20" : "md:w-72"}`}
      >
      {/* Top Header Section */}
      <div>
        <div className="flex items-center justify-between p-6 border-b border-neutral-900/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-primary/10 border border-primary/20 rounded-xl shadow-[0_0_15px_rgba(172,244,23,0.15)] flex-shrink-0">
              <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            {!isCollapsed && (
              <span className="text-xl font-bold tracking-tight text-white whitespace-nowrap">
                JobBuddy<span className="text-primary font-black">.ai</span>
              </span>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-all cursor-pointer flex-shrink-0"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg
              className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="p-4 space-y-2 mt-4" aria-label="Dashboard navigation">
          {navItems.map((item) => {
            const active = isActive(item.path)
            return (
              <Link
                key={item.name}
                href={item.path}
                title={isCollapsed ? item.name : undefined}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl font-semibold text-[16px] transition-all duration-200 group ${
                  active
                    ? "bg-primary text-black shadow-[0_4px_20px_rgba(172,244,23,0.25)]"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-900/50"
                } ${isCollapsed ? "justify-center" : ""}`}
              >
                <div className={`transition-transform duration-200 group-hover:scale-105 ${active ? "text-black" : "text-neutral-400 group-hover:text-white"}`}>
                  {item.icon}
                </div>
                {!isCollapsed && (
                  <span className="whitespace-nowrap transition-opacity duration-200">
                    {item.name}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Footer Section */}
      <div className="p-4 border-t border-neutral-900/80 space-y-4">
        {/* Billing / Credits Section */}
        <div className="p-3 bg-neutral-900/40 border border-neutral-900/60 rounded-xl">
          <Link
            href="/dashboard/billing"
            className={`flex items-center gap-4 py-1.5 rounded-lg text-neutral-400 hover:text-white font-semibold transition-all group ${
              isCollapsed ? "justify-center" : ""
            }`}
            title={isCollapsed ? "Billing / Credits" : undefined}
          >
            <div className={`transition-transform duration-200 group-hover:scale-105 ${isActive("/dashboard/billing") ? "text-primary" : "text-neutral-400 group-hover:text-white"}`}>
              <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            {!isCollapsed && <span className="text-[15px]">Billing / Credits</span>}
          </Link>

          {!isCollapsed && (
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-xs text-neutral-400 font-medium">
                <span>Daily Usage</span>
                <span className="text-primary font-bold">{creditsUsed} / {totalCredits} applies</span>
              </div>
              <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-neutral-800/40">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${creditsPercentage >= 90 ? "bg-red-500" : "bg-primary"}`}
                  style={{ width: `${creditsPercentage}%` }}
                />
              </div>
              <p className="text-[10px] text-neutral-500 font-semibold text-right">
                {totalCredits - creditsUsed} applies remaining today
              </p>
            </div>
          )}
        </div>

        {/* Profile Settings */}
        <Link
          href="/dashboard/settings"
          title={isCollapsed ? "Settings" : undefined}
          className={`flex items-center gap-4 px-4 py-3 rounded-xl font-semibold text-[15px] text-neutral-400 hover:text-white hover:bg-neutral-900/50 transition-all duration-200 group ${
            isActive("/dashboard/settings") ? "bg-neutral-900 text-white" : ""
          } ${isCollapsed ? "justify-center" : ""}`}
        >
          <div className={`transition-transform duration-200 group-hover:scale-105 ${isActive("/dashboard/settings") ? "text-primary" : "text-neutral-400 group-hover:text-white"}`}>
            <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          {!isCollapsed && <span>Settings</span>}
        </Link>

        {/* User Card */}
        <div className="flex items-center justify-between p-2 hover:bg-neutral-900/30 border border-neutral-900/60 rounded-2xl gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-primary/30 to-violet-500/30 border border-primary/20 flex items-center justify-center font-bold text-primary flex-shrink-0">
              {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : "?"}
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-neutral-200 truncate">
                  {profile?.full_name || "Loading..."}
                </p>
                <span className="inline-flex px-1.5 py-0.5 bg-primary/10 border border-primary/20 rounded-md text-[9px] font-black text-primary uppercase tracking-wider mt-0.5">
                  {planName} Plan
                </span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={handleSignOut}
              className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-red-400 transition-colors cursor-pointer flex-shrink-0"
              title="Sign Out"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </aside>
    </>
  )
}
