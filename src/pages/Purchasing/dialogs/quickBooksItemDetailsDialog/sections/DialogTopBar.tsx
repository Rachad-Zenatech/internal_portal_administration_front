import { DialogTitle } from "@/components/ui/dialog";
import { History, X, Layers, Code2, CheckCircle2, AlertTriangle, Database, Eye, Split } from "lucide-react";
import type { QuickBooksItemDetailsDialogViewState } from "../hooks/useQuickBooksItemDetailsDialogTail";

export function DialogTopBar({ v }: { v: QuickBooksItemDetailsDialogViewState }) {
  const { onOpenChange, viewMode, setViewMode, displayLines, isMultiPart, isBill, isReady, isError, item, isSynced, isMa, isAr } = v;
  return (
    <div className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-5 py-2.5 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="p-1 rounded-full text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              title="Transaction History / Audit"
            >
              <History className="h-4 w-4" />
            </button>
            <DialogTitle className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 m-0 p-0 flex-wrap">
              <span>{isAr ? "QuickBooks A/R Invoice & Deposit" : isBill ? "QuickBooks Bill" : "QuickBooks Expense"}</span>

              {/* A/R Badge Tag */}
              {isAr && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300 border border-teal-300 dark:border-teal-700 flex items-center gap-1 shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-600 dark:bg-teal-400" />
                  <span>Reconciled Cash App</span>
                </span>
              )}

              {/* M&A Badge Tag */}
              {isMa && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-700 flex items-center gap-1 shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-600 dark:bg-purple-400" />
                  <span>M&amp;A Scheduled</span>
                </span>
              )}

              {/* Recurring Badge Tag (for non-M&A Bills) */}
              {!isAr && !isMa && item.is_recurring && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                  <span>Recurring Bill</span>
                </span>
              )}

              {isSynced ? (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  <span>QBO #{isBill ? (item.existing_bill_id || item.doc_number) : (item.existing_purchase_id || item.doc_number)}</span>
                </span>
              ) : isError ? (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-rose-600 dark:text-rose-400" />
                  <span>Validation Error</span>
                </span>
              ) : isReady ? (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                  <span>Staged for QBO {isBill ? "Bills" : "Expenses"}</span>
                </span>
              ) : (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Requires Mapping</span>
                </span>
              )}

              {isMultiPart && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                  <Split className="h-3 w-3 text-indigo-500" />
                  <span>{displayLines.length} Split Parts</span>
                </span>
              )}
            </DialogTitle>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-md border border-slate-200 dark:border-zinc-700 text-[11px]">
              <button
                type="button"
                onClick={() => setViewMode("form")}
                className={`px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1.5 ${
                  viewMode === "form"
                    ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-2xs font-semibold"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
                }`}
              >
                <Eye className="h-3.5 w-3.5 text-[#2ca01c]" />
                <span>QuickBooks Form</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("mapping")}
                className={`px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1.5 ${
                  viewMode === "mapping"
                    ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-2xs font-semibold"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
                }`}
              >
                <Layers className="h-3.5 w-3.5 text-blue-600" />
                <span>GL &amp; Account Mapping</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("json")}
                className={`px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1.5 ${
                  viewMode === "json"
                    ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-2xs font-semibold"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
                }`}
              >
                <Code2 className="h-3.5 w-3.5 text-purple-600" />
                <span>REST JSON</span>
              </button>
            </div>

            {/* Close button */}
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors ml-1"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
  );
}
