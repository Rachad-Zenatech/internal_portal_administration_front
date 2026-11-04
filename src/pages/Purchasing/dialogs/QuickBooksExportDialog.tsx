import { QuickBooksItemDetailsDialog } from "./QuickBooksItemDetailsDialog";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FileSpreadsheet,
  Paperclip,
  Download,
  Calendar,
  Clock,
  Loader2,
  CheckCircle2,
  FolderArchive,
  FileText,
  Check,
  History,
  RotateCcw,
  Sun,
  Zap,
  AlertTriangle,
  RefreshCw,
  Building2,
  CreditCard,
  Tag,
  ChevronDown,
  ChevronUp,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import {
  exportQuickBooksCsv,
  exportQuickBooksXlsx,
  exportQuickBooksBundle,
  exportQuickBooksDocuments,
  exportQuickBooksReconciliation,
  getQuickBooksPreview,
  syncQuickBooksBatch,
  type QuickBooksPreviewResponse,
  type QuickBooksPreviewItem,
} from "@/services/purchasingService";

interface QuickBooksExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MONTHS = [
  { value: "ALL", label: "All Months" },
  { value: "1", label: "January (01)" },
  { value: "2", label: "February (02)" },
  { value: "3", label: "March (03)" },
  { value: "4", label: "April (04)" },
  { value: "5", label: "May (05)" },
  { value: "6", label: "June (06)" },
  { value: "7", label: "July (07)" },
  { value: "8", label: "August (08)" },
  { value: "9", label: "September (09)" },
  { value: "10", label: "October (10)" },
  { value: "11", label: "November (11)" },
  { value: "12", label: "December (12)" },
];

type DialogTab = "PREVIEW_SYNC" | "FILE_EXPORT";
type ExportMode = "BUNDLE" | "XLSX" | "CSV" | "DOCUMENTS" | "RECONCILIATION";
type FilterType = "TODAY" | "DATETIME_RANGE" | "MONTH_YEAR";

const QB_LAST_EXPORTED_KEY = "qb_last_exported_at";

/**
 * Formats a Date object to "YYYY-MM-DDTHH:mm:ss" for datetime-local input fields.
 */
function formatForDateTimeInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

/**
 * Formats a timestamp into human-readable "YYYY/MM/DD HH:mm:ss"
 */
function formatDisplayDateTime(dateStrOrObj: string | Date | null): string {
  if (!dateStrOrObj) return "Never";
  try {
    const d = typeof dateStrOrObj === "string" ? new Date(dateStrOrObj) : dateStrOrObj;
    if (isNaN(d.getTime())) return String(dateStrOrObj);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch {
    return String(dateStrOrObj);
  }
}

/**
 * Formats a Date object to "YYYY/MM/DD"
 */
function formatDisplayDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())}`;
}

export function QuickBooksExportDialog({ open, onOpenChange }: QuickBooksExportDialogProps) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-background text-foreground border-border/80 shadow-2xl rounded-xl">
        <DialogHeader className="p-5 pb-3 border-b border-border/70 bg-muted/20">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
                  QuickBooks Online Integration &amp; Exports
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Review staging and synchronize ledgers directly, or export formatted transaction packages.
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isConnected ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Connected: {companyName}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>QuickBooks Disconnected</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 pt-1 border-t border-border/40">
            <button
              type="button"
              onClick={() => setActiveTab("PREVIEW_SYNC")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === "PREVIEW_SYNC"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Live Staging &amp; Direct Sync</span>
              {totalItems > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-background/20 font-bold">
                  {totalItems}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("FILE_EXPORT")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === "FILE_EXPORT"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Download className="h-3.5 w-3.5" />
              <span>File Exports (.xlsx / .csv / .zip)</span>
            </button>
          </div>
        </DialogHeader>

        {activeTab === "PREVIEW_SYNC" && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[60vh]">
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-border/70 bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="h-7.5 text-xs w-32 bg-background">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y.value} value={y.value} className="text-xs">
                          {y.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="h-7.5 text-xs w-32 bg-background">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={m.value} className="text-xs">
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7.5 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                  onClick={fetchPreview}
                  disabled={isLoadingPreview}
                >
                  <RefreshCw className={`h-3 w-3 ${isLoadingPreview ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </Button>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Total Staged:</span>
                  <span className="font-bold text-foreground">{totalAmount}</span>
                  <span className="text-muted-foreground">({totalItems} items)</span>
                </div>
                {previewData?.summary?.already_synced_count ? (
                  <Badge variant="outline" className="text-[11px] bg-blue-50 text-blue-700 dark:bg-blue-950/40 border-blue-200">
                    {previewData.summary.already_synced_count} in QuickBooks
                  </Badge>
                ) : null}
              </div>
            </div>

            {isLoadingPreview ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-2">
                <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
                <p className="text-xs font-medium">Resolving QuickBooks Chart of Accounts &amp; Vendors...</p>
              </div>
            ) : !previewData?.items || previewData.items.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-lg border-border/80 p-6 space-y-2">
                <CheckCircle2 className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
                <h4 className="text-sm font-semibold text-foreground">No eligible purchase items found</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Purchase requests with status &ldquo;Ordered / Purchased&rdquo; and after are staged for QuickBooks Online sync.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs px-1 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="select-all"
                      checked={selectedRequestIds.length === previewData.items.length && previewData.items.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                    <label htmlFor="select-all" className="cursor-pointer font-medium">
                      Select All ({selectedRequestIds.length}/{previewData.items.length} selected)
                    </label>
                  </div>
                  <span>Click an item to inspect target payload</span>
                </div>

                <div className="space-y-2.5">
                  {previewData.items.map((item) => {
                    const isSelected = selectedRequestIds.includes(item.request_id);
                    const isExpanded = expandedPayloadId === item.request_id;

                    return (
                      <div
                        key={item.request_id}
                        onClick={() => {
                          setDetailsItem(item);
                          setIsDetailsOpen(true);
                        }}
                        className={`rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? "border-emerald-500/60 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-xs hover:border-emerald-500"
                            : "border-border/70 bg-card hover:border-border hover:bg-muted/30"
                        }`}
                      >
                        <div className="p-3.5 flex items-start gap-3">
                          <div onClick={(e) => e.stopPropagation()} className="mt-1">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleToggleSelect(item.request_id)}
                            />
                          </div>

                          <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-foreground">
                                  REQ-#{item.request_id}
                                </span>
                                <span className="text-xs text-muted-foreground font-mono bg-muted/60 px-1.5 py-0.5 rounded">
                                  Ref: {item.ref_no || "-"}
                                </span>
                                {(item.status || item.request_status) && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-muted/40 text-muted-foreground border-border/80">
                                    {String(item.status || item.request_status).replace(/_/g, " ")}
                                  </Badge>
                                )}
                                {item.attachments_count && item.attachments_count > 0 ? (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-mono gap-0.5 shrink-0 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800" title={`${item.attachments_count} document(s) attached`}>
                                    <Paperclip className="h-2.5 w-2.5" />
                                    <span>{item.attachments_count} attachment{item.attachments_count > 1 ? 's' : ''}</span>
                                  </Badge>
                                ) : null}
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] uppercase font-bold tracking-wider ${
                                    item.readiness === "ALREADY_SYNCED"
                                      ? "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40"
                                      : item.readiness === "ERROR"
                                      ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40"
                                      : "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40"
                                  }`}
                                >
                                  {item.readiness === "ALREADY_SYNCED" ? "Synced in QBO" : item.readiness === "ERROR" ? "Action Required" : "Ready to Sync"}
                                </Badge>
                              </div>

                              <div className="text-right">
                                <span className="text-sm font-bold text-foreground">
                                  {item.formatted_amount}
                                </span>
                                <span className="block text-[11px] text-muted-foreground">
                                  Date: {item.payment_date}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 text-xs">
                              <div className="p-2 rounded-md bg-muted/40 border border-border/50 space-y-1">
                                <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-semibold">
                                  <Building2 className="h-3 w-3 text-indigo-500" />
                                  <span>QuickBooks Vendor</span>
                                </div>
                                <div className="font-medium text-foreground truncate" title={item.vendor_resolution.name}>
                                  {item.vendor_resolution.name}
                                </div>
                                <span className="text-[10px] text-muted-foreground block">
                                  {item.vendor_resolution.badge}
                                </span>
                              </div>

                              <div className="p-2 rounded-md bg-muted/40 border border-border/50 space-y-1">
                                <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-semibold">
                                  <Tag className="h-3 w-3 text-emerald-500" />
                                  <span>Expense Account</span>
                                </div>
                                <div className="font-medium text-foreground truncate" title={item.expense_account_resolution.name}>
                                  {item.expense_account_resolution.name}
                                </div>
                                <span className="text-[10px] text-muted-foreground block">
                                  {item.category.split(" - ")[0]}
                                </span>
                              </div>

                              <div className="p-2 rounded-md bg-muted/40 border border-border/50 space-y-1">
                                <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-semibold">
                                  <CreditCard className="h-3 w-3 text-amber-500" />
                                  <span>Payment Account</span>
                                </div>
                                <div className="font-medium text-foreground truncate" title={item.payment_account_resolution.name}>
                                  {item.payment_account_resolution.name}
                                </div>
                                <span className="text-[10px] text-muted-foreground block">
                                  {item.payment_method} ({item.payment_account_resolution.payment_type})
                                </span>
                              </div>
                            </div>

                            {item.validation_notes.length > 0 && (
                              <div className="space-y-1 pt-1">
                                {item.validation_notes.map((note, nIdx) => (
                                  <div key={nIdx} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    <span>{note}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="pt-1 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setDetailsItem(item);
                                  setIsDetailsOpen(true);
                                }}
                                className="h-6 px-2 text-[11px] text-primary hover:text-primary/80 font-medium flex items-center gap-1 hover:bg-primary/10"
                              >
                                <Eye className="h-3 w-3" />
                                <span>View All Details</span>
                              </Button>

                              <button
                                type="button"
                                onClick={() => setExpandedPayloadId(isExpanded ? null : item.request_id)}
                                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium"
                              >
                                <span>{isExpanded ? "Hide JSON Payload" : "Inspect QuickBooks JSON Payload"}</span>
                                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              </button>
                            </div>

                            {isExpanded && (
                              <div className="mt-2 p-3 rounded-lg bg-muted/80 border border-border/60 text-[11px] font-mono overflow-x-auto">
                                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1.5">
                                  Projected POST /v3/company/purchase Payload
                                </div>
                                <pre className="text-xs text-foreground/90 whitespace-pre-wrap">
                                  {JSON.stringify(item.projected_payload, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "FILE_EXPORT" && (
          <div className="p-4 sm:p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Last Exported Status Banner */}
            <div className="rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/30 p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <History className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[11px] font-semibold text-emerald-900 dark:text-emerald-200 block">
                    Last Exported Date Time
                  </span>
                  <span className="text-xs font-mono font-medium text-emerald-700 dark:text-emerald-300">
                    {lastExportedAt ? formatDisplayDateTime(lastExportedAt) : "Never (Initial Export)"}
                  </span>
                </div>
              </div>
              {lastExportedAt && (
                <Badge variant="outline" className="border-emerald-300 dark:border-emerald-700 bg-white/80 dark:bg-zinc-900 text-emerald-800 dark:text-emerald-300 text-[10px] font-mono">
                  Auto +1s Next Range
                </Badge>
              )}
            </div>

            {/* Export Mode / Package Type */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground">Select Export Package</Label>
              <div className="space-y-2">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExportMode("BUNDLE")}
                  onKeyDown={(e) => e.key === "Enter" && setExportMode("BUNDLE")}
                  className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all text-left ${
                    exportMode === "BUNDLE"
                      ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 shadow-xs"
                      : "border-border/70 hover:bg-muted/30"
                  }`}
                >
                  <div
                    className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                      exportMode === "BUNDLE"
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-muted-foreground/50"
                    }`}
                  >
                    {exportMode === "BUNDLE" && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  </div>
                  <div className="space-y-0.5 flex-1">
                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5 flex-wrap">
                      <FolderArchive className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Complete QuickBooks Package (.zip)</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 px-1.5 py-0.2 rounded font-medium">
                        Recommended
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Includes Excel file, all systematically renamed PDF attachments, and Reconciliation Manifest.
                    </p>
                  </div>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExportMode("XLSX")}
                  onKeyDown={(e) => e.key === "Enter" && setExportMode("XLSX")}
                  className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all text-left ${
                    exportMode === "XLSX"
                      ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 shadow-xs"
                      : "border-border/70 hover:bg-muted/30"
                  }`}
                >
                  <div
                    className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                      exportMode === "XLSX"
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-muted-foreground/50"
                    }`}
                  >
                    {exportMode === "XLSX" && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  </div>
                  <div className="space-y-0.5 flex-1">
                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>QuickBooks Online Spreadsheet (.xlsx)</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Formatted with Payee, Payment Date, Category (GL Code), Amount, and Class (Dept).
                    </p>
                  </div>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExportMode("CSV")}
                  onKeyDown={(e) => e.key === "Enter" && setExportMode("CSV")}
                  className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all text-left ${
                    exportMode === "CSV"
                      ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 shadow-xs"
                      : "border-border/70 hover:bg-muted/30"
                  }`}
                >
                  <div
                    className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                      exportMode === "CSV"
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-muted-foreground/50"
                    }`}
                  >
                    {exportMode === "CSV" && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  </div>
                  <div className="space-y-0.5 flex-1">
                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>QuickBooks Transactions (.csv)</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Standardized columns formatted for direct QuickBooks Online bill / expense CSV import.
                    </p>
                  </div>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExportMode("DOCUMENTS")}
                  onKeyDown={(e) => e.key === "Enter" && setExportMode("DOCUMENTS")}
                  className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all text-left ${
                    exportMode === "DOCUMENTS"
                      ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 shadow-xs"
                      : "border-border/70 hover:bg-muted/30"
                  }`}
                >
                  <div
                    className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                      exportMode === "DOCUMENTS"
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-muted-foreground/50"
                    }`}
                  >
                    {exportMode === "DOCUMENTS" && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  </div>
                  <div className="space-y-0.5 flex-1">
                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <FolderArchive className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Renamed PDF Documents Package (.zip)</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      All receipts and invoice PDFs systematically renamed for QuickBooks bulk receipt upload.
                    </p>
                  </div>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExportMode("RECONCILIATION")}
                  onKeyDown={(e) => e.key === "Enter" && setExportMode("RECONCILIATION")}
                  className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all text-left ${
                    exportMode === "RECONCILIATION"
                      ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 shadow-xs"
                      : "border-border/70 hover:bg-muted/30"
                  }`}
                >
                  <div
                    className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                      exportMode === "RECONCILIATION"
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-muted-foreground/50"
                    }`}
                  >
                    {exportMode === "RECONCILIATION" && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  </div>
                  <div className="space-y-0.5 flex-1">
                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Reconciliation Manifest (.csv)</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Summary table mapping transaction amounts, GL codes, and attached document filenames.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Type Toggle: Today's Records | Date & Time Range | Month & Year */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">Record Filter Scope</Label>
                <div className="flex items-center p-0.5 bg-muted rounded-lg border border-border/60">
                  <button
                    type="button"
                    onClick={handleSetTodayPreset}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all flex items-center gap-1 ${
                      filterType === "TODAY"
                        ? "bg-emerald-600 text-white shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Sun className="h-3 w-3" />
                    <span>Only Today</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType("DATETIME_RANGE")}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                      filterType === "DATETIME_RANGE"
                        ? "bg-background text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Date &amp; Time Range
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType("MONTH_YEAR")}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                      filterType === "MONTH_YEAR"
                        ? "bg-background text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Month &amp; Year
                  </button>
                </div>
              </div>

              {/* Scope Details */}
              {filterType === "TODAY" ? (
                <div className="rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                      <Sun className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      Exporting Today's Completed Records ({formatDisplayDate(now)})
                    </span>
                    <Badge className="bg-emerald-600 text-white text-[10px]">Today Only</Badge>
                  </div>
                  <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
                    Filters records that moved to Completed or had their status changed today starting from <strong>00:00:00</strong> up to <strong>now</strong>.
                  </p>
                </div>
              ) : filterType === "DATETIME_RANGE" ? (
                <div className="space-y-3 rounded-xl border border-border/70 bg-muted/30 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      Filter Records by Datetime Range
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleResetToLastExport}
                      className="h-6 text-[10px] px-2 gap-1 text-muted-foreground hover:text-foreground"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reset to Last Export +1s
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                        <span>From (Start)</span>
                        {lastExportedAt && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                            Last + 1 sec
                          </span>
                        )}
                      </Label>
                      <Input
                        type="datetime-local"
                        step="1"
                        value={startDateTime}
                        onChange={(e) => setStartDateTime(e.target.value)}
                        className="h-9 text-xs font-mono bg-background"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">
                        To (End)
                      </Label>
                      <Input
                        type="datetime-local"
                        step="1"
                        value={endDateTime}
                        onChange={(e) => setEndDateTime(e.target.value)}
                        className="h-9 text-xs font-mono bg-background"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-border/70 bg-muted/30 p-3.5">
                  {/* Year Selector */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      Year
                    </Label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger className="h-9 text-xs bg-background">
                        <SelectValue placeholder="Select Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((y) => (
                          <SelectItem key={y.value} value={y.value} className="text-xs">
                            {y.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Month Selector */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      Month
                    </Label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger className="h-9 text-xs bg-background">
                        <SelectValue placeholder="Select Month" />
                      </SelectTrigger>
                      <SelectContent className="max-h-56">
                        {MONTHS.map((m) => (
                          <SelectItem key={m.value} value={m.value} className="text-xs">
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {/* Compact Info Pill */}
            <div className="rounded-xl border border-border/70 bg-muted/40 p-2.5 text-xs text-muted-foreground flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-[11px] leading-tight">
                Only completed &amp; paid requests are exported with mapped Vendor, GL Code, Department, and Document attachments.
              </span>
            </div>
          </div>
        )}

        <div className="m-0 p-4 px-5 border-t border-border/60 bg-muted/20 flex flex-row items-center justify-between gap-2.5">
          <div className="text-xs text-muted-foreground">
            {activeTab === "PREVIEW_SYNC" ? (
              <span>
                {selectedRequestIds.length} item(s) selected for sync
              </span>
            ) : (
              <span>Ready for download</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8.5 px-3.5 text-xs font-medium"
              onClick={() => onOpenChange(false)}
              disabled={isExporting || isSyncing}
            >
              Close
            </Button>

            {activeTab === "PREVIEW_SYNC" ? (
              <Button
                type="button"
                size="sm"
                className="h-8.5 px-4 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                onClick={handleSyncSelected}
                disabled={isSyncing || selectedRequestIds.length === 0}
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Syncing to QuickBooks...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-3.5 w-3.5" />
                    <span>Sync Selected ({selectedRequestIds.length}) to QuickBooks</span>
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                className="h-8.5 px-4 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    <span>Export &amp; Download</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
        {/* Additional Info Pop-up Modal */}
        <QuickBooksItemDetailsDialog
          item={detailsItem}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          isConnected={isConnected}
        />
      </DialogContent>
    </Dialog>
  );
}
