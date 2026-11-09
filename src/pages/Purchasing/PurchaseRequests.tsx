import { FloatingVerticalFilter } from "@/components/ui/FloatingVerticalFilter";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import HelpIcon from "@/components/ui/HelpIcon";
import { Clock, Plus, ShoppingCart, FileWarning, CheckCircle2, FileText, Sparkles, FileSpreadsheet, Maximize2, AlertCircle, Loader2, AlertTriangle } from "lucide-react";
import { FilePreviewModal } from "./dialogs/FilePreviewModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type RequestType } from "@/types/purchasing";
import { QuickBooksExportDialog } from "./dialogs/QuickBooksExportDialog";
import { ConvertToRecurringDialog } from "./dialogs/ConvertToRecurringDialog";
import { CurrencyAutocomplete } from "./fields/CurrencyAutocomplete";
import { usePurchaseRequestsPage } from "./purchaseRequests/hooks/usePurchaseRequestsPage";
import { RequestFilterBar } from "./purchaseRequests/sections/RequestFilterBar";
import { RequestsTableCard } from "./purchaseRequests/sections/RequestsTableCard";
import { LineItemsPreviewTable } from "./purchaseRequests/sections/LineItemsPreviewTable";
import { BottomBreakdownAndCalculations } from "./purchaseRequests/sections/BottomBreakdownAndCalculations";
import { ProductLinkField } from "./purchaseRequests/sections/ProductLinkField";
import { RequestTitleAndPriority } from "./purchaseRequests/sections/RequestTitleAndPriority";
import { WireTransferDocumentInvoice } from "./purchaseRequests/sections/WireTransferDocumentInvoice";
import { SingleItemFields } from "./purchaseRequests/sections/SingleItemFields";
import { RecurringRequestOptions } from "./purchaseRequests/sections/RecurringRequestOptions";
import { FullScreenLineItems } from "./purchaseRequests/sections/FullScreenLineItems";

export default PurchaseRequests;

export function PurchaseRequests() {
  const s = usePurchaseRequestsPage();
  const { queryClient, convertingRequest, setConvertingRequest, previewTarget, handleClosePreview, isPreviewOpen, setIsQBExportOpen, isQBExportOpen, setIsDialogOpen, setShowUnsavedConfirm, showUnsavedConfirm, form, createMutation, extractQuoteMutation, setForm, handleAddItem, setIsFullScreenTable, setLineItemsCurrency, lineItemsCurrency, quoteItems, quoteExtraction, handleQuoteFileUpload, quoteFileInputRef, setTaxFee, setShippingFee, setQuoteItems, setQuoteFile, setQuoteExtraction, itemMode, setItemMode, handleSubmit, isDirty, handleRequestClose, isDialogOpen, handleStatusFilterChange, statusFilter, cards, kpiRef, summary, openCreate, canCreate, navigate } = s;
  return (
    <div className="w-full flex flex-col gap-3.5 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Purchase Requests</h2>
            <HelpIcon text="Manage and create purchase requests. Displays current review status and routing info." />
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Capture, review, approve and track purchasing &amp; wire transfer requests.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => navigate("/purchasing/quickbooks")}
            className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>QuickBooks Sync & Exports</span>
          </Button>
          {canCreate && (
            <Button
              onClick={() => openCreate("SPEND")}
              className="w-full sm:w-auto gap-2 font-medium shadow-sm bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create Purchase Request</span>
            </Button>
          )}
        </div>
      </div>

      {/* Slim Vertical Floating Quick Filter (Follows card colors & appears on scroll) */}
      <FloatingVerticalFilter
        items={[
          {
            key: "OPEN",
            label: "Open Requests",
            count: summary?.open_requests ?? 0,
            icon: ShoppingCart,
            color: "blue",
          },
          {
            key: "UNDER_REVIEW",
            label: "Waiting Review",
            count: summary?.status_counts?.UNDER_REVIEW ?? 0,
            icon: Clock,
            color: "orange",
          },
          {
            key: "WAITING_PAYMENT",
            label: "Unpaid Invoices",
            count: summary?.unpaid_invoices ?? 0,
            icon: FileWarning,
            color: "fuchsia",
          },
          {
            key: "COMPLETED",
            label: "Completed",
            count: summary?.completed ?? 0,
            icon: CheckCircle2,
            color: "green",
          },
        ]}
        activeKey={statusFilter}
        onSelect={handleStatusFilterChange}
        defaultKey="OPEN"
        onReset={() => handleStatusFilterChange("OPEN")}
        scrollThreshold={130}
        title="Requests"
        kpiRef={kpiRef}
      />

      {/* Compact KPI Cards Section */}
      <div ref={kpiRef} className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 animate-in fade-in duration-300 shrink-0">
        {cards.map((c) => {
          const Icon = c.icon;
          const isSelected = statusFilter === c.statusKey;
          return (
            <Card
              key={c.label}
              onClick={() => handleStatusFilterChange(c.statusKey)}
              className={`border transition-all cursor-pointer rounded-lg ${isSelected
                  ? "border-blue-500/80 ring-2 ring-blue-500/20 bg-blue-50/20 dark:bg-blue-950/20 shadow-xs"
                  : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-xs"
                }`}
            >
              <CardContent className="p-2 sm:p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 block">{c.label}</span>
                  <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100 leading-tight mt-0.5">{c.value}</div>
                  {c.sub && <div className="text-[10px] text-slate-500 mt-0.5">{c.sub}</div>}
                </div>
                <div className="p-1.5 rounded-md bg-slate-50 dark:bg-zinc-800/60 shrink-0">
                  <Icon className={`h-4 w-4 ${c.tint}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <RequestFilterBar s={s} />

      <RequestsTableCard s={s} />

      {/* New Purchase Request Modal */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            handleRequestClose();
          } else {
            setIsDialogOpen(true);
          }
        }}
      >
        <DialogContent
          aria-describedby={undefined}
          onPointerDownOutside={(e) => {
            if (isDirty) {
              e.preventDefault();
              setShowUnsavedConfirm(true);
            }
          }}
          onEscapeKeyDown={(e) => {
            if (isDirty) {
              e.preventDefault();
              setShowUnsavedConfirm(true);
            }
          }}
          // grid-cols-1 caps the dialog's column at the dialog width, so long one-line text (e.g. an auto-filled
          // product name) truncates instead of widening the dialog; it only ever scrolls up and down
          className="sm:max-w-6xl 2xl:max-w-7xl w-[95vw] max-h-[90vh] grid-cols-1 overflow-y-auto overflow-x-hidden"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>
                {form.request_type === "RECURRING"
                  ? "New Recurring / Subscription Payment"
                  : form.request_type === "ACCOUNTS_PAYABLE"
                  ? "New Wire Transfer Request"
                  : "New Purchase Request"}
              </span>
              {form.request_type !== "ACCOUNTS_PAYABLE" && form.request_type !== "RECURRING" && itemMode === "MULTIPLE" && (
                <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border-indigo-200">
                  <Sparkles className="h-3 w-3 mr-1" /> Multi-Part Quote OCR
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-1 min-w-0">
            {/* 1. Request Type Selector (Clean Segmented Cards at Top) */}
            <div className="space-y-1.5 pb-3 border-b border-slate-100 dark:border-zinc-800">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Request Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { value: "SPEND", label: "Spend Request", icon: ShoppingCart, desc: "Purchases, parts & hardware" },
                  { value: "QUOTE", label: "Quote Request", icon: FileSpreadsheet, desc: "Estimates & RFQs" },
                ].map((opt) => {
                  const isSelected = form.request_type === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, request_type: opt.value as RequestType }));
                        if (opt.value === "ACCOUNTS_PAYABLE" || opt.value === "RECURRING") {
                          setItemMode("SINGLE");
                        }
                      }}
                      className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all relative ${
                        isSelected
                          ? "bg-indigo-50/80 border-indigo-500 dark:bg-indigo-950/40 dark:border-indigo-500 shadow-2xs ring-1 ring-indigo-500/30"
                          : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800/60"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-0.5 w-full">
                        <opt.icon className={`h-4 w-4 shrink-0 ${isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`} />
                        <span className={`text-xs font-semibold ${isSelected ? "text-indigo-900 dark:text-indigo-100" : "text-slate-800 dark:text-zinc-200"}`}>
                          {opt.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400 leading-tight line-clamp-1">
                        {opt.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Mode Selector (Single Item vs Multiple Parts) - Only for Spend, Quote, Admin */}
            {form.request_type !== "ACCOUNTS_PAYABLE" && form.request_type !== "RECURRING" && (
              <div className="p-3 bg-slate-50/70 dark:bg-zinc-800/40 rounded-lg border border-slate-200 dark:border-zinc-700 space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
                  Item Configuration
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={itemMode === "SINGLE" ? "default" : "outline"}
                    className="w-full text-xs font-medium justify-center h-9"
                    onClick={() => setItemMode("SINGLE")}
                  >
                    Single Item (Direct entry)
                  </Button>
                  <Button
                    type="button"
                    variant={itemMode === "MULTIPLE" ? "default" : "outline"}
                    className="w-full text-xs font-medium justify-center h-9"
                    onClick={() => setItemMode("MULTIPLE")}
                  >
                    <FileText className="h-3.5 w-3.5 mr-1.5" /> Multiple Parts (Quote PDF Upload)
                  </Button>
                </div>
              </div>
            )}

            {/* 3. Multiple Parts PDF Dropzone & AI Extraction + Line Items Table */}
            {form.request_type !== "ACCOUNTS_PAYABLE" && form.request_type !== "RECURRING" && itemMode === "MULTIPLE" && (
              <div className="space-y-4 p-4 rounded-xl bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent border border-indigo-200/80 dark:border-indigo-900/60 shadow-xs">
                {/* PDF Upload (Optional) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
                      <span>Upload Quote / Quotation PDF ([Optional] auto-extracts line items)</span>
                    </label>
                    {(quoteExtraction || quoteItems.length > 0) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setQuoteExtraction(null);
                          setQuoteFile(null);
                          setQuoteItems([]);
                          setShippingFee(0);
                          setTaxFee(0);
                          setForm((prev) => ({
                            ...prev,
                            quote_data: undefined,
                          }));
                          if (quoteFileInputRef.current) {
                            quoteFileInputRef.current.value = "";
                          }
                        }}
                        className="h-6 text-[11px] text-slate-500 hover:text-red-600 px-2"
                      >
                        Clear Upload
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <Input
                      ref={quoteFileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleQuoteFileUpload(file);
                      }}
                      disabled={extractQuoteMutation.isPending}
                      className="cursor-pointer file:cursor-pointer text-xs"
                    />
                    {extractQuoteMutation.isPending && (
                      <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 shrink-0 font-medium">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Extracting line items...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Extracted Quote Summary */}
                {quoteExtraction && (
                  <div className="space-y-3 pt-2 border-t border-indigo-100 dark:border-indigo-900/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                          Extracted Quote Data
                        </span>
                        {quoteExtraction.extraction.vendor && (
                          <span className="text-xs text-slate-500">
                            • Vendor: <strong>{quoteExtraction.extraction.vendor?.name || (typeof quoteExtraction.extraction.vendor === "string" ? quoteExtraction.extraction.vendor : "")}</strong>
                          </span>
                        )}
                        {quoteExtraction.extraction.quote_number && (
                          <span className="text-xs text-slate-500">
                            • Quote #: <strong>{quoteExtraction.extraction.quote_number}</strong>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            quoteExtraction.confidence_score >= 0.8
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                              : "bg-amber-50 text-amber-700 border-amber-200 text-[10px]"
                          }
                        >
                          {Math.round(quoteExtraction.confidence_score * 100)}% Confidence
                        </Badge>
                        {quoteExtraction.ocr_used && (
                          <Badge variant="secondary" className="text-[10px]">
                            OCR Scanned
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Math & Completeness Warnings */}
                    {quoteExtraction.validation.warnings.length > 0 && (
                      <div className="p-2.5 rounded bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 text-xs text-amber-800 dark:text-amber-200 space-y-1">
                        <div className="flex items-center gap-1.5 font-medium">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          Validation Review
                        </div>
                        <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                          {quoteExtraction.validation.warnings.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Interactive Line Items Breakdown Table */}
                <div className="space-y-2 pt-3 border-t border-indigo-100 dark:border-indigo-900/50">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Line Items &amp; Parts Breakdown ({quoteItems.length})
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 dark:text-zinc-400">Currency</span>
                        <CurrencyAutocomplete
                          value={lineItemsCurrency}
                          onChange={(currency) => {
                            setLineItemsCurrency(currency);
                            setForm((prev) => ({ ...prev, currency }));
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsFullScreenTable(true)}
                        className="h-7 text-xs flex items-center gap-1.5 bg-white dark:bg-zinc-900 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                      >
                        <Maximize2 className="h-3.5 w-3.5" />
                        <span>Full Screen Table</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddItem}
                        className="h-7 text-xs flex items-center gap-1 bg-white dark:bg-zinc-900"
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Part
                      </Button>
                    </div>
                  </div>

                  <LineItemsPreviewTable s={s} />

                  {/* Bottom breakdown and calculations */}
                  <BottomBreakdownAndCalculations s={s} />
                </div>
              </div>
            )}

            {/* Product / Website Link (Placed directly above Request Title with Live Auto-Extraction) */}
            <ProductLinkField s={s} />

            {/* 4. Request Details: Title + 3-Column Meta Row (Requester | Department | Priority) */}
            <RequestTitleAndPriority s={s} />

            {/* 5. Accounts Payable Wire Transfer Information */}
            <WireTransferDocumentInvoice s={s} />

            {/* 6. Single Item specific Pricing & Quantity (Hidden for Accounts Payable & Recurring) */}
            <SingleItemFields s={s} />

            {/* 6b. Recurring & Subscription Specific Fields */}
            <RecurringRequestOptions s={s} />

            {/* 7. Description / Notes */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                {form.request_type === "RECURRING" ? "Subscription Terms / Description" : "Description / Justification"}
              </label>
              <Textarea
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={
                  form.request_type === "RECURRING"
                    ? "Billing schedule, renewal terms, seat count, invoice reference..."
                    : "What is being requested and why?"
                }
                rows={3}
                className="text-xs bg-white dark:bg-zinc-900"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || extractQuoteMutation.isPending}>
                {createMutation.isPending ? "Creating..." : form.request_type === "RECURRING" ? "Create Recurring Request" : "Create Request"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Full Screen Line Items Table Dialog */}
      <FullScreenLineItems s={s} />

      {/* Unsaved Changes Confirmation Dialog */}
      <AlertDialog open={showUnsavedConfirm} onOpenChange={setShowUnsavedConfirm}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              Unsaved Changes
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-600 dark:text-zinc-300 pt-1">
              You have unsaved changes in this request. If you leave now, your input will not be saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex items-center justify-end gap-2 pt-3">
            <AlertDialogCancel
              onClick={() => setShowUnsavedConfirm(false)}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300"
            >
              Stay
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setShowUnsavedConfirm(false);
                setIsDialogOpen(false);
              }}
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* QuickBooks Export Filter Dialog */}
      <QuickBooksExportDialog open={isQBExportOpen} onOpenChange={setIsQBExportOpen} />

      {/* File Preview Modal */}
      <FilePreviewModal
        open={isPreviewOpen}
        onOpenChange={handleClosePreview}
        target={previewTarget}
      />

      {/* Convert to Recurring Purchase Dialog */}
      {convertingRequest && (
        <ConvertToRecurringDialog
          open={Boolean(convertingRequest)}
          onOpenChange={(open) => !open && setConvertingRequest(null)}
          request={convertingRequest}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["purchasing"] });
            queryClient.invalidateQueries({ queryKey: ["recurring-requests"] });
          }}
        />
      )}
    </div>
  );
}
