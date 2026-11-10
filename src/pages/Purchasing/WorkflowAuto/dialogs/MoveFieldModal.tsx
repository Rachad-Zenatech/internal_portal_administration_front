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
  experimentalWorkflowService,
  type WorkflowStepNode,
  type WorkflowActionField,
} from "@/services/experimentalWorkflowService";

export interface MovingFieldInfo {
  sourceStepId: string;
  sourceActionId: string;
  fieldIndex: number;
  field: WorkflowActionField;
}

interface MoveFieldModalProps {
  movingFieldInfo: MovingFieldInfo | null;
  nodes: WorkflowStepNode[];
  domain: "purchasing" | "invoices";
  onClose: () => void;
  onMoveField: (
    sourceStepId: string,
    sourceActionId: string,
    fieldIndex: number,
    targetStepId: string,
    targetActionId: string
  ) => void;
  onTransferFieldToOtherDomain: (
    sourceStepId: string,
    sourceActionId: string,
    fieldIndex: number,
    targetStepId: string,
    targetActionId: string
  ) => void;
}

export function MoveFieldModal({
  movingFieldInfo,
  nodes,
  domain,
  onClose,
  onMoveField,
  onTransferFieldToOtherDomain,
}: MoveFieldModalProps) {
  const [otherDomainNodes, setOtherDomainNodes] = useState<WorkflowStepNode[]>([]);
  const [loadingOtherDomain, setLoadingOtherDomain] = useState(false);

  const targetDomainName = domain === "purchasing" ? "A/P & Invoices" : "Purchase Requests";
  const otherDomainKey = domain === "purchasing" ? "invoices" : "purchasing";

  useEffect(() => {
    if (movingFieldInfo) {
      setLoadingOtherDomain(true);
      experimentalWorkflowService
        .getWorkflowConfig(otherDomainKey)
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
  }, [movingFieldInfo, otherDomainKey]);

  if (!movingFieldInfo) {
    return null;
  }

  const { field } = movingFieldInfo;

  return (
    <Dialog open={!!movingFieldInfo} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-indigo-600" />
            Move Form Field: {field.label}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Transfer field &ldquo;{field.label}&rdquo; ({field.type}) into any action button in this flow or the other workflow.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs flex-1 overflow-y-auto pr-1">
          {/* Within current workflow */}
          <div className="p-3 bg-slate-50 dark:bg-zinc-800 rounded-lg border border-slate-200 dark:border-zinc-700 space-y-2">
            <div className="font-semibold text-slate-700 dark:text-zinc-300">
              Target Action in Current Workflow:
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {nodes.map((stepNode) => {
                if (stepNode.actions.length === 0) return null;
                return (
                  <div
                    key={stepNode.id}
                    className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 space-y-1.5"
                  >
                    <div className="font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      Stage: {stepNode.title}
                    </div>
                    <div className="space-y-1 pl-2">
                      {stepNode.actions.map((act) => {
                        const isCurrentAction =
                          stepNode.id === movingFieldInfo.sourceStepId &&
                          act.id === movingFieldInfo.sourceActionId;
                        return (
                          <button
                            key={act.id}
                            type="button"
                            disabled={isCurrentAction}
                            onClick={() =>
                              onMoveField(
                                movingFieldInfo.sourceStepId,
                                movingFieldInfo.sourceActionId,
                                movingFieldInfo.fieldIndex,
                                stepNode.id,
                                act.id
                              )
                            }
                            className={`w-full text-left p-1.5 rounded border text-xs flex items-center justify-between transition-colors ${
                              isCurrentAction
                                ? "bg-slate-100 dark:bg-zinc-800/60 opacity-60 cursor-not-allowed"
                                : "hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 hover:border-indigo-400 cursor-pointer"
                            }`}
                          >
                            <span className="font-medium text-slate-800 dark:text-zinc-200 truncate pr-2">
                              {act.label}
                            </span>
                            {isCurrentAction ? (
                              <span className="text-[9px] text-slate-400 font-semibold px-1 py-0.5 rounded bg-slate-200 dark:bg-zinc-700">
                                Current
                              </span>
                            ) : (
                              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold shrink-0">
                                Move Here &rarr;
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cross-Flow Transfer */}
          <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-lg border border-indigo-200 dark:border-indigo-800/50 space-y-2">
            <div className="font-semibold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
              <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600" />
              Target Action in {targetDomainName} Workflow:
            </div>
            <p className="text-[11px] text-muted-foreground">
              Select an action button in {targetDomainName} to transfer this field into:
            </p>

            {loadingOtherDomain ? (
              <div className="py-2 text-center text-slate-400 italic">
                Loading actions from {targetDomainName}...
              </div>
            ) : otherDomainNodes.length === 0 ? (
              <div className="py-2 text-center text-slate-400 italic">
                No stages found in {targetDomainName}.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {otherDomainNodes.map((otherStep) => {
                  if (otherStep.actions.length === 0) return null;
                  return (
                    <div
                      key={otherStep.id}
                      className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-indigo-200/60 dark:border-indigo-900/40 space-y-1.5"
                    >
                      <div className="font-semibold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5 text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                        Stage: {otherStep.title}
                      </div>
                      <div className="space-y-1 pl-2">
                        {otherStep.actions.map((act) => (
                          <button
                            key={act.id}
                            type="button"
                            onClick={() =>
                              onTransferFieldToOtherDomain(
                                movingFieldInfo.sourceStepId,
                                movingFieldInfo.sourceActionId,
                                movingFieldInfo.fieldIndex,
                                otherStep.id,
                                act.id
                              )
                            }
                            className="w-full text-left p-1.5 rounded border text-xs flex items-center justify-between hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-500 transition-colors cursor-pointer"
                          >
                            <span className="font-medium text-slate-800 dark:text-zinc-200 truncate pr-2">
                              {act.label}
                            </span>
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold shrink-0">
                              Transfer &rarr;
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

