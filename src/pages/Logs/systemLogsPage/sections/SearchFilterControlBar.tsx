import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Calendar, Activity, Filter } from "lucide-react";
import type { SystemLogsPageState } from "../hooks/useSystemLogsPage";

export function SearchFilterControlBar({ s }: { s: SystemLogsPageState }) {
  const { setPage, setTimeFilter, timeFilter, setActionFilter, actionFilter, setEntityTypeFilter, entityTypeFilter, setSearch, search } = s;
  return (
    <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by user name, email, request title, action, or record ID..."
              className="pl-9 h-10 text-xs sm:text-sm bg-slate-50/50 dark:bg-zinc-900/50"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>

          {/* Entity Type Selector */}
          <div className="w-full md:w-56">
            <Select
              value={entityTypeFilter}
              onValueChange={(val) => {
                setEntityTypeFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10 text-xs sm:text-sm bg-slate-50/50 dark:bg-zinc-900/50 font-medium">
                <div className="flex items-center gap-1.5 truncate">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground mr-1">Entity:</span>
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Entity Types</SelectItem>
                <SelectItem value="PurchaseRequest">📦 Purchase Request</SelectItem>
                <SelectItem value="User">👤 User Account</SelectItem>
                <SelectItem value="Role">🛡️ Role & Permission</SelectItem>
                <SelectItem value="Workflow">⚙️ Workflow Assignment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Category Selector */}
          <div className="w-full md:w-56">
            <Select
              value={actionFilter}
              onValueChange={(val) => {
                setActionFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10 text-xs sm:text-sm bg-slate-50/50 dark:bg-zinc-900/50 font-medium">
                <div className="flex items-center gap-1.5 truncate">
                  <Activity className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground mr-1">Action:</span>
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Action Types</SelectItem>
                <SelectItem value="CREATED">✨ Created</SelectItem>
                <SelectItem value="SUBMITTED_FOR_APPROVAL">🚀 Submitted for Approval</SelectItem>
                <SelectItem value="START_REVIEW">🔍 Started Review</SelectItem>
                <SelectItem value="APPROVAL_DECISION">✅ Approved / Decision</SelectItem>
                <SelectItem value="PO_CREATED">📄 PO Created</SelectItem>
                <SelectItem value="INVOICE_PAID">💳 Invoice Paid</SelectItem>
                <SelectItem value="STATUS_CHANGED">🔄 Status Changed</SelectItem>
                <SelectItem value="REJECTED">❌ Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Time Window Filter */}
          <div className="w-full md:w-48">
            <Select
              value={timeFilter}
              onValueChange={(val) => {
                setTimeFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10 text-xs sm:text-sm bg-slate-50/50 dark:bg-zinc-900/50 font-medium">
                <div className="flex items-center gap-1.5 truncate">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Time</SelectItem>
                <SelectItem value="TODAY">Today Only</SelectItem>
                <SelectItem value="WEEK">Past 7 Days</SelectItem>
                <SelectItem value="MONTH">Past 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
  );
}
