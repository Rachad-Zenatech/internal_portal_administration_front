import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Paperclip, Code2, Download, Check, Loader2, Zap, ExternalLink } from "lucide-react";
import type { QuickBooksItemDetailsDialogGuardedState } from "./hooks/useQuickBooksItemDetailsDialog";
import { useQuickBooksItemDetailsDialogTail } from "./hooks/useQuickBooksItemDetailsDialogTail";
import { DialogTopBar } from "./sections/DialogTopBar";
import { TopHeroFormFields } from "./sections/TopHeroFormFields";
import { CategoryDetailsBottomTotal } from "./sections/CategoryDetailsBottomTotal";
import { TableOfMappings } from "./sections/TableOfMappings";

export function QuickBooksItemDetailsDialogBody({ s }: { s: QuickBooksItemDetailsDialogGuardedState }) {
  const v = { ...s, ...useQuickBooksItemDetailsDialogTail(s) };
  const { isBill, isSynced, isSyncing, isConnected, item, onSync, onOpenChange, activePayload, copied, handleCopyJson, viewMode, isAr, open } = v;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[98vw] max-w-[1520px] sm:max-w-[98vw] md:max-w-[98vw] lg:max-w-[1520px] h-[95vh] max-h-[96vh] flex flex-col p-0 gap-0 overflow-hidden bg-[#f4f5f8] dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 border border-slate-300 dark:border-zinc-800 shadow-2xl rounded-lg font-sans z-50 text-xs"
      >
        <DialogDescription className="sr-only">
          QuickBooks Online {isAr ? "A/R Invoice" : isBill ? "Bill" : "Expense"} Form and Synchronization Details for {isAr ? `A/R #${item.ref_no || item.request_id}` : `Request #${item.request_id}`}
        </DialogDescription>

        {/* ========================================================================= */}
        {/* QuickBooks Online Top App Header */}
        {/* ========================================================================= */}
        <DialogTopBar v={v} />

        {/* ========================================================================= */}
        {/* Scrollable Body */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB 1: FORM VIEW (BILL OR EXPENSE) */}
          {viewMode === "form" && (
            <div className="space-y-4 max-w-[1460px] mx-auto">
              {/* TOP HERO & FORM FIELDS (White Card) */}
              <TopHeroFormFields v={v} />

              {/* ========================================================================= */}
              {/* SECTION: CATEGORY DETAILS (Multi-Line & Split Support) */}
              {/* ========================================================================= */}
              <CategoryDetailsBottomTotal v={v} />

              {/* ========================================================================= */}
              {/* SECTION: MEMO & ATTACHMENTS (QuickBooks Bottom Layout) */}
              {/* ========================================================================= */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-1">
                {/* Memo Box */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 block">
                    Memo
                  </label>
                  <textarea
                    rows={3}
                    readOnly
                    value={item.memo || `${item.raw_payee} - ${item.product_name} - ${item.location || 'HQ'} - ${item.ref_no}${item.department ? ` - ${item.department}` : ''}`}
                    className="w-full p-2.5 rounded border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden resize-none shadow-2xs font-mono leading-relaxed"
                  />
                </div>

                {/* Attachments Dropzone Box */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 block">
                      Attachments
                    </label>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                      {item.attachments?.length || item.attachments_count || 0} file(s)
                    </span>
                  </div>

                  {item.attachments && item.attachments.length > 0 ? (
                    <div className="p-2 rounded border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1.5 min-h-[80px]">
                      {item.attachments.map((att: any) => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between p-1.5 rounded bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 text-xs"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Paperclip className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate font-medium text-slate-800 dark:text-zinc-200">
                              {att.filename}
                            </span>
                            {att.size_bytes && (
                              <span className="text-[10px] text-slate-500 font-mono">
                                ({(att.size_bytes / 1024).toFixed(1)} KB)
                              </span>
                            )}
                          </div>
                          <a
                            href={`/api/purchasing/requests/${item.request_id}/attachments/${att.id}/download`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-[#2ca01c] hover:underline font-medium shrink-0 ml-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Download className="h-3 w-3" />
                            <span>Download</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded border-2 border-dashed border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900/40 p-3 flex flex-col items-center justify-center text-center space-y-0.5 min-h-[80px]">
                      <Paperclip className="h-4 w-4 text-slate-400 mb-0.5" />
                      <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
                        Add attachment
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Max file size: 20 MB
                      </div>
                      <div className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                        Show existing
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: GL ACCOUNT MAPPING & AUDIT BREAKDOWN */}
          {/* ========================================================================= */}
          <TableOfMappings v={v} />

          {/* ========================================================================= */}
          {/* TAB 3: LIVE REST JSON PAYLOAD */}
          {/* ========================================================================= */}
          {viewMode === "json" && (
            <div className="space-y-3 max-w-[1460px] mx-auto">
              <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-3 rounded border border-slate-200 dark:border-zinc-800 shadow-2xs">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                    <Code2 className="h-3.5 w-3.5 text-purple-600" />
                    <span>QuickBooks Online REST API {isBill ? "Bill" : "Purchase"} Payload</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Payload sent directly to <code className="font-mono text-purple-600 dark:text-purple-400 font-semibold">POST /v3/company/{isBill ? "bill" : "purchase"}</code>.
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyJson}
                  className="h-7 text-xs gap-1.5 font-semibold"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? "Copied!" : "Copy JSON"}</span>
                </Button>
              </div>

              <div className="rounded border border-zinc-800 bg-zinc-950 p-3 font-mono text-[11px] text-zinc-200 overflow-x-auto max-h-[580px] shadow-inner leading-relaxed">
                <pre>{JSON.stringify(activePayload, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* QuickBooks Style Bottom Action Bar */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <Link
              to={`/purchasing/requests/${item.request_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-[#2ca01c] transition-colors"
            >
              <span>View Portal Request #{item.request_id}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs font-semibold border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 h-8 px-3"
            >
              Close
            </Button>

            {onSync && (
              <button
                type="button"
                disabled={!isConnected || isSyncing}
                onClick={async () => {
                  await onSync(item);
                }}
                className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-bold text-white transition-all shadow-xs h-8 ${
                  !isConnected || isSyncing
                    ? "bg-slate-400 cursor-not-allowed opacity-60"
                    : "bg-[#2ca01c] hover:bg-[#248816] active:bg-[#1d6f12]"
                }`}
              >
                {isSyncing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Zap className="h-3.5 w-3.5" />
                )}
                <span>{isSynced ? `Re-Sync to QuickBooks ${isBill ? "Bills" : "Expenses"}` : `Save & Sync to QuickBooks ${isBill ? "Bills" : "Expenses"}`}</span>
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
