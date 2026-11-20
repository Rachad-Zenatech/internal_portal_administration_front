import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Landmark, RefreshCw } from "lucide-react";
import type { InvoicesState } from "../hooks/useInvoices";
import { FluidListFooter, LoadMoreRow, useFitToScreen, useFluidRows } from "@/components/common/FluidList";
import { InvoiceTaskRow } from "./InvoiceTaskRow";

export function TableCard({ s }: { s: InvoicesState }) {
  const { navigate, setSelectedWireTask, copiedKey, handleCopy, isWireTransfer, isScheduledPayment, isDueToday, isOverdue, filteredTasks, isLoading } = s;
  const { visibleRows: shownTasks, ...fluid } = useFluidRows(
    filteredTasks,
    [s.typeFilter, s.statusFilter, s.wireFilter, s.quickFilter, s.searchQuery].join("|"),
  );
  const fit = useFitToScreen();

  return (
    <Card {...fit} className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xs bg-white dark:bg-zinc-900 overflow-hidden flex flex-col">
      <div className="flex-1 min-h-0 overflow-auto relative">
        <Table containerClassName="overflow-visible">
          <TableHeader>
            <TableRow className="bg-slate-50/75 dark:bg-zinc-900/75 border-b border-slate-200 dark:border-zinc-800">
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
              <>
                {shownTasks.map((task) => (
                  <InvoiceTaskRow
                    key={task.id}
                    task={task}
                    isOverdue={isOverdue}
                    isDueToday={isDueToday}
                    isScheduledPayment={isScheduledPayment}
                    isWireTransfer={isWireTransfer}
                    navigate={navigate}
                    copiedKey={copiedKey}
                    handleCopy={handleCopy}
                    setSelectedWireTask={setSelectedWireTask}
                  />
                ))}
                <LoadMoreRow {...fluid} />
              </>
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
                      No wire transfers or AP invoices are currently staged in the system.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && <FluidListFooter {...fluid} noun="wire transfers" />}
    </Card>
  );
}
