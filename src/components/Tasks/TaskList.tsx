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
              <TableCell className="font-medium">#{task.id}</TableCell>
              <TableCell>{task.product_name}</TableCell>
              <TableCell>{task.category}</TableCell>
              <TableCell>${task.amount}</TableCell>
              <TableCell>
                <Badge variant={task.priority === 'High' ? 'destructive' : task.priority === 'Medium' ? 'default' : 'secondary'}>
                  {task.priority}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">
                {task.assignee_name ? <span className="text-primary font-medium">{task.assignee_name}</span> : <span className="text-muted-foreground italic">Unassigned</span>}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{task.status}</Badge>
              </TableCell>
              <TableCell>
                {task.created_at ? format(new Date(task.created_at), 'MMM d, yyyy') : ''}
              </TableCell>
            </TableRow>
          ))}
          {tasks.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No tasks found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
