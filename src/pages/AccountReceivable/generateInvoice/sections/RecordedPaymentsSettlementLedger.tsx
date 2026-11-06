import { CheckCircle2, CreditCard, Plus } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import type { GenerateInvoiceState } from "../hooks/useGenerateInvoice";

export function RecordedPaymentsSettlementLedger({ s }: { s: GenerateInvoiceState }) {
  const { currency, invoicePayments, handleOpenRecordPayment, calculatedTotals, currentInvoiceId } = s;
  return (
    <>
      {currentInvoiceId && (
            <div className="pt-3.5 border-t border-border space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Payment Records &amp; Settlement Ledger</span>
                  </span>
                  <Badge variant="outline" className="text-[10px] font-semibold bg-muted/50">
                    {invoicePayments.length} {invoicePayments.length === 1 ? "record" : "records"}
                  </Badge>
                </div>

                {calculatedTotals.effectiveBalanceDue > 0 ? (
                  <Button
                    size="sm"
                    onClick={handleOpenRecordPayment}
                    className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-semibold px-2.5 shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Record Payment</span>
                  </Button>
                ) : (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 text-[10px] font-bold gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Settled in Full</span>
                  </Badge>
                )}
              </div>

              {invoicePayments.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-border text-center bg-muted/20">
                  <p className="text-xs text-muted-foreground">
                    No payments have been recorded for this invoice yet.
                  </p>
                  {calculatedTotals.effectiveBalanceDue > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenRecordPayment}
                      className="mt-2.5 text-xs h-7 gap-1.5 border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 font-semibold cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Record Initial Payment</span>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border bg-card">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/50 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Method</th>
                        <th className="py-2 px-3">Reference / Tx ID</th>
                        <th className="py-2 px-3">Category (GL Code)</th>
                        <th className="py-2 px-3">Class</th>
                        <th className="py-2 px-3">Notes</th>
                        <th className="py-2 px-3 text-right">Amount Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {invoicePayments.map((p, idx) => (
                        <tr key={p.id || idx} className="hover:bg-muted/30 transition-colors font-medium">
                          <td className="py-2 px-3 font-mono text-foreground whitespace-nowrap">
                            {p.payment_date || "—"}
                          </td>
                          <td className="py-2 px-3">
                            <Badge variant="outline" className="text-[10px] font-bold bg-indigo-50/60 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800">
                              {p.payment_method || "WIRE"}
                            </Badge>
                          </td>
                          <td className="py-2 px-3 font-mono text-muted-foreground">
                            {p.reference_number || "—"}
                          </td>
                          <td className="py-2 px-3 text-muted-foreground font-mono text-[11px]">
                            {p.gl_code || "—"}
                          </td>
                          <td className="py-2 px-3 text-muted-foreground">
                            {p.class_name || "—"}
                          </td>
                          <td className="py-2 px-3 text-muted-foreground truncate max-w-[200px]" title={p.notes}>
                            {p.notes || "—"}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            +${Number(p.amount).toFixed(2)} {currency}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border bg-muted/40 font-semibold text-xs">
                        <td colSpan={6} className="py-2 px-3 text-right text-muted-foreground">
                          Total Payments Recorded:
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          ${invoicePayments.reduce((s, p) => s + (Number(p.amount) || 0), 0).toFixed(2)} {currency}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}
    </>
  );
}
