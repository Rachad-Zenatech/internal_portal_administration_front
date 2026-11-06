import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Search, Clock, X, AlertTriangle, Layers, Calendar } from "lucide-react";
import type { InvoicesState } from "../hooks/useInvoices";

export function FiltersSearchToolbar({ s }: { s: InvoicesState }) {
  const { quickFilterCounts, quickFilter, setQuickFilter, clearFilters, hasActiveFilters, tasks, filteredTasks, setWireFilter, wireFilter, setStatusFilter, statusFilter, setTypeFilter, typeFilter, setSearchQuery, searchQuery } = s;
  return (
    <Card className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by Request #, vendor, bank, account, product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 h-9 text-xs sm:text-sm bg-slate-50/60 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 focus-visible:bg-white dark:focus-visible:bg-zinc-900"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Request Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48 h-9 text-xs font-medium">
                <SelectValue placeholder="Request Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types (Wire & Scheduled)</SelectItem>
                <SelectItem value="WIRE">Wire Transfer</SelectItem>
                <SelectItem value="SCHEDULED">Schedule Payment</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44 h-9 text-xs font-medium">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="INITIAL">Draft</SelectItem>
                <SelectItem value="WAITING_APPROVAL">Waiting Approval</SelectItem>
                <SelectItem value="WAITING_PAYMENT">Waiting Payment</SelectItem>
                <SelectItem value="INVOICE_RECEIVED">Invoice Received</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="ON_HOLD">Review on Hold</SelectItem>
              </SelectContent>
            </Select>

            {/* Wire Details Filter */}
            <Select value={wireFilter} onValueChange={setWireFilter}>
              <SelectTrigger className="w-full sm:w-40 h-9 text-xs font-medium">
                <SelectValue placeholder="Wire Details" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Wire Statuses</SelectItem>
                <SelectItem value="WITH_WIRE">Wire Info Configured</SelectItem>
                <SelectItem value="WITHOUT_WIRE">Missing Wire Info</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2.5">
            <span className="text-xs text-slate-500 dark:text-zinc-400 whitespace-nowrap">
              Showing <span className="font-semibold text-slate-900 dark:text-zinc-100">{filteredTasks.length}</span> of{" "}
              {tasks.length}
            </span>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 px-2.5 text-xs text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
              >
                Reset Filters
              </Button>
            )}
          </div>
        </div>

        {/* ── Bottom of Search Bar: Quick Urgency Filter Buttons (Super User-Friendly for Elderly / Clear Plain Language) ── */}
        <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
            <span className="font-bold text-slate-700 dark:text-zinc-200 tracking-wide flex items-center gap-1.5">
              <span>Quick Urgency Filter:</span>
              <span className="font-normal text-muted-foreground text-[11px]">
                Click any button to view matching payments immediately
              </span>
            </span>
            {quickFilter !== "ALL" && (
              <button
                type="button"
                onClick={() => setQuickFilter("ALL")}
                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline text-xs flex items-center gap-1 w-fit"
              >
                <span>Reset to All Payments</span>
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {/* 1. All Payments */}
            <button
              type="button"
              onClick={() => setQuickFilter("ALL")}
              aria-pressed={quickFilter === "ALL"}
              className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer text-left select-none ${
                quickFilter === "ALL"
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100 ring-2 ring-slate-400/30"
                  : "bg-slate-50/70 hover:bg-slate-100/90 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    quickFilter === "ALL"
                      ? "bg-white/20 text-white dark:bg-zinc-900/20 dark:text-zinc-900"
                      : "bg-white dark:bg-zinc-700 text-slate-600 dark:text-zinc-300 shadow-2xs"
                  }`}
                >
                  <Layers className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold flex items-center gap-1.5 leading-tight truncate">
                    <span>All Payments</span>
                    {quickFilter === "ALL" && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </div>
                  <div
                    className={`text-[11px] truncate ${
                      quickFilter === "ALL"
                        ? "text-slate-200 dark:text-zinc-600"
                        : "text-slate-500 dark:text-zinc-400"
                    }`}
                  >
                    All active records
                  </div>
                </div>
              </div>
              <span
                className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono shrink-0 ${
                  quickFilter === "ALL"
                    ? "bg-white/20 text-white dark:bg-zinc-900/20 dark:text-zinc-900"
                    : "bg-slate-200/80 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300"
                }`}
              >
                {quickFilterCounts.all}
              </span>
            </button>

            {/* 2. Due on Today */}
            <button
              type="button"
              onClick={() => setQuickFilter(quickFilter === "DUE_TODAY" ? "ALL" : "DUE_TODAY")}
              aria-pressed={quickFilter === "DUE_TODAY"}
              className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer text-left select-none ${
                quickFilter === "DUE_TODAY"
                  ? "bg-amber-600 text-white border-amber-600 shadow-sm ring-2 ring-amber-400/40"
                  : "bg-amber-50/60 hover:bg-amber-100/80 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 border-amber-200 dark:border-amber-900/50 text-amber-950 dark:text-amber-200"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    quickFilter === "DUE_TODAY"
                      ? "bg-white/20 text-white"
                      : "bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shadow-2xs"
                  }`}
                >
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold flex items-center gap-1.5 leading-tight truncate">
                    <span>Due on Today</span>
                    {quickFilter === "DUE_TODAY" && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </div>
                  <div
                    className={`text-[11px] truncate ${
                      quickFilter === "DUE_TODAY"
                        ? "text-amber-100"
                        : "text-amber-700/80 dark:text-amber-400"
                    }`}
                  >
                    Must pay by today
                  </div>
                </div>
              </div>
              <span
                className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono shrink-0 ${
                  quickFilter === "DUE_TODAY"
                    ? "bg-white/20 text-white"
                    : "bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200"
                }`}
              >
                {quickFilterCounts.dueToday}
              </span>
            </button>

            {/* 3. Pending Payment */}
            <button
              type="button"
              onClick={() => setQuickFilter(quickFilter === "PENDING" ? "ALL" : "PENDING")}
              aria-pressed={quickFilter === "PENDING"}
              className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer text-left select-none ${
                quickFilter === "PENDING"
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-400/40"
                  : "bg-indigo-50/60 hover:bg-indigo-100/80 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/50 text-indigo-950 dark:text-indigo-200"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    quickFilter === "PENDING"
                      ? "bg-white/20 text-white"
                      : "bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 shadow-2xs"
                  }`}
                >
                  <Clock className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold flex items-center gap-1.5 leading-tight truncate">
                    <span>Pending Payment</span>
                    {quickFilter === "PENDING" && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </div>
                  <div
                    className={`text-[11px] truncate ${
                      quickFilter === "PENDING"
                        ? "text-indigo-100"
                        : "text-indigo-700/80 dark:text-indigo-400"
                    }`}
                  >
                    Awaiting AP settlement
                  </div>
                </div>
              </div>
              <span
                className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono shrink-0 ${
                  quickFilter === "PENDING"
                    ? "bg-white/20 text-white"
                    : "bg-indigo-200/80 dark:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200"
                }`}
              >
                {quickFilterCounts.pending}
              </span>
            </button>

            {/* 4. Overdue Payment */}
            <button
              type="button"
              onClick={() => setQuickFilter(quickFilter === "OVERDUE" ? "ALL" : "OVERDUE")}
              aria-pressed={quickFilter === "OVERDUE"}
              className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer text-left select-none ${
                quickFilter === "OVERDUE"
                  ? "bg-red-600 text-white border-red-600 shadow-sm ring-2 ring-red-400/40"
                  : "bg-red-50/60 hover:bg-red-100/80 dark:bg-red-950/20 dark:hover:bg-red-950/40 border-red-200 dark:border-red-900/50 text-red-950 dark:text-red-200"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    quickFilter === "OVERDUE"
                      ? "bg-white/20 text-white"
                      : "bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 shadow-2xs"
                  }`}
                >
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold flex items-center gap-1.5 leading-tight truncate">
                    <span>Overdue Payment</span>
                    {quickFilter === "OVERDUE" && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </div>
                  <div
                    className={`text-[11px] truncate ${
                      quickFilter === "OVERDUE"
                        ? "text-red-100"
                        : "text-red-700/80 dark:text-red-400"
                    }`}
                  >
                    Past payment deadline
                  </div>
                </div>
              </div>
              <span
                className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono shrink-0 ${
                  quickFilter === "OVERDUE"
                    ? "bg-white/20 text-white"
                    : "bg-red-200/80 dark:bg-red-900/60 text-red-900 dark:text-red-200"
                }`}
              >
                {quickFilterCounts.overdue}
              </span>
            </button>
          </div>
        </div>
      </Card>
  );
}
