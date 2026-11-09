import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";
import type { InvoicesState } from "../hooks/useInvoices";

export function FiltersSearchToolbar({ s }: { s: InvoicesState }) {
  const { quickFilter, setQuickFilter, clearFilters, hasActiveFilters, setWireFilter, wireFilter, setStatusFilter, statusFilter, setTypeFilter, typeFilter, setSearchQuery, searchQuery } = s;
  return (
    <div className="flex flex-col sm:flex-row items-center gap-3">
      {/* Search Input */}
      <div className="relative flex-1 w-full">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by Request #, vendor, bank, account, product..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-8 h-9"
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

      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        {/* Due / Urgency Filter */}
        <Select value={quickFilter} onValueChange={(v) => setQuickFilter(v as any)}>
          <SelectTrigger className="w-[155px] h-9 text-xs">
            <SelectValue placeholder="All Due Dates" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Due Dates</SelectItem>
            <SelectItem value="DUE_TODAY">Due on Today</SelectItem>
            <SelectItem value="DUE_SOON">Due in 7 Days</SelectItem>
            <SelectItem value="OVERDUE">Overdue Payment</SelectItem>
            <SelectItem value="PENDING">Pending Payment</SelectItem>
          </SelectContent>
        </Select>

        {/* Request Type Filter */}
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px] h-9 text-xs">
            <SelectValue placeholder="Request Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types (Wire &amp; Sched)</SelectItem>
            <SelectItem value="WIRE">Wire Transfer</SelectItem>
            <SelectItem value="SCHEDULED">Schedule Payment</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[155px] h-9 text-xs">
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
          <SelectTrigger className="w-[150px] h-9 text-xs">
            <SelectValue placeholder="Wire Details" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Wire Statuses</SelectItem>
            <SelectItem value="WITH_WIRE">Wire Info Configured</SelectItem>
            <SelectItem value="WITHOUT_WIRE">Missing Wire Info</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9 px-2.5 text-xs text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
          >
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
