import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { format } from "date-fns";
import { getStatusBadge, getStatusLabel, PRIORITY_BADGE } from "@/pages/Purchasing/purchasingMeta";

interface TaskListProps {
  tasks: any[];
  onTaskClick: (id: number) => void;
}

export default function TaskList({ tasks, onTaskClick }: TaskListProps) {
  return (
    <div className="border rounded-md bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Product Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id} onClick={() => onTaskClick(task.id)} className="cursor-pointer hover:bg-muted/50">
              <TableCell className="font-medium font-mono text-xs">#{task.id}</TableCell>
              <TableCell className="font-semibold text-slate-900 dark:text-zinc-100">{task.product_name || task.title}</TableCell>
              <TableCell>{task.category || "General"}</TableCell>
              <TableCell>${task.amount ?? 0}</TableCell>
              <TableCell>
                <Badge variant="outline" className={PRIORITY_BADGE[task.priority as keyof typeof PRIORITY_BADGE] ?? PRIORITY_BADGE.MEDIUM}>
                  {task.priority || "MEDIUM"}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">
                {task.assignee_name ? <span className="text-primary font-medium">{task.assignee_name}</span> : <span className="text-muted-foreground italic">Unassigned</span>}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={getStatusBadge(task.status)}>{getStatusLabel(task.status)}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {task.created_at ? format(new Date(task.created_at), 'MMM d, yyyy') : ''}
              </TableCell>
            </TableRow>
          ))}
          {tasks.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                No tasks found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
