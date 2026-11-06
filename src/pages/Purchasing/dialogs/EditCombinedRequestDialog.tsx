import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WireGeneralPaymentFields } from "../fields/WireGeneralPaymentFields";
import { WireBankingFields } from "../fields/WireBankingFields";
import { FilePreviewModal } from "./FilePreviewModal";
import { Package, FileText, ShoppingBag, Link2, AlertCircle, RefreshCw, Landmark } from "lucide-react";
import type { EditCombinedRequestDialogProps } from "./editCombinedRequest/types";
import { useEditCombinedRequest } from "./editCombinedRequest/hooks/useEditCombinedRequest";
import { Card1GeneralOverview } from "./editCombinedRequest/sections/Card1GeneralOverview";
import { Card2FinancialBreakdown } from "./editCombinedRequest/sections/Card2FinancialBreakdown";
import { Tab2PurchaseOrder } from "./editCombinedRequest/sections/Tab2PurchaseOrder";
import { Tab3InvoiceReceipts } from "./editCombinedRequest/sections/Tab3InvoiceReceipts";

const TAB_BASE =
  "flex-none inline-flex items-center gap-2 whitespace-nowrap px-1 pb-3 pt-2 -mb-px text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 bg-transparent dark:bg-transparent border-0 border-b-2 border-transparent rounded-none shadow-none data-[state=active]:bg-transparent dark:data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors";

export function EditCombinedRequestDialog(props: EditCombinedRequestDialogProps) {
  const s = useEditCombinedRequest(props);
  const { previewTarget, handleClosePreview, isPreviewOpen, updateMutation, isCompleted, handleSave, onOpenChange, setDescription, description, setApWireForm, apWireForm, setDueDate, handleCurrencyChange, handleAmountChange, itemMode, isAccountsPayable, hasVariance, hasInvoice, purchaseOrder, hasPo, setActiveTab, activeTab, handleForceSyncNow, isPricingSynced, setIsPricingSynced, request, open } = s;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl w-[95vw] max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden shadow-2xl rounded-2xl border border-slate-200 dark:border-zinc-800">
        {/* Header with Title, Contextual Info & Smart Sync Toggle */}
        <DialogHeader className="px-8 py-5 border-b border-slate-200/80 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/60 backdrop-blur-xs shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-xs">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2.5">
                  <span>Edit Purchase Requisition</span>
                  <Badge variant="outline" className="font-mono text-xs font-semibold px-2 py-0.5">
                    REQ #{request?.id}
                  </Badge>
                  {request?.status && (
                    <Badge className="text-[11px] font-semibold bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border-0">
                      {request.status}
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Update requisition parameters, single or multi-part breakdowns, Purchase Order details, and Invoice line allocations.
                </DialogDescription>
              </div>
            </div>

            {/* Smart Synchronization Bar */}
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-1.5 px-3 rounded-xl shadow-xs">
              <button
                type="button"
                onClick={() => setIsPricingSynced(!isPricingSynced)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
                  isPricingSynced
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                }`}
              >
                <Link2 className="h-3.5 w-3.5" />
                <span>{isPricingSynced ? "Sync Active" : "Sync Disabled"}</span>
              </button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleForceSyncNow}
                className="h-7 text-xs px-2 gap-1 text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                title="Force push all Request pricing & GL to PO and Invoice"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Sync Now</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        {isCompleted && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 px-8 py-2.5 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>This purchase request is <strong>Completed</strong> and cannot be edited. All fields are locked for auditing.</span>
          </div>
        )}

        {/* Combined Tabs Navigation */}
        <Tabs
          value={activeTab}
          onValueChange={(val: any) => setActiveTab(val)}
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          <div className="px-8 pt-2 pb-0 border-b border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
            <TabsList className="flex w-full h-auto justify-start gap-6 p-0 bg-transparent rounded-none overflow-visible">
              <TabsTrigger
                value="request"
                className={`${TAB_BASE} data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 dark:data-[state=active]:border-indigo-400 dark:data-[state=active]:text-indigo-300`}
              >
                <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
                <span>1. Request Details</span>
              </TabsTrigger>
              {hasPo && (
                <TabsTrigger
                  value="po"
                  className={`${TAB_BASE} data-[state=active]:border-amber-600 data-[state=active]:text-amber-600 dark:data-[state=active]:border-amber-400 dark:data-[state=active]:text-amber-300`}
                >
                  <Package className="h-3.5 w-3.5 shrink-0" />
                  <span>2. Purchase Order</span>
                  {purchaseOrder?.quote_number && (
                    <span
                      title={purchaseOrder.quote_number}
                      className="text-[10px] font-mono font-normal opacity-70 truncate max-w-[200px]"
                    >
                      ({purchaseOrder.quote_number})
                    </span>
                  )}
                </TabsTrigger>
              )}
              {hasInvoice && (
                <TabsTrigger
                  value="invoice"
                  className={`${TAB_BASE} data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-600 dark:data-[state=active]:border-emerald-400 dark:data-[state=active]:text-emerald-300`}
                >
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span>3. Invoice / Receipts</span>
                  {hasVariance && (
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" title="Variance detected" />
                  )}
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* TAB 1: Request Details */}
          <TabsContent
            value="request"
            className="flex-1 overflow-y-auto px-8 py-6 space-y-6 m-0 focus-visible:outline-hidden"
          >
            {/* Card 1: General Overview, Requisition Type & Ownership */}
            <Card1GeneralOverview s={s} />

            {/* Card 2: Financial Breakdown & Item Details (Single vs Multi) */}
            <Card2FinancialBreakdown s={s} />

            {/* Card 3: Accounts Payable & Wire Banking Details (when AP) */}
            {isAccountsPayable && (
              <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-950/20 p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-blue-200/80 dark:border-blue-800/80">
                  <div className="flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 tracking-tight uppercase text-[11px]">
                      Accounts Payable &amp; Wire Payment Instructions
                    </h3>
                  </div>
                  <Badge variant="outline" className="border-blue-300 text-blue-700 dark:text-blue-300 text-[11px]">
                    AP Details
                  </Badge>
                </div>

                <div className="space-y-6">
                  <WireGeneralPaymentFields
                    form={apWireForm}
                    setForm={setApWireForm}
                    onAmountChange={(amt) => {
                      if (itemMode === "SINGLE") handleAmountChange(String(amt));
                    }}
                    onCurrencyChange={handleCurrencyChange}
                    onDueDateChange={setDueDate}
                  />

                  <WireBankingFields
                    form={apWireForm}
                    setForm={setApWireForm}
                  />
                </div>
              </div>
            )}

            {/* Card 4: Business Justification & Specifications */}
            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 p-5 space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                <span>Business Justification &amp; Specifications</span>
              </label>
              <Textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide any additional specifications, reasoning, or purchasing justification..."
                className="text-xs resize-none bg-white dark:bg-zinc-900"
              />
            </div>
          </TabsContent>

          {/* TAB 2: Purchase Order */}
          <Tab2PurchaseOrder s={s} />

          {/* TAB 3: Invoice / Receipts */}
          <Tab3InvoiceReceipts s={s} />
        </Tabs>

        {/* Footer Actions */}
        <div className="px-8 py-4 border-t border-slate-200/80 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/60 flex items-center justify-between gap-4 shrink-0">
          <div className="text-xs text-slate-400">
            Changes across active tabs will be saved simultaneously.
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={updateMutation.isPending || isCompleted}
              className="h-9 px-5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
            >
              {updateMutation.isPending ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <span>Save All Changes</span>
              )}
            </Button>
          </div>
        </div>

        <FilePreviewModal
          open={isPreviewOpen}
          onOpenChange={handleClosePreview}
          target={previewTarget}
        />
      </DialogContent>
    </Dialog>
  );
}
