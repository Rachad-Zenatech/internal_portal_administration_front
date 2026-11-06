import { RotateCw } from "lucide-react";
import { Input } from "../../../../../components/ui/input";
import { Label } from "../../../../../components/ui/label";
import { CurrencyAutocomplete } from "../../../../Purchasing/fields/CurrencyAutocomplete";
import type { NewWorkflowState } from "../hooks/useNewWorkflow";

export function ContractRenewalTermsExtension({ s }: { s: NewWorkflowState }) {
  const { setRenewalDiscountPercent, renewalDiscountPercent, setRenewalTermMonths, renewalTermMonths, setCurrency, currency, setAmount, amount, setExpiringDate, expiringDate, setRenContractId, renContractId, selectedType } = s;
  return (
    <>
      {selectedType === "RENEWAL" && (
              <div className="space-y-3.5 border border-amber-500/20 bg-amber-500/5 p-4 rounded-xl">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <RotateCw className="w-3.5 h-3.5 text-amber-500" />
                  Contract Renewal & Terms Extension
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-4 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Expiring Contract ID <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Input
                      placeholder="e.g. CTR-2024-0019"
                      value={renContractId}
                      onChange={(e) => setRenContractId(e.target.value)}
                      className="h-8 text-xs font-mono"
                      required
                    />
                  </div>

                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Expiration Date <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={expiringDate}
                      onChange={(e) => setExpiringDate(e.target.value)}
                      className="h-8 text-xs"
                      required
                    />
                  </div>

                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-[11px] text-muted-foreground font-medium">
                      Renewal Amount <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={amount || ""}
                      onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                      className="h-8 text-xs font-mono font-semibold"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">
                      Currency <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <CurrencyAutocomplete
                      value={currency}
                      onChange={setCurrency}
                    />
                  </div>

                  <div className="sm:col-span-6 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Renewal Term
                    </Label>
                    <select
                      value={renewalTermMonths}
                      onChange={(e) =>
                        setRenewalTermMonths(parseInt(e.target.value) || 12)
                      }
                      className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value={12}>12 Months (1 Year)</option>
                      <option value={24}>24 Months (2 Years)</option>
                      <option value={36}>36 Months (3 Years)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-6 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Renewal Discount (%)
                    </Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={renewalDiscountPercent}
                      onChange={(e) =>
                        setRenewalDiscountPercent(parseFloat(e.target.value) || 0)
                      }
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
    </>
  );
}
