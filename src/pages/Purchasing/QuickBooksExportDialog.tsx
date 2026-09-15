import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Loader2,
  CheckCircle2,
  FolderArchive,
  Zap,
  AlertTriangle,
  RefreshCw,
  Building2,
  CreditCard,
  Tag,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  exportQuickBooksCsv,
  exportQuickBooksBundle,
  exportQuickBooksDocuments,
  exportQuickBooksReconciliation,
  getQuickBooksPreview,
  syncQuickBooksBatch,
  type QuickBooksPreviewResponse,
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
type ExportMode = "CSV" | "BUNDLE" | "DOCUMENTS" | "RECONCILIATION";

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
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const [selectedMonth, setSelectedMonth] = useState<string>(String(currentMonth));
  const [exportMode, setExportMode] = useState<ExportMode>("CSV");
  const [isExporting, setIsExporting] = useState(false);

  // Staging Preview State
  const [previewData, setPreviewData] = useState<QuickBooksPreviewResponse | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [selectedRequestIds, setSelectedRequestIds] = useState<number[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [expandedPayloadId, setExpandedPayloadId] = useState<number | null>(null);

  const fetchPreview = async () => {
    setIsLoadingPreview(true);
    try {
      const yearParam = selectedYear !== "ALL" ? parseInt(selectedYear, 10) : null;
      const monthParam = selectedMonth !== "ALL" ? parseInt(selectedMonth, 10) : null;
      const data = await getQuickBooksPreview({
        status: "COMPLETED",
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

  const handleExport = async () => {
    setIsExporting(true);
    try {
      toast.loading("Generating QuickBooks export...", { id: "qb-export" });
      const yearParam = selectedYear !== "ALL" ? parseInt(selectedYear, 10) : null;
      const monthParam = selectedMonth !== "ALL" ? parseInt(selectedMonth, 10) : null;

      if (exportMode === "BUNDLE") {
        await exportQuickBooksBundle(undefined, "COMPLETED", yearParam, monthParam);
        toast.success("Complete QuickBooks bundle downloaded successfully", { id: "qb-export" });
      } else if (exportMode === "DOCUMENTS") {
        await exportQuickBooksDocuments(undefined, "COMPLETED", yearParam, monthParam);
        toast.success("PDF document package downloaded successfully", { id: "qb-export" });
      } else if (exportMode === "RECONCILIATION") {
        await exportQuickBooksReconciliation(undefined, "COMPLETED", yearParam, monthParam);
        toast.success("Reconciliation manifest downloaded successfully", { id: "qb-export" });
      } else {
        await exportQuickBooksCsv(undefined, "COMPLETED", yearParam, monthParam);
        toast.success("QuickBooks CSV export downloaded successfully", { id: "qb-export" });
      }

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
                  QuickBooks Online Integration &amp; Staging
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Review, validate, and preview items before syncing to QuickBooks Online ledger.
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
              <span>File Exports (.csv / .zip)</span>
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
                <h4 className="text-sm font-semibold text-foreground">No completed purchase items found</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Only completed purchase requests are staged for QuickBooks Online sync.
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
                        className={`rounded-lg border transition-all ${
                          isSelected
                            ? "border-emerald-500/60 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-xs"
                            : "border-border/70 bg-card hover:border-border"
                        }`}
                      >
                        <div className="p-3.5 flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleSelect(item.request_id)}
                            className="mt-1"
                          />

                          <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-foreground">
                                  REQ-#{item.request_id}
                                </span>
                                <span className="text-xs text-muted-foreground font-mono bg-muted/60 px-1.5 py-0.5 rounded">
                                  Ref: {item.ref_no || "-"}
                                </span>
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

                            <div className="pt-1 flex items-center justify-end">
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
          <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[60vh]">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground uppercase tracking-wider">
                Export File Format
              </Label>
              <div className="grid grid-cols-1 gap-2">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExportMode("CSV")}
                  onKeyDown={(e) => e.key === "Enter" && setExportMode("CSV")}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors text-left ${
                    exportMode === "CSV"
                      ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs"
                      : "border-border/70 hover:bg-muted/30"
                  }`}
                >
                  <div className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                    exportMode === "CSV" ? "border-emerald-600 bg-emerald-600 text-white" : "border-muted-foreground/50"
                  }`}>
                    {exportMode === "CSV" && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  </div>
                  <div className="space-y-0.5 flex-1">
                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>QuickBooks Transactions (.csv)</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Standardized columns formatted with MM/DD/YYYY dates for direct SaasAnt / QuickBooks Online CSV import.
                    </p>
                  </div>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExportMode("BUNDLE")}
                  onKeyDown={(e) => e.key === "Enter" && setExportMode("BUNDLE")}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors text-left ${
                    exportMode === "BUNDLE"
                      ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs"
                      : "border-border/70 hover:bg-muted/30"
                  }`}
                >
                  <div className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                    exportMode === "BUNDLE" ? "border-emerald-600 bg-emerald-600 text-white" : "border-muted-foreground/50"
                  }`}>
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
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  Year
                </Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="h-8.5 text-xs bg-background">
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

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  Month
                </Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="h-8.5 text-xs bg-background">
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
      </DialogContent>
    </Dialog>
  );
}
