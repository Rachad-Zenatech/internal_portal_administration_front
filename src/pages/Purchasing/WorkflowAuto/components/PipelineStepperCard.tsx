import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { WorkflowStepNode } from "@/services/experimentalWorkflowService";
import { PipelineSingleStep, PipelineClusterStep } from "./PipelineStepItem";

interface PipelineStepperCardProps {
  nodes: WorkflowStepNode[];
  currentSimulatedNode?: WorkflowStepNode;
  currentSimulatedIndex: number;
  onSelectStep: (stepId: string) => void;
}

interface DisplayItem {
  type: "single" | "cluster";
  node?: WorkflowStepNode;
  clusterNodes?: WorkflowStepNode[];
  startIndex: number;
}

function buildPipelineDisplayItems(nodes: WorkflowStepNode[]): DisplayItem[] {
  const items: DisplayItem[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    const next1 = nodes[i + 1];
    const next2 = nodes[i + 2];
    const isMatchCluster =
      n.statusKey === "APPROVED" &&
      next1?.statusKey === "GOODS_RECEIVED" &&
      next2?.statusKey === "INVOICE_RECEIVED";

    if (isMatchCluster) {
      items.push({
        type: "cluster",
        clusterNodes: [n, next1, next2],
        startIndex: i,
      });
      i += 2;
    } else {
      items.push({
        type: "single",
        node: n,
        startIndex: i,
      });
    }
  }
  return items;
}

export function PipelineStepperCard({
  nodes,
  currentSimulatedNode,
  currentSimulatedIndex,
  onSelectStep,
}: PipelineStepperCardProps) {
  const items = React.useMemo(() => buildPipelineDisplayItems(nodes), [nodes]);

  return (
    <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm">
      <CardContent className="py-5 px-6">
        <div className="relative w-full overflow-x-auto overflow-y-hidden flex items-center justify-between gap-1 sm:gap-1.5 py-1.5 px-0.5 touch-pan-x scroll-smooth [&::-webkit-scrollbar]:hidden">
          {items.map((item, i) => {
            const isDone =
              item.type === "cluster"
                ? currentSimulatedIndex > -1 &&
                  item.startIndex + (item.clusterNodes?.length || 0) <= currentSimulatedIndex
                : currentSimulatedIndex > -1 && item.startIndex < currentSimulatedIndex;

            return (
              <React.Fragment key={`pipeline-item-${i}`}>
                {item.type === "cluster" ? (
                  <PipelineClusterStep
                    clusterNodes={item.clusterNodes!}
                    startIndex={item.startIndex}
                    currentSimulatedNode={currentSimulatedNode}
                    currentSimulatedIndex={currentSimulatedIndex}
                    onSelectStep={onSelectStep}
                  />
                ) : (
                  <PipelineSingleStep
                    node={item.node!}
                    index={item.startIndex}
                    isCurrent={item.node!.id === currentSimulatedNode?.id}
                    isDone={isDone}
                    onSelectStep={onSelectStep}
                  />
                )}

                {i < items.length - 1 && (
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
