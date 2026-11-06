import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { FolderPlus } from "lucide-react";
import type { WorkflowAssignmentsState } from "../hooks/useWorkflowAssignments";

export function CreateGroupTabDialog({ s }: { s: WorkflowAssignmentsState }) {
  const { isCreatingGroup, handleCreateGroup, newGroupName, setIsCreateGroupOpen, setNewGroupDeptNames, newGroupDeptNames, deptApprovers, setNewGroupApproverIds, newGroupApproverIds, users, setNewGroupName, isCreateGroupOpen } = s;
  return (
    <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-emerald-600" />
              Create Department Group Tab
            </DialogTitle>
            <DialogDescription>
              Create a group tab to organize multiple departments and assign approvers together.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-3">
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Group Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. Engineering & Technology, Operations, Facilities"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="bg-white dark:bg-zinc-950 text-xs"
                autoFocus
              />
            </div>

            {/* Initial Approvers (Multi-Select) */}
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Default Level 1 Approver(s) (Optional)
              </label>
              <p className="text-[11px] text-muted-foreground">
                These approvers will be assigned to all departments added into this group.
              </p>
              <div className="border rounded-md p-2 bg-slate-50 dark:bg-zinc-900/50 max-h-32 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {users
                  .filter((u) => u.is_active !== false)
                  .map((u) => {
                    const isSelected = newGroupApproverIds.includes(u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() => {
                          setNewGroupApproverIds((prev) =>
                            isSelected ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                          );
                        }}
                        className="py-1.5 px-2 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800 rounded"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Checkbox checked={isSelected} />
                          <span className="font-medium truncate">{u.full_name || u.email}</span>
                          {u.department && (
                            <span className="text-[10px] text-muted-foreground">({u.department})</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Initial Departments to include */}
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Add Departments to Group (Optional)
              </label>
              <div className="border rounded-md p-2 bg-slate-50 dark:bg-zinc-900/50 max-h-36 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {deptApprovers.map((d) => {
                  const isSelected = newGroupDeptNames.includes(d.department);
                  return (
                    <div
                      key={d.department}
                      onClick={() => {
                        setNewGroupDeptNames((prev) =>
                          isSelected ? prev.filter((name) => name !== d.department) : [...prev, d.department]
                        );
                      }}
                      className="py-1.5 px-2 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800 rounded"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Checkbox checked={isSelected} />
                        <span className="font-medium truncate">{d.department}</span>
                        {d.group_name && (
                          <span className="text-[10px] text-muted-foreground italic">(currently in {d.group_name})</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-3">
            <Button variant="outline" size="sm" onClick={() => setIsCreateGroupOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isCreatingGroup || !newGroupName.trim()}
              onClick={handleCreateGroup}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isCreatingGroup ? "Creating..." : "Create Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}
