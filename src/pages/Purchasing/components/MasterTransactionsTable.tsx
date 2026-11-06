import { formatMoney } from "../utils/purchasingMeta";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Clock, Search, Download, Layers, TrendingUp } from "lucide-react";
import type { MasterTransactionsTableProps } from "./masterTransactionsTable/types";
import { useMasterTransactionsTable } from "./masterTransactionsTable/hooks/useMasterTransactionsTable";
import { MasterTransactionsGrid } from "./masterTransactionsTable/sections/MasterTransactionsGrid";

export const MasterTransactionsTable: React.FC<MasterTransactionsTableProps> = (props) => {
  const s = useMasterTransactionsTable(props);
  const { handleExportCSV, setReviewFilter, reviewFilter, setInstallmentStatusFilter, installmentStatusFilter, setDateRangeFilter, dateRangeFilter, setSearchTerm, searchTerm, stats } = s;
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* 1. Master View KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 shrink-0">
        {/* Total Scheduled Volume */}
        <Card className="border border-slate-200/80 dark:border-zinc-800 rounded-lg shadow-xs bg-slate-50/40 dark:bg-zinc-900/40">
          <CardContent className="p-2 sm:p-2.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">
                Total Transactions
              </p>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100 leading-tight mt-0.5">
                {stats.totalTransactions}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                {formatMoney(stats.totalValue)} volume
              </p>
            </div>
            <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 shrink-0">
              <Layers size={16} />
            </div>
          </CardContent>
        </Card>

        {/* Paid / Executed */}
        <Card className="border border-slate-200/80 dark:border-zinc-800 rounded-lg shadow-xs bg-emerald-50/20 dark:bg-emerald-950/20">
          <CardContent className="p-2 sm:p-2.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                Paid / Settled
              </p>
              <h3 className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 leading-tight mt-0.5">
                {stats.paidCount}
              </h3>
              <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5 font-medium">
                {formatMoney(stats.paidValue)} settled
              </p>
            </div>
            <div className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 size={16} />
            </div>
          </CardContent>
        </Card>

        {/* Current / Due Next */}
        <Card className="border border-slate-200/80 dark:border-zinc-800 rounded-lg shadow-xs bg-amber-50/20 dark:bg-amber-950/20">
          <CardContent className="p-2 sm:p-2.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
                Current / Due Next
              </p>
              <h3 className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400 leading-tight mt-0.5">
                {stats.currentCount}
              </h3>
              <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-0.5 font-medium">
                {formatMoney(stats.currentValue)} pending
              </p>
            </div>
            <div className="p-1.5 rounded-md bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600 shrink-0">
              <Clock size={16} />
            </div>
          </CardContent>
        </Card>

        {/* Projected Future */}
        <Card className="border border-slate-200/80 dark:border-zinc-800 rounded-lg shadow-xs bg-indigo-50/20 dark:bg-indigo-950/20">
          <CardContent className="p-2 sm:p-2.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
                Future Projected
              </p>
              <h3 className="text-base sm:text-lg font-bold text-indigo-600 dark:text-indigo-400 leading-tight mt-0.5">
                {stats.projectedCount}
              </h3>
              <p className="text-[10px] text-indigo-600/80 dark:text-indigo-400/80 mt-0.5 font-medium">
                {formatMoney(stats.projectedValue)} forecast
              </p>
            </div>
            <div className="p-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 shrink-0">
              <TrendingUp size={16} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Master View Filter & Action Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-2xs">
        <div className="flex-1 flex flex-col sm:flex-row items-center gap-2">
          {/* Text Search */}
          <div className="relative flex-1 w-full">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Filter transactions by title, request ID, requester, vendor, department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-8.5 text-xs"
            />
          </div>

          {/* Quick Date Range Filter */}
          <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
            <SelectTrigger className="w-full sm:w-[155px] h-8.5 text-xs font-medium">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Dates</SelectItem>
              <SelectItem value="THIS_MONTH">Due This Month</SelectItem>
              <SelectItem value="NEXT_30">Next 30 Days</SelectItem>
              <SelectItem value="NEXT_90">Next 90 Days</SelectItem>
              <SelectItem value="THIS_YEAR">This Year (2026)</SelectItem>
              <SelectItem value="PAID">Paid / Historical</SelectItem>
            </SelectContent>
          </Select>

          {/* Installment Status Filter */}
          <Select value={installmentStatusFilter} onValueChange={setInstallmentStatusFilter}>
            <SelectTrigger className="w-full sm:w-[145px] h-8.5 text-xs font-medium">
              <SelectValue placeholder="Schedule Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Schedules</SelectItem>
              <SelectItem value="PAID">Paid Only</SelectItem>
              <SelectItem value="CURRENT">Current / Due Next</SelectItem>
              <SelectItem value="PROJECTED">Projected Future</SelectItem>
            </SelectContent>
          </Select>

          {/* Review Status Filter */}
          <Select value={reviewFilter} onValueChange={setReviewFilter}>
            <SelectTrigger className="w-full sm:w-[145px] h-8.5 text-xs font-medium">
              <SelectValue placeholder="Review Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Reviews</SelectItem>
              <SelectItem value="REVIEWED">Reviewed (AP)</SelectItem>
              <SelectItem value="WAITING_FOR_REVIEW">Waiting Review</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Export & Reset Actions */}
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-8.5 gap-1.5 text-xs font-medium border-slate-300 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 shrink-0"
            title="Export master transactions list to CSV"
          >
            <Download size={13} />
            Export CSV
          </Button>
        </div>
      </div>

      {/* 3. Master Transactions Table */}
      <MasterTransactionsGrid s={s} />
    </div>
  );
};

export type { MasterTransactionItem } from "./masterTransactionsTable/types";
