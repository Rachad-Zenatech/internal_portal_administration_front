import { Check, Copy, CornerDownRight, History, Layers, Link as LinkIcon, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { QuoteDetailPageViewState } from "../hooks/useQuoteDetailPageTail";

export function QuoteSideColumn({ v }: { v: QuoteDetailPageViewState }) {
  const { formatActorDisplay, formatAuditEvent, auditLogs, publishMutation, quote, revokeLinksMutation, copiedLink, handleCopyLink, isPublished, navigate, isSuperseded } = v;
  return (
    <div className="space-y-6 print:hidden">
          {/* Version Lineage Card */}
          {quote.version_history && quote.version_history.length > 1 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                  <Layers className="w-4 h-4 text-amber-600" />
                  <span>Version Lineage</span>
                </h3>
                <Badge variant="outline" className="text-[10px]">
                  {quote.version_history.length} versions
                </Badge>
              </div>

              <div className="space-y-1.5">
                {quote.version_history.map((ver) => {
                  const isCurrent = ver.id === quote.id;
                  const isVerDisabled =
                    ver.publication_state === "DISABLED" ||
                    ver.customer_response_state === "SUPERSEDED" ||
                    !!ver.superseded_by_id;
                  const isVerSigned = ver.customer_response_state === "SIGNED";

                  return (
                    <button
                      key={ver.id}
                      type="button"
                      disabled={isCurrent}
                      onClick={() => navigate(`/account-receivable/quotes/${ver.id}`)}
                      className={`w-full text-left p-3 rounded-xl text-xs transition-all flex items-center justify-between gap-2 ${
                        isCurrent
                          ? "bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 font-semibold shadow-xs"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-100 dark:border-slate-800/60 cursor-pointer text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isVerDisabled && (
                          <CornerDownRight className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        )}
                        <div className="truncate">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                              {ver.quote_number}
                            </span>
                            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800/60">
                              v{ver.current_version}
                            </span>
                          </div>
                          <div className="text-[10.5px] text-slate-400 mt-0.5 font-mono">
                            {new Date(ver.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {isCurrent ? (
                          <Badge className="bg-amber-600 text-white text-[9px] px-1.5 py-0">
                            Current Viewing
                          </Badge>
                        ) : isVerDisabled ? (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-slate-500 border-slate-300 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800">
                            Disabled
                          </Badge>
                        ) : isVerSigned ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[9px] px-1.5 py-0">
                            Signed
                          </Badge>
                        ) : (
                          <Badge className="bg-sky-50 text-sky-700 border-sky-300 text-[9px] px-1.5 py-0">
                            {ver.publication_state === "PUBLISHED" ? "Published" : "Draft"}
                          </Badge>
                        )}
                        <span className="font-mono text-[11px] font-medium text-slate-700 dark:text-slate-300">
                          ${Number(ver.total_amount).toFixed(2)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Customer Access Link Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
              <LinkIcon className="w-4 h-4 text-amber-600" />
              <span>Customer Access Link</span>
            </h3>

            {isSuperseded ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center space-y-3">
                <p className="text-xs text-slate-500">
                  This version is <strong>Disabled</strong>. Customer access links were revoked when version v{quote.superseded_by_version || quote.current_version + 1} was created.
                </p>
                {quote.superseded_by_id && (
                  <Button
                    size="sm"
                    onClick={() => navigate(`/account-receivable/quotes/${quote.superseded_by_id}`)}
                    className="text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-xl gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Go to Active Revision</span>
                  </Button>
                )}
              </div>
            ) : isPublished ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Link Status</span>
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px]">
                      Active Link
                    </Badge>
                  </div>
                  {quote.active_link_expires_at && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Expires On</span>
                      <span className="font-mono">{new Date(quote.active_link_expires_at).toLocaleDateString()}</span>
                    </div>
                  )}
                  {quote.last_viewed_at && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Last Viewed</span>
                      <span className="font-mono">{new Date(quote.last_viewed_at).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="flex-1 text-xs rounded-xl border-slate-200 dark:border-slate-800 gap-1.5 cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? "Copied Link!" : "Copy Access URL"}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => revokeLinksMutation.mutate(quote.id)}
                    disabled={revokeLinksMutation.isPending}
                    className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl cursor-pointer"
                    title="Revoke active link"
                  >
                    <ShieldX className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center space-y-2">
                <p className="text-xs text-slate-500">
                  This quote is currently a <strong>Draft</strong>. Publish it to generate secure customer access links.
                </p>
                <Button
                  size="sm"
                  onClick={() => publishMutation.mutate(quote.id)}
                  disabled={publishMutation.isPending}
                  className="text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-xl gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Publish Quote</span>
                </Button>
              </div>
            )}
          </div>

          {/* Immutable Audit Trail Timeline */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
              <History className="w-4 h-4 text-amber-600" />
              <span>Immutable Audit Trail ({auditLogs.length})</span>
            </h3>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {auditLogs.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No audit logs recorded yet.</p>
              ) : (
                auditLogs.map((log: any) => {
                  const evt = formatAuditEvent(log.event_type);
                  const actorDisplay = formatActorDisplay(log);
                  const logDate = new Date(log.created_at);
                  const formattedTime = isNaN(logDate.getTime())
                    ? ""
                    : logDate.toLocaleDateString([], { month: "short", day: "numeric" }) +
                      " • " +
                      logDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

                  return (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5 transition-all hover:bg-slate-100/60 dark:hover:bg-slate-800/70"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className={`text-[10px] font-semibold ${evt.badgeClass}`}>
                          {evt.label}
                        </Badge>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {formattedTime}
                        </span>
                      </div>

                      <div className="text-slate-700 dark:text-zinc-200 font-medium text-[11px] flex items-center gap-1">
                        <span className="text-slate-400">By:</span>
                        <span className="font-semibold">{actorDisplay}</span>
                        {log.actor_type && log.actor_type !== "USER" && (
                          <span className="text-[10px] text-slate-400">({log.actor_type})</span>
                        )}
                      </div>

                      {evt.desc && (
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                          {evt.desc}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[10px] text-slate-400 font-mono">
                        {log.quote_version && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-zinc-300">
                            Version v{log.quote_version}
                          </span>
                        )}
                        {log.ip_address && (
                          <span>IP: {log.ip_address}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
  );
}
