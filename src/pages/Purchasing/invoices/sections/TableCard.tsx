import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Landmark, Building2, Copy, Check, RefreshCw, ArrowUpRight, AlertCircle, Clock, Calendar } from "lucide-react";
import { getStatusBadge, getStatusLabel, formatDate, formatMoney } from "../../utils/purchasingMeta";
import type { InvoicesState } from "../hooks/useInvoices";
import { ListPagination, usePagedRows } from "@/components/common/ListPagination";

export function TableCard({ s }: { s: InvoicesState }) {
  const { clearFilters, hasActiveFilters, navigate, setSelectedWireTask, copiedKey, handleCopy, isWireTransfer, isScheduledPayment, isDueToday, isOverdue, filteredTasks, isLoading } = s;
  const { pageRows: pagedTasks, setPage, ...paging } = usePagedRows(
    filteredTasks,
    [s.typeFilter, s.statusFilter, s.wireFilter, s.quickFilter, s.searchQuery].join("|"),
  );
  return (
    <Card className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xs bg-white dark:bg-zinc-900 overflow-hidden flex flex-col p-0">
        <div className="overflow-x-auto relative">
          <Table className="m-0 w-full min-w-[960px]">
            <TableHeader className="bg-slate-50/80 dark:bg-zinc-900/80 sticky top-0 border-b text-[11px] uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead className="min-w-[220px]">Item / Product &amp; Vendor</TableHead>
                <TableHead className="min-w-[260px]">Wire Banking Details</TableHead>
                <TableHead className="w-32">Amount</TableHead>
                <TableHead className="w-32">Due Date</TableHead>
                <TableHead className="w-36">Status</TableHead>
                <TableHead className="w-32">Assignee</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16 text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
                      <span className="text-xs font-medium">Loading wire transfer records...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredTasks.length ? (
                pagedTasks.map((task) => {
                  const overdue = isOverdue(task.due_date, task.status);
                  const dueToday = isDueToday(task.due_date, task.status);
                  const wt = task.wire_transfer;
                  const hasWire = !!wt;

                  return (
                    <TableRow
                      key={task.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/purchasing/requests/${task.id}`)}
                    >
                      {/* ID */}
                      <TableCell className="font-mono text-xs font-bold text-slate-700 dark:text-zinc-300">
                        <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:group-hover:bg-indigo-950/60 dark:group-hover:text-indigo-300 transition-colors">
                          #{task.id}
                        </span>
                      </TableCell>

                      {/* Item / Vendor */}
                      <TableCell>
                        <div className="flex flex-col gap-1 max-w-[280px]">
                          <span className="font-semibold text-slate-900 dark:text-zinc-100 text-sm truncate">
                            {task.product_name || "Untitled Request"}
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-500 dark:text-zinc-400">
                            {(wt?.vendor || task.vendor) && (
                              <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-zinc-300">
                                <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                                <span className="truncate max-w-[160px]">{wt?.vendor || task.vendor}</span>
                              </span>
                            )}
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 font-medium ${
                                isScheduledPayment(task) && !isWireTransfer(task)
                                  ? "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                                  : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                              }`}
                            >
                              {isScheduledPayment(task) && !isWireTransfer(task)
                                ? "Scheduled Payment"
                                : "Wire Transfer"}
                            </Badge>
                            {wt?.category && wt.category !== "Others" && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                                {wt.category}
                              </Badge>
                            )}
                            {wt?.payment_series?.label && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300 border-teal-200 dark:border-teal-800">
                                {wt.payment_series.label}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Wire Banking Details */}
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {hasWire ? (
                          <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/60 dark:border-indigo-900/40 max-w-[280px]">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-xs text-indigo-950 dark:text-indigo-200 truncate flex items-center gap-1">
                                <Landmark className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                <span className="truncate">{wt.bank_name || "Bank Listed"}</span>
                              </span>
                              {wt.bank_country && (
                                <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium whitespace-nowrap">
                                  {wt.bank_country}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-xs">
                              {wt.bank_account_number ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-[11px] text-slate-700 dark:text-zinc-300 bg-white/80 dark:bg-zinc-800 px-1 rounded border border-slate-200/60 dark:border-zinc-700/60">
                                    {wt.bank_account_number.length > 8
                                      ? `•••• ${wt.bank_account_number.slice(-4)}`
                                      : wt.bank_account_number}
                                  </span>
                                  <button
                                    onClick={() =>
                                      handleCopy(
                                        wt.bank_account_number,
                                        `acct-${task.id}`,
                                        "Bank Account Number"
                                      )
                                    }
                                    title="Copy Account Number"
                                    className="p-1 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
                                  >
                                    {copiedKey === `acct-${task.id}` ? (
                                      <Check className="h-3 w-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-muted-foreground italic">No Acct #</span>
                              )}

                              <button
                                onClick={() => setSelectedWireTask(task)}
                                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 hover:underline flex items-center gap-0.5 ml-auto"
                              >
                                View Info
                              </button>
                            </div>

                            {(wt.routing_wire || wt.swift_code || wt.routing_ach) && (
                              <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono truncate">
                                {wt.swift_code ? `SWIFT: ${wt.swift_code}` : wt.routing_wire ? `Wire: ${wt.routing_wire}` : `ACH: ${wt.routing_ach}`}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-400 dark:text-zinc-500 text-xs py-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                              <AlertCircle className="h-3 w-3 text-slate-400" />
                              No Wire Info
                            </span>
                          </div>
                        )}
                      </TableCell>

                      {/* Amount */}
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm font-mono text-slate-900 dark:text-zinc-100">
                            {formatMoney(Number(task.amount || 0))}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {task.currency || wt?.currency || "USD"}
                            {wt?.pay_from && ` · ${wt.pay_from}`}
                          </span>
                        </div>
                      </TableCell>

                      {/* Due Date */}
                      <TableCell className="text-xs">
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={
                              dueToday
                                ? "text-amber-700 dark:text-amber-400 font-bold"
                                : overdue
                                ? "text-red-600 font-semibold"
                                : "text-slate-700 dark:text-zinc-300"
                            }
                          >
                            {formatDate(task.due_date || task.goods_received_at) || "—"}
                          </span>
                          {dueToday && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800 w-fit">
                              <Calendar className="h-2.5 w-2.5" />
                              Due Today
                            </span>
                          )}
                          {overdue && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800 w-fit">
                              <Clock className="h-2.5 w-2.5" />
                              Overdue
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge variant="outline" className={`text-[11px] font-medium ${getStatusBadge(task.status)}`}>
                          {getStatusLabel(task.status)}
                        </Badge>
                      </TableCell>

                      {/* Assignee */}
                      <TableCell className="text-xs text-slate-600 dark:text-zinc-400">
                        {task.assignee_name ? (
                          <span className="truncate max-w-[120px] block" title={task.assignee_name}>
                            {task.assignee_name}
                          </span>
                        ) : (
                          <span className="italic text-slate-400">Unassigned</span>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {hasWire && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedWireTask(task)}
                              title="View Wire Banking Info"
                              className="h-7 w-7 p-0 rounded-md border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60"
                            >
                              <Landmark className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/purchasing/requests/${task.id}`)}
                            title="Open Full Request"
                            className="h-7 w-7 p-0 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100"
                          >
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16 text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="p-3 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400">
                        <Landmark className="h-8 w-8" />
                      </div>
                      <span className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                        No Matching Wire Records Found
                      </span>
                      <p className="text-xs text-slate-500 text-center">
                        {hasActiveFilters
                          ? "Try clearing some filters or searching with different criteria."
                          : "No wire transfers or AP invoices are currently staged in the system."}
                      </p>
                      {hasActiveFilters && (
                        <Button variant="outline" size="sm" onClick={clearFilters} className="mt-2 text-xs">
                          Clear Active Filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {!isLoading && <ListPagination {...paging} noun="wire transfers" onPageChange={setPage} />}
      </Card>
  );
}
