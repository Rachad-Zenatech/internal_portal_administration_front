import { CheckCircle2, Clock, Circle, AlertCircle } from "lucide-react";
import type { WorkflowStepNode } from "@/services/experimentalWorkflowService";

interface PipelineStepItemProps {
  node: WorkflowStepNode;
  index: number;
  isCurrent: boolean;
  isDone: boolean;
  onSelectStep: (stepId: string) => void;
}

export function PipelineSingleStep({
  node,
  index,
  isCurrent,
  isDone,
  onSelectStep,
}: PipelineStepItemProps) {
  let pillClass =
    "bg-slate-100/80 text-slate-500 border border-slate-200/80 dark:bg-zinc-800/80 dark:text-zinc-400 dark:border-zinc-700/60";
  if (isCurrent) {
    pillClass =
      "bg-amber-500/15 text-amber-800 border-2 border-amber-500 dark:bg-amber-500/25 dark:text-amber-300 font-semibold shadow-xs";
  } else if (isDone) {
    pillClass =
      "bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400 font-medium";
  }

  return (
    <div className="flex flex-col items-center shrink-0 gap-1">
      <button
        type="button"
        onClick={() => onSelectStep(node.id)}
        title={`Stage ${index + 1}: ${node.title} (Click to jump)`}
        className={`w-max px-3 h-8 sm:h-9 inline-flex items-center justify-center gap-1.5 rounded-lg text-[11px] sm:text-xs font-medium whitespace-nowrap shrink-0 box-border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${pillClass}`}
      >
        {isDone ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
        ) : isCurrent ? (
          <Clock className="h-3.5 w-3.5 text-amber-500 animate-pulse shrink-0" />
        ) : (
          <Circle className="h-3 w-3 text-slate-400 dark:text-zinc-500 shrink-0" />
        )}
        <span className="text-center">{node.title}</span>
      </button>

      {node.reviewControl?.enabled && (
        <span
          title={`Internal Control Review: ${node.reviewControl.controlText || "Review required"}`}
          className="text-[9px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-900/60 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-2xs"
        >
          <AlertCircle className="w-2.5 h-2.5 text-rose-600 dark:text-rose-400" />
          Review Control
        </span>
      )}
    </div>
  );
}

interface PipelineClusterStepProps {
  clusterNodes: WorkflowStepNode[];
  startIndex: number;
  currentSimulatedNode?: WorkflowStepNode;
  currentSimulatedIndex: number;
  onSelectStep: (stepId: string) => void;
}

export function PipelineClusterStep({
  clusterNodes,
  startIndex,
  currentSimulatedNode,
  currentSimulatedIndex,
  onSelectStep,
}: PipelineClusterStepProps) {
  return (
    <div className="flex flex-col gap-1.5 items-center justify-center shrink-0 py-0.5">
      {clusterNodes.map((sub, sIdx) => {
        const absIdx = startIndex + sIdx;
        const isSubCurrent = sub.id === currentSimulatedNode?.id;
        const isSubDone = currentSimulatedIndex > -1 && absIdx < currentSimulatedIndex;

        let pillClass =
          "bg-slate-100/80 text-slate-500 border border-slate-200/80 dark:bg-zinc-800/80 dark:text-zinc-400 dark:border-zinc-700/60 font-medium";
        if (isSubCurrent) {
          pillClass =
            "bg-amber-500/15 text-amber-800 border-2 border-amber-500 dark:bg-amber-500/25 dark:text-amber-300 font-semibold shadow-xs";
        } else if (isSubDone) {
          pillClass =
            "bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400 font-medium";
        }

        return (
          <button
            key={sub.id}
            type="button"
            onClick={() => onSelectStep(sub.id)}
            title={`Stage ${absIdx + 1}: ${sub.title} (Click to jump)`}
            className={`w-max px-3 h-8 sm:h-9 inline-flex items-center justify-center gap-1.5 rounded-lg text-[11px] sm:text-xs font-medium whitespace-nowrap shrink-0 box-border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${pillClass}`}
          >
            {isSubDone ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            ) : isSubCurrent ? (
              <Clock className="h-3.5 w-3.5 text-amber-500 animate-pulse shrink-0" />
            ) : (
              <Circle className="h-3 w-3 text-slate-400 dark:text-zinc-500 shrink-0" />
            )}
            <span className="text-center">{sub.title}</span>
          </button>
        );
      })}
    </div>
  );
}
