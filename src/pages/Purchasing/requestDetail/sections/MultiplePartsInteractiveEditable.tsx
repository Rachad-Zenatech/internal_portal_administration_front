import LocationAutocomplete from "../../fields/LocationAutocomplete";
import { CurrencyAutocomplete } from "../../fields/CurrencyAutocomplete";
import { VendorAutocomplete } from "../../fields/VendorAutocomplete";
import { Truck, Plus, Trash2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "../../utils/purchasingMeta";
import { FieldInput } from "../components/FieldInput";
import type { RequestDetailViewState } from "../hooks/useRequestDetailTail";

export function MultiplePartsInteractiveEditable({ v }: { v: RequestDetailViewState }) {
  const { po, setPo, poItems, poFxRate, poShippingFee, recalculatePoUsdTotal, setPoItems, poItemCurrency, isMulti, handlePoItemCurrencyChange, poNativeToUsd, poTax, poUsdToNative, setPoShippingFee, activeForm } = v;
  return (
    <>
      {activeForm?.kind === "po" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Vendor <span className="text-red-500">*</span>
                  </label>
                  <VendorAutocomplete
                    value={po.vendor}
                    onChange={(v) => setPo({ ...po, vendor: v })}
                    placeholder="Search or enter vendor name..."
                  />
                </div>
                <div className="space-y-2">
                  <FieldInput
                    label={
                      <span>
                        Item <span className="text-red-500">*</span>
                      </span>
                    }
                    value={po.item}
                    onChange={(v) => setPo({ ...po, item: v })}
                    placeholder={isMulti ? "Multiple Parts / Items" : "Product or Item name"}
                  />
                </div>

                {!isMulti ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Quantity</label>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={String(po.quantity ?? 1)}
                        onChange={(e) => {
                          const q = Math.max(1, Number(e.target.value) || 1);
                          const itemsCostNative = Math.round(q * (po.unit_price || 0) * 100) / 100;
                          const totalUsd = Math.round((itemsCostNative * poFxRate + poShippingFee * poFxRate) * 100) / 100;
                          setPo((prev) => ({ ...prev, quantity: q, amount: totalUsd, currency: "USD" }));
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Unit Price ({poItemCurrency})</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={String(po.unit_price ?? 0)}
                        onChange={(e) => {
                          const p = Math.max(0, Number(e.target.value) || 0);
                          const itemsCostNative = Math.round((po.quantity || 1) * p * 100) / 100;
                          const totalUsd = Math.round((itemsCostNative * poFxRate + poShippingFee * poFxRate) * 100) / 100;
                          setPo((prev) => ({ ...prev, unit_price: p, amount: totalUsd, currency: "USD" }));
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium flex items-center gap-1">
                        <Truck className="h-3 w-3 text-indigo-500" />
                        <span>Shipping ({poItemCurrency})</span>
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={String(poShippingFee)}
                        onChange={(e) => {
                          const sf = Math.max(0, Number(e.target.value) || 0);
                          setPoShippingFee(sf);
                          const itemsCostNative = Math.round((po.quantity || 1) * (po.unit_price || 0) * 100) / 100;
                          const totalUsd = Math.round((itemsCostNative * poFxRate + sf * poFxRate) * 100) / 100;
                          setPo((prev) => ({ ...prev, amount: totalUsd, currency: "USD" }));
                        }}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium">Total Pre-Tax ({poItemCurrency})</label>
                        {poItemCurrency !== "USD" && (
                          <span className="text-[10px] text-slate-400 font-mono">≈ ${po.amount.toFixed(2)} USD</span>
                        )}
                      </div>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={String(poUsdToNative(po.amount))}
                        onChange={(e) => {
                          const amt = Math.max(0, Number(e.target.value) || 0);
                          setPo((prev) => ({ ...prev, amount: poNativeToUsd(amt), currency: "USD" }));
                        }}
                        className="font-mono bg-white dark:bg-zinc-900 font-semibold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium">Total After-Tax ({poItemCurrency} · {poTax.label})</label>
                        {poItemCurrency !== "USD" && (
                          <span className="text-[10px] text-slate-400 font-mono">≈ ${(Math.round(po.amount * (1 + poTax.rate) * 100) / 100).toFixed(2)} USD</span>
                        )}
                      </div>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={String(Math.round(poUsdToNative(po.amount) * (1 + poTax.rate) * 100) / 100)}
                        onChange={(e) => {
                          const afterTax = Math.max(0, Number(e.target.value) || 0);
                          const preTax = Math.round((afterTax / (1 + poTax.rate)) * 100) / 100;
                          setPo((prev) => ({ ...prev, amount: poNativeToUsd(preTax), currency: "USD" }));
                        }}
                        className="font-semibold font-mono bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Item Currency</label>
                      <CurrencyAutocomplete value={poItemCurrency} onChange={handlePoItemCurrencyChange} />
                    </div>
                    {poItemCurrency && poItemCurrency !== "USD" && (
                      <div className="col-span-full mt-1 p-2 bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-lg flex items-center justify-between text-xs text-blue-900 dark:text-blue-200">
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span>
                            <strong>FX Rate Conversion:</strong> 1 {poItemCurrency} = ${poFxRate.toFixed(6)} USD via CurrencyConverter
                          </span>
                        </div>
                        <span className="text-[11px] text-blue-700 dark:text-blue-300 font-medium">
                          Amounts shown in {poItemCurrency}; USD equivalents are used for approvals
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium">Items Subtotal ({poItemCurrency})</label>
                        {poItemCurrency !== "USD" && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            ≈ ${(Math.round(poItems.reduce((acc, it) => acc + (Number(it.total) || 0), 0) * poFxRate * 100) / 100).toFixed(2)} USD
                          </span>
                        )}
                      </div>
                      <Input
                        type="text"
                        value={(Math.round(poItems.reduce((acc, it) => acc + (Number(it.total) || 0), 0) * 100) / 100).toFixed(2)}
                        disabled
                        className="font-mono bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium flex items-center gap-1">
                          <Truck className="h-3.5 w-3.5 text-indigo-500" />
                          <span>Shipping Fee ({poItemCurrency})</span>
                        </label>
                        {poItemCurrency !== "USD" && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            ≈ ${(poShippingFee * poFxRate).toFixed(2)} USD
                          </span>
                        )}
                      </div>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={String(poShippingFee)}
                        onChange={(e) => {
                          const sf = Math.max(0, Number(e.target.value) || 0);
                          setPoShippingFee(sf);
                          const { totalUsd } = recalculatePoUsdTotal(poItems, sf, poFxRate);
                          setPo((prev) => ({ ...prev, amount: totalUsd, currency: "USD" }));
                        }}
                        className="font-mono bg-white dark:bg-zinc-900"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium">Total Pre-Tax ({poItemCurrency})</label>
                        {poItemCurrency !== "USD" && (
                          <span className="text-[10px] text-slate-400 font-mono">≈ ${po.amount.toFixed(2)} USD</span>
                        )}
                      </div>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={String(poUsdToNative(po.amount))}
                        onChange={(e) => {
                          const amt = Math.max(0, Number(e.target.value) || 0);
                          setPo((prev) => ({ ...prev, amount: poNativeToUsd(amt), currency: "USD" }));
                        }}
                        className="font-mono bg-white dark:bg-zinc-900 font-semibold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium">Total After-Tax ({poItemCurrency} · {poTax.label})</label>
                        {poItemCurrency !== "USD" && (
                          <span className="text-[10px] text-slate-400 font-mono">≈ ${(Math.round(po.amount * (1 + poTax.rate) * 100) / 100).toFixed(2)} USD</span>
                        )}
                      </div>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={String(Math.round(poUsdToNative(po.amount) * (1 + poTax.rate) * 100) / 100)}
                        onChange={(e) => {
                          const afterTax = Math.max(0, Number(e.target.value) || 0);
                          const preTax = Math.round((afterTax / (1 + poTax.rate)) * 100) / 100;
                          setPo((prev) => ({ ...prev, amount: poNativeToUsd(preTax), currency: "USD" }));
                        }}
                        className="font-semibold font-mono bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Item Currency</label>
                      <CurrencyAutocomplete value={poItemCurrency} onChange={handlePoItemCurrencyChange} />
                    </div>
                    {poItemCurrency && poItemCurrency !== "USD" && (
                      <div className="col-span-full mt-1 p-2 bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-lg flex items-center justify-between text-xs text-blue-900 dark:text-blue-200">
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span>
                            <strong>FX Rate Conversion:</strong> 1 {poItemCurrency} = ${poFxRate.toFixed(6)} USD via CurrencyConverter
                          </span>
                        </div>
                        <span className="text-[11px] text-blue-700 dark:text-blue-300 font-medium">
                          Amounts shown in {poItemCurrency}; USD equivalents are used for approvals
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Multiple Parts Interactive Editable Table */}
                {isMulti && (
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        Line Items &amp; Parts Breakdown ({poItems.length})
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const next = [
                            ...poItems,
                            {
                              id: undefined,
                              sku: "",
                              description: `Part ${poItems.length + 1}`,
                              quantity: 1,
                              unit_price: 0,
                              total: 0,
                            },
                          ];
                          setPoItems(next);
                          const { totalUsd } = recalculatePoUsdTotal(next, poShippingFee, poFxRate);
                          setPo((prev) => ({ ...prev, amount: totalUsd, currency: "USD" }));
                        }}
                        className="h-7 text-xs flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Part
                      </Button>
                    </div>

                    <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 dark:border-zinc-700 shadow-xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 uppercase text-[11px] font-semibold ">
                          <tr>
                            <th className="p-2 w-8 text-center text-slate-400">#</th>
                            <th className="p-2 w-24">SKU</th>
                            <th className="p-2">Description</th>
                            <th className="p-2 w-20 text-right">Qty</th>
                            <th className="p-2 w-28 text-right">Unit Price ({poItemCurrency})</th>
                            <th className="p-2 w-32 text-right">Total ({poItemCurrency})</th>
                            <th className="p-2 w-8 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                          {poItems.map((itm, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/50">
                              <td className="p-2 text-center font-mono text-slate-400">{idx + 1}</td>
                              <td className="p-2 w-24">
                                <Input
                                  value={itm.sku || ""}
                                  onChange={(e) => {
                                    const next = [...poItems];
                                    next[idx] = { ...next[idx], sku: e.target.value };
                                    setPoItems(next);
                                  }}
                                  placeholder="SKU / Part #"
                                  className="h-7 text-xs font-mono"
                                />
                              </td>
                              <td className="p-2">
                                <Input
                                  value={itm.description}
                                  onChange={(e) => {
                                    const next = [...poItems];
                                    next[idx] = { ...next[idx], description: e.target.value };
                                    setPoItems(next);
                                  }}
                                  placeholder="Part description..."
                                  className="h-7 text-xs font-medium"
                                />
                              </td>
                              <td className="p-2 w-20">
                                <Input
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={itm.quantity}
                                  onChange={(e) => {
                                    const q = Math.max(1, Number(e.target.value) || 1);
                                    const next = [...poItems];
                                    const tot = Math.round(q * Number(next[idx].unit_price || 0) * 100) / 100;
                                    next[idx] = { ...next[idx], quantity: q, total: tot };
                                    setPoItems(next);
                                    const { totalUsd } = recalculatePoUsdTotal(next, poShippingFee, poFxRate);
                                    setPo((prev) => ({ ...prev, amount: totalUsd, currency: "USD" }));
                                  }}
                                  className="h-7 text-xs text-right"
                                />
                              </td>
                              <td className="p-2 w-24">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={itm.unit_price}
                                  onChange={(e) => {
                                    const p = Math.max(0, Number(e.target.value) || 0);
                                    const next = [...poItems];
                                    const tot = Math.round(Number(next[idx].quantity || 1) * p * 100) / 100;
                                    next[idx] = { ...next[idx], unit_price: p, total: tot };
                                    setPoItems(next);
                                    const { totalUsd } = recalculatePoUsdTotal(next, poShippingFee, poFxRate);
                                    setPo((prev) => ({ ...prev, amount: totalUsd, currency: "USD" }));
                                  }}
                                  className="h-7 text-xs text-right font-mono"
                                />
                              </td>
                              <td className="p-2 w-32 text-right font-mono font-semibold text-slate-800 dark:text-zinc-200">
                                <div>{formatMoney(itm.total || 0, poItemCurrency)}</div>
                                {poItemCurrency !== "USD" && (
                                  <div className="text-[10px] font-normal text-slate-500 dark:text-zinc-400">
                                    ≈ ${(Math.round(Number(itm.total || 0) * poFxRate * 100) / 100).toFixed(2)} USD
                                  </div>
                                )}
                              </td>
                              <td className="p-2 text-center w-8">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                                  onClick={() => {
                                    const next = poItems.filter((_, i) => i !== idx);
                                    setPoItems(next);
                                    const { totalUsd } = recalculatePoUsdTotal(next, poShippingFee, poFxRate);
                                    setPo((prev) => ({ ...prev, amount: totalUsd, currency: "USD" }));
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                          {poItems.length === 0 && (
                            <tr>
                              <td colSpan={6} className="text-center py-4 text-slate-400 text-xs">
                                No line items added. Click &quot;Add Part&quot; above to add part lines.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Shipped to Location <span className="text-red-500">*</span></label>
                  <LocationAutocomplete value={po.shipped_to_location ?? ""} onChange={(v) => setPo({ ...po, shipped_to_location: v })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    rows={3}
                    placeholder="Additional details about this purchase..."
                    value={po.description ?? ""}
                    onChange={(e) => setPo({ ...po, description: e.target.value })}
                  />
                </div>
              </>
            )}
    </>
  );
}
