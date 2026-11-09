import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Clock, RefreshCw, XCircle, ShoppingCart, Landmark } from "lucide-react";
import type { RecurringPaymentsViewState } from "../hooks/useRecurringPaymentsTail";

export function CompactInteractiveKpiFilter({ v }: { v: RecurringPaymentsViewState }) {
  const { stats, cardFilter, handleCardFilterChange, kpiRef } = v;
  const activeScope: "PR" | "AP" | "ALL" = (stats as any).activeScope || "ALL";
  const baseResetFilter =
    activeScope === "PR" ? "PURCHASE_REQUESTS" : activeScope === "AP" ? "AP" : "ALL";
  const dueSoonFilterKey =
    activeScope === "PR" ? "PR_DUE_SOON" : activeScope === "AP" ? "DUE_SOON" : "ALL_DUE_SOON";
  const waitingReviewFilterKey =
    activeScope === "PR" ? "PR_WAITING_REVIEW" : activeScope === "AP" ? "AP_WAITING_REVIEW" : "WAITING_REVIEW";
  const reviewedFilterKey =
    activeScope === "PR" ? "PR_REVIEWED" : activeScope === "AP" ? "AP_REVIEWED" : "REVIEWED";
  const onHoldFilterKey =
    activeScope === "PR" ? "PR_ON_HOLD" : activeScope === "AP" ? "AP_ON_HOLD" : "ON_HOLD";
  const completedFilterKey =
    activeScope === "PR" ? "PR_COMPLETED" : activeScope === "AP" ? "AP_COMPLETED" : "COMPLETED";
  const rejectedFilterKey =
    activeScope === "PR" ? "PR_REJECTED" : activeScope === "AP" ? "AP_REJECTED" : "REJECTED";

  const isDueSoonActive =
    cardFilter === "DUE_SOON" || cardFilter === "AP_DUE_SOON" || cardFilter === "PR_DUE_SOON" || cardFilter === "ALL_DUE_SOON";
  const isWaitingReviewActive =
    cardFilter === "WAITING_REVIEW" || cardFilter === "PR_WAITING_REVIEW" || cardFilter === "AP_WAITING_REVIEW";
  const isReviewedActive =
    cardFilter === "REVIEWED" || cardFilter === "PR_REVIEWED" || cardFilter === "AP_REVIEWED";
  const isOnHoldActive =
    cardFilter === "ON_HOLD" || cardFilter === "PR_ON_HOLD" || cardFilter === "AP_ON_HOLD";
  const isCompletedActive =
    cardFilter === "COMPLETED" || cardFilter === "PR_COMPLETED" || cardFilter === "AP_COMPLETED";
  const isRejectedActive =
    cardFilter === "REJECTED" || cardFilter === "PR_REJECTED" || cardFilter === "AP_REJECTED";

  const gridColsClass =
    activeScope === "PR"
      ? "lg:grid-cols-7"
      : activeScope === "AP"
      ? "lg:grid-cols-7"
      : "lg:grid-cols-8";

  return (
    <div ref={kpiRef} className={`grid grid-cols-2 sm:grid-cols-3 ${gridColsClass} gap-2.5 sm:gap-3 animate-in fade-in duration-300 shrink-0`}>
        {/* 1. All Recurring Payments (only on ALL overview) */}
        {activeScope === "ALL" && (
          <Card
            onClick={() => handleCardFilterChange("ALL")}
            className={`border border-slate-200/80 dark:border-zinc-800 cursor-pointer shadow-xs hover:shadow-xs transition-all rounded-lg hover:border-blue-300 ${
              cardFilter === "ALL" ? "ring-2 ring-blue-500 bg-blue-50/20 dark:bg-blue-950/20" : ""
            }`}
          >
            <CardContent className="p-2 sm:p-2.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">
                  All Recurring
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
        )}

        {/* 2. Purchase Requests Sub-Nav (shown in PR scope or ALL overview) */}
        {activeScope !== "AP" && (
          <Card
            onClick={() => handleCardFilterChange(activeScope === "PR" ? "PURCHASE_REQUESTS" : "PURCHASE_REQUESTS")}
            className={`border border-slate-200/80 dark:border-zinc-800 cursor-pointer shadow-xs hover:shadow-xs transition-all rounded-lg hover:border-sky-300 ${
              cardFilter === "PURCHASE_REQUESTS" || cardFilter === "REQUESTS" ? "ring-2 ring-sky-500 bg-sky-50/20 dark:bg-sky-950/20" : ""
            }`}
          >
            <CardContent className="p-2 sm:p-2.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-sky-700 dark:text-sky-300">
                  Purchase Requests
                </p>
                <h3 className="text-base sm:text-lg font-bold text-sky-600 dark:text-sky-400 leading-tight mt-0.5">
                  {(stats as any).purchaseRequests ?? 0}
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Subscriptions</p>
              </div>
              <div className="p-1.5 rounded-md bg-sky-50 dark:bg-sky-950 flex items-center justify-center text-sky-600 shrink-0">
                <ShoppingCart size={16} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* 3. A/P Sub-Nav (shown in AP scope or ALL overview) */}
        {activeScope !== "PR" && (
          <Card
            onClick={() => handleCardFilterChange("AP")}
            className={`border border-slate-200/80 dark:border-zinc-800 cursor-pointer shadow-xs hover:shadow-xs transition-all rounded-lg hover:border-emerald-300 ${
              cardFilter === "AP" || cardFilter === "ACCOUNTS_PAYABLE" ? "ring-2 ring-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20" : ""
            }`}
          >
            <CardContent className="p-2 sm:p-2.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                  A/P Payables
                </p>
                <h3 className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 leading-tight mt-0.5">
                  {(stats as any).apPayments ?? 0}
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Wire &amp; Invoices</p>
              </div>
              <div className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 shrink-0">
                <Landmark size={16} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* 5. Due Within 7 Days Alert Filter Card */}
        <Card
          onClick={() => handleCardFilterChange(isDueSoonActive ? baseResetFilter : dueSoonFilterKey)}
          className={`border cursor-pointer shadow-xs hover:shadow-xs transition-all rounded-lg ${
            stats.dueSoon > 0 ? "border-amber-300/80 dark:border-amber-700/60 bg-amber-50/10" : "border-slate-200/80 dark:border-zinc-800"
          } ${
            isDueSoonActive ? "ring-2 ring-amber-500 bg-amber-50/30 dark:bg-amber-950/40 border-amber-500" : "hover:border-amber-400"
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

        {/* 6. Waiting for Review */}
        <Card
          onClick={() => handleCardFilterChange(isWaitingReviewActive ? baseResetFilter : waitingReviewFilterKey)}
          className={`border border-slate-200/80 dark:border-zinc-800 cursor-pointer shadow-xs hover:shadow-xs transition-all rounded-lg hover:border-amber-300 ${
            isWaitingReviewActive ? "ring-2 ring-amber-500 bg-amber-50/20 dark:bg-amber-950/20" : ""
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

        {/* 7. Reviewed (AP Signed-Off) */}
        <Card
          onClick={() => handleCardFilterChange(isReviewedActive ? baseResetFilter : reviewedFilterKey)}
          className={`border border-slate-200/80 dark:border-zinc-800 cursor-pointer shadow-xs hover:shadow-xs transition-all rounded-lg hover:border-sky-300 ${
            isReviewedActive ? "ring-2 ring-sky-500 bg-sky-50/20 dark:bg-sky-950/20" : ""
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

        {/* 8. On Hold (shown in PR and AP scopes) */}
        {activeScope !== "ALL" && (
          <Card
            onClick={() => handleCardFilterChange(isOnHoldActive ? baseResetFilter : onHoldFilterKey)}
            className={`border border-slate-200/80 dark:border-zinc-800 cursor-pointer shadow-xs hover:shadow-xs transition-all rounded-lg hover:border-orange-300 ${
              isOnHoldActive ? "ring-2 ring-orange-500 bg-orange-50/20 dark:bg-orange-950/20" : ""
            }`}
          >
            <CardContent className="p-2 sm:p-2.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">
                  On Hold
                </p>
                <h3 className="text-base sm:text-lg font-bold text-orange-600 dark:text-orange-400 leading-tight mt-0.5">
                  {stats.onHold}
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Paused payments</p>
              </div>
              <div className="p-1.5 rounded-md bg-orange-50 dark:bg-orange-950 flex items-center justify-center text-orange-600 shrink-0">
                <Clock size={16} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* 9. Completed */}
        <Card
          onClick={() => handleCardFilterChange(isCompletedActive ? baseResetFilter : completedFilterKey)}
          className={`border border-slate-200/80 dark:border-zinc-800 cursor-pointer shadow-xs hover:shadow-xs transition-all rounded-lg hover:border-emerald-300 ${
            isCompletedActive ? "ring-2 ring-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20" : ""
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

        {/* 10. Rejected */}
        <Card
          onClick={() => handleCardFilterChange(isRejectedActive ? baseResetFilter : rejectedFilterKey)}
          className={`border border-slate-200/80 dark:border-zinc-800 cursor-pointer shadow-xs hover:shadow-xs transition-all rounded-lg hover:border-rose-300 ${
            isRejectedActive ? "ring-2 ring-rose-500 bg-rose-50/20 dark:bg-rose-950/20" : ""
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
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {activeScope === "AP" ? "Rejected payables" : "Rejected subscriptions"}
              </p>
            </div>
            <div className="p-1.5 rounded-md bg-rose-50 dark:bg-rose-950 flex items-center justify-center text-rose-600 shrink-0">
              <XCircle size={16} />
            </div>
          </CardContent>
        </Card>
      </div>
  );
}
