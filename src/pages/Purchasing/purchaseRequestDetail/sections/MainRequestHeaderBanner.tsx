import { CalendarClock, ArrowRight, CheckCircle2, Clock, RefreshCw, Check, PauseCircle, PlayCircle, ExternalLink } from "lucide-react";
import { RequestStatus } from "@/types/purchasing";
import { formatDate, getStatusBadge, getStatusLabel } from "../../utils/purchasingMeta";
import PrioritySelector from "../../fields/PrioritySelector";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { PurchaseRequestDetailViewState } from "../hooks/usePurchaseRequestDetailTail";

export function MainRequestHeaderBanner({ v }: { v: PurchaseRequestDetailViewState }) {
  const { transitionMutation, setIsHoldDialogOpen, canPutOnHold, attachments, requestDetail, parsedStatus, allCyclesCompleted, currentCycle, totalCycles, reviewMutation, isReviewed, isOnHold, request, currentStepIndex, workflowSteps, refetch, setIsScheduleLedgerOpen, formattedItemUrl, cycleBracket } = v;
  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xl font-bold font-mono text-slate-400 dark:text-zinc-500">
                #{request.id}
              </span>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-zinc-100">
                {request.title}
              </h1>
              <Badge
                variant="outline"
                className={`text-xs px-2.5 py-1 font-semibold ${getStatusBadge(request.status)}`}
              >
                {getStatusLabel(request.status)}{cycleBracket}
              </Badge>

              {/* Priority Selector (1-click inline update) */}
              <PrioritySelector
                requestId={request.id}
                priority={request.priority}
                size="sm"
              />

              {/* Review status badge with inline toggle action */}
              <button
                type="button"
                onClick={() => reviewMutation.mutate(isReviewed ? "WAITING_FOR_REVIEW" : "REVIEWED")}
                disabled={reviewMutation.isPending}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                  isReviewed
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100"
                    : "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 hover:bg-amber-100"
                }`}
                title="Click to toggle review status"
              >
                {isReviewed ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Reviewed
                  </>
                ) : (
                  <>
                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                    Waiting for Review
                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 underline ml-0.5">
                      Click to Review ➔
                    </span>
                  </>
                )}
              </button>

              {/* Item / Product Link Badge */}
              {formattedItemUrl && (
                <a
                  href={formattedItemUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 transition-colors shadow-2xs group shrink-0"
                  title={`Open link in new tab: ${formattedItemUrl}`}
                >
                  <ExternalLink className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                  <span>Product Link ↗</span>
                </a>
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-2 flex-wrap">
              <span>· Recurring</span>
              <span>· Requested by <strong className="text-slate-800 dark:text-zinc-200">{request.requester}</strong> ({request.department})</span>
              {((request as any).class || request.quote_data?.class) && (
                <span className="inline-flex items-center gap-1">
                  · Class: <strong className="text-slate-800 dark:text-zinc-200">{(request as any).class || request.quote_data?.class}</strong>
                </span>
              )}
              {((request as any).location || request.quote_data?.location) && (
                <span className="inline-flex items-center gap-1">
                  · Location: <strong className="text-slate-800 dark:text-zinc-200">{(request as any).location || request.quote_data?.location}</strong>
                </span>
              )}
              {formattedItemUrl && (
                <span className="inline-flex items-center gap-1">
                  · Link: <a href={formattedItemUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline font-medium inline-flex items-center gap-0.5">
                    {formattedItemUrl.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]} <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </span>
              )}
              <span>· {formatDate(request.request_date || request.created_at)}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {formattedItemUrl && (
              <a
                href={formattedItemUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 transition-colors shadow-2xs"
                title={`Open vendor product link: ${formattedItemUrl}`}
              >
                <ExternalLink className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>Web Link ↗</span>
              </a>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsScheduleLedgerOpen(true)}
              className="text-xs gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-900/60 dark:text-indigo-300"
            >
              <CalendarClock className="h-4 w-4 text-indigo-600" />
              View Ledger
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="text-xs p-2 h-8 w-8"
              title="Refresh"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            </Button>
          </div>
        </div>

        {/* ── On Hold Banner ── */}
        {isOnHold && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
                <PauseCircle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200 flex items-center gap-2">
                  <span>Recurring Payment is Currently On Hold</span>
                  <Badge variant="outline" className="bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/60 dark:text-rose-300 text-[10px] py-0">
                    Workflow Paused
                  </Badge>
                </h4>
                <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">
                  {request.hold_reason ? `Reason: ${request.hold_reason}` : "Payment workflow is temporarily suspended."}
                  {request.hold_date ? ` (Since ${formatDate(request.hold_date)})` : ""}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() =>
                transitionMutation.mutate({
                  action: "RESUME_WORKFLOW",
                  comment: "Resumed workflow from On Hold",
                })
              }
              disabled={transitionMutation.isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1.5 h-8 font-semibold shadow-2xs"
            >
              <PlayCircle className="h-3.5 w-3.5" />
              {transitionMutation.isPending ? "Resuming..." : "Resume Workflow"}
            </Button>
          </div>
        )}

        {/* ── Workflow Action Bar / Stepper ── */}
        <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
              Workflow Status
            </span>
            <span className="text-xs text-slate-500 dark:text-zinc-400">
              {isOnHold ? (
                <span className="text-rose-600 dark:text-rose-400 font-medium">
                  ⏸ Request is On Hold (Workflow Paused)
                </span>
              ) : isReviewed ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  ✓ Request Reviewed & Verified
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  Action Required: Click 'Mark as Reviewed' to unlock invoice records & settlement
                </span>
              )}
            </span>
          </div>

          {/* Stepper Pipeline */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {workflowSteps.map((step, idx) => {
              const isCompleted = currentStepIndex > idx || parsedStatus === RequestStatus.Completed;
              const isCurrent = currentStepIndex === idx;

              return (
                <div
                  key={step.key}
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-xs transition-all ${
                    isCurrent
                      ? isOnHold
                        ? "bg-rose-50/80 border-rose-300 dark:bg-rose-950/50 dark:border-rose-800 text-rose-950 dark:text-rose-200 font-bold shadow-2xs"
                        : "bg-indigo-50/80 border-indigo-300 dark:bg-indigo-950/50 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200 font-bold shadow-2xs"
                      : isCompleted
                      ? "bg-slate-50 border-slate-200 dark:bg-zinc-800/40 dark:border-zinc-800 text-slate-600 dark:text-zinc-400"
                      : "bg-white dark:bg-zinc-950 border-dashed border-slate-200 dark:border-zinc-800 text-slate-400"
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isCurrent
                        ? isOnHold
                          ? "bg-rose-600 text-white"
                          : "bg-indigo-600 text-white"
                        : isCompleted
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-200 dark:bg-zinc-800 text-slate-500"
                    }`}
                  >
                    {isCompleted ? <Check className="h-3 w-3" /> : idx + 1}
                  </div>
                  <span className="truncate">{step.label}</span>
                </div>
              );
            })}
          </div>

          {/* Action Prompt Banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 flex items-center justify-between flex-wrap gap-3">
            <div className="text-xs text-slate-700 dark:text-zinc-300 flex items-center gap-2">
              <span className="font-bold text-indigo-600 dark:text-indigo-400">Action Required:</span>
              {isOnHold ? (
                <span>Payment workflow is currently <strong>ON HOLD</strong>. Click 'Resume Workflow' to reactivate schedule processing.</span>
              ) : !isReviewed ? (
                <span>Review pending. Click <strong>'Mark as Reviewed'</strong> to enable invoice records and milestone settlements.</span>
              ) : parsedStatus === RequestStatus.InvoiceReceived ? (
                <span>
                  Cycle {Math.min(currentCycle, totalCycles || currentCycle)} invoice received. Confirm settlement to return to <strong>Waiting Payment (Cycle {Math.min(currentCycle + 1, totalCycles || currentCycle + 1)})</strong>.
                </span>
              ) : parsedStatus === RequestStatus.WaitingPayment ? (
                <span>
                  Waiting for Cycle {Math.min(currentCycle, totalCycles || currentCycle)} payment {request.due_date ? `(Due: ${formatDate(request.due_date)})` : ""}. Record invoice from the schedule breakdown below when received.
                </span>
              ) : parsedStatus === RequestStatus.Completed ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  All recurring installment cycles have been completed.
                </span>
              ) : (
                <span>Request is verified. Manage upcoming cycle milestones from the schedule breakdown below.</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isOnHold ? (
                <Button
                  size="sm"
                  onClick={() =>
                    transitionMutation.mutate({
                      action: "RESUME_WORKFLOW",
                      comment: "Resumed workflow from On Hold",
                    })
                  }
                  disabled={transitionMutation.isPending}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1.5 h-8 font-semibold shadow-2xs"
                >
                  <PlayCircle className="h-3.5 w-3.5" />
                  {transitionMutation.isPending ? "Resuming..." : "Resume Workflow"}
                </Button>
              ) : !isReviewed ? (
                <Button
                  size="sm"
                  onClick={() => reviewMutation.mutate("REVIEWED")}
                  disabled={reviewMutation.isPending}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5 h-8 font-semibold shadow-2xs"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Mark as Reviewed
                </Button>
              ) : (
                <>
                  {(parsedStatus === RequestStatus.InvoiceReceived || parsedStatus === RequestStatus.WaitingPayment) && (
                    <Button
                      size="sm"
                      onClick={() => {
                        const hasInvOrReceipt = Boolean(
                          (requestDetail?.invoices && requestDetail.invoices.length > 0) ||
                          requestDetail?.invoice ||
                          attachments.length > 0
                        );
                        if (!hasInvOrReceipt) {
                          toast.error("Please record an invoice or upload a receipt before completing this request.");
                          return;
                        }
                        transitionMutation.mutate({
                          action: "COMPLETE",
                          comment: `Settled cycle ${currentCycle} payment and advanced recurring cycle`,
                        });
                      }}
                      disabled={transitionMutation.isPending}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5 h-8 font-semibold shadow-2xs"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                      {allCyclesCompleted || (totalCycles && currentCycle >= totalCycles)
                        ? "Confirm Settlement & Mark Completed"
                        : `Confirm Payment & Advance to Cycle ${currentCycle + 1}`}
                    </Button>
                  )}
                  {allCyclesCompleted && parsedStatus !== RequestStatus.Completed && parsedStatus !== RequestStatus.InvoiceReceived && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const hasInvOrReceipt = Boolean(
                          (requestDetail?.invoices && requestDetail.invoices.length > 0) ||
                          requestDetail?.invoice ||
                          attachments.length > 0
                        );
                        if (!hasInvOrReceipt) {
                          toast.error("Please record an invoice or upload a receipt before completing this request.");
                          return;
                        }
                        transitionMutation.mutate({
                          action: "COMPLETE",
                          comment: "Completed recurring billing item",
                        });
                      }}
                      disabled={transitionMutation.isPending}
                      className="text-xs h-8 text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Mark Completed
                    </Button>
                  )}
                  {canPutOnHold && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsHoldDialogOpen(true)}
                      disabled={transitionMutation.isPending}
                      className="text-xs h-8 text-rose-700 border-rose-300 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-300 font-medium"
                    >
                      <PauseCircle className="h-3.5 w-3.5 mr-1 text-rose-600" />
                      Put on Hold
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}
