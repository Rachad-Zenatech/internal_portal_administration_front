import React from "react";
import {
  CalendarClock,
  Plus,
  Trash2,
  ArrowUpDown,
  Calculator,
  Clock,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FrequencyType, CustomScheduleDate } from "@/types/purchasing";
import {
  formatDateToIso,
  calculateInstallmentsCount,
  formatRemainingDuration,
} from "@/pages/Purchasing/recurringScheduleUtils";

export interface ScheduleDatesBuilderProps {
  isScheduled: boolean;
  onIsScheduledChange: (val: boolean) => void;
  frequency: FrequencyType;
  onFrequencyChange: (val: FrequencyType) => void;
  startDate: string;
  onStartDateChange: (val: string) => void;
  endDate: string;
  onEndDateChange: (val: string) => void;
  scheduleDates: CustomScheduleDate[];
  onScheduleDatesChange: (dates: CustomScheduleDate[]) => void;
  baseAmount?: number;
  currency?: string;
}

export const ScheduleDatesBuilder: React.FC<ScheduleDatesBuilderProps> = ({
  isScheduled,
  onIsScheduledChange,
  frequency,
  onFrequencyChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  scheduleDates,
  onScheduleDatesChange,
  baseAmount = 0,
  currency = "USD",
}) => {
  const isCustom = frequency === "CUSTOM";

  // Helper to add a new custom installment date
  const handleAddDate = (offsetDays: number = 30) => {
    let nextDateStr = new Date().toISOString().split("T")[0];

    if (scheduleDates.length > 0) {
      const lastDate = scheduleDates[scheduleDates.length - 1].date;
      if (lastDate) {
        const d = new Date(lastDate.includes("T") ? lastDate : lastDate + "T00:00:00");
        d.setDate(d.getDate() + offsetDays);
        nextDateStr = formatDateToIso(d);
      }
    } else if (startDate) {
      const d = new Date(startDate.includes("T") ? startDate : startDate + "T00:00:00");
      d.setDate(d.getDate() + offsetDays);
      nextDateStr = formatDateToIso(d);
    }

    const newDates = [
      ...scheduleDates,
      {
        date: nextDateStr,
        amount: baseAmount > 0 ? baseAmount : undefined,
        note: `Installment #${scheduleDates.length + 1}`,
      },
    ];

    onScheduleDatesChange(newDates);

    // Sync start and end date
    if (newDates.length > 0) {
      const sorted = [...newDates].sort((a, b) => a.date.localeCompare(b.date));
      onStartDateChange(sorted[0].date);
      onEndDateChange(sorted[sorted.length - 1].date);
    }
  };

  const handleUpdateDate = (index: number, field: keyof CustomScheduleDate, value: any) => {
    const updated = [...scheduleDates];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    onScheduleDatesChange(updated);

    if (field === "date" && updated.length > 0) {
      const validDates = updated.map((d) => d.date).filter(Boolean);
      if (validDates.length > 0) {
        validDates.sort();
        onStartDateChange(validDates[0]);
        onEndDateChange(validDates[validDates.length - 1]);
      }
    }
  };

  const handleRemoveDate = (index: number) => {
    const updated = scheduleDates.filter((_, i) => i !== index);
    onScheduleDatesChange(updated);
    if (updated.length > 0) {
      const validDates = updated.map((d) => d.date).filter(Boolean);
      if (validDates.length > 0) {
        validDates.sort();
        onStartDateChange(validDates[0]);
        onEndDateChange(validDates[validDates.length - 1]);
      }
    }
  };

  const handleSortDates = () => {
    const sorted = [...scheduleDates].sort((a, b) => a.date.localeCompare(b.date));
    onScheduleDatesChange(sorted);
    if (sorted.length > 0) {
      onStartDateChange(sorted[0].date);
      onEndDateChange(sorted[sorted.length - 1].date);
    }
  };

  const handleDistributeEvenly = () => {
    if (scheduleDates.length === 0 || baseAmount <= 0) return;
    const splitAmount = Math.round((baseAmount / scheduleDates.length) * 100) / 100;
    const updated = scheduleDates.map((item) => ({
      ...item,
      amount: splitAmount,
    }));
    onScheduleDatesChange(updated);
  };

  const totalCustomAmount = scheduleDates.reduce((acc, item) => {
    const amt = item.amount != null && item.amount > 0 ? item.amount : baseAmount;
    return acc + amt;
  }, 0);

  const formatMoney = (amt: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
    }).format(amt || 0);
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/50 p-3.5 space-y-3 flex flex-col h-full">
      {/* Header Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="text-xs font-bold flex items-center gap-1.5 text-slate-800 dark:text-zinc-200 uppercase tracking-wide">
            <CalendarClock className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Schedule & Installment Dates</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Plan recurring payments or milestones with specific dates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="builder-sched-check"
            checked={isScheduled}
            onCheckedChange={(checked) => {
              const isChecked = Boolean(checked);
              onIsScheduledChange(isChecked);
              if (isChecked && !startDate) {
                const sDate = new Date().toISOString().split("T")[0];
                const d = new Date(sDate + "T00:00:00");
                d.setFullYear(d.getFullYear() + 2);
                onStartDateChange(sDate);
                onEndDateChange(formatDateToIso(d));
              }
            }}
          />
          <label
            htmlFor="builder-sched-check"
            className="text-xs font-semibold cursor-pointer text-slate-700 dark:text-zinc-300 select-none"
          >
            Enable Schedule
          </label>
        </div>
      </div>

      {isScheduled && (
        <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-zinc-800 flex-1 flex flex-col">
          {/* Frequency & Schedule Type */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400">
                Schedule Mode
              </label>
              {isCustom ? (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-indigo-300 text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 font-medium">
                  <Sparkles className="h-2.5 w-2.5 mr-1 text-indigo-500" />
                  Custom List
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-300 text-slate-600 dark:text-zinc-400">
                  Periodic
                </Badge>
              )}
            </div>

            <Select
              value={frequency}
              onValueChange={(v: FrequencyType) => {
                onFrequencyChange(v);
                if (v === "CUSTOM" && scheduleDates.length === 0) {
                  const d1 = startDate || new Date().toISOString().split("T")[0];
                  const nextMonth = new Date(d1 + "T00:00:00");
                  nextMonth.setMonth(nextMonth.getMonth() + 1);
                  const d2 = formatDateToIso(nextMonth);
                  onScheduleDatesChange([
                    { date: d1, amount: baseAmount, note: "Installment #1" },
                    { date: d2, amount: baseAmount, note: "Installment #2" },
                  ]);
                }
              }}
            >
              <SelectTrigger className="h-8 text-xs font-medium bg-white dark:bg-zinc-950">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CUSTOM" className="font-semibold text-indigo-600 dark:text-indigo-400">
                  ✨ Custom Installment Dates (List)
                </SelectItem>
                <SelectItem value="MONTHLY">Monthly (Periodic)</SelectItem>
                <SelectItem value="BI_WEEKLY">Bi-Weekly (Every 2 Weeks)</SelectItem>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="QUARTERLY">Quarterly (3 Months)</SelectItem>
                <SelectItem value="SEMI_ANNUALLY">Semi-Annually (6 Months)</SelectItem>
                <SelectItem value="ANNUALLY">Annually (1 Year)</SelectItem>
                <SelectItem value="DAILY">Daily</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Periodic Start & End Date */}
          {!isCustom && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400">Start Date</label>
                <Input
                  type="date"
                  className="h-8 text-xs bg-white dark:bg-zinc-950"
                  value={startDate}
                  onChange={(e) => onStartDateChange(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400">End Date</label>
                <Input
                  type="date"
                  className="h-8 text-xs bg-white dark:bg-zinc-950"
                  value={endDate}
                  onChange={(e) => onEndDateChange(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* ── CUSTOM INSTALLMENT DATES LIST ── */}
          {isCustom && (
            <div className="space-y-2 pt-1 border-t border-dashed border-slate-200 dark:border-zinc-800 flex-1 flex flex-col">
              {/* Header Bar */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5 text-indigo-600" />
                  <span>
                    <strong>{scheduleDates.length}</strong> dates · Total: <strong className="text-slate-900 dark:text-zinc-100">{formatMoney(totalCustomAmount)}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px] gap-1 px-1.5"
                    onClick={handleSortDates}
                    title="Sort dates chronologically"
                  >
                    <ArrowUpDown className="h-2.5 w-2.5" />
                    Sort
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px] gap-1 px-1.5"
                    onClick={handleDistributeEvenly}
                    title="Split total amount evenly"
                  >
                    <Calculator className="h-2.5 w-2.5" />
                    Split
                  </Button>
                </div>
              </div>

              {/* Column Labels */}
              <div className="grid grid-cols-12 gap-1.5 px-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-4">Due Date</div>
                <div className="col-span-3 text-right">Amount</div>
                <div className="col-span-3">Note</div>
                <div className="col-span-1"></div>
              </div>

              {/* Installment Rows with comfortable scroll height */}
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 flex-1">
                {scheduleDates.length === 0 ? (
                  <div className="p-4 text-center rounded-lg border border-dashed text-xs text-muted-foreground bg-white dark:bg-zinc-950">
                    No installment dates added yet. Click <strong>+ Add Installment Date</strong> below.
                  </div>
                ) : (
                  scheduleDates.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 items-center gap-1.5 p-1 rounded-md bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors"
                    >
                      {/* Index Badge */}
                      <div className="col-span-1 flex items-center justify-center">
                        <span className="h-5 w-5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-[9px] flex items-center justify-center border border-indigo-100 dark:border-indigo-800">
                          {idx + 1}
                        </span>
                      </div>

                      {/* Date picker */}
                      <div className="col-span-4">
                        <Input
                          type="date"
                          value={item.date}
                          onChange={(e) => handleUpdateDate(idx, "date", e.target.value)}
                          className="h-7 text-xs font-medium px-1.5 w-full bg-slate-50/50 dark:bg-zinc-900/50"
                          required
                        />
                      </div>

                      {/* Custom Amount */}
                      <div className="col-span-3 relative">
                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-semibold">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder={baseAmount ? baseAmount.toFixed(2) : "0.00"}
                          value={item.amount != null ? item.amount : ""}
                          onChange={(e) =>
                            handleUpdateDate(
                              idx,
                              "amount",
                              e.target.value ? parseFloat(e.target.value) : undefined
                            )
                          }
                          className="h-7 text-xs pl-4 pr-1 font-medium text-right w-full bg-slate-50/50 dark:bg-zinc-900/50 font-mono"
                        />
                      </div>

                      {/* Optional Note / Label */}
                      <div className="col-span-3">
                        <Input
                          placeholder="Note"
                          value={item.note || ""}
                          onChange={(e) => handleUpdateDate(idx, "note", e.target.value)}
                          className="h-7 text-[10px] px-1.5 w-full bg-slate-50/50 dark:bg-zinc-900/50"
                        />
                      </div>

                      {/* Delete button */}
                      <div className="col-span-1 flex items-center justify-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          onClick={() => handleRemoveDate(idx)}
                          title="Remove date"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Action buttons & quick add helpers */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <Button
                    type="button"
                    onClick={() => handleAddDate(30)}
                    size="sm"
                    className="h-7 gap-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs text-xs font-semibold px-2.5"
                  >
                    <Plus className="h-3 w-3" />
                    Add Date
                  </Button>

                  {/* Quick Add Interval helpers */}
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="text-muted-foreground text-[10px]">Quick:</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-5 text-[10px] px-1"
                      onClick={() => handleAddDate(7)}
                    >
                      +1 Wk
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-5 text-[10px] px-1"
                      onClick={() => handleAddDate(14)}
                    >
                      +2 Wks
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-5 text-[10px] px-1"
                      onClick={() => handleAddDate(30)}
                    >
                      +1 Mo
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-5 text-[10px] px-1"
                      onClick={() => handleAddDate(90)}
                    >
                      +3 Mos
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Periodic summary info banner */}
          {!isCustom && startDate && endDate && (
            <div className="p-2 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200 mt-auto">
              <span className="font-medium flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-indigo-600" />
                {formatRemainingDuration(endDate, startDate).text}
              </span>
              <span>
                <strong>{calculateInstallmentsCount(startDate, endDate, frequency)}</strong> cycles ·{" "}
                {formatMoney(calculateInstallmentsCount(startDate, endDate, frequency) * (baseAmount || 0))}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScheduleDatesBuilder;
