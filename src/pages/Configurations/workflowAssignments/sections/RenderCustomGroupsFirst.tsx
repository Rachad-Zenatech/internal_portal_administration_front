import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit2, ChevronDown, ChevronRight, Building2, UserCheck, RefreshCw, AlertCircle, ChevronsUpDown, FolderPlus, GripVertical, Trash2, Folder } from "lucide-react";
import { ApproverPill } from "../components/ApproverPill";
import { ApproverPillList } from "../components/ApproverPillList";
import { MultiUserApproverPopover } from "../components/MultiUserApproverPopover";
import type { WorkflowAssignmentsState } from "../hooks/useWorkflowAssignments";

export function RenderCustomGroupsFirst({ s }: { s: WorkflowAssignmentsState }) {
  const { deptGroups, handleMoveDepartment, handleSelectDepartmentApprovers, users, handleToggleSelectDept, setDragOverGroup, setDraggedDept, draggedDept, selectedDepts, savingDept, handleDeleteGroup, setRenameGroupName, setRenameGroupId, handleAssignGroupApprovers, toggleGroupExpand, dragOverGroup, savingGroup, expandedGroups, groupedDepartments } = s;
  return (
    <>
      {deptGroups.map((group) => {
                    const deptsInGroup = groupedDepartments[group.name] || [];
                    const isExpanded = expandedGroups[group.name] !== false;
                    const isDragOver = dragOverGroup === group.name;
                    const isGroupSaving = savingGroup === group.name;

                    const groupApprovers = group.approvers || [];
                    const groupApproverIds = group.approver_ids || [];

                    return (
                      <div
                        key={group.id}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverGroup(group.name);
                        }}
                        onDragLeave={() => {
                          if (dragOverGroup === group.name) setDragOverGroup(null);
                        }}
                        onDrop={async (e) => {
                          e.preventDefault();
                          setDragOverGroup(null);
                          const deptName = e.dataTransfer.getData("text/plain") || draggedDept;
                          if (deptName) {
                            await handleMoveDepartment(deptName, group.name);
                          }
                          setDraggedDept(null);
                        }}
                        className={`rounded-xl border transition-all duration-200 overflow-hidden shadow-2xs ${
                          isDragOver
                            ? "border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-50/20 dark:bg-indigo-950/20"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-zinc-950"
                        }`}
                      >
                        {/* Group Header / Accordion Trigger */}
                        <div className="p-3.5 sm:p-4 bg-slate-50/90 dark:bg-zinc-900/90 border-b border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div
                            onClick={() => toggleGroupExpand(group.name)}
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
                              <Folder className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                              <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                                {group.name}
                              </span>

                              <Badge
                                variant="secondary"
                                className="text-[11px] font-normal px-2 py-0.5 bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800"
                              >
                                {deptsInGroup.length} Department{deptsInGroup.length === 1 ? "" : "s"}
                              </Badge>

                              {/* Group Default Approvers Summary Badge */}
                              {groupApproverIds.length > 0 && (
                                <div className="flex items-center gap-1.5 ml-1">
                                  <span className="text-[11px] text-muted-foreground">Group Approvers:</span>
                                  <ApproverPillList approvers={groupApprovers} maxVisible={2} />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Group Actions */}
                          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                            {/* Assign multi-approvers to all in group */}
                            <MultiUserApproverPopover
                              title={`Assign Approver(s) to "${group.name}" Group`}
                              subTitle={`This will assign the selected approver(s) to all ${deptsInGroup.length} departments under this group.`}
                              users={users}
                              selectedUserIds={groupApproverIds}
                              isSaving={isGroupSaving}
                              onSave={(userIds) => handleAssignGroupApprovers(group.name, userIds)}
                              triggerButton={
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isGroupSaving}
                                  className="h-8 text-xs gap-1.5 bg-white dark:bg-zinc-950 shadow-2xs hover:border-emerald-500 hover:text-emerald-700"
                                >
                                  {isGroupSaving ? (
                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                                  )}
                                  Assign Group Approvers
                                </Button>
                              }
                            />

                            {/* Rename Group */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setRenameGroupId(group.id);
                                setRenameGroupName(group.name);
                              }}
                              className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900"
                              title="Rename Group"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>

                            {/* Delete Group */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteGroup(group)}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                              title="Delete Group"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Group Content (Accordion Body) */}
                        {isExpanded && (
                          <div className="p-0">
                            {deptsInGroup.length === 0 ? (
                              <div
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  setDragOverGroup(group.name);
                                }}
                                className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 m-3 rounded-lg text-xs text-muted-foreground space-y-1"
                              >
                                <FolderPlus className="h-6 w-6 mx-auto text-slate-400 opacity-60 mb-1" />
                                <p className="font-medium text-slate-700 dark:text-slate-300">
                                  No departments in this group yet
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  Drag and drop any department row here to add it to "{group.name}"
                                </p>
                              </div>
                            ) : (
                              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {deptsInGroup.map((dept) => {
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
                                          title="Drag to move department to another group"
                                        >
                                          <GripVertical className="h-4 w-4" />
                                        </div>

                                        <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={() => handleToggleSelectDept(dept.department)}
                                          aria-label={`Select ${dept.department}`}
                                        />

                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <div className="h-7 w-7 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                            <Building2 className="h-4 w-4" />
                                          </div>
                                          <div>
                                            <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                                              {dept.department}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Middle: Assigned Multi-Approvers Badges */}
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

                                      {/* Right: Actions (Multi-User Selector Popover & Move Dropdown) */}
                                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                                        {/* Multi-Approver Selector Button */}
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
                                        <select
                                          value={group.name}
                                          onChange={(e) => handleMoveDepartment(dept.department, e.target.value)}
                                          className="h-8 text-xs px-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-zinc-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                          title="Move to another group"
                                        >
                                          <option value={group.name}>{group.name} (Current)</option>
                                          <option value="__UNGROUPED__">&mdash; Move to Ungrouped &mdash;</option>
                                          {deptGroups
                                            .filter((g) => g.name !== group.name)
                                            .map((g) => (
                                              <option key={g.id} value={g.name}>
                                                Move to: {g.name}
                                              </option>
                                            ))}
                                        </select>
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
                  })}
    </>
  );
}
