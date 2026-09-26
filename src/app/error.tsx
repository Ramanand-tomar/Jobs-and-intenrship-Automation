"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert02Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="max-w-md w-full text-center space-y-6 bg-neutral-900 border border-neutral-800 p-8 rounded-2xl shadow-xl">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 text-red-400">
          <HugeiconsIcon icon={Alert02Icon} className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-white">Something went wrong</h2>
          <p className="text-sm text-neutral-400">
            An unexpected error occurred while loading this page. Please try again or refresh.
          </p>
        </div>

        <div className="flex gap-3 justify-center pt-2">
          <Button
            onClick={() => reset()}
            className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 font-medium"
          >
            <HugeiconsIcon icon={RefreshIcon} className="w-4 h-4" />
            Try again
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = "/"}
            className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
          >
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}
