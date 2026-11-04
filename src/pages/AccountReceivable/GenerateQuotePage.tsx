import { CheckCircle2, ExternalLink, Trash2, Upload } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { SendQuoteModal } from "./modals/SendQuoteModal";
import { useGenerateQuotePage } from "./generateQuotePage/hooks/useGenerateQuotePage";
import { TopHeaderActionsClean } from "./generateQuotePage/sections/TopHeaderActionsClean";
import { LeftColumnQuotationFor } from "./generateQuotePage/sections/LeftColumnQuotationFor";
import { LineItemsTable } from "./generateQuotePage/sections/LineItemsTable";

export default function GenerateQuotePage() {
  const s = useGenerateQuotePage();
  const { currentQuoteObj, queryClient, setIsSendModalOpen, isSendModalOpen, preparedByEmail, preparedByName, notes, setNotes, closingMessage, setClosingMessage, totalAmount, formatCurrency, taxAmount, discountAmount, subtotal, setTax, tax, setDiscount, discount, companyName, setCompanyName, fileInputRef, handleRemoveLogo, logoUrl, handleLogoUpload, quoteId, navigate, saveSuccessMsg } = s;
  return (
    <div className="w-full space-y-6 print:min-h-0 print:p-0 print:m-0 print:max-w-none print:space-y-0 print:bg-white print:w-full">
      {/* ── Top Header Actions (Clean Single-Line Toolbar) ── */}
      <TopHeaderActionsClean s={s} />

      {/* ── Status Notifications ── */}
      {saveSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-xs print:hidden animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          {quoteId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/account-receivable/quotes/${quoteId}`)}
              className="h-6 text-[11px] text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 gap-1 cursor-pointer"
            >
              <span>View Details</span>
              <ExternalLink className="w-3 h-3" />
            </Button>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── EXACT VISUAL QUOTATION DOCUMENT FORMAT (DIRECT EDITABLE) ─── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="p-6 sm:p-8 lg:p-10 bg-white text-slate-900 border border-slate-200/90 rounded-2xl shadow-sm font-sans text-sm space-y-8 min-h-[750px] w-full print:shadow-none print:border-none print:p-0">
        {/* Top Brand Logo & Company Name */}
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
            id="quote-paper-logo"
          />

          <div className="flex items-center justify-between">
            {logoUrl ? (
              <div className="flex items-center gap-2 group">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="h-20 sm:h-24 max-w-[340px] flex items-center cursor-pointer hover:opacity-85 transition-opacity"
                  title="Click to change logo"
                >
                  <img
                    src={logoUrl}
                    alt="Company Logo"
                    className="max-h-full max-w-full h-auto w-auto object-contain object-left"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="p-1.5 text-slate-400 hover:text-rose-600 print:hidden cursor-pointer rounded-md hover:bg-rose-50"
                  title="Remove Logo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-3 border border-dashed border-slate-300 rounded-xl text-xs text-slate-500 hover:text-amber-600 hover:border-amber-400 cursor-pointer flex items-center gap-2 print:hidden"
              >
                <Upload className="w-4 h-4" />
                <span className="font-medium">Upload Company Logo</span>
              </div>
            )}
          </div>

          {/* Company Name under Logo */}
          <div className="print:hidden max-w-sm pt-1">
            <div className="flex items-center gap-2 text-[14px]">
              <Label htmlFor="quote-company-name" className="font-bold shrink-0 text-[14px]">Company Name:</Label>
              <Input
                id="quote-company-name"
                name="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company name..."
                className="h-8 text-[14px] font-semibold text-slate-900 border-slate-200 focus:border-amber-500 bg-transparent px-2.5 flex-1 font-sans"
              />
            </div>
          </div>
          {companyName && (
            <div className="hidden print:block text-base font-bold text-slate-900 pt-0.5">
              {companyName}
            </div>
          )}
        </div>

        {/* 2-Column Header Section: Quotation for vs Date / Meta */}
        {/* 2-Column Header Section: Quotation for vs Date / Meta */}
        <LeftColumnQuotationFor s={s} />

        {/* Line Items Table */}
        <LineItemsTable s={s} />

        {/* Totals Section (Right-aligned under table) */}
        <div className="flex justify-end pt-1">
          {/* Screen Interactive Mode */}
          <div className="print:hidden w-72 space-y-2 text-[14px]">
            <div className="flex justify-between items-center text-slate-800">
              <span>Subtotal</span>
              <span className="font-normal">{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex justify-between items-center text-slate-800">
              <Label htmlFor="quote-discount-input" className="text-[14px] font-normal text-slate-800">Discount</Label>
              <div className="w-28">
                <Input
                  id="quote-discount-input"
                  name="discount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0.00"
                  className="h-6 text-[14px] text-right border-slate-200 focus:border-amber-500 bg-transparent px-1"
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-slate-800">
              <Label htmlFor="quote-tax-input" className="text-[14px] font-normal text-slate-800">Tax</Label>
              <div className="w-28">
                <Input
                  id="quote-tax-input"
                  name="tax"
                  type="number"
                  step="0.01"
                  min="0"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                  placeholder="0.00"
                  className="h-6 text-[14px] text-right border-slate-200 focus:border-amber-500 bg-transparent px-1"
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-slate-900 font-bold pt-2 border-t border-slate-200 text-[15px]">
              <span>Total</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          {/* Print Mode: Clean Totals Breakdown */}
          <div className="hidden print:block w-72 space-y-1.5 text-xs text-right">
            <div className="flex justify-between items-center text-slate-700">
              <span className="font-medium">Subtotal:</span>
              <span className="font-mono">{formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-amber-700">
                <span className="font-medium">Discount:</span>
                <span className="font-mono">-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between items-center text-slate-700">
                <span className="font-medium">Tax:</span>
                <span className="font-mono">+{formatCurrency(taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-2 border-t border-slate-300 text-slate-900 font-bold">
              <span className="text-xs uppercase tracking-wider">TOTAL:</span>
              <span className="text-base font-bold font-mono">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Closing Statement & Sign-off (Left-aligned bottom) */}
        <div className="pt-6 space-y-6 text-[13.5px] leading-relaxed text-slate-900">
          {/* Screen Interactive Mode */}
          <div className="print:hidden">
            <Textarea
              id="quote-closing-message"
              name="closingMessage"
              value={closingMessage}
              onChange={(e) => setClosingMessage(e.target.value)}
              placeholder="We are thankful for the opportunity to partner with your team..."
              rows={3}
              className="text-[13.5px] leading-relaxed text-slate-800 border-slate-200 focus:border-amber-500 bg-transparent resize-none p-2 w-full"
            />
          </div>

          {/* Print Mode: Clean Paragraph */}
          {closingMessage && (
            <div className="hidden print:block">
              <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                {closingMessage}
              </p>
            </div>
          )}

          {/* Notes Section */}
          <div className="print:hidden space-y-1 pt-2">
            <Label htmlFor="quote-notes-field" className="text-xs font-semibold text-slate-700">
              Notes &amp; Terms (Optional):
            </Label>
            <Textarea
              id="quote-notes-field"
              name="quoteNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional internal or customer notes..."
              rows={2}
              className="text-xs leading-relaxed text-slate-800 border-slate-200 focus:border-amber-500 bg-transparent resize-none p-2 w-full"
            />
          </div>

          {notes && (
            <div className="hidden print:block pt-2">
              <div className="text-[11px] font-bold text-slate-900">Notes:</div>
              <p className="text-[10.5px] text-slate-700 whitespace-pre-line leading-relaxed">
                {notes}
              </p>
            </div>
          )}

          <div className="space-y-1 pt-2">
            <div className="text-xs text-slate-800">Thank you,</div>
            <div className="text-xs font-bold text-slate-900">{preparedByName || "Steve Rhode"}</div>
            {preparedByEmail && <div className="text-[11px] text-slate-600">{preparedByEmail}</div>}
          </div>
        </div>
      </div>

      {/* Send Quote Modal */}
      {currentQuoteObj && (
        <SendQuoteModal
          isOpen={isSendModalOpen}
          onClose={() => setIsSendModalOpen(false)}
          quote={currentQuoteObj}
          onSentSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["ar-quote-detail", currentQuoteObj.id] });
            queryClient.invalidateQueries({ queryKey: ["ar-quotes"] });
            queryClient.invalidateQueries({ queryKey: ["ar-quote-audit", currentQuoteObj.id] });
          }}
        />
      )}
    </div>
  );
}

export type { QuoteLineItem } from "./generateQuotePage/types";
export { createEmptyQuoteLineItem } from "./generateQuotePage/utils";
