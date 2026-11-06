import { RequestStatus, type PurchaseRequest, type Priority } from "@/types/purchasing";
import { parseRequestStatus } from "@/lib/requestStatus";
import { formatMoney, PRIORITY_BADGE } from "../../utils/purchasingMeta";
import { CheckCircle2 } from "lucide-react";
import { generatePaymentSchedule } from "../../utils/recurringScheduleUtils";
import type { CalendarCell } from "../types";
import type { RecurringPaymentsViewState } from "../hooks/useRecurringPaymentsTail";

export function CalendarGrid({ v }: { v: RecurringPaymentsViewState }) {
  const { setSelectedCalendarInstallment, setSelectedCalendarItem, filteredRequests, calendarCells } = v;
  return (
    <div className="grid grid-cols-7 gap-2">
            {calendarCells.map((cell: CalendarCell, idx: number) => {
              // Find items matching this date, including projected installments from scheduled requests
              const cellItems: Array<{
                id: string;
                request: PurchaseRequest;
                installmentNumber?: number;
                totalInstallments?: number;
                isProjected: boolean;
                isPaid: boolean;
                amount: number;
                currency?: string;
                displayTitle: string;
                isReviewed: boolean;
              }> = [];

              if (cell.isCurrentMonth) {
                filteredRequests.forEach((req) => {
                  const sched = req.recurring_schedule;
                  const installments = generatePaymentSchedule(
                    sched,
                    req.amount || 0,
                    req.currency || "USD",
                    req.status,
                    req.due_date || req.request_date
                  );
                  const match = installments.find((inst) => inst.dueDate === cell.dateStr);
                  if (match) {
                    const isOngoing = !sched?.total_installments && !sched?.end_date && sched?.frequency !== "CUSTOM" && !(sched?.schedule_dates?.length);
                    const totalInst = sched?.total_installments || (sched?.end_date ? installments.length : null);
                    cellItems.push({
                      id: `${req.id}-inst-${match.installmentNumber}`,
                      request: req,
                      installmentNumber: match.installmentNumber,
                      totalInstallments: totalInst || installments.length,
                      isProjected: match.status === "PROJECTED",
                      isPaid: match.status === "PAID",
                      amount: match.amount,
                      currency: match.currency || req.currency || "USD",
                      displayTitle: isOngoing ? `${req.title} (Cycle #${match.installmentNumber})` : `${req.title} (#${match.installmentNumber}/${totalInst || installments.length})`,
                      isReviewed: req.review_status === "REVIEWED",
                    });
                  } else if (!installments || installments.length === 0) {
                    const dStr = String(req.due_date || req.request_date || "").split("T")[0];
                    if (dStr === cell.dateStr) {
                      cellItems.push({
                        id: `${req.id}-standard`,
                        request: req,
                        isProjected: false,
                        isPaid: parseRequestStatus(req.status) === RequestStatus.Completed,
                        amount: req.amount,
                        currency: req.currency || "USD",
                        displayTitle: req.title,
                        isReviewed: req.review_status === "REVIEWED",
                      });
                    }
                  }
                });
              }

              const todayStr = new Date().toISOString().split("T")[0];
              const isToday = cell.isCurrentMonth && todayStr === cell.dateStr;

              return (
                <div
                  key={idx}
                  className={`min-h-[120px] p-2 rounded-lg border transition-all flex flex-col justify-between ${
                    cell.isCurrentMonth
                      ? isToday
                        ? "bg-sky-50/20 dark:bg-sky-950/20 border-sky-300 dark:border-sky-800 ring-1 ring-sky-400/50"
                        : "bg-card border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700"
                      : "bg-slate-50/40 dark:bg-zinc-900/20 border-transparent text-slate-400 opacity-40 select-none"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isToday
                          ? "bg-sky-600 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-xs"
                          : "text-slate-700 dark:text-zinc-300"
                      }`}
                    >
                      {cell.day}
                    </span>
                    {cellItems.length > 0 && (
                      <span className="text-[10px] font-bold text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full">
                        {cellItems.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 mt-1 flex-1 overflow-y-auto max-h-[90px] scrollbar-hide">
                    {cellItems.map((item) => {
                      const isItemReviewed = item.isReviewed;
                      if (item.isProjected) {
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setSelectedCalendarItem(item.request);
                              setSelectedCalendarInstallment({
                                installmentNumber: item.installmentNumber,
                                totalInstallments: item.totalInstallments,
                                amount: item.amount,
                                currency: item.currency,
                                dueDate: cell.dateStr,
                                isProjected: true,
                                isPaid: false,
                              });
                            }}
                            className="w-full text-left p-1.5 rounded-md text-[11px] font-medium border shadow-2xs transition-all hover:scale-[1.02] cursor-pointer bg-slate-50/90 text-slate-800 border-dashed border-indigo-300 dark:bg-zinc-800/60 dark:text-zinc-200 dark:border-indigo-700/60"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="truncate font-medium text-slate-800 dark:text-zinc-200">
                                {item.displayTitle}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className={`text-[8px] font-bold px-1 py-0.2 rounded border ${PRIORITY_BADGE[(item.request.priority as Priority) || "MEDIUM"]}`}>
                                  {item.request.priority || "MEDIUM"}
                                </span>
                                <span className="text-[9px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-1 rounded border border-indigo-200 dark:border-indigo-800 shrink-0">
                                  Proj
                                </span>
                              </div>
                            </div>
                            <div className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 mt-0.5">
                              {formatMoney(item.amount, item.currency)}
                            </div>
                          </button>
                        );
                      }

                      if (item.isPaid) {
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setSelectedCalendarItem(item.request);
                              setSelectedCalendarInstallment({
                                installmentNumber: item.installmentNumber,
                                totalInstallments: item.totalInstallments,
                                amount: item.amount,
                                currency: item.currency,
                                dueDate: cell.dateStr,
                                isProjected: false,
                                isPaid: true,
                              });
                            }}
                            className="w-full text-left p-1.5 rounded-md text-[11px] font-medium border shadow-2xs transition-all hover:scale-[1.02] cursor-pointer bg-emerald-50/90 text-emerald-950 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800/80"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="truncate font-semibold text-emerald-950 dark:text-emerald-100">
                                {item.displayTitle}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className={`text-[8px] font-bold px-1 py-0.2 rounded border ${PRIORITY_BADGE[(item.request.priority as Priority) || "MEDIUM"]}`}>
                                  {item.request.priority || "MEDIUM"}
                                </span>
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                              </div>
                            </div>
                            <div className="text-[10px] font-bold opacity-85 mt-0.5">
                              {formatMoney(item.amount, item.currency)}
                            </div>
                          </button>
                        );
                      }

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setSelectedCalendarItem(item.request);
                            setSelectedCalendarInstallment({
                              installmentNumber: item.installmentNumber,
                              totalInstallments: item.totalInstallments,
                              amount: item.amount,
                              currency: item.currency,
                              dueDate: cell.dateStr,
                              isProjected: false,
                              isPaid: false,
                            });
                          }}
                          className={`w-full text-left p-1.5 rounded-md text-[11px] font-medium border shadow-2xs transition-all hover:scale-[1.02] cursor-pointer ${
                            isItemReviewed
                              ? "bg-sky-50/90 text-sky-950 border-sky-200/90 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-200 dark:border-sky-800/80"
                              : "bg-amber-50/90 text-amber-950 border-amber-200/90 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800/80"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate font-semibold text-slate-900 dark:text-zinc-100">
                              {item.displayTitle}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className={`text-[8px] font-bold px-1 py-0.2 rounded border ${PRIORITY_BADGE[(item.request.priority as Priority) || "MEDIUM"]}`}>
                                {item.request.priority || "MEDIUM"}
                              </span>
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  isItemReviewed ? "bg-sky-500" : "bg-amber-500"
                                }`}
                              />
                            </div>
                          </div>
                          <div className="text-[10px] font-bold opacity-85 mt-0.5">
                            {formatMoney(item.amount, item.currency)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
  );
}
