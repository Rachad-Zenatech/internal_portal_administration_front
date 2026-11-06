import { Layers, PenTool, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SendQuoteModal } from "../modals/SendQuoteModal";
import type { QuoteDetailPageGuardedState } from "./hooks/useQuoteDetailPage";
import { useQuoteDetailPageTail } from "./hooks/useQuoteDetailPageTail";
import { TopNavigationBar } from "./sections/TopNavigationBar";
import { MainHeaderTitleCard } from "./sections/MainHeaderTitleCard";
import { QuoteContentColumn } from "./sections/QuoteContentColumn";
import { QuoteSideColumn } from "./sections/QuoteSideColumn";
import { RecordPaymentModal } from "./sections/RecordPaymentModal";

export function QuoteDetailPageBody({ s }: { s: QuoteDetailPageGuardedState }) {
  const v = { ...s, ...useQuoteDetailPageTail(s) };
  const { refetchLogs, refetch, setIsSendModalOpen, isSendModalOpen, quote, revisionMutation, navigate, isChanges, isSuperseded } = v;
  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6 print:min-h-0 print:p-0 print:m-0 print:bg-white print:w-full print:space-y-4">
      {/* ── Top Navigation Bar ── */}
      <TopNavigationBar v={v} />

      {/* ── Prominent Superseded / Disabled Banner ── */}
      {isSuperseded && (
        <div className="bg-slate-100 dark:bg-slate-800/80 border-2 border-slate-300 dark:border-slate-700 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
              <Layers className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                This Quotation Version (v{quote.current_version}) is Disabled
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                A new revision has been created to supersede this version. Access links for this version have been revoked.
              </p>
            </div>
          </div>
          {quote.superseded_by_id && (
            <Button
              size="sm"
              onClick={() => navigate(`/account-receivable/quotes/${quote.superseded_by_id}`)}
              className="text-xs rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1.5 cursor-pointer shrink-0 self-end md:self-center"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Go to Revision v{quote.superseded_by_version || quote.current_version + 1}</span>
            </Button>
          )}
        </div>
      )}

      {/* ── Prominent Customer Change Request Alert Banner ── */}
      {!isSuperseded && isChanges && (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-amber-950/40 border-2 border-amber-300 dark:border-amber-700/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <XCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                  Customer Requested Changes / Required Documents
                </h3>
                {quote.change_requested_at && (
                  <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400">
                    • {new Date(quote.change_requested_at).toLocaleString()}
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-900 dark:text-amber-300 bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-amber-200/80 dark:border-amber-800/60 font-medium">
                "{quote.change_request_message || "Customer requested adjustments prior to acceptance."}"
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <Button
              size="sm"
              onClick={() => navigate(`/account-receivable/generate-quote?id=${quote.id}`)}
              className="text-xs rounded-xl bg-slate-800 hover:bg-slate-900 text-white gap-1.5 cursor-pointer"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Edit Quote</span>
            </Button>
            <Button
              size="sm"
              onClick={() => revisionMutation.mutate(quote.id)}
              disabled={revisionMutation.isPending}
              className="text-xs rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1.5 cursor-pointer shadow-xs"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{revisionMutation.isPending ? "Creating..." : "Create Revision v" + ((quote.current_version || 1) + 1)}</span>
            </Button>
          </div>
        </div>
      )}

      {/* ── Main Header Title Card ── */}
      <MainHeaderTitleCard v={v} />

      {/* ── 2-Column Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block print:w-full print:m-0 print:p-0">
        {/* Left Column (2 Cols): Document Details & Line Items */}
        <QuoteContentColumn v={v} />

        {/* Right Column (1 Col): Security Link, Payments, and Audit Logs */}
        <QuoteSideColumn v={v} />
      </div>

      {/* ── Modals ── */}
      {/* Send Quote Modal */}
      {quote && (
        <SendQuoteModal
          quote={quote}
          isOpen={isSendModalOpen}
          onClose={() => {
            setIsSendModalOpen(false);
            refetch();
            refetchLogs();
          }}
        />
      )}

      {/* Record Payment Modal */}
      <RecordPaymentModal v={v} />
    </div>
  );
}
