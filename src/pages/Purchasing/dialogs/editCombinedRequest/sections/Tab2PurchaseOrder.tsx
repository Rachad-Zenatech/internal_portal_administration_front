import { TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { VendorAutocomplete } from "../../../fields/VendorAutocomplete";
import { GLCodeAutocomplete } from "../../../fields/GLCodeAutocomplete";
import { PaymentMethodSelect } from "../../../fields/PaymentMethodSelect";
import { CurrencyAutocomplete } from "../../../fields/CurrencyAutocomplete";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, FileText, DollarSign, Calendar, Link2, Truck, CheckCircle2 } from "lucide-react";
import type { EditCombinedRequestState } from "../hooks/useEditCombinedRequest";

export function Tab2PurchaseOrder({ s }: { s: EditCombinedRequestState }) {
  const { setPoDescription, poDescription, setPoGoodsReceivedNote, poGoodsReceivedNote, setPoShippingNote, poShippingNote, setPoTrackingNumber, poTrackingNumber, setPoGoodsReceived, poGoodsReceived, setInvGlCode, isPricingSynced, setPoGlCode, poGlCode, handlePoAfterTaxChange, poTax, poAmount, handlePoAmountChange, poCurrency, setInvAmount, setPoCurrency, handlePoShippingChange, poShippingFee, handlePoUnitPriceChange, poUnitPrice, handlePoQuantityChange, poQuantity, itemMode, setPoExpectedDeliveryDate, poExpectedDeliveryDate, setPoShippedTo, poShippedTo, setPoItem, poItem, setPoPaymentMethod, poPaymentMethod, setPoVendor, poVendor, setPoQuoteNumber, poQuoteNumber, hasPo } = s;
  return (
    <>
      {hasPo && (
            <TabsContent
              value="po"
              className="flex-1 overflow-y-auto px-8 py-6 space-y-6 m-0 focus-visible:outline-hidden"
            >
              {/* Order & Vendor Identification */}
              <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200/80 dark:border-zinc-800/80">
                  <Package className="h-4 w-4 text-amber-500" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 tracking-tight uppercase text-[11px]">
                    Vendor &amp; PO Identification
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Quote / PO #
                    </label>
                    <Input
                      value={poQuoteNumber}
                      onChange={(e) => setPoQuoteNumber(e.target.value)}
                      placeholder="e.g., PO-2026-0089"
                      className="h-10 text-sm font-mono font-semibold bg-white dark:bg-zinc-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Vendor Name <span className="text-rose-500">*</span>
                    </label>
                    <VendorAutocomplete
                      value={poVendor}
                      onChange={setPoVendor}
                      placeholder="Search or enter vendor..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Payment Format <span className="text-rose-500">*</span>
                    </label>
                    <PaymentMethodSelect
                      value={poPaymentMethod}
                      onChange={(val) => setPoPaymentMethod(val)}
                      placeholder="Select payment method *"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Order Item / Scope <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      value={poItem}
                      onChange={(e) => setPoItem(e.target.value)}
                      placeholder="Item title or product name"
                      className="h-10 text-sm bg-white dark:bg-zinc-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Shipped To Location
                    </label>
                    <Input
                      value={poShippedTo}
                      onChange={(e) => setPoShippedTo(e.target.value)}
                      placeholder="e.g., Montreal Head Office"
                      className="h-10 text-sm bg-white dark:bg-zinc-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>Expected Delivery Date</span>
                    </label>
                    <Input
                      type="date"
                      value={poExpectedDeliveryDate}
                      onChange={(e) => setPoExpectedDeliveryDate(e.target.value)}
                      className="h-10 text-sm bg-white dark:bg-zinc-900"
                    />
                  </div>
                </div>
              </div>

              {/* PO Financial & Pricing Breakdown */}
              <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-amber-500" />
                    <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 tracking-tight uppercase text-[11px]">
                      Purchase Order Financials
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {isPricingSynced && (
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                        <Link2 className="h-3 w-3" /> Syncing with Invoice
                      </span>
                    )}
                    <Badge variant="outline" className="text-[11px] font-normal px-2 py-0.5">
                      {itemMode === "MULTIPLE" ? "Multi-Part Totals" : "Pricing & Shipping"}
                    </Badge>
                  </div>
                </div>

                {itemMode === "SINGLE" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        Quantity
                      </label>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={String(poQuantity)}
                        onChange={(e) => handlePoQuantityChange(Number(e.target.value))}
                        className="h-10 text-sm font-mono bg-white dark:bg-zinc-900"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        Unit Price ({poCurrency})
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={String(poUnitPrice)}
                        onChange={(e) => handlePoUnitPriceChange(Number(e.target.value))}
                        className="h-10 text-sm font-mono bg-white dark:bg-zinc-900"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        Shipping Fee ({poCurrency})
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={String(poShippingFee)}
                        onChange={(e) => handlePoShippingChange(Number(e.target.value))}
                        className="h-10 text-sm font-mono bg-white dark:bg-zinc-900"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        Currency
                      </label>
                      <CurrencyAutocomplete
                        value={poCurrency}
                        onChange={(val) => {
                          setPoCurrency(val);
                          if (isPricingSynced) setInvAmount(poAmount);
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Subtotals & Taxes Highlight Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-white dark:bg-zinc-900 p-3.5 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 block">
                        Pre-Tax Amount ({poCurrency})
                      </span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={String(poAmount)}
                        onChange={(e) => handlePoAmountChange(Number(e.target.value))}
                        className="h-8 font-mono text-base font-bold bg-transparent border-0 p-0 focus-visible:ring-0"
                      />
                    </div>
                    <Badge variant="outline" className="text-amber-700 font-mono text-xs">
                      PO Subtotal
                    </Badge>
                  </div>

                  <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/30 p-3.5 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-medium text-amber-800 dark:text-amber-300 block">
                        Estimated Total After-Tax ({poTax.label})
                      </span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={String(Math.round(poAmount * (1 + poTax.rate) * 100) / 100)}
                        onChange={(e) => handlePoAfterTaxChange(Number(e.target.value))}
                        className="h-8 font-mono text-base font-bold text-amber-800 dark:text-amber-300 bg-transparent border-0 p-0 focus-visible:ring-0"
                      />
                    </div>
                    <Badge className="bg-amber-600 text-white font-mono text-xs">
                      PO Total
                    </Badge>
                  </div>
                </div>

                {/* Dedicated Full-Width PO GL Code Row */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                    <span>GL Code / Account Allocation <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Allocated account code for Purchase Order
                    </span>
                  </label>
                  <GLCodeAutocomplete
                    value={poGlCode}
                    onChange={(val) => {
                      setPoGlCode(val);
                      if (isPricingSynced) setInvGlCode(val);
                    }}
                    placeholder="Search or enter GL code for PO..."
                  />
                </div>
              </div>

              {/* Card 3: Shipping, Tracking & Goods Received Notes */}
              <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-amber-500" />
                    <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 tracking-tight uppercase text-[11px]">
                      Shipping, Tracking &amp; Goods Received Notes
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5 cursor-pointer select-none">
                      <Checkbox
                        checked={poGoodsReceived}
                        onCheckedChange={(checked) => setPoGoodsReceived(Boolean(checked))}
                      />
                      <span>Goods Received</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5 text-slate-400" />
                      <span>Tracking Number / Carrier</span>
                    </label>
                    <Input
                      value={poTrackingNumber}
                      onChange={(e) => setPoTrackingNumber(e.target.value)}
                      placeholder="e.g., 1Z9999999999999999 (UPS / FedEx)"
                      className="h-10 text-sm font-mono bg-white dark:bg-zinc-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-slate-400" />
                      <span>Shipping Note</span>
                    </label>
                    <Input
                      value={poShippingNote}
                      onChange={(e) => setPoShippingNote(e.target.value)}
                      placeholder="e.g., Delivering via FedEx Express Priority"
                      className="h-10 text-sm bg-white dark:bg-zinc-900"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Goods Received Notes</span>
                    </label>
                    <Textarea
                      rows={2}
                      value={poGoodsReceivedNote}
                      onChange={(e) => setPoGoodsReceivedNote(e.target.value)}
                      placeholder="e.g., Received items in good condition at receiving dock by warehouse manager..."
                      className="text-xs resize-none bg-white dark:bg-zinc-900"
                    />
                  </div>
                </div>
              </div>

              {/* Card 4: PO Stage-Specific Description */}
              <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 p-5 space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  <span>PO Notes &amp; Terms (Stage-Specific)</span>
                </label>
                <Textarea
                  rows={3}
                  value={poDescription}
                  onChange={(e) => setPoDescription(e.target.value)}
                  placeholder="Notes, shipping instructions, or specific vendor terms for this Purchase Order..."
                  className="text-xs resize-none bg-white dark:bg-zinc-900"
                />
              </div>
            </TabsContent>
          )}
    </>
  );
}
