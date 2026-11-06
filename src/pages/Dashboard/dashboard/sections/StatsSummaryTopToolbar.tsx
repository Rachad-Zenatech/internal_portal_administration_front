import { Search, Building2, AlertCircle, CheckCircle2, FolderPlus, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DashboardState } from "../hooks/useDashboard";

export function StatsSummaryTopToolbar({ s }: { s: DashboardState }) {
  const { setIsCreateGroupOpen, setNewGroupDeptNames, setNewGroupApproverIds, setNewGroupName, handleCollapseAll, handleExpandAll, setDeptTableSearch, deptTableSearch, deptStats } = s;
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-slate-50/80 dark:bg-zinc-900/60 rounded-xl border border-slate-200/80 dark:border-zinc-800">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="secondary" className="gap-1.5 bg-white dark:bg-zinc-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-zinc-700 py-1 px-2.5 font-medium shadow-2xs">
                    <Building2 className="h-3.5 w-3.5 text-slate-500" />
                    Departments: <span className="font-bold">{deptStats.total}</span>
                  </Badge>
                  <Badge variant="secondary" className="gap-1.5 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 py-1 px-2.5 font-medium shadow-2xs">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Assigned: <span className="font-bold">{deptStats.assigned}</span>
                  </Badge>
                  {deptStats.unassigned > 0 && (
                    <Badge variant="secondary" className="gap-1.5 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 py-1 px-2.5 font-medium shadow-2xs">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                      Unassigned: <span className="font-bold">{deptStats.unassigned}</span>
                    </Badge>
                  )}
                  <Badge variant="secondary" className="gap-1.5 bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 py-1 px-2.5 font-medium shadow-2xs">
                    <Layers className="h-3.5 w-3.5 text-indigo-600" />
                    Group Tabs: <span className="font-bold">{deptStats.groupsCount}</span>
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search departments, groups, users..."
                      value={deptTableSearch}
                      onChange={(e) => setDeptTableSearch(e.target.value)}
                      className="h-8 pl-8 text-xs bg-white dark:bg-zinc-800"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExpandAll}
                    className="h-8 text-xs px-2.5 gap-1 text-slate-700 dark:text-slate-300 hidden sm:flex"
                  >
                    Expand All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCollapseAll}
                    className="h-8 text-xs px-2.5 gap-1 text-slate-700 dark:text-slate-300 hidden sm:flex"
                  >
                    Collapse All
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setNewGroupName("");
                      setNewGroupApproverIds([]);
                      setNewGroupDeptNames([]);
                      setIsCreateGroupOpen(true);
                    }}
                    className="h-8 text-xs px-2.5 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shrink-0"
                  >
                    <FolderPlus className="h-3.5 w-3.5" />
                    <span>New Group</span>
                  </Button>
                </div>
              </div>
  );
}
