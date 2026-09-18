import { QuickBooksItemDetailsDialog } from "./QuickBooksItemDetailsDialog";
import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  FileSpreadsheet,
  Paperclip,
  Download,
  Clock,
  Loader2,
  CheckCircle2,
  FolderArchive,
  FileText,
  Zap,
  AlertTriangle,
  RefreshCw,
  Building2,
  CreditCard,
  Tag,
  Calendar,
  X,
  ChevronDown,
  Search,
  ExternalLink,
  Database,
  Layers,
  Terminal,
  ShieldCheck,
  CheckCheck,
  SlidersHorizontal,
  Trash2,
  ChevronRight,
  Eye,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  exportQuickBooksCsv,
  exportQuickBooksXlsx,
  exportQuickBooksBundle,
  exportQuickBooksDocuments,
  exportQuickBooksReconciliation,
  exportSingleRequestQuickBooksXlsx,
  exportSingleRequestQuickBooksCsv,
  exportSingleRequestQuickBooksBundle,
  getQuickBooksPreview,
  syncQuickBooksBatch,
  type QuickBooksPreviewItem,
  type QuickBooksPreviewResponse,
} from "@/services/purchasingService";
import { apiClient } from "@/services/apiClient";

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

const QB_LAST_EXPORTED_KEY = "qb_last_exported_at";

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

export default function QuickBooksPage() {
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
  const [previewData, setPreviewData] = useState<QuickBooksPreviewResponse | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [selectedRequestIds, setSelectedRequestIds] = useState<number[]>([]);

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
  const [filterType, setFilterType] = useState<"TODAY" | "DATETIME_RANGE" | "MONTH_YEAR">("TODAY");
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

  // Fetch Preview / Staged Data
  const fetchPreview = async () => {
    setIsLoadingPreview(true);
    try {
      const isDateActive = Boolean(startDate || endDate);
      const yearParam = (!isDateActive && selectedYear !== "ALL") ? parseInt(selectedYear, 10) : null;
      const monthParam = (!isDateActive && selectedMonth !== "ALL") ? parseInt(selectedMonth, 10) : null;
      const data = await getQuickBooksPreview({
        status: "COMPLETED",
        start_date: startDate ? startDate : null,
        end_date: endDate ? endDate : null,
        year: yearParam,
        month: monthParam,
      });
      setPreviewData(data);
      const readyIds = (data.items || [])
        .filter((item) => item.readiness === "READY" || item.readiness === "READY_WITH_NOTES")
        .map((item) => item.request_id);
      setSelectedRequestIds(readyIds);
    } catch (err: any) {
      toast.error(err.message || "Failed to load QuickBooks preview staging");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  useEffect(() => {
    fetchPreview();
  }, [startDate, endDate, selectedYear, selectedMonth]);

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

  // Filtered items in staging grid
  const filteredItems = useMemo(() => {
    if (!previewData?.items) return [];
    return previewData.items.filter((item) => {
      // Status Filter
      if (statusFilter === "READY") {
        if (item.readiness !== "READY" && item.readiness !== "READY_WITH_NOTES") return false;
      } else if (statusFilter === "SYNCED") {
        if (item.readiness !== "ALREADY_SYNCED") return false;
      } else if (statusFilter === "ERROR") {
        if (item.readiness !== "ERROR") return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const cleanId = q.replace(/^(?:req-#|req-|rec-#|rec-|#)/i, "").trim();
        const reqStr = String(item.request_id || "");
        const matchTitle = (item.product_name || "").toLowerCase().includes(q);
        const matchVendor = (item.raw_payee || "").toLowerCase().includes(q);
        const matchReq =
          `req-#${reqStr}`.toLowerCase().includes(q) ||
          reqStr.includes(q) ||
          (cleanId.length > 0 && reqStr.includes(cleanId));
        const matchRef = (item.ref_no || "").toLowerCase().includes(q);
        const matchGl = (item.category || "").toLowerCase().includes(q);
        const matchAmt = String(item.amount || "").includes(q);
        if (!matchTitle && !matchVendor && !matchReq && !matchRef && !matchGl && !matchAmt) return false;
      }

      return true;
    });
  }, [previewData, statusFilter, searchQuery]);

  // Handle Multi-Selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRequestIds(filteredItems.map((i) => i.request_id));
    } else {
      setSelectedRequestIds([]);
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedRequestIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Sync Batch Action
  const handleBatchSync = async () => {
    if (selectedRequestIds.length === 0) {
      toast.error("Please select at least one item to sync");
      return;
    }

    setIsSyncing(true);
    try {
      const res = await syncQuickBooksBatch(selectedRequestIds);
      if (res.synced > 0) {
        toast.success(`Successfully synchronized ${res.synced} transaction(s) to QuickBooks Online!`);
      }
      if (res.failed > 0) {
        toast.error(`${res.failed} transaction(s) failed to sync. Inspect payloads for details.`);
      }
      await fetchPreview();
    } catch (err: any) {
      toast.error(err.message || "Failed to complete QuickBooks batch sync");
    } finally {
      setIsSyncing(false);
    }
  };

  // Delete / Remove from QuickBooks state
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<QuickBooksPreviewItem | null>(null);

  // Handle Remove from QuickBooks
  const handleDeleteFromQuickBooks = async (item: QuickBooksPreviewItem) => {
    setDeletingId(item.request_id);
    try {
      const pId = item.existing_purchase_id || item.projected_payload?.Id;
      const url = pId
        ? `/api/quickbooks/expenses/${item.request_id}?purchase_id=${encodeURIComponent(pId)}`
        : `/api/quickbooks/expenses/${item.request_id}`;
      await apiClient.delete(url);
      toast.success(`Removed REQ-#${item.request_id} from QuickBooks Online!`);
      setDeleteConfirmItem(null);
      if (inspectorItem?.request_id === item.request_id) {
        setIsInspectorOpen(false);
      }
      await fetchPreview();
    } catch (err: any) {
      toast.error(err.message || `Failed to remove REQ-#${item.request_id} from QuickBooks`);
    } finally {
      setDeletingId(null);
    }
  };

  // Sync Single Item
  const handleSingleSync = async (item: QuickBooksPreviewItem) => {
    setSyncingSingleId(item.request_id);
    try {
      const res = await apiClient.post<any>(`/api/quickbooks/expenses/${item.request_id}`, {});
      toast.success(`Synced REQ-#${item.request_id} to QuickBooks as Purchase #${res.quickbooks_purchase_id || "Created"}`);
      await fetchPreview();
    } catch (err: any) {
      toast.error(err.message || `Failed to sync REQ-#${item.request_id}`);
    } finally {
      setSyncingSingleId(null);
    }
  };

  // Disconnect QuickBooks
  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await apiClient.post("/api/quickbooks/disconnect", {});
      toast.success("Disconnected QuickBooks Online integration");
      setIsDisconnectOpen(false);
      await fetchPreview();
    } catch (err: any) {
      toast.error(err.message || "Failed to disconnect QuickBooks");
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Run direct query
  const handleExecuteQuery = async (queryText?: string) => {
    const q = queryText || queryInput;
    setIsQuerying(true);
    try {
      const res = await apiClient.get<any>(`/api/quickbooks/query?q=${encodeURIComponent(q)}`);
      setQueryResult(res);
      toast.success("Query executed successfully");
    } catch (err: any) {
      toast.error(err.message || "QuickBooks query failed");
      setQueryResult({ error: err.message });
    } finally {
      setIsQuerying(false);
    }
  };

  // Export File Package
  const handleExport = async () => {
    setIsExporting(true);
    const nowIso = new Date().toISOString();
    try {
      let idsParam: string[] | undefined;
      let statusParam: string | undefined = "COMPLETED";
      let yearParam: number | null = null;
      let monthParam: number | null = null;
      let startDt: string | null = null;
      let endDt: string | null = null;

      if (filterType === "TODAY") {
        const todayStr = new Date().toISOString().split("T")[0];
        startDt = `${todayStr} 00:00:00`;
        endDt = `${todayStr} 23:59:59`;
      } else if (filterType === "DATETIME_RANGE") {
        startDt = startDateTime ? startDateTime.replace("T", " ") : null;
        endDt = endDateTime ? endDateTime.replace("T", " ") : null;
      } else {
        yearParam = selectedYear !== "ALL" ? parseInt(selectedYear, 10) : null;
        monthParam = selectedMonth !== "ALL" ? parseInt(selectedMonth, 10) : null;
      }

      if (exportMode === "BUNDLE") {
        await exportQuickBooksBundle(idsParam, statusParam, yearParam, monthParam, startDt, endDt);
      } else if (exportMode === "XLSX") {
        await exportQuickBooksXlsx(idsParam, statusParam, yearParam, monthParam, startDt, endDt);
      } else if (exportMode === "CSV") {
        await exportQuickBooksCsv(idsParam, statusParam, yearParam, monthParam, startDt, endDt);
      } else if (exportMode === "DOCUMENTS") {
        await exportQuickBooksDocuments(idsParam, statusParam, yearParam, monthParam, startDt, endDt);
      } else if (exportMode === "RECONCILIATION") {
        await exportQuickBooksReconciliation(idsParam, statusParam, yearParam, monthParam, startDt, endDt);
      }

      localStorage.setItem(QB_LAST_EXPORTED_KEY, nowIso);
      setLastExportedAt(nowIso);
      toast.success("Export package downloaded successfully!");
    } catch (err: any) {
      toast.error(err.message || "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const isConnected = previewData?.connection?.is_connected ?? false;
  const companyName = previewData?.connection?.company_name || "QuickBooks Online Company";
  const realmId = previewData?.connection?.realm_id || "Not Connected";
  const totalStaged = previewData?.items?.length || 0;
  const totalAmountStr = previewData?.summary?.formatted_total_amount || "$0.00";
  const readyCount = previewData?.summary?.ready_count || 0;
  const alreadySyncedCount = previewData?.summary?.already_synced_count || 0;

  const selectedTotalAmount = useMemo(() => {
    if (!previewData?.items) return "$0.00";
    const sum = previewData.items
      .filter((i) => selectedRequestIds.includes(i.request_id))
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
    return `$${sum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [previewData, selectedRequestIds]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      {/* Breadcrumb & Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5 font-medium">
            <Link to="/purchasing/requests" className="hover:text-foreground transition-colors">
              Purchasing &amp; AP
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground font-semibold">QuickBooks Online Integration &amp; Exports</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs border border-emerald-500/20">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                <span>QuickBooks Online Integration</span>
                <Badge variant="outline" className="text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                  SaasAnt Staging Engine
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pre-flight staging ledger, field-to-field automated matching, direct REST sync, and complete transaction bundles.
              </p>
            </div>
          </div>
        </div>

        {/* Connection Widget */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {isConnected ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 text-xs shadow-2xs">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="font-bold truncate max-w-[200px]">{companyName}</span>
              </div>
              <span className="text-emerald-600 dark:text-emerald-400/80">•</span>
              <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300/80">Realm: {realmId}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDisconnectOpen(true)}
                className="h-6 px-2 text-[11px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-1 rounded"
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50/80 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 text-xs">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                <span className="font-semibold">QuickBooks Disconnected</span>
              </div>
              <Button
                size="sm"
                className="h-8 text-xs font-semibold gap-1.5 bg-[#028340] hover:bg-[#027037] text-white shadow-xs"
                onClick={() => {
                  window.location.href = "/api/quickbooks/connect";
                }}
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Connect QuickBooks</span>
              </Button>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={fetchPreview}
            disabled={isLoadingPreview}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoadingPreview ? "animate-spin text-emerald-600" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* SaasAnt Top Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/70 shadow-2xs bg-card/60 backdrop-blur-xs relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Staged Ledger Value</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{totalAmountStr}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <span className="font-semibold text-foreground">{totalStaged}</span> completed items ready
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-2xs">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-2xs bg-card/60 backdrop-blur-xs relative overflow-hidden group hover:border-blue-500/50 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pre-Flight Validated</p>
              <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {readyCount} / {totalStaged}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {totalStaged > 0 ? `${Math.round((readyCount / totalStaged) * 100)}% Auto-matched & Clean` : "No items"}
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-2xs">
              <CheckCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-2xs bg-card/60 backdrop-blur-xs relative overflow-hidden group hover:border-indigo-500/50 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">QBO Sync History</p>
              <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                {alreadySyncedCount}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Recorded in QuickBooks Online</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-2xs">
              <Database className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-2xs bg-card/60 backdrop-blur-xs relative overflow-hidden group hover:border-amber-500/50 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Selected for Batch</p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {selectedTotalAmount}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">{selectedRequestIds.length} item(s) selected</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-2xs">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Workflow Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-2">
          <TabsList className="h-9 p-1 bg-muted/60 border border-border/60 rounded-lg">
            <TabsTrigger value="staging" className="text-xs font-semibold gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-2xs">
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              <span>Live Staging &amp; Direct Sync</span>
              {totalStaged > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-1 bg-muted font-bold">
                  {totalStaged}
                </Badge>
              )}
            </TabsTrigger>

            <TabsTrigger value="export" className="text-xs font-semibold gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-2xs">
              <Download className="h-3.5 w-3.5 text-blue-600" />
              <span>File Export Packages (.xlsx / .csv / .zip)</span>
            </TabsTrigger>

            <TabsTrigger value="explorer" className="text-xs font-semibold gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-2xs">
              <Terminal className="h-3.5 w-3.5 text-purple-600" />
              <span>QuickBooks SQL Explorer</span>
            </TabsTrigger>
          </TabsList>

          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" />
            <span>Last Exported: <strong className="text-foreground">{formatDisplayDateTime(lastExportedAt)}</strong></span>
          </div>
        </div>

        {/* TAB 1: LIVE STAGING & DIRECT SYNC (SAASANT TRANSACTIONS GRID) */}
        <TabsContent value="staging" className="space-y-4 m-0">
          {/* SaasAnt Filter & Control Bar */}
          <Card className="border-border/70 shadow-2xs bg-card">
            <CardContent className="p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                {/* Search Bar */}
                <div className="relative min-w-[220px] max-w-sm flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search ID, vendor, account, ref no..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8.5 text-xs pl-8 bg-background/80"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex items-center rounded-lg border border-border/80 bg-muted/40 p-0.5">
                  {[
                    { id: "ALL", label: "All" },
                    { id: "READY", label: "Ready to Sync" },
                    { id: "SYNCED", label: "In QuickBooks" },
                    { id: "ERROR", label: "Issues" },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setStatusFilter(st.id)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${statusFilter === st.id
                          ? "bg-background text-foreground font-semibold shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                {/* Date Range Filter Group */}
                <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg border border-border/80 bg-muted/20">
                  <div className="flex items-center gap-1 px-1.5 text-xs font-semibold text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="hidden sm:inline">Date:</span>
                  </div>

                  {/* Quick Presets */}
                  <Select value={datePreset} onValueChange={(val) => applyDatePreset(val)}>
                    <SelectTrigger className="h-7.5 text-xs w-28 bg-background border-border/60">
                      <SelectValue placeholder="Preset" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL" className="text-xs">All Time</SelectItem>
                      <SelectItem value="TODAY" className="text-xs">Today</SelectItem>
                      <SelectItem value="YESTERDAY" className="text-xs">Yesterday</SelectItem>
                      <SelectItem value="LAST_7_DAYS" className="text-xs">Last 7 Days</SelectItem>
                      <SelectItem value="THIS_MONTH" className="text-xs">This Month</SelectItem>
                      <SelectItem value="CUSTOM" className="text-xs">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* From Date */}
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-muted-foreground">From</span>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setDatePreset("CUSTOM");
                      }}
                      className="h-7.5 text-xs w-32 px-2 bg-background border-border/60 font-mono"
                      title="Start Date (e.g. 2026-09-16)"
                    />
                  </div>

                  {/* To Date */}
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-muted-foreground">To</span>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setDatePreset("CUSTOM");
                      }}
                      placeholder="Optional"
                      className="h-7.5 text-xs w-32 px-2 bg-background border-border/60 font-mono"
                      title="End Date (leave empty to filter only the From date)"
                    />
                  </div>

                  {/* Clear Date Button */}
                  {(startDate || endDate) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearDateFilter}
                      className="h-7.5 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                      title="Clear date filter"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span className="hidden md:inline">Clear</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Staging Summary */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>Showing <strong className="text-foreground">{filteredItems.length}</strong> of {totalStaged} transactions</span>
              </div>
            </CardContent>
          </Card>

          {/* SaasAnt Floating Batch Action Bar (When items selected) */}
          {selectedRequestIds.length > 0 && (
            <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-gradient-to-r from-emerald-900/90 to-slate-900 text-white shadow-md border border-emerald-500/30 animate-in slide-in-from-top duration-200">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs border border-emerald-500/30">
                  {selectedRequestIds.length}
                </div>
                <div className="text-xs">
                  <span className="font-bold">{selectedRequestIds.length} transaction(s) selected</span>
                  <span className="text-emerald-300 ml-2 font-mono font-semibold">Total: {selectedTotalAmount}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRequestIds([])}
                  className="h-7.5 px-2.5 text-xs text-zinc-300 hover:text-white hover:bg-white/10"
                >
                  Clear Selection
                </Button>

                <Button
                  size="sm"
                  onClick={handleBatchSync}
                  disabled={isSyncing || !isConnected}
                  className="h-7.5 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Syncing to QuickBooks...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-3.5 w-3.5" />
                      <span>Sync Selected ({selectedRequestIds.length}) to QuickBooks Online</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* SaasAnt Transactions Spreadsheet Table */}
          <Card className="border-border/70 shadow-xs overflow-hidden bg-card">
            <div className="overflow-x-auto min-h-[350px]">
              {isLoadingPreview ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                  <p className="text-xs font-medium">Generating pre-flight ledger mapping against QuickBooks Chart of Accounts...</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-16 px-4 space-y-3">
                  <div className="h-12 w-12 rounded-full bg-muted/80 text-muted-foreground mx-auto flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 opacity-60" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">No matching staged items found</h4>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Transactions must have status "COMPLETED" to be staged for QuickBooks Online export and synchronization.
                  </p>
                </div>
              ) : (
                <Table className="text-xs">
                  <TableHeader className="bg-muted/50 border-b border-border/80">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-10 px-3">
                        <Checkbox
                          checked={selectedRequestIds.length === filteredItems.length && filteredItems.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="w-24 font-bold text-foreground">Request #</TableHead>
                      <TableHead className="w-28 font-bold text-foreground">Date</TableHead>
                      <TableHead className="w-48 font-bold text-foreground">QuickBooks Vendor</TableHead>
                      <TableHead className="w-56 font-bold text-foreground">Expense Account (GL)</TableHead>
                      <TableHead className="w-44 font-bold text-foreground">Payment Account</TableHead>
                      <TableHead className="min-w-[200px] font-bold text-foreground">Line Item / Product</TableHead>
                      <TableHead className="w-28 text-right font-bold text-foreground">Amount (USD)</TableHead>
                      <TableHead className="w-36 font-bold text-foreground">Pre-Flight Status</TableHead>
                      <TableHead className="w-32 text-right font-bold text-foreground pr-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => {
                      const isSelected = selectedRequestIds.includes(item.request_id);
                      const isReady = item.readiness === "READY" || item.readiness === "READY_WITH_NOTES";
                      const isSynced = item.readiness === "ALREADY_SYNCED";
                      const isCurrentlySyncing = syncingSingleId === item.request_id;

                      return (
                        <TableRow
                          key={item.request_id}
                          onClick={() => {
                            setInspectorItem(item);
                            setIsInspectorOpen(true);
                          }}
                          className={`transition-colors border-b border-border/50 cursor-pointer ${isSelected
                              ? "bg-emerald-50/40 dark:bg-emerald-950/15"
                              : "hover:bg-muted/60"
                            }`}
                        >
                          <TableCell className="px-3" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleToggleSelect(item.request_id)}
                            />
                          </TableCell>

                          {/* Request ID */}
                          <TableCell className="font-semibold" onClick={(e) => e.stopPropagation()}>
                            <Link
                              to={`/purchasing/requests/${item.request_id}`}
                              className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
                            >
                              <span>REQ-#{item.request_id}</span>
                              <ExternalLink className="h-3 w-3 opacity-60" />
                            </Link>
                          </TableCell>

                          {/* Txn Date */}
                          <TableCell className="text-muted-foreground whitespace-nowrap">
                            {item.payment_date}
                          </TableCell>

                          {/* Vendor */}
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-semibold text-foreground flex items-center gap-1.5 truncate max-w-[180px]">
                                <Building2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                <span className="truncate">{item.vendor_resolution?.name || item.raw_payee}</span>
                              </div>
                              {item.vendor_resolution?.status === "EXISTS" ? (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 font-medium">
                                  Mapped in QBO
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800 font-medium">
                                  Auto-Create in QBO
                                </Badge>
                              )}
                            </div>
                          </TableCell>

                          {/* Expense Account */}
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-foreground truncate max-w-[200px] flex items-center gap-1.5">
                                <Tag className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                <span className="truncate">{item.expense_account_resolution?.name || item.category}</span>
                              </div>
                              {item.expense_account_resolution?.acct_num ? (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                                  GL: {item.expense_account_resolution.acct_num}
                                </Badge>
                              ) : (
                                <span className="text-[10px] text-muted-foreground font-mono truncate block">
                                  {item.category?.split(":")[0]}
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* Payment Account */}
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-muted-foreground truncate max-w-[160px] flex items-center gap-1.5">
                                <CreditCard className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="truncate">{item.payment_account_resolution?.name || "Default Bank Account"}</span>
                              </div>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                                {item.payment_method || "Credit Card"}
                              </Badge>
                            </div>
                          </TableCell>

                          {/* Product Description */}
                          <TableCell>
                            <div className="max-w-[240px] space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-foreground line-clamp-1">{item.product_name}</span>
                                {item.attachments_count && item.attachments_count > 0 ? (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-mono gap-0.5 shrink-0 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800" title={`${item.attachments_count} attachment(s) will sync to QuickBooks`}>
                                    <Paperclip className="h-2.5 w-2.5" />
                                    <span>{item.attachments_count}</span>
                                  </Badge>
                                ) : null}
                              </div>
                              {item.department && (
                                <span className="text-[10px] text-muted-foreground block">Class: {item.department}</span>
                              )}
                            </div>
                          </TableCell>

                          {/* Amount */}
                          <TableCell className="text-right font-mono font-bold text-foreground">
                            {item.formatted_amount || `$${item.amount?.toFixed(2)}`}
                          </TableCell>

                          {/* Pre-Flight Status */}
                          <TableCell>
                            {isReady ? (
                              <Badge className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 gap-1">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                <span>Ready to Sync</span>
                              </Badge>
                            ) : isSynced ? (
                              <Badge variant="secondary" className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 gap-1">
                                <Database className="h-3 w-3" />
                                <span>In QuickBooks</span>
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="text-[11px] font-semibold gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                <span>Review Required</span>
                              </Badge>
                            )}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setInspectorItem(item);
                                  setIsInspectorOpen(true);
                                }}
                                title="View all additional info and QuickBooks mappings"
                                className="h-7 px-2 text-xs text-primary hover:text-primary/80 font-medium gap-1 hover:bg-primary/10"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Details</span>
                              </Button>

                              <Button
                                size="sm"
                                variant={isSynced ? "outline" : "default"}
                                disabled={isCurrentlySyncing || !isConnected}
                                onClick={() => handleSingleSync(item)}
                                className={`h-7 px-2.5 text-xs font-semibold gap-1 ${!isSynced ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs" : ""
                                  }`}
                              >
                                {isCurrentlySyncing ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Zap className="h-3 w-3" />
                                )}
                                <span>{isSynced ? "Re-Sync" : "Sync"}</span>
                              </Button>

                              {isSynced && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={deletingId === item.request_id || !isConnected}
                                  onClick={() => setDeleteConfirmItem(item)}
                                  title="Remove transaction from QuickBooks Online"
                                  className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1"
                                >
                                  {deletingId === item.request_id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3.5 w-3.5" />
                                  )}
                                  <span className="hidden sm:inline">Remove</span>
                                </Button>
                              )}

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground">
                                    <ChevronDown className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44 text-xs">
                                  <DropdownMenuLabel>Export Row</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => exportSingleRequestQuickBooksXlsx(String(item.request_id))}>
                                    <FileSpreadsheet className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                                    <span>Download Excel (.xlsx)</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => exportSingleRequestQuickBooksCsv(String(item.request_id))}>
                                    <FileText className="h-3.5 w-3.5 mr-2 text-blue-600" />
                                    <span>Download CSV (.csv)</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => exportSingleRequestQuickBooksBundle(String(item.request_id))}>
                                    <FolderArchive className="h-3.5 w-3.5 mr-2 text-purple-600" />
                                    <span>Download Bundle (.zip)</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* TAB 2: FILE EXPORT PACKAGES (.XLSX / .CSV / .ZIP) */}
        <TabsContent value="export" className="space-y-4 m-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left 2 Cols: Mode Selection */}
            <div className="md:col-span-2 space-y-4">
              <Card className="border-border/70 shadow-2xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <FolderArchive className="h-4 w-4 text-emerald-600" />
                    <span>Select Transaction Export Package</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Download QuickBooks Online ready workbooks, documentation archives, and reconciliation reports.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    {
                      id: "BUNDLE",
                      label: "Full Package Bundle (.zip)",
                      badge: "Recommended",
                      desc: "Master .xlsx workbook, complete PDF invoices/receipts, and audit manifest for accounting archive.",
                      icon: FolderArchive,
                      color: "text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800",
                    },
                    {
                      id: "XLSX",
                      label: "QuickBooks Online Excel Import (.xlsx)",
                      badge: "Spreadsheet",
                      desc: "Formatted with 12 standard QBO columns: Payee, Date, Account, Method, Ref, Location, GL Code, Description, Amount.",
                      icon: FileSpreadsheet,
  Paperclip,
                      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
                    },
                    {
                      id: "CSV",
                      label: "QuickBooks Online Standard CSV (.csv)",
                      badge: "Flat File",
                      desc: "Comma-separated UTF-8 file formatted for QuickBooks Desktop / Online manual import.",
                      icon: FileText,
                      color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
                    },
                    {
                      id: "DOCUMENTS",
                      label: "Invoice & Attachment Documents Only (.zip)",
                      badge: "PDFs & Receipts",
                      desc: "All vendor invoice files, delivery slips, and quote PDFs organized into clean subdirectories.",
                      icon: Download,
                      color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
                    },
                    {
                      id: "RECONCILIATION",
                      label: "Audit & Monthly Reconciliation Ledger (.csv)",
                      badge: "Audit Trail",
                      desc: "Extended internal financial reconciliation dataset with PO numbers, approver notes, and line items.",
                      icon: ShieldCheck,
                      color: "text-slate-600 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800",
                    },
                  ].map((pkg) => {
                    const isSelected = exportMode === pkg.id;
                    const IconComp = pkg.icon;
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setExportMode(pkg.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${isSelected
                            ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/15 ring-1 ring-emerald-500 shadow-xs"
                            : "border-border/70 hover:border-border hover:bg-muted/30"
                          }`}
                      >
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 border ${pkg.color}`}>
                          <IconComp className="h-5 w-5" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-foreground">{pkg.label}</span>
                            <Badge variant="outline" className="text-[10px] font-semibold">
                              {pkg.badge}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{pkg.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Right 1 Col: Date Filters & Action */}
            <div className="space-y-4">
              <Card className="border-border/70 shadow-2xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-blue-600" />
                    <span>Export Time Horizon</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Filter transactions by completion timestamp.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Filter Mode</Label>
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/60 rounded-lg border border-border/70">
                      {[
                        { id: "TODAY", label: "Today" },
                        { id: "DATETIME_RANGE", label: "Range" },
                        { id: "MONTH_YEAR", label: "Month" },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setFilterType(f.id as any)}
                          className={`py-1 text-xs font-semibold rounded-md transition-all ${filterType === f.id
                              ? "bg-background text-foreground shadow-2xs"
                              : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filterType === "TODAY" && (
                    <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10 text-xs space-y-1.5">
                      <span className="font-semibold text-emerald-900 dark:text-emerald-200 block">Today's Batch</span>
                      <p className="text-muted-foreground text-[11px]">
                        Exports all purchase items completed today between 00:00:00 and 23:59:59.
                      </p>
                    </div>
                  )}

                  {filterType === "DATETIME_RANGE" && (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Start Datetime</Label>
                        <Input
                          type="datetime-local"
                          value={startDateTime}
                          onChange={(e) => setStartDateTime(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">End Datetime</Label>
                        <Input
                          type="datetime-local"
                          value={endDateTime}
                          onChange={(e) => setEndDateTime(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {filterType === "MONTH_YEAR" && (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Year</Label>
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                          <SelectTrigger className="h-8 text-xs">
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

                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Month</Label>
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Month" />
                          </SelectTrigger>
                          <SelectContent className="max-h-52">
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

                  <Button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="w-full text-xs font-semibold gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs mt-2"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Compiling Package...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5" />
                        <span>Download Export Package</span>
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: QUICKBOOKS SQL EXPLORER */}
        <TabsContent value="explorer" className="space-y-4 m-0">
          <Card className="border-border/70 shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Terminal className="h-4 w-4 text-purple-600" />
                <span>QuickBooks Online API SQL Console</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Run live read queries directly against your connected QuickBooks Online instance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground mr-1">Quick Queries:</span>
                {[
                  { label: "Chart of Accounts", q: "SELECT * FROM Account MAXRESULTS 20" },
                  { label: "Vendors", q: "SELECT * FROM Vendor MAXRESULTS 20" },
                  { label: "Purchases (Expenses)", q: "SELECT * FROM Purchase MAXRESULTS 20" },
                  { label: "Bank Accounts", q: "SELECT * FROM Account WHERE AccountType = 'Bank'" },
                ].map((chip) => (
                  <Button
                    key={chip.label}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setQueryInput(chip.q);
                      handleExecuteQuery(chip.q);
                    }}
                    className="h-7 text-[11px] font-mono"
                  >
                    {chip.label}
                  </Button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Input
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  placeholder="e.g. SELECT * FROM Account WHERE AccountType = 'Expense'"
                  className="h-9 text-xs font-mono bg-background"
                />
                <Button
                  onClick={() => handleExecuteQuery()}
                  disabled={isQuerying || !isConnected}
                  className="h-9 text-xs font-semibold gap-1.5 bg-purple-600 hover:bg-purple-500 text-white shadow-xs"
                >
                  {isQuerying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Terminal className="h-3.5 w-3.5" />}
                  <span>Execute SQL</span>
                </Button>
              </div>

              {queryResult && (
                <div className="mt-4 border rounded-lg bg-zinc-950 text-zinc-100 p-4 font-mono text-xs overflow-x-auto max-h-[400px]">
                  <pre>{JSON.stringify(queryResult, null, 2)}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete / Remove from QuickBooks Confirmation Dialog */}
      <Dialog open={!!deleteConfirmItem} onOpenChange={(open) => !open && setDeleteConfirmItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-rose-600">
              <Trash2 className="h-5 w-5" />
              <span>Remove Transaction from QuickBooks?</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              This will delete the Purchase/Expense transaction for <strong className="text-foreground font-mono">REQ-#{deleteConfirmItem?.request_id}</strong> ({deleteConfirmItem?.formatted_amount || `$${deleteConfirmItem?.amount?.toFixed(2)}`}) from your QuickBooks Online company ledger.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/30 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Vendor:</span>
              <span className="font-semibold text-foreground">{deleteConfirmItem?.vendor_resolution?.name || deleteConfirmItem?.raw_payee}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-bold text-foreground font-mono">{deleteConfirmItem?.formatted_amount || `$${deleteConfirmItem?.amount?.toFixed(2)}`}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium text-foreground">{deleteConfirmItem?.payment_date}</span>
            </div>
            {deleteConfirmItem?.existing_purchase_id && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">QBO Purchase ID:</span>
                <span className="font-mono font-bold text-rose-600">#{deleteConfirmItem.existing_purchase_id}</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirmItem(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={deletingId !== null}
              onClick={() => deleteConfirmItem && handleDeleteFromQuickBooks(deleteConfirmItem)}
              className="gap-1.5"
            >
              {deletingId !== null ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              <span>Yes, Delete from QuickBooks</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* All Additional Information & QuickBooks Mapping Pop-up Modal */}
      <QuickBooksItemDetailsDialog
        item={inspectorItem}
        open={isInspectorOpen}
        onOpenChange={setIsInspectorOpen}
        onSync={(item) => handleSingleSync(item)}
        isSyncing={syncingSingleId === inspectorItem?.request_id}
        onDelete={(item) => handleDeleteFromQuickBooks(item)}
        isDeleting={deletingId === inspectorItem?.request_id}
        isConnected={isConnected}
      />

      {/* Disconnect Confirmation Dialog */}
      <Dialog open={isDisconnectOpen} onOpenChange={setIsDisconnectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Disconnect QuickBooks Online?</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              This will revoke the active OAuth session for <strong>{companyName}</strong>. You will need to reconnect before syncing live transactions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setIsDisconnectOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isDisconnecting}
              onClick={handleDisconnect}
              className="text-xs font-semibold"
            >
              {isDisconnecting ? "Disconnecting..." : "Yes, Disconnect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
