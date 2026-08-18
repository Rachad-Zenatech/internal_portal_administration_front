import { GLCodeAutocomplete } from "./GLCodeAutocomplete";
import { useMemo, useState, useEffect, useRef } from "react";
import HelpIcon from "@/components/ui/HelpIcon";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Clock, Plus, Search, ShoppingCart, FileWarning, CheckCircle2 } from "lucide-react";

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

import { usePurchaseRequests, usePurchasingSummary, useCreateRequest, useUsersList, useRolesList } from "@/hooks/usePurchasing";
import type { Priority, RequestCreateInput, RequestType } from "@/types/purchasing";
import { PRIORITY_BADGE, STATUS_LABEL, STATUS_FILTER_OPTIONS, getStatusBadge, getStatusLabel, formatDate, formatMoney } from "./purchasingMeta";
import { useAuth, type Role } from "@/lib/AuthContext";
import { resolveUserDepartment } from "@/lib/userDepartment";

function RequesterAutocomplete({
  value,
  onChange,
  onSelectUser,
  users,
  roles = [],
}: {
  value: string;
  onChange: (val: string) => void;
  onSelectUser?: (user: any) => void;
  users: Array<{ id: string; full_name?: string; email?: string; department?: string; [key: string]: any }>;
  roles?: Role[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredUsers = useMemo(() => {
    const q = (value || "").toLowerCase().trim();
    if (!q) return users.slice(0, 10);
    return users
      .filter((u) => {
        const name = (u.full_name || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        const dept = resolveUserDepartment(u, roles).toLowerCase();
        return name.includes(q) || email.includes(q) || dept.includes(q);
      })
      .slice(0, 10);
  }, [value, users, roles]);

  return (
    <div ref={containerRef} className="relative space-y-2">
      <label className="text-sm font-medium">Requester</label>
      <div className="relative">
        <Input
          value={value}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          placeholder="Search requester (e.g. Rachad, Rachel)..."
          className="w-full"
        />
        {isOpen && filteredUsers.length > 0 && (
          <div className="absolute z-50 left-0 mt-1.5 w-[320px] sm:w-[360px] max-w-[calc(100vw-2rem)] max-h-64 overflow-y-auto overflow-x-hidden bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-xl py-1 text-sm divide-y divide-slate-100 dark:divide-zinc-800/60">
            {filteredUsers.map((u) => {
              const displayName = u.full_name || u.email || "Unknown User";
              const email = u.email;
              const dept = resolveUserDepartment(u, roles);

              return (
                <div
                  key={u.id}
                  className="px-3.5 py-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/80 flex flex-col gap-0.5 transition-colors text-left"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(displayName);
                    if (onSelectUser) {
                      onSelectUser(u);
                    }
                    setIsOpen(false);
                  }}
                >
                  {/* Top: Name */}
                  <div className="font-semibold text-slate-900 dark:text-zinc-100 text-sm leading-snug">
                    {displayName}
                  </div>

                  {/* Middle: Email */}
                  {email && (
                    <div className="text-xs text-slate-500 dark:text-zinc-400 truncate leading-snug">
                      {email}
                    </div>
                  )}

                  {/* Bottom: Department */}
                  {dept ? (
                    <div className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                      <span className="text-slate-400 dark:text-zinc-500 font-normal">Dept:</span>
                      <span className="text-indigo-600 dark:text-indigo-400">{dept}</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 dark:text-zinc-500 italic mt-0.5">
                      No department
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const EMPTY_FORM: RequestCreateInput = {
  title: "",
  requester: "",
  department: "",
  request_type: "SPEND",
  priority: "MEDIUM",
  description: "",
  item_url: "",
  gl_code: "",
};

export default function PurchaseRequests() {
  const navigate = useNavigate();
  const { user, roles } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlStatus = searchParams.get("status");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(urlStatus || "ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState<RequestCreateInput>(EMPTY_FORM);
  const { data: usersList = [] } = useUsersList();
  const { data: rolesList = [] } = useRolesList();

  useEffect(() => {
    setStatusFilter(urlStatus || "ALL");
  }, [urlStatus]);

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val);
    const newParams = new URLSearchParams(searchParams);
    if (val === "ALL") {
      newParams.delete("status");
    } else {
      newParams.set("status", val);
    }
    setSearchParams(newParams);
  };

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
    const defaultRequester = user?.full_name || user?.email || "";
    const matchedUser = usersList.find(
      (u) =>
        u.id === user?.id ||
        (u.email && user?.email && u.email.toLowerCase() === user.email.toLowerCase()) ||
        (u.full_name && user?.full_name && u.full_name.toLowerCase() === user.full_name.toLowerCase())
    );
    const defaultDept =
      resolveUserDepartment({ ...user, roles }, rolesList) ||
      resolveUserDepartment(matchedUser, rolesList) ||
      roles.map((r) => r.department).filter(Boolean).join(", ") ||
      "";

    setForm({
      ...EMPTY_FORM,
      requester: defaultRequester,
      department: defaultDept,
    });
    setIsDialogOpen(true);
  };

  // If dialog is open and department is not yet filled, try to auto-fill once usersList/rolesList loads
  useEffect(() => {
    if (isDialogOpen && !form.department && (usersList.length > 0 || rolesList.length > 0)) {
      const matchedUser = usersList.find(
        (u) =>
          u.id === user?.id ||
          (u.email && user?.email && u.email.toLowerCase() === user.email.toLowerCase()) ||
          (u.full_name && user?.full_name && u.full_name.toLowerCase() === user.full_name.toLowerCase()) ||
          (u.full_name && form.requester && u.full_name.toLowerCase() === form.requester.toLowerCase())
      );
      const dept =
        resolveUserDepartment({ ...user, roles }, rolesList) ||
        resolveUserDepartment(matchedUser, rolesList);
      if (dept) {
        setForm((prev) => ({ ...prev, department: dept }));
      }
    }
  }, [isDialogOpen, usersList, rolesList, user, roles, form.department, form.requester]);

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
    { label: "Open Requests", value: summary?.open_requests ?? 0, icon: ShoppingCart, tint: "text-blue-600", statusKey: "ALL" },
    { label: "Waiting for Review", value: summary?.status_counts?.UNDER_REVIEW ?? 0, icon: Clock, tint: "text-orange-600", statusKey: "UNDER_REVIEW" },
    {
      label: "Unpaid Invoices",
      value: summary?.unpaid_invoices ?? 0,
      sub: summary ? formatMoney(summary.unpaid_amount) : undefined,
      icon: FileWarning,
      tint: "text-fuchsia-600",
      statusKey: "WAITING_PAYMENT",
    },
    { label: "Completed", value: summary?.completed ?? 0, icon: CheckCircle2, tint: "text-green-600", statusKey: "COMPLETED" },
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
          const isSelected = statusFilter === c.statusKey;
          return (
            <Card
              key={c.label}
              onClick={() => handleStatusFilterChange(c.statusKey)}
              className={`border transition-all cursor-pointer ${
                isSelected
                  ? "border-blue-500/80 ring-2 ring-blue-500/20 bg-blue-50/20 dark:bg-blue-950/20 shadow-md"
                  : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-md"
              }`}
            >
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg bg-slate-100 dark:bg-zinc-800 p-2 shrink-0 ${c.tint}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-2xl font-bold text-slate-900 dark:text-zinc-100 leading-tight">{c.value}</div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium truncate">{c.label}</div>
                    {c.sub && <div className="text-xs font-semibold text-slate-700 dark:text-zinc-200 mt-0.5">{c.sub}</div>}
                  </div>
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
            <SelectItem value="QUOTE">Quote Request</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
          <SelectTrigger className="w-full sm:w-52"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {STATUS_FILTER_OPTIONS.map((s) => (
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
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Purchase Request</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Dell laptop for new hire" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <RequesterAutocomplete
                value={form.requester}
                onChange={(val) => setForm((prev) => ({ ...prev, requester: val }))}
                onSelectUser={(selectedUser) => {
                  const dept = resolveUserDepartment(selectedUser, rolesList);
                  if (dept) {
                    setForm((prev) => ({ ...prev, department: dept }));
                  }
                }}
                users={usersList}
                roles={rolesList}
              />
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
                      <SelectItem value="QUOTE">Quote Request (Estimate / RFQ)</SelectItem>
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
              <label className="text-sm font-medium">Product / Website Link (e.g. Amazon URL)</label>
              <Input
                value={form.item_url ?? ""}
                onChange={(e) => setForm({ ...form, item_url: e.target.value })}
                placeholder="https://www.amazon.com/dp/..."
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity</label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={form.quantity ?? 1}
                  onChange={(e) => {
                    const q = Number(e.target.value);
                    setForm({ ...form, quantity: q, amount: Math.round(q * (form.unit_price || 0) * 100) / 100 });
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Unit Price</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.unit_price ?? 0}
                  onChange={(e) => {
                    const p = Number(e.target.value);
                    setForm({ ...form, unit_price: p, amount: Math.round((form.quantity || 1) * p * 100) / 100 });
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Est. Amount</label>
                <Input
                  type="number"
                  value={form.amount ?? 0}
                  disabled
                  className="bg-slate-50 dark:bg-zinc-800 text-slate-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">GL Code / Account</label>
              <GLCodeAutocomplete
                value={form.gl_code}
                onChange={(val) => setForm((prev) => ({ ...prev, gl_code: val }))}
              />
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
