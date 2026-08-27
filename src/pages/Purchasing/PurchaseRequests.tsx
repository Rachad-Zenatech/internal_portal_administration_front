import { FloatingVerticalFilter } from "@/components/ui/FloatingVerticalFilter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMemo, useState, useEffect, useRef } from "react";
import HelpIcon from "@/components/ui/HelpIcon";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Clock,
  Plus,
  Search,
  ShoppingCart,
  FileWarning,
  CheckCircle2,
  FileText,
  Sparkles,
  Trash2,
  FileSpreadsheet,
  Maximize2,
  AlertCircle,
  Loader2,
  Building2,
  Truck,
  AlertTriangle,
} from "lucide-react";

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

import {
  usePurchaseRequests,
  usePurchasingSummary,
  useCreateRequest,
  useUsersList,
  useRolesList,
  useExtractQuote,
} from "@/hooks/usePurchasing";
import {
  RequestStatus,
  type Priority,
  type RequestCreateInput,
  type RequestType,
  type ItemMode,
  type PurchaseRequestItem,
  type QuoteExtractionResponse,
} from "@/types/purchasing";
import { parseRequestStatus } from "@/lib/requestStatus";
import {
  PRIORITY_BADGE,
  STATUS_FILTER_OPTIONS,
  getStatusBadge,
  getStatusLabel,
  formatDate,
  formatMoney,
  formatRequestType,
} from "./purchasingMeta";
import { useAuth, type Role } from "@/lib/AuthContext";
import { resolveUserDepartment } from "@/lib/userDepartment";
import { exportQuickBooksXlsx } from "@/services/purchasingService";

function RequesterAutocomplete({
  value,
  onChange,
  onSelectUser,
  users,
  roles = [],
  label = "Requester",
  required = false,
}: {
  value: string;
  onChange: (val: string) => void;
  onSelectUser?: (user: any) => void;
  users: Array<{ id: string; full_name?: string; email?: string; department?: string;[key: string]: any }>;
  roles?: Role[];
  label?: string;
  required?: boolean;
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
    const activeUsers = users.filter((u) => u.is_active !== false);
    const q = (value || "").toLowerCase().trim();
    if (!q) return activeUsers.slice(0, 10);
    return activeUsers
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
      {label && (
        <label className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
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
                  <div className="font-semibold text-slate-900 dark:text-zinc-100 text-sm leading-snug">
                    {displayName}
                  </div>
                  {email && (
                    <div className="text-xs text-slate-500 dark:text-zinc-400 truncate leading-snug">
                      {email}
                    </div>
                  )}
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
  item_mode: "SINGLE",
  description: "",
  item_url: "",
  quantity: 1,
  unit_price: 0,
  amount: 0,
  gl_code: "",
};

export function PurchaseRequests() {
  const kpiRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [itemMode, setItemMode] = useState<ItemMode>("SINGLE");
  const [form, setForm] = useState<RequestCreateInput>(EMPTY_FORM);

  // Multi-parts Quote OCR state
  const [_quoteFile, setQuoteFile] = useState<File | null>(null);
  const [quoteExtraction, setQuoteExtraction] = useState<QuoteExtractionResponse | null>(null);
  const [quoteItems, setQuoteItems] = useState<PurchaseRequestItem[]>([]);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [taxFee, setTaxFee] = useState<number>(0);
  const [isFullScreenTable, setIsFullScreenTable] = useState(false);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);



  const { user, roles = [], hasPermission } = useAuth();
  const canCreate = Boolean(user?.is_super_admin || hasPermission("PURCHASING_CREATE"));
  const { data: usersList = [] } = useUsersList();
  const { data: rolesList = [] } = useRolesList();

  const statusFilter = searchParams.get("status") || "OPEN";
  const typeFilter = searchParams.get("request_type") || "ALL";

  const handleStatusFilterChange = (val: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (val === "OPEN") {
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

  const isTaskOwnedByUser = (task: any, currentUser: any) => {
    if (!currentUser) return false;
    const userFull = (currentUser.full_name || "").trim().toLowerCase();
    const userEmail = (currentUser.email || "").trim().toLowerCase();
    const userName = (currentUser.username || "").trim().toLowerCase();
    const userId = String(currentUser.id || "").trim();

    const reqStr = String(task.requester || task.requester_name || "").trim().toLowerCase();
    const createdByStr = String(task.created_by || task.created_by_name || task.created_by_user_id || task.user_id || "").trim().toLowerCase();
    const reqIdStr = String(task.requester_id || "").trim();

    return Boolean(
      (userFull && reqStr === userFull) ||
      (userEmail && reqStr === userEmail) ||
      (userName && reqStr === userName) ||
      (userId && (userId === reqIdStr || userId === createdByStr || userId === reqStr)) ||
      (userFull && createdByStr === userFull) ||
      (userEmail && createdByStr === userEmail)
    );
  };

  const visibleRequests = useMemo(() => {
    return requests.filter((r) => {
      if (r.request_type === "RECURRING") {
        return false;
      }
      const isDraft = parseRequestStatus(r.status) === RequestStatus.Initial;
      if (isDraft) {
        return isTaskOwnedByUser(r, user);
      }
      return true;
    });
  }, [requests, user]);
  const createMutation = useCreateRequest();
  const extractQuoteMutation = useExtractQuote();

  const openCreate = () => {
    if (!canCreate) {
      toast.error("You do not have permission to create purchase requests");
      return;
    }
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
    setItemMode("SINGLE");
    setQuoteFile(null);
    setQuoteExtraction(null);
    setQuoteItems([]);
    setShippingFee(0);
    setTaxFee(0);
    setShowUnsavedConfirm(false);
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

  // Handle Quote PDF upload & extraction
  const handleQuoteFileUpload = async (file: File) => {
    setQuoteFile(file);
    try {
      toast.info("Extracting layout, OCR, and quote line items...");
      const result = await extractQuoteMutation.mutateAsync(file);
      setQuoteExtraction(result);

      // Convert extracted items to PurchaseRequestItem shape
      const items: PurchaseRequestItem[] = (result.extraction.items || []).map((itm, idx) => ({
        item_order: idx,
        sku: itm.sku || "",
        description: itm.description || `Item #${idx + 1}`,
        quantity: Number(itm.quantity) || 1,
        unit_price: Number(itm.unit_price) || 0,
        discount: Number(itm.discount) || 0,
        tax: Number(itm.tax) || 0,
        total: Number(itm.total) || (Number(itm.quantity || 1) * Number(itm.unit_price || 0)),
      }));
      setQuoteItems(items);

      // Auto-prefill form fields if empty
      const vendorName = result.extraction.vendor?.name || "";
      const quoteNum = result.extraction.quote_number || "";
      const itemsCount = items.length;
      const shipping = Number(result.extraction.totals?.shipping) || 0;
      const tax = Number(result.extraction.totals?.tax) || 0;
      const discount = Number(result.extraction.totals?.discount) || 0;
      setShippingFee(shipping);
      setTaxFee(tax);
      const itemsSum = items.reduce((sum, itm) => sum + itm.total, 0);
      const totalAmount = result.extraction.totals?.total || (itemsSum + shipping + tax - discount);

      setForm((prev) => ({
        ...prev,
        title: prev.title || `${vendorName ? vendorName + " - " : ""}Quote ${quoteNum || "Order"} (${itemsCount} parts)`.trim(),
        request_type: "QUOTE",
        amount: totalAmount,
        description: prev.description || result.extraction.notes || `Extracted quote from ${file.name}`,
      }));

      toast.success("Quote extracted successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to extract quote from PDF");
    }
  };

  // Line item manipulation
  const handleItemChange = (index: number, field: keyof PurchaseRequestItem, val: any) => {
    setQuoteItems((prev) => {
      const next = [...prev];
      const target = { ...next[index], [field]: val };
      if (field === "quantity" || field === "unit_price" || field === "discount" || field === "tax") {
        const q = Number(target.quantity) || 0;
        const p = Number(target.unit_price) || 0;
        const d = Number(target.discount) || 0;
        const t = Number(target.tax) || 0;
        target.total = Math.max(0, q * p - d + t);
      }
      next[index] = target;
      return next;
    });
  };

  const handleAddItem = () => {
    setQuoteItems((prev) => [
      ...prev,
      {
        item_order: prev.length,
        sku: "",
        description: "",
        quantity: 1,
        unit_price: 0,
        discount: 0,
        tax: 0,
        total: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setQuoteItems((prev) => prev.filter((_, i) => i !== index));
  };

  const itemsSubtotal = useMemo(() => {
    return quoteItems.reduce((acc, itm) => acc + (Number(itm.total) || 0), 0);
  }, [quoteItems]);

  const totalCalculatedAmount = useMemo(() => {
    if (itemMode === "MULTIPLE") {
      const discount = Number(quoteExtraction?.extraction?.totals?.discount) || 0;
      return Math.max(0, Math.round((itemsSubtotal + Number(shippingFee || 0) + Number(taxFee || 0) - discount) * 100) / 100);
    }
    if (form.request_type === "RECURRING") {
      return Number(form.unit_price ?? form.amount ?? 0);
    }
    return form.amount || (Number(form.quantity || 1) * Number(form.unit_price || 0));
  }, [itemMode, itemsSubtotal, shippingFee, taxFee, quoteExtraction, form.amount, form.quantity, form.unit_price, form.request_type]);

  const isDirty = useMemo(() => {
    if (!isDialogOpen) return false;
    return Boolean(
      form.title ||
      form.description ||
      form.item_url ||
      form.unit_price ||
      (form.quantity && form.quantity !== 1) ||
      form.gl_code ||
      quoteItems.length > 0 ||
      quoteExtraction !== null ||
      shippingFee > 0 ||
      taxFee > 0
    );
  }, [isDialogOpen, form, quoteItems, quoteExtraction, shippingFee, taxFee]);

  const handleRequestClose = () => {
    if (isDirty) {
      setShowUnsavedConfirm(true);
    } else {
      setIsDialogOpen(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.requester || !form.department) {
      toast.error("Title, requester and department are required.");
      return;
    }

    if (itemMode === "MULTIPLE" && quoteItems.length === 0) {
      toast.error("Please upload a quote PDF or add at least one line item for Multiple Parts.");
      return;
    }

    try {
      const payload: RequestCreateInput = {
        ...form,
        item_mode: itemMode,
        amount: totalCalculatedAmount,
        items: itemMode === "MULTIPLE" ? quoteItems : undefined,
        quote_file_id: quoteExtraction?.file_id || undefined,
        quote_data: quoteExtraction?.extraction || undefined,
      };

      const detail = await createMutation.mutateAsync(payload);
      toast.success(`Request ${detail.request.id} created`);
      setIsDialogOpen(false);
      navigate(`/purchasing/requests/${detail.request.id}`);
    } catch (err) {
      toast.error((err as Error).message || "Failed to create request");
    }
  };

  const cards = [
    { label: "Open Requests", value: summary?.open_requests ?? 0, icon: ShoppingCart, tint: "text-blue-600", statusKey: "OPEN" },
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
    <div className="flex-1 min-h-0 flex flex-col gap-3.5 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Purchase Requests</h2>
            <HelpIcon text="Manage and create purchase requests. Displays current review status and routing info." />
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Capture, review, approve and track purchasing &amp; accounts payable requests.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={async () => {
              try {
                toast.loading("Generating QuickBooks export...", { id: "qb-export" });
                await exportQuickBooksXlsx(undefined, "COMPLETED");
                toast.success("QuickBooks export downloaded", { id: "qb-export" });
              } catch (err: any) {
                toast.error(err.message || "Failed to export QuickBooks file", { id: "qb-export" });
              }
            }}
            className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Export to QuickBooks (.xlsx)</span>
          </Button>
          {canCreate && (
            <Button onClick={openCreate} className="w-full sm:w-auto gap-2 font-medium shadow-sm">
              <Plus className="h-4 w-4" />
              <span>New Request</span>
            </Button>
          )}
        </div>
      </div>

      {/* Slim Vertical Floating Quick Filter (Follows card colors & appears on scroll) */}
      <FloatingVerticalFilter
        items={[
          {
            key: "OPEN",
            label: "Open Requests",
            count: summary?.open_requests ?? 0,
            icon: ShoppingCart,
            color: "blue",
          },
          {
            key: "UNDER_REVIEW",
            label: "Waiting Review",
            count: summary?.status_counts?.UNDER_REVIEW ?? 0,
            icon: Clock,
            color: "orange",
          },
          {
            key: "WAITING_PAYMENT",
            label: "Unpaid Invoices",
            count: summary?.unpaid_invoices ?? 0,
            icon: FileWarning,
            color: "fuchsia",
          },
          {
            key: "COMPLETED",
            label: "Completed",
            count: summary?.completed ?? 0,
            icon: CheckCircle2,
            color: "green",
          },
        ]}
        activeKey={statusFilter}
        onSelect={handleStatusFilterChange}
        defaultKey="OPEN"
        onReset={() => handleStatusFilterChange("OPEN")}
        scrollThreshold={130}
        title="Requests"
        kpiRef={kpiRef}
      />

      {/* Compact KPI Cards Section */}
      <div ref={kpiRef} className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 animate-in fade-in duration-300 shrink-0">
        {cards.map((c) => {
          const Icon = c.icon;
          const isSelected = statusFilter === c.statusKey;
          return (
            <Card
              key={c.label}
              onClick={() => handleStatusFilterChange(c.statusKey)}
              className={`border transition-all cursor-pointer rounded-lg ${isSelected
                  ? "border-blue-500/80 ring-2 ring-blue-500/20 bg-blue-50/20 dark:bg-blue-950/20 shadow-xs"
                  : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-xs"
                }`}
            >
              <CardContent className="p-2 sm:p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 block">{c.label}</span>
                  <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100 leading-tight mt-0.5">{c.value}</div>
                  {c.sub && <div className="text-[10px] text-slate-500 mt-0.5">{c.sub}</div>}
                </div>
                <div className="p-1.5 rounded-md bg-slate-50 dark:bg-zinc-800/60 shrink-0">
                  <Icon className={`h-4 w-4 ${c.tint}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between shrink-0">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search requests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-0.5">
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="OPEN">Open (Non-Completed)</SelectItem>
              {STATUS_FILTER_OPTIONS.map((st) => (
                <SelectItem key={st} value={st}>
                  {getStatusLabel(st)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={typeFilter}
            onValueChange={(val) => {
              const newParams = new URLSearchParams(searchParams);
              if (val === "ALL") newParams.delete("request_type");
              else newParams.set("request_type", val);
              setSearchParams(newParams);
            }}
          >
            <SelectTrigger className="w-[150px] h-8 text-xs">
              <SelectValue placeholder="Request Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="SPEND">Spend Request</SelectItem>
              <SelectItem value="QUOTE">Quote Request</SelectItem>
              <SelectItem value="ADMIN">Admin Triage</SelectItem>
              <SelectItem value="ACCOUNTS_PAYABLE">Accounts Payable</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="flex-1 min-h-[280px] flex flex-col w-full border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xs bg-white dark:bg-zinc-900 overflow-hidden">
        <Table className="w-full min-w-full" containerClassName="flex-1 w-full min-w-full overflow-auto">
          <TableHeader >
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Requester</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                  Loading requests...
                </TableCell>
              </TableRow>
            ) : visibleRequests.length > 0 ? (
              visibleRequests.map((r) => (
                <TableRow
                  key={r.id}
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/50"
                  onClick={() => navigate(`/purchasing/requests/${r.id}`)}
                >
                  <TableCell className="font-mono text-xs font-semibold text-slate-600 dark:text-zinc-400">
                    #{r.id}
                  </TableCell>
                  <TableCell className="font-medium text-slate-900 dark:text-zinc-100 min-w-[220px]">
                    {r.title}
                  </TableCell>
                  <TableCell>{r.requester}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs font-normal">
                      {formatRequestType(r.request_type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {r.item_mode === "MULTIPLE" || (r.items && r.items.length > 0) ? (
                      <Badge variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50/50 text-[11px]">
                        Multi Parts ({r.items?.length || "PDF"})
                      </Badge>
                    ) : (
                      <span className="text-xs text-slate-400">Single</span>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold text-slate-900 dark:text-zinc-100">
                    {formatMoney(r.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={PRIORITY_BADGE[r.priority]}>
                      {r.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusBadge(r.status)}>
                      {getStatusLabel(r.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">{formatDate(r.request_date)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                  No requests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* New Purchase Request Modal */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            handleRequestClose();
          } else {
            setIsDialogOpen(true);
          }
        }}
      >
        <DialogContent
          aria-describedby={undefined}
          onPointerDownOutside={(e) => {
            if (isDirty) {
              e.preventDefault();
              setShowUnsavedConfirm(true);
            }
          }}
          onEscapeKeyDown={(e) => {
            if (isDirty) {
              e.preventDefault();
              setShowUnsavedConfirm(true);
            }
          }}
          className="sm:max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>New Purchase Request</span>
              {itemMode === "MULTIPLE" && (
                <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border-indigo-200">
                  <Sparkles className="h-3 w-3 mr-1" /> Multi-Part Quote OCR
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* Mode Selector */}
            <div className="p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-lg border border-slate-200 dark:border-zinc-700">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-1.5">
                  Item Configuration
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={itemMode === "SINGLE" ? "default" : "outline"}
                    className="w-full text-xs font-medium justify-center h-9"
                    onClick={() => setItemMode("SINGLE")}
                  >
                    Single Item (Direct entry)
                  </Button>
                  <Button
                    type="button"
                    variant={itemMode === "MULTIPLE" ? "default" : "outline"}
                    className="w-full text-xs font-medium justify-center h-9"
                    onClick={() => setItemMode("MULTIPLE")}
                  >
                    <FileText className="h-3.5 w-3.5 mr-1.5" /> Multiple Parts (Quote PDF Upload)
                  </Button>
                </div>
              </div>

            {/* Multiple Parts PDF Dropzone & AI Extraction + Always-Visible Line Items Table */}
            {itemMode === "MULTIPLE" && (
              <div className="space-y-4 p-4 rounded-xl bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent border border-indigo-200/80 dark:border-indigo-900/60 shadow-xs">
                {/* PDF Upload (Optional) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
                      <span>Upload Quote / Quotation PDF ([Optional] auto-extracts line items)</span>
                    </label>
                    {quoteExtraction && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setQuoteExtraction(null);
                          setQuoteFile(null);
                        }}
                        className="h-6 text-[11px] text-slate-500 hover:text-red-600 px-2"
                      >
                        Clear Upload
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleQuoteFileUpload(f);
                      }}
                      className="bg-white dark:bg-zinc-900 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                    />
                    {extractQuoteMutation.isPending && (
                      <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium whitespace-nowrap">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing PDF layout &amp; line items...
                      </div>
                    )}
                  </div>
                </div>

                {/* Extraction Summary Preview (if PDF was uploaded & analyzed) */}
                {quoteExtraction && (
                  <div className="space-y-3 pt-3 border-t border-indigo-100 dark:border-indigo-900/50">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs text-slate-600 dark:text-zinc-300 flex items-center gap-2">
                        {quoteExtraction.extraction.vendor?.name && (
                          <span className="font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                            {quoteExtraction.extraction.vendor.name}
                          </span>
                        )}
                        {quoteExtraction.extraction.quote_number && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-[11px] font-mono">
                            Ref: {quoteExtraction.extraction.quote_number}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 font-mono text-xs">
                          Currency: {quoteExtraction.extraction.currency || "USD"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            quoteExtraction.confidence_score >= 0.85
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                              : "bg-amber-50 text-amber-700 border-amber-300"
                          }
                        >
                          {Math.round(quoteExtraction.confidence_score * 100)}% Confidence
                        </Badge>
                        {quoteExtraction.ocr_used && (
                          <Badge variant="secondary" className="text-[10px]">
                            OCR Scanned
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Math & Completeness Warnings */}
                    {quoteExtraction.validation.warnings.length > 0 && (
                      <div className="p-2.5 rounded bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 text-xs text-amber-800 dark:text-amber-200 space-y-1">
                        <div className="flex items-center gap-1.5 font-medium">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          Validation Review
                        </div>
                        <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                          {quoteExtraction.validation.warnings.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Interactive Line Items Breakdown Table - ALWAYS VISIBLE in Multiple Parts mode */}
                <div className="space-y-2 pt-3 border-t border-indigo-100 dark:border-indigo-900/50">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Line Items &amp; Parts Breakdown ({quoteItems.length})
                    </label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsFullScreenTable(true)}
                        className="h-7 text-xs flex items-center gap-1.5 bg-white dark:bg-zinc-900 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                      >
                        <Maximize2 className="h-3.5 w-3.5" />
                        <span>Full Screen Table</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddItem}
                        className="h-7 text-xs flex items-center gap-1 bg-white dark:bg-zinc-900"
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Part
                      </Button>
                    </div>
                  </div>

                  <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200 dark:border-zinc-700 shadow-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 uppercase text-[11px] font-semibold ">
                        <tr>
                          <th className="p-2 w-10 text-center text-slate-400">#</th>
                          <th className="p-2 w-28">SKU</th>
                          <th className="p-2">Description</th>
                          <th className="p-2 w-20 text-right">Qty</th>
                          <th className="p-2 w-28 text-right">Price ({quoteExtraction?.extraction?.currency || form.currency || "USD"})</th>
                          <th className="p-2 w-28 text-right">Total ({quoteExtraction?.extraction?.currency || form.currency || "USD"})</th>
                          <th className="p-2 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                        {quoteItems.map((itm, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                            <td className="p-2 text-center text-xs font-mono text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="p-2 w-28">
                              <Input
                                value={itm.sku || ""}
                                onChange={(e) => handleItemChange(idx, "sku", e.target.value)}
                                placeholder="SKU / Part #"
                                className="h-8 text-sm font-mono"
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                value={itm.description}
                                onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                                placeholder="Item description..."
                                className="h-8 text-sm w-full bg-white dark:bg-zinc-900 font-medium"
                              />
                            </td>
                            <td className="p-2 w-20">
                              <Input
                                type="number"
                                min="1"
                                step="1"
                                value={itm.quantity}
                                onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                                className="h-8 text-sm text-right font-medium"
                              />
                            </td>
                            <td className="p-2 w-28">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={itm.unit_price}
                                onChange={(e) => handleItemChange(idx, "unit_price", Number(e.target.value))}
                                className="h-8 text-sm text-right font-mono"
                              />
                            </td>
                            <td className="p-2 w-28 text-right font-semibold font-mono text-sm text-slate-900 dark:text-zinc-100">
                              {formatMoney(itm.total)}
                            </td>
                            <td className="p-2 text-center w-10">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                                onClick={() => handleRemoveItem(idx)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                        {quoteItems.length === 0 && (
                          <tr>
                            <td colSpan={7} className="text-center py-8 text-slate-400 text-xs">
                              No line items added yet. Click &quot;+ Add Part&quot; above to create parts manually, or upload a quote PDF above.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Bottom breakdown and calculations */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                    <div className="text-[11px]">
                      {quoteExtraction && (
                        Math.abs(totalCalculatedAmount - Number(quoteExtraction.extraction.totals?.total || totalCalculatedAmount)) < 0.05 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Calculated items sum + shipping matches quote total
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Stated total ({formatMoney(quoteExtraction.extraction.totals?.total || 0)}) differs from calculated ({formatMoney(totalCalculatedAmount)})
                          </span>
                        )
                      )}
                    </div>

                    <div className="text-right text-xs space-y-2 min-w-[260px]">
                      <div className="text-slate-500 flex items-center justify-between gap-4">
                        <span>Items Subtotal:</span>
                        <span className="font-medium font-mono text-slate-800 dark:text-zinc-200">
                          {formatMoney(itemsSubtotal)} {quoteExtraction?.extraction?.currency || form.currency || "USD"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-700 dark:text-zinc-300 font-medium flex items-center gap-1.5">
                          <Truck className="h-3.5 w-3.5 text-indigo-500" />
                          <span>Shipping Fee:</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 font-mono text-xs">$</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={shippingFee}
                            onChange={(e) => setShippingFee(Math.max(0, Number(e.target.value) || 0))}
                            placeholder="0.00"
                            className="h-7 w-28 text-right text-xs font-mono bg-white dark:bg-zinc-900 font-semibold"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-600 dark:text-zinc-400 font-medium">
                          <span>Tax Fee:</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 font-mono text-xs">$</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={taxFee}
                            onChange={(e) => setTaxFee(Math.max(0, Number(e.target.value) || 0))}
                            placeholder="0.00"
                            className="h-7 w-28 text-right text-xs font-mono bg-white dark:bg-zinc-900"
                          />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 dark:border-zinc-700 flex items-center justify-between gap-4">
                        <span className="text-slate-900 dark:text-zinc-100 font-semibold">Grand Total:</span>
                        <span className="font-bold text-base text-slate-900 dark:text-zinc-100 font-mono">
                          {formatMoney(totalCalculatedAmount)} {quoteExtraction?.extraction?.currency || form.currency || "USD"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Standard Request Form Fields */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Dell laptop for new hire or Quote Q-10294"
              />
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
                <Input
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  placeholder="e.g. Production"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select
                  value={form.request_type}
                  onValueChange={(v: RequestType) => setForm({ ...form, request_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SPEND">Spend Request</SelectItem>
                    <SelectItem value="QUOTE">Quote Request (Estimate / RFQ)</SelectItem>
                    <SelectItem value="ADMIN">Admin Triage</SelectItem>
                    <SelectItem value="ACCOUNTS_PAYABLE">Accounts Payable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm({ ...form, priority: v as Priority })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Single Item specific URL & Quantity */}
            {itemMode === "SINGLE" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Product / Website Link (e.g. Amazon URL)</label>
                  <Input
                    value={form.item_url ?? ""}
                    onChange={(e) => setForm({ ...form, item_url: e.target.value })}
                    placeholder="https://www.amazon.com/dp/..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quantity</label>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={form.quantity ?? 1}
                      onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                    />
                  </div>

                </div>
              </>
            )}



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
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || extractQuoteMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Request"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Full Screen Line Items Table Dialog */}
      <Dialog open={isFullScreenTable} onOpenChange={setIsFullScreenTable}>
        <DialogContent
          aria-describedby={undefined}
          className="!w-[96vw] !max-w-[96vw] sm:!max-w-[96vw] max-h-[94vh] overflow-y-auto p-6"
          style={{ width: "96vw", maxWidth: "96vw" }}
        >
          <DialogHeader className="pb-3 border-b flex flex-row items-center justify-between pr-6">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-indigo-950 dark:text-indigo-200">
              <FileText className="h-5 w-5 text-indigo-600" />
              <span>Full Screen Line Items Table ({quoteItems.length} Parts)</span>
            </DialogTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              className="h-8 text-xs flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Part
            </Button>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="rounded-lg border border-slate-200 dark:border-zinc-700 overflow-hidden shadow-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 uppercase text-xs font-semibold ">
                  <tr>
                    <th className="p-3 w-12 text-center text-slate-400">#</th>
                    <th className="p-3 w-36 font-semibold">SKU</th>
                    <th className="p-3 font-semibold">Description</th>
                    <th className="p-3 w-24 text-right font-semibold">Qty</th>
                    <th className="p-3 w-36 text-right font-semibold">Price ({quoteExtraction?.extraction?.currency || "USD"})</th>
                    <th className="p-3 w-36 text-right font-semibold">Total ({quoteExtraction?.extraction?.currency || "USD"})</th>
                    <th className="p-3 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                  {quoteItems.map((itm, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="p-3 text-center text-xs font-mono text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="p-3 w-36">
                        <Input
                          value={itm.sku || ""}
                          onChange={(e) => handleItemChange(idx, "sku", e.target.value)}
                          placeholder="SKU / Part #"
                          className="h-9 text-sm font-mono"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          value={itm.description}
                          onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                          placeholder="Part / Item full description..."
                          className="h-9 text-sm w-full bg-white dark:bg-zinc-900 font-medium"
                        />
                      </td>
                      <td className="p-3 w-24">
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          value={itm.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                          className="h-9 text-sm text-right font-medium"
                        />
                      </td>
                      <td className="p-3 w-36">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={itm.unit_price}
                          onChange={(e) => handleItemChange(idx, "unit_price", Number(e.target.value))}
                          className="h-9 text-sm text-right font-mono"
                        />
                      </td>
                      <td className="p-3 w-36 text-right font-bold font-mono text-sm text-slate-900 dark:text-zinc-100">
                        {formatMoney(itm.total)}
                      </td>
                      <td className="p-3 text-center w-12">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                          onClick={() => handleRemoveItem(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {quoteItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                        No line items added yet. Click &quot;Add Part&quot; above to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="text-xs text-slate-500">
                {quoteItems.length} parts in table
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 mr-2">Grand Total:</span>
                <span className="font-bold text-lg text-slate-900 dark:text-zinc-100 font-mono">
                  {formatMoney(totalCalculatedAmount)}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t">
            <Button type="button" onClick={() => setIsFullScreenTable(false)}>
              Done Editing Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Confirmation Dialog */}
      <AlertDialog open={showUnsavedConfirm} onOpenChange={setShowUnsavedConfirm}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              Unsaved Changes
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-600 dark:text-zinc-300 pt-1">
              You have unsaved changes in this request. If you leave now, your input will not be saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex items-center justify-end gap-2 pt-3">
            <AlertDialogCancel
              onClick={() => setShowUnsavedConfirm(false)}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300"
            >
              Stay
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setShowUnsavedConfirm(false);
                setIsDialogOpen(false);
              }}
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default PurchaseRequests;

