import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GLCodeAutocomplete } from "../../../fields/GLCodeAutocomplete";
import { CurrencyAutocomplete } from "../../../fields/CurrencyAutocomplete";
import { formatMoney } from "../../../utils/purchasingMeta";
import { WireGeneralPaymentFields } from "../../../fields/WireGeneralPaymentFields";
import { WireBankingFields } from "../../../fields/WireBankingFields";
import { ScheduleDatesBuilder } from "../../../fields/ScheduleDatesBuilder";
import type { EditRequestDialogState } from "../hooks/useEditRequestDialog";

export function AccountAndWireSection({ s }: { s: EditRequestDialogState }) {
  const { formData, setFormData, calculatedAmount, itemMode, setSchedDates, schedDates, setSchedEndDate, schedEndDate, setSchedStartDate, schedStartDate, setSchedFrequency, schedFrequency, setIsScheduled, isScheduled, setApWireForm, apWireForm } = s;
  return (
    <>
      {formData.request_type === "ACCOUNTS_PAYABLE" ? (
              <div className="space-y-3.5 pt-1">
                <WireGeneralPaymentFields
                  form={apWireForm}
                  setForm={setApWireForm}
                  onAmountChange={(amt) => {
                    setFormData((f) => ({ ...f, amount: String(amt), unit_price: String(amt) }));
                  }}
                  onDueDateChange={(d) => {
                    setFormData((f) => ({ ...f, due_date: d }));
                  }}
                  onVendorChange={(v) => {
                    if (!formData.title || formData.title === apWireForm.vendor) {
                      setFormData((f) => ({ ...f, title: v }));
                    }
                  }}
                />

                <WireBankingFields
                  form={apWireForm}
                  setForm={setApWireForm}
                />

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">GL Code / Account</label>
                  <GLCodeAutocomplete
                    value={formData.gl_code}
                    onChange={(val) => setFormData({ ...formData, gl_code: val })}
                  />
                </div>
              </div>
            ) : formData.request_type === "RECURRING" ? (
              <div className="space-y-3.5 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Currency</label>
                    <CurrencyAutocomplete
                      value={formData.currency || "USD"}
                      onChange={(code) => setFormData((prev) => ({ ...prev, currency: code }))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Amount ({formData.currency || "USD"}) <span className="text-red-500">*</span></label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value, unit_price: e.target.value })}
                      className="h-9 text-xs font-mono"
                      required
                    />
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

                  {formData.request_type === "RECURRING" && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Next Due Date</label>
                      <Input
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>
                  )}
                </div>

                {formData.request_type === "RECURRING" && (
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
                    baseAmount={parseFloat(formData.amount) || 0}
                  />
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">GL Code / Account</label>
                  <GLCodeAutocomplete
                    value={formData.gl_code}
                    onChange={(val) => setFormData({ ...formData, gl_code: val })}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3.5 pt-1">
                {itemMode === "SINGLE" && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Quantity</label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Unit Price ($)</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.unit_price}
                        onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                        className="h-9 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Est. Amount (Pre-tax)</label>
                      <div className="h-9 px-3 py-2 rounded-md border border-slate-200 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900/50 flex items-center text-xs text-slate-700 dark:text-zinc-300 font-semibold font-mono">
                        {formatMoney(calculatedAmount)}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">GL Code / Account</label>
                  <GLCodeAutocomplete
                    value={formData.gl_code}
                    onChange={(val) => setFormData({ ...formData, gl_code: val })}
                  />
                </div>
              </div>
            )}
    </>
  );
}
