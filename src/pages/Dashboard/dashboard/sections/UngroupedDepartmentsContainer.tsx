import { ChevronRight } from "lucide-react";
import { UserCheck, ChevronDown, Building2, RefreshCw, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ApproverPillList } from "../components/ApproverPillList";
import { MultiUserApproverPopover } from "../components/MultiUserApproverPopover";
import type { DashboardState } from "../hooks/useDashboard";

export function UngroupedDepartmentsContainer({ s }: { s: DashboardState }) {
  const { handleSelectDepartmentApprovers, allUsers, handleMoveDepartment, deptGroups, handleToggleSelectDept, handleDragEndDept, handleDragStartDept, draggedDept, savingDept, selectedDepts, toggleGroupExpand, handleDropOnGroup, handleDragLeaveGroup, handleDragOverGroup, dragOverGroup, expandedGroups, groupedDepartments } = s;
  return (
    <>
      {(() => {
                    const ungrouped = groupedDepartments["__UNGROUPED__"] || [];
                    if (ungrouped.length === 0 && deptGroups.length > 0) return null;
                    const isExpanded = expandedGroups["__UNGROUPED__"] !== false;
                    const isDragTarget = dragOverGroup === "__UNGROUPED__";

                    return (
                      <div
                        onDragOver={(e) => handleDragOverGroup(e, "__UNGROUPED__")}
                        onDragLeave={handleDragLeaveGroup}
                        onDrop={(e) => handleDropOnGroup(e, null)}
                        className={`rounded-xl border transition-all duration-150 ${
                          isDragTarget
                            ? "border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-50/30 dark:bg-indigo-950/20"
                            : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-2xs"
                        }`}
                      >
                        <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/60 dark:bg-zinc-900/80 rounded-t-xl">
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              type="button"
                              onClick={() => toggleGroupExpand("__UNGROUPED__")}
                              className="p-1 hover:bg-slate-200/70 dark:hover:bg-zinc-800 rounded-md transition-colors text-slate-500 dark:text-slate-400"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>

                            <div className="p-1.5 rounded-lg bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:text-slate-300 shrink-0">
                              <Building2 className="h-4 w-4" />
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                                {deptGroups.length > 0 ? "General / Ungrouped Departments" : "All Departments"}
                              </span>
                              <Badge variant="secondary" className="text-[10px] font-semibold">
                                {ungrouped.length} {ungrouped.length === 1 ? "dept" : "depts"}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                            {ungrouped.length === 0 ? (
                              <div className="py-6 px-4 text-center text-xs text-muted-foreground italic bg-slate-50/20 dark:bg-zinc-900/20">
                                No ungrouped departments. All departments belong to a group tab.
                              </div>
                            ) : (
                              ungrouped.map((dept) => {
                                const approversList = dept.approvers || (dept.approver_id ? [{
                                  id: dept.approver_id,
                                  full_name: dept.approver_name,
                                  email: dept.approver_email,
                                  job_title: dept.approver_title,
                                }] : []);
                                const isSelected = selectedDepts.includes(dept.department);
                                const isSaving = savingDept === dept.department;
                                const isBeingDragged = draggedDept === dept.department;

                                return (
                                  <div
                                    key={dept.department}
                                    draggable
                                    onDragStart={(e) => handleDragStartDept(e, dept.department)}
                                    onDragEnd={handleDragEndDept}
                                    className={`p-3 sm:px-4 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                                      isBeingDragged ? "opacity-40 bg-slate-100 dark:bg-zinc-800" : ""
                                    } ${isSelected ? "bg-indigo-50/40 dark:bg-indigo-950/20" : "hover:bg-slate-50/60 dark:hover:bg-zinc-900/40"}`}
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                        <GripVertical className="h-4 w-4" />
                                      </div>

                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => handleToggleSelectDept(dept.department)}
                                        aria-label={`Select ${dept.department}`}
                                      />

                                      <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold text-xs text-slate-900 dark:text-zinc-100 truncate">
                                            {dept.department}
                                          </span>
                                          {dept.source === "UNASSIGNED" && (
                                            <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40">
                                              Unassigned
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Approver Badges & Actions */}
                                    <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                                      <ApproverPillList approvers={approversList} />

                                      {deptGroups.length > 0 && (
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-7 text-[11px] px-2 text-muted-foreground hover:text-slate-900 dark:hover:text-slate-100 gap-1"
                                              title="Move to a group"
                                            >
                                              <span>Move to Group</span>
                                              <ChevronDown className="h-3 w-3" />
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent align="end" className="w-48 p-1 text-xs">
                                            <div className="px-2 py-1 font-semibold text-[11px] text-muted-foreground border-b mb-1">
                                              Move to Group Tab
                                            </div>
                                            {deptGroups.map((g) => (
                                              <div
                                                key={g.id}
                                                onClick={() => handleMoveDepartment(dept.department, g.name)}
                                                className="p-1.5 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-between"
                                              >
                                                <span className="truncate">{g.name}</span>
                                              </div>
                                            ))}
                                          </PopoverContent>
                                        </Popover>
                                      )}

                                      <MultiUserApproverPopover
                                        title={`Assign Approver(s) for "${dept.department}"`}
                                        subTitle="Select one or more Level 1 department approvers."
                                        users={allUsers}
                                        selectedUserIds={dept.approver_ids || (dept.approver_id ? [dept.approver_id] : [])}
                                        onSave={(ids) => handleSelectDepartmentApprovers(dept.department, ids)}
                                        isSaving={isSaving}
                                        triggerButton={
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 text-xs px-2.5 gap-1.5 border-slate-300 dark:border-zinc-700 hover:border-emerald-500 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 cursor-pointer"
                                          >
                                            {isSaving ? (
                                              <RefreshCw className="h-3 w-3 animate-spin" />
                                            ) : (
                                              <UserCheck className="h-3 w-3" />
                                            )}
                                            <span>{isSaving ? "Saving..." : approversList.length > 0 ? "Edit" : "Assign"}</span>
                                          </Button>
                                        }
                                      />
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
    </>
  );
}
