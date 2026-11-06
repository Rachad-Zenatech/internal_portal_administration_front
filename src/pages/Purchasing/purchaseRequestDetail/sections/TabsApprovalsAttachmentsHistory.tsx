import { CheckCircle2, Clock, FileText, Paperclip, History, ShieldCheck, Building2, RefreshCw, UploadCloud, Download, Trash2, Eye, UserCheck } from "lucide-react";
import { downloadAttachment } from "@/services/purchasingService";
import { formatDate } from "../../utils/purchasingMeta";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { PurchaseRequestDetailViewState } from "../hooks/usePurchaseRequestDetailTail";

export function TabsApprovalsAttachmentsHistory({ v }: { v: PurchaseRequestDetailViewState }) {
  const { history, deleteAttachmentMutation, id, isLoadingPreview, handlePreviewAttachment, attachments, uploadMutation, approvals, request, setIsChangeApproverOpen } = v;
  return (
    <Card className="shadow-xs border-slate-200 dark:border-zinc-800">
            <Tabs defaultValue="approvals" className="w-full">
              <CardHeader className="p-3 pb-0 border-b border-slate-100 dark:border-zinc-800">
                <TabsList className="grid grid-cols-3 w-full h-8 bg-slate-100 dark:bg-zinc-800">
                  <TabsTrigger value="approvals" className="text-xs">
                    Approvals ({approvals.length})
                  </TabsTrigger>
                  <TabsTrigger value="attachments" className="text-xs">
                    Attachments ({attachments.length})
                  </TabsTrigger>
                  <TabsTrigger value="history" className="text-xs">
                    History ({history.length})
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent className="p-4 text-xs">
                {/* Approvals Tab */}
                <TabsContent value="approvals" className="mt-0 space-y-4">
                  {/* SECTION 1: WHO CAN APPROVE */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Who Can Approve</span>
                      <span className="text-[10px] font-normal normal-case text-slate-400">
                        {request?.requires_second_level ? "2-Level Approval Required" : "1-Level Approval Required"}
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
                                {request?.level_1_approver_name && request?.level_1_approver_name !== "Unassigned"
                                  ? request.level_1_approver_name
                                  : request?.assigned_user && request?.assigned_user !== "Unassigned"
                                  ? request.assigned_user
                                  : "Department Level 1 Approver"}
                              </div>
                              <div className="text-[10.5px] text-slate-500 dark:text-zinc-400 mt-0.5">
                                Level 1 • Department / Manager Approver
                              </div>
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center">
                            {request?.level_1_approved_at || request?.status === "APPROVED" || request?.status === "PURCHASED" || request?.status === "SHIPPED" || request?.status === "GOODS_RECEIVED" || request?.status === "INVOICE_RECEIVED" || request?.status === "COMPLETED" ? (
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-[10px] font-medium gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Approved
                              </Badge>
                            ) : request?.status === "REJECTED" ? (
                              <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 text-[10px] font-medium">
                                Rejected
                              </Badge>
                            ) : request?.status === "WAITING_APPROVAL" && (request?.current_approval_level || 1) === 1 ? (
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

                        {!request?.level_1_approved_at && request?.status !== "COMPLETED" && request?.status !== "REJECTED" && (
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
                      {(request?.requires_second_level || (request?.amount && Number(request.amount) >= 10000) || request?.level_2_approver_name || request?.second_level_requested) && (
                        <div className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs space-y-2.5">
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div className="p-1.5 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 shrink-0 mt-0.5">
                                <ShieldCheck className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-900 dark:text-zinc-100 leading-snug break-words">
                                  {request?.level_2_approver_name && request?.level_2_approver_name !== "Unassigned"
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
                              {request?.level_2_approved_at || (request?.status === "APPROVED" && (request?.current_approval_level || 1) >= 2) || (request?.status === "PURCHASED" && request?.requires_second_level) ? (
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-[10px] font-medium gap-1">
                                  <CheckCircle2 className="h-3 w-3" /> Approved
                                </Badge>
                              ) : request?.status === "REJECTED" ? (
                                <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 text-[10px] font-medium">
                                  Rejected
                                </Badge>
                              ) : request?.status === "WAITING_APPROVAL" && request?.current_approval_level === 2 ? (
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800 text-[10px] font-medium gap-1">
                                  <Clock className="h-3 w-3 animate-pulse" /> Pending L2 Review
                                </Badge>
                              ) : request?.status === "WAITING_APPROVAL" && (request?.current_approval_level || 1) === 1 ? (
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

                  {/* SECTION 2: WHO APPROVED IT */}
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
                            <div className="text-[10px] text-muted-foreground flex items-center justify-between">
                              <span>Recorded Sign-off</span>
                              <span>{formatDate(a.approval_date)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Attachments Tab */}
                <TabsContent value="attachments" className="mt-0 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Files ({attachments.length})
                    </span>
                    <div>
                      <input
                        id="tab-attachment-upload-input"
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            const files = Array.from(e.target.files);
                            uploadMutation.mutate(files);
                            e.target.value = "";
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1.5 border-slate-200 dark:border-zinc-800"
                        onClick={() => document.getElementById("tab-attachment-upload-input")?.click()}
                        disabled={uploadMutation.isPending}
                      >
                        {uploadMutation.isPending ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <UploadCloud className="h-3.5 w-3.5 text-indigo-600" />
                        )}
                        Upload File
                      </Button>
                    </div>
                  </div>

                  {attachments.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground space-y-1.5 border border-dashed rounded-lg border-slate-200 dark:border-zinc-800">
                      <Paperclip className="h-7 w-7 mx-auto text-slate-300 dark:text-zinc-700" />
                      <p className="font-semibold text-slate-700 dark:text-zinc-300">No files attached</p>
                      <p className="text-[11px]">Upload invoice receipts, contract agreements, or POs.</p>
                    </div>
                  ) : (
                    attachments.map((att) => (
                      <div
                        key={att.id}
                        className="p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-2 bg-white dark:bg-zinc-950 hover:bg-slate-50/50 dark:hover:bg-zinc-900/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate min-w-0">
                          <FileText className="h-4 w-4 text-indigo-600 shrink-0" />
                          <div className="truncate">
                            <span className="font-medium truncate text-slate-800 dark:text-zinc-200 block">
                              {att.filename}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {Math.round(att.size / 1024)} KB
                              {att.uploaded_by ? ` • by ${att.uploaded_by}` : ""}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 gap-1 cursor-pointer"
                            onClick={() => handlePreviewAttachment(att)}
                            disabled={isLoadingPreview}
                            title="Preview file"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span className="text-[11px]">Preview</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 cursor-pointer"
                            onClick={() => {
                              if (id) {
                                downloadAttachment(id, att.id, att.filename).catch((err) => {
                                  toast.error(err?.message || "Failed to download attachment");
                                });
                              }
                            }}
                            title="Download file"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span className="text-[11px]">Download</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to remove attachment "${att.filename}"?`)) {
                                deleteAttachmentMutation.mutate(att.id);
                              }
                            }}
                            title="Remove attachment"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history" className="mt-0 space-y-2 max-h-60 overflow-y-auto pr-1">
                  {history.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground space-y-1">
                      <History className="h-7 w-7 mx-auto text-slate-300 dark:text-zinc-700" />
                      <p className="font-semibold text-slate-700 dark:text-zinc-300">No activity history yet</p>
                    </div>
                  ) : (
                    history.map((hist) => (
                      <div
                        key={hist.id}
                        className="p-2 rounded-lg bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800 text-[11px] space-y-0.5"
                      >
                        <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-zinc-200">
                          <span>{hist.changed_by_name || hist.changed_by}</span>
                          <span className="text-muted-foreground font-normal text-[10px]">
                            {formatDate(hist.created_at)}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-zinc-400">
                          {hist.action}: {hist.old_value ? `${hist.old_value} ➔ ` : ""}
                          <strong className="text-slate-900 dark:text-zinc-100">{hist.new_value || hist.comment}</strong>
                        </p>
                      </div>
                    ))
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
  );
}
