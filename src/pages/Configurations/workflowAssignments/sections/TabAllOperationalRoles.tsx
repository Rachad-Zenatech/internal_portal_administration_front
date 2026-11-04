import { formatRequestType } from "@/pages/Purchasing/utils/purchasingMeta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Edit2, Search, Building2, Users, User, Trash2 } from "lucide-react";
import { ROLE_STATES_MAP } from "../constants";
import type { WorkflowAssignmentsState } from "../hooks/useWorkflowAssignments";

export function TabAllOperationalRoles({ s }: { s: WorkflowAssignmentsState }) {
  const { handleDeleteAssignment, setIsFormOpen, setForm, users, operationalSearch, assignments, isLoading, setOperationalSearch } = s;
  return (
    <TabsContent value="all_roles" className="space-y-4 m-0">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-zinc-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  All Operational Assignments Directory
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Complete directory of all operational team handlers, scopes, and active statuses.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Filter by role or department..."
                    value={operationalSearch}
                    onChange={(e) => setOperationalSearch(e.target.value)}
                    className="pl-8 h-8 text-xs bg-white dark:bg-zinc-950"
                  />
                </div>
              </div>
            </div>

            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-12 text-center text-sm text-muted-foreground">Loading workflow assignments...</div>
              ) : assignments.length === 0 ? (
                <div className="p-12 text-center text-sm text-muted-foreground">No operational assignments configured yet.</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {assignments
                    .filter(
                      (a) =>
                        !operationalSearch ||
                        a.role.toLowerCase().includes(operationalSearch.toLowerCase()) ||
                        (a.department && a.department.toLowerCase().includes(operationalSearch.toLowerCase()))
                    )
                    .map((a) => {
                      const assignedUsers =
                        a.user_ids && a.user_ids.length > 0
                          ? a.user_ids.map((uid) => users.find((u) => u.id === uid)).filter(Boolean)
                          : a.user_id
                          ? [users.find((u) => u.id === a.user_id)].filter(Boolean)
                          : [];

                      const mappedStates = ROLE_STATES_MAP[a.role.toUpperCase()] || [];

                      return (
                        <div
                          key={a.id}
                          className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 transition-colors"
                        >
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-slate-900 dark:text-slate-100">{a.role}</span>

                              {a.department ? (
                                <Badge
                                  variant="outline"
                                  className="gap-1 text-xs font-medium bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                                >
                                  <Building2 className="h-3 w-3" />
                                  {a.department}
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-xs font-medium text-slate-600 bg-slate-50 border-slate-200 dark:bg-zinc-800/60 dark:text-slate-300 dark:border-slate-700"
                                >
                                  All / General Scope
                                </Badge>
                              )}

                              <Badge variant={a.active ? "default" : "secondary"} className="text-[11px]">
                                {a.active ? "Active" : "Inactive"}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-[11px] text-muted-foreground border-slate-200 dark:border-slate-700"
                              >
                                Type: {formatRequestType(a.request_type || "ALL")}
                              </Badge>
                            </div>

                            {mappedStates.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                <span className="text-xs text-muted-foreground">Handles:</span>
                                {mappedStates.map((state) => (
                                  <span
                                    key={state}
                                    className="inline-flex items-center text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700"
                                  >
                                    {state}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="flex flex-wrap items-center gap-2 pt-0.5">
                              <span className="text-xs text-muted-foreground">Assigned Team:</span>
                              {assignedUsers.length === 0 ? (
                                <span className="text-xs italic text-muted-foreground">None</span>
                              ) : (
                                assignedUsers.map((u: any) => (
                                  <Badge
                                    key={u.id}
                                    variant="secondary"
                                    className="text-xs font-normal bg-white dark:bg-zinc-800 border border-slate-200 dark:border-slate-700 shadow-xs gap-1.5"
                                  >
                                    <User className="h-3 w-3 opacity-60" />
                                    <span className="font-medium text-slate-900 dark:text-slate-100">
                                      {u.full_name || u.email}
                                    </span>
                                    {u.email && <span className="text-[11px] text-muted-foreground">({u.email})</span>}
                                    {u.job_title && (
                                      <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                                        &middot; {u.job_title}
                                      </span>
                                    )}
                                  </Badge>
                                ))
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setForm({
                                  ...a,
                                  department: a.department || null,
                                  user_ids:
                                    a.user_ids && a.user_ids.length > 0
                                      ? a.user_ids
                                      : a.user_id
                                      ? [a.user_id]
                                      : [],
                                  request_type: a.request_type || "ALL",
                                });
                                setIsFormOpen(true);
                              }}
                              className="h-8 px-3 shadow-xs"
                            >
                              <Edit2 className="mr-1.5 h-3.5 w-3.5" /> Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAssignment(a.id, a.role)}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                              title="Delete Assignment"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
  );
}
