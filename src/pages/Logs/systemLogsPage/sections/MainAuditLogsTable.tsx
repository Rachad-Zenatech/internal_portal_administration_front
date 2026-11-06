import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldAlert, ExternalLink, Clock, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { getActionMeta, generateChangeSummary, formatLogDate, getInitials } from "../utils";
import type { SystemLogsPageState } from "../hooks/useSystemLogsPage";

export function MainAuditLogsTable({ s }: { s: SystemLogsPageState }) {
  const { setPage, loading, total, limit, page, setLimit, logs, handleOpenInspector, navigate, setTimeFilter, setActionFilter, setEntityTypeFilter, setSearch } = s;
  return (
    <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xs overflow-hidden flex flex-col flex-1 min-h-[400px]">
        <div className="overflow-x-auto flex-1">
          <Table className="min-w-[1080px] w-full">
            <TableHeader className="bg-slate-50/70 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-zinc-800">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[180px] min-w-[180px] font-semibold text-slate-700 dark:text-zinc-300 text-xs uppercase tracking-wider py-3.5 pl-4">
                  Timestamp
                </TableHead>
                <TableHead className="w-[220px] min-w-[200px] font-semibold text-slate-700 dark:text-zinc-300 text-xs uppercase tracking-wider">
                  Actor / User
                </TableHead>
                <TableHead className="w-[160px] min-w-[150px] font-semibold text-slate-700 dark:text-zinc-300 text-xs uppercase tracking-wider">
                  Action
                </TableHead>
                <TableHead className="w-[300px] min-w-[240px] max-w-[340px] font-semibold text-slate-700 dark:text-zinc-300 text-xs uppercase tracking-wider">
                  Target Entity
                </TableHead>
                <TableHead className="min-w-[220px] font-semibold text-slate-700 dark:text-zinc-300 text-xs uppercase tracking-wider">
                  Summary & Context
                </TableHead>
                <TableHead className="w-[100px] min-w-[90px] text-right font-semibold text-slate-700 dark:text-zinc-300 text-xs uppercase tracking-wider pr-4">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="py-4">
                      <div className="h-8 bg-slate-100 dark:bg-zinc-900 rounded-lg animate-pulse" />
                    </TableCell>
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                      <ShieldAlert className="h-10 w-10 text-slate-300 dark:text-zinc-700 stroke-1" />
                      <p className="text-base font-semibold text-slate-700 dark:text-zinc-300">No audit logs found</p>
                      <p className="text-xs max-w-sm">
                        No events match your current search and filter criteria. Try adjusting the search query or resetting filters.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearch("");
                          setEntityTypeFilter("ALL");
                          setActionFilter("ALL");
                          setTimeFilter("ALL");
                        }}
                        className="mt-2 text-xs"
                      >
                        Reset All Filters
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const actionMeta = getActionMeta(log.action);
                  const ActionIcon = actionMeta.icon;
                  const dateInfo = formatLogDate(log.created_at);
                  const isPurchaseRequest = log.entity_type === "PurchaseRequest";
                  const entityLabel = log.entity_title
                    ? log.entity_title
                    : `${log.entity_type} #${log.entity_id}`;

                  return (
                    <TableRow
                      key={log.id}
                      onClick={() => handleOpenInspector(log)}
                      className="cursor-pointer hover:bg-slate-50/80 dark:hover:bg-zinc-900/60 transition-colors group border-b border-slate-100 dark:border-zinc-800/60"
                    >
                      {/* 1. Timestamp */}
                      <TableCell className="py-3 pl-4 font-medium whitespace-nowrap w-[180px] min-w-[180px]">
                        <div className="flex flex-col gap-0.5">
                          <div className="text-xs font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5 whitespace-nowrap">
                            <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span>{dateInfo.time}</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 whitespace-nowrap">
                            <span>{dateInfo.date}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500 font-mono font-medium">
                              {dateInfo.relative}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* 2. Actor / User */}
                      <TableCell className="py-3 w-[220px] min-w-[200px] max-w-[240px]">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs ring-1 ring-white dark:ring-zinc-900">
                            {getInitials(log.actor_name)}
                          </div>
                          <div className="min-w-0 flex flex-col flex-1">
                            <div className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate" title={log.actor_name || "System Automation"}>
                              {log.actor_name || "System Automation"}
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1" title={log.actor_email || log.actor_department || ""}>
                              {log.actor_email ? (
                                <span>{log.actor_email}</span>
                              ) : log.actor_department ? (
                                <span className="text-slate-500">{log.actor_department}</span>
                              ) : (
                                <span className="font-mono text-[10px] text-slate-400">
                                  {log.user_id ? log.user_id.slice(0, 8) : "System"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* 3. Action */}
                      <TableCell className="py-3 whitespace-nowrap w-[160px] min-w-[150px]">
                        <Badge
                          variant="outline"
                          className={`text-xs font-semibold px-2.5 py-1 gap-1.5 inline-flex items-center rounded-lg shadow-2xs ${actionMeta.color}`}
                        >
                          <ActionIcon className={`h-3.5 w-3.5 shrink-0 ${actionMeta.iconColor}`} />
                          <span>{actionMeta.label}</span>
                        </Badge>
                      </TableCell>

                      {/* 4. Target Entity */}
                      <TableCell className="py-3 w-[300px] min-w-[240px] max-w-[340px]">
                        <div className="flex items-center gap-2 min-w-0">
                          {isPurchaseRequest ? (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/purchasing/requests/${log.entity_id}`);
                              }}
                              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline flex items-center gap-2 group/link cursor-pointer min-w-0 overflow-hidden"
                              title={log.entity_title ? `#${log.entity_id} ${log.entity_title}` : `Request #${log.entity_id}`}
                            >
                              <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-mono text-[10px] font-bold border border-indigo-100 dark:border-indigo-900 shrink-0">
                                #{log.entity_id}
                              </span>
                              <span className="truncate">{log.entity_title || `Request #${log.entity_id}`}</span>
                              <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity shrink-0 text-indigo-500" />
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs truncate min-w-0" title={entityLabel}>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 font-mono shrink-0">
                                {log.entity_type}
                              </Badge>
                              <span className="font-medium text-slate-800 dark:text-zinc-200 truncate">
                                {entityLabel}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* 5. Summary & Context */}
                      <TableCell className="py-3 min-w-[220px] max-w-[380px]">
                        <div className="text-xs text-slate-600 dark:text-zinc-400 font-normal truncate" title={generateChangeSummary(log)}>
                          {generateChangeSummary(log)}
                        </div>
                      </TableCell>

                      {/* 6. Action Button */}
                      <TableCell className="py-3 text-right pr-4 whitespace-nowrap w-[100px] min-w-[90px]">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenInspector(log);
                          }}
                          className="h-7 text-xs font-medium px-2.5 opacity-80 group-hover:opacity-100 gap-1 hover:bg-slate-100 dark:hover:bg-zinc-800"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-500" />
                          <span>Details</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Table Footer & Pagination ── */}
        <div className="p-3.5 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>
              Showing{" "}
              <strong className="text-slate-900 dark:text-zinc-100">
                {logs.length > 0 ? (page - 1) * limit + 1 : 0}
              </strong>{" "}
              to{" "}
              <strong className="text-slate-900 dark:text-zinc-100">
                {Math.min(page * limit, total)}
              </strong>{" "}
              of <strong className="text-slate-900 dark:text-zinc-100">{total}</strong> records
            </span>

            <div className="flex items-center gap-1.5 ml-4">
              <span>Per page:</span>
              <Select
                value={String(limit)}
                onValueChange={(val) => {
                  setLimit(Number(val));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-7 text-xs w-20 bg-white dark:bg-zinc-950">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 text-xs gap-1 bg-white dark:bg-zinc-950 px-2.5"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </Button>
            <span className="px-3 py-1 font-semibold text-slate-800 dark:text-zinc-200">
              Page {page} of {Math.max(1, Math.ceil(total / limit))}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page * limit >= total || loading}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 text-xs gap-1 bg-white dark:bg-zinc-950 px-2.5"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
  );
}
