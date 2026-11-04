import { CheckCircle2, Receipt, AlertTriangle, UserCheck } from "lucide-react";
import { Badge } from "../../../../components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "../../../../components/ui/card";
import type { MatchedInvoiceItem } from "../../../../types/ar";
import type { WorkflowDetailViewState } from "../hooks/useWorkflowDetailTail";

export function MatchStatusCallout({ v }: { v: WorkflowDetailViewState }) {
  const { workflow, isPartiallyPaid, currentType } = v;
  return (
    <>
      {currentType === "CASH" && (
            <Card className="shadow-xs border-slate-200 dark:border-zinc-800">
              <CardHeader className="bg-emerald-50/30 dark:bg-emerald-950/20 border-b border-slate-100 dark:border-zinc-800 px-6 py-3.5 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-zinc-100">
                  <Receipt className="h-5 w-5 text-emerald-600" />
                  <span>Treasury Invoice Matching & Reconciliation</span>
                </CardTitle>
                <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                  {workflow.metadata?.matched_invoices?.length || (workflow.metadata?.matched_invoice_id ? 1 : 0)} Matched Invoice(s)
                </Badge>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-zinc-800">
                  <table className="w-full text-left text-xs table-fixed">
                    <thead className="bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-200 dark:border-zinc-800 text-slate-500 uppercase text-[10px] font-semibold">
                      <tr>
                        <th className="py-2.5 px-3 w-[35%]">Invoice Number</th>
                        <th className="py-2.5 px-3 text-right w-[20%]">Invoice Total</th>
                        <th className="py-2.5 px-3 text-right w-[20%]">Amount Applied</th>
                        <th className="py-2.5 px-3 text-right w-[15%]">Remaining</th>
                        <th className="py-2.5 px-3 text-center w-[10%]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                      {workflow.metadata?.matched_invoices && workflow.metadata.matched_invoices.length > 0 ? (
                        workflow.metadata.matched_invoices.map((inv: MatchedInvoiceItem, i: number) => (
                          <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-zinc-100 truncate">
                              {inv.invoice_number}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono truncate">
                              ${Number(inv.invoice_total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 truncate">
                              ${Number(inv.amount_applied).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-500 truncate">
                              ${Number(inv.balance_remaining).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              {inv.status === "FULLY_PAID" ? (
                                <Badge variant="outline" className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200">
                                  Fully Paid
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] font-bold bg-amber-50 text-amber-700 border-amber-200">
                                  Partially Paid
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-zinc-100 truncate">
                            {workflow.metadata?.matched_invoice_id || "INV-2026-DEFAULT"}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono truncate">
                            ${Number(workflow.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 truncate">
                            ${Number(workflow.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-500 truncate">
                            $0.00
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <Badge variant="outline" className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200">
                              Fully Paid
                            </Badge>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Match Status Callout */}
                {isPartiallyPaid ? (
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-2">
                    <div className="flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="font-bold flex items-center justify-between flex-wrap gap-1">
                          <span>Partially Paid Settlement — Routed to AR Clerk</span>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                            Shortfall Action Active
                          </span>
                        </p>
                        <p className="text-[11px] opacity-90 break-words">
                          The bank payment received does not satisfy the total matched invoice obligations. As per AR policy, this case has been assigned to the AR Clerk to review deductions and mark the settlement in the application.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2 text-xs border-t border-amber-200 dark:border-amber-800/60">
                      <div>
                        <span className="text-muted-foreground text-[10px] block font-medium">
                          Assigned AR Clerk
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5 mt-0.5">
                          <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                          {workflow.metadata?.ar_clerk_assigned_to || "sarah.jenkins@zenatech.com"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-[10px] block font-medium">
                          AR Clerk Follow-up / Discrepancy Reason
                        </span>
                        <div className="mt-1 p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-800/60">
                          <p className="font-medium text-slate-800 dark:text-zinc-200 italic break-words leading-relaxed">
                            {workflow.metadata?.ar_clerk_notes || "Under dispute review / withholding deduction"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">
                        Full Paid Reconciled — Direct Record & Settlement
                      </p>
                      <p className="text-[11px] opacity-90 mt-0.5 break-words">
                        Bank deposit (${Number(workflow.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}) fully covers all invoice requirements. Treasury has posted the reconciliation directly to the application ledger.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
    </>
  );
}
