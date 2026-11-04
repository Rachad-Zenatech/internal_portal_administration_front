import { useState, useEffect } from "react";
import { toast } from "sonner";
import { exportQuickBooksCsv, exportQuickBooksXlsx, exportQuickBooksBundle, exportQuickBooksDocuments, exportQuickBooksReconciliation, getQuickBooksPreview, syncQuickBooksBatch, type QuickBooksPreviewResponse, type QuickBooksPreviewItem } from "@/services/purchasingService";
import type { QuickBooksExportDialogProps, DialogTab, ExportMode, FilterType } from "../types";
import { QB_LAST_EXPORTED_KEY } from "../constants";
import { formatForDateTimeInput, formatDisplayDateTime } from "../utils";

export function useQuickBooksExportDialogActions(props: QuickBooksExportDialogProps) {
  const { open, onOpenChange } = props;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
 // 1-12

  const years = [
    { value: String(currentYear), label: `${currentYear} (Current Year)` },
    { value: String(currentYear - 1), label: String(currentYear - 1) },
    { value: String(currentYear - 2), label: String(currentYear - 2) },
    { value: String(currentYear - 3), label: String(currentYear - 3) },
    { value: String(currentYear - 4), label: String(currentYear - 4) },
    { value: "ALL", label: "All Years" },
  ];
  const [activeTab, setActiveTab] = useState<DialogTab>("PREVIEW_SYNC");
  const [filterType, setFilterType] = useState<FilterType>("TODAY");
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const [selectedMonth, setSelectedMonth] = useState<string>(String(currentMonth));
  const [exportMode, setExportMode] = useState<ExportMode>("BUNDLE");
  const [isExporting, setIsExporting] = useState(false);
  // Staging Preview State
  const [previewData, setPreviewData] = useState<QuickBooksPreviewResponse | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [selectedRequestIds, setSelectedRequestIds] = useState<number[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [expandedPayloadId, setExpandedPayloadId] = useState<number | null>(null);
  const [detailsItem, setDetailsItem] = useState<QuickBooksPreviewItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  // Stored Last Export Time
  const [lastExportedAt, setLastExportedAt] = useState<string | null>(null);
  // Datetime Range Inputs
  const [startDateTime, setStartDateTime] = useState<string>("");
  const [endDateTime, setEndDateTime] = useState<string>("");
  const fetchPreview = async () => {
    setIsLoadingPreview(true);
    try {
      const yearParam = selectedYear !== "ALL" ? parseInt(selectedYear, 10) : null;
      const monthParam = selectedMonth !== "ALL" ? parseInt(selectedMonth, 10) : null;
      const data = await getQuickBooksPreview({
        status: "ORDERED / PURCHASED",
        year: yearParam,
        month: monthParam,
      });
      setPreviewData(data);
      const readyIds = (data.items || [])
        .filter((item) => item.readiness === "READY" || item.readiness === "READY_WITH_NOTES")
        .map((item) => item.request_id);
      setSelectedRequestIds(readyIds);
    } catch (err: any) {
      toast.error(err.message || "Failed to load QuickBooks preview");
    } finally {
      setIsLoadingPreview(false);
    }
  };
  useEffect(() => {
    if (open && activeTab === "PREVIEW_SYNC") {
      fetchPreview();
    }
  }, [open, activeTab, selectedYear, selectedMonth]);
  // Initialize date times & last exported time when dialog opens
  useEffect(() => {
    if (open) {
      const stored = localStorage.getItem(QB_LAST_EXPORTED_KEY);
      setLastExportedAt(stored);

      const currentNow = new Date();
      setEndDateTime(formatForDateTimeInput(currentNow));

      if (stored) {
        const lastDate = new Date(stored);
        if (!isNaN(lastDate.getTime())) {
          // Rule: start time is last exported time + 1 second
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
    }
  }, [open]);
  const handleToggleSelect = (requestId: number) => {
    setSelectedRequestIds((prev) =>
      prev.includes(requestId) ? prev.filter((id) => id !== requestId) : [...prev, requestId]
    );
  };
  const handleSelectAll = () => {
    if (!previewData?.items) return;
    if (selectedRequestIds.length === previewData.items.length) {
      setSelectedRequestIds([]);
    } else {
      setSelectedRequestIds(previewData.items.map((i) => i.request_id));
    }
  };
  const handleSyncSelected = async () => {
    if (selectedRequestIds.length === 0) {
      toast.error("Please select at least one item to sync to QuickBooks.");
      return;
    }

    setIsSyncing(true);
    toast.loading(`Syncing ${selectedRequestIds.length} item(s) to QuickBooks Online...`, { id: "qb-sync" });
    try {
      const res = await syncQuickBooksBatch(selectedRequestIds);
      if (res.synced > 0) {
        toast.success(`Successfully synced ${res.synced} expense(s) to QuickBooks Online!`, { id: "qb-sync" });
        await fetchPreview();
      } else {
        toast.error("Sync completed with failures. Please check item details.", { id: "qb-sync" });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to sync to QuickBooks", { id: "qb-sync" });
    } finally {
      setIsSyncing(false);
    }
  };
  const handleResetToLastExport = () => {
    setFilterType("DATETIME_RANGE");
    const currentNow = new Date();
    setEndDateTime(formatForDateTimeInput(currentNow));
    if (lastExportedAt) {
      const lastDate = new Date(lastExportedAt);
      if (!isNaN(lastDate.getTime())) {
        const nextStart = new Date(lastDate.getTime() + 1000);
        setStartDateTime(formatForDateTimeInput(nextStart));
        toast.info(`Range set from last export + 1s (${formatDisplayDateTime(nextStart)}) to now`);
        return;
      }
    }
    const startOfMonth = new Date(currentNow.getFullYear(), currentNow.getMonth(), 1, 0, 0, 0);
    setStartDateTime(formatForDateTimeInput(startOfMonth));
  };
  const handleSetTodayPreset = () => {
    setFilterType("TODAY");
    const currentNow = new Date();
    const todayStart = new Date(currentNow.getFullYear(), currentNow.getMonth(), currentNow.getDate(), 0, 0, 0);
    setStartDateTime(formatForDateTimeInput(todayStart));
    setEndDateTime(formatForDateTimeInput(currentNow));
  };
  const handleExport = async () => {
    setIsExporting(true);
    try {
      toast.loading("Generating QuickBooks export...", { id: "qb-export" });

      let yearParam: number | null = null;
      let monthParam: number | null = null;
      let startParam: string | null = null;
      let endParam: string | null = null;

      if (filterType === "TODAY") {
        const currentNow = new Date();
        const todayStart = new Date(currentNow.getFullYear(), currentNow.getMonth(), currentNow.getDate(), 0, 0, 0);
        startParam = formatForDateTimeInput(todayStart).replace("T", " ");
        endParam = formatForDateTimeInput(currentNow).replace("T", " ");
      } else if (filterType === "DATETIME_RANGE") {
        if (startDateTime) startParam = startDateTime.replace("T", " ");
        if (endDateTime) endParam = endDateTime.replace("T", " ");
      } else {
        yearParam = selectedYear !== "ALL" ? parseInt(selectedYear, 10) : null;
        monthParam = selectedMonth !== "ALL" ? parseInt(selectedMonth, 10) : null;
      }

      if (exportMode === "BUNDLE") {
        await exportQuickBooksBundle(undefined, "ORDERED / PURCHASED", yearParam, monthParam, startParam, endParam);
        toast.success("Complete QuickBooks bundle downloaded successfully", { id: "qb-export" });
      } else if (exportMode === "DOCUMENTS") {
        await exportQuickBooksDocuments(undefined, "ORDERED / PURCHASED", yearParam, monthParam, startParam, endParam);
        toast.success("PDF document package downloaded successfully", { id: "qb-export" });
      } else if (exportMode === "RECONCILIATION") {
        await exportQuickBooksReconciliation(undefined, "ORDERED / PURCHASED", yearParam, monthParam, startParam, endParam);
        toast.success("Reconciliation manifest downloaded successfully", { id: "qb-export" });
      } else if (exportMode === "CSV") {
        await exportQuickBooksCsv(undefined, "ORDERED / PURCHASED", yearParam, monthParam, startParam, endParam);
        toast.success("QuickBooks CSV export downloaded successfully", { id: "qb-export" });
      } else {
        await exportQuickBooksXlsx(undefined, "ORDERED / PURCHASED", yearParam, monthParam, startParam, endParam);
        toast.success("QuickBooks Excel export downloaded successfully", { id: "qb-export" });
      }

      // Record last export time (use endDateTime/now timestamp)
      const exportTimestamp = endParam ? new Date(endParam.replace(" ", "T")).toISOString() : new Date().toISOString();
      localStorage.setItem(QB_LAST_EXPORTED_KEY, exportTimestamp);
      setLastExportedAt(exportTimestamp);

      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to export QuickBooks file", { id: "qb-export" });
    } finally {
      setIsExporting(false);
    }
  };
  const isConnected = previewData?.connection?.is_connected;
  const companyName = previewData?.connection?.company_name || "QuickBooks Online";
  const totalItems = previewData?.summary?.total_items ?? 0;
  const totalAmount = previewData?.summary?.formatted_total_amount ?? "$0.00";
  return { now, years, activeTab, setActiveTab, filterType, setFilterType, selectedYear, setSelectedYear, selectedMonth, setSelectedMonth, exportMode, setExportMode, isExporting, previewData, isLoadingPreview, selectedRequestIds, isSyncing, expandedPayloadId, setExpandedPayloadId, detailsItem, setDetailsItem, isDetailsOpen, setIsDetailsOpen, lastExportedAt, startDateTime, setStartDateTime, endDateTime, setEndDateTime, fetchPreview, handleToggleSelect, handleSelectAll, handleSyncSelected, handleResetToLastExport, handleSetTodayPreset, handleExport, isConnected, companyName, totalItems, totalAmount };
}
