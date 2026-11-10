import { GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { WorkflowStepNode, WorkflowActionButton } from "@/services/experimentalWorkflowService";

interface MovingActionInfo {
  sourceStepId: string;
  actionIndex: number;
  action: WorkflowActionButton;
}

interface MoveActionModalProps {
  movingActionInfo: MovingActionInfo | null;
  nodes: WorkflowStepNode[];
  onClose: () => void;
  onMoveActionToStage: (sourceStepId: string, actionIndex: number, targetStepId: string) => void;
}

export function MoveActionModal({
  movingActionInfo,
  nodes,
  onClose,
  onMoveActionToStage,
}: MoveActionModalProps) {
  if (!movingActionInfo) {
    return null;
  }

  return (
    <Dialog open={!!movingActionInfo} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-indigo-600" />
            Move Action to Another Stage
          </DialogTitle>
          <DialogDescription className="text-xs">
            Move action &ldquo;{movingActionInfo.action.label}&rdquo; from its current stage to any other stage in the workflow.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-zinc-800 rounded-lg border border-slate-200 dark:border-zinc-700 space-y-2">
            <div className="font-semibold text-slate-700 dark:text-zinc-300">
              Select destination stage:
            </div>
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {nodes.map((targetNode, targetIdx) => {
                const isSource = targetNode.id === movingActionInfo.sourceStepId;
                return (
                  <button
                    key={targetNode.id}
                    type="button"
                    disabled={isSource}
                    onClick={() =>
                      onMoveActionToStage(
                        movingActionInfo.sourceStepId,
                        movingActionInfo.actionIndex,
                        targetNode.id
                      )
                    }
                    className={`w-full text-left p-2.5 rounded-lg border flex items-center justify-between transition-colors ${
                      isSource
                        ? "bg-slate-100 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-700 opacity-60 cursor-not-allowed"
                        : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-[10px] flex items-center justify-center">
                        {targetIdx + 1}
                      </span>
                      <div>
                        <span className="font-medium text-slate-900 dark:text-zinc-100 block">
                          {targetNode.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {targetNode.actions.length} action{targetNode.actions.length === 1 ? "" : "s"} currently
                        </span>
                      </div>
                    </div>

                    {isSource ? (
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-200/70 dark:bg-zinc-700 px-2 py-0.5 rounded">
                        Current Stage
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                        Move Here &rarr;
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

