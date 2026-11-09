import { FolderKanban, Eye, MoreHorizontal, Repeat } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getStatusBadge, getStatusLabel, formatDate, formatMoney, formatRequestType } from "../../utils/purchasingMeta";
import PrioritySelector from "../../fields/PrioritySelector";
import type { PurchaseRequestsState } from "../hooks/usePurchaseRequestsPage";
import { FluidListFooter, LoadMoreRow, useFitToScreen, useFluidRows } from "@/components/common/FluidList";

export function RequestsTableCard({ s }: { s: PurchaseRequestsState }) {
  const { setConvertingRequest, navigate, setSearchParams, searchParams, visibleRequests, isLoading } = s;
  const { visibleRows: shownRequests, ...fluid } = useFluidRows(
    visibleRequests,
    [s.search, s.statusFilter, s.typeFilter, s.projectFilter].join("|"),
  );
  const fit = useFitToScreen();
  return (
    <Card {...fit} className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xs bg-white dark:bg-zinc-900 overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0 overflow-auto relative">
          <Table className="w-full min-w-full" containerClassName="overflow-visible">
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 whitespace-nowrap">ID</TableHead>
              <TableHead className="min-w-[240px]">Title</TableHead>
              <TableHead className="whitespace-nowrap">Requester</TableHead>
              <TableHead className="whitespace-nowrap">Type</TableHead>
              <TableHead className="whitespace-nowrap">Mode</TableHead>
              <TableHead className="whitespace-nowrap">Amount</TableHead>
              <TableHead className="whitespace-nowrap">Priority</TableHead>
              <TableHead className="whitespace-nowrap">Status</TableHead>
              <TableHead className="whitespace-nowrap min-w-[110px]">Date</TableHead>
              <TableHead className="w-10 text-right whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-slate-500">
                  Loading requests...
                </TableCell>
              </TableRow>
            ) : visibleRequests.length > 0 ? (
              <>
              {shownRequests.map((r) => (
                <TableRow
                  key={r.id}
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/50"
                  onClick={() => navigate(`/purchasing/requests/${r.id}`)}
                >
                  <TableCell className="font-mono text-xs font-semibold text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                    #{r.id}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-slate-900 dark:text-zinc-100 min-w-[220px]">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{r.title}</span>
                        {(r.source_portal === "m7a" || r.source_portal === "m&a" || r.source_portal === "m_and_a" || r.is_ma) && (
                          <Badge className="text-[10px] px-1.5 py-0 h-4 bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-700 font-bold shrink-0">
                            M&amp;A
                          </Badge>
                        )}
                        {r.project_name && (
                          <Badge
                            variant="outline"
                            className="text-[10.5px] px-1.5 py-0 font-medium bg-indigo-50/80 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 shrink-0 gap-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/60"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newParams = new URLSearchParams(searchParams);
                              newParams.set("project", r.project_name!);
                              setSearchParams(newParams);
                            }}
                            title={`Click to filter all requests under project: ${r.project_name}`}
                          >
                            <FolderKanban className="h-3 w-3 text-indigo-500" />
                            <span>{r.project_name}</span>
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{r.requester}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant="secondary" className="text-xs font-normal">
                      {formatRequestType(r.request_type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {r.item_mode === "MULTIPLE" || (r.items && r.items.length > 0) ? (
                      <Badge variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50/50 text-[11px]">
                        Multi Parts ({r.items?.length || "PDF"})
                      </Badge>
                    ) : (
                      <span className="text-xs text-slate-400">Single</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm font-semibold text-slate-900 dark:text-zinc-100 whitespace-nowrap">
                    {formatMoney(r.amount)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <PrioritySelector
                      requestId={r.id}
                      priority={r.priority}
                      size="xs"
                    />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant="outline" className={getStatusBadge(r.status)}>
                      {getStatusLabel(r.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm whitespace-nowrap min-w-[110px]">{formatDate(r.request_date)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 shadow-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                        <DropdownMenuItem
                          onClick={() => navigate(`/purchasing/requests/${r.id}`)}
                          className="cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5 mr-2 text-slate-500" />
                          <span>View Details</span>
                        </DropdownMenuItem>
                        {r.request_type !== "RECURRING" && r.request_type !== "SCHEDULED_PAYMENT" && (
                          <DropdownMenuItem
                            onClick={() => setConvertingRequest(r)}
                            className="cursor-pointer text-emerald-700 dark:text-emerald-400 focus:text-emerald-700 dark:focus:text-emerald-400"
                          >
                            <Repeat className="h-3.5 w-3.5 mr-2 text-emerald-600 dark:text-emerald-400" />
                            <span>Convert to Recurring</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              <LoadMoreRow {...fluid} />
              </>
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-slate-500">
                  No requests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
        {!isLoading && <FluidListFooter {...fluid} noun="requests" />}
      </Card>
  );
}
