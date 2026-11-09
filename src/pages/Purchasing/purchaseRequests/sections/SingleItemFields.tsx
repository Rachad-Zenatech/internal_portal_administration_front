import { Input } from "@/components/ui/input";
import { CurrencyAutocomplete } from "../../fields/CurrencyAutocomplete";
import type { PurchaseRequestsState } from "../hooks/usePurchaseRequestsPage";

export function SingleItemFields({ s }: { s: PurchaseRequestsState }) {
  const { setForm, form, itemMode } = s;
  return (
    <>
      {form.request_type !== "ACCOUNTS_PAYABLE" && form.request_type !== "RECURRING" && itemMode === "SINGLE" && (
              <div className="space-y-3.5 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Quantity</label>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={form.quantity ?? 1}
                      onChange={(e) => {
                        const q = Number(e.target.value) || 1;
                        setForm((prev) => ({
                          ...prev,
                          quantity: q,
                          amount: (Number(prev.unit_price) || 0) * q,
                        }));
                      }}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Unit Price</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={form.unit_price ? form.unit_price : ""}
                      onChange={(e) => {
                        const p = parseFloat(e.target.value) || 0;
                        setForm((prev) => ({
                          ...prev,
                          unit_price: p,
                          amount: p * (prev.quantity || 1),
                        }));
                      }}
                      className="h-9 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Currency</label>
                    <CurrencyAutocomplete
                      value={form.currency || "USD"}
                      onChange={(curr) => setForm((prev) => ({ ...prev, currency: curr }))}
                    />
                  </div>
                </div>
              </div>
            )}
    </>
  );
}
