import { Repeat } from "lucide-react";
import { Input } from "../../../../../components/ui/input";
import { Label } from "../../../../../components/ui/label";
import { CurrencyAutocomplete } from "../../../../Purchasing/fields/CurrencyAutocomplete";
import type { NewWorkflowState } from "../hooks/useNewWorkflow";

export function RecurringSubscriptionParameters({ s }: { s: NewWorkflowState }) {
  const { setBillingMode, billingMode, setSubContractId, subContractId, setBillingDayOfMonth, billingDayOfMonth, setCurrency, currency, setAmount, amount, setSubscriptionPlan, subscriptionPlan, selectedType } = s;
  return (
    <>
      {selectedType === "MONTHLY_SUBSCRIPTION" && (
              <div className="space-y-3.5 border border-violet-500/20 bg-violet-500/5 p-4 rounded-xl">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <Repeat className="w-3.5 h-3.5 text-violet-500" />
                  Recurring Subscription Parameters
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-4 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Subscription Plan <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <select
                      value={subscriptionPlan}
                      onChange={(e) => setSubscriptionPlan(e.target.value)}
                      className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="DaaS Enterprise Pro">DaaS Enterprise Pro</option>
                      <option value="Flight Ops Core">Flight Ops Core</option>
                      <option value="Lidar Sensor Suite">Lidar Sensor Suite</option>
                      <option value="Custom Enterprise SaaS">Custom Enterprise SaaS</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-[11px] text-muted-foreground font-medium">
                      Monthly Rate <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 1500.00"
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

                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Billing Day (1-31)
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={billingDayOfMonth}
                      onChange={(e) =>
                        setBillingDayOfMonth(parseInt(e.target.value) || 1)
                      }
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="sm:col-span-6 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Contract / Agreement ID (Optional)
                    </Label>
                    <Input
                      placeholder="e.g. SUB-2026-0041"
                      value={subContractId}
                      onChange={(e) => setSubContractId(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="sm:col-span-6 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Billing Mode
                    </Label>
                    <select
                      value={billingMode}
                      onChange={(e) => setBillingMode(e.target.value)}
                      className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="AUTO_CHARGE">Auto-Charge (Stripe/Card)</option>
                      <option value="INVOICE">Invoice Dispatch (Net 30)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
    </>
  );
}
