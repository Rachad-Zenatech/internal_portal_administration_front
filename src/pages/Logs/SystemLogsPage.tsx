import { Button } from "@/components/ui/button";
import { RefreshCw, User as UserIcon, Activity, FileText, Layers, Sparkles } from "lucide-react";
import { useSystemLogsPage } from "./systemLogsPage/hooks/useSystemLogsPage";
import { SearchFilterControlBar } from "./systemLogsPage/sections/SearchFilterControlBar";
import { MainAuditLogsTable } from "./systemLogsPage/sections/MainAuditLogsTable";
import { RichAuditLogInspector } from "./systemLogsPage/sections/RichAuditLogInspector";

export default function SystemLogsPage() {
  const s = useSystemLogsPage();
  const { stats, loading, fetchLogs } = s;
  return (
    <div className="flex-1 min-h-0 flex flex-col space-y-6 pb-6 p-4 sm:p-6 max-w-[1650px] mx-auto w-full">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 shadow-2xs">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                System Audit Logs
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Comprehensive, tamper-evident audit trail of all actions, approvals, payments, and system events.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={loading}
            className="h-9 gap-1.5 bg-white dark:bg-zinc-950 shadow-2xs font-medium text-xs sm:text-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── KPI Metric Summary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Events</span>
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mt-2">
            {stats.totalCount.toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Recorded across all modules</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Today's Activity</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {stats.todayCount}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Actions executed today</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Entities</span>
            <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mt-2">
            {stats.uniqueEntities}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Unique records in current view</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Actors</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <UserIcon className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mt-2">
            {stats.uniqueUsers}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Unique operators & systems</p>
        </div>
      </div>

      {/* ── Search & Filter Control Bar ── */}
      <SearchFilterControlBar s={s} />

      {/* ── Main Audit Logs Table ── */}
      <MainAuditLogsTable s={s} />

      {/* ── Rich Audit Log Inspector Drawer (Sheet) ── */}
      <RichAuditLogInspector s={s} />
    </div>
  );
}

export { getActionMeta } from "./systemLogsPage/utils";
