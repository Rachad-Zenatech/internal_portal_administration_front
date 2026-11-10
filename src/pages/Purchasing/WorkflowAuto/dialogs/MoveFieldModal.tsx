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
  type WorkflowActionField,
  type WorkflowDomain,
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
  domain: WorkflowDomain;
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
    targetActionId: string,
    targetDomain?: WorkflowDomain
  ) => void;
}

const AVAILABLE_FLOWS: { domain: WorkflowDomain; label: string }[] = [
  { domain: "purchasing", label: "Spend Request Workflow" },
  { domain: "purchasing_quote", label: "Quote Request (RFQ) Workflow" },
  { domain: "invoices", label: "A/P & Invoices Workflow" },
];

export function MoveFieldModal({
  movingFieldInfo,
  nodes,
  domain,
  onClose,
  onMoveField,
  onTransferFieldToOtherDomain,
}: MoveFieldModalProps) {
  const otherFlows = AVAILABLE_FLOWS.filter((f) => f.domain !== domain);
  const [selectedTargetDomain, setSelectedTargetDomain] = useState<WorkflowDomain>(
    otherFlows[0]?.domain || "invoices"
  );
  const [otherDomainNodes, setOtherDomainNodes] = useState<WorkflowStepNode[]>([]);
  const [loadingOtherDomain, setLoadingOtherDomain] = useState(false);

  const targetFlowLabel = AVAILABLE_FLOWS.find((f) => f.domain === selectedTargetDomain)?.label || "Other Workflow";

  useEffect(() => {
    if (movingFieldInfo && selectedTargetDomain) {
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
  }, [movingFieldInfo, selectedTargetDomain]);

  if (!movingFieldInfo) {
    return null;
  }

  return (
    <Dialog open={!!movingFieldInfo} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-indigo-600" />
            Move / Transfer Action Field
          </DialogTitle>
          <DialogDescription className="text-xs">
            Reposition &ldquo;{movingFieldInfo.field.label}&rdquo; into another action button or another workflow.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 text-xs pr-1">
          {/* Relocate within current workflow */}
          <div className="p-3 bg-slate-50 dark:bg-zinc-800 rounded-lg border border-slate-200 dark:border-zinc-700 space-y-2">
            <div className="font-semibold text-slate-700 dark:text-zinc-300">
              Move to another action button in this workflow:
            </div>
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {nodes.map((step) => {
                if (step.actions.length === 0) return null;
                return (
                  <div key={step.id} className="space-y-1">
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      Stage: {step.title}
                    </div>
                    <div className="space-y-1 pl-2">
                      {step.actions.map((act) => {
                        const isCurrentAction =
                          step.id === movingFieldInfo.sourceStepId &&
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
                                step.id,
                                act.id
                              )
                            }
                            className={`w-full text-left p-1.5 rounded border text-xs flex items-center justify-between transition-colors ${
                              isCurrentAction
                                ? "bg-slate-100 dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700 opacity-60 cursor-not-allowed"
                                : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 hover:border-indigo-500 hover:bg-indigo-50/30 cursor-pointer"
                            }`}
                          >
                            <span className="font-medium text-slate-800 dark:text-zinc-200 truncate pr-2">
                              {act.label}
                            </span>
                            {isCurrentAction ? (
                              <span className="text-[10px] text-slate-400 bg-slate-200/70 dark:bg-zinc-700 px-1.5 py-0.5 rounded shrink-0">
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
              Select an action button in {targetFlowLabel} to transfer this field into:
            </p>

            {loadingOtherDomain ? (
              <div className="py-2 text-center text-slate-400 italic">
                Loading actions from {targetFlowLabel}...
              </div>
            ) : otherDomainNodes.length === 0 ? (
              <div className="py-2 text-center text-slate-400 italic">
                No stages found in {targetFlowLabel}.
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
                                act.id,
                                selectedTargetDomain
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
