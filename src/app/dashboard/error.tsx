"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert02Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard Error:", error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center space-y-5 bg-neutral-900/60 border border-neutral-800 p-8 rounded-2xl">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-500/10 text-red-400">
          <HugeiconsIcon icon={Alert02Icon} className="w-6 h-6" />
        </div>
        
        <div className="space-y-1.5">
          <h3 className="text-xl font-semibold text-white">Error loading dashboard module</h3>
          <p className="text-sm text-neutral-400">
            We encountered a problem loading this section.
          </p>
        </div>

        <div className="flex gap-3 justify-center pt-2">
          <Button
            onClick={() => reset()}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 font-medium"
          >
            <HugeiconsIcon icon={RefreshIcon} className="w-4 h-4" />
            Reload section
          </Button>
        </div>
      </div>
    </div>
  );
}
