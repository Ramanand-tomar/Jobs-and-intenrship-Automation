"use client"

import React, { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { Mail01Icon, ArrowLeft02Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg("")

    const redirectTo = `${window.location.origin}/reset-password`

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (error) {
      setErrorMsg(error.message)
      setLoading(false)
    } else {
      setSubmitted(true)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-black text-white flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="w-full max-w-md z-10">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white mb-6 transition-colors"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} className="w-4 h-4" />
          Back to login
        </Link>

        <div className="bg-neutral-900/60 backdrop-blur-xl border border-neutral-800 p-8 rounded-2xl shadow-xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-3 bg-violet-600/10 text-violet-400 rounded-2xl mb-3 border border-violet-500/20">
              <HugeiconsIcon icon={Mail01Icon} className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Reset Password</h2>
            <p className="mt-1.5 text-sm text-neutral-400">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {submitted ? (
            <div className="text-center space-y-4 py-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-6 h-6" />
              </div>
              <p className="text-sm text-neutral-300">
                We've sent a password reset email to <span className="font-semibold text-white">{email}</span>.
              </p>
              <p className="text-xs text-neutral-500">
                Please check your inbox and spam folder for instructions.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-950/60 border border-red-800/50 rounded-xl text-red-400 text-sm">
                  {errorMsg}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm placeholder-neutral-600"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl"
              >
                {loading ? "Sending link..." : "Send Reset Link"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
