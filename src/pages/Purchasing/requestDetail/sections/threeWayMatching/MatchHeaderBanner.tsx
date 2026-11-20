import { CheckCircle2, AlertCircle, AlertTriangle, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ThreeWayMatchSummary } from "./types";

interface Props {
  summary: ThreeWayMatchSummary;
}

export function MatchHeaderBanner({ summary }: Props) {
  const { overallStatus, readyCount, statusText, po, receipt, invoice } = summary;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-zinc-800">
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
          Match Verification Status:
        </span>
        {overallStatus === "FULLY_MATCHED" && (
          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1.5 text-xs font-semibold px-2.5 py-0.5 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>3-Way Fully Matched (3/3 Ready)</span>
          </Badge>
        )}
        {overallStatus === "INCOMPLETE" && (
          <Badge variant="outline" className={`gap-1.5 text-xs font-semibold px-2.5 py-0.5 ${
            readyCount === 2
              ? "bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300"
              : "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300"
          }`}>
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>{statusText}</span>
          </Badge>
        )}
        {overallStatus === "MISMATCHED" && (
          <Badge variant="destructive" className="gap-1.5 text-xs font-semibold px-2.5 py-0.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{statusText}</span>
          </Badge>
        )}

        {/* 3-component quick progress pills */}
        <div className="hidden lg:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-[10px] text-slate-600 dark:text-zinc-300 font-medium">
          <span className={po.state === "PRESENT" ? "text-emerald-600 font-semibold" : "text-slate-400"}>
            PO {po.state === "PRESENT" ? "✓" : "○"}
          </span>
          <span className="text-slate-300">|</span>
          <span className={receipt.state === "PRESENT" ? "text-emerald-600 font-semibold" : "text-slate-400"}>
            Receipt {receipt.state === "PRESENT" ? "✓" : "○"}
          </span>
          <span className="text-slate-300">|</span>
          <span className={invoice.state === "PRESENT" ? "text-emerald-600 font-semibold" : "text-slate-400"}>
            Invoice {invoice.state === "PRESENT" ? "✓" : "○"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-zinc-400 bg-slate-100/70 dark:bg-zinc-800/60 px-2.5 py-1 rounded-md border border-slate-200 dark:border-zinc-700/60">
        <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
        <span>AP Focus: Invoice &amp; PO Matching (Coding pre-assigned)</span>
      </div>
    </div>
  );
}
