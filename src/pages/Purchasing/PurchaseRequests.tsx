import { useMemo, useState } from "react";
import HelpIcon from "@/components/ui/HelpIcon";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Search, ShoppingCart, Clock, FileWarning, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { usePurchaseRequests, usePurchasingSummary, useCreateRequest } from "@/hooks/usePurchasing";
import type { Priority, RequestCreateInput, RequestType } from "@/types/purchasing";
import { PRIORITY_BADGE, STATUS_LABEL, getStatusBadge, getStatusLabel, formatDate, formatMoney } from "./purchasingMeta";

const EMPTY_FORM: RequestCreateInput = {
  title: "",
  requester: "",
  department: "",
  request_type: "SPEND",
  priority: "MEDIUM",
  description: "",
};

export default function PurchaseRequests() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState<RequestCreateInput>(EMPTY_FORM);

  const filters = useMemo(
    () => ({
      search: search || undefined,
      status: statusFilter === "ALL" ? undefined : statusFilter,
      request_type: typeFilter === "ALL" ? undefined : typeFilter,
    }),
    [search, statusFilter, typeFilter],
  );

  const { data: requests = [], isLoading } = usePurchaseRequests(filters);
  const { data: summary } = usePurchasingSummary();
  const createMutation = useCreateRequest();

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.requester || !form.department) {
      toast.error("Title, requester and department are required.");
      return;
    }
    try {
      const detail = await createMutation.mutateAsync(form);
      toast.success(`Request ${detail.request.id} created`);
      setIsDialogOpen(false);
      navigate(`/purchasing/requests/${detail.request.id}`);
    } catch (err) {
      toast.error((err as Error).message || "Failed to create request");
    }
  };

  const cards = [
    { label: "Open Requests", value: summary?.open_requests ?? 0, icon: ShoppingCart, tint: "text-blue-600" },
    { label: "Awaiting Approval", value: summary?.awaiting_approval ?? 0, icon: Clock, tint: "text-orange-600" },
    { label: "Unpaid Invoices", value: summary?.unpaid_invoices ?? 0, sub: summary ? formatMoney(summary.unpaid_amount) : undefined, icon: FileWarning, tint: "text-fuchsia-600" },
    { label: "Completed", value: summary?.completed ?? 0, icon: CheckCircle2, tint: "text-green-600" },
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2"><h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Purchase Requests</h2><HelpIcon text="Manage and create purchase requests. Displays current review status and routing info." /></div>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Capture, review, approve and track purchasing &amp; accounts payable requests.
          </p>
        </div>
        <Button onClick={openCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> New Request
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="border border-slate-200 dark:border-zinc-800">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`rounded-lg bg-slate-100 dark:bg-zinc-800 p-2 ${c.tint}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-zinc-100">{c.value}</div>
                  <div className="text-xs text-slate-500 dark:text-zinc-400">{c.label}</div>
                  {c.sub && <div className="text-xs font-medium text-slate-600 dark:text-zinc-300">{c.sub}</div>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500 dark:text-zinc-400" />
          <Input
            placeholder="Search requests..."
            className="pl-9 w-64 sm:w-80"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="SPEND">Spend</SelectItem>
            <SelectItem value="ADMIN">Admin Triage</SelectItem>
            <SelectItem value="RECURRING">Recurring</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-52"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {(Object.keys(STATUS_LABEL) as Array<keyof typeof STATUS_LABEL>).map((s) => (
              <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="flex-1 min-h-0 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm p-0">
        <Table className="m-0" containerClassName="max-h-[calc(100vh-22rem)]">
          <TableHeader className="bg-slate-50/80 dark:bg-zinc-950/50 sticky top-0 z-10 border-b">
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Requester</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-slate-500">Loading requests...</TableCell></TableRow>
            ) : requests.length ? (
              requests.map((r) => (
                <TableRow
                  key={r.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/purchasing/requests/${r.id}`)}
                >
                  <TableCell className="font-mono text-xs">{r.id}</TableCell>
                  <TableCell className="font-medium">{r.title}</TableCell>
                  <TableCell>{r.requester}</TableCell>
                  <TableCell>{r.department}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {r.request_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={PRIORITY_BADGE[r.priority]}>{r.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusBadge(r.status)}>{getStatusLabel(r.status)}</Badge>
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">{formatDate(r.request_date)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-slate-500">No requests found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Purchase Request</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Dell laptop for new hire" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Requester</label>
                <Input value={form.requester} onChange={(e) => setForm({ ...form, requester: e.target.value })} placeholder="Full name" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. Production" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                  <Select value={form.request_type} onValueChange={(v: RequestType) => setForm({ ...form, request_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SPEND">Spend Request</SelectItem>
                      <SelectItem value="ADMIN">Admin Triage</SelectItem>
                      <SelectItem value="RECURRING">Recurring (Subscription)</SelectItem>
                    </SelectContent>
                  </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as Priority })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What is being requested and why?"
                rows={3}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Request"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
