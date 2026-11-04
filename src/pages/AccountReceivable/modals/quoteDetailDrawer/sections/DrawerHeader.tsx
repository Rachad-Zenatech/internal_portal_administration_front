import { Check, CheckCircle2, CreditCard, FileCheck2, FileSpreadsheet, History, Layers, Link as LinkIcon, Plus, Receipt, RefreshCw, RotateCcw, Send, ShieldX, Trash2, X } from "lucide-react";
import { Button } from "../../../../../components/ui/button";
import { Badge } from "../../../../../components/ui/badge";
import { QuoteStepper } from "../../../components/QuoteStepper";
import type { QuoteDetailDrawerViewState } from "../hooks/useQuoteDetailDrawerTail";

export function DrawerHeader({ v }: { v: QuoteDetailDrawerViewState }) {
  const { auditLogs, effectiveTax, effectiveDiscount, effectiveSubtotal, quote, effectiveTotal, isSigned, isChanges, revisionMutation, setIsPaymentModalOpen, setPaymentAmount, isPaid, hasInvoice, convertInvoiceMutation, draftMutation, revokeLinksMutation, copiedLink, handleCopyLink, setIsSendModalOpen, isPublished, deleteMutation, publishMutation, isDraft, isSuperseded, onClose, isRenewal } = v;
  return (
    <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{quote.quote_number}</span>
                <Badge variant="outline" className="font-mono text-xs">
                  v{quote.current_version}
                </Badge>
                {isRenewal && (
                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800 text-[10px] font-semibold gap-1 px-1.5 py-0.5">
                    <RefreshCw className="w-2.5 h-2.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Renewal</span>
                  </Badge>
                )}
              </h2>
              {isSuperseded ? (
                <Badge className="bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-semibold">
                  Disabled (Moved to v{quote.superseded_by_version || quote.current_version + 1})
                </Badge>
              ) : isDraft ? (
                <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  Draft
                </Badge>
              ) : isPublished && !isSigned ? (
                <Badge className="bg-amber-50 text-amber-700 border-amber-300">
                  Published
                </Badge>
              ) : null}
              {!isSuperseded && isSigned && (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Signed</span>
                </Badge>
              )}
              {!isSuperseded && isChanges && (
                <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-bold animate-pulse">
                  Changes Requested
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Quotation for <strong>{quote.customer_name}</strong> • Created on {new Date(quote.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* 1. Workflow Lifecycle Stepper */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-600" />
                <span>Workflow Status</span>
              </span>
              <span className="text-[11px] text-slate-500">
                {isSuperseded ? (
                  <span className="text-slate-500 font-medium">Version Disabled</span>
                ) : isPaid ? (
                  <span className="text-emerald-600 font-semibold">Payment Settled</span>
                ) : hasInvoice ? (
                  <span className="text-indigo-600 font-medium">Invoice Generated</span>
                ) : isSigned ? (
                  <span className="text-emerald-600 font-medium">Proposal Signed</span>
                ) : isChanges ? (
                  <span className="text-amber-600 font-bold">Action Needed</span>
                ) : isPublished ? (
                  <span className="text-amber-600 font-medium">Live Portal Active</span>
                ) : (
                  <span className="text-slate-500">Draft Mode</span>
                )}
              </span>
            </div>

            <div className="py-1">
              <QuoteStepper quote={quote} />
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            {isDraft && (
              <>
                <Button
                  size="sm"
                  onClick={() => publishMutation.mutate(quote.id)}
                  disabled={publishMutation.isPending}
                  className="gap-1.5 text-xs rounded-xl bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Publish Quote</span>
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
                  className="gap-1.5 text-xs rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:border-rose-800 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Delete Draft</span>
                </Button>
              </>
            )}

            {isPublished && !isSigned && (
              <>
                <Button
                  size="sm"
                  onClick={() => setIsSendModalOpen(true)}
                  className="gap-1.5 text-xs rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send to Customer</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="gap-1.5 text-xs rounded-xl cursor-pointer"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>{copiedLink ? "Link Copied!" : "Generate Customer Link"}</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => revokeLinksMutation.mutate(quote.id)}
                  disabled={revokeLinksMutation.isPending}
                  className="gap-1.5 text-xs rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                >
                  <ShieldX className="w-3.5 h-3.5" />
                  <span>Revoke Access</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => draftMutation.mutate(quote.id)}
                  disabled={draftMutation.isPending}
                  className="gap-1.5 text-xs rounded-xl text-slate-600 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Move to Draft</span>
                </Button>
              </>
            )}

            {isSigned && !hasInvoice && (
              <Button
                size="sm"
                onClick={() => convertInvoiceMutation.mutate(quote.id)}
                disabled={convertInvoiceMutation.isPending}
                className="gap-1.5 text-xs rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white cursor-pointer shadow-xs"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Convert to Invoice (To Invoice)</span>
              </Button>
            )}

            {hasInvoice && !isPaid && (
              <Button
                size="sm"
                onClick={() => {
                  setPaymentAmount(quote.total_amount - quote.paid_amount);
                  setIsPaymentModalOpen(true);
                }}
                className="gap-1.5 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Record Payment Received</span>
              </Button>
            )}

            {(isSigned || isChanges) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => revisionMutation.mutate(quote.id)}
                disabled={revisionMutation.isPending}
                className="gap-1.5 text-xs rounded-xl border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Revision</span>
              </Button>
            )}
          </div>

          {/* Customer Change Request Notice */}
          {isChanges && (
            <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/80 space-y-2">
              <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>Customer Requested Changes / Required Documents</span>
              </span>
              <p className="text-xs text-amber-950 dark:text-amber-200 bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
                "{quote.change_request_message || "Customer requested adjustments prior to acceptance."}"
              </p>
              {quote.change_requested_at && (
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-mono block">
                  Requested at: {new Date(quote.change_requested_at).toLocaleString()}
                </span>
              )}
            </div>
          )}

          {/* 2. Customer Acceptance & Signature Details */}
          {isSigned && (
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3">
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <span>Customer Acceptance &amp; Signature Record</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700 dark:text-slate-300">
                <div>
                  <span className="text-slate-400 block text-[10px]">Signer Name &amp; Title</span>
                  <strong className="text-slate-900 dark:text-white">{quote.signer_name}</strong>
                  <span className="text-slate-500 block text-[11px]">{quote.signer_title || "Authorized Representative"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Signed Date &amp; IP</span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium">
                    {quote.signed_at ? new Date(quote.signed_at).toLocaleString() : "N/A"}
                  </span>
                  <span className="text-slate-400 block text-[10px] font-mono">{quote.signed_ip || "Direct browser"}</span>
                </div>
              </div>

              {quote.signature_data_url && (
                <div className="pt-2 border-t border-emerald-100 dark:border-emerald-900/50">
                  <span className="text-slate-400 block text-[10px] mb-1">Handwritten Signature Image</span>
                  <div className="h-16 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 flex items-center justify-center">
                    <img src={quote.signature_data_url} alt="Signature" className="max-h-full max-w-full object-contain" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. Items & Pricing Summary */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Line Items ({quote.line_items.length})</span>
              </span>
              <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                ${effectiveTotal.toFixed(2)} {quote.currency}
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {quote.line_items.map((item, idx) => (
                <div key={idx} className="py-2 flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <strong className="text-slate-800 dark:text-zinc-200">{item.name}</strong>
                      {item.billing_frequency && (
                        <Badge variant="outline" className="text-[9.5px] px-1.5 py-0 font-medium">
                          {item.billing_frequency}
                        </Badge>
                      )}
                    </div>
                    {item.description && <p className="text-[10px] text-slate-400">{item.description}</p>}
                  </div>
                  <div className="text-right font-mono">
                    <span>{item.quantity} × ${Number(item.price).toFixed(2)}</span>
                    <strong className="block text-slate-900 dark:text-white">${Number(item.subtotal).toFixed(2)}</strong>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[11px] text-slate-500">
              <span>Subtotal: ${effectiveSubtotal.toFixed(2)}</span>
              <span>Discount: -${effectiveDiscount.toFixed(2)}</span>
              <span>Tax: +${effectiveTax.toFixed(2)}</span>
            </div>
          </div>

          {/* 4. Immutable Audit Log Trail */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-4 h-4 text-blue-600" />
              <span>Full Audit History &amp; Timeline ({auditLogs.length})</span>
            </span>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[9px] font-mono uppercase bg-white dark:bg-slate-900">
                        {log.event_type}
                      </Badge>
                      <span className="font-semibold text-slate-800 dark:text-zinc-200">
                        {log.actor_name || log.actor_email || log.actor_type}
                      </span>
                    </div>
                    {log.details && (
                      <p className="text-[10px] text-slate-500">
                        {typeof log.details === "object" ? JSON.stringify(log.details) : log.details}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
  );
}
