import { Clock, ArrowRight, Activity } from "lucide-react";
import { Sheet, SheetContent } from "../../../../components/ui/sheet";
import type { WorkflowDetailDrawerGuardedState } from "./hooks/useWorkflowDetailDrawer";
import { useWorkflowDetailDrawerTail } from "./hooks/useWorkflowDetailDrawerTail";
import { DrawerHeader } from "./sections/DrawerHeader";
import { InitialSaleAttributes } from "./sections/InitialSaleAttributes";
import { NextStateTransitionButtons } from "./sections/NextStateTransitionButtons";

export function WorkflowDetailDrawerBody({ s }: { s: WorkflowDetailDrawerGuardedState }) {
  const v = { ...s, ...useWorkflowDetailDrawerTail(s) };
  const { workflow, activeTab, isLoading, onOpenChange, open } = v;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col bg-background border-l border-border shadow-2xl">
        {/* Drawer Header */}
        <DrawerHeader v={v} />

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-xs">
              <Clock className="w-4 h-4 animate-spin mr-2" />
              Loading workflow details...
            </div>
          ) : (
            <>
              {activeTab === "timeline" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                      <Activity className="w-4 h-4 text-primary" />
                      Chronological FSM Event Log
                    </h4>
                    <span className="text-[11px] text-muted-foreground">
                      Auto-recorded audit trail
                    </span>
                  </div>

                  <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                    {workflow?.logs && workflow.logs.length > 0 ? (
                      workflow.logs.map((log, idx) => (
                        <div key={log.id || idx} className="relative group">
                          {/* Timeline dot */}
                          <div className="absolute -left-[19px] top-1 w-3 h-3 rounded-full bg-background border-2 border-primary group-hover:scale-125 transition-transform" />

                          <div className="p-3 rounded-xl bg-card border border-border/70 hover:border-border transition-all shadow-2xs space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-wrap">
                                {log.from_state ? (
                                  <div className="flex items-center gap-1.5 text-xs font-mono">
                                    <span className="text-muted-foreground">
                                      {log.from_state}
                                    </span>
                                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                    <span className="font-bold text-foreground">
                                      {log.to_state}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs font-bold text-primary font-mono">
                                    INITIAL CREATION ({log.to_state})
                                  </span>
                                )}

                                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                  {log.trigger_type}
                                </span>
                              </div>

                              <span className="text-[10px] text-muted-foreground font-mono">
                                {new Date(log.created_at).toLocaleString()}
                              </span>
                            </div>

                            {log.note && (
                              <p className="text-xs text-foreground bg-muted/30 p-2 rounded-md border border-border/40">
                                {log.note}
                              </p>
                            )}

                            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                              <span>
                                Actor:{" "}
                                <strong className="text-foreground">
                                  {log.actor_name || log.actor_id || "System"}
                                </strong>
                              </span>
                              {log.payload && Object.keys(log.payload).length > 0 && (
                                <span className="font-mono text-[9px] text-muted-foreground">
                                  Payload: {JSON.stringify(log.payload)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        No state transition logs available.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <InitialSaleAttributes v={v} />

              <NextStateTransitionButtons v={v} />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
