import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
import { getStatusBadge, getStatusLabel, formatDate, formatMoney, formatRequestType } from "./purchasingMeta";
import { RequestStatus } from "@/types/purchasing";
import { parseRequestStatus } from "@/lib/requestStatus";

export default function Invoices() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      // AP sees the "Waiting Payment" and "Completed" stages
      let filter = "WAITING_PAYMENT,SENT_TO_AP,Waiting Payment,Sent to AP,INVOICE_RECEIVED,Invoice Received,COMPLETED,Completed";
      if (statusFilter === "WAITING_PAYMENT") filter = "WAITING_PAYMENT,SENT_TO_AP,Waiting Payment,Sent to AP";
      else if (statusFilter === "INVOICE_RECEIVED") filter = "INVOICE_RECEIVED,Invoice Received";
      else if (statusFilter === "COMPLETED") filter = "COMPLETED,Completed";

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

  // Outstanding amount calculation for Waiting Payment & Invoice Received
  const outstanding = useMemo(
    () => tasks
      .filter((t) => {
        const parsed = parseRequestStatus(t.status);
        return parsed === RequestStatus.WaitingPayment || parsed === RequestStatus.InvoiceReceived;
      })
      .reduce((sum, t) => sum + Number(t.amount || 0), 0),
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
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Accounts Payable</h2>
            <HelpIcon text="Track, record, and pay vendor invoices generated through the purchasing workflow." />
          </div>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Invoices awaiting payment. Outstanding balance: <span className="font-semibold text-slate-900 dark:text-zinc-100">{formatMoney(outstanding)}</span>
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Payment status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Records</SelectItem>
            <SelectItem value="WAITING_PAYMENT">Waiting Payment</SelectItem>
            <SelectItem value="INVOICE_RECEIVED">Invoice Received</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="flex-1 min-h-[600px] flex flex-col w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-0">
        <Table className="m-0 w-full min-w-full" containerClassName="flex-1 w-full min-w-full overflow-x-auto">
          <TableHeader >
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Item / Product Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Request Date</TableHead>
              <TableHead>Date Arrived</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Assignee</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                  Loading records...
                </TableCell>
              </TableRow>
            ) : tasks.length ? (
              tasks.map((task) => {
                const overdue = isOverdue(task.due_date);
                return (
                  <TableRow
                    key={task.id}
                    className="cursor-pointer hover:bg-slate-50/70 dark:hover:bg-zinc-800/50 transition-colors"
                    onClick={() => navigate(`/purchasing/requests/${task.id}`)}
                  >
                    <TableCell className="font-mono text-xs font-semibold text-slate-600 dark:text-zinc-400">
                      #{task.id}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900 dark:text-zinc-100 min-w-[240px]">
                      {task.product_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs font-normal">
                        {formatRequestType(task.category || task.request_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-slate-900 dark:text-zinc-100">
                      {formatMoney(Number(task.amount))}
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {formatDate(task.created_at)}
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className={overdue ? "text-red-600 font-medium" : "text-slate-500"}>
                        {formatDate(task.due_date || task.goods_received_at) || "—"}
                        {overdue ? " · overdue" : ""}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusBadge(task.status)}>
                        {getStatusLabel(task.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm text-slate-600 dark:text-zinc-400">
                      {task.assignee_name || <span className="italic text-slate-400">Unassigned</span>}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                  No records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
