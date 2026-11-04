import { renderGLAccountBadge } from "@/utils/glAccountUtils";
import { formatDate, formatMoney, PRIORITY_BADGE, getStatusLabel } from "../../utils/purchasingMeta";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { CheckCircle2, XCircle, ExternalLink, Globe } from "lucide-react";
import { getInitials } from "../utils";
import type { MyApprovalsState } from "../hooks/useMyApprovals";

export function QuickRequestPreviewDrawer({ s }: { s: MyApprovalsState }) {
  const { previewRequest, handleSingleReject, handleSingleApprove, isHistoryMode, navigate, glCodes, setPreviewRequest } = s;
  return (
    <Sheet open={!!previewRequest} onOpenChange={(open) => !open && setPreviewRequest(null)}>
        <SheetContent className="w-full sm:max-w-lg md:max-w-xl flex flex-col p-0 overflow-hidden bg-white dark:bg-zinc-950">
          {previewRequest && (
            <div className="flex flex-col h-full">
              {/* Drawer Header */}
              <div className="p-6 pb-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/50">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      Request #{previewRequest.id}
                    </span>
                    <SheetTitle className="text-lg font-bold text-slate-900 dark:text-zinc-100 mt-1">
                      {previewRequest.title || `Purchase Request #${previewRequest.id}`}
                    </SheetTitle>
                    {previewRequest.item_url && (
                      <div className="mt-2">
                        <a
                          href={previewRequest.item_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-2.5 py-1 rounded-md border border-indigo-200/80 dark:border-indigo-800/60 transition-colors"
                        >
                          <Globe className="w-3.5 h-3.5 shrink-0" />
                          <span>View Item / Product Link</span>
                          <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                        </a>
                      </div>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs font-semibold px-2.5 py-0.5 border ${
                      PRIORITY_BADGE[previewRequest.priority as keyof typeof PRIORITY_BADGE] ||
                      PRIORITY_BADGE.MEDIUM
                    }`}
                  >
                    {previewRequest.priority || "MEDIUM"}
                  </Badge>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white font-bold text-xs flex items-center justify-center">
                      {getInitials(previewRequest.requester)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                        {previewRequest.requester || "Unassigned"}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {previewRequest.department || "General Department"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-muted-foreground block">Total Amount</span>
                    <span className="text-base font-bold font-mono text-slate-900 dark:text-zinc-100">
                      {formatMoney(Number(previewRequest.amount) || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
                {/* Key Details Grid */}
                <div className="grid grid-cols-2 gap-3.5 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Submission Date</span>
                    <span className="font-semibold text-slate-900 dark:text-zinc-100">
                      {formatDate(previewRequest.request_date)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Due Date</span>
                    <span className="font-semibold text-slate-900 dark:text-zinc-100">
                      {previewRequest.due_date ? formatDate(previewRequest.due_date) : "Immediate"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px] mb-0.5">GL Code / Account</span>
                    <div>
                      {renderGLAccountBadge(previewRequest.gl_code, glCodes)}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Current Status</span>
                    <span className="font-semibold text-slate-900 dark:text-zinc-100">
                      {getStatusLabel(previewRequest.status)}
                    </span>
                  </div>
                  {previewRequest.item_url && (
                    <div className="col-span-2 pt-2 border-t border-slate-200/60 dark:border-zinc-800/60 flex items-center justify-between gap-2">
                      <span className="text-muted-foreground block text-[11px]">Product Link</span>
                      <a
                        href={previewRequest.item_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline max-w-[280px] truncate"
                      >
                        <Globe className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{previewRequest.item_url}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Description / Terms */}
                {previewRequest.description && (
                  <div className="space-y-1.5">
                    <span className="font-semibold text-slate-800 dark:text-zinc-200">
                      Description & Business Justification
                    </span>
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {previewRequest.description}
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/50 flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/purchasing/requests/${previewRequest.id}`, { state: { from: "/purchasing/my-approvals" } })}
                  className="text-xs gap-1.5"
                >
                  <span>Open Full Record</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>

                {!isHistoryMode && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        handleSingleApprove(previewRequest);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        handleSingleReject(previewRequest);
                      }}
                      className="border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 font-semibold text-xs gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
  );
}
