import { GripVertical, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface MoveStageModalProps {
  movingNodeIndex: number | null;
  nodes: WorkflowStepNode[];
  domain: "purchasing" | "invoices";
  onClose: () => void;
  onMoveStep: (fromIndex: number, toIndex: number) => void;
  onTransferToOtherDomain: (fromIndex: number) => void;
}

export function MoveStageModal({
  movingNodeIndex,
  nodes,
  domain,
  onClose,
  onMoveStep,
  onTransferToOtherDomain,
}: MoveStageModalProps) {
  if (movingNodeIndex === null || !nodes[movingNodeIndex]) {
    return null;
  }

  const currentNode = nodes[movingNodeIndex];

  return (
    <Dialog open={movingNodeIndex !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-indigo-600" />
            Move or Transfer Stage
          </DialogTitle>
          <DialogDescription className="text-xs">
            Reposition stage &ldquo;{currentNode.title}&rdquo; within this pipeline or relocate it to a different workflow.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-zinc-800 rounded-lg border border-slate-200 dark:border-zinc-700 space-y-2">
            <div className="font-semibold text-slate-700 dark:text-zinc-300">
              Reorder within current flow:
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={movingNodeIndex === 0}
                onClick={() => onMoveStep(movingNodeIndex, movingNodeIndex - 1)}
                className="flex-1 text-xs"
              >
                Move Left (Step {movingNodeIndex})
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={movingNodeIndex === nodes.length - 1}
                onClick={() => onMoveStep(movingNodeIndex, movingNodeIndex + 1)}
                className="flex-1 text-xs"
              >
                Move Right (Step {movingNodeIndex + 2})
              </Button>
            </div>
            <div className="pt-2">
              <label className="text-[11px] text-muted-foreground block mb-1">
                Or jump directly to stage slot:
              </label>
              <Select
                value={String(movingNodeIndex)}
                onValueChange={(val) => onMoveStep(movingNodeIndex, parseInt(val, 10))}
              >
                <SelectTrigger className="h-8 text-xs bg-white dark:bg-zinc-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {nodes.map((n, i) => (
                    <SelectItem key={n.id} value={String(i)}>
                      Position {i + 1}: {n.title} {i === movingNodeIndex ? "(Current)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cross-Flow Transfer */}
          <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-lg border border-indigo-200 dark:border-indigo-800/50 space-y-2">
            <div className="font-semibold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
              <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600" />
              Transfer to Other Workflow
            </div>
            <p className="text-[11px] text-muted-foreground">
              Move this entire step and its actions into the{" "}
              {domain === "purchasing" ? "A/P & Invoices Workflow" : "Purchase Requests Workflow"}.
            </p>
            <Button
              size="sm"
              onClick={() => onTransferToOtherDomain(movingNodeIndex)}
              className="w-full text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Transfer to {domain === "purchasing" ? "A/P & Invoices" : "Purchase Requests"}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

