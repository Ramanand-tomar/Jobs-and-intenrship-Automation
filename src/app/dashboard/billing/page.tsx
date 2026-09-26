"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/toast"

interface Subscription {
  plan_name: string
  plan_limit: number | null
  status: string
  current_period_end: string
  daily_usage_count: number
  payment_status: string
}

interface BillingHistory {
  id: string
  stripe_invoice_id: string
  amount: number
  currency: string
  status: string
  created_at: string
}

function BillingContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([])
  const [loading, setLoading] = useState(true)
  
  const [checkingOutPlan, setCheckingOutPlan] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [toastMsg, setToastMsg] = useState({ text: "", type: "info" })

  const fetchBillingData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Fetch Subscription
      const { data: subData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()

      setSubscription(subData)

      // 2. Fetch billing history
      const { data: histData } = await supabase
        .from("billing_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      setBillingHistory(histData || [])
    } catch (err) {
      console.error("Failed to load billing data:", err)
    } finally {
      setLoading(false)
    }
  }

  // Handle URL redirect query actions
  useEffect(() => {
    const handleUrlActions = async () => {
      const success = searchParams.get("success") === "true"
      const mockPlan = searchParams.get("mock_plan")
      const mockLimit = searchParams.get("mock_limit")
      const canceled = searchParams.get("canceled") === "true"
      const info = searchParams.get("info")

      if (success) {
        if (mockPlan && mockLimit) {
          // Trigger developer simulated sandbox activation
          try {
            const res = await fetch("/api/billing/mock-activate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ planName: mockPlan, planLimit: mockLimit })
            })
            if (res.ok) {
              setToastMsg({ text: `Simulated subscription to ${mockPlan} successfully activated!`, type: "success" })
            }
          } catch (err) {
            console.error("Failed mock activation:", err)
          }
        } else {
          setToastMsg({ text: "Subscription successfully activated! Welcome to your new plan.", type: "success" })
        }
        // Reset query params cleanly
        router.replace("/dashboard/billing")
        fetchBillingData()
      } else if (canceled) {
        setToastMsg({ text: "Subscription checkout was canceled.", type: "warning" })
        router.replace("/dashboard/billing")
      } else if (info === "billing_portal_simulated") {
        setToastMsg({ text: "Customer billing portal simulated.", type: "info" })
        router.replace("/dashboard/billing")
      }
    }

    handleUrlActions()
    fetchBillingData()
  }, [searchParams])

  const handleCheckout = async (planName: string, amount: number) => {
    setCheckingOutPlan(planName)
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planName, amount, interval: "month" })
      })

      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || "Failed to launch session")

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Checkout error occurred"
      toast.add({
        title: "Checkout Error",
        description: message,
        type: "error"
      })
      setCheckingOutPlan(null)
    }
  }

  const handleOpenPortal = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || "Failed to launch portal")

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Portal redirect error occurred"
      toast.add({
        title: "Portal Error",
        description: message,
        type: "error"
      })
      setPortalLoading(false)
    }
  }

  // Calculate usage parameters
  const currentPlan = subscription?.plan_name || "Free"
  const limitCount = subscription?.plan_limit ?? null
  const currentUsage = subscription?.daily_usage_count || 0
  const remainingLimit = limitCount !== null && limitCount !== undefined ? Math.max(0, limitCount - currentUsage) : null
  const status = subscription?.status || "active"
  const periodEnd = subscription?.current_period_end

  return (
    <div className="max-w-5xl mx-auto p-1 lg:p-4 space-y-8">
      {/* Toast Alert Banner */}
      {toastMsg.text && (
        <div className={`p-4 border rounded-2xl flex items-center justify-between shadow-lg transition-all ${
          toastMsg.type === "success" ? "bg-emerald-950/60 border-emerald-800/40 text-emerald-400" :
          toastMsg.type === "warning" ? "bg-red-950/60 border-red-800/40 text-red-400" :
          "bg-neutral-900 border-neutral-800 text-neutral-300"
        }`}>
          <span>{toastMsg.text}</span>
          <button onClick={() => setToastMsg({ text: "", type: "info" })} className="text-xs font-bold hover:underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Row Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left Columns - current plan and usage stats (2 cols) */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Section 1: Current Plan Card */}
          <div className="bg-neutral-900/60 border border-neutral-800/80 p-6 rounded-2xl shadow-xl space-y-4">
            <span className="block text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-800 pb-2">
              Current Plan
            </span>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-black text-white">{currentPlan} Plan</h3>
                  <span className={`px-2 py-0.5 text-[10px] font-black rounded uppercase tracking-wider ${
                    status === "active" ? "bg-emerald-950/80 border border-emerald-800/40 text-emerald-400" :
                    "bg-red-950/80 border border-red-800/40 text-red-400"
                  }`}>
                    {status}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                  {limitCount ? `Max ${limitCount} AI job applications per 24 hours.` : "Unlimited AI job applications per day."}
                </p>
                {periodEnd && (
                  <p className="text-[11px] text-neutral-500 font-medium mt-1">
                    Plan renewal date: {new Date(periodEnd).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Section 3: Manage existing subscription */}
              {currentPlan !== "Free" && (
                <button
                  onClick={handleOpenPortal}
                  disabled={portalLoading}
                  className="px-4 py-2.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 hover:text-white rounded-xl font-bold text-xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {portalLoading ? "Opening Portal..." : "Manage Subscription"}
                </button>
              )}
            </div>
          </div>

          {/* Section 2: Usage Information Card */}
          <div className="bg-neutral-900/60 border border-neutral-800/80 p-6 rounded-2xl shadow-xl space-y-4">
            <span className="block text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-800 pb-2">
              Usage Information
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="space-y-1">
                <span className="text-xs text-neutral-400 font-bold block uppercase tracking-wider">Usage Today</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">{currentUsage}</span>
                  <span className="text-neutral-500 text-sm font-semibold">
                    / {limitCount !== null ? `${limitCount} applications` : "Unlimited"}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-neutral-400 font-bold block uppercase tracking-wider">Remaining Limit</span>
                <h4 className="text-3xl font-black text-primary">
                  {remainingLimit !== null ? `${remainingLimit} applies` : "Unlimited usage"}
                </h4>
              </div>
            </div>

            {/* Progress Visual Bar */}
            {limitCount !== null && (
              <div className="space-y-1 pt-2">
                <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-neutral-800/40">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (currentUsage / limitCount) * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-neutral-500 font-bold text-right">
                  Limits reset daily at 00:00 UTC
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Right Column - Billing History Invoice records (1 col) */}
        <div className="bg-neutral-900/60 border border-neutral-800/80 p-6 rounded-2xl shadow-xl space-y-4">
          <span className="block text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-800 pb-2">
            Invoice Logs
          </span>

          {loading ? (
            <div className="h-20 bg-neutral-950 border border-neutral-800 rounded-xl animate-pulse" />
          ) : billingHistory.length === 0 ? (
            <p className="text-neutral-500 text-xs py-4 text-center">No transaction records found.</p>
          ) : (
            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
              {billingHistory.map((hist) => (
                <div key={hist.id} className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-neutral-200 block">Monthly Invoice</span>
                    <span className="text-[10px] text-neutral-500">{new Date(hist.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-neutral-100 block">${(hist.amount / 100).toFixed(2)}</span>
                    <span className="text-[9px] font-bold text-primary uppercase">{hist.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section 4: Available Plans grid */}
      <div className="space-y-6 pt-4">
        <div className="text-center space-y-1.5">
          <h3 className="text-2xl font-black text-neutral-100">Flexible Pricing Plans</h3>
          <p className="text-xs text-neutral-400">Unlock advanced browser automation speeds and increase your daily apply limits.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Plan 1: Free */}
          <div className="bg-neutral-900/40 border border-neutral-800 hover:border-neutral-700 p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between transition-all">
            {currentPlan === "Free" && (
              <span className="absolute top-3 right-3 px-2 py-0.5 bg-neutral-800 border border-neutral-700 text-neutral-400 font-bold text-[8.5px] rounded uppercase tracking-wider">
                Current Plan
              </span>
            )}
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-bold text-neutral-300">Free</h4>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-black text-white">$0</span>
                  <span className="text-neutral-500 text-xs font-semibold">/ month</span>
                </div>
              </div>

              <ul className="space-y-3 text-xs text-neutral-400 font-medium">
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> Max 5 AI Job Applies / day
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> Top 10 Job Results visibility
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> Basic Apply Automation
                </li>
              </ul>
            </div>

            <button
              disabled
              className="mt-8 w-full py-3 bg-neutral-800 text-neutral-400 font-bold text-xs rounded-xl border border-neutral-700 flex items-center justify-center cursor-not-allowed"
            >
              Current Plan
            </button>
          </div>

          {/* Plan 2: Pro */}
          <div className="bg-neutral-900/60 border border-primary/20 hover:border-primary/40 p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between shadow-2xl transition-all">
            {currentPlan === "Pro" && (
              <span className="absolute top-3 right-3 px-2 py-0.5 bg-primary/20 border border-primary/30 text-primary font-bold text-[8.5px] rounded uppercase tracking-wider">
                Current Plan
              </span>
            )}
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-bold text-neutral-100">Pro</h4>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-black text-white">$9.99</span>
                  <span className="text-neutral-500 text-xs font-semibold">/ month</span>
                </div>
              </div>

              <ul className="space-y-3 text-xs text-neutral-300 font-medium">
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> Max 25 AI Job Applies / day
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> All Job Results visibility
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> Priority support
                </li>
              </ul>
            </div>

            {currentPlan === "Pro" ? (
              <button
                disabled
                className="mt-8 w-full py-3 bg-neutral-800 text-neutral-400 font-bold text-xs rounded-xl border border-neutral-700 flex items-center justify-center cursor-not-allowed"
              >
                Current Plan
              </button>
            ) : (
              <button
                onClick={() => handleCheckout("Pro", 9.99)}
                disabled={checkingOutPlan !== null}
                className="mt-8 w-full py-3 bg-primary hover:bg-primary/95 text-black font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
              >
                {checkingOutPlan === "Pro" ? "Launching Checkout..." : "Upgrade to Pro"}
              </button>
            )}
          </div>

          {/* Plan 3: Unlimited */}
          <div className="bg-neutral-900/40 border border-neutral-800 hover:border-neutral-700 p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between transition-all">
            {currentPlan === "Unlimited" && (
              <span className="absolute top-3 right-3 px-2 py-0.5 bg-neutral-800 border border-neutral-700 text-neutral-400 font-bold text-[8.5px] rounded uppercase tracking-wider">
                Current Plan
              </span>
            )}
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-bold text-neutral-300">Unlimited</h4>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-black text-white">$49.99</span>
                  <span className="text-neutral-500 text-xs font-semibold">/ month</span>
                </div>
              </div>

              <ul className="space-y-3 text-xs text-neutral-400 font-medium">
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> Unlimited AI Job Applies / day
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> All Job Results visibility
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> Priority support
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> Cancel subscription anytime
                </li>
              </ul>
            </div>

            {currentPlan === "Unlimited" ? (
              <button
                disabled
                className="mt-8 w-full py-3 bg-neutral-800 text-neutral-400 font-bold text-xs rounded-xl border border-neutral-700 flex items-center justify-center cursor-not-allowed"
              >
                Current Plan
              </button>
            ) : (
              <button
                onClick={() => handleCheckout("Unlimited", 49.99)}
                disabled={checkingOutPlan !== null}
                className="mt-8 w-full py-3 bg-primary hover:bg-primary/95 text-black font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
              >
                {checkingOutPlan === "Unlimited" ? "Launching Checkout..." : "Get Unlimited"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BillingPage() {
  return (
    <Suspense fallback={
      <div className="max-w-5xl mx-auto p-4 space-y-6">
        <div className="h-32 bg-neutral-900/40 border border-neutral-800 rounded-2xl animate-pulse" />
        <div className="h-64 bg-neutral-900/40 border border-neutral-800 rounded-2xl animate-pulse" />
      </div>
    }>
      <BillingContent />
    </Suspense>
  )
}
