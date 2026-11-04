import { FolderKanban, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUS_FILTER_OPTIONS, getStatusLabel } from "../../utils/purchasingMeta";
import type { PurchaseRequestsState } from "../hooks/usePurchaseRequestsPage";

export function RequestFilterBar({ s }: { s: PurchaseRequestsState }) {
  const { knownProjects, setSearchParams, searchParams, projectFilter, typeFilter, handleStatusFilterChange, statusFilter, setSearch, search } = s;
  return (
    <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between shrink-0">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search requests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-0.5">
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="OPEN">Open (Non-Completed)</SelectItem>
              {STATUS_FILTER_OPTIONS.map((st) => (
                <SelectItem key={st} value={st}>
                  {getStatusLabel(st)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={typeFilter}
            onValueChange={(val) => {
              const newParams = new URLSearchParams(searchParams);
              if (val === "ALL") newParams.delete("request_type");
              else newParams.set("request_type", val);
              setSearchParams(newParams);
            }}
          >
            <SelectTrigger className="w-[150px] h-8 text-xs">
              <SelectValue placeholder="Request Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="SPEND">Spend Request</SelectItem>
              <SelectItem value="QUOTE">Quote Request</SelectItem>
              <SelectItem value="ADMIN">Admin Triage</SelectItem>
              <SelectItem value="ACCOUNTS_PAYABLE">Wire Transfer</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={projectFilter}
            onValueChange={(val) => {
              const newParams = new URLSearchParams(searchParams);
              if (val === "ALL") newParams.delete("project");
              else newParams.set("project", val);
              setSearchParams(newParams);
            }}
          >
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <div className="flex items-center gap-1.5 truncate">
                <FolderKanban className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                <SelectValue placeholder="All Projects" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Projects</SelectItem>
              {knownProjects.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
  );
}
