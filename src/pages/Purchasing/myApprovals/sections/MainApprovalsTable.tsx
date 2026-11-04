import { renderGLAccountBadge } from "@/utils/glAccountUtils";
import { formatDate, formatMoney, PRIORITY_BADGE, getStatusLabel, getStatusBadge } from "../../utils/purchasingMeta";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, ExternalLink, History, Eye } from "lucide-react";
import { getInitials } from "../utils";
import type { MyApprovalsState } from "../hooks/useMyApprovals";

export function MainApprovalsTable({ s }: { s: MyApprovalsState }) {
  const { selectedTotalAmount, selectedIds, isHistoryMode, filteredRequests, handleSingleReject, handleSingleApprove, navigate, glCodes, handleToggleRow, setPreviewRequest, isLoading, handleSelectAll } = s;
  return (
    <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xs overflow-hidden flex flex-col flex-1 min-h-[400px]">
        <div className="overflow-x-auto flex-1">
          <Table>
            <TableHeader className="bg-slate-50/70 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-zinc-800">
              <TableRow className="hover:bg-transparent">
                {!isHistoryMode && (
                  <TableHead className="w-12 text-center py-3.5 pl-4">
                    <Checkbox
                      checked={
                        filteredRequests.length > 0 &&
                        filteredRequests.every((r) => selectedIds.includes(Number(r.id)))
                      }
                      onCheckedChange={(c) => handleSelectAll(!!c)}
                      aria-label="Select all"
                    />
                  </TableHead>
                )}
                <TableHead className="w-24 font-semibold text-slate-700 dark:text-zinc-300 text-xs uppercase tracking-wider py-3.5">
                  Request ID
                </TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-zinc-300 text-xs uppercase tracking-wider py-3.5">
                  Request Title
                </TableHead>
                <TableHead className="w-48 font-semibold text-slate-700 dark:text-zinc-300 text-xs uppercase tracking-wider">
                  Requester
                </TableHead>
                <TableHead className="w-40 font-semibold text-slate-700 dark:text-zinc-300 text-xs uppercase tracking-wider">
                  Department
                </TableHead>
                <TableHead className="w-28 font-semibold text-slate-700 dark:text-zinc-300 text-xs uppercase tracking-wider">
                  Priority
                </TableHead>
                {isHistoryMode && (
                  <TableHead className="w-36 font-semibold text-slate-700 dark:text-zinc-300 text-xs uppercase tracking-wider">
                    Status
                  </TableHead>
                )}
                <TableHead className="w-32 font-semibold text-slate-700 dark:text-zinc-300 text-xs uppercase tracking-wider text-right">
                  Amount
                </TableHead>
                <TableHead className="w-32 font-semibold text-slate-700 dark:text-zinc-300 text-xs uppercase tracking-wider">
                  Submitted
                </TableHead>
                <TableHead className="w-48 text-right font-semibold text-slate-700 dark:text-zinc-300 text-xs uppercase tracking-wider pr-5">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={isHistoryMode ? 8 : 9} className="py-4">
                      <div className="h-10 bg-slate-100 dark:bg-zinc-900 rounded-lg animate-pulse" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isHistoryMode ? 8 : 9} className="text-center py-16">
                    <div className="max-w-sm mx-auto flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                      <div
                        className={`p-3.5 rounded-full mb-1 ${
                          isHistoryMode
                            ? "bg-slate-100 dark:bg-zinc-800 text-slate-500"
                            : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600"
                        }`}
                      >
                        {isHistoryMode ? <History className="w-7 h-7" /> : <CheckCircle2 className="w-7 h-7" />}
                      </div>
                      <p className="text-base font-semibold text-slate-800 dark:text-zinc-200">
                        {isHistoryMode ? "No Approved History Found" : "All Caught Up!"}
                      </p>
                      <p className="text-xs text-muted-foreground text-center">
                        {isHistoryMode
                          ? "No purchase requests matching your search or filters have been approved yet."
                          : "You have no purchase requests currently pending your review or approval."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((req) => {
                  const idNum = Number(req.id);
                  const isChecked = selectedIds.includes(idNum);
                  const priorityClass =
                    PRIORITY_BADGE[req.priority as keyof typeof PRIORITY_BADGE] ||
                    PRIORITY_BADGE.MEDIUM;

                  return (
                    <TableRow
                      key={req.id}
                      onClick={() => setPreviewRequest(req)}
                      className={`cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-zinc-900/60 ${
                        isChecked && !isHistoryMode ? "bg-indigo-50/40 dark:bg-indigo-950/20" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      {!isHistoryMode && (
                        <TableCell className="text-center py-3 pl-4" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => handleToggleRow(idNum)}
                            aria-label={`Select request ${req.id}`}
                          />
                        </TableCell>
                      )}

                      {/* Request ID */}
                      <TableCell className="py-3">
                        <span className="font-mono text-slate-700 dark:text-zinc-300 font-bold bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md text-xs border border-slate-200 dark:border-zinc-700">
                          #{req.id}
                        </span>
                      </TableCell>

                      {/* Request Title & Details */}
                      <TableCell className="py-3">
                        <div className="space-y-1">
                          <div className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 group">
                            <span>{req.title || `Purchase Request #${req.id}`}</span>
                            <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500 shrink-0" />
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {req.gl_code && (
                              <div>
                                {renderGLAccountBadge(req.gl_code, glCodes)}
                              </div>
                            )}
                            {req.item_url && (
                              <a
                                href={req.item_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50/60 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-200/60 dark:border-indigo-800/40"
                              >
                                <ExternalLink className="w-3 h-3 shrink-0" />
                                <span>Item Link</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Requester with Avatar */}
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-2xs">
                            {getInitials(req.requester)}
                          </div>
                          <span className="text-xs font-medium text-slate-800 dark:text-zinc-200 truncate">
                            {req.requester || "Unassigned"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Department */}
                      <TableCell className="py-3">
                        <span className="text-xs text-slate-600 dark:text-zinc-400 font-medium">
                          {req.department || "General"}
                        </span>
                      </TableCell>

                      {/* Priority */}
                      <TableCell className="py-3">
                        <Badge
                          variant="outline"
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${priorityClass}`}
                        >
                          {req.priority || "MEDIUM"}
                        </Badge>
                      </TableCell>

                      {/* Status (History only) */}
                      {isHistoryMode && (
                        <TableCell className="py-3">
                          <Badge
                            variant="outline"
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${getStatusBadge(req.status)}`}
                          >
                            {getStatusLabel(req.status)}
                          </Badge>
                        </TableCell>
                      )}

                      {/* Amount */}
                      <TableCell className="py-3 text-right font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-zinc-100">
                        {formatMoney(Number(req.amount) || 0)}
                      </TableCell>

                      {/* Date */}
                      <TableCell className="py-3 text-xs text-muted-foreground whitespace-nowrap min-w-[105px]">
                        {formatDate(req.request_date)}
                      </TableCell>

                      {/* Action Buttons */}
                      <TableCell className="py-3 text-right pr-5" onClick={(e) => e.stopPropagation()}>
                        {isHistoryMode ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/purchasing/requests/${req.id}`, { state: { from: "/purchasing/my-approvals" } })}
                            className="h-8 px-3 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Record
                          </Button>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => handleSingleApprove(req)}
                              className="h-8 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSingleReject(req)}
                              className="h-8 px-3 text-xs font-semibold border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900/60 dark:hover:bg-rose-950/40 dark:text-rose-400 gap-1.5"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Table Footer Summary ── */}
        <div className="p-3.5 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing <strong className="text-slate-900 dark:text-zinc-100">{filteredRequests.length}</strong> {isHistoryMode ? "approved history request(s)" : "pending request(s)"}
          </span>
          {!isHistoryMode && selectedIds.length > 0 && (
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
              {selectedIds.length} request(s) selected ({formatMoney(selectedTotalAmount)})
            </span>
          )}
        </div>
      </div>
  );
}
