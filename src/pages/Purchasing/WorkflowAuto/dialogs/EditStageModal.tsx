import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WorkflowStepNode } from "@/services/experimentalWorkflowService";

interface EditStageModalProps {
  editingNode: { node: WorkflowStepNode; index: number } | null;
  nodeTitle: string;
  setNodeTitle: (val: string) => void;
  nodeDesc: string;
  setNodeDesc: (val: string) => void;
  nodeAssignedRole: string;
  setNodeAssignedRole: (val: string) => void;
  nodeBadge: string;
  setNodeBadge: (val: string) => void;
  nodeReviewControlEnabled: boolean;
  setNodeReviewControlEnabled: (val: boolean) => void;
  nodeReviewControlRole: string;
  setNodeReviewControlRole: (val: string) => void;
  nodeReviewControlText: string;
  setNodeReviewControlText: (val: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export function EditStageModal({
  editingNode,
  nodeTitle,
  setNodeTitle,
  nodeDesc,
  setNodeDesc,
  nodeAssignedRole,
  setNodeAssignedRole,
  nodeBadge,
  setNodeBadge,
  nodeReviewControlEnabled,
  setNodeReviewControlEnabled,
  nodeReviewControlRole,
  setNodeReviewControlRole,
  nodeReviewControlText,
  setNodeReviewControlText,
  onClose,
  onSave,
}: EditStageModalProps) {
  if (!editingNode) {
    return null;
  }

  return (
    <Dialog open={!!editingNode} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Edit Stage Details</DialogTitle>
          <DialogDescription className="text-xs">
            Configure stage title, description, and status badge color.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-zinc-300">Stage Title</label>
            <Input
              value={nodeTitle}
              onChange={(e) => setNodeTitle(e.target.value)}
              placeholder="e.g. Under Review / Executive Approval"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-zinc-300">Description</label>
            <Textarea
              value={nodeDesc}
              onChange={(e) => setNodeDesc(e.target.value)}
              rows={3}
              placeholder="Explain what occurs during this stage..."
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-zinc-300">
              Responsible Manager / Role (Who Manages this Flow Step)
            </label>
            <Input
              value={nodeAssignedRole}
              onChange={(e) => setNodeAssignedRole(e.target.value)}
              placeholder="e.g. Procurement Specialist, Dept Manager, CFO, AP Clerk"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-zinc-300">Badge Color Style</label>
            <Select value={nodeBadge} onValueChange={setNodeBadge}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slate">Slate (Default / New)</SelectItem>
                <SelectItem value="blue">Blue (Review / In Progress)</SelectItem>
                <SelectItem value="amber">Amber (Waiting Sign-off)</SelectItem>
                <SelectItem value="indigo">Indigo (Order / Settle)</SelectItem>
                <SelectItem value="emerald">Emerald (Approved / Completed)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Internal Review / Control Gate Setting */}
          <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={nodeReviewControlEnabled}
                    onChange={(e) => setNodeReviewControlEnabled(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Enable Internal Control Review
                </label>
                <p className="text-[11px] text-muted-foreground">
                  Adds a red review / verification control check (e.g. GL coding audit) under this stage.
                </p>
              </div>
            </div>

            {nodeReviewControlEnabled && (
              <div className="space-y-2.5 p-2.5 rounded-lg bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/50 mt-2">
                <div className="space-y-1">
                  <label className="font-medium text-rose-900 dark:text-rose-200 text-[11px]">
                    Reviewer Role / Auditor
                  </label>
                  <Input
                    value={nodeReviewControlRole}
                    onChange={(e) => setNodeReviewControlRole(e.target.value)}
                    placeholder="e.g. Accounting / Controller / GL Specialist"
                    className="h-8 text-xs bg-white dark:bg-zinc-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-rose-900 dark:text-rose-200 text-[11px]">
                    Verification / Review Requirement
                  </label>
                  <Input
                    value={nodeReviewControlText}
                    onChange={(e) => setNodeReviewControlText(e.target.value)}
                    placeholder="e.g. Verify GL code & Category are coded properly before approving"
                    className="h-8 text-xs bg-white dark:bg-zinc-900"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={onSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

