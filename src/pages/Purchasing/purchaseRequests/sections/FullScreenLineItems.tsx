import { Plus, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatMoney } from "../../utils/purchasingMeta";
import { CurrencyAutocomplete } from "../../fields/CurrencyAutocomplete";
import type { PurchaseRequestsState } from "../hooks/usePurchaseRequestsPage";

export function FullScreenLineItems({ s }: { s: PurchaseRequestsState }) {
  const { setIsFullScreenTable, totalCalculatedAmount, quoteItems, handleRemoveItem, handleItemChange, extractItemUrlOnBlur, scheduleItemUrlExtraction, quoteExtraction, lineItemsCurrency, handleAddItem, setForm, setLineItemsCurrency, isFullScreenTable } = s;
  return (
    <Dialog open={isFullScreenTable} onOpenChange={setIsFullScreenTable}>
        <DialogContent
          aria-describedby={undefined}
          className="!w-[96vw] !max-w-[96vw] sm:!max-w-[96vw] max-h-[94vh] overflow-y-auto p-6"
          style={{ width: "96vw", maxWidth: "96vw" }}
        >
          <DialogHeader className="pb-3 border-b flex flex-row items-center justify-between pr-6">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-indigo-950 dark:text-indigo-200">
              <FileText className="h-5 w-5 text-indigo-600" />
              <span>Full Screen Line Items Table ({quoteItems.length} Parts)</span>
            </DialogTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-zinc-400">Currency</span>
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
                onClick={handleAddItem}
                className="h-8 text-xs flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Part
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="rounded-lg border border-slate-200 dark:border-zinc-700 overflow-visible shadow-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 uppercase text-xs font-semibold ">
                  <tr>
                    <th className="p-3 w-12 text-center text-slate-400">#</th>
                    <th className="p-3 w-36 font-semibold">SKU</th>
                    <th className="p-3 font-semibold">Description</th>
                    <th className="p-3 w-24 text-right font-semibold">Qty</th>
                    <th className="p-3 w-36 text-right font-semibold">Price ({lineItemsCurrency})</th>
                    <th className="p-3 w-36 text-right font-semibold">Total ({lineItemsCurrency})</th>
                    <th className="p-3 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                  {quoteItems.map((itm, idx) => {
                          const quoteCurr = lineItemsCurrency;
                          const sourceQuoteCurrency =
                            quoteExtraction?.extraction?.conversion?.original_currency ||
                            quoteExtraction?.extraction?.currency;
                          const isForeign = Boolean(
                            quoteExtraction?.extraction?.conversion?.is_converted &&
                            sourceQuoteCurrency === quoteCurr,
                          );
                          const rate = quoteExtraction?.extraction?.conversion?.exchange_rate || 1.0;
                          const usdUnitPrice = isForeign ? Math.round(Number(itm.unit_price || 0) * rate * 100) / 100 : Number(itm.unit_price || 0);
                          const usdTotal = isForeign ? Math.round(Number(itm.total || 0) * rate * 100) / 100 : Number(itm.total || 0);

                          return (
                            <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                              <td className="p-2 text-center text-xs font-mono text-slate-400">
                                {idx + 1}
                              </td>
                              <td className="p-2 w-28">
                                <Input
                                  value={itm.sku || ""}
                                  onChange={(e) => handleItemChange(idx, "sku", e.target.value)}
                                  placeholder="SKU / Part #"
                                  className="h-8 text-sm font-mono"
                                />
                              </td>
                              <td className="p-2">
                                <Input
                                  value={itm.description}
                                  onChange={(e) => {
                                    handleItemChange(idx, "description", e.target.value);
                                    scheduleItemUrlExtraction(idx, e.target.value);
                                  }}
                                  onBlur={(e) => extractItemUrlOnBlur(idx, e.currentTarget.value)}
                                  placeholder="Item description..."
                                  className="h-8 text-sm w-full bg-white dark:bg-zinc-900 font-medium"
                                />
                              </td>
                              <td className="p-2 w-20">
                                <Input
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={itm.quantity}
                                  onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                                  className="h-8 text-sm text-right font-medium"
                                />
                              </td>
                              <td className="p-2 w-36">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={itm.unit_price}
                                  onChange={(e) => handleItemChange(idx, "unit_price", Number(e.target.value))}
                                  className="h-8 text-sm text-right font-mono font-medium"
                                />
                                {isForeign && (
                                  <span className="text-[10.5px] text-slate-500 dark:text-zinc-400 font-mono block text-right mt-0.5 whitespace-nowrap">
                                    ({formatMoney(usdUnitPrice)})
                                  </span>
                                )}
                              </td>
                              <td className="p-2 w-36 text-right">
                                <div className="font-semibold font-mono text-sm text-slate-900 dark:text-zinc-100">
                                  {formatMoney(itm.total, quoteCurr)}
                                </div>
                                {isForeign && (
                                  <span className="text-[10.5px] text-slate-500 dark:text-zinc-400 font-mono block text-right whitespace-nowrap">
                                    ({formatMoney(usdTotal)})
                                  </span>
                                )}
                              </td>
                              <td className="p-2 text-center w-10">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                                  onClick={() => handleRemoveItem(idx)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                  {quoteItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                        No line items added yet. Click &quot;Add Part&quot; above to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="text-xs text-slate-500">
                {quoteItems.length} parts in table
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 mr-2">Grand Total:</span>
                <span className="font-bold text-lg text-slate-900 dark:text-zinc-100 font-mono">
                  {formatMoney(totalCalculatedAmount)}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t">
            <Button type="button" onClick={() => setIsFullScreenTable(false)}>
              Done Editing Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}
