import { ArrowRight, Activity } from "lucide-react";
import { Badge } from "../../../../components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "../../../../components/ui/card";
import type { WorkflowDetailViewState } from "../hooks/useWorkflowDetailTail";

export function AuditTrailTab({ v }: { v: WorkflowDetailViewState }) {
  const { workflow, activeTab } = v;
  return (
    <>
      {activeTab === "timeline" && (
        <Card className="shadow-xs border-slate-200 dark:border-zinc-800">
          <CardHeader className="border-b border-slate-100 dark:border-zinc-800 px-6 py-3.5 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-zinc-100">
              <Activity className="h-5 w-5 text-indigo-600" />
              <span>Chronological State Machine Audit Log</span>
            </CardTitle>
            <span className="text-xs text-muted-foreground">Immutable event stream</span>
          </CardHeader>
          <CardContent className="p-6">
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-zinc-800">
              {workflow.logs && workflow.logs.length > 0 ? (
                workflow.logs.map((log, idx) => (
                  <div key={log.id || idx} className="relative group">
                    <div className="absolute -left-[19px] top-1 w-3 h-3 rounded-full bg-white dark:bg-zinc-900 border-2 border-indigo-600 group-hover:scale-125 transition-transform" />

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80 hover:border-indigo-400 transition-all shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          {log.from_state ? (
                            <div className="flex items-center gap-1.5 text-xs font-mono">
                              <span className="text-muted-foreground font-semibold">
                                {log.from_state}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="font-bold text-foreground">
                                {log.to_state}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                              INITIAL CREATION ({log.to_state})
                            </span>
                          )}

                          <Badge variant="outline" className="text-[10px] font-semibold uppercase">
                            {log.trigger_type}
                          </Badge>
                        </div>

                        <span className="text-[11px] text-muted-foreground font-mono">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>

                      {log.note && (
                        <p className="text-xs text-slate-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800">
                          {log.note}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                        <span>
                          Actor:{" "}
                          <strong className="text-foreground">
                            {log.actor_name || log.actor_id || "System"}
                          </strong>
                        </span>
                        {log.payload && Object.keys(log.payload).length > 0 && (
                          <span className="font-mono text-[10px] text-muted-foreground">
                            Payload: {JSON.stringify(log.payload)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">
                  No transition history available.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
