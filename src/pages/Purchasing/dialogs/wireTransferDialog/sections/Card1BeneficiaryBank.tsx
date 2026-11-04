import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, X } from "lucide-react";
import { CountryAutocomplete } from "../../../fields/CountryAutocomplete";
import type { WireTransferDialogState } from "../hooks/useWireTransferDialog";

export function Card1BeneficiaryBank({ s }: { s: WireTransferDialogState }) {
  const { validationErrors, setValidationErrors, form, setForm, removeBankField, requiredFieldKeys, visibleBankFields, handleCountryChange, addBankField, availableBankFields, bankScrollRef, addBankFieldOpen, setAddBankFieldOpen, addBankRef, countrySpec } = s;
  return (
    <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 shadow-2xs space-y-4">
                      {/* CARD HEADER */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-md bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                              <span>Beneficiary Bank Details</span>
                              {countrySpec?.has_iban && (
                                <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300 dark:text-emerald-400">
                                  IBAN Country ({countrySpec.iban_length} chars)
                                </Badge>
                              )}
                            </h4>
                            <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                              Bank jurisdiction, institution identity, and beneficiary account
                            </p>
                          </div>
                        </div>

                        {/* ADD BANK FIELD (NO DUPLICATES, IN-TREE SCROLLABLE DROPDOWN) */}
                        <div ref={addBankRef} className="relative flex items-center gap-2 shrink-0">
                          {availableBankFields.length > 0 ? (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setAddBankFieldOpen(!addBankFieldOpen)}
                                className="h-8 text-xs font-medium gap-1.5 border-dashed border-slate-300 dark:border-zinc-700 hover:bg-indigo-50/50 hover:text-indigo-600 hover:border-indigo-300"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                <span>Add Bank Field</span>
                              </Button>

                              {addBankFieldOpen && (
                                <div
                                  data-radix-scroll-lock-ignore=""
                                  className="absolute right-0 top-full mt-1 w-56 p-1 z-50 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xl flex flex-col overflow-hidden"
                                  style={{
                                    boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05)",
                                  }}
                                >
                                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1.5 border-b border-slate-100 dark:border-zinc-800">
                                    Available Fields
                                  </div>
                                  <div
                                    ref={bankScrollRef}
                                    data-radix-scroll-lock-ignore=""
                                    className="py-1 max-h-56 overflow-y-auto overscroll-contain"
                                    style={{ scrollbarWidth: "thin", overscrollBehavior: "contain" }}
                                  >
                                    {availableBankFields.map((f) => (
                                      <button
                                        key={f.id}
                                        type="button"
                                        onClick={() => addBankField(f.id)}
                                        className="w-full text-left px-2.5 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-zinc-800 rounded flex items-center justify-between transition-colors"
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

                      {/* FIELDS GRID */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                        {/* Bank Country (Autocomplete) */}
                        {visibleBankFields.includes("bank_country") && (
                          <div className="space-y-1.5 sm:col-span-2 md:col-span-1">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                                Bank Country <span className="text-red-500 font-bold">*</span>
                              </label>
                              {validationErrors.bank_country && (
                                <span className="text-[10px] text-red-500 font-medium">Required</span>
                              )}
                            </div>
                            <CountryAutocomplete
                              value={form.bank_country || ""}
                              onChange={handleCountryChange}
                              placeholder="Select bank country..."
                            />
                          </div>
                        )}

                        {/* Bank Name */}
                        {visibleBankFields.includes("bank_name") && (
                          <div className="space-y-1.5 sm:col-span-2 md:col-span-2">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                                Bank Name
                                {requiredFieldKeys.has("bank_name") && (
                                  <span className="text-red-500 font-bold ml-0.5">*</span>
                                )}
                              </label>
                              <div className="flex items-center gap-1.5">
                                {validationErrors.bank_name && (
                                  <span className="text-[10px] text-red-500 font-medium">Required</span>
                                )}
                                {!requiredFieldKeys.has("bank_name") && (
                                  <button
                                    type="button"
                                    onClick={() => removeBankField("bank_name")}
                                    className="text-slate-400 hover:text-red-500 transition-colors"
                                    title="Remove field"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <Input
                              value={form.bank_name || ""}
                              onChange={(e) => {
                                setForm({ ...form, bank_name: e.target.value });
                                setValidationErrors((prev) => ({ ...prev, bank_name: false }));
                              }}
                              placeholder="e.g. CIBC, JPMorgan Chase, HSBC"
                              className={`h-9 text-xs bg-slate-50/50 dark:bg-zinc-800/50 ${
                                validationErrors.bank_name ? "border-red-500 focus-visible:ring-red-500" : ""
                              }`}
                            />
                          </div>
                        )}

                        {/* Bank Account Number */}
                        {visibleBankFields.includes("bank_account_number") && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                                Bank Account #
                                {requiredFieldKeys.has("bank_account_number") && (
                                  <span className="text-red-500 font-bold ml-0.5">*</span>
                                )}
                              </label>
                              <div className="flex items-center gap-1.5">
                                {validationErrors.bank_account_number && (
                                  <span className="text-[10px] text-red-500 font-medium">Required</span>
                                )}
                                {!requiredFieldKeys.has("bank_account_number") && (
                                  <button
                                    type="button"
                                    onClick={() => removeBankField("bank_account_number")}
                                    className="text-slate-400 hover:text-red-500 transition-colors"
                                    title="Remove field"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <Input
                              value={form.bank_account_number || ""}
                              onChange={(e) => {
                                setForm({ ...form, bank_account_number: e.target.value });
                                setValidationErrors((prev) => ({ ...prev, bank_account_number: false }));
                              }}
                              placeholder="Account Number"
                              className={`h-9 text-xs font-mono font-medium bg-slate-50/50 dark:bg-zinc-800/50 ${
                                validationErrors.bank_account_number ? "border-red-500 focus-visible:ring-red-500" : ""
                              }`}
                            />
                          </div>
                        )}

                        {/* Tax ID */}
                        {visibleBankFields.includes("tax_id") && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                                Tax ID / EIN
                                {requiredFieldKeys.has("tax_id") && (
                                  <span className="text-red-500 font-bold ml-0.5">*</span>
                                )}
                              </label>
                              <div className="flex items-center gap-1.5">
                                {validationErrors.tax_id && (
                                  <span className="text-[10px] text-red-500 font-medium">Required</span>
                                )}
                                {!requiredFieldKeys.has("tax_id") && (
                                  <button
                                    type="button"
                                    onClick={() => removeBankField("tax_id")}
                                    className="text-slate-400 hover:text-red-500 transition-colors"
                                    title="Remove field"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <Input
                              value={form.tax_id || ""}
                              onChange={(e) => {
                                setForm({ ...form, tax_id: e.target.value });
                                setValidationErrors((prev) => ({ ...prev, tax_id: false }));
                              }}
                              placeholder="Tax ID Number"
                              className={`h-9 text-xs bg-slate-50/50 dark:bg-zinc-800/50 ${
                                validationErrors.tax_id ? "border-red-500 focus-visible:ring-red-500" : ""
                              }`}
                            />
                          </div>
                        )}

                        {/* Region / Province */}
                        {visibleBankFields.includes("region") && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                                Region / Province / State
                                {requiredFieldKeys.has("region") && (
                                  <span className="text-red-500 font-bold ml-0.5">*</span>
                                )}
                              </label>
                              <div className="flex items-center gap-1.5">
                                {validationErrors.region && (
                                  <span className="text-[10px] text-red-500 font-medium">Required</span>
                                )}
                                {!requiredFieldKeys.has("region") && (
                                  <button
                                    type="button"
                                    onClick={() => removeBankField("region")}
                                    className="text-slate-400 hover:text-red-500 transition-colors"
                                    title="Remove field"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <Input
                              value={form.region || ""}
                              onChange={(e) => {
                                setForm({ ...form, region: e.target.value });
                                setValidationErrors((prev) => ({ ...prev, region: false }));
                              }}
                              placeholder="e.g. Ontario, California, Bavaria"
                              className={`h-9 text-xs bg-slate-50/50 dark:bg-zinc-800/50 ${
                                validationErrors.region ? "border-red-500 focus-visible:ring-red-500" : ""
                              }`}
                            />
                          </div>
                        )}
                      </div>
                    </div>
  );
}
