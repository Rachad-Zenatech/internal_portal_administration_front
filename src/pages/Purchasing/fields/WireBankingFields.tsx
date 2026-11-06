import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe2, Plus } from "lucide-react";
import type { WireBankingFieldsProps } from "./wireBankingFields/types";
import { useWireBankingFields } from "./wireBankingFields/hooks/useWireBankingFields";
import { Card1BeneficiaryBank } from "./wireBankingFields/sections/Card1BeneficiaryBank";
import { RoutingWire } from "./wireBankingFields/sections/RoutingWire";

export default WireBankingFields;

export function WireBankingFields(props: WireBankingFieldsProps) {
  const s = useWireBankingFields(props);
  const { addClearingField, availableClearingFields, clearingScrollRef, addClearingFieldOpen, setAddClearingFieldOpen, addClearingRef, form } = s;
  return (
    <div className="space-y-4 pt-1">
      {/* CARD 1: BENEFICIARY BANK DETAILS */}
      <Card1BeneficiaryBank s={s} />

      {/* CARD 2: GLOBAL & REGIONAL CLEARING CODES */}
      <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Globe2 className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                <span>Global &amp; Regional Clearing Codes</span>
                <Badge variant="outline" className="text-[10px] text-indigo-600 border-indigo-300 dark:text-indigo-400">
                  {form.bank_country || "Selected Country"}
                </Badge>
              </h4>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                Routing numbers, SWIFT/BIC, IBAN, and domestic clearing identifiers
              </p>
            </div>
          </div>

          <div ref={addClearingRef} className="relative flex items-center gap-2 shrink-0">
            {availableClearingFields.length > 0 ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAddClearingFieldOpen(!addClearingFieldOpen)}
                  className="h-8 text-xs font-medium gap-1.5 border-dashed border-slate-300 dark:border-zinc-700 hover:bg-emerald-50/50 hover:text-emerald-600 hover:border-emerald-300 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Clearing Code</span>
                </Button>

                {addClearingFieldOpen && (
                  <div
                    data-radix-scroll-lock-ignore=""
                    className="absolute right-0 top-full mt-1 w-60 p-1 z-50 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xl flex flex-col overflow-hidden"
                    style={{
                      boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05)",
                    }}
                  >
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2.5 py-1.5 border-b border-slate-100 dark:border-zinc-800">
                      Available Clearing Codes
                    </div>
                    <div
                      ref={clearingScrollRef}
                      data-radix-scroll-lock-ignore=""
                      className="py-1 max-h-56 overflow-y-auto overscroll-contain"
                      style={{
                        scrollbarWidth: "thin",
                        overscrollBehavior: "contain",
                        WebkitOverflowScrolling: "touch",
                      }}
                    >
                      {availableClearingFields.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => addClearingField(f.id)}
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
              <span className="text-[11px] text-slate-400 italic">All clearing codes active</span>
            )}
          </div>
        </div>

        <RoutingWire s={s} />
      </div>
    </div>
  );
}

export type { FieldDef, WireBankingFieldsProps } from "./wireBankingFields/types";
export { BANK_DETAILS_CATALOG, CLEARING_CODES_CATALOG } from "./wireBankingFields/constants";
export { getLocalCountryDefaults } from "./wireBankingFields/utils";
