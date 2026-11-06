import { Clock, Building2, CheckCircle2, ShieldCheck, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { formatDate, formatDateTime } from "../../utils/purchasingMeta";
import type { RequestDetailViewState } from "../hooks/useRequestDetailTail";

export function ApprovalsTab({ v }: { v: RequestDetailViewState }) {
  const { approvals, request, setIsChangeApproverOpen, isPrivilegedPurchasingRole } = v;
  return (
    <TabsContent value="approvals" className="m-0 space-y-4">
                  {/* SECTION 1: WHO CAN APPROVE (AUTHORITY & STATUS) */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Who Can Approve</span>
                      <span className="text-[10px] font-normal normal-case text-slate-400">
                        {request.requires_second_level ? "2-Level Approval Required" : "1-Level Approval Required"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {/* Level 1 Approver Card */}
                      <div className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs space-y-2.5">
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 shrink-0 mt-0.5">
                              <Building2 className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 dark:text-zinc-100 leading-snug break-words">
                                {request.level_1_approver_name && request.level_1_approver_name !== "Unassigned"
                                  ? request.level_1_approver_name
                                  : request.assigned_user && request.assigned_user !== "Unassigned"
                                  ? request.assigned_user
                                  : "Department Level 1 Approver"}
                              </div>
                              <div className="text-[10.5px] text-slate-500 dark:text-zinc-400 mt-0.5">
                                Level 1 • Department / Manager Approver
                              </div>
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center">
                            {request.level_1_approved_at || request.status === "APPROVED" || request.status === "PURCHASED" || request.status === "SHIPPED" || request.status === "GOODS_RECEIVED" || request.status === "INVOICE_RECEIVED" || request.status === "COMPLETED" ? (
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-[10px] font-medium gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Approved
                              </Badge>
                            ) : request.status === "REJECTED" ? (
                              <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 text-[10px] font-medium">
                                Rejected
                              </Badge>
                            ) : request.status === "WAITING_APPROVAL" && (request.current_approval_level || 1) === 1 ? (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 text-[10px] font-medium gap-1">
                                <Clock className="h-3 w-3 animate-pulse" /> Pending Review
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 text-[10px] font-normal">
                                Scheduled
                              </Badge>
                            )}
                          </div>
                        </div>

                        {isPrivilegedPurchasingRole && !request.level_1_approved_at && request.status !== "COMPLETED" && request.status !== "REJECTED" && (
                          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                            <span className="text-[10px] text-slate-400">Need to change routing?</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setIsChangeApproverOpen(true)}
                              className="h-6 px-2.5 text-[10.5px] font-semibold text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/50 dark:bg-indigo-950/40 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/60 gap-1 rounded-md cursor-pointer"
                              title="Change Level 1 Approver"
                            >
                              <UserCheck className="h-3 w-3" />
                              <span>Change Approver</span>
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Level 2 Approver Card */}
                      {(request.requires_second_level || (request.amount && Number(request.amount) >= 10000) || request.level_2_approver_name || request.second_level_requested) && (
                        <div className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs space-y-2.5">
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div className="p-1.5 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 shrink-0 mt-0.5">
                                <ShieldCheck className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-900 dark:text-zinc-100 leading-snug break-words">
                                  {request.level_2_approver_name && request.level_2_approver_name !== "Unassigned"
                                    ? request.level_2_approver_name
                                    : "Shaun Passley (CEO)"}
                                </div>
                                <div className="text-[10.5px] text-purple-600 dark:text-purple-400 mt-0.5 flex items-center gap-1">
                                  <span>Level 2 • Company Approver</span>
                                  <span className="text-[9.5px] px-1 py-0.2 rounded bg-purple-100 dark:bg-purple-900/60 font-medium">≥ $10k</span>
                                </div>
                              </div>
                            </div>
                            <div className="shrink-0 flex items-center">
                              {request.level_2_approved_at || (request.status === "APPROVED" && (request.current_approval_level || 1) >= 2) || (request.status === "PURCHASED" && request.requires_second_level) ? (
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-[10px] font-medium gap-1">
                                  <CheckCircle2 className="h-3 w-3" /> Approved
                                </Badge>
                              ) : request.status === "REJECTED" ? (
                                <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 text-[10px] font-medium">
                                  Rejected
                                </Badge>
                              ) : request.status === "WAITING_APPROVAL" && request.current_approval_level === 2 ? (
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800 text-[10px] font-medium gap-1">
                                  <Clock className="h-3 w-3 animate-pulse" /> Pending L2 Review
                                </Badge>
                              ) : request.status === "WAITING_APPROVAL" && (request.current_approval_level || 1) === 1 ? (
                                <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 text-[10px] font-normal">
                                  Awaiting Level 1
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 text-[10px] font-normal">
                                  Scheduled
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SECTION 2: WHO APPROVED IT (RECORDS & LOGS) */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                      Who Approved It
                    </div>

                    {approvals.length === 0 ? (
                      <div className="py-3 px-3 rounded-lg border border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 text-center">
                        <p className="text-xs text-slate-600 dark:text-zinc-400 font-medium">No review actions recorded yet</p>
                        <p className="text-[10.5px] text-muted-foreground mt-0.5">
                          Sign-off history, comments, and decision timestamps will appear here once reviewed.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {approvals.map((a) => (
                          <div key={a.id} className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/50 space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-zinc-200">
                                  {(a.approver || "U").slice(0, 2).toUpperCase()}
                                </div>
                                <span className="font-semibold text-xs text-slate-900 dark:text-zinc-100">{a.approver}</span>
                              </div>
                              <Badge variant="outline" className={a.decision === "APPROVED" ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 text-[10px]" : "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800 text-[10px]"}>
                                {a.decision === "APPROVED" ? "Approved" : "Rejected"}
                              </Badge>
                            </div>
                            {a.comment && (
                              <div className="text-xs text-slate-700 dark:text-zinc-300 bg-white/80 dark:bg-zinc-800/80 p-2 rounded border border-slate-100 dark:border-zinc-700/60 leading-relaxed">
                                {a.comment}
                              </div>
                            )}
                            <div className="text-[10.5px] text-slate-400 dark:text-zinc-500">
                              {formatDateTime(a.approval_date) || formatDate(a.approval_date)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
  );
}
