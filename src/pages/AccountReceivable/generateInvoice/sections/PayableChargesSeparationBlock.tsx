import { CheckCircle2, Clock } from "lucide-react";
import { Badge } from "../../../../components/ui/badge";
import type { GenerateInvoiceState } from "../hooks/useGenerateInvoice";

export function PayableChargesSeparationBlock({ s }: { s: GenerateInvoiceState }) {
  const { computedNextRenewal, currency, calculatedTotals, invoiceStatus, invoiceNumber } = s;
  return (
    <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                {/* Left: Explanation */}
                <div className="space-y-1.5 max-w-md text-xs text-slate-500 dark:text-slate-400">
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Payable Charges Separation</span>
                  </div>
                  <p className="leading-relaxed text-[11.5px]">
                    Only charges belonging directly to this invoice (
                    <strong className="text-slate-700 dark:text-slate-300">{invoiceNumber}</strong>) are included in the balance due.
                    Previously invoiced subscription baselines and reference add-ons remain for audit reference only.
                  </p>
                </div>

                {/* Right: Calculated Breakdown */}
                <div className="w-full md:w-[420px] max-w-md space-y-2 text-xs shrink-0">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>New Charges Subtotal:</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      ${calculatedTotals.newChargesSubtotal.toFixed(2)} {currency}
                    </span>
                  </div>

                  {calculatedTotals.referenceChargesSubtotal > 0 && (
                    <div className="flex justify-between text-slate-400 italic">
                      <span>Previously Invoiced (Reference):</span>
                      <span className="font-mono whitespace-nowrap">
                        ${calculatedTotals.referenceChargesSubtotal.toFixed(2)} {currency}
                      </span>
                    </div>
                  )}

                  {calculatedTotals.totalDiscounts > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Applicable Discounts:</span>
                      <span className="font-mono font-semibold whitespace-nowrap">
                        -${calculatedTotals.totalDiscounts.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {calculatedTotals.totalTaxes > 0 && (
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Estimated Tax:</span>
                      <span className="font-mono font-semibold whitespace-nowrap">
                        +${calculatedTotals.totalTaxes.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {calculatedTotals.totalPaidAmount > 0 ? (
                    <>
                      <div className="flex justify-between text-emerald-600 font-semibold">
                        <span>Amount Paid:</span>
                        <span className="font-mono whitespace-nowrap">
                          -${calculatedTotals.totalPaidAmount.toFixed(2)} {currency}
                        </span>
                      </div>
                      <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <span className="text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            Balance Due on this Invoice:
                          </span>
                          {calculatedTotals.effectiveBalanceDue === 0 && (
                            <Badge className="text-[10px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 font-bold whitespace-nowrap shrink-0">
                              {invoiceStatus || "PAID"}
                            </Badge>
                          )}
                        </div>
                        <div className={`text-lg font-extrabold font-mono whitespace-nowrap shrink-0 ${calculatedTotals.effectiveBalanceDue === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-indigo-600 dark:text-indigo-400"}`}>
                          ${calculatedTotals.effectiveBalanceDue.toFixed(2)} {currency}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                      <span className="text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        Amount Due on this Invoice:
                      </span>
                      <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 font-mono whitespace-nowrap shrink-0">
                        ${calculatedTotals.amountDue.toFixed(2)} {currency}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Next Renewal Projection if applicable */}
              {computedNextRenewal && (
                <div className="mt-2 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-semibold text-slate-900 dark:text-white">Next Renewal — Not Due Now:</span>
                    <span className="text-slate-500">{computedNextRenewal.summary_text}</span>
                  </div>
                  <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    ${Number(computedNextRenewal.total_renewal_amount).toFixed(2)} {computedNextRenewal.currency} ({computedNextRenewal.frequency_label})
                  </div>
                </div>
              )}
            </div>
  );
}
