import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, RefreshCw, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useHubSpotCompaniesSyncStatus } from "@/hooks/useHubSpotCompanies";

const DONE_AUTO_HIDE_MS = 8000;

/**
 * Small bottom-right card showing the background HubSpot companies sync: percentage while running,
 * then the result. It never blocks the page. Mounted once in the app shell so progress follows the user.
 */
export default function HubSpotSyncProgress() {
  const queryClient = useQueryClient();
  const { data: status } = useHubSpotCompaniesSyncStatus();
  const [dismissedRun, setDismissedRun] = useState<string | null>(null);
  const [showFinished, setShowFinished] = useState(false);
  const wasRunning = useRef(false);

  const state = status?.status;
  const runKey = status?.started_at ?? "none";

  // A finished sync is only announced if we watched it run, so an old result never pops up on page load.
  useEffect(() => {
    if (state === "running") {
      wasRunning.current = true;
      setShowFinished(false);
      return;
    }
    if (!wasRunning.current || (state !== "completed" && state !== "failed")) return;
    wasRunning.current = false;
    setShowFinished(true);
    if (state === "completed") {
      queryClient.invalidateQueries({ queryKey: ["hubspot-companies"] });
      queryClient.invalidateQueries({ queryKey: ["master-products"] });
      queryClient.invalidateQueries({ queryKey: ["company-products"] });
      // The full customer list is ~110K rows (3-5 s): mark it stale and reload it the next time it is opened,
      // instead of refetching it right after every sync press.
      queryClient.invalidateQueries({ queryKey: ["ar-customers"], refetchType: "none" });
      const t = setTimeout(() => setShowFinished(false), DONE_AUTO_HIDE_MS);
      return () => clearTimeout(t);
    }
  }, [state, queryClient]);

  if (!status || dismissedRun === runKey) return null;
  const running = state === "running";
  if (!running && !showFinished) return null;

  const failed = state === "failed";
  const percent = status.percent;
  const indeterminate = running && percent === null;
  const modeLabel = status.mode === "incremental" ? "Updating recent changes" : status.mode === "full" ? "Full sync" : "Starting";

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[60] w-72 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg p-3 animate-in fade-in slide-in-from-bottom-2 duration-300 print:hidden"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {running && <RefreshCw className="h-4 w-4 text-orange-500 animate-spin shrink-0" />}
          {state === "completed" && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
          {failed && <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />}
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate">
              {running ? "Syncing A/R companies" : failed ? "A/R sync failed" : "A/R sync complete"}
            </p>
            {running && <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">{modeLabel}</p>}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissedRun(runKey)}
          aria-label="Hide sync progress"
          className="p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 cursor-pointer shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {running && (
        <div className="mt-2.5 space-y-1.5">
          <Progress
            value={indeterminate ? 100 : percent ?? 0}
            className={`h-1.5 ${indeterminate ? "animate-pulse" : ""}`}
          />
          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400">
            <span className="truncate">
              {status.total != null
                ? `${status.processed.toLocaleString()} / ${status.total.toLocaleString()} companies`
                : status.phase || "Working..."}
            </span>
            <span className="font-mono font-semibold text-slate-700 dark:text-zinc-200">
              {percent === null ? "…" : `${percent}%`}
            </span>
          </div>
        </div>
      )}

      {!running && (
        <p className={`mt-1.5 text-[11px] leading-snug ${failed ? "text-red-600 dark:text-red-400" : "text-slate-600 dark:text-zinc-300"}`}>
          {failed ? status.error || status.message : status.message}
        </p>
      )}
    </div>
  );
}
