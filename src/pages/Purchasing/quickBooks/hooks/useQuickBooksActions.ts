import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { getQuickBooksPreview, getQuickBooksARPreview, type QuickBooksPreviewItem, type QuickBooksPreviewResponse } from "@/services/purchasingService";
import { QB_LAST_EXPORTED_KEY } from "../constants";
import { formatForDateTimeInput, isMaItem } from "../utils";

export function useQuickBooksActions() {
  const [searchParams] = useSearchParams();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const years = [
    { value: String(currentYear), label: `${currentYear} (Current Year)` },
    { value: String(currentYear - 1), label: String(currentYear - 1) },
    { value: String(currentYear - 2), label: String(currentYear - 2) },
    { value: "ALL", label: "All Years" },
  ];
  // Filters & Staging
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [datePreset, setDatePreset] = useState<string>("ALL");
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const [selectedMonth, setSelectedMonth] = useState<string>(String(currentMonth));
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [requestTypeFilter, setRequestTypeFilter] = useState<string>("ALL");
  const [stagingTab, setStagingTab] = useState<"expenses" | "ma_payments" | "bills" | "ar_invoices">("expenses");
  const [previewData, setPreviewData] = useState<QuickBooksPreviewResponse | null>(null);
  const [arPreviewData, setArPreviewData] = useState<QuickBooksPreviewResponse | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [selectedRequestIds, setSelectedRequestIds] = useState<number[]>([]);
  // Reset request type filter when changing main staging tab
  useEffect(() => {
    setRequestTypeFilter("ALL");
  }, [stagingTab]);
  // Dynamic request type filter options based on active main tab:
  // - Expenses: All Types, Purchasing Requests, M&A Purchases
  // - Bills: All Types, Recurring Payments
  // - A/R Invoices: All Types, A/R Invoices
  const requestTypeOptions = useMemo(() => {
    if (stagingTab === "expenses") {
      return [
        { id: "ALL", label: "All Types" },
        { id: "PURCHASE", label: "Purchasing Requests" },
      ];
    }
    if (stagingTab === "ma_payments") {
      return [
        { id: "ALL", label: "All M&A" },
        { id: "MA", label: "Scheduled M&A Deals" },
      ];
    }
    if (stagingTab === "bills") {
      return [
        { id: "ALL", label: "All Types" },
        { id: "RECURRING", label: "Recurring Payments" },
      ];
    }
    // ar_invoices
    return [
      { id: "ALL", label: "All Types" },
      { id: "AR_CASH", label: "A/R Invoices" },
    ];
  }, [stagingTab]);
  const applyDatePreset = (preset: string) => {
    const today = new Date();
    const formatYmd = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    setDatePreset(preset);
    if (preset === "TODAY") {
      const todayStr = formatYmd(today);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "YESTERDAY") {
      const yest = new Date(today);
      yest.setDate(yest.getDate() - 1);
      const yestStr = formatYmd(yest);
      setStartDate(yestStr);
      setEndDate(yestStr);
    } else if (preset === "LAST_7_DAYS") {
      const past7 = new Date(today);
      past7.setDate(past7.getDate() - 6);
      setStartDate(formatYmd(past7));
      setEndDate(formatYmd(today));
    } else if (preset === "THIS_MONTH") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatYmd(firstDay));
      setEndDate(formatYmd(today));
    } else if (preset === "ALL") {
      setStartDate("");
      setEndDate("");
    }
  };
  const clearDateFilter = () => {
    setStartDate("");
    setEndDate("");
    setDatePreset("ALL");
  };
  // Actions & Dialogs
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncingSingleId, setSyncingSingleId] = useState<number | null>(null);
  const [inspectorItem, setInspectorItem] = useState<QuickBooksPreviewItem | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("staging");
  // Export Tab State
  const [exportMode, setExportMode] = useState<string>("BUNDLE");
  const [filterType, setFilterType] = useState<"SELECTED" | "TODAY" | "DATETIME_RANGE" | "MONTH_YEAR">("SELECTED");
  const [startDateTime, setStartDateTime] = useState<string>("");
  const [endDateTime, setEndDateTime] = useState<string>("");
  const [lastExportedAt, setLastExportedAt] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  // Direct QBO Query Explorer
  const [queryInput, setQueryInput] = useState<string>("SELECT * FROM Account MAXRESULTS 20");
  const [queryResult, setQueryResult] = useState<any>(null);
  const [isQuerying, setIsQuerying] = useState(false);
  // Disconnect Confirmation
  const [isDisconnectOpen, setIsDisconnectOpen] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  // Delete / Remove from QuickBooks state
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<QuickBooksPreviewItem | null>(null);
  // Fetch Preview / Staged Data
  const fetchPreview = async () => {
    setIsLoadingPreview(true);
    try {
      const isCustomDateActive = Boolean(startDate || endDate);
      const isPresetActive = datePreset !== "ALL";
      // Year/month filtering should only apply if explicitly set in custom date or if not "ALL"
      const yearParam = (!isCustomDateActive && isPresetActive && selectedYear !== "ALL") ? parseInt(selectedYear, 10) : null;
      const monthParam = (!isCustomDateActive && isPresetActive && selectedMonth !== "ALL") ? parseInt(selectedMonth, 10) : null;
      const [data, arData] = await Promise.all([
        getQuickBooksPreview({
          status: "ORDERED / PURCHASED",
          start_date: startDate ? startDate : null,
          end_date: endDate ? endDate : null,
          year: yearParam,
          month: monthParam,
        }),
        getQuickBooksARPreview().catch(() => null),
      ]);
      setPreviewData(data);
      if (arData) setArPreviewData(arData);
      const readyIds = [
        ...(data.items || []).filter((item) => item.readiness === "READY" || item.readiness === "READY_WITH_NOTES").map((item) => item.request_id),
        ...((arData?.items || []).filter((item) => item.readiness === "READY" || item.readiness === "READY_WITH_NOTES").map((item) => item.request_id)),
      ];
      setSelectedRequestIds(readyIds);
    } catch (err: any) {
      toast.error(err.message || "Failed to load QuickBooks preview staging");
    } finally {
      setIsLoadingPreview(false);
    }
  };
  useEffect(() => {
    fetchPreview();
  }, [startDate, endDate, datePreset]);
  // Read URL query params on mount for notifications/errors
  useEffect(() => {
    const qbStatus = searchParams.get("qb_status");
    const qbError = searchParams.get("qb_error");
    if (qbStatus === "connected") {
      toast.success("Successfully connected to QuickBooks Online!");
    } else if (qbError) {
      toast.error(`QuickBooks OAuth Error: ${qbError}`);
    }
  }, [searchParams]);
  // Initialize dates for export tab
  useEffect(() => {
    const stored = localStorage.getItem(QB_LAST_EXPORTED_KEY);
    setLastExportedAt(stored);
    const currentNow = new Date();
    setEndDateTime(formatForDateTimeInput(currentNow));
    if (stored) {
      const lastDate = new Date(stored);
      if (!isNaN(lastDate.getTime())) {
        const nextStart = new Date(lastDate.getTime() + 1000);
        setStartDateTime(formatForDateTimeInput(nextStart));
      } else {
        const startOfMonth = new Date(currentNow.getFullYear(), currentNow.getMonth(), 1, 0, 0, 0);
        setStartDateTime(formatForDateTimeInput(startOfMonth));
      }
    } else {
      const thirtyDaysAgo = new Date(currentNow.getTime() - 30 * 24 * 60 * 60 * 1000);
      setStartDateTime(formatForDateTimeInput(thirtyDaysAgo));
    }
  }, []);
  // Partition all staged items into Expenses, M&A Scheduled Payments, Bills, and A/R Invoices
  const allExpenses = useMemo(() => {
    if (!previewData?.items) return [];
    return previewData.items.filter((item) => {
      if (isMaItem(item)) return false;
      if (item.transaction_category === "BILL") return false;
      return item.transaction_category === "EXPENSE" || !item.is_recurring;
    });
  }, [previewData]);
  const allMaPayments = useMemo(() => {
    if (!previewData?.items) return [];
    return previewData.items.filter((item) => {
      return isMaItem(item);
    });
  }, [previewData]);
  const allBills = useMemo(() => {
    if (!previewData?.items) return [];
    return previewData.items.filter((item) => {
      if (isMaItem(item)) return false;
      if (item.transaction_category === "EXPENSE") return false;
      return item.transaction_category === "BILL" || Boolean(item.is_recurring);
    });
  }, [previewData]);
  const allARInvoices = useMemo(() => {
    return arPreviewData?.items || [];
  }, [arPreviewData]);
  // Filtered items based on active sub-tab (Expenses vs M&A Payments vs Bills vs A/R Invoices)
  const currentTabRawItems = stagingTab === "expenses"
    ? allExpenses
    : stagingTab === "ma_payments"
    ? allMaPayments
    : stagingTab === "bills"
    ? allBills
    : allARInvoices;
  const filteredItems = useMemo(() => {
    return currentTabRawItems.filter((item) => {
      // Status Filter
      if (statusFilter === "READY") {
        if (item.readiness !== "READY" && item.readiness !== "READY_WITH_NOTES") return false;
      } else if (statusFilter === "SYNCED") {
        if (item.readiness !== "ALREADY_SYNCED" && !item.is_already_synced) return false;
      } else if (statusFilter === "ERROR") {
        if (item.readiness !== "ERROR" && (!item.validation_errors || item.validation_errors.length === 0)) return false;
      }

      // Request Type Filter
      if (requestTypeFilter !== "ALL") {
        const isMa = isMaItem(item);
        const isBill = !isMa && (item.transaction_category === "BILL" || Boolean(item.is_recurring));
        const isAr = Boolean(item.is_ar || item.type === "ar_invoice");

        if (requestTypeFilter === "PURCHASE") {
          if (isMa || isBill || isAr) return false;
        } else if (requestTypeFilter === "RECURRING") {
          if (!isBill || isAr) return false;
        } else if (requestTypeFilter === "MA") {
          if (!isMa) return false;
        } else if (requestTypeFilter === "AR_CASH") {
          if (!isAr) return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const cleanId = q.replace(/^(?:req-#|req-|rec-#|rec-|ar-#|ar-|#)/i, "").trim();
        const reqStr = String(item.request_id || "");
        const wfStr = String(item.workflow_id || item.id || "");
        const matchTitle = (item.product_name || "").toLowerCase().includes(q);
        const matchVendor = (item.raw_payee || "").toLowerCase().includes(q);
        const matchReq =
          `req-#${reqStr}`.toLowerCase().includes(q) ||
          `rec-#${reqStr}`.toLowerCase().includes(q) ||
          `ar-#${reqStr}`.toLowerCase().includes(q) ||
          reqStr.includes(q) ||
          wfStr.toLowerCase().includes(q) ||
          (cleanId.length > 0 && (reqStr.includes(cleanId) || wfStr.toLowerCase().includes(cleanId)));
        const matchRef = (item.ref_no || "").toLowerCase().includes(q);
        const matchGl = (item.category || "").toLowerCase().includes(q);
        const matchLoc = (item.location || item.from_location || item.bank_name || "").toLowerCase().includes(q);
        const matchAmt = String(item.amount || "").includes(q);
        if (!matchTitle && !matchVendor && !matchReq && !matchRef && !matchGl && !matchLoc && !matchAmt) return false;
      }

      return true;
    });
  }, [currentTabRawItems, statusFilter, requestTypeFilter, searchQuery]);
  return { years, startDate, setStartDate, endDate, setEndDate, datePreset, setDatePreset, selectedYear, setSelectedYear, selectedMonth, setSelectedMonth, searchQuery, setSearchQuery, statusFilter, setStatusFilter, requestTypeFilter, setRequestTypeFilter, stagingTab, setStagingTab, previewData, arPreviewData, isLoadingPreview, selectedRequestIds, setSelectedRequestIds, requestTypeOptions, applyDatePreset, clearDateFilter, isSyncing, setIsSyncing, syncingSingleId, setSyncingSingleId, inspectorItem, setInspectorItem, isInspectorOpen, setIsInspectorOpen, activeTab, setActiveTab, exportMode, setExportMode, filterType, setFilterType, startDateTime, setStartDateTime, endDateTime, setEndDateTime, lastExportedAt, setLastExportedAt, isExporting, setIsExporting, queryInput, setQueryInput, queryResult, setQueryResult, isQuerying, setIsQuerying, isDisconnectOpen, setIsDisconnectOpen, isDisconnecting, setIsDisconnecting, deletingId, setDeletingId, deleteConfirmItem, setDeleteConfirmItem, fetchPreview, allExpenses, allMaPayments, allBills, allARInvoices, filteredItems };
}
