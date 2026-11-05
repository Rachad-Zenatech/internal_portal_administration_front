import HelpIcon from "@/components/ui/HelpIcon";
import { Clock, ExternalLink, FolderKanban, CheckCircle2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ACTION_META, PRIORITY_BADGE, getStatusBadge, getStatusLabel, formatDate, formatRequestType } from "../../utils/purchasingMeta";
import type { RequestDetailViewState } from "../hooks/useRequestDetailTail";

export function MainRequestHeaderFull({ v }: { v: RequestDetailViewState }) {
  const { request, data, purchase_order, isAPRequest, isRecurring, available_actions, isSelfApprovalBlocked, hasInvoiceOrReceipt, isReviewed, onAction, transition, reviewMutation, setIsProjectDialogOpen, setQuickProjectValue, canEditRequest, navigate } = v;
  return (
    <div className="w-full space-y-2.5">
        {/* Title with ID prefix and HelpIcon - Takes 100% full width */}
        <div className="flex items-start gap-2.5 w-full">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 leading-snug break-words flex-1 min-w-0 flex items-center gap-2 flex-wrap">
            <span className="text-blue-600 dark:text-blue-400 font-semibold mr-1 font-mono text-lg sm:text-xl">
              #{request.id}
            </span>
            <span>{request.title}</span>
            {data?.wire_transfer?.payment_series?.label && (
              <button
                type="button"
                onClick={() => document.getElementById("wire-payments")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                title="Show all payments of this series"
                className="shrink-0 cursor-pointer"
              >
                <Badge className="text-xs px-2 py-0.5 bg-teal-100 text-teal-800 hover:bg-teal-200 dark:bg-teal-950/80 dark:text-teal-300 border border-teal-300 dark:border-teal-700 font-bold shadow-2xs">
                  {data.wire_transfer.payment_series.label}
                </Badge>
              </button>
            )}
            {(request.source_portal === "m7a" || request.source_portal === "m&a" || request.source_portal === "m_and_a" || request.is_ma) && (
              <Badge className="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-700 font-bold shrink-0 shadow-2xs">
                M&amp;A
              </Badge>
            )}
            {(request.item_url || purchase_order?.item_url) && (
              <a
                href={(request.item_url || purchase_order?.item_url || "").startsWith("http") ? (request.item_url || purchase_order?.item_url || "#") : `https://${request.item_url || purchase_order?.item_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 transition-colors shrink-0 shadow-2xs ml-1"
                title={`Open vendor product page: ${request.item_url || purchase_order?.item_url}`}
              >
                <ExternalLink className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>Link ↗</span>
              </a>
            )}
          </h1>
          <span className="mt-1 shrink-0 inline-flex">
            <HelpIcon text="Detailed view of a single purchase request, including purchase order, invoices, and workflow approval logs." />
          </span>
        </div>

        {/* Status, Context Subtitle & Transition Actions Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 dark:text-zinc-400">
            {/* Primary Status Badge */}
            <Badge variant="outline" className={cn("font-medium gap-1.5 shadow-xs shrink-0 py-0.5 px-2.5", getStatusBadge(request.status))}>
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
              {getStatusLabel(request.status)}
            </Badge>

            {/* Priority: only show pill when HIGH or URGENT */}
            {(request.priority === "HIGH" || request.priority === "URGENT") && (
              <Badge variant="outline" className={cn("font-semibold shadow-xs shrink-0 py-0.5 px-2", PRIORITY_BADGE[request.priority])}>
                {request.priority}
              </Badge>
            )}

            {/* Project / Group Project Badge */}
            {request.project_name ? (
              <Badge
                variant="outline"
                className="font-medium gap-1.5 shadow-xs shrink-0 py-0.5 px-2.5 bg-indigo-50/80 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
                onClick={() => navigate(`/purchasing/requests?project=${encodeURIComponent(request.project_name!)}`)}
                title={`View all requests in project: ${request.project_name} (click to filter)`}
              >
                <FolderKanban className="h-3.5 w-3.5 text-indigo-500" />
                <span>Project: <strong className="text-indigo-900 dark:text-indigo-100">{request.project_name}</strong></span>
              </Badge>
            ) : canEditRequest ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuickProjectValue("");
                  setIsProjectDialogOpen(true);
                }}
                className="h-6 text-[11px] px-2 gap-1 border-dashed border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950/50"
                title="Assign this purchase request to a project"
              >
                <FolderKanban className="h-3 w-3 text-indigo-500" />
                <span>+ Add to Project</span>
              </Button>
            ) : null}

            {isRecurring && (
              <button
                onClick={() => {
                  const newRev = isReviewed ? "WAITING_FOR_REVIEW" : "REVIEWED";
                  reviewMutation.mutate({ id: request.id, review_status: newRev });
                }}
                disabled={reviewMutation.isPending}
                className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95 shrink-0 ${
                  isReviewed
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800"
                    : "bg-amber-50 text-amber-900 border-amber-400 hover:bg-amber-100 ring-2 ring-amber-300/50 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700"
                }`}
                title={isReviewed ? "Click to revert to Waiting for Review" : "Click to mark as Reviewed"}
              >
                {isReviewed ? (
                  <>
                    <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Reviewed</span>
                    <span className="text-[10px] opacity-60 group-hover:opacity-100 font-normal ml-0.5">
                      (Click to undo)
                    </span>
                  </>
                ) : (
                  <>
                    <Clock size={13} className="text-amber-600 dark:text-amber-400 shrink-0 animate-pulse" />
                    <span>Waiting for Review</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-200/90 dark:bg-amber-900 text-amber-800 dark:text-amber-200 group-hover:bg-amber-300 transition-colors">
                      Click to Review ➔
                    </span>
                  </>
                )}
              </button>
            )}

            <span className="text-slate-300 dark:text-zinc-700">·</span>

            {/* Clean contextual text */}
            <span className="font-medium text-slate-700 dark:text-zinc-300">
              {formatRequestType(request.request_type)}
            </span>

            <span className="opacity-40">·</span>

            <span>
              Requested by <strong className="font-medium text-slate-700 dark:text-zinc-300">{request.requester || "Unknown"}</strong>
              {request.department && <span className="opacity-75"> ({request.department})</span>}
            </span>

            {request.request_date && (
              <>
                <span className="opacity-40">·</span>
                <span>{formatDate(request.request_date)}</span>
              </>
            )}
          </div>

          {/* Workflow Transition Action Buttons */}
          {available_actions.filter(a => {
            if (a === "DELETE_REQUEST") return false;
            if (a === "UPDATE_TRACKING") return false; // shown in the tracking card instead
            if (a === "CREATE_PO" && (isRecurring || isAPRequest || Boolean(purchase_order) || request.status !== "UNDER_REVIEW")) return false;
            return true;
          }).length > 0 && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Action:</span>
              {isRecurring && !isReviewed && available_actions.includes("RECORD_INVOICE") && (
                <Button
                  size="sm"
                  disabled={reviewMutation.isPending}
                  onClick={() => reviewMutation.mutate({ id: request.id, review_status: "REVIEWED" })}
                  className="h-8 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white border-none shadow-sm flex items-center gap-1.5 cursor-pointer animate-pulse"
                  title="Click to mark as Reviewed and enable Record Invoice"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Mark as Reviewed
                </Button>
              )}
              {available_actions
                .filter(a => {
                  if (a === "DELETE_REQUEST") return false;
                  if (a === "UPDATE_TRACKING") return false; // shown in the tracking card instead
                  if (a === "CREATE_PO" && (isRecurring || isAPRequest || Boolean(purchase_order) || request.status !== "UNDER_REVIEW")) return false;
                  return true;
                })
                .map((action) => {
                  const meta = ACTION_META[action];
                  const isRecordInvoiceDisabled = isRecurring && action === "RECORD_INVOICE" && !isReviewed;
                  const isCompleteMissingInvoice = action === "COMPLETE" && !hasInvoiceOrReceipt;
                  const isDisabled = transition.isPending || isRecordInvoiceDisabled;
                  const buttonTitle = isRecordInvoiceDisabled
                    ? "Recurring request must be marked as 'Reviewed' before recording an invoice."
                    : isCompleteMissingInvoice
                    ? "An invoice or receipt must be recorded before completing this request."
                    : undefined;

                  const isApprove = action === "APPROVE";
                  const isReject = action === "REJECT";
                  const customClass = isApprove
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                    : isReject
                    ? "bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                    : isRecordInvoiceDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : "shadow-xs";

                  return (
                    <div key={action} title={buttonTitle} className="inline-block">
                      <Button
                        size="sm"
                        variant={isApprove || isReject ? "default" : meta.variant === "destructive" ? "destructive" : meta.variant === "outline" ? "outline" : "default"}
                        disabled={isDisabled}
                        onClick={() => onAction(action)}
                        className={cn("h-8 text-xs font-medium", customClass)}
                      >
                        {meta.label}
                      </Button>
                    </div>
                  );
                })}
              {isRecurring && !isReviewed && available_actions.includes("RECORD_INVOICE") && (
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium italic ml-1">
                  ← Click 'Mark as Reviewed' to enable Record Invoice
                </span>
              )}
              {!hasInvoiceOrReceipt && available_actions.includes("COMPLETE") && (
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium italic ml-1">
                  • Invoice or receipt required before completing
                </span>
              )}
            </div>
          )}

          {isSelfApprovalBlocked && available_actions.filter(a => a !== "DELETE_REQUEST" && !(a === "CREATE_PO" && (isRecurring || isAPRequest || Boolean(purchase_order) || request.status !== "UNDER_REVIEW"))).length === 0 && (
            <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 px-2.5 py-1 rounded-md shrink-0">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>Awaiting review by another approver (self-approval prohibited)</span>
            </div>
          )}
        </div>
      </div>
  );
}
