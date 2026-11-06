import { formatMoney } from "@/pages/Purchasing/utils/purchasingMeta";
import { Activity, ReceiptText, CalendarCheck, UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardState } from "../hooks/useDashboard";

export function MultiModuleOperationsSummary({ s }: { s: DashboardState }) {
  const { purchasingSummary, dashboardFilter, setDashboardFilter, totalCount, pipelineValue, activeCount, kpiRef } = s;
  return (
    <div ref={kpiRef} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in duration-300">
          {/* 1. Active Purchase Requests */}
          <Card
            onClick={() => setDashboardFilter("ALL")}
            className={`shadow-xs cursor-pointer hover:shadow-md transition-all border border-slate-200/80 dark:border-zinc-800 hover:border-blue-300 ${
              dashboardFilter === "ALL" ? "ring-2 ring-blue-500 bg-blue-50/20 dark:bg-blue-950/20" : ""
            }`}
          >
            <CardContent className="p-3 sm:p-3.5 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-lg sm:text-xl font-bold leading-none mb-1">{purchasingSummary?.open_requests ?? activeCount}</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">Active Requests</span>
                <span className="text-[11px] text-muted-foreground mt-0.5">
                  Pipeline: {formatMoney(pipelineValue)} · {totalCount} total
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 2. Pending Approvals */}
          <Card
            onClick={() => setDashboardFilter(dashboardFilter === "APPROVALS" ? "ALL" : "APPROVALS")}
            className={`shadow-xs cursor-pointer hover:shadow-md transition-all border border-slate-200/80 dark:border-zinc-800 hover:border-violet-300 ${
              dashboardFilter === "APPROVALS" ? "ring-2 ring-violet-500 bg-violet-50/20 dark:bg-violet-950/20" : ""
            }`}
          >
            <CardContent className="p-3 sm:p-3.5 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400 shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-lg sm:text-xl font-bold leading-none mb-1">{purchasingSummary?.awaiting_approval ?? 0}</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">Awaiting Approval</span>
                <span className="text-[11px] text-violet-600 dark:text-violet-400 font-medium mt-0.5">
                  Click to filter board
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 3. Unpaid Invoices (AP) */}
          <Card
            onClick={() => setDashboardFilter(dashboardFilter === "UNPAID_INVOICES" ? "ALL" : "UNPAID_INVOICES")}
            className={`shadow-xs cursor-pointer hover:shadow-md transition-all border border-slate-200/80 dark:border-zinc-800 hover:border-rose-300 ${
              dashboardFilter === "UNPAID_INVOICES" ? "ring-2 ring-rose-500 bg-rose-50/20 dark:bg-rose-950/20" : ""
            }`}
          >
            <CardContent className="p-3 sm:p-3.5 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 shrink-0">
                <ReceiptText className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-lg sm:text-xl font-bold leading-none mb-1">{purchasingSummary?.unpaid_invoices ?? 0}</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">Unpaid Invoices (AP)</span>
                <span className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {formatMoney(purchasingSummary?.unpaid_amount ?? 0)} due
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 4. Recurring Subscriptions */}
          <Card
            onClick={() => setDashboardFilter(dashboardFilter === "RECURRING" ? "ALL" : "RECURRING")}
            className={`shadow-xs cursor-pointer hover:shadow-md transition-all border border-slate-200/80 dark:border-zinc-800 hover:border-amber-300 ${
              dashboardFilter === "RECURRING" ? "ring-2 ring-amber-500 bg-amber-50/20 dark:bg-amber-950/20" : ""
            }`}
          >
            <CardContent className="p-3 sm:p-3.5 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 shrink-0">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-lg sm:text-xl font-bold leading-none mb-1">{purchasingSummary?.recurring_total ?? 0}</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">Recurring Payments</span>
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                  {(purchasingSummary?.recurring_due_soon_count ?? 0) > 0
                    ? `${purchasingSummary?.recurring_due_soon_count} due in 7 days`
                    : "All up to date"}
                </span>
              </div>
            </CardContent>
          </Card>
      </div>
  );
}
