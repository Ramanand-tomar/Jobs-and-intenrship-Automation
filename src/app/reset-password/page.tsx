"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { LockKeyIcon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"
import { toast } from "@/components/ui/toast"

export default function ResetPasswordPage() {
  const supabase = createClient()
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match")
      return
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters")
      return
    }

    setLoading(true)
    setErrorMsg("")

    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      setErrorMsg(error.message)
      setLoading(false)
    } else {
      toast.add({
        title: "Password Updated",
        description: "Your password has been successfully reset. Please log in.",
        type: "success",
      })
      setTimeout(() => {
        router.push("/login")
      }, 1200)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-black text-white flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="w-full max-w-md z-10">
        <div className="bg-neutral-900/60 backdrop-blur-xl border border-neutral-800 p-8 rounded-2xl shadow-xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-3 bg-violet-600/10 text-violet-400 rounded-2xl mb-3 border border-violet-500/20">
              <HugeiconsIcon icon={LockKeyIcon} className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Set New Password</h2>
            <p className="mt-1.5 text-sm text-neutral-400">
              Please enter your new password below.
            </p>
          </div>

          <form onSubmit={handleReset} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-950/60 border border-red-800/50 rounded-xl text-red-400 text-sm">
                {errorMsg}
              </div>
            )}

            <div>
              <label htmlFor="new-password" className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm placeholder-neutral-600"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm placeholder-neutral-600"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl"
            >
              {loading ? "Updating password..." : "Update Password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
