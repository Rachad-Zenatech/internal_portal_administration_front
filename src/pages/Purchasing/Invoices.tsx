import { useEffect, useState, useMemo } from "react";
import HelpIcon from "@/components/ui/HelpIcon";
import { toast } from "sonner";


import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { apiClient as api } from "@/services/apiClient";
import { STATUS_BADGE, formatDate, formatMoney } from "./purchasingMeta";
import TaskDetailPanel from "@/components/Tasks/TaskDetailPanel";

const getStatusKey = (status: string): keyof typeof STATUS_BADGE => {
  const map: Record<string, keyof typeof STATUS_BADGE> = {
    "Waiting Payment": "WAITING_PAYMENT",
    "Paid": "PAID",
  };
  return map[status] || "NEW";
};

export default function Invoices() {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      // AP should see "Waiting Payment" and "Paid" statuses
      let filter = "Waiting Payment,Paid";
      if (statusFilter === "WAITING_PAYMENT") filter = "Waiting Payment";
      if (statusFilter === "PAID") filter = "Paid";
      
      const res = await api.get<any>(`/tasks?status=${filter}`);
      setTasks(res.items || []);
    } catch (e: any) {
      toast.error("Failed to load Accounts Payable tasks");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter]);

  useEffect(() => {
    if (selectedTaskId) {
      api.get(`/tasks/${selectedTaskId}`).then(res => {
        setSelectedTask(res);
      }).catch(() => {
        toast.error("Failed to load task details");
      });
    } else {
      setSelectedTask(null);
    }
  }, [selectedTaskId]);

  const outstanding = useMemo(
    () => tasks.filter((t) => t.status === "Waiting Payment").reduce((sum, t) => sum + Number(t.amount || 0), 0),
    [tasks]
  );

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate).getTime() < Date.now();
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2"><h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Accounts Payable</h2><HelpIcon text="Track, record, and pay vendor invoices generated through the purchasing workflow." /></div>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Invoices awaiting payment. Outstanding balance: <span className="font-semibold">{formatMoney(outstanding)}</span>
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-52"><SelectValue placeholder="Payment status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Records</SelectItem>
            <SelectItem value="WAITING_PAYMENT">Waiting Payment</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="flex-1 min-h-0 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm p-0">
        <Table className="m-0" containerClassName="max-h-[calc(100vh-16rem)]">
          <TableHeader className="bg-slate-50/80 dark:bg-zinc-950/50 sticky top-0 z-10 border-b">
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Item / Product Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Request Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Assignee</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-slate-500">Loading records...</TableCell></TableRow>
            ) : tasks.length ? (
              tasks.map((task) => {
                const overdue = task.status !== "Paid" && isOverdue(task.due_date);
                return (
                  <TableRow key={task.id} className="cursor-pointer hover:bg-slate-50/50 dark:hover:bg-zinc-800/50 transition-colors" onClick={() => setSelectedTaskId(task.id)}>
                    <TableCell className="font-mono text-xs">#{task.id}</TableCell>
                    <TableCell className="font-medium">{task.product_name}</TableCell>
                    <TableCell className="text-sm text-slate-500">{task.category}</TableCell>
                    <TableCell className="font-semibold">{formatMoney(Number(task.amount))}</TableCell>
                    <TableCell className="text-slate-500 text-sm">{formatDate(task.created_at)}</TableCell>
                    <TableCell className="text-sm">
                      <span className={overdue ? "text-red-600 font-medium" : "text-slate-500"}>
                        {formatDate(task.due_date)}{overdue ? " · overdue" : ""}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_BADGE[getStatusKey(task.status)]}>{task.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {task.assignee_name || <span className="italic text-slate-400">Unassigned</span>}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-slate-500">No records found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      
      <TaskDetailPanel 
        task={selectedTask}
        onClose={() => setSelectedTaskId(null)}
        onUpdate={() => {
          fetchTasks();
          if (selectedTaskId) {
            api.get(`/tasks/${selectedTaskId}`).then(res => setSelectedTask(res));
          }
        }}
      />
    </div>
  );
}
