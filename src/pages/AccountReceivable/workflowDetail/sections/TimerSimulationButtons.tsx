import { ArrowRight, CheckCircle2, Clock, Timer, UserCheck } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { STATE_CONFIG } from "../constants";
import type { WorkflowDetailViewState } from "../hooks/useWorkflowDetailTail";

export function TimerSimulationButtons({ v }: { v: WorkflowDetailViewState }) {
  const { transitionMutation, currentType, allowedStates, currentState, setIsAssignClerkDialogOpen, workflow, setClerkRemarks, clerksList, setClerkEmail, isValueReconciled, timerMutation } = v;
  return (
    <div className="flex items-center gap-2 flex-wrap">
              {/* Timer Simulation Buttons */}
              {currentType !== "CASH" &&
                (currentState === "INVOICE_SENT" ||
                  currentState === "AWAITING_PAYMENT" ||
                  currentState === "DUNNING_REMINDER") && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => timerMutation.mutate("DUNNING_CHECK")}
                      disabled={timerMutation.isPending}
                      className="h-8 text-xs gap-1.5"
                    >
                      <Timer className="w-3.5 h-3.5 text-amber-500" />
                      <span>Simulate Dunning</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => timerMutation.mutate("INVOICE_REMINDER")}
                      disabled={timerMutation.isPending}
                      className="h-8 text-xs gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span>Dispatch Reminder</span>
                    </Button>
                  </>
                )}

              {/* Cash Workflow Actions */}
              {currentType === "CASH" && currentState === "PENDING_REVIEW" ? (
                <>
                  <Button
                    type="button"
                    onClick={() =>
                      transitionMutation.mutate({
                        targetState: "RECONCILED",
                        note: "Full Payment confirmed by Treasury. Marked & recorded to application.",
                        payload: { payment_match_type: "FULL_PAID" },
                      })
                    }
                    disabled={!isValueReconciled || transitionMutation.isPending}
                    title={
                      !isValueReconciled
                        ? "Cannot mark full paid: Payment has an unreconciled shortfall or remaining invoice balance. Please Assign to AR Clerk."
                        : undefined
                    }
                    className="h-8 px-3 text-xs font-semibold shadow-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-zinc-800 disabled:text-slate-500 dark:disabled:text-zinc-500 text-white shrink-0 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Full Paid & Reconcile</span>
                  </Button>

                  <Button
                    type="button"
                    onClick={() => {
                      setClerkEmail(workflow.metadata?.ar_clerk_assigned_to || clerksList[0]?.email || "sarah.jenkins@zenatech.com");
                      setClerkRemarks(workflow.metadata?.discrepancy_reason || "");
                      setIsAssignClerkDialogOpen(true);
                    }}
                    disabled={transitionMutation.isPending}
                    variant="outline"
                    className="h-8 px-3 text-xs font-semibold shadow-xs gap-1.5 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 shrink-0 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Assign to AR Clerk</span>
                  </Button>
                </>
              ) : currentType === "CASH" && currentState === "CLERK_REVIEW" ? (
                <>
                  <Button
                    type="button"
                    onClick={() =>
                      transitionMutation.mutate({
                        targetState: "RECONCILED",
                        note: "Discrepancy review resolved by AR Clerk. Shortfall cleared and marked reconciled.",
                        payload: { payment_match_type: "PARTIAL_PAID", clerk_resolved: true },
                      })
                    }
                    disabled={transitionMutation.isPending}
                    className="h-8 px-3 text-xs font-semibold shadow-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Resolve & Mark Reconciled</span>
                  </Button>

                  <Button
                    type="button"
                    onClick={() => {
                      setClerkEmail(workflow.metadata?.ar_clerk_assigned_to || clerksList[0]?.email || "sarah.jenkins@zenatech.com");
                      setClerkRemarks(workflow.metadata?.discrepancy_reason || "");
                      setIsAssignClerkDialogOpen(true);
                    }}
                    disabled={transitionMutation.isPending}
                    variant="outline"
                    className="h-8 px-3 text-xs font-semibold shadow-xs gap-1.5 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 shrink-0 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Reassign / Update Remarks</span>
                  </Button>
                </>
              ) : currentType === "CASH" && currentState === "RECONCILED" ? (
                <Button
                  type="button"
                  onClick={() =>
                    transitionMutation.mutate({
                      targetState: "COMPLETED",
                      note: "Reconciliation finalized. Ledger entries posted and workflow completed.",
                    })
                  }
                  disabled={transitionMutation.isPending}
                  className="h-8 px-3 text-xs font-semibold shadow-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Finalize & Post to Ledger</span>
                </Button>
              ) : (
                allowedStates
                  .filter((st) => st !== "CANCELLED")
                  .map((targetSt) => {
                    const conf = STATE_CONFIG[targetSt];
                    // Custom label computation based on BPMN
                    let btnLabel = `Advance to ${conf.label}`;
                    if (currentType === "INITIAL_SALE") {
                      if (targetSt === "PENDING_REVIEW") btnLabel = "Set Up Customer & PO Check";
                      else if (targetSt === "INVOICE_SENT") btnLabel = "Generate & Send Invoice [Invoiced]";
                      else if (targetSt === "AWAITING_PAYMENT") btnLabel = "Await Payment [Payment Received]";
                      else if (targetSt === "DUNNING_REMINDER") btnLabel = "Follow-up Overdue";
                      else if (targetSt === "RECONCILED") btnLabel = "Apply Cash [Paid]";
                      else if (targetSt === "COMPLETED") btnLabel = "Paid – Update AR Ledger & Fulfill";
                    } else if (currentType === "ADD_ON") {
                      if (targetSt === "PENDING_REVIEW") btnLabel = "Validate Contract & Prorate";
                      else if (targetSt === "INVOICE_SENT") btnLabel = "Issue & Send Add-On Invoice [Invoiced]";
                      else if (targetSt === "AWAITING_PAYMENT") btnLabel = "Await Payment [Payment Received]";
                      else if (targetSt === "DUNNING_REMINDER") btnLabel = "Follow-up Overdue";
                      else if (targetSt === "RECONCILED") btnLabel = "Apply Cash [Paid]";
                      else if (targetSt === "COMPLETED") btnLabel = "Consolidate into Renewal & Complete";
                    }

                    return (
                      <Button
                        key={targetSt}
                        type="button"
                        onClick={() =>
                          transitionMutation.mutate({
                            targetState: targetSt,
                            note: undefined,
                          })
                        }
                        disabled={transitionMutation.isPending}
                        className="h-8 px-3 text-xs font-semibold shadow-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 cursor-pointer"
                      >
                        <span>{btnLabel}</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    );
                  })
              )}
            </div>
  );
}
