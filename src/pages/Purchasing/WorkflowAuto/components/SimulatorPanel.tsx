import { Play, UserCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { WorkflowStepNode, WorkflowActionButton } from "@/services/experimentalWorkflowService";

interface SimulatorPanelProps {
  currentSimulatedNode?: WorkflowStepNode;
  testExecutionLog: string[];
  onClearLog: () => void;
  onSimulateAction: (action: WorkflowActionButton) => void;
}

export function SimulatorPanel({
  currentSimulatedNode,
  testExecutionLog,
  onClearLog,
  onSimulateAction,
}: SimulatorPanelProps) {
  return (
    <Card className="border border-slate-200 dark:border-zinc-800 shadow-xs">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
              Live Interactive Workflow Simulator
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-[11px] border border-slate-200 dark:border-zinc-700">
              <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-muted-foreground">Managed By:</span>
              <span className="font-semibold text-slate-900 dark:text-zinc-100">
                {currentSimulatedNode?.assignedRole || "Unassigned"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Stage:</span>
              <Badge className="bg-indigo-600 text-white font-semibold">
                {currentSimulatedNode?.title || "None"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2 p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-lg border border-slate-200 dark:border-zinc-700">
            <div className="font-semibold text-slate-800 dark:text-zinc-200">
              Available Actions for Stage: &ldquo;{currentSimulatedNode?.title}&rdquo;
            </div>
            <p className="text-[11px] text-muted-foreground">
              Click any action button to test state changes, dropdown values, and transitions.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {currentSimulatedNode?.actions.map((act) => (
                <Button
                  key={act.id}
                  size="sm"
                  variant={act.variant || "default"}
                  onClick={() => onSimulateAction(act)}
                  className="h-8 text-xs font-semibold gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {act.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2 p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-lg border border-slate-200 dark:border-zinc-700 font-mono">
            <div className="font-sans font-semibold text-slate-800 dark:text-zinc-200 flex items-center justify-between">
              <span>Execution Trace Log</span>
              {testExecutionLog.length > 0 && (
                <button
                  type="button"
                  onClick={onClearLog}
                  className="text-[10px] text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="h-24 overflow-y-auto space-y-1 text-[11px] text-slate-600 dark:text-zinc-400">
              {testExecutionLog.length === 0 ? (
                <span className="text-slate-400 italic">
                  No events executed yet. Click an action above to test.
                </span>
              ) : (
                testExecutionLog.map((log, i) => (
                  <div key={i} className="leading-tight">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

