import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "../../utils/purchasingMeta";
import type { PurchaseRequestsState } from "../hooks/usePurchaseRequestsPage";

export function LineItemsPreviewTable({ s }: { s: PurchaseRequestsState }) {
  const { quoteItems, handleRemoveItem, handleItemChange, extractItemUrlOnBlur, scheduleItemUrlExtraction, quoteExtraction, lineItemsCurrency } = s;
  return (
    <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200 dark:border-zinc-700 shadow-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 uppercase text-[11px] font-semibold ">
                        <tr>
                          <th className="p-2 w-10 text-center text-slate-400">#</th>
                          <th className="p-2 w-28">SKU</th>
                          <th className="p-2">Description</th>
                          <th className="p-2 w-20 text-right">Qty</th>
                          <th className="p-2 w-36 text-right">Price ({lineItemsCurrency})</th>
                          <th className="p-2 w-36 text-right">Total ({lineItemsCurrency})</th>
                          <th className="p-2 w-10 text-center"></th>
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
                                <div className="space-y-1">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={itm.unit_price}
                                    onChange={(e) => handleItemChange(idx, "unit_price", Number(e.target.value))}
                                    className="h-8 text-sm text-right font-mono"
                                  />
                                  {isForeign && (
                                    <div className="text-[10.5px] text-right text-slate-500 dark:text-zinc-400 font-mono">
                                      {formatMoney(usdUnitPrice)}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="p-2 w-36 text-right font-semibold font-mono text-sm text-slate-900 dark:text-zinc-100">
                                <div>{formatMoney(itm.total, quoteCurr)}</div>
                                {isForeign && (
                                  <div className="text-[10.5px] font-normal text-slate-500 dark:text-zinc-400 font-mono">
                                    {formatMoney(usdTotal)}
                                  </div>
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
                            <td colSpan={7} className="text-center py-8 text-slate-400 text-xs">
                              No line items added yet. Click &quot;+ Add Part&quot; above to create parts manually, or upload a quote PDF above.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
  );
}
