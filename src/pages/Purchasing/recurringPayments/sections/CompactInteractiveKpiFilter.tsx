import { Card, CardContent } from "@/components/ui/card";
import { CalendarClock, AlertTriangle, CheckCircle2, Clock, RefreshCw, XCircle } from "lucide-react";
import type { RecurringPaymentsViewState } from "../hooks/useRecurringPaymentsTail";

export function CompactInteractiveKpiFilter({ v }: { v: RecurringPaymentsViewState }) {
  const { stats, cardFilter, handleCardFilterChange, kpiRef } = v;
  return (
    <div ref={kpiRef} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5 sm:gap-3 animate-in fade-in duration-300 shrink-0">
        {/* 1. All Recurring Payments */}
        <Card
          onClick={() => handleCardFilterChange("ALL")}
          className={`border border-slate-200/80 dark:border-zinc-800 cursor-pointer shadow-xs hover:shadow-xs transition-all rounded-lg hover:border-blue-300 ${
            cardFilter === "ALL" ? "ring-2 ring-blue-500 bg-blue-50/20 dark:bg-blue-950/20" : ""
          }`}
        >
          <CardContent className="p-2 sm:p-2.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">
                Active Subscriptions
              </p>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100 leading-tight mt-0.5">
                {stats.total}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">All active recurring</p>
            </div>
            <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 shrink-0">
              <RefreshCw size={16} />
            </div>
          </CardContent>
        </Card>

        {/* 2. M&A Scheduled Payments */}
        <Card
          onClick={() => handleCardFilterChange(cardFilter === "MA_SCHEDULED" ? "ALL" : "MA_SCHEDULED")}
          className={`border border-slate-200/80 dark:border-zinc-800 cursor-pointer shadow-xs hover:shadow-xs transition-all rounded-lg hover:border-indigo-300 ${
            cardFilter === "MA_SCHEDULED" ? "ring-2 ring-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20" : ""
          }`}
        >
          <CardContent className="p-2 sm:p-2.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
                M&A Scheduled
              </p>
              <h3 className="text-base sm:text-lg font-bold text-indigo-600 dark:text-indigo-400 leading-tight mt-0.5">
                {stats.maScheduled}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Milestone contracts</p>
            </div>
            <div className="p-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 shrink-0">
              <CalendarClock size={16} />
            </div>
          </CardContent>
        </Card>

        {/* 3. Due Within 7 Days Alert Filter Card */}
        <Card
          onClick={() => handleCardFilterChange(cardFilter === "DUE_SOON" ? "ALL" : "DUE_SOON")}
          className={`border cursor-pointer shadow-xs hover:shadow-xs transition-all rounded-lg ${
            stats.dueSoon > 0 ? "border-amber-300/80 dark:border-amber-700/60 bg-amber-50/10" : "border-slate-200/80 dark:border-zinc-800"
          } ${
            cardFilter === "DUE_SOON" ? "ring-2 ring-amber-500 bg-amber-50/30 dark:bg-amber-950/40 border-amber-500" : "hover:border-amber-400"
          }`}
        >
          <CardContent className="p-2 sm:p-2.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-amber-700 dark:text-amber-300 flex items-center gap-1">
                Due in 7 Days
              </p>
              <h3 className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400 leading-tight mt-0.5">
                {stats.dueSoon}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {stats.dueSoon === 1 ? "1 payment due soon" : `${stats.dueSoon} payments due soon`}
              </p>
            </div>
            <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 shrink-0">
              <AlertTriangle size={16} />
            </div>
          </CardContent>
        </Card>

        {/* 4. Waiting for Review */}
        <Card
          onClick={() => handleCardFilterChange(cardFilter === "WAITING_REVIEW" ? "ALL" : "WAITING_REVIEW")}
          className={`border border-slate-200/80 dark:border-zinc-800 cursor-pointer shadow-xs hover:shadow-xs transition-all rounded-lg hover:border-amber-300 ${
            cardFilter === "WAITING_REVIEW" ? "ring-2 ring-amber-500 bg-amber-50/20 dark:bg-amber-950/20" : ""
          }`}
        >
          <CardContent className="p-2 sm:p-2.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">
                Waiting for Review
              </p>
              <h3 className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400 leading-tight mt-0.5">
                {stats.waitingReview}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Pending AP sign-off</p>
            </div>
            <div className="p-1.5 rounded-md bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600 shrink-0">
              <Clock size={16} />
            </div>
          </CardContent>
        </Card>

        {/* 5. Reviewed (AP Signed-Off) */}
        <Card
          onClick={() => handleCardFilterChange(cardFilter === "REVIEWED" ? "ALL" : "REVIEWED")}
          className={`border border-slate-200/80 dark:border-zinc-800 cursor-pointer shadow-xs hover:shadow-xs transition-all rounded-lg hover:border-sky-300 ${
            cardFilter === "REVIEWED" ? "ring-2 ring-sky-500 bg-sky-50/20 dark:bg-sky-950/20" : ""
          }`}
        >
          <CardContent className="p-2 sm:p-2.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">
                Reviewed (AP)
              </p>
              <h3 className="text-base sm:text-lg font-bold text-sky-600 dark:text-sky-400 leading-tight mt-0.5">
                {stats.reviewed}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">AP validated</p>
            </div>
            <div className="p-1.5 rounded-md bg-sky-50 dark:bg-sky-950 flex items-center justify-center text-sky-600 shrink-0">
              <CheckCircle2 size={16} />
            </div>
          </CardContent>
        </Card>

        {/* 6. Completed */}
        <Card
          onClick={() => handleCardFilterChange(cardFilter === "COMPLETED" ? "ALL" : "COMPLETED")}
          className={`border border-slate-200/80 dark:border-zinc-800 cursor-pointer shadow-xs hover:shadow-xs transition-all rounded-lg hover:border-emerald-300 ${
            cardFilter === "COMPLETED" ? "ring-2 ring-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20" : ""
          }`}
        >
          <CardContent className="p-2 sm:p-2.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                Completed
              </p>
              <h3 className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 leading-tight mt-0.5">
                {stats.completed}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Fully paid / done</p>
            </div>
            <div className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 size={16} />
            </div>
          </CardContent>
        </Card>

        {/* 7. Rejected */}
        <Card
          onClick={() => handleCardFilterChange(cardFilter === "REJECTED" ? "ALL" : "REJECTED")}
          className={`border border-slate-200/80 dark:border-zinc-800 cursor-pointer shadow-xs hover:shadow-xs transition-all rounded-lg hover:border-rose-300 ${
            cardFilter === "REJECTED" ? "ring-2 ring-rose-500 bg-rose-50/20 dark:bg-rose-950/20" : ""
          }`}
        >
          <CardContent className="p-2 sm:p-2.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">
                Rejected
              </p>
              <h3 className="text-base sm:text-lg font-bold text-rose-600 dark:text-rose-400 leading-tight mt-0.5">
                {stats.rejected}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Rejected subscriptions</p>
            </div>
            <div className="p-1.5 rounded-md bg-rose-50 dark:bg-rose-950 flex items-center justify-center text-rose-600 shrink-0">
              <XCircle size={16} />
            </div>
          </CardContent>
        </Card>
      </div>
  );
}
