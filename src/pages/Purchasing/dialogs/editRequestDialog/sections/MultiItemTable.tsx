import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Maximize2, FileText, Truck, DollarSign } from "lucide-react";
import { formatMoney } from "../../../utils/purchasingMeta";
import type { EditRequestDialogState } from "../hooks/useEditRequestDialog";

export function MultiItemTable({ s }: { s: EditRequestDialogState }) {
  const { calculatedAmount, setTaxFee, taxFee, setShippingFee, shippingFee, itemsSubtotal, items, handleRemoveItem, handleItemChange, handleAddItem, setIsFullScreenTable, formData, itemMode } = s;
  return (
    <>
      {itemMode === "MULTIPLE" && formData.request_type !== "ACCOUNTS_PAYABLE" && formData.request_type !== "RECURRING" && (
              <div className="space-y-3 p-3.5 rounded-lg border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                      Line Items &amp; Parts Breakdown ({items.length})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsFullScreenTable(true)}
                      className="h-7 text-xs flex items-center gap-1.5 bg-white dark:bg-zinc-900 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 shadow-xs"
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

                {/* Table */}
                <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200 dark:border-zinc-700 shadow-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 uppercase text-[11px] font-semibold ">
                      <tr>
                        <th className="p-2 w-10 text-center text-slate-400">#</th>
                        <th className="p-2 w-28">SKU</th>
                        <th className="p-2">Description</th>
                        <th className="p-2 w-20 text-right">Qty</th>
                        <th className="p-2 w-28 text-right">Price ($)</th>
                        <th className="p-2 w-28 text-right">Total ($)</th>
                        <th className="p-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                      {items.map((itm, idx) => (
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
                              onChange={(e) => handleItemChange(idx, "description", e.target.value)}
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
                          <td className="p-2 w-28">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={itm.unit_price}
                              onChange={(e) => handleItemChange(idx, "unit_price", Number(e.target.value))}
                              className="h-8 text-sm text-right font-mono"
                            />
                          </td>
                          <td className="p-2 w-28 text-right font-semibold font-mono text-sm text-slate-900 dark:text-zinc-100">
                            {formatMoney(itm.total)}
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
                      ))}
                      {items.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-6 text-slate-400 text-xs">
                            No line items added yet. Click &quot;Add Part&quot; to begin.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Totals Breakdown Card with Shipping Fee */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs">
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                      Summary Calculation
                    </div>
                    <div className="flex justify-between text-slate-700 dark:text-zinc-300">
                      <span>Parts Subtotal ({items.length} parts):</span>
                      <span className="font-semibold font-mono">{formatMoney(itemsSubtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-700 dark:text-zinc-300">
                      <span>Shipping &amp; Handling:</span>
                      <span className="font-semibold font-mono text-indigo-700 dark:text-indigo-400">
                        +{formatMoney(shippingFee)}
                      </span>
                    </div>
                    {taxFee > 0 && (
                      <div className="flex justify-between text-slate-700 dark:text-zinc-300">
                        <span>Taxes &amp; Customs:</span>
                        <span className="font-semibold font-mono">+{formatMoney(taxFee)}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 border-t sm:border-t-0 sm:border-l sm:pl-3 border-slate-200 dark:border-zinc-700 flex flex-col justify-between">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1 mb-1">
                          <Truck className="h-3 w-3 text-indigo-600" />
                          <span>Shipping Fee ($)</span>
                        </label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={shippingFee === 0 ? "" : shippingFee}
                          onChange={(e) => setShippingFee(Number(e.target.value) || 0)}
                          placeholder="0.00"
                          className="h-8 text-xs font-mono font-medium bg-white dark:bg-zinc-900"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1 mb-1">
                          <DollarSign className="h-3 w-3 text-emerald-600" />
                          <span>Tax / Customs ($)</span>
                        </label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={taxFee === 0 ? "" : taxFee}
                          onChange={(e) => setTaxFee(Number(e.target.value) || 0)}
                          placeholder="0.00"
                          className="h-8 text-xs font-mono font-medium bg-white dark:bg-zinc-900"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-zinc-700">
                      <span className="font-bold text-slate-800 dark:text-zinc-200 text-xs">Grand Total:</span>
                      <span className="font-bold text-base text-indigo-700 dark:text-indigo-300 font-mono">
                        {formatMoney(calculatedAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
    </>
  );
}
