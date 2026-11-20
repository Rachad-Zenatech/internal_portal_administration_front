import { ArrowRight, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ThreeWayMatchSummary } from "./types";

interface Props {
  summary: ThreeWayMatchSummary;
  onRouteToPayment: () => void;
  isRouting: boolean;
}

export function RouteToPaymentBanner({ summary, onRouteToPayment, isRouting }: Props) {
  const { overallStatus, isPaymentReadyQueue } = summary;

  if (isPaymentReadyQueue) {
    return (
      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-medium">
          <Clock className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span>In Payment-Ready Queue (Waiting Payment) — Ready for Treasury / AP Settlement</span>
        </div>
        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          Ready for Payment
        </span>
      </div>
    );
  }

  if (overallStatus === "FULLY_MATCHED") {
    return (
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <div>
            <div className="font-bold text-emerald-900 dark:text-emerald-200">
              3-Way Match Verification Complete
            </div>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
              Approved PO, Department Service Confirmation, and Vendor Invoice are reconciled.
            </div>
          </div>
        </div>

        <Button
          size="sm"
          disabled={isRouting}
          onClick={onRouteToPayment}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 px-4 gap-2 shadow-xs cursor-pointer shrink-0"
        >
          {isRouting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
          <span>Route to Payment-Ready Queue</span>
        </Button>
      </div>
    );
  }

  const { readyCount, mismatchedCount, statusText } = summary;
  const progressPercent = Math.round((readyCount / 3) * 100);

  return (
    <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 text-xs space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-0.5">
          <div className="font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
            <span>{statusText}</span>
            <span className="text-[11px] font-normal text-muted-foreground">
              ({progressPercent}% complete)
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {readyCount === 2 && mismatchedCount > 0
              ? "2 parts are right, but 1 component has a discrepancy that must be resolved before payment release."
              : readyCount === 2
              ? "2 parts are right. Complete the remaining 1 component to advance into the payment-ready queue."
              : readyCount === 1
              ? "1 part is ready while 2 components remain pending. Complete all 3 parts for payment clearance."
              : "All 3 components (Approved PO, Goods Confirmation, Vendor Invoice) are pending matching."}
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          disabled={true}
          className="text-xs h-7 px-3 gap-1.5 opacity-60 cursor-not-allowed shrink-0"
        >
          <ArrowRight className="w-3 h-3" />
          <span>Requires 3/3 Match</span>
        </Button>
      </div>

      {/* Progress Track */}
      <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-zinc-700 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            mismatchedCount > 0
              ? "bg-rose-500"
              : readyCount === 2
              ? "bg-blue-500"
              : readyCount === 1
              ? "bg-amber-500"
              : "bg-slate-300"
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
