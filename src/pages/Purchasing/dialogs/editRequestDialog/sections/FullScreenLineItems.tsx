import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GLCodeAutocomplete } from "../../../fields/GLCodeAutocomplete";
import { Plus, Trash2, FileText, Truck, DollarSign } from "lucide-react";
import { formatMoney } from "../../../utils/purchasingMeta";
import type { EditRequestDialogState } from "../hooks/useEditRequestDialog";

export function FullScreenLineItems({ s }: { s: EditRequestDialogState }) {
  const { setIsFullScreenTable, calculatedAmount, setTaxFee, taxFee, setShippingFee, shippingFee, itemsSubtotal, items, handleRemoveItem, handleItemChange, handleAddItem, isFullScreenTable } = s;
  return (
    <Dialog open={isFullScreenTable} onOpenChange={setIsFullScreenTable}>
        <DialogContent
          aria-describedby={undefined}
          className="!w-[96vw] !max-w-[96vw] sm:!max-w-[96vw] max-h-[94vh] overflow-y-auto p-6"
          style={{ width: "96vw", maxWidth: "96vw" }}
        >
          <DialogHeader className="pb-3 border-b flex flex-row items-center justify-between pr-6">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-indigo-950 dark:text-indigo-200">
              <FileText className="h-6 w-6 text-indigo-600" />
              <span>Full Screen Line Items Table ({items.length} Parts)</span>
            </DialogTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              className="h-8 text-xs flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4 mr-0.5" /> Add Part
            </Button>
          </DialogHeader>

          <div className="space-y-5 pt-4">
            <div className="rounded-lg border border-slate-200 dark:border-zinc-700 overflow-hidden shadow-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 uppercase text-xs font-semibold ">
                  <tr>
                    <th className="p-3 w-12 text-center text-slate-400">#</th>
                    <th className="p-3 w-36 font-semibold">SKU</th>
                    <th className="p-3 font-semibold">Description</th>
                    <th className="p-3 w-24 text-right font-semibold">Qty</th>
                    <th className="p-3 w-32 text-right font-semibold">Unit Price ($)</th>
                    <th className="p-3 w-32 text-right font-semibold">Total ($)</th>
                    <th className="p-3 w-48 font-semibold">GL Code / Account</th>
                    <th className="p-3 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                  {items.map((itm, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="p-3 text-center text-xs font-mono text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="p-3 w-36">
                        <Input
                          value={itm.sku || ""}
                          onChange={(e) => handleItemChange(idx, "sku", e.target.value)}
                          placeholder="SKU / Part #"
                          className="h-10 text-sm font-mono"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          value={itm.description}
                          onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                          placeholder="Part / Item full description..."
                          className="h-10 text-sm w-full bg-white dark:bg-zinc-900 font-medium"
                        />
                      </td>
                      <td className="p-3 w-28">
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          value={itm.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                          className="h-10 text-sm text-right font-medium"
                        />
                      </td>
                      <td className="p-3 w-36">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={itm.unit_price}
                          onChange={(e) => handleItemChange(idx, "unit_price", Number(e.target.value))}
                          className="h-10 text-sm text-right font-mono"
                        />
                      </td>
                      <td className="p-3 w-32 text-right font-bold font-mono text-base text-slate-900 dark:text-zinc-100">
                        {formatMoney(itm.total)}
                      </td>
                      <td className="p-3 w-48">
                        <GLCodeAutocomplete
                          value={itm.gl_code || ""}
                          onChange={(val) => handleItemChange(idx, "gl_code", val)}
                          placeholder="Select GL code"
                          showDetailCard={false}
                        />
                      </td>
                      <td className="p-3 text-center w-12">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                          onClick={() => handleRemoveItem(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400 text-sm">
                        No line items added yet. Click &quot;Add Part&quot; above to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Totals Card in Full Screen Modal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50 dark:bg-zinc-800/70 border border-slate-200 dark:border-zinc-700">
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Quote Summary
                </div>
                <div className="flex justify-between text-sm text-slate-700 dark:text-zinc-300">
                  <span>Parts Subtotal ({items.length} parts):</span>
                  <span className="font-semibold font-mono">{formatMoney(itemsSubtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-700 dark:text-zinc-300">
                  <span>Shipping &amp; Handling:</span>
                  <span className="font-semibold font-mono text-indigo-700 dark:text-indigo-400">
                    +{formatMoney(shippingFee)}
                  </span>
                </div>
                {taxFee > 0 && (
                  <div className="flex justify-between text-sm text-slate-700 dark:text-zinc-300">
                    <span>Taxes &amp; Customs:</span>
                    <span className="font-semibold font-mono">+{formatMoney(taxFee)}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3 border-t sm:border-t-0 sm:border-l sm:pl-4 border-slate-200 dark:border-zinc-700 flex flex-col justify-between">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1 mb-1.5">
                      <Truck className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Shipping Fee ($)</span>
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={shippingFee === 0 ? "" : shippingFee}
                      onChange={(e) => setShippingFee(Number(e.target.value) || 0)}
                      placeholder="0.00"
                      className="h-9 text-sm font-mono font-medium bg-white dark:bg-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1 mb-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Tax / Customs ($)</span>
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={taxFee === 0 ? "" : taxFee}
                      onChange={(e) => setTaxFee(Number(e.target.value) || 0)}
                      placeholder="0.00"
                      className="h-9 text-sm font-mono font-medium bg-white dark:bg-zinc-900"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-zinc-700">
                  <span className="font-bold text-slate-900 dark:text-zinc-100 text-sm">Calculated Grand Total:</span>
                  <span className="font-bold text-xl text-indigo-700 dark:text-indigo-300 font-mono">
                    {formatMoney(calculatedAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t">
            <Button type="button" onClick={() => setIsFullScreenTable(false)} size="lg">
              Done Editing Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}
