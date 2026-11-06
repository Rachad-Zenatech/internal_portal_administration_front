import { FloatingVerticalFilter } from "@/components/ui/FloatingVerticalFilter";
import { ChevronRight } from "lucide-react";
import { formatMoney } from "@/pages/Purchasing/utils/purchasingMeta";
import { Activity, AlertTriangle, ReceiptText, CalendarCheck, Search, X, UserCheck, ShieldCheck, Check, Sparkles, Building2, Users, RefreshCw, CheckSquare, FolderPlus, Edit2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import HelpIcon from "@/components/ui/HelpIcon";
import TaskBoard from "@/components/Tasks/TaskBoard";
import TaskList from "@/components/Tasks/TaskList";
import TaskDetailPanel from "@/components/Tasks/TaskDetailPanel";
import { MultiUserApproverPopover } from "./dashboard/components/MultiUserApproverPopover";
import { useDashboard } from "./dashboard/hooks/useDashboard";
import { MultiModuleOperationsSummary } from "./dashboard/sections/MultiModuleOperationsSummary";
import { MyApprovalsOnlyRendered } from "./dashboard/sections/MyApprovalsOnlyRendered";
import { StatsSummaryTopToolbar } from "./dashboard/sections/StatsSummaryTopToolbar";
import { RenderCustomGroups } from "./dashboard/sections/RenderCustomGroups";
import { UngroupedDepartmentsContainer } from "./dashboard/sections/UngroupedDepartmentsContainer";
import { Tab2OperationalRoles } from "./dashboard/sections/Tab2OperationalRoles";

export default function Dashboard() {
  const s = useDashboard();
  const { isRenamingGroup, renameGroupName, handleRenameGroup, setRenameGroupId, setRenameGroupName, renameGroupId, isCreatingGroup, newGroupName, handleCreateGroup, setIsCreateGroupOpen, setNewGroupName, isCreateGroupOpen, isSavingAssignments, handleSaveApproverAssignments, setIsApproverModalOpen, filteredDeptApprovers, handleToggleSelectAll, selectedDepts, isDeptLoading, setSelectedDepts, isBatchSaving, handleBatchAssignApprovers, allUsers, isApproverModalOpen, selectedTask, handleTaskClick, fetchRequests, setSelectedTask, filteredTasks, setDashboardFilter, setSearchQuery, dashboardFilter, searchQuery, navigate, recurringDueAmount, recurringDueCount, kpiRef, purchasingSummary, activeCount, handleOpenApproverModal, user } = s;
  return (
    <div className="w-full space-y-3.5 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out relative">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Welcome back, {user?.full_name || "Admin"}
            </h1>
            <HelpIcon text="Provides a high-level overview of system metrics, active users, recent audit actions, and task execution counts." />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            This is your central administrative dashboard.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={handleOpenApproverModal}
            className="flex items-center gap-2 text-xs font-semibold bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-xs hover:bg-slate-50 dark:hover:bg-zinc-800 hover:border-indigo-300 transition-all h-9 px-3.5"
          >
            <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Assign Approvers</span>
          </Button>
        </div>
      </header>

      {/* Slim Vertical Floating Quick Filter (Aligned with operational cards) */}
      <FloatingVerticalFilter
        items={[
          {
            key: "ALL",
            label: "Active Requests",
            count: purchasingSummary?.open_requests ?? activeCount,
            icon: Activity,
            color: "blue",
          },
          {
            key: "APPROVALS",
            label: "Awaiting Approval",
            count: purchasingSummary?.awaiting_approval ?? 0,
            icon: UserCheck,
            color: "violet",
          },
          {
            key: "UNPAID_INVOICES",
            label: "Unpaid Invoices",
            count: purchasingSummary?.unpaid_invoices ?? 0,
            icon: ReceiptText,
            color: "orange",
          },
          {
            key: "RECURRING",
            label: "Recurring Subscriptions",
            count: purchasingSummary?.recurring_total ?? 0,
            icon: CalendarCheck,
            color: "amber",
          },
        ]}
        activeKey={dashboardFilter}
        onSelect={setDashboardFilter}
        defaultKey="ALL"
        onReset={() => setDashboardFilter("ALL")}
        scrollThreshold={140}
        title="Overview Filters"
        kpiRef={kpiRef}
      />

      {/* Recurring Payments Due Soon Alert Banner */}
      {recurringDueCount > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 sm:px-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800/60 shadow-xs text-amber-900 dark:text-amber-200 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="text-xs sm:text-sm">
              <span className="font-bold">
                {recurringDueCount === 1 ? "1 Recurring Payment" : `${recurringDueCount} Recurring Payments`} Due Within 7 Days
              </span>
              {recurringDueAmount > 0 && (
                <span className="font-semibold ml-1.5 opacity-90">({formatMoney(recurringDueAmount)})</span>
              )}
              <span className="opacity-75 hidden md:inline ml-2 text-xs">
                Requires review and invoice processing for upcoming payment cycle.
              </span>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/purchasing/recurring")}
            className="h-7.5 px-3 text-xs font-semibold border-amber-300 dark:border-amber-700 bg-white dark:bg-zinc-900 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200 shrink-0 gap-1.5 shadow-2xs cursor-pointer"
          >
            <span>Review Payments</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Multi-Module Operations Summary Grid */}
      <MultiModuleOperationsSummary s={s} />

      {/* My Approvals — only rendered for assigned Level 1 / Level 2 approvers */}
      <MyApprovalsOnlyRendered s={s} />

      {/* Read-Only Tasks Board & Overview Section */}
      <Card className="border border-slate-200 dark:border-zinc-800 shadow-xs overflow-hidden w-full flex flex-col">
        <CardContent className="p-3.5 sm:p-4 flex flex-col gap-3 w-full">
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Tasks Overview</h2>
              <HelpIcon text="View active system tasks and workflows in read-only mode." />
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
              Read Only
            </span>
          </div>

          <Tabs defaultValue="board" className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <TabsList>
                <TabsTrigger value="board">Board View</TabsTrigger>
                <TabsTrigger value="list">List View</TabsTrigger>
              </TabsList>
              <div className="relative w-72">
                <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  className="pl-9 pr-8 bg-background h-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {(searchQuery || dashboardFilter !== "ALL") && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setDashboardFilter("ALL");
                    }}
                    className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground transition-colors"
                    title="Clear filter"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <TabsContent value="board" className="flex-1 min-h-0 m-0 data-[state=active]:flex flex-col overflow-hidden">
              <TaskBoard
                tasks={filteredTasks}
                onTaskClick={handleTaskClick}
                readOnly={true}
              />
            </TabsContent>

            <TabsContent value="list" className="flex-1 min-h-0 m-0 overflow-y-auto">
              <TaskList
                tasks={filteredTasks}
                onTaskClick={handleTaskClick}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Task Detail Modal */}
      <TaskDetailPanel
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={() => {
          fetchRequests();
          if (selectedTask?.id) handleTaskClick(selectedTask.id);
        }}
        readOnly={true}
      />

      {/* Executive Approver Assignment & Delegation Modal */}
      <Dialog open={isApproverModalOpen} onOpenChange={setIsApproverModalOpen}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                  CEO / Executive Approver & Workflow Assignment
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Organize departments into group tabs, assign multiple Level 1 approvers, and manage operational teams.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="departments" className="w-full mt-2">
            <TabsList className="grid grid-cols-2 w-full mb-4">
              <TabsTrigger value="departments" className="text-xs font-semibold gap-1.5 py-2">
                <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Level 1 Department Approvers
              </TabsTrigger>              <TabsTrigger value="operational" className="text-xs font-semibold gap-1.5 py-2">
                <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Operational Roles
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Department Level 1 Approvers */}
            <TabsContent value="departments" className="space-y-4 m-0">
              {/* Stats Summary & Top Toolbar */}
              <StatsSummaryTopToolbar s={s} />

              {/* Multi-Select Action Banner for Departments */}
              {selectedDepts.length > 0 && (
                <div className="flex items-center justify-between gap-3 p-3 bg-indigo-50/90 dark:bg-indigo-950/50 rounded-xl border border-indigo-200 dark:border-indigo-900/60 transition-all animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                    <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span>{selectedDepts.length} department(s) selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MultiUserApproverPopover
                      title={`Batch Assign Approvers (${selectedDepts.length} Departments)`}
                      subTitle={`Select one or more Level 1 approvers to assign to all ${selectedDepts.length} selected department(s).`}
                      users={allUsers}
                      selectedUserIds={[]}
                      onSave={handleBatchAssignApprovers}
                      isSaving={isBatchSaving}
                      triggerButton={
                        <Button
                          size="sm"
                          className="h-7.5 text-xs px-3 bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-xs font-medium cursor-pointer"
                        >
                          <Users className="h-3.5 w-3.5" />
                          <span>Assign Approvers to Selected</span>
                        </Button>
                      }
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedDepts([])}
                      className="h-7.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-zinc-800"
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
              )}

              {/* Department Groups Accordion & Ungrouped List */}
              {isDeptLoading ? (
                <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                  Loading workflow departments & groups...
                </div>
              ) : filteredDeptApprovers.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground bg-slate-50/50 dark:bg-zinc-900/30 rounded-xl border border-dashed">
                  No departments found matching your search.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Select All Toggle Bar */}
                  <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={
                          filteredDeptApprovers.length > 0 &&
                          filteredDeptApprovers.every((d) => selectedDepts.includes(d.department))
                        }
                        onCheckedChange={handleToggleSelectAll}
                        aria-label="Select all visible departments"
                      />
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        Select All Visible ({filteredDeptApprovers.length})
                      </span>
                    </div>
                    <span className="text-[11px] italic hidden sm:inline">
                      Tip: Drag and drop any department row to move between group tabs.
                    </span>
                  </div>

                  {/* Render Custom Groups */}
                  <RenderCustomGroups s={s} />

                  {/* Ungrouped Departments Container */}
                  <UngroupedDepartmentsContainer s={s} />
                </div>
              )}
            </TabsContent>

            {/* TAB 2: Operational Roles */}
            <Tab2OperationalRoles s={s} />
          </Tabs>

          <DialogFooter className="border-t border-slate-100 dark:border-zinc-800 pt-3">
            <Button variant="ghost" size="sm" onClick={() => setIsApproverModalOpen(false)}>
              Close
            </Button>
            <Button
              size="sm"
              onClick={handleSaveApproverAssignments}
              disabled={isSavingAssignments}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
            >
              {isSavingAssignments ? (
                "Saving..."
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Save Operational Roles
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Department Group Modal */}
      <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                <FolderPlus className="h-4 w-4" />
              </div>
              <DialogTitle className="text-base font-bold">Create Group Tab</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Create a group tab to organize multiple departments and assign approvers together.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Group Name <span className="text-red-500">*</span>
              </label>
              <Input
                autoFocus
                placeholder="e.g. Engineering & Technology, Sales & Marketing"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateGroupOpen(false)}
              disabled={isCreatingGroup}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreateGroup}
              disabled={isCreatingGroup || !newGroupName.trim()}
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              {isCreatingGroup ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              {isCreatingGroup ? "Creating..." : "Create Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Department Group Modal */}
      <Dialog open={Boolean(renameGroupId)} onOpenChange={(open) => !open && setRenameGroupId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                <Edit2 className="h-4 w-4" />
              </div>
              <DialogTitle className="text-base font-bold">Rename Group Tab</DialogTitle>
            </div>
          </DialogHeader>

          <div className="py-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Group Name
            </label>
            <Input
              autoFocus
              value={renameGroupName}
              onChange={(e) => setRenameGroupName(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRenameGroupId(null)}
              disabled={isRenamingGroup}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleRenameGroup}
              disabled={isRenamingGroup || !renameGroupName.trim()}
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              {isRenamingGroup ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              {isRenamingGroup ? "Saving..." : "Save Name"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
