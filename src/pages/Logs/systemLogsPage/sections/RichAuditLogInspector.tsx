import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Activity, ExternalLink, Copy, Check, Globe, Monitor } from "lucide-react";
import { getActionMeta, generateChangeSummary, formatLogDate, getInitials } from "../utils";
import type { SystemLogsPageState } from "../hooks/useSystemLogsPage";

export function RichAuditLogInspector({ s }: { s: SystemLogsPageState }) {
  const { setSelectedLog, entityHistory, loadingHistory, selectedLog, copied, handleCopyJson, navigate } = s;
  return (
    <Sheet open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <SheetContent className="!w-full sm:!w-[640px] md:!w-[768px] lg:!w-[900px] xl:!w-[1020px] sm:!max-w-2xl md:!max-w-3xl lg:!max-w-4xl xl:!max-w-5xl flex flex-col p-0 overflow-hidden bg-white dark:bg-zinc-950">
          {selectedLog && (
            <div className="flex flex-col h-full">
              {/* Drawer Top Header */}
              <div className="p-6 pb-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50 shadow-2xs shrink-0">
                      <Activity className="h-5 w-5" />
                    </div>
                    <div>
                      <SheetTitle className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                        Audit Event #{selectedLog.id}
                      </SheetTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Recorded on {formatLogDate(selectedLog.created_at).date} at {formatLogDate(selectedLog.created_at).time}
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={`text-xs font-semibold px-3 py-1 gap-1.5 ${getActionMeta(selectedLog.action).color}`}
                  >
                    {getActionMeta(selectedLog.action).label}
                  </Badge>
                </div>

                {/* Actor Profile Mini-Card */}
                <div className="mt-4 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                      {getInitials(selectedLog.actor_name)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                        {selectedLog.actor_name || "System Automation"}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {selectedLog.actor_email || "system@internal.zenatech.com"}
                        {selectedLog.actor_department ? ` • ${selectedLog.actor_department}` : ""}
                      </div>
                    </div>
                  </div>

                  {selectedLog.user_id && (
                    <div className="text-[10px] font-mono text-muted-foreground bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded">
                      ID: {selectedLog.user_id.slice(0, 8)}...
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer Scrollable Content with Tabs */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Target Entity Card */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wide">
                      Target Entity
                    </span>
                    {selectedLog.entity_type === "PurchaseRequest" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/purchasing/requests/${selectedLog.entity_id}`)}
                        className="h-7 text-xs gap-1.5 text-indigo-600 bg-white dark:bg-zinc-950 font-medium"
                      >
                        <span>Open Request</span>
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Entity Type</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                        {selectedLog.entity_type}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Record ID</span>
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-zinc-100">
                        #{selectedLog.entity_id}
                      </span>
                    </div>
                    {selectedLog.entity_title && (
                      <div className="col-span-2">
                        <span className="text-[11px] text-muted-foreground block">Entity Subject / Title</span>
                        <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                          {selectedLog.entity_title}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tabs for Details vs History Timeline */}
                <Tabs defaultValue="diff" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-3 h-9">
                    <TabsTrigger value="diff" className="text-xs font-medium">
                      Field Changes
                    </TabsTrigger>
                    <TabsTrigger value="json" className="text-xs font-medium">
                      Raw JSON
                    </TabsTrigger>
                    <TabsTrigger value="history" className="text-xs font-medium">
                      Entity History ({entityHistory.length})
                    </TabsTrigger>
                  </TabsList>

                  {/* 1. Field Changes Visual Diff */}
                  <TabsContent value="diff" className="space-y-3 pt-1">
                    {selectedLog.changes && typeof selectedLog.changes === "object" ? (
                      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-100/70 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 text-[11px] font-semibold text-slate-600 dark:text-zinc-400">
                            <tr>
                              <th className="text-left p-2.5 pl-3">Field</th>
                              <th className="text-left p-2.5">Updated / New Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">
                            {Object.entries(selectedLog.changes).map(([key, val]) => (
                              <tr key={key} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/50">
                                <td className="p-2.5 pl-3 font-semibold text-slate-700 dark:text-zinc-300 font-mono text-[11px]">
                                  {key}
                                </td>
                                <td className="p-2.5 font-medium text-slate-900 dark:text-zinc-100">
                                  {typeof val === "object" && val !== null ? (
                                    <pre className="text-[11px] font-mono bg-slate-50 dark:bg-zinc-900 p-2 rounded max-h-36 overflow-auto">
                                      {JSON.stringify(val, null, 2)}
                                    </pre>
                                  ) : (
                                    <span className="font-mono text-emerald-700 dark:text-emerald-400">
                                      {String(val)}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-6 text-center rounded-xl border border-dashed text-xs text-muted-foreground bg-slate-50/50 dark:bg-zinc-900/30">
                        No structured field diff recorded for this action.
                      </div>
                    )}

                    {/* Metadata Box */}
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 space-y-2 text-xs">
                      <div className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wide">
                        Network & Client Info
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-muted-foreground text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5 text-slate-400" />
                          <span>IP: {selectedLog.ip_address || "Internal Network"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Monitor className="h-3.5 w-3.5 text-slate-400" />
                          <span className="truncate" title={selectedLog.user_agent || "Web Browser"}>
                            {selectedLog.user_agent ? selectedLog.user_agent.split(" ")[0] : "Web Portal"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* 2. Raw JSON */}
                  <TabsContent value="json" className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">Audit Record Payload</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyJson(selectedLog)}
                        className="h-7 text-xs gap-1.5"
                      >
                        {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                        <span>{copied ? "Copied" : "Copy JSON"}</span>
                      </Button>
                    </div>
                    <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto max-h-[360px] border border-slate-800">
                      {JSON.stringify(selectedLog, null, 2)}
                    </pre>
                  </TabsContent>

                  {/* 3. Entity History Timeline */}
                  <TabsContent value="history" className="space-y-4 pt-1">
                    {loadingHistory ? (
                      <div className="py-10 text-center text-xs text-muted-foreground">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-indigo-600" />
                        Loading entity history...
                      </div>
                    ) : entityHistory.length === 0 ? (
                      <div className="p-6 text-center rounded-xl border border-dashed text-xs text-muted-foreground">
                        No previous audit entries found for this record.
                      </div>
                    ) : (
                      <div className="space-y-3 relative before:absolute before:inset-0 before:left-[17px] before:w-0.5 before:bg-slate-200 dark:before:bg-zinc-800">
                        {entityHistory.map((hist) => {
                          const hMeta = getActionMeta(hist.action);
                          const HIcon = hMeta.icon;
                          const hDate = formatLogDate(hist.created_at);

                          return (
                            <div key={hist.id} className="relative flex items-start gap-3 pl-1">
                              <div
                                className={`h-8 w-8 rounded-full border-2 border-white dark:border-zinc-950 flex items-center justify-center shrink-0 z-10 shadow-2xs ${hMeta.color}`}
                              >
                                <HIcon className={`h-4 w-4 ${hMeta.iconColor}`} />
                              </div>
                              <div className="flex-1 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xs space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                                    {hMeta.label}
                                  </span>
                                  <span className="text-[11px] text-muted-foreground">
                                    {hDate.date} {hDate.time}
                                  </span>
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                  By <strong className="text-slate-700 dark:text-zinc-300">{hist.actor_name || "System"}</strong>
                                </div>
                                <div className="text-xs text-slate-600 dark:text-zinc-400 pt-1">
                                  {generateChangeSummary(hist)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 flex items-center justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedLog(null)}
                  className="h-9 px-4 text-xs font-medium"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
  );
}
