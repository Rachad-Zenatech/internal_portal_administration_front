import PrioritySelector from "../../fields/PrioritySelector";
import { RequestStatus } from "@/types/purchasing";
import { parseRequestStatus } from "@/lib/requestStatus";
import { formatDate, getStatusBadge, getStatusLabel } from "../../utils/purchasingMeta";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarClock, Table as TableIcon, CheckCircle2, Clock, Edit2, Trash2, Landmark, ExternalLink } from "lucide-react";
import { formatRemainingDuration, getRecurringAmounts } from "../../utils/recurringScheduleUtils";
import { getDueStatus } from "../utils";
import type { RecurringPaymentsViewState } from "../hooks/useRecurringPaymentsTail";
import { ListPagination, usePagedRows } from "@/components/common/ListPagination";

export function RecurringRequestsTable({ v }: { v: RecurringPaymentsViewState }) {
  const { setRequestToDelete, handleOpenEdit, handleOpenWireModal, canManageRecurring, setScheduleModalRequest, reviewMutation, isSuperAdmin, isAP, isMaTransaction, navigate, filteredRequests, isLoading } = v;
  const { pageRows: pagedRequests, setPage, ...paging } = usePagedRows(
    filteredRequests,
    [v.searchTerm, v.cardFilter, v.dueFilter, v.priorityFilter, v.reviewFilter, v.statusFilter].join("|"),
  );
  return (
    <>
    <div className="flex-1 min-h-0 overflow-auto relative">
            <Table containerClassName="overflow-visible">
            <TableHeader>
              <TableRow className="bg-slate-50/75 dark:bg-zinc-900/75 border-b border-slate-200 dark:border-zinc-800">
                <TableHead className="min-w-[280px]">Request &amp; Plan</TableHead>
                <TableHead className="min-w-[170px]">Requester / Dept</TableHead>
                <TableHead className="min-w-[180px]">Schedule &amp; Due Date</TableHead>
                <TableHead className="min-w-[150px]">Amount</TableHead>
                <TableHead className="min-w-[170px]">Status &amp; Review</TableHead>
                <TableHead className="text-right w-[90px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    Loading recurring payments...
                  </TableCell>
                </TableRow>
              ) : filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No recurring payments found matching the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                pagedRequests.map((req) => {
                  const revStatus = req.review_status || "WAITING_FOR_REVIEW";
                  const isRev = revStatus === "REVIEWED";
                  const { nextFormatted, totalFormatted } = getRecurringAmounts(
                    req.recurring_schedule,
                    req.amount,
                    req.currency || "USD",
                    req.status,
                    req.due_date || req.request_date
                  );
                  return (
                    <TableRow
                      key={req.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/60 cursor-pointer transition-colors group"
                      onClick={() => navigate(`/purchasing/requests/${req.id}`)}
                    >
                      {/* 1. Request & Plan */}
                      <TableCell className="py-3 max-w-[320px]">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="font-mono text-xs font-bold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded shrink-0">
                            #{req.id}
                          </span>
                          <span className="font-semibold text-slate-900 group-hover:text-blue-600 dark:text-zinc-100 dark:group-hover:text-blue-400 text-sm transition-colors line-clamp-1">
                            {req.title}
                          </span>
                          {isMaTransaction(req) ? (
                            <Badge className="text-[10px] px-1.5 py-0 h-4 bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-700 font-bold shrink-0">
                              M&amp;A
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 font-medium shrink-0">
                              Recurring
                            </Badge>
                          )}
                          {req.item_url && (
                            <a
                              href={req.item_url.startsWith("http") ? req.item_url : `https://${req.item_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50/80 dark:bg-blue-950/50 px-1.5 py-0.5 rounded border border-blue-200/60 dark:border-blue-800/40 shrink-0"
                              title={req.item_url}
                            >
                              <ExternalLink className="w-3 h-3 shrink-0" />
                              <span>Link</span>
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                            <PrioritySelector
                              requestId={req.id}
                              priority={req.priority}
                              size="xs"
                            />
                          </div>
                          {req.description && (
                            <span className="truncate max-w-[200px]" title={req.description}>
                              {req.description}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* 2. Requester / Dept */}
                      <TableCell className="py-3">
                        <div className="text-sm font-medium text-slate-900 dark:text-zinc-100">
                          {req.requester}
                        </div>
                        {(() => {
                          const reqDept = req.department || (req as any).department_name || "";
                          return (
                            <div className="text-xs text-muted-foreground truncate max-w-[180px]" title={reqDept || undefined}>
                              {reqDept ? (
                                <span className="font-medium text-slate-700 dark:text-zinc-300">{reqDept}</span>
                              ) : (
                                <span className="text-slate-400 dark:text-zinc-500">—</span>
                              )}
                            </div>
                          );
                        })()}
                      </TableCell>

                      {/* 3. Schedule & Due Date */}
                      <TableCell className="py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                            {req.due_date ? formatDate(req.due_date) : formatDate(req.request_date)}
                          </span>
                          {(() => {
                            const due = getDueStatus(req.due_date || req.request_date, req.status);
                            if (!due) return null;
                            return (
                              <Badge variant={due.variant} className={`text-[10px] py-0 px-1.5 leading-tight ${due.className}`}>
                                {due.label}
                              </Badge>
                            );
                          })()}
                        </div>
                        {req.recurring_schedule?.is_scheduled && (
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge
                              variant="outline"
                              className="text-[10px] py-0 px-1.5 bg-indigo-50/90 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800 flex items-center gap-1 font-semibold"
                            >
                              <Clock className="h-2.5 w-2.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                              {formatRemainingDuration(req.recurring_schedule.end_date).text}
                            </Badge>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setScheduleModalRequest(req);
                              }}
                              className="text-[10px] text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold underline flex items-center gap-1 cursor-pointer"
                            >
                              <TableIcon className="h-2.5 w-2.5 shrink-0" />
                              Schedule ({req.recurring_schedule.total_installments ? `${req.recurring_schedule.completed_installments || 0}/${req.recurring_schedule.total_installments}` : `${req.recurring_schedule.completed_installments || 0} Settled`})
                            </button>
                          </div>
                        )}
                      </TableCell>

                      {/* 4. Amount */}
                      <TableCell className="py-3">
                        <div className="flex items-baseline gap-1 font-bold text-slate-900 dark:text-zinc-100 text-sm">
                          <span>{nextFormatted}</span>
                          {totalFormatted && (
                            <span className="text-xs font-normal text-muted-foreground">
                              / {totalFormatted}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {totalFormatted ? "Next Cycle / Total" : "Cycle Amount"}
                        </div>
                      </TableCell>

                      {/* 5. Status & Review */}
                      <TableCell className="py-3">
                        <div className="flex flex-col gap-1.5 items-start">
                          <Badge variant="outline" className={getStatusBadge(req.status)}>
                            {getStatusLabel(req.status)}
                            {req.recurring_schedule ? (
                              parseRequestStatus(req.status) === RequestStatus.Completed
                                ? (req.recurring_schedule.total_installments ? ` (${req.recurring_schedule.total_installments}/${req.recurring_schedule.total_installments})` : "")
                                : (req.recurring_schedule.total_installments
                                  ? ` (Cycle ${Math.min((req.recurring_schedule.completed_installments || 0) + 1, req.recurring_schedule.total_installments)}/${req.recurring_schedule.total_installments})`
                                  : ` (Cycle ${(req.recurring_schedule.completed_installments || 0) + 1})`)
                            ) : ""}
                          </Badge>
                          {isAP || isSuperAdmin ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                reviewMutation.mutate({
                                  id: req.id,
                                  review_status: isRev ? "WAITING_FOR_REVIEW" : "REVIEWED",
                                });
                              }}
                              disabled={reviewMutation.isPending}
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-all cursor-pointer shadow-2xs hover:opacity-80 ${
                                isRev
                                  ? "bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800"
                                  : "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                              }`}
                              title="Click to toggle Review Status"
                            >
                              {isRev ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                              {isRev ? "Reviewed" : "Waiting for Review"}
                            </button>
                          ) : (
                            <Badge
                              variant="outline"
                              className={`text-[11px] py-0 px-2 ${
                                isRev
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                  : "bg-amber-50 text-amber-700 border-amber-300"
                              }`}
                            >
                              {isRev ? "Reviewed" : "Waiting for Review"}
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* 6. Actions */}
                      <TableCell className="text-right py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {req.recurring_schedule?.is_scheduled && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                              title="View Full Payment Schedule / Ledger"
                              onClick={(e) => {
                                e.stopPropagation();
                                setScheduleModalRequest(req);
                              }}
                            >
                              <CalendarClock size={14} />
                            </Button>
                          )}
                          {canManageRecurring && (<>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                            title="Edit Wire Info / Banking Details"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenWireModal(req);
                            }}
                          >
                            <Landmark size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                            title="Edit Recurring Request"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(req);
                            }}
                          >
                            <Edit2 size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                            title="Delete Recurring Request"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRequestToDelete(req);
                            }}
                          >
                            <Trash2 size={14} />
                          </Button>
                          </>)}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          </div>
          {!isLoading && <ListPagination {...paging} noun="recurring payments" onPageChange={setPage} />}
    </>
  );
}
