import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { WorkflowStepNode } from "@/services/experimentalWorkflowService";
import { resolveUserDepartment } from "@/lib/userDepartment";

interface ChangeOwnerModalProps {
  editingOwnerNode: { node: WorkflowStepNode; index: number } | null;
  usersList: any[];
  rolesList: any[];
  ownerSearch: string;
  setOwnerSearch: (val: string) => void;
  customRoleInput: string;
  setCustomRoleInput: (val: string) => void;
  onClose: () => void;
  onSelectOwnerUser: (user: any) => void;
  onSaveCustomOwnerRole: () => void;
}

export function ChangeOwnerModal({
  editingOwnerNode,
  usersList,
  rolesList,
  ownerSearch,
  setOwnerSearch,
  customRoleInput,
  setCustomRoleInput,
  onClose,
  onSelectOwnerUser,
  onSaveCustomOwnerRole,
}: ChangeOwnerModalProps) {
  if (!editingOwnerNode) {
    return null;
  }

  const { node } = editingOwnerNode;

  return (
    <Dialog open={!!editingOwnerNode} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:max-w-[500px] p-6 max-h-[90vh] flex flex-col gap-0 rounded-2xl overflow-hidden">
        <DialogHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            Change Stage Owner: {node.title}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Select a user from your organization to be responsible for this stage. Their assigned role will be updated automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto py-3 space-y-3 text-xs pr-1">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-zinc-300">
              Search Users
            </label>
            <Input
              value={ownerSearch}
              onChange={(e) => setOwnerSearch(e.target.value)}
              placeholder="Search user by name, email, or role..."
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Assign to User ({usersList.length} available)
            </label>
            <div className="max-h-56 overflow-y-auto space-y-1 border border-slate-200 dark:border-zinc-800 rounded-lg p-1">
              {usersList
                .filter((u: any) => {
                  if (!ownerSearch.trim()) return true;
                  const q = ownerSearch.toLowerCase();
                  const name = (u.full_name || "").toLowerCase();
                  const email = (u.email || "").toLowerCase();
                  const dept = (u.department || "").toLowerCase();
                  const role = (u.role || "").toLowerCase();
                  return name.includes(q) || email.includes(q) || dept.includes(q) || role.includes(q);
                })
                .slice(0, 100)
                .map((u: any) => {
                  const fullName = u.full_name || u.email || "Unnamed User";
                  const roleStr = u.is_super_admin
                    ? "Super Admin"
                    : u.role ||
                      u.assigned_roles?.map((r: any) => r.name || r.code).join(", ") ||
                      resolveUserDepartment(u, rolesList) ||
                      u.department ||
                      "Team Member";
                  const isSelected = node.assignedUser === fullName;

                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => onSelectOwnerUser(u)}
                      className={`w-full text-left p-2 rounded-md flex items-center justify-between text-xs transition-colors ${
                        isSelected
                          ? "bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-300 dark:border-indigo-800"
                          : "hover:bg-slate-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-medium text-slate-900 dark:text-zinc-100 truncate block">
                          {fullName}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate block">
                          {u.email}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 shrink-0 font-normal"
                      >
                        {roleStr}
                      </Badge>
                    </button>
                  );
                })}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-zinc-300 block">
              Or Set Custom Role / Team Description
            </label>
            <div className="flex items-center gap-2">
              <Input
                value={customRoleInput}
                onChange={(e) => setCustomRoleInput(e.target.value)}
                placeholder="e.g. Procurement Specialist, Department Manager"
                className="h-9 text-xs flex-1"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={onSaveCustomOwnerRole}
                className="h-9 text-xs px-3"
              >
                Save Role
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-slate-100 dark:border-zinc-800">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

