import { useState, useEffect } from "react";
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
import {
  experimentalWorkflowService,
  type WorkflowStepNode,
  type WorkflowActionButton,
  type WorkflowDomain,
} from "@/services/experimentalWorkflowService";

interface MovingActionInfo {
  sourceStepId: string;
  actionIndex: number;
  action: WorkflowActionButton;
}

interface MoveActionModalProps {
  movingActionInfo: MovingActionInfo | null;
  nodes: WorkflowStepNode[];
  domain: WorkflowDomain;
  onClose: () => void;
  onMoveActionToStage: (sourceStepId: string, actionIndex: number, targetStepId: string) => void;
  onTransferActionToOtherDomain: (
    sourceStepId: string,
    actionIndex: number,
    targetStepId: string,
    targetDomain?: WorkflowDomain
  ) => void;
}

const AVAILABLE_FLOWS: { domain: WorkflowDomain; label: string }[] = [
  { domain: "purchasing", label: "Spend Request Workflow" },
  { domain: "purchasing_quote", label: "Quote Request (RFQ) Workflow" },
  { domain: "invoices", label: "A/P & Invoices Workflow" },
];

export function MoveActionModal({
  movingActionInfo,
  nodes,
  domain,
  onClose,
  onMoveActionToStage,
  onTransferActionToOtherDomain,
}: MoveActionModalProps) {
  const otherFlows = AVAILABLE_FLOWS.filter((f) => f.domain !== domain);
  const [selectedTargetDomain, setSelectedTargetDomain] = useState<WorkflowDomain>(
    otherFlows[0]?.domain || "invoices"
  );
  const [otherDomainNodes, setOtherDomainNodes] = useState<WorkflowStepNode[]>([]);
  const [loadingOtherDomain, setLoadingOtherDomain] = useState(false);

  const targetFlowLabel = AVAILABLE_FLOWS.find((f) => f.domain === selectedTargetDomain)?.label || "Other Workflow";

  useEffect(() => {
    if (movingActionInfo && selectedTargetDomain) {
      setLoadingOtherDomain(true);
      experimentalWorkflowService
        .getWorkflowConfig(selectedTargetDomain)
        .then((res) => {
          setOtherDomainNodes(res.nodes || []);
        })
        .catch(() => {
          setOtherDomainNodes([]);
        })
        .finally(() => {
          setLoadingOtherDomain(false);
        });
    }
  }, [movingActionInfo, selectedTargetDomain]);

  if (!movingActionInfo) {
    return null;
  }

  return (
    <Dialog open={!!movingActionInfo} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-indigo-600" />
            Move Action Button
          </DialogTitle>
          <DialogDescription className="text-xs">
            Relocate &ldquo;{movingActionInfo.action.label}&rdquo; to another stage or another workflow.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 text-xs pr-1">
          {/* Reorder / Move within same workflow */}
          <div className="p-3 bg-slate-50 dark:bg-zinc-800 rounded-lg border border-slate-200 dark:border-zinc-700 space-y-2">
            <div className="font-semibold text-slate-700 dark:text-zinc-300">
              Move to another stage in this workflow:
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {nodes.map((node, idx) => {
                const isSource = node.id === movingActionInfo.sourceStepId;
                return (
                  <button
                    key={node.id}
                    type="button"
                    disabled={isSource}
                    onClick={() =>
                      onMoveActionToStage(
                        movingActionInfo.sourceStepId,
                        movingActionInfo.actionIndex,
                        node.id
                      )
                    }
                    className={`w-full text-left p-2 rounded-lg border flex items-center justify-between transition-colors ${
                      isSource
                        ? "bg-slate-100 dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700 opacity-60 cursor-not-allowed"
                        : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-[10px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-medium text-slate-900 dark:text-zinc-100 block">
                          {node.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {node.actions.length} action{node.actions.length === 1 ? "" : "s"}
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

          {/* Cross-Flow Transfer */}
          <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-lg border border-indigo-200 dark:border-indigo-800/50 space-y-2.5">
            <div className="font-semibold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
              <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600" />
              Transfer to Another Workflow:
            </div>
            <div>
              <label className="text-[11px] font-semibold text-indigo-950 dark:text-indigo-300 block mb-1">
                Target Workflow:
              </label>
              <Select
                value={selectedTargetDomain}
                onValueChange={(val) => setSelectedTargetDomain(val as WorkflowDomain)}
              >
                <SelectTrigger className="h-8 text-xs bg-white dark:bg-zinc-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {otherFlows.map((f) => (
                    <SelectItem key={f.domain} value={f.domain}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Select destination stage in {targetFlowLabel}:
            </p>

            {loadingOtherDomain ? (
              <div className="py-2 text-center text-slate-400 italic">
                Loading stages from {targetFlowLabel}...
              </div>
            ) : otherDomainNodes.length === 0 ? (
              <div className="py-2 text-center text-slate-400 italic">
                No stages found in {targetFlowLabel}.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {otherDomainNodes.map((otherNode, oIdx) => (
                  <button
                    key={otherNode.id}
                    type="button"
                    onClick={() =>
                      onTransferActionToOtherDomain(
                        movingActionInfo.sourceStepId,
                        movingActionInfo.actionIndex,
                        otherNode.id,
                        selectedTargetDomain
                      )
                    }
                    className="w-full text-left p-2 rounded-lg border bg-white dark:bg-zinc-900 border-indigo-200/70 dark:border-indigo-800/60 hover:border-indigo-600 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] flex items-center justify-center">
                        {oIdx + 1}
                      </span>
                      <div>
                        <span className="font-medium text-slate-900 dark:text-zinc-100 block">
                          {otherNode.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {otherNode.actions.length} action{otherNode.actions.length === 1 ? "" : "s"} currently
                        </span>
                      </div>
                    </div>

                    <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      Transfer &rarr;
                    </span>
                  </button>
                ))}
              </div>
            )}
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
