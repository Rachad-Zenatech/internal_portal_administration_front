import { Card } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertTriangle, Layers } from "lucide-react";
import { formatMoney } from "../../utils/purchasingMeta";
import type { InvoicesState } from "../hooks/useInvoices";

export function KpiSummaryCards({ s }: { s: InvoicesState }) {
  const { metrics } = s;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Volume */}
        <Card className="p-3.5 sm:p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 dark:text-zinc-400">
              Total Requests
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              {metrics.totalCount}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              ({formatMoney(metrics.totalVolume)})
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
            All active wire transfers &amp; scheduled payments
          </p>
        </Card>

        {/* Pending Payment */}
        <Card className="p-3.5 sm:p-4 rounded-xl border border-amber-200/70 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/20 backdrop-blur-sm shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-amber-700 dark:text-amber-400">
              Pending Payment
            </span>
            <div className="p-1.5 rounded-lg bg-amber-100/80 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              {formatMoney(metrics.pendingAmount)}
            </span>
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              {metrics.pendingCount} req
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
            Waiting Payment &amp; Invoice Received
          </p>
        </Card>

        {/* Wire Info Configured */}
        <Card className="p-3.5 sm:p-4 rounded-xl border border-emerald-200/70 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/20 backdrop-blur-sm shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-emerald-700 dark:text-emerald-400">
              Wire Details Ready
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-100/80 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-300">
              {metrics.wireCount}
            </span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {metrics.wirePercent}% configured
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
            Ready for banking execution
          </p>
        </Card>

        {/* Overdue */}
        <Card className={`p-3.5 sm:p-4 rounded-xl border shadow-2xs backdrop-blur-sm ${
          metrics.overdueCount > 0
            ? "border-red-200/80 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/20"
            : "border-slate-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80"
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-semibold tracking-wider uppercase ${
              metrics.overdueCount > 0 ? "text-red-700 dark:text-red-400" : "text-slate-500 dark:text-zinc-400"
            }`}>
              Overdue Due Date
            </span>
            <div className={`p-1.5 rounded-lg ${
              metrics.overdueCount > 0
                ? "bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400"
                : "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400"
            }`}>
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-xl sm:text-2xl font-bold tracking-tight ${
              metrics.overdueCount > 0 ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-zinc-100"
            }`}>
              {metrics.overdueCount}
            </span>
            {metrics.overdueCount > 0 && (
              <span className="text-xs font-medium text-red-600 dark:text-red-400">
                ({formatMoney(metrics.overdueAmount)})
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
            {metrics.overdueCount > 0 ? "Requires urgent payment action" : "All payments on schedule"}
          </p>
        </Card>
      </div>
  );
}
