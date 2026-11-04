import { ArrowRight, Timer, XCircle, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "../../../../../components/ui/button";
import { Input } from "../../../../../components/ui/input";
import { STATE_COLORS } from "../constants";
import type { WorkflowDetailDrawerViewState } from "../hooks/useWorkflowDetailDrawerTail";

export function NextStateTransitionButtons({ v }: { v: WorkflowDetailDrawerViewState }) {
  const { setShowDeletePrompt, deleteMutation, showDeletePrompt, setShowCancelPrompt, transitionMutation, cancellationReason, setCancellationReason, showCancelPrompt, allowedStates, timerMutation, currentState, transitionNote, setTransitionNote, currentType, activeTab } = v;
  return (
    <>
      {activeTab === "actions" && (
                <div className="space-y-5">
                  {/* Next State Transition Buttons */}
                  <div className="p-4 rounded-xl bg-card border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        Advance State (FSM Governed)
                      </h4>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        Current: {currentState}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Select an authorized target state according to the {currentType} finite state machine.
                    </p>

                    <div className="space-y-2">
                      <label className="text-[11px] font-medium text-muted-foreground">
                        Optional Transition Audit Note:
                      </label>
                      <Input
                        placeholder="e.g. Approved invoice dispatch after quote sign-off..."
                        value={transitionNote}
                        onChange={(e) => setTransitionNote(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                      {allowedStates
                        .filter((st) => st !== "CANCELLED")
                        .map((targetSt) => {
                          const conf = STATE_COLORS[targetSt];
                          return (
                            <Button
                              key={targetSt}
                              type="button"
                              variant="outline"
                              onClick={() =>
                                transitionMutation.mutate({
                                  targetState: targetSt,
                                  note: transitionNote.trim() || undefined,
                                })
                              }
                              disabled={transitionMutation.isPending}
                              className={`h-9 text-xs justify-between hover:${conf.bg} hover:${conf.text} border-border`}
                            >
                              <span>Advance to {conf.label}</span>
                              <ArrowRight className="w-3.5 h-3.5 ml-2 shrink-0" />
                            </Button>
                          );
                        })}
                    </div>

                    {allowedStates.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">
                        This workflow is in a terminal state ({currentState}). No further state transitions allowed.
                      </p>
                    )}
                  </div>

                  {/* System Timer Testing Trigger */}
                  <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-2.5">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                      <Timer className="w-4 h-4 text-amber-500" />
                      Background System Timer Simulation
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Trigger an asynchronous payment deadline expiration or recurring billing timer tick.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => timerMutation.mutate("DUNNING_CHECK")}
                        disabled={timerMutation.isPending}
                        className="text-xs gap-1.5"
                      >
                        <Timer className="w-3.5 h-3.5 text-amber-500" />
                        <span>Simulate Dunning Expiration</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => timerMutation.mutate("INVOICE_REMINDER")}
                        disabled={timerMutation.isPending}
                        className="text-xs"
                      >
                        Send Courtesy Reminder
                      </Button>
                    </div>
                  </div>

                  {/* Cancellation */}
                  {allowedStates.includes("CANCELLED") && (
                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 space-y-3">
                      <h4 className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        Cancel Workflow
                      </h4>
                      {showCancelPrompt ? (
                        <div className="space-y-2">
                          <Input
                            placeholder="Reason for cancellation..."
                            value={cancellationReason}
                            onChange={(e) => setCancellationReason(e.target.value)}
                            className="h-8 text-xs"
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                transitionMutation.mutate({
                                  targetState: "CANCELLED",
                                  note: cancellationReason || "Cancelled by user",
                                  payload: { reason: cancellationReason },
                                })
                              }
                              disabled={transitionMutation.isPending}
                              className="text-xs"
                            >
                              Confirm Cancellation
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setShowCancelPrompt(false)}
                              className="text-xs"
                            >
                              Back
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCancelPrompt(true)}
                          className="text-xs text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/10"
                        >
                          Cancel Workflow
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Delete Workflow */}
                  <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 space-y-3">
                    <h4 className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      Delete Workflow
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Permanently remove this workflow instance, transition audit logs, and associated records.
                    </p>
                    {showDeletePrompt ? (
                      <div className="space-y-2 pt-1">
                        <div className="text-xs text-red-600 dark:text-red-400 font-semibold">
                          Are you sure you want to permanently delete this workflow?
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteMutation.mutate()}
                            disabled={deleteMutation.isPending}
                            className="text-xs gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{deleteMutation.isPending ? "Deleting..." : "Confirm Delete"}</span>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDeletePrompt(false)}
                            className="text-xs"
                          >
                            Back
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeletePrompt(true)}
                        className="text-xs text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/10 gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Workflow</span>
                      </Button>
                    )}
                  </div>
                </div>
              )}
    </>
  );
}
