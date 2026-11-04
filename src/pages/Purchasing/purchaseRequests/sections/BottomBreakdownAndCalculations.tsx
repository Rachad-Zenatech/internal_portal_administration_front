import { CheckCircle2, Truck, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatMoney } from "../../utils/purchasingMeta";
import type { PurchaseRequestsState } from "../hooks/usePurchaseRequestsPage";

export function BottomBreakdownAndCalculations({ s }: { s: PurchaseRequestsState }) {
  const { totalCalculatedAmount, setTaxFee, taxFee, setShippingFee, shippingFee, itemsSubtotal, quoteExtraction, lineItemsCurrency, form } = s;
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                    <div className="text-[11px]">
                      {quoteExtraction && (() => {
                        const statedTotal = Number(quoteExtraction.extraction.totals?.total || 0);
                        const quoteCurr = quoteExtraction.extraction.currency || form.currency || "USD";
                        const isMatch = Math.abs(totalCalculatedAmount - statedTotal) < 0.05;
                        return isMatch ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Calculated items sum + shipping matches quote total ({formatMoney(statedTotal)} {quoteCurr})
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Stated total ({formatMoney(statedTotal)} {quoteCurr}) differs from calculated ({formatMoney(totalCalculatedAmount)} {quoteCurr})
                          </span>
                        );
                      })()}
                    </div>

                    <div className="text-right text-xs space-y-2 min-w-[300px]">
                      {(() => {
                        const quoteCurr = lineItemsCurrency;
                        const sourceQuoteCurrency =
                          quoteExtraction?.extraction?.conversion?.original_currency ||
                          quoteExtraction?.extraction?.currency;
                        const isForeign = Boolean(
                          quoteExtraction?.extraction?.conversion?.is_converted &&
                          sourceQuoteCurrency === quoteCurr,
                        );
                        const rate = quoteExtraction?.extraction?.conversion?.exchange_rate || 1.0;
                        const usdSubtotal = Math.round(itemsSubtotal * rate * 100) / 100;
                        const usdShipping = Math.round(Number(shippingFee || 0) * rate * 100) / 100;
                        const usdTax = Math.round(Number(taxFee || 0) * rate * 100) / 100;
                        const usdGrandTotal = Math.round(totalCalculatedAmount * rate * 100) / 100;

                        return (
                          <>
                            <div className="text-slate-500 flex items-center justify-between gap-4">
                              <span>Items Subtotal:</span>
                              <div className="text-right">
                                <span className="font-medium font-mono text-slate-800 dark:text-zinc-200">
                                  {formatMoney(itemsSubtotal, quoteCurr)}
                                </span>
                                {isForeign && (
                                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono block">
                                    ({formatMoney(usdSubtotal)})
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                              <span className="text-slate-700 dark:text-zinc-300 font-medium flex items-center gap-1.5">
                                <Truck className="h-3.5 w-3.5 text-indigo-500" />
                                <span>Shipping Fee ({quoteCurr}):</span>
                              </span>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={shippingFee === 0 ? "" : shippingFee}
                                  onChange={(e) => setShippingFee(Number(e.target.value) || 0)}
                                  placeholder="0.00"
                                  className="h-7 w-28 text-right font-mono text-xs"
                                />
                                {isForeign && (
                                  <span className="text-[10.5px] text-slate-500 dark:text-zinc-400 font-mono">
                                    ({formatMoney(usdShipping)})
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                              <span className="text-slate-700 dark:text-zinc-300 font-medium">
                                Tax &amp; Customs ({quoteCurr}):
                              </span>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={taxFee === 0 ? "" : taxFee}
                                  onChange={(e) => setTaxFee(Number(e.target.value) || 0)}
                                  placeholder="0.00"
                                  className="h-7 w-28 text-right font-mono text-xs"
                                />
                                {isForeign && (
                                  <span className="text-[10.5px] text-slate-500 dark:text-zinc-400 font-mono">
                                    ({formatMoney(usdTax)})
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-200 dark:border-zinc-700 flex items-center justify-between gap-4">
                              <span className="text-slate-900 dark:text-zinc-100 font-semibold">Grand Total:</span>
                              <div className="text-right">
                                <span className="font-bold text-base text-slate-900 dark:text-zinc-100 font-mono">
                                  {formatMoney(totalCalculatedAmount, quoteCurr)}
                                </span>
                                {isForeign && (
                                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono block">
                                    ({formatMoney(usdGrandTotal)})
                                  </span>
                                )}
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
  );
}
