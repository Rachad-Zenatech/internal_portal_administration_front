import { QuickBooksItemDetailsDialog } from "./dialogs/QuickBooksItemDetailsDialog";
import { FileSpreadsheet, Download, Clock, Loader2, CheckCircle2, AlertTriangle, Terminal, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDisplayDateTime } from "./quickBooks/utils";
import { useQuickBooks } from "./quickBooks/hooks/useQuickBooks";
import { BreadcrumbTopBar } from "./quickBooks/sections/BreadcrumbTopBar";
import { TopSummaryMetricCards } from "./quickBooks/sections/TopSummaryMetricCards";
import { SubTabNavigationFor } from "./quickBooks/sections/SubTabNavigationFor";
import { SaasantFilterControlBar } from "./quickBooks/sections/SaasantFilterControlBar";
import { FloatingBatchActionBar } from "./quickBooks/sections/FloatingBatchActionBar";
import { RequestsTableHeader } from "./quickBooks/sections/RequestsTableHeader";
import { RequestIdTags } from "./quickBooks/sections/RequestIdTags";
import { ListPagination, usePagedRows } from "@/components/common/ListPagination";
import { ExportArchiveCard } from "./quickBooks/sections/ExportArchiveCard";
import { ExportTimeframeCard } from "./quickBooks/sections/ExportTimeframeCard";
import { SqlExplorerTab } from "./quickBooks/sections/SqlExplorerTab";

export default function QuickBooksPage() {
  const s = useQuickBooks();
  const { isDisconnecting, handleDisconnect, setIsDisconnectOpen, companyName, isDisconnectOpen, isConnected, inspectorItem, deletingId, handleDeleteFromQuickBooks, syncingSingleId, handleSingleSync, setIsInspectorOpen, isInspectorOpen, deleteConfirmItem, setDeleteConfirmItem, stagingTab, filteredItems, isLoadingPreview, lastExportedAt, totalStaged, setActiveTab, activeTab } = s;
  const { pageRows: pagedItems, setPage: setItemsPage, ...itemsPaging } = usePagedRows(
    filteredItems,
    [stagingTab, s.statusFilter, s.requestTypeFilter, s.searchQuery, s.startDate, s.endDate, s.datePreset].join("|"),
  );
  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      {/* Breadcrumb & Top Bar */}
      <BreadcrumbTopBar s={s} />

      {/* Top Summary Metric Cards */}
      <TopSummaryMetricCards s={s} />

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

        {/* TAB 1: LIVE STAGING & DIRECT SYNC (EXPENSES, BILLS & AR INVOICES) */}
        <TabsContent value="staging" className="space-y-4 m-0">
          {/* Sub-Tab Navigation for Expenses vs Bills vs A/R Invoices */}
          <SubTabNavigationFor s={s} />

          {/* SaasAnt Filter & Control Bar */}
          <SaasantFilterControlBar s={s} />

          {/* Floating Batch Action Bar (When items selected in current tab) */}
          <FloatingBatchActionBar s={s} />

          {/* Staging Spreadsheet Table */}
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
                  <h4 className="text-sm font-semibold text-foreground">
                    No matching staged {
                      stagingTab === "expenses"
                        ? "purchasing expenses"
                        : stagingTab === "ma_payments"
                        ? "M&A scheduled payments"
                        : stagingTab === "bills"
                        ? "bills"
                        : "A/R invoices"
                    } found
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    {stagingTab === "expenses"
                      ? "Standard procurement and spend requests with status 'Ordered / Purchased' are staged here for QuickBooks Expenses."
                      : stagingTab === "ma_payments"
                      ? "M&A scheduled deal payments and wire settlements with status 'Ordered / Purchased' are staged here."
                      : stagingTab === "bills"
                      ? "Recurring vendor payments with status 'Ordered / Purchased' are staged here for QuickBooks Bills."
                      : "Reconciled A/R cash applications are staged here for QuickBooks Invoices & Payments."}
                  </p>
                </div>
              ) : (
                <Table key={`qbo-staging-table-${stagingTab}`} className="text-xs min-w-[1240px]">
                  <RequestsTableHeader s={s} />
                  <TableBody key={`qbo-staging-body-${stagingTab}`}>
                    <RequestIdTags s={s} rows={pagedItems} />
                  </TableBody>
                </Table>
              )}
            </div>
            {!isLoadingPreview && filteredItems.length > 0 && (
              <ListPagination {...itemsPaging} noun="items" onPageChange={setItemsPage} />
            )}
          </Card>
        </TabsContent>

        {/* TAB 2: FILE EXPORT PACKAGES (.XLSX / .CSV / .ZIP) */}
        <TabsContent value="export" className="space-y-4 m-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left 2 Cols: Mode Selection */}
            <ExportArchiveCard s={s} />

            {/* Right 1 Col: Date Filters & Action */}
            <ExportTimeframeCard s={s} />
          </div>
        </TabsContent>

        {/* TAB 3: QUICKBOOKS SQL EXPLORER */}
        <SqlExplorerTab s={s} />
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
              This will delete the {deleteConfirmItem?.transaction_category === "BILL" ? "Bill" : "Purchase/Expense"} transaction for <strong className="text-foreground font-mono">{deleteConfirmItem?.transaction_category === "BILL" ? `REC-#${deleteConfirmItem?.request_id}` : `REQ-#${deleteConfirmItem?.request_id}`}</strong> ({deleteConfirmItem?.formatted_amount || `$${deleteConfirmItem?.amount?.toFixed(2)}`}) from your QuickBooks Online company ledger.
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
            {deleteConfirmItem?.existing_bill_id && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">QBO Bill ID:</span>
                <span className="font-mono font-bold text-blue-600">#{deleteConfirmItem.existing_bill_id}</span>
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
