import { ArrowLeft, Check, Download, FileCheck2, Layers, PenTool, RefreshCw, RotateCcw, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { QuoteDetailPageViewState } from "../hooks/useQuoteDetailPageTail";

export function TopNavigationBar({ v }: { v: QuoteDetailPageViewState }) {
  const { revisionMutation, quote, isChanges, isSigned, isSuperseded, convertInvoiceMutation, draftMutation, isPublished, deleteMutation, publishMutation, navigate, setIsSendModalOpen, isRenewalQuote } = v;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/account-receivable?tab=quotes")}
            className="h-8 text-xs gap-1.5 rounded-xl border-slate-200 dark:border-slate-800 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Quotes</span>
          </Button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
              {quote.quote_number}
            </span>
            <Badge
              variant="outline"
              className={`text-[10px] font-mono uppercase ${
                isSuperseded
                  ? "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300"
                  : isSigned
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                  : isPublished
                  ? "bg-amber-50 text-amber-700 border-amber-300"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              {isSuperseded
                ? `Disabled (Moved to v${quote.superseded_by_version || quote.current_version + 1})`
                : isSigned
                ? "Accepted / Signed"
                : isPublished
                ? "Published"
                : "Draft"}
            </Badge>

            {isRenewalQuote && (
              <Badge
                variant="outline"
                className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 gap-1"
              >
                <RefreshCw className="w-2.5 h-2.5 text-indigo-600 dark:text-indigo-400" />
                <span>Renewal Quotation</span>
                {quote.source_invoice_number && (
                  <span className="font-normal opacity-80">(From #{quote.source_invoice_number})</span>
                )}
              </Badge>
            )}
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-2 flex-wrap print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="h-8 text-xs rounded-xl border-slate-200 dark:border-slate-800 cursor-pointer gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download PDF</span>
          </Button>

          {isSuperseded && quote.superseded_by_id && (
            <Button
              size="sm"
              onClick={() => navigate(`/account-receivable/quotes/${quote.superseded_by_id}`)}
              className="h-8 text-xs rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium gap-1.5 cursor-pointer shadow-xs"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>View Latest Revision (v{quote.superseded_by_version || quote.current_version + 1})</span>
            </Button>
          )}

          {/* Send to Customer (Only if not superseded) */}
          {!isSuperseded && isPublished && !isSigned && (
            <Button
              size="sm"
              onClick={() => setIsSendModalOpen(true)}
              className="h-8 text-xs rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium gap-1.5 cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send to Customer</span>
            </Button>
          )}

          {/* Edit Draft (Only if not superseded and not signed) */}
          {!isSuperseded && !isSigned && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/account-receivable/generate-quote?id=${quote.id}`)}
              className="h-8 text-xs rounded-xl border-slate-200 dark:border-slate-800 cursor-pointer gap-1.5"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Edit Quote</span>
            </Button>
          )}

          {/* Publish / Draft Toggle */}
          {!isSuperseded && !isSigned && !isPublished && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => publishMutation.mutate(quote.id)}
                disabled={publishMutation.isPending}
                className="h-8 text-xs rounded-xl border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer gap-1.5"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Publish</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete draft quote ${quote.quote_number}? This action cannot be undone.`)) {
                    deleteMutation.mutate(quote.id);
                  }
                }}
                disabled={deleteMutation.isPending}
                className="h-8 text-xs rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:border-rose-800 cursor-pointer gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete Draft</span>
              </Button>
            </>
          )}

          {!isSuperseded && !isSigned && isPublished && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => draftMutation.mutate(quote.id)}
              disabled={draftMutation.isPending}
              className="h-8 text-xs rounded-xl border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Move to Draft</span>
            </Button>
          )}

          {/* Convert to Invoice */}
          {!isSuperseded && isSigned && (
            <Button
              size="sm"
              onClick={() => convertInvoiceMutation.mutate(quote.id)}
              disabled={convertInvoiceMutation.isPending}
              className="h-8 text-xs rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium gap-1.5 cursor-pointer shadow-xs"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>{convertInvoiceMutation.isPending ? "Generating..." : "Generate Invoice"}</span>
            </Button>
          )}

          {/* Create Revision */}
          {!isSuperseded && (isSigned || isChanges) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => revisionMutation.mutate(quote.id)}
              disabled={revisionMutation.isPending}
              className="h-8 text-xs rounded-xl border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 cursor-pointer gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{revisionMutation.isPending ? "Creating..." : "Create New Revision"}</span>
            </Button>
          )}
        </div>
      </div>
  );
}
