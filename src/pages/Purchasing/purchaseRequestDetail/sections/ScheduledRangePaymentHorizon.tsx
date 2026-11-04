import { CalendarClock } from "lucide-react";
import { type FrequencyType } from "@/types/purchasing";
import { formatDate, formatMoney } from "../../utils/purchasingMeta";
import { FREQUENCY_LABELS } from "../../utils/recurringScheduleUtils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PurchaseRequestDetailViewState } from "../hooks/usePurchaseRequestDetailTail";

export function ScheduledRangePaymentHorizon({ v }: { v: PurchaseRequestDetailViewState }) {
  const { setIsScheduleLedgerOpen, paidToDate, totalCommitment, request, sched, currentCycleAmount, allCyclesCompleted, isCustomMilestones, durationInfo } = v;
  return (
    <Card className="shadow-xs border-indigo-100 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-zinc-900">
            <CardHeader className="pb-3 border-b border-indigo-100 dark:border-indigo-900/40">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-indigo-600" />
                  <span>Scheduled Range & Payment Horizon</span>
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4 text-xs">
              {/* Scheduled Horizon Range */}
              <div className="space-y-1">
                <span className="text-muted-foreground font-medium">Scheduled Horizon</span>
                <div className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <span>{formatDate(sched.start_date)}</span>
                  <span className="text-slate-400 font-normal">to</span>
                  <span>{sched.end_date ? formatDate(sched.end_date) : "Ongoing"}</span>
                </div>
              </div>

              {/* Remaining Duration Banner */}
              <div className="p-3 rounded-xl bg-white dark:bg-zinc-950 border border-indigo-100 dark:border-indigo-900/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Remaining Duration</span>
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold text-[11px]">
                    {durationInfo.text}
                  </Badge>
                </div>
                <div className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  {isCustomMilestones
                    ? `${sched.schedule_dates?.length || sched.total_installments || 0} Milestone Dates (${formatMoney(currentCycleAmount)} / ${allCyclesCompleted ? "last milestone" : "cycle"})`
                    : `${FREQUENCY_LABELS[sched.frequency as FrequencyType] || "Monthly"} (${formatMoney(currentCycleAmount)} / cycle)`}
                </div>
              </div>

              {/* Cycle Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-slate-600 dark:text-zinc-400">Cycle Progress</span>
                  <span className="text-slate-900 dark:text-zinc-100">
                    {sched.total_installments 
                      ? `${sched.completed_installments || 0} / ${sched.total_installments} Cycles (${Math.min(100, Math.round(((sched.completed_installments || 0) / sched.total_installments) * 100))}%)`
                      : `${sched.completed_installments || 0} Cycles Settled`}
                  </span>
                </div>
                {sched.total_installments ? (
                  <div className="w-full bg-slate-200 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            ((sched.completed_installments || 0) / sched.total_installments) * 100
                          )
                        )}%`,
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-xs">
                    <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-semibold">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span>Ongoing Subscription</span>
                    </div>
                    <Badge variant="outline" className="bg-white dark:bg-zinc-900 border-indigo-200 dark:border-indigo-800 text-[10px] text-indigo-700 dark:text-indigo-300 font-bold">
                      Cycle {(sched.completed_installments || 0) + 1} Active
                    </Badge>
                  </div>
                )}
              </div>

              {/* Total Commitment Summary Box */}
              <div className="p-3.5 rounded-xl bg-indigo-600 text-white space-y-1 shadow-xs">
                <div className="text-[11px] font-medium text-indigo-200">
                  {totalCommitment != null ? "Total Commitment" : "Cycle Commitment"}
                </div>
                <div className="text-xl font-black font-mono tracking-tight">
                  {totalCommitment != null 
                    ? formatMoney(totalCommitment) 
                    : `${formatMoney(sched.amount_per_cycle || request.amount)} / cycle`}
                </div>
                <div className="text-[11px] text-indigo-100 flex items-center justify-between pt-1 border-t border-indigo-500/60">
                  <span>{formatMoney(paidToDate)} paid to date</span>
                  <span>
                    {totalCommitment != null 
                      ? `${formatMoney(Math.max(0, totalCommitment - paidToDate))} remaining` 
                      : "Ongoing Billing"}
                  </span>
                </div>
              </div>

              {/* Ledger Breakdown Modal Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsScheduleLedgerOpen(true)}
                className="w-full text-xs font-semibold bg-white dark:bg-zinc-950 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 gap-1.5"
              >
                <CalendarClock className="h-3.5 w-3.5 text-indigo-600" />
                View Full Milestone Schedule / Ledger
              </Button>
            </CardContent>
          </Card>
  );
}
