import { Calendar, CalendarClock } from "lucide-react";
import { formatRemainingDuration, FREQUENCY_LABELS, type FrequencyType } from "../../utils/recurringScheduleUtils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatMoney } from "../../utils/purchasingMeta";
import type { RequestDetailViewState } from "../hooks/useRequestDetailTail";

export function DedicatedRecurringContractSchedule({ v }: { v: RequestDetailViewState }) {
  const { request, setIsScheduleLedgerOpen, isRecurring } = v;
  return (
    <>
      {isRecurring && (
                    <Card className="border border-indigo-200/90 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/50 via-white to-sky-50/30 dark:from-indigo-950/20 dark:via-zinc-900/40 dark:to-zinc-900 shadow-sm overflow-hidden">
                      <CardHeader className="pb-3 border-b border-indigo-100/80 dark:border-indigo-950/60">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-950 dark:text-indigo-200">
                            <CalendarClock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            Scheduled Range &amp; Payment Horizon
                          </CardTitle>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-2.5 font-semibold text-indigo-700 bg-white hover:bg-indigo-50 dark:bg-zinc-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 shadow-2xs"
                            onClick={() => setIsScheduleLedgerOpen(true)}
                          >
                            <Calendar className="h-3.5 w-3.5 mr-1" />
                            Open Installment Ledger
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="p-3 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 shadow-2xs">
                            <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Scheduled Horizon</div>
                            <div className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1">
                              {formatDate(request.recurring_schedule?.start_date || request.due_date || request.request_date)}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <span>to</span>
                              <strong className="text-slate-800 dark:text-zinc-200">
                                {request.recurring_schedule?.end_date ? formatDate(request.recurring_schedule.end_date) : "Ongoing"}
                              </strong>
                            </div>
                          </div>

                          <div className="p-3 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 shadow-2xs">
                            <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Remaining Duration</div>
                            <div className="mt-1">
                              <Badge variant="outline" className="bg-indigo-100/80 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold border-indigo-300 text-xs">
                                {request.recurring_schedule?.frequency === 'CUSTOM' || Boolean(request.recurring_schedule?.schedule_dates?.length) ? `${request.recurring_schedule?.total_installments || request.recurring_schedule?.schedule_dates?.length || 0} Milestone Dates` : formatRemainingDuration(request.recurring_schedule?.end_date, request.recurring_schedule?.start_date || request.due_date).text}
                              </Badge>
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-1">
                              {FREQUENCY_LABELS[(request.recurring_schedule?.frequency as FrequencyType) || "MONTHLY"] || "Monthly"} ({formatMoney(request.recurring_schedule?.amount_per_cycle || request.amount || 0)} / cycle)
                            </div>
                          </div>

                          <div className="p-3 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 shadow-2xs">
                            <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Cycle Progress</div>
                            <div className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1">
                              {request.recurring_schedule?.total_installments
                                ? `${request.recurring_schedule?.completed_installments || 0} / ${request.recurring_schedule?.total_installments} Cycles`
                                : `${request.recurring_schedule?.completed_installments || 0} Cycles Settled`}
                            </div>
                            {request.recurring_schedule?.total_installments ? (
                              <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                <div
                                  className="bg-indigo-600 h-full rounded-full transition-all"
                                  style={{
                                    width: `${Math.min(100, Math.round(((request.recurring_schedule?.completed_installments || 0) / request.recurring_schedule?.total_installments) * 100))}%`
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                                <span className="relative flex h-1.5 w-1.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                </span>
                                <span>Ongoing Cadence • Cycle {(request.recurring_schedule?.completed_installments || 0) + 1} Active</span>
                              </div>
                            )}
                          </div>

                          <div className="p-3 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 shadow-2xs">
                            <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                              {request.recurring_schedule?.total_amount || request.recurring_schedule?.total_installments ? "Total Commitment" : "Cycle Commitment"}
                            </div>
                            <div className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1">
                              {request.recurring_schedule?.total_amount
                                ? formatMoney(request.recurring_schedule.total_amount)
                                : request.recurring_schedule?.total_installments
                                ? formatMoney((request.recurring_schedule?.amount_per_cycle || request.amount || 0) * request.recurring_schedule.total_installments)
                                : `${formatMoney(request.recurring_schedule?.amount_per_cycle || request.amount || 0)} / cycle`}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
    </>
  );
}
