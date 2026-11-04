import { ExternalLink } from "lucide-react";
import { formatDate, formatMoney } from "../../utils/purchasingMeta";
import PrioritySelector from "../../fields/PrioritySelector";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PurchaseRequestDetailViewState } from "../hooks/usePurchaseRequestDetailTail";

export function RequestDetailsPropertyTable({ v }: { v: PurchaseRequestDetailViewState }) {
  const { request, formattedItemUrl, currentCycleAmount, totalCommitment, sched, invoice, requestDetail } = v;
  return (
    <Card className="shadow-xs border-slate-200 dark:border-zinc-800">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800/80">
              <CardTitle className="text-base font-bold flex items-center justify-between">
                <span>Request Details</span>
                <Badge variant="outline" className="text-xs font-normal">
                  ID: #{request.id}
                </Badge>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0 divide-y divide-slate-100 dark:divide-zinc-800/60 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-zinc-800/60">
                <div className="p-3.5 flex justify-between gap-2">
                  <span className="text-muted-foreground font-medium">Requester</span>
                  <span className="font-semibold text-slate-900 dark:text-zinc-100 text-right">
                    {request.requester}
                  </span>
                </div>
                <div className="p-3.5 flex justify-between gap-2">
                  <span className="text-muted-foreground font-medium">Assigned To</span>
                  <span className="font-semibold text-slate-900 dark:text-zinc-100 text-right">
                    {request.assigned_user || "David Caro / David Hernandez"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-zinc-800/60">
                <div className="p-3.5 flex justify-between gap-2">
                  <span className="text-muted-foreground font-medium">Type</span>
                  <Badge variant="outline" className="text-[11px] bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold py-0">
                    Recurring
                  </Badge>
                </div>
                <div className="p-3.5 flex justify-between items-center gap-2">
                  <span className="text-muted-foreground font-medium">Payment Type</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200">
                    {requestDetail?.wire_transfer?.category || (requestDetail?.wire_transfer as any)?.payment_type || (request as any)?.wire_transfer?.category || (request as any)?.payment_type || "Others"}
                  </span>
                </div>
                <div className="p-3.5 flex justify-between items-center gap-2">
                  <span className="text-muted-foreground font-medium">Priority</span>
                  <PrioritySelector
                    requestId={request.id}
                    priority={request.priority}
                    size="xs"
                  />
                </div>
                <div className="p-3.5 flex justify-between gap-2">
                  <span className="text-muted-foreground font-medium">Payment Method</span>
                  <span className="font-semibold text-slate-900 dark:text-zinc-100 text-right">
                    {(requestDetail?.wire_transfer || (request as any)?.wire_transfer) ? "Wire Transfer" : (invoice?.payment_status ? "Direct Billing / Auto-Debit" : "—")}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-zinc-800/60">
                <div className="p-3.5 flex justify-between gap-2">
                  <span className="text-muted-foreground font-medium">Requested Date</span>
                  <span className="font-semibold text-slate-900 dark:text-zinc-100 text-right">
                    {formatDate(request.request_date || request.created_at)}
                  </span>
                </div>
                <div className="p-3.5 flex justify-between gap-2">
                  <span className="text-muted-foreground font-medium">Last Updated</span>
                  <span className="font-semibold text-slate-900 dark:text-zinc-100 text-right">
                    {formatDate(request.updated_at)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-zinc-800/60">
                <div className="p-3.5 flex justify-between gap-2">
                  <span className="text-muted-foreground font-medium">Schedule Timeframe & Range</span>
                  <span className="font-semibold text-slate-900 dark:text-zinc-100 text-right">
                    {sched.end_date
                      ? `${formatDate(sched.start_date)} – ${formatDate(sched.end_date)}`
                      : `Indefinite (${formatDate(sched.start_date)} – Ongoing)`}
                  </span>
                </div>
                <div className="p-3.5 flex justify-between gap-2">
                  <span className="text-muted-foreground font-medium">Next Due Date</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 text-right">
                    {request.due_date ? formatDate(request.due_date) : "—"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-zinc-800/60">
                <div className="p-3.5 flex justify-between gap-2">
                  <span className="text-muted-foreground font-medium">Installment Progress</span>
                  <span className="font-semibold text-slate-900 dark:text-zinc-100 text-right">
                    {sched.total_installments 
                      ? `${sched.completed_installments || 0} / ${sched.total_installments} Cycles Completed` 
                      : `${sched.completed_installments || 0} Cycles Completed (Ongoing)`}
                  </span>
                </div>
                <div className="p-3.5 flex justify-between gap-2">
                  <span className="text-muted-foreground font-medium">Currency</span>
                  <span className="font-semibold text-slate-900 dark:text-zinc-100 text-right">
                    {request.currency || "USD"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-zinc-800/60">
                <div className="p-3.5 flex justify-between gap-2">
                  <span className="text-muted-foreground font-medium">Cycle Amount</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-right">
                    {formatMoney(currentCycleAmount, request.currency || "USD")}
                  </span>
                </div>
                <div className="p-3.5 flex justify-between gap-2 bg-slate-50/50 dark:bg-zinc-900/30">
                  <span className="text-muted-foreground font-medium">
                    {totalCommitment != null ? "Total Commitment" : "Cycle Commitment"}
                  </span>
                  <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300 text-right">
                    {totalCommitment != null ? formatMoney(totalCommitment, request.currency || "USD") : `${formatMoney(currentCycleAmount, request.currency || "USD")} / cycle (Ongoing)`}
                  </span>
                </div>
              </div>

              {formattedItemUrl && (
                <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-blue-50/40 dark:bg-blue-950/20">
                  <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    Product / Vendor Web Link
                  </span>
                  <a
                    href={formattedItemUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1.5 break-all text-xs"
                    title={formattedItemUrl}
                  >
                    <span>{formattedItemUrl}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </div>
              )}

              {request.description && (
                <div className="p-3.5 space-y-1">
                  <span className="text-muted-foreground font-medium block">Description</span>
                  <p className="text-slate-800 dark:text-zinc-200 leading-relaxed bg-white dark:bg-zinc-950 p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800">
                    {request.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
  );
}
