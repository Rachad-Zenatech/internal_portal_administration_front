import { ArrowUp, CheckCircle2, Eye, FileText, Layers, Loader2, Plus, Printer, RotateCcw, Save, Sparkles } from "lucide-react";
import { InvoiceStepper } from "./components/InvoiceStepper";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { CurrencyAutocomplete } from "../Purchasing/fields/CurrencyAutocomplete";
import { OverridePriceModal } from "./modals/OverridePriceModal";
import { useGenerateInvoice } from "./generateInvoice/hooks/useGenerateInvoice";
import { TopHeaderActionsClean } from "./generateInvoice/sections/TopHeaderActionsClean";
import { QuickBalancePaidSnapshot } from "./generateInvoice/sections/QuickBalancePaidSnapshot";
import { RecordedPaymentsSettlementLedger } from "./generateInvoice/sections/RecordedPaymentsSettlementLedger";
import { RecurringBillingScheduleNext } from "./generateInvoice/sections/RecurringBillingScheduleNext";
import { CustomerSelectionCardWith } from "./generateInvoice/sections/CustomerSelectionCardWith";
import { TemplatePresetSelectorVisual } from "./generateInvoice/sections/TemplatePresetSelectorVisual";
import { InvoiceNumber } from "./generateInvoice/sections/InvoiceNumber";
import { LeftBillToCustomer } from "./generateInvoice/sections/LeftBillToCustomer";
import { ParentLineItemRow } from "./generateInvoice/sections/ParentLineItemRow";
import { PayableChargesSeparationBlock } from "./generateInvoice/sections/PayableChargesSeparationBlock";
import { Notes } from "./generateInvoice/sections/Notes";
import { ParentActivityItemRow } from "./generateInvoice/sections/ParentActivityItemRow";
import { ParentActivityItemRow2 } from "./generateInvoice/sections/ParentActivityItemRow2";
import { QuickEditAR } from "./generateInvoice/sections/QuickEditAR";
import { ModeSegmentedSwitcher } from "./generateInvoice/sections/ModeSegmentedSwitcher";
import { SaveAsNewTemplate } from "./generateInvoice/sections/SaveAsNewTemplate";
import { RenameTemplatePreset } from "./generateInvoice/sections/RenameTemplatePreset";
import { SendInvoiceStatementEmail } from "./generateInvoice/sections/SendInvoiceStatementEmail";
import { RecordPaymentModal } from "./generateInvoice/sections/RecordPaymentModal";

export default function GenerateInvoicePage() {
  const s = useGenerateInvoice();
  const { queryClient, selectedOverrideAddon, setSelectedOverrideAddon, setIsOverrideModalOpen, isOverrideModalOpen, applyTemplateMode, saveTemplateMutation, sortedCustomerTemplates, applyNewPresetName, applySetAsDefault, targetTemplateIdToOverwrite, setIsApplyTemplateModalOpen, billToName, selectedCustomer, isApplyTemplateModalOpen, fromPhone, isFieldVisible, fromEmail, fromAddress, wireRouting, achRouting, bankAccount, bankAddress, bankName, fromCompany, notes, subTotal, currency, calculatedTotals, computedNextRenewal, showTaxCol, showDiscountCol, showQtyCol, showCurrencyCol, showUnitPriceCol, showDateCol, visibleColumnCount, terms, dueDate, invoiceDate, invoiceNumber, billToAddress, billToEmail, billToPhone, layoutStyle, handlePrint, handleScrollToForm, lastPreviewedAt, pdfPreviewRef, handlePreviewAndScroll, invoiceStatus, handleAddLine, setCurrency, handleResetForm, saveSuccessMsg, currentInvoiceId, isTemplateLoading } = s;
  return (
    <div className="w-full space-y-6 print:min-h-0 print:p-0 print:m-0 print:max-w-none print:space-y-0 print:bg-white print:w-full">
      {/* ── Top Header Actions (Clean Single-Line Toolbar) ── */}
      <TopHeaderActionsClean s={s} />

      {/* ── Prominent Invoice Workflow & Stepper Card (Matching Quote Detail Layout) ── */}
      {currentInvoiceId && (
        <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 print:hidden">
          <QuickBalancePaidSnapshot s={s} />

          {/* Stepper Pipeline */}
          <div className="pt-3 border-t border-border space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Workflow Status</span>
              </span>
              <span className="text-xs">
                {(invoiceStatus || "").toUpperCase().startsWith("PAID") || (invoiceStatus || "").toUpperCase().includes("COMPLETED") || calculatedTotals.effectiveBalanceDue === 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Invoice Fully Paid &amp; Settled</span>
                  </span>
                ) : calculatedTotals.totalPaidAmount > 0 ? (
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    Partially Paid • ${calculatedTotals.totalPaidAmount.toFixed(2)} recorded • Remaining: ${calculatedTotals.effectiveBalanceDue.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    Invoice Issued • Awaiting Customer Payment Settlement
                  </span>
                )}
              </span>
            </div>

            <div className="py-1">
              <InvoiceStepper
                invoice={{
                  invoice_number: invoiceNumber,
                  status: invoiceStatus,
                  total_amount: Number(subTotal) || 0,
                  amount_paid: calculatedTotals.totalPaidAmount,
                  balance_due: calculatedTotals.effectiveBalanceDue,
                  due_date: dueDate,
                  is_sent: true,
                }}
              />
            </div>
          </div>

          {/* ── Recorded Payments & Settlement Ledger Section ── */}
          <RecordedPaymentsSettlementLedger s={s} />

          {/* Recurring Billing Schedule & Next Invoice Generation Panel (Only for Recurring Invoices) */}
          <RecurringBillingScheduleNext s={s} />
        </div>
      )}

      {/* ── Loading Overlay Screen while fetching invoice & customer details ── */}
      {isTemplateLoading && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border shadow-2xl rounded-2xl p-8 max-w-md w-full text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-foreground">
                {currentInvoiceId ? `Loading Invoice ${invoiceNumber || "Details"}` : "Loading Customer & Invoice Data"}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Populating customer profile, line items, and pricing configurations...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Status Notifications ── */}
      {saveSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 print:hidden animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── 1. INVOICE INPUT FORM SECTION (Dedicated Form Fields) ────── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-6 print:hidden">
        {/* Customer Selection Card with Quick Edit */}
        <CustomerSelectionCardWith s={s} />

        {/* ── Template Preset Selector & Visual Theme Selector Card (Only shown for New Invoices, Hidden for Generated Invoices) ── */}
        <TemplatePresetSelectorVisual s={s} />

        {/* Main Form Fields Container */}
        <div className="p-5 sm:p-7 rounded-2xl bg-card border border-border shadow-sm space-y-7">
          {/* Header & Reset Button */}
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Invoice Details & Line Items
              </h2>
              <p className="text-xs text-muted-foreground">
                Enter invoice metadata, billing addresses, due date, terms, and line items. Click &quot;Preview PDF&quot; below to generate and view the populated document.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetForm}
              className="text-xs text-muted-foreground hover:text-foreground gap-1 h-8 px-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Form</span>
            </Button>
          </div>

          {/* 1. General Invoice Metadata with Due Date & Terms */}
          <InvoiceNumber s={s} />

          {/* 2. Bill To & From Fields (2 Columns) */}
          <LeftBillToCustomer s={s} />

          {/* 3. Line Items Editor with Activity & Description */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Invoice Line Items</span>
                </h4>
                <p className="text-xs text-muted-foreground">
                  Specify activity items and attach add-on services directly under each item as sub-items.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground font-semibold">Currency:</span>
                  <div className="w-44">
                    <CurrencyAutocomplete
                      value={currency}
                      onChange={(newCurr) => setCurrency(newCurr || "USD")}
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddLine}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 border-blue-200 dark:border-blue-900/50 flex items-center gap-1.5 cursor-pointer font-semibold shadow-2xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Line Item
                </Button>
              </div>
            </div>

            {/* Line Items Table with Quotes Columns & Indented Sub-items */}
            <div className="overflow-x-auto border border-border rounded-xl shadow-2xs bg-card">
              <table className="w-full text-xs text-left border-collapse min-w-[1100px]">
                <thead>
                  <tr className="bg-muted/80 text-muted-foreground font-bold uppercase tracking-wider text-[11px] border-b border-border">
                    <th className="py-2.5 px-2.5 w-[130px] min-w-[130px] text-left">Start Date</th>
                    <th className="py-2.5 px-3 min-w-[320px] text-left">Item &amp; Description</th>
                    <th className="py-2.5 px-2 w-[95px] min-w-[95px] text-left">Unit price</th>
                    <th className="py-2.5 px-2 w-[110px] min-w-[110px] text-left">Currency</th>
                    <th className="py-2.5 px-2 w-[75px] min-w-[75px] text-left">Quantity</th>
                    <th className="py-2.5 px-2 w-[110px] min-w-[110px] text-left">Unit discount</th>
                    <th className="py-2.5 px-2 w-[130px] min-w-[130px] text-left">Billing frequency</th>
                    <th className="py-2.5 px-2 w-[95px] min-w-[95px] text-left">Chargeable months</th>
                    <th className="py-2.5 px-2 w-[145px] min-w-[145px] text-left">Service start date</th>
                    <th className="py-2.5 px-2 w-[80px] min-w-[80px] text-left">Tax rate</th>
                    <th className="py-2.5 px-3 w-[100px] min-w-[100px] text-right">Net price</th>
                    <th className="py-2.5 px-2 w-[70px] min-w-[70px] text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-[12px]">
                  <ParentLineItemRow s={s} />
                </tbody>
              </table>
            </div>

            {/* Subtotal Summary Banner displaying Selected Currency */}
            <div className="flex justify-end pt-1">
              <div className="flex items-center gap-3 bg-muted/60 px-5 py-2.5 rounded-xl border border-border flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    Status:
                  </span>
                  <Badge
                    className={`text-xs px-2.5 py-0.5 font-bold ${
                      calculatedTotals.effectiveBalanceDue === 0 && calculatedTotals.totalPaidAmount > 0
                        ? (invoiceStatus.toUpperCase() === "PAID (PRORATED)"
                            ? "bg-teal-50 text-teal-800 border-teal-300 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-700"
                            : "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700")
                        : (calculatedTotals.totalPaidAmount > 0
                            ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300"
                            : (invoiceStatus && invoiceStatus.toUpperCase() !== "DRAFT" ? "bg-blue-50 text-blue-700 border-blue-300" : "bg-slate-100 text-slate-700 border-slate-300"))
                    }`}
                  >
                    {calculatedTotals.effectiveBalanceDue === 0 && calculatedTotals.totalPaidAmount > 0
                      ? (invoiceStatus.toUpperCase().startsWith("PAID") ? invoiceStatus : "PAID")
                      : (calculatedTotals.totalPaidAmount > 0 ? "Open / Unpaid" : (invoiceStatus || "Open / Unpaid"))}
                  </Badge>
                </div>
                <div className="h-4 w-px bg-border shrink-0" />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    Total Invoiced:
                  </span>
                  <span className="font-mono text-sm font-semibold text-foreground">
                    {currency} ${(Number(subTotal) || 0).toFixed(2)}
                  </span>
                </div>
                {calculatedTotals.totalPaidAmount > 0 && (
                  <>
                    <div className="h-4 w-px bg-border shrink-0" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">
                        Amount Paid:
                      </span>
                      <span className="font-mono text-sm font-semibold text-emerald-600">
                        -{currency} ${calculatedTotals.totalPaidAmount.toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
                <div className="h-4 w-px bg-border shrink-0" />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    Calculated Balance Due:
                  </span>
                  <span className={`font-mono text-base font-black ${calculatedTotals.effectiveBalanceDue === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-indigo-600 dark:text-indigo-400"}`}>
                    {currency} ${calculatedTotals.effectiveBalanceDue.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Payable Charges Separation Block (Directly Under Calculated Balance Due) ── */}
            <PayableChargesSeparationBlock s={s} />
          </div>

          {/* 4. Notes & Remittance / Payment Information */}
          <Notes s={s} />

          {/* Form Action Controls */}
          <div className="flex items-center justify-between flex-wrap gap-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span>Click &quot;Preview PDF & Populate&quot; to generate and view the populated document below.</span>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                size="default"
                onClick={handlePreviewAndScroll}
                className="text-xs sm:text-sm font-bold gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all px-5 cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Preview PDF & Populate</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── 2. PDF DOCUMENT PREVIEW SECTION (Populated View & Canvas) ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div ref={pdfPreviewRef} className="space-y-4 pt-2 print:space-y-0 print:pt-0 print:m-0 print:w-full">
        {/* Preview Control Bar (Hidden when printing) */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between flex-wrap gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">
                  PDF Document Preview
                </h3>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                  {currency}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {lastPreviewedAt
                  ? `Populated with current form data (${lastPreviewedAt.toLocaleTimeString()})`
                  : "Live representation of the exported PDF document"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleScrollToForm}
              className="text-xs gap-1.5 bg-card hover:bg-muted cursor-pointer"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>Back to Form</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs gap-1.5 bg-card hover:bg-muted cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Export PDF</span>
            </Button>
          </div>
        </div>

        {/* ── INVOICE TEMPLATE CANVAS (Pure PDF Layout with Populated Data) ── */}
        <div
          id="invoice-document-canvas"
          className="bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-200 overflow-hidden print:border-none print:shadow-none print:rounded-none print:m-0 print:p-0 print:w-full transition-all duration-300"
          style={{ fontFamily: "'Inter', Arial, sans-serif" }}
        >
          {/* ══════════════════════════════════════════════════════════════ */}
          {/* TEMPLATE 1: PACE+ (SLATE BLUE) ═══════════════════════════════ */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {(layoutStyle === "pace_plus" || layoutStyle === "modern") && (
            <div className="p-6 sm:p-10 print:p-4 space-y-6 print:space-y-3 bg-white text-slate-900 print:text-[11px]">
              {/* Header: Logo (Left), Address (Middle), Invoice Title (Right) */}
              <div className="grid grid-cols-12 gap-4 items-center pb-2">
                {/* Logo PACE+ (Original image from attachments) */}
                <div className="col-span-12 sm:col-span-5 flex items-center">
                  <img
                    src="/pace_plus_logo.png"
                    alt="PACE+"
                    className="h-14 sm:h-16 lg:h-18 w-auto max-w-[280px] object-contain select-none"
                  />
                </div>

                {/* Company Address (Middle) */}
                <div className="col-span-12 sm:col-span-4 text-xs text-slate-800 leading-relaxed pt-1 whitespace-pre-line">
                  {isFieldVisible("from_address") && fromAddress ? fromAddress : ""}
                </div>

                {/* Invoice Title (Right) */}
                <div className="col-span-12 sm:col-span-3 text-right">
                  <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
                    Invoice
                  </h1>
                </div>
              </div>

              {/* Bill To Box */}
              {(isFieldVisible("bill_to_name") || isFieldVisible("bill_to_phone") || isFieldVisible("bill_to_email") || isFieldVisible("bill_to_address")) && (
                <div className="w-full sm:w-80 border border-[#dce6f1] rounded-xs overflow-hidden">
                  <div
                    className="py-1 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-800"
                    style={{ backgroundColor: "#dce6f1" }}
                  >
                    BILL TO
                  </div>
                  <div className="p-3 text-xs text-slate-800 space-y-0.5 leading-relaxed bg-white">
                    {isFieldVisible("bill_to_name") && billToName && (
                      <div className="font-semibold text-slate-900">
                        {billToName}
                      </div>
                    )}
                    {isFieldVisible("bill_to_phone") && billToPhone && <div>{billToPhone}</div>}
                    {isFieldVisible("bill_to_email") && billToEmail && <div>{billToEmail}</div>}
                    {isFieldVisible("bill_to_address") && billToAddress && (
                      <div className="whitespace-pre-line pt-0.5 text-slate-700">
                        {billToAddress}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Invoice Summary Table (6 Columns: INVOICE #, DATE, TOTAL DUE, DUE DATE, TERMS, ENCLOSED) */}
              <div className="overflow-hidden border border-[#dce6f1] rounded-xs">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr
                      className="text-[11px] font-bold uppercase tracking-wider text-slate-800 border-b border-[#cbd5e1]"
                      style={{ backgroundColor: "#dce6f1" }}
                    >
                      <th className="py-1.5 px-3 border-r border-[#cbd5e1] w-[16%]">INVOICE #</th>
                      <th className="py-1.5 px-3 border-r border-[#cbd5e1] w-[16%]">DATE</th>
                      <th className="py-1.5 px-3 border-r border-[#cbd5e1] w-[18%]">TOTAL DUE</th>
                      <th className="py-1.5 px-3 border-r border-[#cbd5e1] w-[18%]">DUE DATE</th>
                      <th className="py-1.5 px-3 border-r border-[#cbd5e1] w-[18%]">TERMS</th>
                      <th className="py-1.5 px-3 w-[14%]">ENCLOSED</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white text-slate-900 font-medium">
                      <td className="py-2 px-3 border-r border-[#dce6f1] font-mono">
                        {isFieldVisible("invoice_number") ? invoiceNumber || "18067" : "—"}
                      </td>
                      <td className="py-2 px-3 border-r border-[#dce6f1]">
                        {isFieldVisible("invoice_date") ? invoiceDate : "—"}
                      </td>
                      <td className="py-2 px-3 border-r border-[#dce6f1] font-semibold">
                        {currency} ${calculatedTotals.effectiveBalanceDue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 border-r border-[#dce6f1]">
                        {isFieldVisible("due_date") ? dueDate : "—"}
                      </td>
                      <td className="py-2 px-3 border-r border-[#dce6f1]">
                        {isFieldVisible("terms") ? terms || "Due on receipt" : "—"}
                      </td>
                      <td className="py-2 px-3 bg-slate-50/40"></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Line Items Table (Dynamic Columns - hides non-filled / 0 / null columns) */}
              <div className="overflow-x-auto border border-[#dce6f1] rounded-xs w-full">
                <table
                  className="w-full text-xs text-left border-collapse"
                  style={{ minWidth: visibleColumnCount >= 8 ? "850px" : "100%", tableLayout: "auto" }}
                >
                  <thead>
                    <tr
                      className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-800 border-b border-[#cbd5e1]"
                      style={{ backgroundColor: "#dce6f1" }}
                    >
                      {showDateCol && (
                        <th className="py-2 px-2 border-r border-[#cbd5e1] text-left w-[85px] min-w-[85px]">DATE</th>
                      )}
                      <th className="py-2 px-3 border-r border-[#cbd5e1] text-left min-w-[200px]">ACTIVITY / ITEM &amp; DESCRIPTION</th>
                      {showUnitPriceCol && (
                        <th className="py-2 px-2 border-r border-[#cbd5e1] text-right w-[80px] min-w-[80px]">UNIT PRICE</th>
                      )}
                      {showCurrencyCol && (
                        <th className="py-2 px-1 border-r border-[#cbd5e1] text-center w-[55px] min-w-[55px]">CURRENCY</th>
                      )}
                      {showQtyCol && (
                        <th className="py-2 px-1 border-r border-[#cbd5e1] text-center w-[40px] min-w-[40px]">QTY</th>
                      )}
                      {showDiscountCol && (
                        <th className="py-2 px-1.5 border-r border-[#cbd5e1] text-center w-[75px] min-w-[75px]">UNIT DISC</th>
                      )}
                      {showTaxCol && (
                        <th className="py-2 px-1 border-r border-[#cbd5e1] text-center w-[45px] min-w-[45px]">TAX</th>
                      )}
                      <th className="py-2 px-2.5 text-right w-[90px] min-w-[90px]">NET PRICE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dce6f1]">
                    <ParentActivityItemRow s={s} />
                  </tbody>
                </table>
              </div>

              {/* Next Renewal Projection in Pace+ PDF */}
              {computedNextRenewal && (
                <div className="mt-3 p-3 rounded-lg border border-indigo-200 bg-indigo-50/50 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-indigo-950 uppercase tracking-wide text-[11px]">
                        Next renewal — not due now
                      </div>
                      <div className="text-slate-600 text-[11px] mt-0.5">
                        {computedNextRenewal.summary_text}
                      </div>
                    </div>
                    <div className="text-right font-mono font-bold text-sm text-indigo-950">
                      ${(Number(computedNextRenewal.total_renewal_amount) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {computedNextRenewal.frequency_short || "/ yr"}
                    </div>
                  </div>
                </div>
              )}

              {/* Balance Due & Payment Breakdown (Right Aligned) */}
              <div className="flex justify-end pt-2">
                <div className="space-y-1 text-right">
                  {calculatedTotals.totalPaidAmount > 0 ? (
                    <>
                      <div className="flex justify-end items-center gap-4 text-xs text-slate-600">
                        <span className="font-medium">Total Invoiced:</span>
                        <span className="font-mono">{currency} ${(Number(subTotal) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-end items-center gap-4 text-xs text-emerald-600 font-medium">
                        <span>Amount Paid:</span>
                        <span className="font-mono">-{currency} ${calculatedTotals.totalPaidAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-end items-baseline gap-4 pt-1.5 border-t border-slate-200">
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                          BALANCE DUE
                        </span>
                        <span className="text-2xl font-bold font-sans text-slate-900">
                          {currency} ${calculatedTotals.effectiveBalanceDue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-end items-baseline gap-6">
                      <span className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
                        BALANCE DUE
                      </span>
                      <span className="text-2xl font-bold font-sans text-slate-900">
                        {currency} ${(Number(subTotal) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Remittance / Payment Footer */}
              <div className="pt-4 print:pt-2 text-xs print:text-[11px] text-slate-800 space-y-2 print:space-y-1 leading-relaxed border-t border-transparent">
                {isFieldVisible("notes") && notes && (
                  <p className="text-slate-900 font-medium whitespace-pre-line">{notes}</p>
                )}

                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-900">Pay to:</div>
                  {isFieldVisible("from_company") && fromCompany && <div>Title on account: {fromCompany}</div>}
                  {isFieldVisible("bank_name") && bankName && <div>Bank name: {bankName}</div>}
                  {isFieldVisible("bank_account") && bankAccount && <div>Account number: {bankAccount}</div>}
                  {isFieldVisible("ach_routing") && achRouting && <div>ACH routing number: {achRouting}</div>}
                  {isFieldVisible("wire_routing") && wireRouting && <div>Wire routing number: {wireRouting}</div>}
                  {isFieldVisible("bank_address") && bankAddress && <div>Bank address: {bankAddress}</div>}
                  {isFieldVisible("from_address") && fromAddress && (
                    <div className="whitespace-pre-line">Business address: {fromAddress}</div>
                  )}
                  {isFieldVisible("from_email") && fromEmail && <div>{fromEmail}</div>}
                  {isFieldVisible("from_phone") && fromPhone && <div>{fromPhone}</div>}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* TEMPLATE 2: INTERLINKONE (MINT TEAL) ═════════════════════════ */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {(layoutStyle === "interlinkone" || layoutStyle === "classic") && (
            <div className="p-6 sm:p-10 print:p-4 space-y-6 print:space-y-3 bg-white text-slate-900 print:text-[11px]">
              {/* Header: Logo (Left with HIPAA badge), Address (Middle), Invoice Title (Right) */}
              <div className="grid grid-cols-12 gap-4 items-center pb-2">
                {/* Logo interlinkONE (Original image from attachments) */}
                <div className="col-span-12 sm:col-span-5 flex items-center">
                  <img
                    src="/interlinkone_logo.png"
                    alt="interlinkONE"
                    className="h-14 sm:h-16 lg:h-18 w-auto max-w-[280px] object-contain select-none"
                  />
                </div>

                {/* Company Address (Middle) */}
                <div className="col-span-12 sm:col-span-4 text-xs text-slate-800 leading-relaxed pt-1 whitespace-pre-line">
                  {isFieldVisible("from_address") && fromAddress ? fromAddress : ""}
                </div>

                {/* Invoice Title (Right) */}
                <div className="col-span-12 sm:col-span-3 text-right">
                  <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
                    Invoice
                  </h1>
                </div>
              </div>

              {/* Bill To Box */}
              {(isFieldVisible("bill_to_name") || isFieldVisible("bill_to_phone") || isFieldVisible("bill_to_email") || isFieldVisible("bill_to_address")) && (
                <div className="w-full sm:w-80 border border-[#d4f1ee] rounded-xs overflow-hidden">
                  <div
                    className="py-1 px-3 text-[11px] font-bold uppercase tracking-wider text-[#006666]"
                    style={{ backgroundColor: "#d4f1ee" }}
                  >
                    BILL TO
                  </div>
                  <div className="p-3 text-xs text-slate-800 space-y-0.5 leading-relaxed bg-white">
                    {isFieldVisible("bill_to_name") && billToName && (
                      <div className="font-semibold text-slate-900">
                        {billToName}
                      </div>
                    )}
                    {isFieldVisible("bill_to_phone") && billToPhone && <div>{billToPhone}</div>}
                    {isFieldVisible("bill_to_email") && billToEmail && <div>{billToEmail}</div>}
                    {isFieldVisible("bill_to_address") && billToAddress && (
                      <div className="whitespace-pre-line pt-0.5 text-slate-700">
                        {billToAddress}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Invoice Summary Table (6 Columns: INVOICE #, DATE, TOTAL DUE, DUE DATE, TERMS, ENCLOSED) */}
              <div className="overflow-hidden border border-[#d4f1ee] rounded-xs">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr
                      className="text-[11px] font-bold uppercase tracking-wider text-slate-800 border-b border-[#b2e8e2]"
                      style={{ backgroundColor: "#d4f1ee" }}
                    >
                      <th className="py-1.5 px-3 border-r border-[#b2e8e2] w-[16%]">INVOICE #</th>
                      <th className="py-1.5 px-3 border-r border-[#b2e8e2] w-[16%]">DATE</th>
                      <th className="py-1.5 px-3 border-r border-[#b2e8e2] w-[18%]">TOTAL DUE</th>
                      <th className="py-1.5 px-3 border-r border-[#b2e8e2] w-[18%]">DUE DATE</th>
                      <th className="py-1.5 px-3 border-r border-[#b2e8e2] w-[18%]">TERMS</th>
                      <th className="py-1.5 px-3 w-[14%]">ENCLOSED</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white text-slate-900 font-medium">
                      <td className="py-2 px-3 border-r border-[#d4f1ee] font-mono">
                        {isFieldVisible("invoice_number") ? invoiceNumber || "18063" : "—"}
                      </td>
                      <td className="py-2 px-3 border-r border-[#d4f1ee]">
                        {isFieldVisible("invoice_date") ? invoiceDate : "—"}
                      </td>
                      <td className="py-2 px-3 border-r border-[#d4f1ee] font-semibold">
                        {currency} ${calculatedTotals.effectiveBalanceDue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 border-r border-[#d4f1ee]">
                        {isFieldVisible("due_date") ? dueDate : "—"}
                      </td>
                      <td className="py-2 px-3 border-r border-[#d4f1ee]">
                        {isFieldVisible("terms") ? terms || "Due on receipt" : "—"}
                      </td>
                      <td className="py-2 px-3 bg-teal-50/20"></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Line Items Table (Dynamic Columns - hides non-filled / 0 / null columns) */}
              <div className="overflow-x-auto border border-[#d4f1ee] rounded-xs w-full">
                <table
                  className="w-full text-xs text-left border-collapse"
                  style={{ minWidth: visibleColumnCount >= 8 ? "850px" : "100%", tableLayout: "auto" }}
                >
                  <thead>
                    <tr
                      className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-[#006666] border-b border-[#b2e8e2]"
                      style={{ backgroundColor: "#d4f1ee" }}
                    >
                      {showDateCol && (
                        <th className="py-2 px-2 border-r border-[#b2e8e2] text-left w-[85px] min-w-[85px]">DATE</th>
                      )}
                      <th className="py-2 px-3 border-r border-[#b2e8e2] text-left min-w-[200px]">ACTIVITY / ITEM &amp; DESCRIPTION</th>
                      {showUnitPriceCol && (
                        <th className="py-2 px-2 border-r border-[#b2e8e2] text-right w-[80px] min-w-[80px]">UNIT PRICE</th>
                      )}
                      {showCurrencyCol && (
                        <th className="py-2 px-1 border-r border-[#b2e8e2] text-center w-[55px] min-w-[55px]">CURRENCY</th>
                      )}
                      {showQtyCol && (
                        <th className="py-2 px-1 border-r border-[#b2e8e2] text-center w-[40px] min-w-[40px]">QTY</th>
                      )}
                      {showDiscountCol && (
                        <th className="py-2 px-1.5 border-r border-[#b2e8e2] text-center w-[75px] min-w-[75px]">UNIT DISC</th>
                      )}
                      {showTaxCol && (
                        <th className="py-2 px-1 border-r border-[#b2e8e2] text-center w-[45px] min-w-[45px]">TAX</th>
                      )}
                      <th className="py-2 px-2.5 text-right w-[90px] min-w-[90px]">NET PRICE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d4f1ee]">
                    <ParentActivityItemRow2 s={s} />
                  </tbody>
                </table>
              </div>

              {/* Next Renewal Projection in interlinkONE PDF */}
              {computedNextRenewal && (
                <div className="mt-3 p-3 rounded-lg border border-teal-200 bg-teal-50/50 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-teal-950 uppercase tracking-wide text-[11px]">
                        Next renewal — not due now
                      </div>
                      <div className="text-slate-600 text-[11px] mt-0.5">
                        {computedNextRenewal.summary_text}
                      </div>
                    </div>
                    <div className="text-right font-mono font-bold text-sm text-teal-950">
                      ${(Number(computedNextRenewal.total_renewal_amount) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {computedNextRenewal.frequency_short || "/ yr"}
                    </div>
                  </div>
                </div>
              )}

              {/* Balance Due & Payment Breakdown (Right Aligned) */}
              <div className="flex justify-end pt-2">
                <div className="space-y-1 text-right">
                  {calculatedTotals.totalPaidAmount > 0 ? (
                    <>
                      <div className="flex justify-end items-center gap-4 text-xs text-slate-600">
                        <span className="font-medium">Total Invoiced:</span>
                        <span className="font-mono">{currency} ${(Number(subTotal) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-end items-center gap-4 text-xs text-emerald-600 font-medium">
                        <span>Amount Paid:</span>
                        <span className="font-mono">-{currency} ${calculatedTotals.totalPaidAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-end items-baseline gap-4 pt-1.5 border-t border-slate-200">
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                          BALANCE DUE
                        </span>
                        <span className="text-2xl font-bold font-sans text-slate-900">
                          {currency} ${calculatedTotals.effectiveBalanceDue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-end items-baseline gap-6">
                      <span className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
                        BALANCE DUE
                      </span>
                      <span className="text-2xl font-bold font-sans text-slate-900">
                        {currency} ${(Number(subTotal) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Remittance / Payment Footer */}
              <div className="pt-4 print:pt-2 text-xs print:text-[11px] text-slate-800 space-y-2 print:space-y-1 leading-relaxed border-t border-transparent">
                {isFieldVisible("notes") && notes && (
                  <p className="text-slate-900 font-medium whitespace-pre-line">{notes}</p>
                )}

                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-900">Bank Info: Payments/Credits</div>
                  {isFieldVisible("from_company") && fromCompany && <div>Company: {fromCompany}</div>}
                  {isFieldVisible("bank_name") && bankName && <div>Bank Name: {bankName}</div>}
                  {isFieldVisible("bank_address") && bankAddress && <div>Bank Address: {bankAddress}</div>}
                  {isFieldVisible("bank_account") && bankAccount && <div>Account #: {bankAccount}</div>}
                  {isFieldVisible("ach_routing") && achRouting && <div>Routing #: {achRouting}</div>}
                  {isFieldVisible("wire_routing") && wireRouting && <div>Wire#: {wireRouting}</div>}
                  {isFieldVisible("from_address") && fromAddress && (
                    <div className="whitespace-pre-line">Business Address: {fromAddress}</div>
                  )}
                  {isFieldVisible("from_email") && fromEmail && <div>{fromEmail}</div>}
                  {isFieldVisible("from_phone") && fromPhone && <div>{fromPhone}</div>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── 3. QUICK EDIT A/R CUSTOMER DIALOG ─────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <QuickEditAR s={s} />

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── 3.5 APPLY CHANGES TO TEMPLATE / PRESET SELECTION DIALOG ──────── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Dialog open={isApplyTemplateModalOpen} onOpenChange={setIsApplyTemplateModalOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <Save className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Apply Changes to Template</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Choose whether to update an existing template preset or create a new preset for{" "}
              <strong>{selectedCustomer?.name || billToName || "this customer"}</strong>.
            </DialogDescription>
          </DialogHeader>

          <ModeSegmentedSwitcher s={s} />

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsApplyTemplateModalOpen(false)}
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                saveTemplateMutation.mutate({
                  mode: applyTemplateMode,
                  templateId: targetTemplateIdToOverwrite,
                  newPresetName: applyNewPresetName,
                  isDefault: applySetAsDefault,
                });
              }}
              disabled={
                saveTemplateMutation.isPending ||
                (applyTemplateMode === "new" && !applyNewPresetName.trim()) ||
                (applyTemplateMode === "existing" && sortedCustomerTemplates.length === 0)
              }
              className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
            >
              {saveTemplateMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>
                {applyTemplateMode === "new" ? "Save as New Preset" : "Apply & Overwrite Preset"}
              </span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── 4. SAVE AS NEW TEMPLATE PRESET DIALOG ───────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <SaveAsNewTemplate s={s} />

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── 5. RENAME TEMPLATE PRESET DIALOG ───────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <RenameTemplatePreset s={s} />

      {/* ── Send Invoice Statement Email Modal ── */}
      <SendInvoiceStatementEmail s={s} />


      {/* ── Record Payment Modal ── */}
      <RecordPaymentModal s={s} />

      {/* ── 5. MANUAL OVERRIDE MODAL ─────────────────────────────────── */}
      <OverridePriceModal
        isOpen={isOverrideModalOpen}
        onClose={() => {
          setIsOverrideModalOpen(false);
          setSelectedOverrideAddon(null);
        }}
        addon={selectedOverrideAddon}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["ar-invoices"] });
        }}
      />
    </div>
  );
}

export type { InvoiceSubItem, LineItemFormRow, InvoiceLayoutStyle } from "./generateInvoice/types";
