import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getStatusBadge, getStatusLabel, formatMoney } from "../../utils/purchasingMeta";
import { InvoiceItemVendorCell } from "./InvoiceItemVendorCell";
import { WireBankingDetailsCell } from "./WireBankingDetailsCell";
import { InvoiceDueDateCell } from "./InvoiceDueDateCell";
import { InvoiceActionsCell } from "./InvoiceActionsCell";

interface Props {
  task: any;
  isOverdue: (date: string | null | undefined, status: string) => boolean;
  isDueToday: (date: string | null | undefined, status: string) => boolean;
  isScheduledPayment: (t: any) => boolean;
  isWireTransfer: (t: any) => boolean;
  navigate: (url: string) => void;
  copiedKey: string | null;
  handleCopy: (text: string, key: string, label: string) => void;
  setSelectedWireTask: (t: any) => void;
}

export function InvoiceTaskRow({
  task,
  isOverdue,
  isDueToday,
  isScheduledPayment,
  isWireTransfer,
  navigate,
  copiedKey,
  handleCopy,
  setSelectedWireTask,
}: Props) {
  return (
    <TableRow
      className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors group cursor-pointer"
      onClick={() => navigate(`/purchasing/requests/${task.id}`)}
    >
      {/* ID */}
      <TableCell className="font-mono text-xs font-bold text-slate-700 dark:text-zinc-300">
        <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:group-hover:bg-indigo-950/60 dark:group-hover:text-indigo-300 transition-colors">
          #{task.id}
        </span>
      </TableCell>

      {/* Item / Vendor */}
      <TableCell>
        <InvoiceItemVendorCell
          task={task}
          isScheduledPayment={isScheduledPayment}
          isWireTransfer={isWireTransfer}
        />
      </TableCell>

      {/* Wire Banking Details */}
      <TableCell onClick={(e) => e.stopPropagation()}>
        <WireBankingDetailsCell
          task={task}
          copiedKey={copiedKey}
          handleCopy={handleCopy}
        />
      </TableCell>

      {/* Amount */}
      <TableCell className="font-mono text-sm font-semibold text-slate-900 dark:text-zinc-100">
        {formatMoney(task.amount, task.currency || "USD")}
      </TableCell>

      {/* Due Date */}
      <TableCell>
        <InvoiceDueDateCell task={task} isOverdue={isOverdue} isDueToday={isDueToday} />
      </TableCell>

      {/* Status */}
      <TableCell>
        <Badge variant="outline" className={`text-[11px] font-medium ${getStatusBadge(task.status)}`}>
          {getStatusLabel(task.status)}
        </Badge>
      </TableCell>

      {/* Assignee */}
      <TableCell className="text-xs text-slate-600 dark:text-zinc-400">
        {task.assignee_name ? (
          <span className="truncate max-w-[120px] block" title={task.assignee_name}>{task.assignee_name}</span>
        ) : (
          <span className="italic text-slate-400">Unassigned</span>
        )}
      </TableCell>

      {/* Actions */}
      <TableCell className="text-right">
        <InvoiceActionsCell
          task={task}
          setSelectedWireTask={setSelectedWireTask}
          navigate={navigate}
        />
      </TableCell>
    </TableRow>
  );
}
