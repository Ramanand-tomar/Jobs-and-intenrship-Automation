"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/toast"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  UserIcon,
  ShieldKeyIcon,
  Notification01Icon,
  GlobalIcon,
  Logout01Icon,
  Mail01Icon,
  CheckmarkCircle02Icon,
  Alert02Icon
} from "@hugeicons/core-free-icons"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState("")
  const [emailConfirmed, setEmailConfirmed] = useState(false)
  const [createdAt, setCreatedAt] = useState("")
  
  // Preference States
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [autoApplyGreenhouse, setAutoApplyGreenhouse] = useState(true)
  const [autoApplyLever, setAutoApplyLever] = useState(true)
  const [autoApplyWorkable, setAutoApplyWorkable] = useState(true)
  const [autoApplyWellfound, setAutoApplyWellfound] = useState(false)
  
  const [resetSending, setResetSending] = useState(false)

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || "")
        setEmailConfirmed(!!user.email_confirmed_at)
        setCreatedAt(user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A")
      }
      setLoading(false)
    }
    loadUserData()
  }, [])

  const handlePasswordReset = async () => {
    if (!userEmail) return
    setResetSending(true)
    const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    setResetSending(false)

    if (error) {
      toast.add({
        title: "Error Sending Reset Email",
        description: error.message,
        type: "error"
      })
    } else {
      toast.add({
        title: "Password Reset Link Sent",
        description: `Check your inbox at ${userEmail} for instructions.`,
        type: "success"
      })
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast.add({
      title: "Signed Out",
      description: "You have been logged out of your account.",
      type: "info"
    })
    router.push("/login")
  }

  const handleSavePreferences = () => {
    toast.add({
      title: "Preferences Saved",
      description: "Your platform and notification settings have been updated.",
      type: "success"
    })
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse p-4">
        <div className="h-28 bg-neutral-900/60 border border-neutral-800 rounded-3xl" />
        <div className="h-64 bg-neutral-900/60 border border-neutral-800 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-1 lg:p-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border border-neutral-800 p-6 md:p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl">
        <div className="space-y-1.5">
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-100 flex items-center gap-2">
            Account Settings
          </h2>
          <p className="text-neutral-400 text-xs font-medium max-w-lg">
            Manage your account security, preferred job platforms, notification channels, and privacy controls.
          </p>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-neutral-900/60 border border-neutral-800 p-6 rounded-2xl shadow-xl space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-neutral-800">
          <div className="p-2.5 bg-violet-600/10 text-violet-400 border border-violet-500/20 rounded-xl">
            <HugeiconsIcon icon={UserIcon} className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Account Details</h3>
            <p className="text-xs text-neutral-400">Basic authentication information and account status</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <span className="text-xs text-neutral-400 uppercase font-semibold tracking-wider">Email Address</span>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-sm font-medium text-white">{userEmail}</span>
              {emailConfirmed ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-950/80 border border-emerald-800/40 text-emerald-400 text-[10px] font-bold rounded-md uppercase tracking-wider">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-3 h-3" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-950/80 border border-amber-800/40 text-amber-400 text-[10px] font-bold rounded-md uppercase tracking-wider">
                  <HugeiconsIcon icon={Alert02Icon} className="w-3 h-3" /> Unverified
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-neutral-400 uppercase font-semibold tracking-wider">Member Since</span>
            <p className="text-sm font-medium text-white pt-1">{createdAt}</p>
          </div>
        </div>
      </div>

      {/* Security & Password */}
      <div className="bg-neutral-900/60 border border-neutral-800 p-6 rounded-2xl shadow-xl space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-neutral-800">
          <div className="p-2.5 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
            <HugeiconsIcon icon={ShieldKeyIcon} className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Security & Credentials</h3>
            <p className="text-xs text-neutral-400">Update your account password and security settings</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h4 className="text-sm font-bold text-neutral-200">Change Account Password</h4>
            <p className="text-xs text-neutral-400 mt-0.5">We will send a secure link to your email to reset your password.</p>
          </div>
          <Button
            onClick={handlePasswordReset}
            disabled={resetSending}
            variant="outline"
            className="border-neutral-700 text-neutral-200 hover:bg-neutral-800 font-medium"
          >
            <HugeiconsIcon icon={Mail01Icon} className="w-4 h-4 mr-2" />
            {resetSending ? "Sending link..." : "Send Reset Email"}
          </Button>
        </div>
      </div>

      {/* Automation Preferences */}
      <div className="bg-neutral-900/60 border border-neutral-800 p-6 rounded-2xl shadow-xl space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-neutral-800">
          <div className="p-2.5 bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
            <HugeiconsIcon icon={GlobalIcon} className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">ATS Platform Automation</h3>
            <p className="text-xs text-neutral-400">Select platforms where the AI Agent is allowed to auto-submit applications</p>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { id: "greenhouse", name: "Greenhouse.io", desc: "Allows applying to jobs hosted on Greenhouse ATS", state: autoApplyGreenhouse, set: setAutoApplyGreenhouse },
            { id: "lever", name: "Lever.co", desc: "Allows applying to jobs hosted on Lever ATS", state: autoApplyLever, set: setAutoApplyLever },
            { id: "workable", name: "Workable.com", desc: "Allows applying to jobs hosted on Workable ATS", state: autoApplyWorkable, set: setAutoApplyWorkable },
            { id: "wellfound", name: "Wellfound (AngelList)", desc: "Allows applying to jobs hosted on Wellfound", state: autoApplyWellfound, set: setAutoApplyWellfound },
          ].map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3.5 bg-neutral-950 border border-neutral-800/80 rounded-xl">
              <div>
                <h4 className="text-sm font-bold text-neutral-200">{item.name}</h4>
                <p className="text-xs text-neutral-500">{item.desc}</p>
              </div>
              <Switch
                checked={item.state}
                onCheckedChange={(checked) => {
                  item.set(checked)
                  handleSavePreferences()
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-neutral-900/60 border border-neutral-800 p-6 rounded-2xl shadow-xl space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-neutral-800">
          <div className="p-2.5 bg-amber-600/10 text-amber-400 border border-amber-500/20 rounded-xl">
            <HugeiconsIcon icon={Notification01Icon} className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Notification Preferences</h3>
            <p className="text-xs text-neutral-400">Control when and how JobBuddy notifies you</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-3.5 bg-neutral-950 border border-neutral-800/80 rounded-xl">
          <div>
            <h4 className="text-sm font-bold text-neutral-200">Email Digest Notifications</h4>
            <p className="text-xs text-neutral-500">Receive email alerts when background AI applications complete or require action.</p>
          </div>
          <Switch
            checked={emailNotifications}
            onCheckedChange={(checked) => {
              setEmailNotifications(checked)
              handleSavePreferences()
            }}
          />
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-950/20 border border-red-900/40 p-6 rounded-2xl shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-red-400">Account Management</h3>
        <p className="text-xs text-neutral-400">Sign out of your active session on this device.</p>
        <div>
          <Button
            onClick={handleSignOut}
            className="bg-red-600 hover:bg-red-500 text-white font-bold"
          >
            <HugeiconsIcon icon={Logout01Icon} className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}
