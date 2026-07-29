import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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

import { useInvoices, usePayInvoice } from "@/hooks/usePurchasing";
import { PAYMENT_BADGE, PAYMENT_LABEL, formatDate, formatMoney } from "./purchasingMeta";

export default function Invoices() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const { data: invoices = [], isLoading } = useInvoices(statusFilter === "ALL" ? undefined : statusFilter);
  const payMutation = usePayInvoice();

  const outstanding = useMemo(
    () => invoices.filter((i) => i.payment_status !== "PAID").reduce((sum, i) => sum + i.amount, 0),
    [invoices],
  );

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate).getTime() < Date.now();
  };

  const pay = async (id: string) => {
    try {
      await payMutation.mutateAsync(id);
      toast.success(`Invoice ${id} marked paid`);
    } catch (err) {
      toast.error((err as Error).message || "Failed to pay invoice");
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Accounts Payable</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Invoices awaiting payment. Outstanding balance: <span className="font-semibold">{formatMoney(outstanding)}</span>
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-52"><SelectValue placeholder="Payment status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Invoices</SelectItem>
            <SelectItem value="UNPAID">Unpaid</SelectItem>
            <SelectItem value="WAITING_PAYMENT">Waiting Payment</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="flex-1 min-h-0 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm p-0">
        <Table className="m-0" containerClassName="max-h-[calc(100vh-16rem)]">
          <TableHeader className="bg-slate-50/80 dark:bg-zinc-950/50 sticky top-0 z-10 border-b">
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Invoice Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Request</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-slate-500">Loading invoices...</TableCell></TableRow>
            ) : invoices.length ? (
              invoices.map((inv) => {
                const overdue = inv.payment_status !== "PAID" && isOverdue(inv.due_date);
                return (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs">{inv.id}</TableCell>
                    <TableCell className="font-medium">{inv.vendor}</TableCell>
                    <TableCell>{formatMoney(inv.amount)}</TableCell>
                    <TableCell className="text-slate-500 text-sm">{formatDate(inv.invoice_date)}</TableCell>
                    <TableCell className="text-sm">
                      <span className={overdue ? "text-red-600 font-medium" : "text-slate-500"}>
                        {formatDate(inv.due_date)}{overdue ? " · overdue" : ""}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={PAYMENT_BADGE[inv.payment_status]}>{PAYMENT_LABEL[inv.payment_status]}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="link" className="px-0 h-auto font-mono text-xs" onClick={() => navigate(`/purchasing/requests/${inv.request_id}`)}>
                        {inv.request_id}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      {inv.payment_status !== "PAID" ? (
                        <Button size="sm" onClick={() => pay(inv.id)} disabled={payMutation.isPending}>
                          Mark Paid
                        </Button>
                      ) : (
                        <span className="text-sm text-slate-400">Paid {formatDate(inv.paid_date)}</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-slate-500">No invoices found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
