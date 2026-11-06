import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet, Calendar, Clock, CheckCircle2, FolderArchive, FileText, Check, History, RotateCcw, Sun } from "lucide-react";
import { MONTHS } from "../constants";
import { formatDisplayDateTime, formatDisplayDate } from "../utils";
import type { QuickBooksExportDialogState } from "../hooks/useQuickBooksExportDialog";

export function LastExportedStatusBanner({ s }: { s: QuickBooksExportDialogState }) {
  const { setSelectedMonth, selectedMonth, years, setSelectedYear, selectedYear, setEndDateTime, endDateTime, setStartDateTime, startDateTime, lastExportedAt, handleResetToLastExport, filterType, now, setFilterType, handleSetTodayPreset, exportMode, setExportMode, activeTab } = s;
  return (
    <>
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
    </>
  );
}
