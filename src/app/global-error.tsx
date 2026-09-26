"use client"

import Link from "next/link"
import { useEffect } from "react"

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Global error:", error)
  }, [error])

  return (
    <html lang="en" className="h-full bg-neutral-950">
      <body className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white px-6">
        <div className="text-center">
          <div className="text-6xl mb-6">⚠️</div>
          <h1 className="text-2xl font-black text-white mb-3">Something went wrong</h1>
          <p className="text-neutral-400 text-sm max-w-xs mx-auto mb-8 leading-relaxed">
            An unexpected error occurred. Our team has been notified. Please try again.
          </p>
          {error.digest && (
            <p className="text-xs text-neutral-600 mb-6 font-mono">Error ID: {error.digest}</p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="px-6 py-3 bg-[#acf417] text-black font-bold rounded-xl hover:bg-[#acf417]/90 transition-all text-sm cursor-pointer"
            >
              Try Again
            </button>
            <Link
              href="/dashboard/jobs"
              className="px-6 py-3 bg-transparent border border-neutral-700 text-neutral-300 font-semibold rounded-xl hover:border-neutral-500 transition-all text-sm"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
