import React from "react";
import { CheckCircle2, Clock, Circle, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { WorkflowStepNode } from "@/services/experimentalWorkflowService";

interface PipelineStepperCardProps {
  nodes: WorkflowStepNode[];
  currentSimulatedNode?: WorkflowStepNode;
  currentSimulatedIndex: number;
  onSelectStep: (stepId: string) => void;
}

export function PipelineStepperCard({
  nodes,
  currentSimulatedNode,
  currentSimulatedIndex,
  onSelectStep,
}: PipelineStepperCardProps) {
  return (
    <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm">
      <CardContent className="py-5 px-6">
        <div className="relative w-full overflow-x-auto overflow-y-hidden flex items-center justify-between gap-1 sm:gap-1.5 py-1.5 px-0.5 touch-pan-x scroll-smooth [&::-webkit-scrollbar]:hidden">
          {nodes.map((node, i) => {
            const isCurrent = node.id === currentSimulatedNode?.id;
            const isDone = currentSimulatedIndex > -1 && i < currentSimulatedIndex;

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
              <React.Fragment key={`stepper-node-${node.id}-${i}`}>
                <div className="flex flex-col items-center shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => onSelectStep(node.id)}
                    title={`Stage ${i + 1}: ${node.title} (Click to jump)`}
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

                  {/* Review Control indicator badge underneath stepper pill */}
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

                {/* Flexible connector line */}
                {i < nodes.length - 1 && (
                  <div
                    className={`h-[2px] flex-1 min-w-[10px] sm:min-w-[16px] rounded-full transition-colors duration-200 shrink-0 ${
                      isDone
                        ? "bg-emerald-500/60 dark:bg-emerald-500/40"
                        : "bg-slate-200 dark:bg-zinc-700/80"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

