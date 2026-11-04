import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";
import type { WireBankingFieldsState } from "../hooks/useWireBankingFields";

export function RoutingWire({ s }: { s: WireBankingFieldsState }) {
  const { validationErrors, setValidationErrors, form, setForm, removeClearingField, requiredFieldKeys, visibleClearingFields, setAchSameAsWire, achSameAsWire } = s;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {visibleClearingFields.includes("routing_wire") && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Routing (Wire)
                  {requiredFieldKeys.has("routing_wire") && (
                    <span className="text-red-500 font-bold ml-0.5">*</span>
                  )}
                </label>
                <div className="flex items-center gap-1.5">
                  {validationErrors.routing_wire && (
                    <span className="text-[10px] text-red-500 font-medium">Required</span>
                  )}
                  {!requiredFieldKeys.has("routing_wire") && (
                    <button
                      type="button"
                      onClick={() => removeClearingField("routing_wire")}
                      className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                      title="Remove field"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <Input
                value={form.routing_wire || ""}
                onChange={(e) => {
                  setForm({ ...form, routing_wire: e.target.value });
                  setValidationErrors?.((prev) => ({ ...prev, routing_wire: false }));
                }}
                placeholder="9-digit Wire Routing Number"
                className={`h-9 text-xs font-mono bg-slate-50/50 dark:bg-zinc-800/50 ${
                  validationErrors.routing_wire ? "border-red-500 focus-visible:ring-red-500" : ""
                }`}
              />
            </div>
          )}

          {visibleClearingFields.includes("routing_ach") && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Routing (ACH)
                  {requiredFieldKeys.has("routing_ach") && (
                    <span className="text-red-500 font-bold ml-0.5">*</span>
                  )}
                </label>
                <div className="flex items-center gap-1.5">
                  {validationErrors.routing_ach && (
                    <span className="text-[10px] text-red-500 font-medium">Required</span>
                  )}
                  {!requiredFieldKeys.has("routing_ach") && (
                    <button
                      type="button"
                      onClick={() => removeClearingField("routing_ach")}
                      className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                      title="Remove field"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <Input
                disabled={achSameAsWire}
                value={form.routing_ach || ""}
                onChange={(e) => {
                  setForm({ ...form, routing_ach: e.target.value });
                  setValidationErrors?.((prev) => ({ ...prev, routing_ach: false }));
                }}
                placeholder="9-digit ACH Routing Number"
                className={`h-9 text-xs font-mono bg-slate-50/50 dark:bg-zinc-800/50 ${
                  achSameAsWire ? "opacity-75 cursor-not-allowed bg-slate-100 dark:bg-zinc-800" : ""
                } ${validationErrors.routing_ach ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              />
              <div className="flex items-center gap-2 pt-0.5">
                <Checkbox
                  id="ach_same_wire"
                  checked={achSameAsWire}
                  onCheckedChange={(checked) => {
                    const isChecked = !!checked;
                    setAchSameAsWire(isChecked);
                    if (isChecked) {
                      setForm((prev) => ({ ...prev, routing_ach: prev.routing_wire || "" }));
                      setValidationErrors?.((prev) => ({ ...prev, routing_ach: false }));
                    }
                  }}
                />
                <label
                  htmlFor="ach_same_wire"
                  className="text-[11px] text-slate-600 dark:text-zinc-400 cursor-pointer select-none"
                >
                  Routing (ACH) is same as Routing (Wire)
                </label>
              </div>
            </div>
          )}

          {visibleClearingFields.includes("aba") && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  ABA Number
                  {requiredFieldKeys.has("aba") && (
                    <span className="text-red-500 font-bold ml-0.5">*</span>
                  )}
                </label>
                <div className="flex items-center gap-1.5">
                  {validationErrors.aba && (
                    <span className="text-[10px] text-red-500 font-medium">Required</span>
                  )}
                  {!requiredFieldKeys.has("aba") && (
                    <button
                      type="button"
                      onClick={() => removeClearingField("aba")}
                      className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                      title="Remove field"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <Input
                value={form.aba || ""}
                onChange={(e) => {
                  setForm({ ...form, aba: e.target.value });
                  setValidationErrors?.((prev) => ({ ...prev, aba: false }));
                }}
                placeholder="ABA Routing Number"
                className={`h-9 text-xs font-mono bg-slate-50/50 dark:bg-zinc-800/50 ${
                  validationErrors.aba ? "border-red-500 focus-visible:ring-red-500" : ""
                }`}
              />
            </div>
          )}

          {visibleClearingFields.includes("swift_code") && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  SWIFT / BIC Code
                  {requiredFieldKeys.has("swift_code") && (
                    <span className="text-red-500 font-bold ml-0.5">*</span>
                  )}
                </label>
                <div className="flex items-center gap-1.5">
                  {validationErrors.swift_code && (
                    <span className="text-[10px] text-red-500 font-medium">Required</span>
                  )}
                  {!requiredFieldKeys.has("swift_code") && (
                    <button
                      type="button"
                      onClick={() => removeClearingField("swift_code")}
                      className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                      title="Remove field"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <Input
                value={form.swift_code || ""}
                onChange={(e) => {
                  setForm({ ...form, swift_code: e.target.value.toUpperCase() });
                  setValidationErrors?.((prev) => ({ ...prev, swift_code: false }));
                }}
                placeholder="8 or 11 chars (e.g. BOFAUS3N)"
                className={`h-9 text-xs font-mono uppercase bg-slate-50/50 dark:bg-zinc-800/50 ${
                  validationErrors.swift_code ? "border-red-500 focus-visible:ring-red-500" : ""
                }`}
              />
            </div>
          )}

          {visibleClearingFields.includes("iban") && (
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  IBAN
                  {requiredFieldKeys.has("iban") && (
                    <span className="text-red-500 font-bold ml-0.5">*</span>
                  )}
                </label>
                <div className="flex items-center gap-1.5">
                  {validationErrors.iban && (
                    <span className="text-[10px] text-red-500 font-medium">Required</span>
                  )}
                  {!requiredFieldKeys.has("iban") && (
                    <button
                      type="button"
                      onClick={() => removeClearingField("iban")}
                      className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                      title="Remove field"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <Input
                value={form.iban || ""}
                onChange={(e) => {
                  setForm({ ...form, iban: e.target.value.toUpperCase().replace(/\s/g, "") });
                  setValidationErrors?.((prev) => ({ ...prev, iban: false }));
                }}
                placeholder="International Bank Account Number"
                className={`h-9 text-xs font-mono uppercase bg-slate-50/50 dark:bg-zinc-800/50 ${
                  validationErrors.iban ? "border-red-500 focus-visible:ring-red-500" : ""
                }`}
              />
            </div>
          )}

          {visibleClearingFields.includes("sort_code") && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Sort Code (UK)
                  {requiredFieldKeys.has("sort_code") && (
                    <span className="text-red-500 font-bold ml-0.5">*</span>
                  )}
                </label>
                <div className="flex items-center gap-1.5">
                  {validationErrors.sort_code && (
                    <span className="text-[10px] text-red-500 font-medium">Required</span>
                  )}
                  {!requiredFieldKeys.has("sort_code") && (
                    <button
                      type="button"
                      onClick={() => removeClearingField("sort_code")}
                      className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                      title="Remove field"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <Input
                value={form.sort_code || ""}
                onChange={(e) => {
                  setForm({ ...form, sort_code: e.target.value });
                  setValidationErrors?.((prev) => ({ ...prev, sort_code: false }));
                }}
                placeholder="6 digits (e.g. 12-34-56)"
                className={`h-9 text-xs font-mono bg-slate-50/50 dark:bg-zinc-800/50 ${
                  validationErrors.sort_code ? "border-red-500 focus-visible:ring-red-500" : ""
                }`}
              />
            </div>
          )}

          {visibleClearingFields.includes("transit_code_ca") && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Transit Code (Canada)
                  {requiredFieldKeys.has("transit_code_ca") && (
                    <span className="text-red-500 font-bold ml-0.5">*</span>
                  )}
                </label>
                <div className="flex items-center gap-1.5">
                  {validationErrors.transit_code_ca && (
                    <span className="text-[10px] text-red-500 font-medium">Required</span>
                  )}
                  {!requiredFieldKeys.has("transit_code_ca") && (
                    <button
                      type="button"
                      onClick={() => removeClearingField("transit_code_ca")}
                      className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                      title="Remove field"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <Input
                value={form.transit_code_ca || ""}
                onChange={(e) => {
                  setForm({ ...form, transit_code_ca: e.target.value });
                  setValidationErrors?.((prev) => ({ ...prev, transit_code_ca: false }));
                }}
                placeholder="5-digit transit"
                className={`h-9 text-xs font-mono bg-slate-50/50 dark:bg-zinc-800/50 ${
                  validationErrors.transit_code_ca ? "border-red-500 focus-visible:ring-red-500" : ""
                }`}
              />
            </div>
          )}

          {visibleClearingFields.includes("institution_code") && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Institution Code (Canada)
                  {requiredFieldKeys.has("institution_code") && (
                    <span className="text-red-500 font-bold ml-0.5">*</span>
                  )}
                </label>
                <div className="flex items-center gap-1.5">
                  {validationErrors.institution_code && (
                    <span className="text-[10px] text-red-500 font-medium">Required</span>
                  )}
                  {!requiredFieldKeys.has("institution_code") && (
                    <button
                      type="button"
                      onClick={() => removeClearingField("institution_code")}
                      className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                      title="Remove field"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <Input
                value={form.institution_code || ""}
                onChange={(e) => {
                  setForm({ ...form, institution_code: e.target.value });
                  setValidationErrors?.((prev) => ({ ...prev, institution_code: false }));
                }}
                placeholder="3-digit institution (e.g. 004)"
                className={`h-9 text-xs font-mono bg-slate-50/50 dark:bg-zinc-800/50 ${
                  validationErrors.institution_code ? "border-red-500 focus-visible:ring-red-500" : ""
                }`}
              />
            </div>
          )}

          {visibleClearingFields.includes("bsb_australia") && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  BSB (Australia)
                  {requiredFieldKeys.has("bsb_australia") && (
                    <span className="text-red-500 font-bold ml-0.5">*</span>
                  )}
                </label>
                <div className="flex items-center gap-1.5">
                  {validationErrors.bsb_australia && (
                    <span className="text-[10px] text-red-500 font-medium">Required</span>
                  )}
                  {!requiredFieldKeys.has("bsb_australia") && (
                    <button
                      type="button"
                      onClick={() => removeClearingField("bsb_australia")}
                      className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                      title="Remove field"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <Input
                value={form.bsb_australia || ""}
                onChange={(e) => {
                  setForm({ ...form, bsb_australia: e.target.value });
                  setValidationErrors?.((prev) => ({ ...prev, bsb_australia: false }));
                }}
                placeholder="6 digits (e.g. 123-456)"
                className={`h-9 text-xs font-mono bg-slate-50/50 dark:bg-zinc-800/50 ${
                  validationErrors.bsb_australia ? "border-red-500 focus-visible:ring-red-500" : ""
                }`}
              />
            </div>
          )}

          {visibleClearingFields.includes("clearing_code") && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Clearing Code
                  {requiredFieldKeys.has("clearing_code") && (
                    <span className="text-red-500 font-bold ml-0.5">*</span>
                  )}
                </label>
                <div className="flex items-center gap-1.5">
                  {validationErrors.clearing_code && (
                    <span className="text-[10px] text-red-500 font-medium">Required</span>
                  )}
                  {!requiredFieldKeys.has("clearing_code") && (
                    <button
                      type="button"
                      onClick={() => removeClearingField("clearing_code")}
                      className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                      title="Remove field"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <Input
                value={form.clearing_code || ""}
                onChange={(e) => {
                  setForm({ ...form, clearing_code: e.target.value });
                  setValidationErrors?.((prev) => ({ ...prev, clearing_code: false }));
                }}
                placeholder="Domestic clearing identifier"
                className={`h-9 text-xs font-mono bg-slate-50/50 dark:bg-zinc-800/50 ${
                  validationErrors.clearing_code ? "border-red-500 focus-visible:ring-red-500" : ""
                }`}
              />
            </div>
          )}

          {visibleClearingFields.includes("bank_code") && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Bank Code / CNAPS
                  {requiredFieldKeys.has("bank_code") && (
                    <span className="text-red-500 font-bold ml-0.5">*</span>
                  )}
                </label>
                <div className="flex items-center gap-1.5">
                  {validationErrors.bank_code && (
                    <span className="text-[10px] text-red-500 font-medium">Required</span>
                  )}
                  {!requiredFieldKeys.has("bank_code") && (
                    <button
                      type="button"
                      onClick={() => removeClearingField("bank_code")}
                      className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                      title="Remove field"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <Input
                value={form.bank_code || ""}
                onChange={(e) => {
                  setForm({ ...form, bank_code: e.target.value });
                  setValidationErrors?.((prev) => ({ ...prev, bank_code: false }));
                }}
                placeholder="Bank code or CNAPS"
                className={`h-9 text-xs font-mono bg-slate-50/50 dark:bg-zinc-800/50 ${
                  validationErrors.bank_code ? "border-red-500 focus-visible:ring-red-500" : ""
                }`}
              />
            </div>
          )}
        </div>
  );
}
