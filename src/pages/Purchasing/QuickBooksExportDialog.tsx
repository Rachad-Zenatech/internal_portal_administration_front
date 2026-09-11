import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileSpreadsheet, Download, Calendar, Loader2, CheckCircle2, FolderArchive, FileText, Layers, Check } from "lucide-react";
import { toast } from "sonner";
import {
  exportQuickBooksXlsx,
  exportQuickBooksBundle,
  exportQuickBooksDocuments,
  exportQuickBooksReconciliation,
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

type ExportMode = "XLSX" | "BUNDLE" | "DOCUMENTS" | "RECONCILIATION";

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

  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const [selectedMonth, setSelectedMonth] = useState<string>(String(currentMonth));
  const [exportMode, setExportMode] = useState<ExportMode>("XLSX");
  const [isExporting, setIsExporting] = useState(false);

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
        await exportQuickBooksXlsx(undefined, "COMPLETED", yearParam, monthParam);
        toast.success("QuickBooks Excel export downloaded successfully", { id: "qb-export" });
      }

      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to export QuickBooks file", { id: "qb-export" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-card border-border shadow-xl">
        <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-3 pr-6">
            <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0">
              <FileSpreadsheet className="h-4.5 w-4.5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Export to QuickBooks
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Export completed transactions, renamed PDFs, and reconciliation manifests.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 sm:p-5 space-y-4">
          {/* Export Mode Selection Cards */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-muted-foreground" />
              Export Package Type
            </Label>
            <div className="grid grid-cols-1 gap-2">
              <div
                role="button"
                tabIndex={0}
                onClick={() => setExportMode("XLSX")}
                onKeyDown={(e) => e.key === "Enter" && setExportMode("XLSX")}
                className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors text-left ${
                  exportMode === "XLSX"
                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs"
                    : "border-border/70 hover:bg-muted/30"
                }`}
              >
                <div className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                  exportMode === "XLSX" ? "border-emerald-600 bg-emerald-600 text-white" : "border-muted-foreground/50"
                }`}>
                  {exportMode === "XLSX" && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                </div>
                <div className="space-y-0.5 flex-1">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>QuickBooks Transactions (.xlsx)</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    12 standardized columns formatted for direct QuickBooks Online bill import.
                  </p>
                </div>
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={() => setExportMode("BUNDLE")}
                onKeyDown={(e) => e.key === "Enter" && setExportMode("BUNDLE")}
                className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors text-left ${
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

              <div
                role="button"
                tabIndex={0}
                onClick={() => setExportMode("DOCUMENTS")}
                onKeyDown={(e) => e.key === "Enter" && setExportMode("DOCUMENTS")}
                className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors text-left ${
                  exportMode === "DOCUMENTS"
                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs"
                    : "border-border/70 hover:bg-muted/30"
                }`}
              >
                <div className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                  exportMode === "DOCUMENTS" ? "border-emerald-600 bg-emerald-600 text-white" : "border-muted-foreground/50"
                }`}>
                  {exportMode === "DOCUMENTS" && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                </div>
                <div className="space-y-0.5 flex-1">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <FolderArchive className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Renamed PDF Documents Package (.zip)</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    All receipts and invoice PDFs renamed to PUR-000123_Invoice.pdf for QB bulk receipt upload.
                  </p>
                </div>
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={() => setExportMode("RECONCILIATION")}
                onKeyDown={(e) => e.key === "Enter" && setExportMode("RECONCILIATION")}
                className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors text-left ${
                  exportMode === "RECONCILIATION"
                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs"
                    : "border-border/70 hover:bg-muted/30"
                }`}
              >
                <div className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                  exportMode === "RECONCILIATION" ? "border-emerald-600 bg-emerald-600 text-white" : "border-muted-foreground/50"
                }`}>
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

          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Year Selector */}
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

            {/* Month Selector */}
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

          {/* Compact Info Pill */}
          <div className="rounded-lg border border-border/70 bg-muted/40 p-2.5 text-xs text-muted-foreground flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span className="text-[11px] leading-tight">
              Only completed &amp; paid requests are exported with mapped Vendor, GL Code, Department, and Document attachments.
            </span>
          </div>
        </div>

        <div className="m-0 p-4 px-5 border-t border-border/60 bg-muted/20 flex flex-row items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8.5 px-3.5 text-xs font-medium"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
