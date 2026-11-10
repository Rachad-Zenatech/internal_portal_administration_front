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
import { ShieldCheck, UserCheck } from "lucide-react";

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
  rolesList?: any[];
  usersList?: any[];
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
  rolesList: _rolesList = [],
  usersList: _usersList = [],
  onClose,
  onSave,
}: EditStageModalProps) {
  if (!editingNode) {
    return null;
  }

  // Common pre-configured internal audit presets
  const CONTROL_PRESETS = [
    {
      role: "Accounting / Controller",
      text: "Verify GL code & Category are coded properly before approving",
    },
    {
      role: "Finance / AP Specialist",
      text: "Verify vendor W-9 and banking details before disbursement",
    },
    {
      role: "Procurement / Legal",
      text: "Review master agreement & contractual deliverables compliance",
    },
    {
      role: "Executive / CFO Office",
      text: "High-value spend audit ($10,000+ incl. tax budget validation)",
    },
  ];

  return (
    <Dialog open={!!editingNode} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg w-full max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Edit Stage Details &amp; Controls</DialogTitle>
          <DialogDescription className="text-xs">
            Configure stage name, description, responsible owner/reviewer, and internal control audit checks.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 py-2 text-xs">
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
              rows={2}
              placeholder="Explain what occurs during this stage..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                Stage Reviewer / Role
              </label>
              <Input
                value={nodeAssignedRole}
                onChange={(e) => setNodeAssignedRole(e.target.value)}
                placeholder="e.g. Procurement Specialist, Department Manager"
                className="h-8 text-xs"
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
          </div>

          {/* Internal Review / Control Gate Setting */}
          <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="font-semibold text-rose-950 dark:text-rose-200 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={nodeReviewControlEnabled}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setNodeReviewControlEnabled(enabled);
                      if (enabled && !nodeReviewControlRole) {
                        setNodeReviewControlRole("Accounting / Controller");
                        setNodeReviewControlText("Verify GL code & Category are coded properly before approving");
                      }
                    }}
                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                  />
                  <ShieldCheck className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  Enable Internal Control Review
                </label>
                <p className="text-[11px] text-muted-foreground">
                  Places a formal verification gate (e.g. GL audit, budget sign-off) that must be audited before progressing.
                </p>
              </div>
            </div>

            {nodeReviewControlEnabled && (
              <div className="space-y-3 p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/50 mt-2">
                {/* Quick Presets */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">
                    Quick Control Presets
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {CONTROL_PRESETS.map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => {
                          setNodeReviewControlRole(preset.role);
                          setNodeReviewControlText(preset.text);
                        }}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-zinc-900 border border-rose-300 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-950 transition-colors text-rose-900 dark:text-rose-200 font-medium"
                      >
                        {preset.role.split("/")[0].trim()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  <div className="space-y-1">
                    <label className="font-semibold text-rose-900 dark:text-rose-200 text-[11px]">
                      Audited / Reviewed By (Who Reviews)
                    </label>
                    <Input
                      value={nodeReviewControlRole}
                      onChange={(e) => setNodeReviewControlRole(e.target.value)}
                      placeholder="e.g. Accounting / Controller / GL Specialist"
                      className="h-8 text-xs bg-white dark:bg-zinc-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-rose-900 dark:text-rose-200 text-[11px]">
                      Verification Requirement / What is Reviewed
                    </label>
                    <Textarea
                      value={nodeReviewControlText}
                      onChange={(e) => setNodeReviewControlText(e.target.value)}
                      rows={2}
                      placeholder="e.g. Verify GL code & Category are coded properly before approving"
                      className="text-xs bg-white dark:bg-zinc-900"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
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
