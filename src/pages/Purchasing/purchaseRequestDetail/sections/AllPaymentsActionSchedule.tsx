import React from "react";
import { CalendarClock, CheckCircle2, Clock, Receipt, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { formatDate, formatMoney } from "../../utils/purchasingMeta";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PurchaseRequestDetailViewState } from "../hooks/usePurchaseRequestDetailTail";

export function AllPaymentsActionSchedule({ v }: { v: PurchaseRequestDetailViewState }) {
  const { handleOpenRecordPayment, setExpandedInstallments, expandedInstallments, allInstallments, totalCycles, currentCycle, isOngoing } = v;
  return (
    <Card className="shadow-xs border-indigo-100 dark:border-zinc-800">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800 flex flex-row items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-zinc-100">
              <CalendarClock className="h-5 w-5 text-indigo-600" />
              <span>All Payments & Action Items</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Complete breakdown of every scheduled payment cycle, settled status, and next actions.
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 border-indigo-200">
            {isOngoing
              ? `Ongoing Schedule · Cycle ${currentCycle} Active`
              : `${totalCycles || allInstallments.length} Total ${(totalCycles || allInstallments.length) === 1 ? 'Payment' : 'Payments'}`}
          </Badge>
        </CardHeader>

        <CardContent className="p-0 text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/60 text-slate-600 dark:text-zinc-400 font-semibold">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Scheduled Date</th>
                  <th className="py-3 px-4 text-right">Cycle Amount</th>
                  <th className="py-3 px-4 text-right">Balance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">What Needs to Be Done</th>
                  <th className="py-3 px-3 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {allInstallments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      No payment dates generated. Edit the schedule to set frequency or installment dates.
                    </td>
                  </tr>
                ) : (
                  allInstallments.map((inst) => {
                    const isPaid = inst.status === "PAID";
                    const isCurrent = inst.status === "CURRENT";
                    const isExpanded = expandedInstallments[inst.installmentNumber] ?? isCurrent;

                    return (
                      <React.Fragment key={inst.installmentNumber}>
                        <tr
                          onClick={() =>
                            setExpandedInstallments((prev) => ({
                              ...prev,
                              [inst.installmentNumber]: !isExpanded,
                            }))
                          }
                          className={`cursor-pointer hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors ${
                            isCurrent ? "bg-indigo-50/40 dark:bg-indigo-950/20 font-medium" : ""
                          }`}
                        >
                          <td className="py-3 px-4 text-center font-bold text-slate-500">
                            {inst.installmentNumber}
                          </td>
                          <td className="py-3 px-4 font-mono">
                            {formatDate(inst.dueDate)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-zinc-100">
                            {formatMoney(inst.amount)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                            {formatMoney(inst.balance !== undefined && inst.balance !== null ? inst.balance : inst.cumulativeAmount)}
                          </td>
                          <td className="py-3 px-4">
                            {isPaid ? (
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 font-semibold gap-1 text-[11px] py-0.5">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Settled / Paid
                              </Badge>
                            ) : isCurrent ? (
                              <Badge className="bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 font-semibold gap-1 text-[11px] py-0.5">
                                <Clock className="h-3 w-3 text-amber-600" /> Due Now
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-slate-500 border-slate-200 dark:text-zinc-400 text-[11px] py-0.5">
                                Upcoming / Projected
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-700 dark:text-zinc-300">
                            {isPaid ? (
                              <span className="text-emerald-700 dark:text-emerald-400 text-[11px] flex items-center gap-1 font-medium">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                Payment settled & recorded
                              </span>
                            ) : isCurrent ? (
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-7 px-2.5 gap-1.5 font-semibold shadow-2xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenRecordPayment(inst);
                                  }}
                                >
                                  <Receipt className="h-3.5 w-3.5" />
                                  Record Payment
                                </Button>
                                <span className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3 text-amber-600" />
                                  Due Now
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-[11px]">
                                Upcoming cycle
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 mx-auto text-indigo-600 dark:text-indigo-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 mx-auto" />
                            )}
                          </td>
                        </tr>

                        {/* Accordion Drawer for Interest, Principal Paid & Details */}
                        {isExpanded && (
                          <tr className="bg-slate-50/80 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-zinc-800">
                            <td colSpan={7} className="py-3 px-8">
                              <div className="flex flex-wrap items-center gap-6 text-xs">
                                <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-zinc-700">
                                  <span className="text-muted-foreground font-medium">Interest:</span>
                                  <span className="font-mono font-semibold text-slate-800 dark:text-zinc-200">
                                    {inst.interest !== undefined && inst.interest !== null ? formatMoney(inst.interest) : "—"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-zinc-700">
                                  <span className="text-muted-foreground font-medium">Principal Paid:</span>
                                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                    {inst.principal_paid !== undefined && inst.principal_paid !== null ? formatMoney(inst.principal_paid) : "—"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-zinc-700">
                                  <span className="text-muted-foreground font-medium">Remaining Balance:</span>
                                  <span className="font-mono font-semibold text-slate-700 dark:text-zinc-300">
                                    {formatMoney(inst.balance !== undefined && inst.balance !== null ? inst.balance : inst.cumulativeAmount)}
                                  </span>
                                </div>
                                {inst.note && (
                                  <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <span className="font-medium">Note:</span>
                                    <span className="italic">{inst.note}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
  );
}
