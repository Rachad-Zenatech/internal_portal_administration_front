import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertTriangle, Layers, Calendar, CalendarClock } from "lucide-react";
import { formatMoney } from "../../utils/purchasingMeta";
import type { InvoicesState } from "../hooks/useInvoices";

export function KpiSummaryCards({ s }: { s: InvoicesState }) {
  const { metrics, quickFilter, setQuickFilter, quickFilterCounts } = s;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 animate-in fade-in duration-300 shrink-0">
      {/* 1. All A/P & Invoices */}
      <Card
        onClick={() => setQuickFilter("ALL")}
        className={`border border-slate-200/80 dark:border-zinc-800 cursor-pointer shadow-xs hover:shadow-xs transition-all rounded-lg hover:border-indigo-300 ${
          quickFilter === "ALL" ? "ring-2 ring-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20" : ""
        }`}
      >
        <CardContent className="p-2 sm:p-2.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground">
              All A/P &amp; Invoices
            </p>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100 leading-tight mt-0.5">
              {metrics.totalCount}
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
              {formatMoney(metrics.totalVolume)} total
            </p>
          </div>
          <div className="p-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 shrink-0">
            <Layers size={16} />
          </div>
        </CardContent>
      </Card>

      {/* 2. Due on Today */}
      <Card
        onClick={() => setQuickFilter(quickFilter === "DUE_TODAY" ? "ALL" : "DUE_TODAY")}
        className={`border cursor-pointer shadow-xs hover:shadow-xs transition-all rounded-lg ${
          quickFilterCounts.dueToday > 0 ? "border-amber-300/80 dark:border-amber-700/60 bg-amber-50/10" : "border-slate-200/80 dark:border-zinc-800"
        } ${
          quickFilter === "DUE_TODAY" ? "ring-2 ring-amber-500 bg-amber-50/30 dark:bg-amber-950/40 border-amber-500" : "hover:border-amber-400"
        }`}
      >
        <CardContent className="p-2 sm:p-2.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
              Due on Today
            </p>
            <h3 className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400 leading-tight mt-0.5">
              {quickFilterCounts.dueToday}
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Must pay by today
            </p>
          </div>
          <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 shrink-0">
            <Calendar size={16} />
          </div>
        </CardContent>
      </Card>

      {/* 3. Due in 7 Days */}
      <Card
        onClick={() => setQuickFilter(quickFilter === "DUE_SOON" ? "ALL" : "DUE_SOON")}
        className={`border cursor-pointer shadow-xs hover:shadow-xs transition-all rounded-lg ${
          metrics.dueSoonCount > 0 ? "border-orange-300/80 dark:border-orange-700/60 bg-orange-50/10" : "border-slate-200/80 dark:border-zinc-800"
        } ${
          quickFilter === "DUE_SOON" ? "ring-2 ring-orange-500 bg-orange-50/30 dark:bg-orange-950/40 border-orange-500" : "hover:border-orange-400"
        }`}
      >
        <CardContent className="p-2 sm:p-2.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-orange-700 dark:text-orange-300">
              Due in 7 Days
            </p>
            <h3 className="text-base sm:text-lg font-bold text-orange-600 dark:text-orange-400 leading-tight mt-0.5">
              {metrics.dueSoonCount}
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
              {metrics.dueSoonCount > 0 ? `${formatMoney(metrics.dueSoonAmount)} due soon` : "Upcoming 7 days"}
            </p>
          </div>
          <div className="p-1.5 rounded-md bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-orange-600 shrink-0">
            <CalendarClock size={16} />
          </div>
        </CardContent>
      </Card>

      {/* 4. Overdue Payment */}
      <Card
        onClick={() => setQuickFilter(quickFilter === "OVERDUE" ? "ALL" : "OVERDUE")}
        className={`border cursor-pointer shadow-xs hover:shadow-xs transition-all rounded-lg ${
          metrics.overdueCount > 0 ? "border-red-300/80 dark:border-red-700/60 bg-red-50/10" : "border-slate-200/80 dark:border-zinc-800"
        } ${
          quickFilter === "OVERDUE" ? "ring-2 ring-red-500 bg-red-50/30 dark:bg-red-950/40 border-red-500" : "hover:border-red-400"
        }`}
      >
        <CardContent className="p-2 sm:p-2.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-red-700 dark:text-red-300">
              Overdue Payment
            </p>
            <h3 className="text-base sm:text-lg font-bold text-red-600 dark:text-red-400 leading-tight mt-0.5">
              {metrics.overdueCount}
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
              {metrics.overdueCount > 0 ? `${formatMoney(metrics.overdueAmount)} past due` : "All on schedule"}
            </p>
          </div>
          <div className="p-1.5 rounded-md bg-red-100 dark:bg-red-950 flex items-center justify-center text-red-600 shrink-0">
            <AlertTriangle size={16} />
          </div>
        </CardContent>
      </Card>

      {/* 5. Pending Payment */}
      <Card
        onClick={() => setQuickFilter(quickFilter === "PENDING" ? "ALL" : "PENDING")}
        className={`border border-slate-200/80 dark:border-zinc-800 cursor-pointer shadow-xs hover:shadow-xs transition-all rounded-lg hover:border-sky-300 ${
          quickFilter === "PENDING" ? "ring-2 ring-sky-500 bg-sky-50/20 dark:bg-sky-950/20" : ""
        }`}
      >
        <CardContent className="p-2 sm:p-2.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-sky-700 dark:text-sky-300">
              Pending Payment
            </p>
            <h3 className="text-base sm:text-lg font-bold text-sky-600 dark:text-sky-400 leading-tight mt-0.5">
              {metrics.pendingCount}
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
              {formatMoney(metrics.pendingAmount)} awaiting AP
            </p>
          </div>
          <div className="p-1.5 rounded-md bg-sky-50 dark:bg-sky-950 flex items-center justify-center text-sky-600 shrink-0">
            <Clock size={16} />
          </div>
        </CardContent>
      </Card>

      {/* 6. Wire Details Ready */}
      <Card
        onClick={() => s.setWireFilter(s.wireFilter === "WITH_WIRE" ? "ALL" : "WITH_WIRE")}
        className={`border border-slate-200/80 dark:border-zinc-800 cursor-pointer shadow-xs hover:shadow-xs transition-all rounded-lg hover:border-emerald-300 ${
          s.wireFilter === "WITH_WIRE" ? "ring-2 ring-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20" : ""
        }`}
      >
        <CardContent className="p-2 sm:p-2.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
              Wire Details Ready
            </p>
            <h3 className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 leading-tight mt-0.5">
              {metrics.wireCount}
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {metrics.wirePercent}% configured
            </p>
          </div>
          <div className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 size={16} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
