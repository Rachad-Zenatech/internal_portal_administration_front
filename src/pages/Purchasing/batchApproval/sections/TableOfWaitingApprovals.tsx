import { formatDate, formatMoney, PRIORITY_BADGE } from "../../utils/purchasingMeta";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2 } from "lucide-react";
import type { BatchApprovalState } from "../hooks/useBatchApproval";

export function TableOfWaitingApprovals({ s }: { s: BatchApprovalState }) {
  const { handleSelectRow, navigate, selectedIds, filteredRequests, isLoading, handleSelectAll, allSelected } = s;
  return (
    <Card className="border border-slate-200 dark:border-zinc-800">
        <Table className="w-full min-w-full" containerClassName="flex-1 w-full min-w-full overflow-x-auto">
          <TableHeader >
            <TableRow className="bg-slate-50/50 dark:bg-zinc-900/50">
              <TableHead className="w-[48px]">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Title / Item</TableHead>
              <TableHead>Requester</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Requested Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  Loading requests awaiting approval...
                </TableCell>
              </TableRow>
            ) : filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2 opacity-80" />
                    <p className="font-semibold text-slate-700 dark:text-zinc-200">
                      All caught up!
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      There are currently no purchase requests awaiting approval.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((req) => {
                const isSelected = selectedIds.includes(parseInt(req.id));
                return (
                  <TableRow
                    key={req.id}
                    onClick={() => navigate(`/purchasing/requests/${req.id}`)}
                    className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors ${
                      isSelected ? "bg-blue-50/40 dark:bg-blue-950/30" : ""
                    }`}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          handleSelectRow(parseInt(req.id), !!checked)
                        }
                        aria-label={`Select request ${req.id}`}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      #{req.id}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900 dark:text-zinc-100 text-sm group-hover:text-primary transition-colors">
                        {req.title}
                      </div>
                      {req.description && (
                        <div className="text-xs text-muted-foreground truncate max-w-xs">
                          {req.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{req.requester}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {req.department}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={PRIORITY_BADGE[req.priority]}>
                        {req.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                      {formatMoney(req.amount)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground text-right">
                      {formatDate(req.request_date)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
  );
}
