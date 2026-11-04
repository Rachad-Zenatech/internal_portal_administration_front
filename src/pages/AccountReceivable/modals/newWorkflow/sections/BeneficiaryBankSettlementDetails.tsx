import { Plus, DollarSign, Building2, Landmark, X } from "lucide-react";
import { Button } from "../../../../../components/ui/button";
import { Input } from "../../../../../components/ui/input";
import { Label } from "../../../../../components/ui/label";
import { CountryAutocomplete } from "../../../../Purchasing/fields/CountryAutocomplete";
import { CurrencyAutocomplete } from "../../../../Purchasing/fields/CurrencyAutocomplete";
import { BANK_DETAILS_CATALOG } from "../constants";
import type { NewWorkflowState } from "../hooks/useNewWorkflow";

export function BeneficiaryBankSettlementDetails({ s }: { s: NewWorkflowState }) {
  const { setCurrency, currency, setAmount, amount, setDepositDate, depositDate, setBankingDetails, bankingDetails, setVisibleBankFields, visibleBankFields, setAddBankFieldOpen, availableBankFields, addBankFieldOpen, addBankRef } = s;
  return (
    <div>
                  <div className="flex items-center justify-between mb-3 border-b border-emerald-500/20 pb-2">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                      Step 1: Treasury Confirms Payment from Bank
                    </h4>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Treasury Gate
                    </span>
                  </div>

                  {/* Beneficiary Bank Settlement Details Card (from AR Customer) */}
                  <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 shadow-2xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                          <Landmark className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                            <span>Beneficiary Bank Details</span>
                            <span className="text-[10px] font-normal text-muted-foreground lowercase">
                              (from A/R Customer Settlement)
                            </span>
                          </h4>
                          <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                            Bank jurisdiction, institution identity, and beneficiary account
                          </p>
                        </div>
                      </div>

                      <div ref={addBankRef} className="relative flex items-center gap-2 shrink-0">
                        {availableBankFields.length > 0 ? (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setAddBankFieldOpen(!addBankFieldOpen)}
                              className="h-8 text-xs font-medium gap-1.5 border-dashed border-slate-300 dark:border-zinc-700 hover:bg-indigo-50/50 hover:text-indigo-600 hover:border-indigo-300 cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5 text-indigo-600" />
                              <span>Add Bank Field</span>
                            </Button>

                            {addBankFieldOpen && (
                              <div
                                data-radix-scroll-lock-ignore=""
                                className="absolute right-0 top-full mt-1 w-64 p-1 z-50 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xl flex flex-col overflow-hidden"
                                style={{
                                  boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05)",
                                }}
                              >
                                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1.5 border-b border-slate-100 dark:border-zinc-800">
                                  Available Bank Fields
                                </div>
                                <div className="py-1 max-h-56 overflow-y-auto overscroll-contain">
                                  {availableBankFields.map((f) => (
                                    <button
                                      key={f.id}
                                      type="button"
                                      onClick={() => {
                                        setVisibleBankFields((prev) => [...prev, f.id]);
                                        setAddBankFieldOpen(false);
                                      }}
                                      className="w-full text-left px-2.5 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-zinc-800 rounded flex items-center justify-between transition-colors cursor-pointer"
                                    >
                                      <span>{f.label}</span>
                                      <Plus className="h-3 w-3 text-slate-400" />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">All bank fields active</span>
                        )}
                      </div>
                    </div>

                    {/* Dynamic Bank Fields Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                      {visibleBankFields.includes("bank_country") && (
                        <div className="space-y-1.5 sm:col-span-2 md:col-span-1">
                          <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                            Bank Country <span className="text-red-500 font-bold">*</span>
                          </Label>
                          <CountryAutocomplete
                            value={bankingDetails.bank_country || ""}
                            onChange={(val) =>
                              setBankingDetails((prev) => ({ ...prev, bank_country: val }))
                            }
                            placeholder="Select bank country..."
                          />
                        </div>
                      )}

                      {visibleBankFields.includes("bank_name") && (
                        <div className="space-y-1.5 sm:col-span-2 md:col-span-2">
                          <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                            Bank Name <span className="text-red-500 font-bold">*</span>
                          </Label>
                          <Input
                            value={bankingDetails.bank_name || ""}
                            onChange={(e) =>
                              setBankingDetails((prev) => ({ ...prev, bank_name: e.target.value }))
                            }
                            placeholder="e.g. CIBC, JPMorgan Chase, HSBC"
                            className="h-9 text-xs bg-slate-50/50 dark:bg-zinc-800/50"
                            required
                          />
                        </div>
                      )}

                      {visibleBankFields.includes("bank_account_number") && (
                        <div className="space-y-1.5 sm:col-span-2 md:col-span-3">
                          <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                            Bank Account # <span className="text-red-500 font-bold">*</span>
                          </Label>
                          <Input
                            value={bankingDetails.bank_account_number || ""}
                            onChange={(e) =>
                              setBankingDetails((prev) => ({
                                ...prev,
                                bank_account_number: e.target.value,
                              }))
                            }
                            placeholder="Account Number"
                            className="h-9 text-xs font-mono bg-slate-50/50 dark:bg-zinc-800/50"
                            required
                          />
                        </div>
                      )}

                      {/* Additional dynamic fields */}
                      {visibleBankFields
                        .filter(
                          (k) =>
                            k !== "bank_country" &&
                            k !== "bank_name" &&
                            k !== "bank_account_number"
                        )
                        .map((fieldId) => {
                          const def = BANK_DETAILS_CATALOG.find((d) => d.id === fieldId);
                          if (!def) return null;
                          return (
                            <div key={fieldId} className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                                  {def.label}
                                </Label>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setVisibleBankFields((prev) =>
                                      prev.filter((id) => id !== fieldId)
                                    )
                                  }
                                  className="text-slate-400 hover:text-red-500 transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <Input
                                value={bankingDetails[fieldId] || ""}
                                onChange={(e) =>
                                  setBankingDetails((prev) => ({
                                    ...prev,
                                    [fieldId]: e.target.value,
                                  }))
                                }
                                placeholder={def.placeholder || ""}
                                className={`h-9 text-xs bg-slate-50/50 dark:bg-zinc-800/50 ${
                                  def.isMono ? "font-mono" : ""
                                }`}
                              />
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Bank Confirmation Transaction Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-3">
                    <div className="sm:col-span-4 space-y-1">
                      <Label className="text-[11px] text-muted-foreground font-semibold">
                        Deposit / Value Date <span className="text-red-500 font-bold">*</span>
                      </Label>
                      <Input
                        type="date"
                        value={depositDate}
                        onChange={(e) => setDepositDate(e.target.value)}
                        className="h-8 text-xs bg-background"
                        required
                      />
                    </div>

                    <div className="sm:col-span-4 space-y-1">
                      <Label className="text-[11px] text-muted-foreground font-semibold">
                        Confirmed Amount <span className="text-red-500 font-bold">*</span>
                      </Label>
                      <div className="relative">
                        <DollarSign className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={amount || ""}
                          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                          className="h-8 pl-8 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-background"
                          required
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-4 space-y-1">
                      <Label className="text-[11px] font-semibold text-foreground">
                        Currency <span className="text-red-500 font-bold">*</span>
                      </Label>
                      <CurrencyAutocomplete
                        value={currency}
                        onChange={setCurrency}
                        className="h-8 text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>
  );
}
