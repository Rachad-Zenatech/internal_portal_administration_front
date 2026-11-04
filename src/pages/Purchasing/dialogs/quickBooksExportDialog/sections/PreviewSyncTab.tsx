import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Paperclip, Calendar, Loader2, CheckCircle2, RefreshCw, Building2, CreditCard, Tag, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { MONTHS } from "../constants";
import type { QuickBooksExportDialogState } from "../hooks/useQuickBooksExportDialog";

export function PreviewSyncTab({ s }: { s: QuickBooksExportDialogState }) {
  const { setExpandedPayloadId, setIsDetailsOpen, setDetailsItem, handleToggleSelect, expandedPayloadId, selectedRequestIds, previewData, handleSelectAll, isLoadingPreview, totalItems, totalAmount, fetchPreview, setSelectedMonth, selectedMonth, years, setSelectedYear, selectedYear, activeTab } = s;
  return (
    <>
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
    </>
  );
}
