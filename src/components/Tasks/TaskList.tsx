import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { getStatusBadge, getStatusLabel, PRIORITY_BADGE, formatMoney, formatDate, formatRequestType } from "@/pages/Purchasing/purchasingMeta";

interface TaskListProps {
  tasks: any[];
  onTaskClick: (id: number) => void;
}

export default function TaskList({ tasks, onTaskClick }: TaskListProps) {
  return (
    <div className="flex-1 min-h-[600px] flex flex-col w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
      <Table className="m-0 w-full min-w-full" containerClassName="flex-1 w-full min-w-full overflow-x-auto">
        <TableHeader >
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Product Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow
              key={task.id}
              onClick={() => onTaskClick(task.id)}
              className="cursor-pointer hover:bg-slate-50/70 dark:hover:bg-zinc-800/50 transition-colors"
            >
              <TableCell className="font-mono text-xs font-semibold text-slate-600 dark:text-zinc-400">
                #{task.id}
              </TableCell>
              <TableCell className="font-medium text-slate-900 dark:text-zinc-100 min-w-[240px]">
                {task.product_name || task.title}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs font-normal">
                  {formatRequestType(task.category || task.request_type)}
                </Badge>
              </TableCell>
              <TableCell className="font-semibold text-slate-900 dark:text-zinc-100">
                {formatMoney(Number(task.amount || 0))}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={PRIORITY_BADGE[task.priority as keyof typeof PRIORITY_BADGE] ?? PRIORITY_BADGE.MEDIUM}
                >
                  {task.priority || "MEDIUM"}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-slate-600 dark:text-zinc-400">
                {task.assignee_name ? (
                  <span className="font-medium text-slate-900 dark:text-zinc-100">{task.assignee_name}</span>
                ) : (
                  <span className="italic text-slate-400">Unassigned</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={getStatusBadge(task.status)}>
                  {getStatusLabel(task.status)}
                </Badge>
              </TableCell>
              <TableCell className="text-slate-500 text-sm">
                {formatDate(task.created_at)}
              </TableCell>
            </TableRow>
          ))}
          {tasks.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                No tasks found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
