import HelpIcon from "@/components/ui/HelpIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Building2, UserCheck, RefreshCw, CheckCircle2, AlertCircle, CheckSquare, Plus, Layers } from "lucide-react";
import { PRIMARY_ROLE_TABS } from "./workflowAssignments/constants";
import { MultiUserApproverPopover } from "./workflowAssignments/components/MultiUserApproverPopover";
import { useWorkflowAssignments } from "./workflowAssignments/hooks/useWorkflowAssignments";
import { RenderCustomGroupsFirst } from "./workflowAssignments/sections/RenderCustomGroupsFirst";
import { UngroupedDepartmentsContainer } from "./workflowAssignments/sections/UngroupedDepartmentsContainer";
import { TabAllOperationalRoles } from "./workflowAssignments/sections/TabAllOperationalRoles";
import { CreateGroupTabDialog } from "./workflowAssignments/sections/CreateGroupTabDialog";
import { EditRoleAssignmentDialog } from "./workflowAssignments/sections/EditRoleAssignmentDialog";

export default function WorkflowAssignments() {
  const s = useWorkflowAssignments();
  const { isRenamingGroup, handleRenameGroup, renameGroupName, setRenameGroupId, setRenameGroupName, renameGroupId, renderRoleTabContent, groupedDepartments, isDeptLoading, setSelectedDepts, selectedDepts, isBatchSaving, handleBatchAssignApprovers, users, setExpandedGroups, deptGroups, stats, handleToggleSelectAll, filteredDepartments, setDeptSearch, deptSearch, setIsCreateGroupOpen, setNewGroupDeptNames, setNewGroupApproverIds, setNewGroupName, assignments, getRoleUserCount, deptApprovers, setActiveTab, activeTab, isLoading, fetchData } = s;
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Workflow Roles & Approvers
            </h1>
            <HelpIcon text="Manage Level 1 Department Approvers, Level 2 Company Approvers, multi-approver assignments, drag-and-drop hierarchy, and operational teams (AP, Treasury, Purchasing)." />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Configure Level 1 & 2 approvers, custom department groups, multi-user approval routing, and operational handlers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading || isDeptLoading}
            className="h-9 gap-1.5 shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading || isDeptLoading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList className="flex flex-wrap w-full max-w-full overflow-x-auto justify-start bg-slate-100 dark:bg-zinc-900 p-1 rounded-lg gap-1">
          {PRIMARY_ROLE_TABS.map((tab) => {
            const Icon = tab.icon;
            let count: number | null = null;
            if (tab.key === "departments") {
              count = deptApprovers.length;
            } else if (tab.roleCode) {
              count = getRoleUserCount(tab.roleCode);
            } else if (tab.key === "all_roles") {
              count = assignments.length;
            }

            return (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className="gap-2 text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 shadow-2xs py-2 px-3"
              >
                <Icon className={`h-4 w-4 ${tab.color}`} />
                <span className="hidden md:inline">{tab.label}</span>
                <span className="md:hidden">{tab.shortLabel}</span>
                {count !== null && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 h-4 min-w-4 justify-center bg-slate-200/80 dark:bg-zinc-700"
                  >
                    {count}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* ── TAB 1: Department Level 1 Approvers with Group Accordions & Drag-and-Drop ── */}
        <TabsContent value="departments" className="space-y-4 m-0">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Top Toolbar */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-zinc-950 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Level 1 Department Approver Groups
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Organize departments into groups, drag & drop between groups, and assign multiple Level 1 approvers.
                </p>
              </div>

              {/* Action Buttons & Search */}
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  onClick={() => {
                    setNewGroupName("");
                    setNewGroupApproverIds([]);
                    setNewGroupDeptNames([]);
                    setIsCreateGroupOpen(true);
                  }}
                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create Group Tab
                </Button>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search department, group or approver..."
                    value={deptSearch}
                    onChange={(e) => setDeptSearch(e.target.value)}
                    className="pl-8 h-8 text-xs bg-white dark:bg-zinc-950"
                  />
                </div>
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="px-4 py-2.5 bg-slate-50/60 dark:bg-zinc-900/40 border-b border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 border-r border-slate-200 dark:border-slate-700 pr-2.5 mr-1">
                  <Checkbox
                    checked={
                      filteredDepartments.length > 0 &&
                      filteredDepartments.every((d) => selectedDepts.includes(d.department))
                    }
                    onCheckedChange={handleToggleSelectAll}
                    aria-label="Select all departments"
                  />
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Select All</span>
                </div>
                <Badge variant="secondary" className="gap-1 bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-300 font-normal border border-slate-200 dark:border-slate-700">
                  <Layers className="h-3 w-3 text-indigo-500" /> Groups: <span className="font-semibold">{stats.groupsCount}</span>
                </Badge>
                <Badge variant="secondary" className="gap-1 bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-300 font-normal border border-slate-200 dark:border-slate-700">
                  <Building2 className="h-3 w-3 text-slate-500" /> Departments: <span className="font-semibold">{stats.total}</span>
                </Badge>
                <Badge variant="secondary" className="gap-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-normal border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="h-3 w-3" /> Configured: <span className="font-semibold">{stats.assigned}</span>
                </Badge>
                {stats.unassigned > 0 && (
                  <Badge variant="secondary" className="gap-1 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 font-normal border-amber-200 dark:border-amber-800">
                    <AlertCircle className="h-3 w-3" /> Unassigned: <span className="font-semibold">{stats.unassigned}</span>
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const allOpen: Record<string, boolean> = { __UNGROUPED__: true };
                    deptGroups.forEach((g) => {
                      allOpen[g.name] = true;
                    });
                    setExpandedGroups(allOpen);
                  }}
                  className="h-7 text-[11px] px-2 text-slate-600 hover:text-slate-900"
                >
                  Expand All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedGroups({})}
                  className="h-7 text-[11px] px-2 text-slate-600 hover:text-slate-900"
                >
                  Collapse All
                </Button>
              </div>
            </div>

            {/* Bulk Selection Bar */}
            {selectedDepts.length > 0 && (
              <div className="px-4 py-2.5 bg-indigo-50/90 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/60 flex flex-wrap items-center justify-between gap-3 animate-in fade-in-50">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-950 dark:text-indigo-200">
                  <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>{selectedDepts.length} department{selectedDepts.length > 1 ? "s" : ""} selected</span>
                </div>

                <div className="flex items-center gap-2">
                  <MultiUserApproverPopover
                    title={`Assign Approver(s) to ${selectedDepts.length} Selected Departments`}
                    subTitle="Selected users will become Level 1 approvers for all checked departments."
                    users={users}
                    selectedUserIds={[]}
                    isSaving={isBatchSaving}
                    onSave={handleBatchAssignApprovers}
                    triggerButton={
                      <Button
                        size="sm"
                        disabled={isBatchSaving}
                        className="h-8 text-xs px-3 shadow-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
                      >
                        {isBatchSaving ? <RefreshCw className="h-3 w-3 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
                        {isBatchSaving ? "Saving..." : `Assign Approver(s) to ${selectedDepts.length} Selected`}
                      </Button>
                    }
                  />

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDepts([])}
                    className="h-8 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  >
                    Deselect All
                  </Button>
                </div>
              </div>
            )}

            {/* Accordion Group Containers */}
            <CardContent className="p-4 sm:p-6 space-y-4">
              {isDeptLoading ? (
                <div className="p-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />
                  Loading department approver groups...
                </div>
              ) : Object.keys(groupedDepartments).length === 0 ? (
                <div className="p-12 text-center text-sm text-muted-foreground">
                  No departments found.
                </div>
              ) : (
                <>
                  {/* Render Custom Groups First */}
                  <RenderCustomGroupsFirst s={s} />

                  {/* ── UNGROUPED DEPARTMENTS CONTAINER ── */}
                  <UngroupedDepartmentsContainer s={s} />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Role Tabs (Level 2 Approvers, Purchasing, AP, Treasury) ── */}
        {PRIMARY_ROLE_TABS.filter((t) => t.roleCode).map((tab) => (
          <TabsContent key={tab.key} value={tab.key} className="space-y-4 m-0">
            {renderRoleTabContent(tab)}
          </TabsContent>
        ))}

        {/* ── TAB: All Operational Roles Overview ── */}
        <TabAllOperationalRoles s={s} />
      </Tabs>

      {/* ── CREATE GROUP TAB DIALOG ── */}
      <CreateGroupTabDialog s={s} />

      {/* ── RENAME GROUP MODAL ── */}
      <Dialog open={Boolean(renameGroupId)} onOpenChange={(open) => !open && setRenameGroupId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Rename Department Group</DialogTitle>
            <DialogDescription>Update the name for this department group.</DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <Input
              value={renameGroupName}
              onChange={(e) => setRenameGroupName(e.target.value)}
              placeholder="Enter new group name"
              className="text-xs"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRenameGroupId(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isRenamingGroup || !renameGroupName.trim()}
              onClick={handleRenameGroup}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isRenamingGroup ? "Saving..." : "Save Name"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── EDIT ROLE ASSIGNMENT DIALOG ── */}
      <EditRoleAssignmentDialog s={s} />
    </div>
  );
}
