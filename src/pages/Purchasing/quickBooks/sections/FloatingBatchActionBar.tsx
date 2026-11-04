import { FileSpreadsheet, Download, Loader2, FolderArchive, FileText, Zap, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { QuickBooksState } from "../hooks/useQuickBooks";

export function FloatingBatchActionBar({ s }: { s: QuickBooksState }) {
  const { stagingTab, currentTabSelectedIds, isSyncing, isConnected, handleBatchSync, handleExport, isExporting, handleClearSelection, currentTabSelectedTotalAmount } = s;
  return (
    <>
      {currentTabSelectedIds.length > 0 && (
            <div className={`flex items-center justify-between gap-4 p-3 rounded-xl text-white shadow-md border animate-in slide-in-from-top duration-200 ${
              stagingTab === "expenses"
                ? "bg-gradient-to-r from-emerald-900/90 to-slate-900 border-emerald-500/30"
                : stagingTab === "ma_payments"
                ? "bg-gradient-to-r from-purple-900/90 to-slate-900 border-purple-500/30"
                : stagingTab === "bills"
                ? "bg-gradient-to-r from-blue-900/90 to-slate-900 border-blue-500/30"
                : "bg-gradient-to-r from-teal-900/90 to-slate-900 border-teal-500/30"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-xs border ${
                  stagingTab === "expenses"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    : stagingTab === "ma_payments"
                    ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                    : stagingTab === "bills"
                    ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                    : "bg-teal-500/20 text-teal-400 border-teal-500/30"
                }`}>
                  {currentTabSelectedIds.length}
                </div>
                <div className="text-xs">
                  <span className="font-bold">
                    {currentTabSelectedIds.length}{" "}
                    {stagingTab === "expenses"
                      ? "expense(s)"
                      : stagingTab === "ma_payments"
                      ? "M&A scheduled payment(s)"
                      : stagingTab === "bills"
                      ? "bill(s)"
                      : "A/R invoice(s)"} selected
                  </span>
                  <span className={`${
                    stagingTab === "expenses"
                      ? "text-emerald-300"
                      : stagingTab === "ma_payments"
                      ? "text-purple-300"
                      : stagingTab === "bills"
                      ? "text-blue-300"
                      : "text-teal-300"
                  } ml-2 font-mono font-semibold`}>
                    Total: {currentTabSelectedTotalAmount}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSelection}
                  className="h-7.5 px-2.5 text-xs text-zinc-300 hover:text-white hover:bg-white/10"
                >
                  Clear Selection
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isExporting}
                      className="h-7.5 text-xs font-semibold gap-1.5 bg-white/10 hover:bg-white/20 text-white border-white/20 shadow-xs"
                    >
                      {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                      <span>Export Selected ({currentTabSelectedIds.length})</span>
                      <ChevronDown className="h-3 w-3 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 text-xs">
                    <DropdownMenuLabel>Export Selected Package</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleExport(currentTabSelectedIds, "XLSX")}>
                      <FileSpreadsheet className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                      <span>Download Excel (.xlsx)</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport(currentTabSelectedIds, "CSV")}>
                      <FileText className="h-3.5 w-3.5 mr-2 text-blue-600" />
                      <span>Download CSV (.csv)</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport(currentTabSelectedIds, "BUNDLE")}>
                      <FolderArchive className="h-3.5 w-3.5 mr-2 text-purple-600" />
                      <span>Download Bundle (.zip)</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport(currentTabSelectedIds, "DOCUMENTS")}>
                      <Download className="h-3.5 w-3.5 mr-2 text-amber-600" />
                      <span>Documents Only (.zip)</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  size="sm"
                  onClick={handleBatchSync}
                  disabled={isSyncing || !isConnected}
                  className={`h-7.5 text-xs font-semibold gap-1.5 text-white shadow-xs ${
                    stagingTab === "expenses"
                      ? "bg-emerald-600 hover:bg-emerald-500"
                      : stagingTab === "ma_payments"
                      ? "bg-purple-600 hover:bg-purple-500"
                      : stagingTab === "bills"
                      ? "bg-blue-600 hover:bg-blue-500"
                      : "bg-teal-600 hover:bg-teal-500"
                  }`}
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>
                        Syncing to QuickBooks{" "}
                        {stagingTab === "expenses"
                          ? "Expenses"
                          : stagingTab === "ma_payments"
                          ? "M&A Expenses"
                          : stagingTab === "bills"
                          ? "Bills"
                          : "A/R Invoices"}...
                      </span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-3.5 w-3.5" />
                      <span>
                        Sync Selected ({currentTabSelectedIds.length}) to QuickBooks{" "}
                        {stagingTab === "expenses"
                          ? "Expenses"
                          : stagingTab === "ma_payments"
                          ? "M&A Expenses"
                          : stagingTab === "bills"
                          ? "Bills"
                          : "A/R Invoices"}
                      </span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
    </>
  );
}
