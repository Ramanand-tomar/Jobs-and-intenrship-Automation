import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white px-6">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#acf417]/5 blur-[120px]" />
      </div>
      <div className="relative text-center">
        <div className="text-[120px] font-black text-[#acf417]/20 leading-none select-none">404</div>
        <h1 className="text-2xl font-black text-white mt-2 mb-3">Page Not Found</h1>
        <p className="text-neutral-400 text-sm max-w-xs mx-auto mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard/jobs"
            className="px-6 py-3 bg-[#acf417] text-black font-bold rounded-xl hover:bg-[#acf417]/90 transition-all text-sm"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="px-6 py-3 bg-transparent border border-neutral-700 text-neutral-300 font-semibold rounded-xl hover:border-neutral-500 transition-all text-sm"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
