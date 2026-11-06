import { formatDate, formatMoney } from "../../../utils/purchasingMeta";
import PrioritySelector from "../../../fields/PrioritySelector";
import { type FrequencyType, FREQUENCY_LABELS } from "../../../utils/recurringScheduleUtils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarClock, CheckCircle2, Clock, ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from "lucide-react";
import { LoadMoreRow, useFitToScreen, useFluidRows } from "@/components/common/FluidList";
import type { MasterTransactionsTableState } from "../hooks/useMasterTransactionsTable";

export function MasterTransactionsGrid({ s }: { s: MasterTransactionsTableState }) {
  const { filteredTotalValue, allTransactions, filteredTransactions, navigate, onOpenBreakdownModal, reviewMutationPending, onToggleReviewStatus, isSuperAdmin, isAP, getUrgencyBadge, isLoading, sortOrder, sortField, toggleSort } = s;
  const { visibleRows: shownTransactions, ...fluid } = useFluidRows(
    filteredTransactions,
    [s.searchTerm, s.dateRangeFilter, s.installmentStatusFilter, s.reviewFilter, sortField, sortOrder].join("|"),
  );
  const fit = useFitToScreen();
  return (
    <Card {...fit} className="border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xs bg-white dark:bg-zinc-900 overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0 overflow-auto relative">
          <Table containerClassName="overflow-visible">
            <TableHeader className="sticky top-0 bg-slate-50 dark:bg-zinc-900 z-10 shadow-2xs">
              <TableRow className="border-b border-slate-200 dark:border-zinc-800 text-xs">
                <TableHead
                  className="cursor-pointer select-none font-semibold text-slate-700 dark:text-zinc-200"
                  onClick={() => toggleSort("dueDate")}
                >
                  <div className="flex items-center gap-1">
                    <span>Due Date</span>
                    {sortField === "dueDate" ? (
                      sortOrder === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                    ) : (
                      <ArrowUpDown size={12} className="text-muted-foreground opacity-50" />
                    )}
                  </div>
                </TableHead>

                <TableHead
                  className="cursor-pointer select-none font-semibold text-slate-700 dark:text-zinc-200"
                  onClick={() => toggleSort("requestTitle")}
                >
                  <div className="flex items-center gap-1">
                    <span>Contract / Request Title</span>
                    {sortField === "requestTitle" ? (
                      sortOrder === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                    ) : (
                      <ArrowUpDown size={12} className="text-muted-foreground opacity-50" />
                    )}
                  </div>
                </TableHead>

                <TableHead
                  className="cursor-pointer select-none font-semibold text-slate-700 dark:text-zinc-200"
                  onClick={() => toggleSort("installmentNumber")}
                >
                  <div className="flex items-center gap-1">
                    <span>Installment</span>
                    {sortField === "installmentNumber" ? (
                      sortOrder === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                    ) : (
                      <ArrowUpDown size={12} className="text-muted-foreground opacity-50" />
                    )}
                  </div>
                </TableHead>

                <TableHead className="font-semibold text-slate-700 dark:text-zinc-200">
                  Requester / Dept
                </TableHead>

                <TableHead className="font-semibold text-slate-700 dark:text-zinc-200">
                  Priority
                </TableHead>

                <TableHead
                  className="text-right cursor-pointer select-none font-semibold text-slate-700 dark:text-zinc-200"
                  onClick={() => toggleSort("amount")}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Amount</span>
                    {sortField === "amount" ? (
                      sortOrder === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                    ) : (
                      <ArrowUpDown size={12} className="text-muted-foreground opacity-50" />
                    )}
                  </div>
                </TableHead>

                <TableHead className="font-semibold text-slate-700 dark:text-zinc-200">
                  Schedule Status
                </TableHead>

                <TableHead className="font-semibold text-slate-700 dark:text-zinc-200">
                  AP Review
                </TableHead>

                <TableHead className="text-right font-semibold text-slate-700 dark:text-zinc-200">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-36 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span className="text-xs">Generating master schedule transactions...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-36 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <CalendarClock className="h-7 w-7 text-muted-foreground opacity-40 mb-1" />
                      <p className="text-sm font-medium">No transactions found</p>
                      <p className="text-xs text-muted-foreground">
                        Try adjusting your search criteria or date range filters.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                {shownTransactions.map((t) => {
                  const isRev = t.reviewStatus === "REVIEWED";
                  return (
                    <TableRow
                      key={t.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/60 cursor-pointer transition-colors group text-xs"
                      onClick={() => navigate(`/purchasing/requests/${t.requestId}`)}
                    >
                      {/* 1. Due Date + Urgency */}
                      <TableCell className="font-medium whitespace-nowrap">
                        <div className="flex flex-col gap-0.5 items-start">
                          <span className="font-semibold text-slate-900 dark:text-zinc-100">
                            {t.dueDate ? formatDate(t.dueDate) : "Undated"}
                          </span>
                          {getUrgencyBadge(t.dueDate, t.installmentStatus)}
                        </div>
                      </TableCell>

                      {/* 2. Contract Title + ID + Vendor */}
                      <TableCell className="max-w-[280px]">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                              #{t.requestId}
                            </span>
                            <span className="font-semibold text-slate-900 group-hover:text-blue-600 dark:text-zinc-100 dark:group-hover:text-blue-400 text-xs transition-colors truncate">
                              {t.requestTitle}
                            </span>
                            {(t.rawRequest.source_portal === "m7a" || t.rawRequest.source_portal === "m&a" || t.rawRequest.source_portal === "m_and_a" || t.rawRequest.is_ma) && (
                              <Badge className="text-[9.5px] px-1.5 py-0 h-4 bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-700 font-bold shrink-0">
                                M&amp;A
                              </Badge>
                            )}
                          </div>
                          {t.customLabel ? (
                            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium truncate">
                              • {t.customLabel}
                            </span>
                          ) : t.vendor ? (
                            <span className="text-[11px] text-muted-foreground truncate">
                              {t.vendor}
                            </span>
                          ) : t.requestDescription ? (
                            <span className="text-[11px] text-muted-foreground truncate">
                              {t.requestDescription}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>

                      {/* 3. Installment / Cycle */}
                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col gap-0.5 items-start">
                          <Badge
                            variant="outline"
                            className="text-[11px] font-medium py-0 px-1.5 bg-indigo-50/70 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800"
                          >
                            {t.totalInstallments
                              ? `Inst #${t.installmentNumber} of ${t.totalInstallments}`
                              : `Cycle #${t.installmentNumber}`}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {FREQUENCY_LABELS[t.frequency as FrequencyType] || t.frequency}
                          </span>
                        </div>
                      </TableCell>

                      {/* 4. Requester & Department */}
                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-slate-800 dark:text-zinc-200">
                            {t.requester}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {t.department || "—"}
                          </span>
                        </div>
                      </TableCell>

                      {/* 4b. Priority */}
                      <TableCell className="whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <PrioritySelector
                          requestId={t.id}
                          priority={t.priority}
                          size="xs"
                        />
                      </TableCell>

                      {/* 5. Amount & Cumulative Progress */}
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="font-bold text-slate-900 dark:text-zinc-100 text-[13px]">
                            {formatMoney(t.amount, t.currency)}
                          </span>
                          {t.cumulativeAmount > 0 && (
                            <span className="text-[10px] text-muted-foreground font-normal">
                              Cumul: {formatMoney(t.cumulativeAmount, t.currency)}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* 6. Schedule Status */}
                      <TableCell className="whitespace-nowrap">
                        {t.installmentStatus === "PAID" ? (
                          <Badge
                            variant="outline"
                            className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 flex items-center gap-1 w-fit"
                          >
                            <CheckCircle2 size={11} />
                            Paid
                          </Badge>
                        ) : t.installmentStatus === "CURRENT" ? (
                          <Badge
                            variant="outline"
                            className="text-[11px] font-semibold bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 flex items-center gap-1 w-fit"
                          >
                            <Clock size={11} />
                            Due Next
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[11px] font-medium bg-slate-50 text-slate-600 border-slate-200 dark:bg-zinc-800/60 dark:text-zinc-300 w-fit"
                          >
                            Projected
                          </Badge>
                        )}
                      </TableCell>

                      {/* 7. AP Review Status */}
                      <TableCell className="whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        {isAP || isSuperAdmin ? (
                          <button
                            onClick={() => onToggleReviewStatus?.(t.rawRequest)}
                            disabled={reviewMutationPending}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-all cursor-pointer shadow-2xs hover:opacity-80 ${
                              isRev
                                ? "bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800"
                                : "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                            }`}
                            title="Click to toggle Review Status for this contract"
                          >
                            {isRev ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                            {isRev ? "Reviewed" : "Waiting Review"}
                          </button>
                        ) : (
                          <Badge
                            variant="outline"
                            className={
                              isRev
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                : "bg-amber-50 text-amber-700 border-amber-300"
                            }
                          >
                            {isRev ? "Reviewed" : "Waiting Review"}
                          </Badge>
                        )}
                      </TableCell>

                      {/* 8. Quick Actions */}
                      <TableCell className="text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                            title="View Full Payment Schedule / Ledger"
                            onClick={() => onOpenBreakdownModal(t.rawRequest)}
                          >
                            <CalendarClock size={13} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                            title="Open Request Detail"
                            onClick={() => navigate(`/purchasing/requests/${t.requestId}`)}
                          >
                            <ExternalLink size={13} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                <LoadMoreRow {...fluid} />
                </>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Table Footer Summary */}
        <div className="bg-slate-50 dark:bg-zinc-900/90 border-t border-slate-200 dark:border-zinc-800 px-4 py-2.5 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>
              Showing <strong className="text-slate-900 dark:text-zinc-100">{fluid.shown}</strong> of{" "}
              <strong>{filteredTransactions.length}</strong> scheduled transactions
              {filteredTransactions.length < allTransactions.length && ` (${allTransactions.length} in all)`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>Filtered Total:</span>
            <strong className="text-sm font-bold text-slate-900 dark:text-zinc-100">
              {formatMoney(filteredTotalValue)}
            </strong>
          </div>
        </div>
      </Card>
  );
}
