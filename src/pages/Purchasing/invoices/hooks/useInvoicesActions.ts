import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { apiClient as api } from "@/services/apiClient";
import { formatDate, formatMoney } from "../../utils/purchasingMeta";
import { RequestStatus } from "@/types/purchasing";
import { parseRequestStatus } from "@/lib/requestStatus";
import { useAuth } from "@/lib/AuthContext";

export function useInvoicesActions() {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const canCreateWire = Boolean(user?.is_super_admin || hasPermission("PURCHASING_CREATE"));
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  // The sidebar sub-menu links here with ?status=WAITING_PAYMENT, ?status=ON_HOLD, ...
  const [searchParams] = useSearchParams();
  const urlStatus = (searchParams.get("status") || "ALL").toUpperCase();
  const [statusFilter, setStatusFilter] = useState<string>(urlStatus);
  useEffect(() => {
    setStatusFilter(urlStatus);
  }, [urlStatus]);
  const [isCreateWireOpen, setIsCreateWireOpen] = useState(false);
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
        } else if (statusFilter === "REJECTED") {
          if (parsed !== RequestStatus.Rejected) return false;
        } else if (statusFilter === "ON_HOLD") {
          if (parsed !== RequestStatus.OnHold) return false;
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
  return { navigate, canCreateWire, isCreateWireOpen, setIsCreateWireOpen, tasks, isLoading, searchQuery, setSearchQuery, statusFilter, setStatusFilter, wireFilter, setWireFilter, typeFilter, setTypeFilter, quickFilter, setQuickFilter, selectedWireTask, setSelectedWireTask, copiedKey, isWireTransfer, isScheduledPayment, isDueToday, isOverdue, fetchTasks, handleCopy, handleCopyAllBankingDetails, quickFilterCounts, metrics, filteredTasks, hasActiveFilters, clearFilters };
}
