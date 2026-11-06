import { Check, CheckCircle2, Clock, FileText, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import type { GenerateInvoiceState } from "../hooks/useGenerateInvoice";

export function RecurringBillingScheduleNext({ s }: { s: GenerateInvoiceState }) {
  const { generateRenewalQuoteMutation, invoiceAmountPaid, calculatedTotals, nextInvoiceEligibility, navigate, isNextInvoiceEligibilityLoading, isRecurringInvoice, currentInvoiceId } = s;
  return (
    <>
      {currentInvoiceId && isRecurringInvoice && (
            <div className="pt-3.5 border-t border-border space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Recurring Billing Schedule &amp; Next Invoice</span>
                </span>
                {nextInvoiceEligibility?.eligible && (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 text-[10px] font-bold gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Eligible for Next Invoice</span>
                  </Badge>
                )}
                {nextInvoiceEligibility?.already_generated && (
                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950/50 dark:text-indigo-300 text-[10px] font-bold gap-1">
                    <Check className="w-3 h-3 text-indigo-600" />
                    <span>Next Period Invoiced</span>
                  </Badge>
                )}
              </div>

              {isNextInvoiceEligibilityLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Checking recurring billing schedule and payment eligibility...</span>
                </div>
              ) : nextInvoiceEligibility?.already_generated ? (
                <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>Next Invoice Already Generated: Draft #{nextInvoiceEligibility.next_invoice_number}</span>
                    </div>
                    <p className="text-[11px] text-indigo-900/70 dark:text-indigo-300/70">
                      The subsequent billing cycle draft has been prepared and linked. Review and send it via the standard workflow when ready.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/account-receivable/generate?invoiceId=${encodeURIComponent(nextInvoiceEligibility.next_invoice_id!)}`)}
                    className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-1.5 shrink-0 cursor-pointer shadow-xs"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Open Draft #{nextInvoiceEligibility.next_invoice_number}</span>
                  </Button>
                </div>
              ) : (calculatedTotals.effectiveBalanceDue === 0 && Number(invoiceAmountPaid) > 0) ? (
                <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Ready for Renewal: Generate Next Quote</span>
                    </div>
                    <p className="text-[11px] text-emerald-900/70 dark:text-emerald-300/70">
                      This invoice is fully settled. Generates a full-term renewal quote consolidating base subscriptions and active add-ons.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => generateRenewalQuoteMutation.mutate()}
                    disabled={generateRenewalQuoteMutation.isPending}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 shrink-0 cursor-pointer shadow-xs"
                  >
                    {generateRenewalQuoteMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>Generate Next Quotes</span>
                  </Button>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Recurring Service Schedule Active</span>
                    </div>
                    <p className="text-[11px] text-amber-900/70 dark:text-amber-300/70">
                      Next renewal quote will become eligible for generation once all invoice payments are settled in full.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-amber-100/80 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border-amber-300 shrink-0 self-start sm:self-center">
                    Awaiting Payment Settlement
                  </Badge>
                </div>
              )}
            </div>
          )}
    </>
  );
}
