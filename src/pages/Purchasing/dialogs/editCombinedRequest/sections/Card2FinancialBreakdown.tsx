import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GLCodeAutocomplete } from "../../../fields/GLCodeAutocomplete";
import { CurrencyAutocomplete } from "../../../fields/CurrencyAutocomplete";
import { formatMoney } from "../../../utils/purchasingMeta";
import { Layers, DollarSign, Plus, Trash2 } from "lucide-react";
import type { EditCombinedRequestState } from "../hooks/useEditCombinedRequest";

export function Card2FinancialBreakdown({ s }: { s: EditCombinedRequestState }) {
  const { reqCurrency, calculatedGrandTotal, itemsSubtotal, handleGlCodeChange, reqGlCode, handleCurrencyChange, handleRemovePartItem, handleUpdatePartItem, requestItems, handleAddPartItem, isPricingSynced, handleAfterTaxChange, afterTaxAmount, reqTax, handleAmountChange, amount, handleUnitPriceChange, unitPrice, handleQuantityChange, quantity, setSku, sku, itemMode } = s;
  return (
    <>
      {itemMode === "SINGLE" ? (
              <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 tracking-tight uppercase text-[11px]">
                      Single Item Financials &amp; GL Allocation
                    </h3>
                  </div>
                  <Badge variant="outline" className="text-[11px] font-normal px-2 py-0.5">
                    Single Item Mode
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      SKU / Part #
                    </label>
                    <Input
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="e.g. MK-2026-X"
                      className="h-10 text-sm font-mono bg-white dark:bg-zinc-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Quantity
                    </label>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={quantity}
                      onChange={(e) => handleQuantityChange(e.target.value)}
                      className="h-10 text-sm font-mono bg-white dark:bg-zinc-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Unit Price ({reqCurrency})
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={unitPrice}
                      onChange={(e) => handleUnitPriceChange(e.target.value)}
                      className="h-10 text-sm font-mono bg-white dark:bg-zinc-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Currency
                    </label>
                    <CurrencyAutocomplete value={reqCurrency} onChange={handleCurrencyChange} />
                  </div>
                </div>

                {/* Subtotals & Taxes Highlight Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 block">
                        Pre-Tax Amount ({reqCurrency})
                      </span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={amount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        className="h-8 font-mono text-base font-bold bg-transparent border-0 p-0 focus-visible:ring-0"
                      />
                    </div>
                    <Badge variant="outline" className="text-slate-600 font-mono text-xs">
                      Qty × Unit Price
                    </Badge>
                  </div>

                  <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/30 p-3.5 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300 block">
                        Estimated Total After-Tax ({reqTax.label})
                      </span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={String(afterTaxAmount)}
                        onChange={(e) => handleAfterTaxChange(e.target.value)}
                        className="h-8 font-mono text-base font-bold text-indigo-600 dark:text-indigo-400 bg-transparent border-0 p-0 focus-visible:ring-0"
                      />
                    </div>
                    <Badge className="bg-indigo-600 text-white font-mono text-xs">
                      Total
                    </Badge>
                  </div>
                </div>

                {/* Dedicated Full-Width GL Code Row */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                    <span>GL Code / Account Allocation <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {isPricingSynced ? "Cascades to PO & Invoice automatically" : "Request account assignment"}
                    </span>
                  </label>
                  <GLCodeAutocomplete
                    value={reqGlCode}
                    onChange={handleGlCodeChange}
                    placeholder="Search or enter GL code (e.g. 5200 - IT Hardware)..."
                  />
                </div>
              </div>
            ) : (
              /* Multi-Parts Line Items Table & Breakdown */
              <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 tracking-tight uppercase text-[11px]">
                      Line Items &amp; Parts Allocation ({requestItems.length} items)
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddPartItem}
                      className="h-8 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Item / Part</span>
                    </Button>
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-xs">
                  <div className="bg-slate-100/90 dark:bg-zinc-800/90 px-4 py-3 grid grid-cols-12 gap-3 text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                    <div className="col-span-2">SKU / Part #</div>
                    <div className="col-span-3">Description *</div>
                    <div className="col-span-1 text-center">Qty</div>
                    <div className="col-span-2 text-right">Unit Price</div>
                    <div className="col-span-3 pl-2">GL Code Allocation</div>
                    <div className="col-span-1 text-center">Action</div>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                    {requestItems.map((itm, idx) => (
                      <div
                        key={itm.id || idx}
                        className="px-4 py-3 grid grid-cols-12 gap-3 items-center text-xs hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                      >
                        <div className="col-span-2">
                          <Input
                            value={itm.sku || ""}
                            onChange={(e) => handleUpdatePartItem(idx, "sku", e.target.value)}
                            placeholder="SKU"
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            value={itm.description || ""}
                            onChange={(e) => handleUpdatePartItem(idx, "description", e.target.value)}
                            placeholder="Item description *"
                            className="h-8 text-xs font-medium"
                          />
                        </div>
                        <div className="col-span-1 text-center">
                          <Input
                            type="number"
                            min="1"
                            value={itm.quantity}
                            onChange={(e) => handleUpdatePartItem(idx, "quantity", e.target.value)}
                            className="h-8 text-xs text-center font-mono"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={itm.unit_price}
                            onChange={(e) => handleUpdatePartItem(idx, "unit_price", e.target.value)}
                            className="h-8 text-xs text-right font-mono"
                          />
                        </div>
                        <div className="col-span-3 pl-2">
                          <GLCodeAutocomplete
                            value={itm.gl_code || reqGlCode}
                            onChange={(val) => handleUpdatePartItem(idx, "gl_code", val)}
                            placeholder="Select GL code *"
                            showDetailCard={false}
                          />
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemovePartItem(idx)}
                            className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Delete line item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Fees & Grand Total Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Currency
                    </label>
                    <CurrencyAutocomplete value={reqCurrency} onChange={handleCurrencyChange} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Default / Master GL Code
                    </label>
                    <GLCodeAutocomplete
                      value={reqGlCode}
                      onChange={handleGlCodeChange}
                      placeholder="Select master GL code..."
                    />
                  </div>

                  {/* Financial Summary Pill */}
                  <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 p-3 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400">
                      <span>Items Subtotal:</span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-zinc-100">
                        {formatMoney(itemsSubtotal, reqCurrency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold text-indigo-700 dark:text-indigo-300 border-t border-indigo-200/60 dark:border-indigo-800/60 pt-1 mt-1">
                      <span>Grand Total:</span>
                      <span className="font-mono text-sm">
                        {formatMoney(calculatedGrandTotal, reqCurrency)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
    </>
  );
}
