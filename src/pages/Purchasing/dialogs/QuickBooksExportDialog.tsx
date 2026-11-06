import { QuickBooksItemDetailsDialog } from "./QuickBooksItemDetailsDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Zap, AlertTriangle } from "lucide-react";
import type { QuickBooksExportDialogProps } from "./quickBooksExportDialog/types";
import { useQuickBooksExportDialog } from "./quickBooksExportDialog/hooks/useQuickBooksExportDialog";
import { PreviewSyncTab } from "./quickBooksExportDialog/sections/PreviewSyncTab";
import { LastExportedStatusBanner } from "./quickBooksExportDialog/sections/LastExportedStatusBanner";

export function QuickBooksExportDialog(props: QuickBooksExportDialogProps) {
  const s = useQuickBooksExportDialog(props);
  const { isConnected, setIsDetailsOpen, isDetailsOpen, detailsItem, isExporting, handleExport, selectedRequestIds, isSyncing, handleSyncSelected, activeTab, onOpenChange, setActiveTab, totalItems, companyName, open } = s;
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

        <PreviewSyncTab s={s} />

        <LastExportedStatusBanner s={s} />

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
