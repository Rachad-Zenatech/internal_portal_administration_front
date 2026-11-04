import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScheduleDatesBuilder } from "../../fields/ScheduleDatesBuilder";
import { GLCodeAutocomplete } from "../../fields/GLCodeAutocomplete";
import { CurrencyAutocomplete } from "../../fields/CurrencyAutocomplete";
import type { PurchaseRequestsState } from "../hooks/usePurchaseRequestsPage";

export function RecurringRequestOptions({ s }: { s: PurchaseRequestsState }) {
  const { setForm, form, setSchedDates, schedDates, setSchedEndDate, schedEndDate, setSchedStartDate, schedStartDate, setSchedFrequency, schedFrequency, setIsScheduled, isScheduled } = s;
  return (
    <>
      {form.request_type === "RECURRING" && (
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Currency</label>
                    <CurrencyAutocomplete
                      value={form.currency || "USD"}
                      onChange={(curr) => setForm((prev) => ({ ...prev, currency: curr }))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Amount ({form.currency || "USD"}) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">{form.currency || "USD"}</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={
                          isScheduled && schedFrequency === "CUSTOM" && schedDates.length > 0
                            ? (schedDates.reduce((acc, itm) => acc + (itm.amount != null ? itm.amount : 0), 0) || "").toString()
                            : (form.amount ? form.amount : "")
                        }
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setForm((prev) => ({ ...prev, amount: val, unit_price: val }));
                        }}
                        disabled={isScheduled && schedFrequency === "CUSTOM"}
                        className="h-9 text-xs font-mono pl-12 disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed"
                        required={!(isScheduled && schedFrequency === "CUSTOM")}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Frequency <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={schedFrequency}
                      onValueChange={(val: any) => setSchedFrequency(val)}
                    >
                      <SelectTrigger className="h-9 text-xs bg-white dark:bg-zinc-950">
                        <SelectValue placeholder="Frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                        <SelectItem value="ANNUALLY">Annually</SelectItem>
                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                        <SelectItem value="BI_WEEKLY">Bi-Weekly</SelectItem>
                        <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                        <SelectItem value="SEMI_ANNUALLY">Semi-Annually</SelectItem>
                        <SelectItem value="DAILY">Daily</SelectItem>
                        <SelectItem value="CUSTOM">Custom Dates</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Next Due Date</label>
                    <Input
                      type="date"
                      value={form.due_date || schedStartDate}
                      onChange={(e) => setForm((prev) => ({ ...prev, due_date: e.target.value }))}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <ScheduleDatesBuilder
                  isScheduled={isScheduled}
                  onIsScheduledChange={setIsScheduled}
                  frequency={schedFrequency}
                  onFrequencyChange={setSchedFrequency}
                  startDate={schedStartDate}
                  onStartDateChange={setSchedStartDate}
                  endDate={schedEndDate}
                  onEndDateChange={setSchedEndDate}
                  scheduleDates={schedDates}
                  onScheduleDatesChange={setSchedDates}
                  baseAmount={form.amount || 0}
                />

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">GL Code / Account</label>
                  <GLCodeAutocomplete
                    value={form.gl_code || ""}
                    onChange={(val) => setForm((prev) => ({ ...prev, gl_code: val }))}
                  />
                </div>
              </div>
            )}
    </>
  );
}
