import { Search, X, UserCheck, Check, ChevronDown, Sparkles } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { DashboardState } from "../hooks/useDashboard";

export function Tab2OperationalRoles({ s }: { s: DashboardState }) {
  const { handleToggleUserInRole, allUsers, handleToggleEntraUser, graphSearchResults, userSearchText, isSearchingGraph, setUserSearchText, setActiveDropdownRole, activeDropdownRole, workflowAssignments } = s;
  return (
    <TabsContent value="operational" className="space-y-4 m-0">
              {[
                {
                  role: "PURCHASING",
                  label: "Purchasing Lead",
                  desc: "Vendor quote negotiations, purchase orders, and fulfillment.",
                  badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200",
                },
                {
                  role: "AP",
                  label: "Accounts Payable (AP)",
                  desc: "Invoice matching, vendor statement review, and GL validation.",
                  badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200",
                },
                {
                  role: "TREASURY",
                  label: "Treasury Officer",
                  desc: "Bank disbursement, wire authorization, and final settlement.",
                  badgeColor: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border-sky-200",
                },
                {
                  role: "ADMIN",
                  label: "System & Workflow Administrator",
                  desc: "Administrative system configuration and workflow management.",
                  badgeColor: "bg-slate-100 text-slate-800 dark:bg-zinc-800 dark:text-slate-300 border-slate-200",
                },
              ].map(({ role, label, desc, badgeColor }) => {
                const assignment = workflowAssignments.find((a) => a.role === role);
                const assignedIds: string[] = assignment?.user_ids || (assignment?.user_id ? [assignment.user_id] : []);

                return (
                  <div
                    key={role}
                    className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/40 space-y-2.5 transition-all hover:border-slate-300 dark:hover:border-zinc-700"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-zinc-100">{label}</span>
                          <Badge variant="outline" className={`text-[10px] font-semibold px-2 py-0.5 ${badgeColor}`}>
                            {role}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                      </div>

                      <Popover
                        open={activeDropdownRole === role}
                        onOpenChange={(open) => setActiveDropdownRole(open ? role : null)}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs font-medium border-dashed border-slate-300 dark:border-zinc-700 hover:border-indigo-400 bg-white dark:bg-zinc-900 shrink-0 mt-1 sm:mt-0"
                          >
                            <UserCheck className="w-3.5 h-3.5 mr-1 text-indigo-500" />
                            Assign / Edit
                            <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[360px] p-0" align="end">
                          <div className="flex items-center border-b px-3 py-2">
                            <Search className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
                            <input
                              placeholder="Search directory or Microsoft Entra..."
                              value={userSearchText}
                              onChange={(e) => setUserSearchText(e.target.value)}
                              className="w-full text-xs bg-transparent outline-none placeholder:text-muted-foreground"
                            />
                            {isSearchingGraph && <div className="w-3 h-3 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin ml-2 shrink-0" />}
                          </div>
                          <div className="max-h-[260px] overflow-y-auto p-1.5 space-y-1 divide-y divide-slate-100 dark:divide-zinc-800">
                            {/* Portal Directory Users */}
                            <div className="space-y-1 pb-1">
                              {allUsers
                                .filter(
                                  (u) =>
                                    u.is_active !== false &&
                                    (u.full_name || u.email || "")
                                      .toLowerCase()
                                      .includes(userSearchText.toLowerCase())
                                )
                                .map((u) => {
                                  const isChecked = assignedIds.includes(u.id);
                                  return (
                                    <button
                                      key={u.id}
                                      type="button"
                                      onClick={() => handleToggleUserInRole(role, u.id)}
                                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors text-left ${
                                        isChecked
                                          ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-medium"
                                          : "hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                                      }`}
                                    >
                                      <div className="flex flex-col min-w-0 pr-2">
                                        <span className="truncate">{u.full_name || "Unnamed"}</span>
                                        <span className="text-[10px] text-muted-foreground truncate">{u.email}</span>
                                      </div>
                                      {isChecked && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                                    </button>
                                  );
                                })}
                            </div>

                            {/* Microsoft Entra Graph Search Results */}
                            {graphSearchResults.length > 0 && (
                              <div className="pt-2 space-y-1">
                                <div className="px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" />
                                  Microsoft Entra Directory
                                </div>
                                {graphSearchResults
                                  .filter((gu) => !allUsers.some((u) => u.email && gu.email && u.email.toLowerCase() === gu.email.toLowerCase()))
                                  .map((gu) => {
                                    const entraKey = gu.object_id || gu.email;
                                    const isChecked = assignedIds.includes(entraKey);
                                    return (
                                      <button
                                        key={entraKey}
                                        type="button"
                                        onClick={() => handleToggleEntraUser(role, gu)}
                                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors text-left ${
                                          isChecked
                                            ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-medium"
                                            : "hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                                        }`}
                                      >
                                        <div className="flex flex-col min-w-0 pr-2">
                                          <div className="flex items-center gap-1.5">
                                            <span className="truncate">{gu.display_name || "Unnamed"}</span>
                                            <span className="px-1 py-0.2 text-[9px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 rounded font-medium">Entra</span>
                                          </div>
                                          <span className="text-[10px] text-muted-foreground truncate">{gu.email || gu.user_principal_name}</span>
                                        </div>
                                        {isChecked && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                                      </button>
                                    );
                                  })}
                              </div>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Assigned Users Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {assignedIds.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">No approvers assigned</span>
                      ) : (
                        assignedIds.map((uid) => {
                          const userObj = allUsers.find((x) => x.id === uid);
                          return (
                            <Badge
                              key={uid}
                              variant="secondary"
                              className="text-xs py-1 px-2.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-2xs flex items-center gap-1.5 font-normal text-slate-800 dark:text-zinc-200"
                            >
                              <span>{userObj?.full_name || userObj?.email || uid}</span>
                              <button
                                type="button"
                                onClick={() => handleToggleUserInRole(role, uid)}
                                className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 ml-0.5 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </TabsContent>
  );
}
