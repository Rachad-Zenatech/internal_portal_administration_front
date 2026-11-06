import { AlertCircle, Building2, Calendar, Check, CheckCircle2, Clock, CreditCard, FileCheck2, Layers, Link as LinkIcon, PenTool, Receipt, RefreshCw, Send, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuoteStepper } from "../../components/QuoteStepper";
import { formatDateOnly } from "../../utils/lineItemPricingUtils";
import type { QuoteDetailPageViewState } from "../hooks/useQuoteDetailPageTail";

export function MainHeaderTitleCard({ v }: { v: QuoteDetailPageViewState }) {
  const { navigate, quote, isPaid, isSuperseded, setIsPaymentModalOpen, hasInvoice, convertInvoiceMutation, isSigned, revisionMutation, isChanges, copiedLink, handleCopyLink, setIsSendModalOpen, isPublished, publishMutation, isDraft, effectiveTotal, isRenewalQuote } = v;
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-5 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-mono">
                {quote.quote_number}
              </h1>
              <Badge variant="outline" className="font-mono text-xs bg-slate-50 dark:bg-slate-800">
                Revision v{quote.current_version}
              </Badge>
              {isRenewalQuote && (
                <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800 text-xs font-semibold gap-1 px-2 py-0.5">
                  <RefreshCw className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                  <span>Renewal Quote</span>
                  {quote.source_invoice_number && (
                    <span className="font-normal opacity-80 text-[11px]">(From #{quote.source_invoice_number})</span>
                  )}
                </Badge>
              )}
              {quote.parent_quote_id && (
                <Badge
                  variant="outline"
                  onClick={() => navigate(`/account-receivable/quotes/${quote.parent_quote_id}`)}
                  className="font-mono text-[11px] bg-slate-50 dark:bg-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                >
                  Derived from v{quote.parent_quote_version || quote.current_version - 1}
                </Badge>
              )}
              {isSuperseded ? (
                <Badge className="bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-semibold">
                  Disabled (Moved to v{quote.superseded_by_version || quote.current_version + 1})
                </Badge>
              ) : isPublished ? (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 text-xs font-medium">
                  Published
                </Badge>
              ) : isDraft ? (
                <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 text-xs font-medium">
                  Draft
                </Badge>
              ) : null}
              {!isSuperseded && isSigned ? (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 text-xs gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Accepted & Signed</span>
                </Badge>
              ) : !isSuperseded && isChanges ? (
                <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs font-bold gap-1 animate-pulse">
                  <XCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Changes Requested</span>
                </Badge>
              ) : !isSuperseded && (
                <Badge variant="outline" className="text-xs text-slate-500">
                  Awaiting Customer Response
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-zinc-400 flex-wrap pt-1">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <strong>{quote.customer_name || "Direct Client"}</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Date: {formatDateOnly(quote.quote_date, "MMM d, yyyy")}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Validity: {quote.terms || `${quote.validity_days || 30} days`}
                {quote.valid_until && ` (Valid until ${formatDateOnly(quote.valid_until, "MMM d, yyyy")})`}
              </span>
            </div>
          </div>

          {/* Amount Badge */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 self-start lg:self-auto">
            <div>
              <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Total Value</div>
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                ${effectiveTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                <span className="text-xs font-normal text-slate-500">{quote.currency}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Workflow Action Bar / Stepper (Purchasing Request Layout) ── */}
        <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Workflow Status</span>
            </span>
            <span className="text-xs">
              {isSuperseded ? (
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  ⏸ Version Disabled (Superseded by v{quote.superseded_by_version || quote.current_version + 1})
                </span>
              ) : isPaid ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Quotation &amp; Payment Cycle Completed</span>
                </span>
              ) : hasInvoice ? (
                <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                  Invoice Generated • Awaiting Payment Collection &amp; Settlement
                </span>
              ) : isSigned ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Proposal Signed &amp; Verified — Ready for Invoice Generation</span>
                </span>
              ) : isChanges ? (
                <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Action Required: Customer Requested Changes</span>
                </span>
              ) : isPublished ? (
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  Live Customer Portal Active • Awaiting Client Review &amp; E-Sign
                </span>
              ) : (
                <span className="text-slate-500 dark:text-zinc-400 font-medium">
                  Draft Mode • Finalize Line Items &amp; Publish
                </span>
              )}
            </span>
          </div>

          {/* Stepper Pipeline (Horizontal Connected Pill Track matching Purchasing Request) */}
          <div className="py-1">
            <QuoteStepper quote={quote} />
          </div>

          {/* Action Prompt Banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 flex items-center justify-between flex-wrap gap-3">
            <div className="text-xs text-slate-700 dark:text-zinc-300 flex items-center gap-2 flex-wrap">
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {isPaid ? "Status:" : isSuperseded ? "Notice:" : "Action Required:"}
              </span>
              {isSuperseded ? (
                <span>
                  This quotation version (v{quote.current_version}) is disabled. Workflow continues on revision{" "}
                  <strong>v{quote.superseded_by_version || quote.current_version + 1}</strong>.
                </span>
              ) : isPaid ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  Payment of ${effectiveTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {quote.currency} has been settled.
                </span>
              ) : hasInvoice ? (
                <span>
                  Invoice #{quote.invoice_id?.slice(0, 8)} generated. Record settlement when payment arrives.
                </span>
              ) : isSigned ? (
                <span>
                  Proposal accepted and signed by <strong>{quote.signer_name || "Customer"}</strong>. Click <strong>'Generate Invoice'</strong> to create Accounts Receivable invoice.
                </span>
              ) : isChanges ? (
                <span>
                  Customer requested revisions. Review discussion notes below or click <strong>'Create Revision'</strong> to generate v{((quote.current_version || 1) + 1)}.
                </span>
              ) : isPublished && (quote.active_links_count || 0) === 0 ? (
                <span>
                  Proposal published. Click <strong>'Send to Customer'</strong> or copy the live link to deliver to the client.
                </span>
              ) : isPublished ? (
                <span>
                  Live link is active. Customer is reviewing the proposal. You can collaborate in the <strong>Documents &amp; Notes</strong> thread below.
                </span>
              ) : (
                <span>
                  Quotation in draft. Click <strong>'Publish'</strong> to activate the secure customer portal.
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {isSuperseded && quote.superseded_by_id && (
                <Button
                  size="sm"
                  onClick={() => navigate(`/account-receivable/quotes/${quote.superseded_by_id}`)}
                  className="h-8 text-xs rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium gap-1.5 cursor-pointer shadow-xs"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Go to Revision v{quote.superseded_by_version || quote.current_version + 1}</span>
                </Button>
              )}

              {!isSuperseded && isDraft && (
                <>
                  <Button
                    size="sm"
                    onClick={() => publishMutation.mutate(quote.id)}
                    disabled={publishMutation.isPending}
                    className="h-8 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{publishMutation.isPending ? "Publishing..." : "Publish Proposal"}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/account-receivable/generate-quote?id=${quote.id}`)}
                    className="h-8 text-xs rounded-xl border-slate-200 dark:border-slate-800 cursor-pointer gap-1.5"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Edit Line Items</span>
                  </Button>
                </>
              )}

              {!isSuperseded && isPublished && !isSigned && !isChanges && (
                <>
                  <Button
                    size="sm"
                    onClick={() => setIsSendModalOpen(true)}
                    className="h-8 text-xs rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send to Customer</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="h-8 text-xs rounded-xl border-slate-200 dark:border-slate-800 cursor-pointer gap-1.5"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>{copiedLink ? "Link Copied!" : "Copy Portal Link"}</span>
                  </Button>
                </>
              )}

              {!isSuperseded && isChanges && (
                <>
                  <Button
                    size="sm"
                    onClick={() => revisionMutation.mutate(quote.id)}
                    disabled={revisionMutation.isPending}
                    className="h-8 text-xs rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{revisionMutation.isPending ? "Creating..." : `Create Revision v${(quote.current_version || 1) + 1}`}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/account-receivable/generate-quote?id=${quote.id}`)}
                    className="h-8 text-xs rounded-xl border-slate-200 dark:border-slate-800 cursor-pointer gap-1.5"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Edit Directly</span>
                  </Button>
                </>
              )}

              {!isSuperseded && isSigned && !hasInvoice && (
                <Button
                  size="sm"
                  onClick={() => convertInvoiceMutation.mutate(quote.id)}
                  disabled={convertInvoiceMutation.isPending}
                  className="h-8 text-xs rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>{convertInvoiceMutation.isPending ? "Generating..." : "Generate Invoice"}</span>
                </Button>
              )}

              {!isSuperseded && hasInvoice && !isPaid && (
                <>
                  <Button
                    size="sm"
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="h-8 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 cursor-pointer shadow-xs"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Record Payment</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (quote.invoice_id) {
                        navigate(`/account-receivable/generate-invoice?invoiceId=${quote.invoice_id}`);
                      } else {
                        navigate("/account-receivable?tab=invoices");
                      }
                    }}
                    className="h-8 text-xs rounded-xl border-slate-200 dark:border-slate-800 cursor-pointer gap-1.5"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>View Generated Invoice</span>
                  </Button>
                </>
              )}

              {!isSuperseded && isPaid && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (quote.invoice_id) {
                      navigate(`/account-receivable/generate-invoice?invoiceId=${quote.invoice_id}`);
                    } else {
                      navigate("/account-receivable?tab=invoices");
                    }
                  }}
                  className="h-8 text-xs rounded-xl border-slate-200 dark:border-slate-800 cursor-pointer gap-1.5"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>View Generated Invoice</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}
