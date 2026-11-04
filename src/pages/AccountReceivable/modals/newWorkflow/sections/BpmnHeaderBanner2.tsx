import { Layers, Plus, Trash2, Sparkles } from "lucide-react";
import { Button } from "../../../../../components/ui/button";
import { Badge } from "../../../../../components/ui/badge";
import { Input } from "../../../../../components/ui/input";
import { Label } from "../../../../../components/ui/label";
import { UserAutocomplete } from "../../../fields/UserAutocomplete";
import { CurrencyAutocomplete } from "../../../../Purchasing/fields/CurrencyAutocomplete";
import type { NewWorkflowState } from "../hooks/useNewWorkflow";

export function BpmnHeaderBanner2({ s }: { s: NewWorkflowState }) {
  const { addOnItems, setAddOnItems, setCurrency, currency, setConsolidatedRenewalAmount, consolidatedRenewalAmount, setProRatedAmount, proRatedAmount, setExtraQuantityRequested, extraQuantityRequested, setEffectiveDate, effectiveDate, setRenewalDate, renewalDate, setParentContractId, parentContractId, setSalesRep, salesRep, selectedType } = s;
  return (
    <>
      {selectedType === "ADD_ON" && (
              <div className="space-y-4 border border-indigo-500/20 bg-indigo-500/5 p-4 rounded-xl">
                {/* BPMN Header Banner */}
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-indigo-500/20">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">
                        AR – Add-on Sale & Pro-Rata Pipeline
                      </h4>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-300">
                    Customer Requests Extra Quantity
                  </Badge>
                </div>

                {/* SVG BPMN Callout Annotation */}
                <div className="p-3 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong className="font-semibold block">Pro-Rata Alignment & Renewal Consolidation:</strong>
                    Add-ons are prorated to align with the existing renewal date; totals consolidate at the next renewal.
                  </div>
                </div>

                {/* Contract Validation & Date Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-[11px] text-muted-foreground font-semibold">
                      Sales Representative
                    </Label>
                    <UserAutocomplete
                      value={salesRep}
                      onChange={(val) => setSalesRep(val)}
                      placeholder="Select Sales Rep..."
                      roleHint="Sales originator"
                    />
                  </div>
                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-[11px] text-muted-foreground font-semibold">
                      Parent Contract ID <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Input
                      placeholder="e.g. CTR-2025-0819"
                      value={parentContractId}
                      onChange={(e) => setParentContractId(e.target.value)}
                      className="h-8 text-xs font-mono"
                      required
                    />
                  </div>
                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-[11px] text-muted-foreground font-semibold">
                      Existing Renewal Date <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={renewalDate}
                      onChange={(e) => setRenewalDate(e.target.value)}
                      className="h-8 text-xs"
                      required
                    />
                  </div>
                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-[11px] text-muted-foreground font-semibold">
                      Effective Date <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={effectiveDate}
                      onChange={(e) => setEffectiveDate(e.target.value)}
                      className="h-8 text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Extra Qty Requested
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      value={extraQuantityRequested}
                      onChange={(e) => setExtraQuantityRequested(parseInt(e.target.value) || 1)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-[11px] text-muted-foreground font-semibold">
                      Pro-Rated Charge <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={proRatedAmount}
                      onChange={(e) =>
                        setProRatedAmount(parseFloat(e.target.value) || 0)
                      }
                      className="h-8 text-xs font-mono font-semibold"
                      required
                    />
                  </div>
                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Next Renewal Total ($)
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Consolidated renewal amount"
                      value={consolidatedRenewalAmount || ""}
                      onChange={(e) =>
                        setConsolidatedRenewalAmount(parseFloat(e.target.value) || 0)
                      }
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">
                      Currency <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <CurrencyAutocomplete
                      value={currency}
                      onChange={setCurrency}
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-1 border-t border-indigo-500/20">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-semibold text-foreground">
                      Add-On Components:
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAddOnItems((prev) => [
                          ...prev,
                          {
                            description: "",
                            quantity: 1,
                            unit_price: 0,
                            tax_rate: 0,
                            amount: 0,
                          },
                        ])
                      }
                      className="h-6 text-[10px] gap-1"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      Add Item
                    </Button>
                  </div>

                  {addOnItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center bg-background/80 p-2 rounded-lg border border-border/60"
                    >
                      <Input
                        placeholder="Add-on item description..."
                        value={item.description}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAddOnItems((prev) => {
                            const up = [...prev];
                            up[idx] = { ...up[idx], description: val };
                            return up;
                          });
                        }}
                        className="col-span-6 h-7 text-xs"
                      />
                      <Input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 1;
                          setAddOnItems((prev) => {
                            const up = [...prev];
                            const it = { ...up[idx], quantity: val };
                            it.amount = it.quantity * it.unit_price;
                            up[idx] = it;
                            return up;
                          });
                        }}
                        className="col-span-2 h-7 text-xs font-mono"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        value={item.unit_price}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setAddOnItems((prev) => {
                            const up = [...prev];
                            const it = { ...up[idx], unit_price: val };
                            it.amount = it.quantity * it.unit_price;
                            up[idx] = it;
                            return up;
                          });
                        }}
                        className="col-span-3 h-7 text-xs font-mono"
                      />
                      <div className="col-span-1 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setAddOnItems((prev) =>
                              prev.filter((_, i) => i !== idx)
                            )
                          }
                          disabled={addOnItems.length <= 1}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
    </>
  );
}
