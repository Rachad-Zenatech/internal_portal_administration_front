import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import HelpIcon from "@/components/ui/HelpIcon";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Landmark,
  Building2,
  Copy,
  Check,
  Search,
  RefreshCw,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  X,
  AlertTriangle,
  Layers,
  Calendar,
} from "lucide-react";
import { apiClient as api } from "@/services/apiClient";
import { getStatusBadge, getStatusLabel, formatDate, formatMoney } from "./purchasingMeta";
import { RequestStatus } from "@/types/purchasing";
import { parseRequestStatus } from "@/lib/requestStatus";

export default function Invoices() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [wireFilter, setWireFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [quickFilter, setQuickFilter] = useState<"ALL" | "DUE_TODAY" | "PENDING" | "OVERDUE">("ALL");
  const [selectedWireTask, setSelectedWireTask] = useState<any | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const isWireTransfer = (task: any) => {
    const cat = String(task.category || task.request_type || "").toUpperCase();
    return (
      cat === "ACCOUNTS_PAYABLE" ||
      cat === "WIRE_TRANSFER" ||
      cat === "WIRE" ||
      cat === "AP" ||
      !!task.wire_transfer
    );
  };

  const isScheduledPayment = (task: any) => {
    const cat = String(task.category || task.request_type || "").toUpperCase();
    return (
      cat === "SCHEDULED_PAYMENT" ||
      cat === "RECURRING" ||
      !!task.recurring_schedule
    );
  };

  const isDueToday = (dueDateStr: string | null | undefined, status: string) => {
    if (!dueDateStr) return false;
    const parsed = parseRequestStatus(status);
    if (parsed === RequestStatus.Completed || parsed === RequestStatus.Rejected) {
      return false;
    }
    const cleanDate = String(dueDateStr).split("T")[0];
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    const todayStr = `${y}-${m}-${d}`;
    return cleanDate === todayStr;
  };

  const isOverdue = (dueDateStr: string | null | undefined, status: string) => {
    if (!dueDateStr) return false;
    const parsed = parseRequestStatus(status);
    if (parsed === RequestStatus.Completed || parsed === RequestStatus.Rejected) {
      return false;
    }
    const cleanDate = String(dueDateStr).split("T")[0];
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    const todayStr = `${y}-${m}-${d}`;
    return cleanDate < todayStr;
  };

  const isPendingPayment = (status: string) => {
    const parsed = parseRequestStatus(status);
    return (
      parsed === RequestStatus.WaitingPayment ||
      parsed === RequestStatus.InvoiceReceived
    );
  };

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      // Query tasks with wire transfer records included alongside payment stages
      const res = await api.get<any>("/tasks?limit=250&include_wire_requests=true");
      setTasks(res.items || []);
    } catch (e: any) {
      toast.error("Failed to load Wire Transfer & Invoice tasks");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCopy = (text: string, key: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const handleCopyAllBankingDetails = (task: any) => {
    const wt = task?.wire_transfer;
    if (!wt) return;

    const lines = [
      `--- WIRE TRANSFER DETAILS (REQ #${task.id}) ---`,
      `Vendor: ${wt.vendor || task.vendor || task.product_name}`,
      `Amount: ${formatMoney(Number(wt.amount || task.amount || 0))} ${wt.currency || task.currency || "USD"}`,
      wt.payment_type ? `Payment Type: ${wt.payment_type}` : null,
      wt.pay_from ? `Pay From: ${wt.pay_from}` : null,
      wt.invoice_number ? `Invoice #: ${wt.invoice_number}` : null,
      wt.payment_date ? `Payment Date: ${formatDate(wt.payment_date)}` : null,
      wt.due_date ? `Due Date: ${formatDate(wt.due_date)}` : null,
      "",
      `Bank Name: ${wt.bank_name || "—"}`,
      wt.bank_country ? `Bank Country: ${wt.bank_country}` : null,
      wt.bank_address ? `Bank Address: ${wt.bank_address}` : null,
      `Account Number: ${wt.bank_account_number || "—"}`,
      wt.routing_wire ? `Wire Routing / ABA: ${wt.routing_wire}` : null,
      wt.routing_ach ? `ACH Routing: ${wt.routing_ach}` : null,
      wt.swift_code ? `SWIFT / BIC: ${wt.swift_code}` : null,
      wt.iban ? `IBAN: ${wt.iban}` : null,
      wt.sort_code ? `Sort Code: ${wt.sort_code}` : null,
      wt.transit_code_ca ? `Transit (CA): ${wt.transit_code_ca}` : null,
      wt.institution_code ? `Institution Code: ${wt.institution_code}` : null,
      wt.bsb_australia ? `BSB (AU): ${wt.bsb_australia}` : null,
      wt.clearing_code ? `Clearing Code: ${wt.clearing_code}` : null,
      wt.comments ? `Comments: ${wt.comments}` : null,
    ].filter(Boolean);

    navigator.clipboard.writeText(lines.join("\n"));
    toast.success("Full wire transfer details copied to clipboard");
  };

  // Quick filter counts calculated across eligible dataset
  const quickFilterCounts = useMemo(() => {
    const eligibleTasks = tasks.filter((t) => isWireTransfer(t) || isScheduledPayment(t));
    return {
      all: eligibleTasks.length,
      dueToday: eligibleTasks.filter((t) => isDueToday(t.due_date, t.status)).length,
      pending: eligibleTasks.filter((t) => isPendingPayment(t.status)).length,
      overdue: eligibleTasks.filter((t) => isOverdue(t.due_date, t.status)).length,
    };
  }, [tasks]);

  // KPI Calculations across eligible dataset (Wire Transfer & Scheduled Payment only)
  const metrics = useMemo(() => {
    const eligibleTasks = tasks.filter((t) => isWireTransfer(t) || isScheduledPayment(t));
    const totalCount = eligibleTasks.length;
    const totalVolume = eligibleTasks.reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const pendingTasks = eligibleTasks.filter((t) => isPendingPayment(t.status));
    const pendingAmount = pendingTasks.reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const wireTasks = eligibleTasks.filter((t) => !!t.wire_transfer);
    const wireCount = wireTasks.length;
    const wirePercent = totalCount > 0 ? Math.round((wireCount / totalCount) * 100) : 0;

    const overdueTasks = eligibleTasks.filter((t) => isOverdue(t.due_date, t.status));
    const overdueCount = overdueTasks.length;
    const overdueAmount = overdueTasks.reduce((sum, t) => sum + Number(t.amount || 0), 0);

    return {
      totalCount,
      totalVolume,
      pendingCount: pendingTasks.length,
      pendingAmount,
      wireCount,
      wirePercent,
      overdueCount,
      overdueAmount,
    };
  }, [tasks]);

  // Filtered tasks based on search, status, wire details, and request type
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Must strictly be a wire transfer type or scheduled payment request
      const isWire = isWireTransfer(task);
      const isSched = isScheduledPayment(task);
      if (!isWire && !isSched) {
        return false;
      }

      // Request Type filter
      if (typeFilter === "WIRE" && !isWire) return false;
      if (typeFilter === "SCHEDULED" && !isSched) return false;

      // Status filter
      if (statusFilter !== "ALL") {
        const parsed = parseRequestStatus(task.status);
        if (statusFilter === "WAITING_PAYMENT") {
          if (parsed !== RequestStatus.WaitingPayment) return false;
        } else if (statusFilter === "INVOICE_RECEIVED") {
          if (parsed !== RequestStatus.InvoiceReceived) return false;
        } else if (statusFilter === "COMPLETED") {
          if (parsed !== RequestStatus.Completed) return false;
        } else if (statusFilter === "WAITING_APPROVAL") {
          if (parsed !== RequestStatus.WaitingApproval) return false;
        } else if (statusFilter === "INITIAL") {
          if (parsed !== RequestStatus.Initial) return false;
        }
      }

      // Wire Info filter
      if (wireFilter === "WITH_WIRE" && !task.wire_transfer) return false;
      if (wireFilter === "WITHOUT_WIRE" && !!task.wire_transfer) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const wt = task.wire_transfer;
        const matchesId = String(task.id).includes(q);
        const matchesProduct = (task.product_name || "").toLowerCase().includes(q);
        const matchesVendor = (task.vendor || wt?.vendor || "").toLowerCase().includes(q);
        const matchesBank = (wt?.bank_name || "").toLowerCase().includes(q);
        const matchesAccount = (wt?.bank_account_number || "").toLowerCase().includes(q);
        const matchesCategory = (task.category || wt?.category || "").toLowerCase().includes(q);
        const matchesAssignee = (task.assignee_name || "").toLowerCase().includes(q);
        const matchesPayFrom = (wt?.pay_from || "").toLowerCase().includes(q);

        if (
          !matchesId &&
          !matchesProduct &&
          !matchesVendor &&
          !matchesBank &&
          !matchesAccount &&
          !matchesCategory &&
          !matchesAssignee &&
          !matchesPayFrom
        ) {
          return false;
        }
      }

      // Quick Urgency Filter (Due on Today / Pending Payment / Overdue payment)
      if (quickFilter === "DUE_TODAY" && !isDueToday(task.due_date, task.status)) {
        return false;
      }
      if (quickFilter === "PENDING" && !isPendingPayment(task.status)) {
        return false;
      }
      if (quickFilter === "OVERDUE" && !isOverdue(task.due_date, task.status)) {
        return false;
      }

      return true;
    });
  }, [tasks, typeFilter, statusFilter, wireFilter, quickFilter, searchQuery]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    statusFilter !== "ALL" ||
    wireFilter !== "ALL" ||
    typeFilter !== "ALL" ||
    quickFilter !== "ALL";

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setWireFilter("ALL");
    setTypeFilter("ALL");
    setQuickFilter("ALL");
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out pb-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-xs">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                  Wire Transfer &amp; Invoices
                </h1>
                <HelpIcon text="Track and manage wire payment instructions, vendor bank accounts, and invoices awaiting AP settlement across all purchasing workflows." />
              </div>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Monitoring {metrics.totalCount} payment requests &bull; Outstanding AP Balance:{" "}
            <span className="font-semibold text-slate-900 dark:text-zinc-100">{formatMoney(metrics.pendingAmount)}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTasks}
            disabled={isLoading}
            className="h-9 gap-1.5 text-xs font-medium bg-white dark:bg-zinc-900 shadow-2xs hover:bg-slate-50 dark:hover:bg-zinc-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isLoading ? "animate-spin text-indigo-600" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Volume */}
        <Card className="p-3.5 sm:p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 dark:text-zinc-400">
              Total Requests
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              {metrics.totalCount}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              ({formatMoney(metrics.totalVolume)})
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
            All active wire transfers &amp; scheduled payments
          </p>
        </Card>

        {/* Pending Payment */}
        <Card className="p-3.5 sm:p-4 rounded-xl border border-amber-200/70 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/20 backdrop-blur-sm shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-amber-700 dark:text-amber-400">
              Pending Payment
            </span>
            <div className="p-1.5 rounded-lg bg-amber-100/80 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              {formatMoney(metrics.pendingAmount)}
            </span>
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              {metrics.pendingCount} req
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
            Waiting Payment &amp; Invoice Received
          </p>
        </Card>

        {/* Wire Info Configured */}
        <Card className="p-3.5 sm:p-4 rounded-xl border border-emerald-200/70 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/20 backdrop-blur-sm shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-emerald-700 dark:text-emerald-400">
              Wire Details Ready
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-100/80 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-300">
              {metrics.wireCount}
            </span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {metrics.wirePercent}% configured
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
            Ready for banking execution
          </p>
        </Card>

        {/* Overdue */}
        <Card className={`p-3.5 sm:p-4 rounded-xl border shadow-2xs backdrop-blur-sm ${
          metrics.overdueCount > 0
            ? "border-red-200/80 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/20"
            : "border-slate-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80"
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-semibold tracking-wider uppercase ${
              metrics.overdueCount > 0 ? "text-red-700 dark:text-red-400" : "text-slate-500 dark:text-zinc-400"
            }`}>
              Overdue Due Date
            </span>
            <div className={`p-1.5 rounded-lg ${
              metrics.overdueCount > 0
                ? "bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400"
                : "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400"
            }`}>
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-xl sm:text-2xl font-bold tracking-tight ${
              metrics.overdueCount > 0 ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-zinc-100"
            }`}>
              {metrics.overdueCount}
            </span>
            {metrics.overdueCount > 0 && (
              <span className="text-xs font-medium text-red-600 dark:text-red-400">
                ({formatMoney(metrics.overdueAmount)})
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
            {metrics.overdueCount > 0 ? "Requires urgent payment action" : "All payments on schedule"}
          </p>
        </Card>
      </div>

      {/* ── Filters & Search Toolbar ── */}
      <Card className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by Request #, vendor, bank, account, product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 h-9 text-xs sm:text-sm bg-slate-50/60 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 focus-visible:bg-white dark:focus-visible:bg-zinc-900"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Request Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48 h-9 text-xs font-medium">
                <SelectValue placeholder="Request Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types (Wire & Scheduled)</SelectItem>
                <SelectItem value="WIRE">Wire Transfer</SelectItem>
                <SelectItem value="SCHEDULED">Schedule Payment</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44 h-9 text-xs font-medium">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="WAITING_PAYMENT">Waiting Payment / AP</SelectItem>
                <SelectItem value="INVOICE_RECEIVED">Invoice Received</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="WAITING_APPROVAL">Waiting Approval</SelectItem>
                <SelectItem value="INITIAL">Initial</SelectItem>
              </SelectContent>
            </Select>

            {/* Wire Details Filter */}
            <Select value={wireFilter} onValueChange={setWireFilter}>
              <SelectTrigger className="w-full sm:w-40 h-9 text-xs font-medium">
                <SelectValue placeholder="Wire Details" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Wire Statuses</SelectItem>
                <SelectItem value="WITH_WIRE">Wire Info Configured</SelectItem>
                <SelectItem value="WITHOUT_WIRE">Missing Wire Info</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2.5">
            <span className="text-xs text-slate-500 dark:text-zinc-400 whitespace-nowrap">
              Showing <span className="font-semibold text-slate-900 dark:text-zinc-100">{filteredTasks.length}</span> of{" "}
              {tasks.length}
            </span>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 px-2.5 text-xs text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
              >
                Reset Filters
              </Button>
            )}
          </div>
        </div>

        {/* ── Bottom of Search Bar: Quick Urgency Filter Buttons (Super User-Friendly for Elderly / Clear Plain Language) ── */}
        <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
            <span className="font-bold text-slate-700 dark:text-zinc-200 tracking-wide flex items-center gap-1.5">
              <span>Quick Urgency Filter:</span>
              <span className="font-normal text-muted-foreground text-[11px]">
                Click any button to view matching payments immediately
              </span>
            </span>
            {quickFilter !== "ALL" && (
              <button
                type="button"
                onClick={() => setQuickFilter("ALL")}
                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline text-xs flex items-center gap-1 w-fit"
              >
                <span>Reset to All Payments</span>
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {/* 1. All Payments */}
            <button
              type="button"
              onClick={() => setQuickFilter("ALL")}
              aria-pressed={quickFilter === "ALL"}
              className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer text-left select-none ${
                quickFilter === "ALL"
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100 ring-2 ring-slate-400/30"
                  : "bg-slate-50/70 hover:bg-slate-100/90 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    quickFilter === "ALL"
                      ? "bg-white/20 text-white dark:bg-zinc-900/20 dark:text-zinc-900"
                      : "bg-white dark:bg-zinc-700 text-slate-600 dark:text-zinc-300 shadow-2xs"
                  }`}
                >
                  <Layers className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold flex items-center gap-1.5 leading-tight truncate">
                    <span>All Payments</span>
                    {quickFilter === "ALL" && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </div>
                  <div
                    className={`text-[11px] truncate ${
                      quickFilter === "ALL"
                        ? "text-slate-200 dark:text-zinc-600"
                        : "text-slate-500 dark:text-zinc-400"
                    }`}
                  >
                    All active records
                  </div>
                </div>
              </div>
              <span
                className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono shrink-0 ${
                  quickFilter === "ALL"
                    ? "bg-white/20 text-white dark:bg-zinc-900/20 dark:text-zinc-900"
                    : "bg-slate-200/80 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300"
                }`}
              >
                {quickFilterCounts.all}
              </span>
            </button>

            {/* 2. Due on Today */}
            <button
              type="button"
              onClick={() => setQuickFilter(quickFilter === "DUE_TODAY" ? "ALL" : "DUE_TODAY")}
              aria-pressed={quickFilter === "DUE_TODAY"}
              className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer text-left select-none ${
                quickFilter === "DUE_TODAY"
                  ? "bg-amber-600 text-white border-amber-600 shadow-sm ring-2 ring-amber-400/40"
                  : "bg-amber-50/60 hover:bg-amber-100/80 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 border-amber-200 dark:border-amber-900/50 text-amber-950 dark:text-amber-200"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    quickFilter === "DUE_TODAY"
                      ? "bg-white/20 text-white"
                      : "bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shadow-2xs"
                  }`}
                >
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold flex items-center gap-1.5 leading-tight truncate">
                    <span>Due on Today</span>
                    {quickFilter === "DUE_TODAY" && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </div>
                  <div
                    className={`text-[11px] truncate ${
                      quickFilter === "DUE_TODAY"
                        ? "text-amber-100"
                        : "text-amber-700/80 dark:text-amber-400"
                    }`}
                  >
                    Must pay by today
                  </div>
                </div>
              </div>
              <span
                className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono shrink-0 ${
                  quickFilter === "DUE_TODAY"
                    ? "bg-white/20 text-white"
                    : "bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200"
                }`}
              >
                {quickFilterCounts.dueToday}
              </span>
            </button>

            {/* 3. Pending Payment */}
            <button
              type="button"
              onClick={() => setQuickFilter(quickFilter === "PENDING" ? "ALL" : "PENDING")}
              aria-pressed={quickFilter === "PENDING"}
              className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer text-left select-none ${
                quickFilter === "PENDING"
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-400/40"
                  : "bg-indigo-50/60 hover:bg-indigo-100/80 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/50 text-indigo-950 dark:text-indigo-200"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    quickFilter === "PENDING"
                      ? "bg-white/20 text-white"
                      : "bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 shadow-2xs"
                  }`}
                >
                  <Clock className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold flex items-center gap-1.5 leading-tight truncate">
                    <span>Pending Payment</span>
                    {quickFilter === "PENDING" && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </div>
                  <div
                    className={`text-[11px] truncate ${
                      quickFilter === "PENDING"
                        ? "text-indigo-100"
                        : "text-indigo-700/80 dark:text-indigo-400"
                    }`}
                  >
                    Awaiting AP settlement
                  </div>
                </div>
              </div>
              <span
                className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono shrink-0 ${
                  quickFilter === "PENDING"
                    ? "bg-white/20 text-white"
                    : "bg-indigo-200/80 dark:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200"
                }`}
              >
                {quickFilterCounts.pending}
              </span>
            </button>

            {/* 4. Overdue Payment */}
            <button
              type="button"
              onClick={() => setQuickFilter(quickFilter === "OVERDUE" ? "ALL" : "OVERDUE")}
              aria-pressed={quickFilter === "OVERDUE"}
              className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer text-left select-none ${
                quickFilter === "OVERDUE"
                  ? "bg-red-600 text-white border-red-600 shadow-sm ring-2 ring-red-400/40"
                  : "bg-red-50/60 hover:bg-red-100/80 dark:bg-red-950/20 dark:hover:bg-red-950/40 border-red-200 dark:border-red-900/50 text-red-950 dark:text-red-200"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    quickFilter === "OVERDUE"
                      ? "bg-white/20 text-white"
                      : "bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 shadow-2xs"
                  }`}
                >
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold flex items-center gap-1.5 leading-tight truncate">
                    <span>Overdue Payment</span>
                    {quickFilter === "OVERDUE" && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </div>
                  <div
                    className={`text-[11px] truncate ${
                      quickFilter === "OVERDUE"
                        ? "text-red-100"
                        : "text-red-700/80 dark:text-red-400"
                    }`}
                  >
                    Past payment deadline
                  </div>
                </div>
              </div>
              <span
                className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono shrink-0 ${
                  quickFilter === "OVERDUE"
                    ? "bg-white/20 text-white"
                    : "bg-red-200/80 dark:bg-red-900/60 text-red-900 dark:text-red-200"
                }`}
              >
                {quickFilterCounts.overdue}
              </span>
            </button>
          </div>
        </div>
      </Card>

      {/* ── Table Card ── */}
      <Card className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xs bg-white dark:bg-zinc-900 overflow-hidden flex flex-col p-0">
        <div className="overflow-x-auto relative">
          <Table className="m-0 w-full min-w-[960px]">
            <TableHeader className="bg-slate-50/80 dark:bg-zinc-900/80 sticky top-0 border-b text-[11px] uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead className="min-w-[220px]">Item / Product &amp; Vendor</TableHead>
                <TableHead className="min-w-[260px]">Wire Banking Details</TableHead>
                <TableHead className="w-32">Amount</TableHead>
                <TableHead className="w-32">Due Date</TableHead>
                <TableHead className="w-36">Status</TableHead>
                <TableHead className="w-32">Assignee</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16 text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
                      <span className="text-xs font-medium">Loading wire transfer records...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredTasks.length ? (
                filteredTasks.map((task) => {
                  const overdue = isOverdue(task.due_date, task.status);
                  const dueToday = isDueToday(task.due_date, task.status);
                  const wt = task.wire_transfer;
                  const hasWire = !!wt;

                  return (
                    <TableRow
                      key={task.id}
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
                        <div className="flex flex-col gap-1 max-w-[280px]">
                          <span className="font-semibold text-slate-900 dark:text-zinc-100 text-sm truncate">
                            {task.product_name || "Untitled Request"}
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-500 dark:text-zinc-400">
                            {(wt?.vendor || task.vendor) && (
                              <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-zinc-300">
                                <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                                <span className="truncate max-w-[160px]">{wt?.vendor || task.vendor}</span>
                              </span>
                            )}
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 font-medium ${
                                isScheduledPayment(task) && !isWireTransfer(task)
                                  ? "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                                  : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                              }`}
                            >
                              {isScheduledPayment(task) && !isWireTransfer(task)
                                ? "Scheduled Payment"
                                : "Wire Transfer"}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>

                      {/* Wire Banking Details */}
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {hasWire ? (
                          <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/60 dark:border-indigo-900/40 max-w-[280px]">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-xs text-indigo-950 dark:text-indigo-200 truncate flex items-center gap-1">
                                <Landmark className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                <span className="truncate">{wt.bank_name || "Bank Listed"}</span>
                              </span>
                              {wt.bank_country && (
                                <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium whitespace-nowrap">
                                  {wt.bank_country}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-xs">
                              {wt.bank_account_number ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-[11px] text-slate-700 dark:text-zinc-300 bg-white/80 dark:bg-zinc-800 px-1 rounded border border-slate-200/60 dark:border-zinc-700/60">
                                    {wt.bank_account_number.length > 8
                                      ? `•••• ${wt.bank_account_number.slice(-4)}`
                                      : wt.bank_account_number}
                                  </span>
                                  <button
                                    onClick={() =>
                                      handleCopy(
                                        wt.bank_account_number,
                                        `acct-${task.id}`,
                                        "Bank Account Number"
                                      )
                                    }
                                    title="Copy Account Number"
                                    className="p-1 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
                                  >
                                    {copiedKey === `acct-${task.id}` ? (
                                      <Check className="h-3 w-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-muted-foreground italic">No Acct #</span>
                              )}

                              <button
                                onClick={() => setSelectedWireTask(task)}
                                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 hover:underline flex items-center gap-0.5 ml-auto"
                              >
                                View Info
                              </button>
                            </div>

                            {(wt.routing_wire || wt.swift_code || wt.routing_ach) && (
                              <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono truncate">
                                {wt.swift_code ? `SWIFT: ${wt.swift_code}` : wt.routing_wire ? `Wire: ${wt.routing_wire}` : `ACH: ${wt.routing_ach}`}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-400 dark:text-zinc-500 text-xs py-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                              <AlertCircle className="h-3 w-3 text-slate-400" />
                              No Wire Info
                            </span>
                          </div>
                        )}
                      </TableCell>

                      {/* Amount */}
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm font-mono text-slate-900 dark:text-zinc-100">
                            {formatMoney(Number(task.amount || 0))}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {task.currency || wt?.currency || "USD"}
                            {wt?.pay_from && ` · ${wt.pay_from}`}
                          </span>
                        </div>
                      </TableCell>

                      {/* Due Date */}
                      <TableCell className="text-xs">
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={
                              dueToday
                                ? "text-amber-700 dark:text-amber-400 font-bold"
                                : overdue
                                ? "text-red-600 font-semibold"
                                : "text-slate-700 dark:text-zinc-300"
                            }
                          >
                            {formatDate(task.due_date || task.goods_received_at) || "—"}
                          </span>
                          {dueToday && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800 w-fit">
                              <Calendar className="h-2.5 w-2.5" />
                              Due Today
                            </span>
                          )}
                          {overdue && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800 w-fit">
                              <Clock className="h-2.5 w-2.5" />
                              Overdue
                            </span>
                          )}
                        </div>
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
                          <span className="truncate max-w-[120px] block" title={task.assignee_name}>
                            {task.assignee_name}
                          </span>
                        ) : (
                          <span className="italic text-slate-400">Unassigned</span>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {hasWire && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedWireTask(task)}
                              title="View Wire Banking Info"
                              className="h-7 w-7 p-0 rounded-md border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60"
                            >
                              <Landmark className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/purchasing/requests/${task.id}`)}
                            title="Open Full Request"
                            className="h-7 w-7 p-0 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100"
                          >
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16 text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="p-3 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400">
                        <Landmark className="h-8 w-8" />
                      </div>
                      <span className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                        No Matching Wire Records Found
                      </span>
                      <p className="text-xs text-slate-500 text-center">
                        {hasActiveFilters
                          ? "Try clearing some filters or searching with different criteria."
                          : "No wire transfers or AP invoices are currently staged in the system."}
                      </p>
                      {hasActiveFilters && (
                        <Button variant="outline" size="sm" onClick={clearFilters} className="mt-2 text-xs">
                          Clear Active Filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* ── Read-Only Wire Info Details Dialog ── */}
      {selectedWireTask && selectedWireTask.wire_transfer && (
        <Dialog open={!!selectedWireTask} onOpenChange={(open) => !open && setSelectedWireTask(null)}>
          <DialogContent className="w-[95vw] sm:max-w-2xl lg:max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl">
            {/* Modal Header */}
            <DialogHeader className="p-5 pb-3 border-b bg-slate-50/80 dark:bg-zinc-900/60">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300">
                    <Landmark className="h-6 w-6" />
                  </div>
                  <div>
                    <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                      <span>Wire Transfer Information</span>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                      >
                        Read-Only
                      </Badge>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                      Request #{selectedWireTask.id} &bull; {selectedWireTask.product_name}
                    </DialogDescription>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyAllBankingDetails(selectedWireTask)}
                  className="h-8 gap-1.5 text-xs font-semibold bg-white dark:bg-zinc-800 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 shadow-2xs"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy All Details</span>
                </Button>
              </div>
            </DialogHeader>

            {/* Modal Content */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
              {/* Payment & Vendor Details */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Payment &amp; Vendor Overview</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 p-4 rounded-xl bg-slate-50/70 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-zinc-800">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Vendor Name</span>
                    <span className="font-semibold text-slate-900 dark:text-zinc-100 text-sm">
                      {selectedWireTask.wire_transfer.vendor || selectedWireTask.vendor || "—"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-muted-foreground block">Transfer Amount</span>
                    <span className="font-bold text-slate-900 dark:text-zinc-100 text-sm font-mono">
                      {formatMoney(
                        Number(selectedWireTask.wire_transfer.amount || selectedWireTask.amount || 0)
                      )}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        {selectedWireTask.wire_transfer.currency || selectedWireTask.currency || "USD"}
                      </span>
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-muted-foreground block">Payment Category</span>
                    <Badge variant="secondary" className="text-[11px] px-1.5 py-0 mt-0.5 font-medium">
                      {selectedWireTask.wire_transfer.category ||
                        selectedWireTask.wire_transfer.payment_type ||
                        selectedWireTask.category ||
                        "Others"}
                    </Badge>
                  </div>

                  <div>
                    <span className="text-[11px] text-muted-foreground block">Paying Entity (Pay From)</span>
                    <span className="font-medium text-slate-800 dark:text-zinc-200">
                      {selectedWireTask.wire_transfer.pay_from || "—"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-muted-foreground block">Invoice Number</span>
                    <span className="font-mono text-slate-800 dark:text-zinc-200">
                      {selectedWireTask.wire_transfer.invoice_number || "—"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-muted-foreground block">Due Date / Payment Date</span>
                    <span className="font-medium text-slate-800 dark:text-zinc-200">
                      {formatDate(selectedWireTask.wire_transfer.due_date || selectedWireTask.due_date) || "—"}
                      {selectedWireTask.wire_transfer.payment_date &&
                        ` (Paid: ${formatDate(selectedWireTask.wire_transfer.payment_date)})`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Beneficiary Banking Information */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5 flex items-center gap-1.5">
                  <Landmark className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Beneficiary Bank &amp; Routing Information</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 rounded-xl bg-slate-50/70 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-zinc-800">
                  {/* Bank Name */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60">
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Bank Name</span>
                      <span className="font-semibold text-slate-900 dark:text-zinc-100">
                        {selectedWireTask.wire_transfer.bank_name || "—"}
                      </span>
                    </div>
                    {selectedWireTask.wire_transfer.bank_name && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleCopy(
                            selectedWireTask.wire_transfer.bank_name,
                            "modal-bank-name",
                            "Bank Name"
                          )
                        }
                        className="h-7 w-7 p-0"
                      >
                        {copiedKey === "modal-bank-name" ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-slate-400" />
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Bank Country */}
                  <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60">
                    <span className="text-[11px] text-muted-foreground block">Bank Jurisdiction / Country</span>
                    <span className="font-semibold text-slate-900 dark:text-zinc-100">
                      {selectedWireTask.wire_transfer.bank_country || "—"}
                    </span>
                  </div>

                  {/* Account Number */}
                  <div className="sm:col-span-2 flex items-center justify-between p-2.5 rounded-lg bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/60">
                    <div>
                      <span className="text-[11px] font-semibold text-indigo-900 dark:text-indigo-300 block">
                        Bank Account Number / IBAN
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-sm">
                        {selectedWireTask.wire_transfer.bank_account_number ||
                          selectedWireTask.wire_transfer.iban ||
                          "—"}
                      </span>
                    </div>
                    {(selectedWireTask.wire_transfer.bank_account_number ||
                      selectedWireTask.wire_transfer.iban) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleCopy(
                            selectedWireTask.wire_transfer.bank_account_number ||
                              selectedWireTask.wire_transfer.iban,
                            "modal-acct-num",
                            "Account Number"
                          )
                        }
                        className="h-7 px-2.5 text-xs gap-1 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300"
                      >
                        {copiedKey === "modal-acct-num" ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        <span>Copy</span>
                      </Button>
                    )}
                  </div>

                  {/* Wire Routing */}
                  {selectedWireTask.wire_transfer.routing_wire && (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60">
                      <div>
                        <span className="text-[11px] text-muted-foreground block">Wire Routing Number / ABA</span>
                        <span className="font-mono font-semibold text-slate-900 dark:text-zinc-100">
                          {selectedWireTask.wire_transfer.routing_wire}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleCopy(
                            selectedWireTask.wire_transfer.routing_wire,
                            "modal-routing-wire",
                            "Wire Routing"
                          )
                        }
                        className="h-7 w-7 p-0"
                      >
                        {copiedKey === "modal-routing-wire" ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-slate-400" />
                        )}
                      </Button>
                    </div>
                  )}

                  {/* ACH Routing */}
                  {selectedWireTask.wire_transfer.routing_ach && (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60">
                      <div>
                        <span className="text-[11px] text-muted-foreground block">ACH Routing Number</span>
                        <span className="font-mono font-semibold text-slate-900 dark:text-zinc-100">
                          {selectedWireTask.wire_transfer.routing_ach}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleCopy(
                            selectedWireTask.wire_transfer.routing_ach,
                            "modal-routing-ach",
                            "ACH Routing"
                          )
                        }
                        className="h-7 w-7 p-0"
                      >
                        {copiedKey === "modal-routing-ach" ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-slate-400" />
                        )}
                      </Button>
                    </div>
                  )}

                  {/* SWIFT / BIC */}
                  {selectedWireTask.wire_transfer.swift_code && (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60">
                      <div>
                        <span className="text-[11px] text-muted-foreground block">SWIFT / BIC Code</span>
                        <span className="font-mono font-semibold text-slate-900 dark:text-zinc-100">
                          {selectedWireTask.wire_transfer.swift_code}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleCopy(
                            selectedWireTask.wire_transfer.swift_code,
                            "modal-swift",
                            "SWIFT Code"
                          )
                        }
                        className="h-7 w-7 p-0"
                      >
                        {copiedKey === "modal-swift" ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-slate-400" />
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Comments / Notes */}
                  {selectedWireTask.wire_transfer.comments && (
                    <div className="sm:col-span-2 p-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60">
                      <span className="text-[11px] text-muted-foreground block">Comments &amp; Instructions</span>
                      <p className="text-slate-800 dark:text-zinc-200 whitespace-pre-wrap mt-0.5">
                        {selectedWireTask.wire_transfer.comments}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <DialogFooter className="p-4 border-t bg-slate-50/80 dark:bg-zinc-900/80 flex items-center justify-between sm:justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const id = selectedWireTask.id;
                  setSelectedWireTask(null);
                  navigate(`/purchasing/requests/${id}`);
                }}
                className="gap-1.5 text-xs font-semibold"
              >
                <span>Open Request Details</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>

              <Button
                size="sm"
                onClick={() => setSelectedWireTask(null)}
                className="text-xs h-8 px-4 font-semibold"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
