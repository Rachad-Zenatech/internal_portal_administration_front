import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronRight, Building2, RefreshCw, AlertCircle, ChevronsUpDown, GripVertical } from "lucide-react";
import { ApproverPill } from "../components/ApproverPill";
import { ApproverPillList } from "../components/ApproverPillList";
import { MultiUserApproverPopover } from "../components/MultiUserApproverPopover";
import type { WorkflowAssignmentsState } from "../hooks/useWorkflowAssignments";

export function UngroupedDepartmentsContainer({ s }: { s: WorkflowAssignmentsState }) {
  const { deptGroups, handleMoveDepartment, handleSelectDepartmentApprovers, users, handleToggleSelectDept, setDragOverGroup, setDraggedDept, draggedDept, selectedDepts, savingDept, toggleGroupExpand, dragOverGroup, expandedGroups, groupedDepartments } = s;
  return (
    <>
      {(() => {
                    const ungroupedDepts = groupedDepartments["__UNGROUPED__"] || [];
                    const isExpanded = expandedGroups["__UNGROUPED__"] !== false;
                    const isDragOver = dragOverGroup === "__UNGROUPED__";

                    return (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverGroup("__UNGROUPED__");
                        }}
                        onDragLeave={() => {
                          if (dragOverGroup === "__UNGROUPED__") setDragOverGroup(null);
                        }}
                        onDrop={async (e) => {
                          e.preventDefault();
                          setDragOverGroup(null);
                          const deptName = e.dataTransfer.getData("text/plain") || draggedDept;
                          if (deptName) {
                            await handleMoveDepartment(deptName, null);
                          }
                          setDraggedDept(null);
                        }}
                        className={`rounded-xl border transition-all duration-200 overflow-hidden shadow-2xs ${
                          isDragOver
                            ? "border-amber-500 ring-2 ring-amber-500/30 bg-amber-50/20 dark:bg-amber-950/20"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-zinc-950"
                        }`}
                      >
                        {/* Header */}
                        <div className="p-3.5 sm:p-4 bg-slate-50/90 dark:bg-zinc-900/90 border-b border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div
                            onClick={() => toggleGroupExpand("__UNGROUPED__")}
                            className="flex items-center gap-3 cursor-pointer select-none flex-1 min-w-0"
                          >
                            <button
                              type="button"
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-500 transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>

                            <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                              <Building2 className="h-4 w-4 text-slate-500 shrink-0" />
                              <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                                General / Ungrouped Departments
                              </span>

                              <Badge
                                variant="secondary"
                                className="text-[11px] font-normal px-2 py-0.5 bg-slate-200/70 text-slate-700 dark:bg-zinc-800 dark:text-slate-300"
                              >
                                {ungroupedDepts.length} Department{ungroupedDepts.length === 1 ? "" : "s"}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground italic">
                              Drag departments here to ungroup them
                            </span>
                          </div>
                        </div>

                        {/* Ungrouped Departments Table / List */}
                        {isExpanded && (
                          <div className="p-0">
                            {ungroupedDepts.length === 0 ? (
                              <div className="p-6 text-center text-xs text-muted-foreground">
                                All departments are organized into groups!
                              </div>
                            ) : (
                              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {ungroupedDepts.map((dept) => {
                                  const isSaving = savingDept === dept.department;
                                  const hasApprover = Boolean(
                                    dept.approver_id || (dept.approver_ids && dept.approver_ids.length > 0)
                                  );
                                  const isSelected = selectedDepts.includes(dept.department);
                                  const isDragging = draggedDept === dept.department;

                                  const deptApproverList = dept.approvers || [];
                                  const deptApproverIds = dept.approver_ids || (dept.approver_id ? [dept.approver_id] : []);

                                  return (
                                    <div
                                      key={dept.department}
                                      draggable={true}
                                      onDragStart={(e) => {
                                        setDraggedDept(dept.department);
                                        e.dataTransfer.setData("text/plain", dept.department);
                                        e.dataTransfer.effectAllowed = "move";
                                      }}
                                      onDragEnd={() => {
                                        setDraggedDept(null);
                                        setDragOverGroup(null);
                                      }}
                                      className={`p-3.5 sm:px-4 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                                        isDragging
                                          ? "opacity-40 bg-slate-100 dark:bg-zinc-800"
                                          : isSelected
                                          ? "bg-indigo-50/40 dark:bg-indigo-950/20"
                                          : "hover:bg-slate-50/60 dark:hover:bg-zinc-900/40"
                                      }`}
                                    >
                                      {/* Left: Drag Handle, Checkbox, Dept Name */}
                                      <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div
                                          className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                                          title="Drag to move department to a group"
                                        >
                                          <GripVertical className="h-4 w-4" />
                                        </div>

                                        <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={() => handleToggleSelectDept(dept.department)}
                                          aria-label={`Select ${dept.department}`}
                                        />

                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <div className="h-7 w-7 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                                            <Building2 className="h-4 w-4" />
                                          </div>
                                          <div>
                                            <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                                              {dept.department}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Middle: Multi-Approver Badges */}
                                      <div className="flex-1 min-w-0 pl-7 md:pl-0">
                                        {hasApprover && deptApproverList.length > 0 ? (
                                          <ApproverPillList approvers={deptApproverList} maxVisible={2} />
                                        ) : hasApprover && dept.approver_name ? (
                                          <ApproverPill
                                            name={dept.approver_name}
                                            email={dept.approver_email}
                                            title={dept.approver_title}
                                          />
                                        ) : (
                                          <div className="flex items-center gap-1.5 text-muted-foreground italic text-xs">
                                            <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                            <span>Not Assigned &mdash; Click Assign Approver</span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Right: Actions */}
                                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                                        <MultiUserApproverPopover
                                          title={`Level 1 Approver(s) for ${dept.department}`}
                                          subTitle="Search and select one or multiple users who can approve requests for this department."
                                          users={users}
                                          selectedUserIds={deptApproverIds}
                                          isSaving={isSaving}
                                          onSave={(userIds) =>
                                            handleSelectDepartmentApprovers(dept.department, userIds)
                                          }
                                          triggerButton={
                                            <Button
                                              variant={hasApprover ? "outline" : "default"}
                                              size="sm"
                                              disabled={isSaving}
                                              className={`h-8 text-xs px-3 shadow-xs gap-1.5 ${
                                                !hasApprover
                                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                                  : ""
                                              }`}
                                            >
                                              {isSaving ? (
                                                <RefreshCw className="h-3 w-3 animate-spin" />
                                              ) : (
                                                <ChevronsUpDown className="h-3.5 w-3.5 opacity-70" />
                                              )}
                                              {isSaving
                                                ? "Saving..."
                                                : hasApprover
                                                ? `Change (${deptApproverIds.length})`
                                                : "Assign Approver(s)"}
                                            </Button>
                                          }
                                        />

                                        {/* Quick Move to Group Dropdown */}
                                        {deptGroups.length > 0 && (
                                          <select
                                            value=""
                                            onChange={(e) => handleMoveDepartment(dept.department, e.target.value)}
                                            className="h-8 text-xs px-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-zinc-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                          >
                                            <option value="" disabled>Move to Group...</option>
                                            {deptGroups.map((g) => (
                                              <option key={g.id} value={g.name}>
                                                {g.name}
                                              </option>
                                            ))}
                                          </select>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
    </>
  );
}
