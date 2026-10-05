import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Repeat,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useUpdateRequest } from "@/hooks/usePurchasing";
import { toast } from "sonner";
import type {
  PurchaseRequest,
  FrequencyType,
  CustomScheduleDate,
} from "@/types/purchasing";
import { ScheduleDatesBuilder } from "./ScheduleDatesBuilder";
import { calculateInstallmentsCount } from "./recurringScheduleUtils";
import { formatMoney } from "./purchasingMeta";

interface ConvertToRecurringDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: PurchaseRequest;
  onSuccess?: () => void;
}

export function ConvertToRecurringDialog({
  open,
  onOpenChange,
  request,
  onSuccess,
}: ConvertToRecurringDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const updateMutation = useUpdateRequest();

  const initialAmount = useMemo(() => {
    return request.amount != null && Number(request.amount) > 0
      ? Number(request.amount)
      : (Number(request.unit_price) || 0);
  }, [request.amount, request.unit_price]);

  const todayIso = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Form States
  const [frequency, setFrequency] = useState<FrequencyType>("MONTHLY");
  const [cycleAmount, setCycleAmount] = useState<string>(
    initialAmount > 0 ? String(initialAmount) : ""
  );
  const [dueDate, setDueDate] = useState<string>(
    request.due_date ? request.due_date.split("T")[0] : todayIso
  );
  const [description, setDescription] = useState<string>(
    request.description || ""
  );

  // Schedule builder states
  const [isScheduled, setIsScheduled] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>(
    request.due_date ? request.due_date.split("T")[0] : todayIso
  );
  const [endDate, setEndDate] = useState<string>("");
  const [scheduleDates, setScheduleDates] = useState<CustomScheduleDate[]>([]);

  const isCustom = frequency === "CUSTOM";
  const numCycleAmount = parseFloat(cycleAmount) || 0;

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!numCycleAmount && (!scheduleDates.length || !isCustom)) {
      toast.error("Please enter a recurring billing amount per cycle.");
      return;
    }

    let totalCycles: number | null = null;
    let totalAmt: number | null = null;
    const baseAmt = isCustom && scheduleDates.length > 0
      ? scheduleDates.reduce((acc, itm) => acc + (itm.amount != null ? itm.amount : 0), 0)
      : numCycleAmount;

    if (isScheduled) {
      if (isCustom) {
        totalCycles = scheduleDates.length;
        totalAmt = scheduleDates.reduce(
          (acc, itm) => acc + (itm.amount != null ? itm.amount : baseAmt),
          0
        );
      } else {
        totalCycles = calculateInstallmentsCount(startDate, endDate, frequency);
        totalAmt = totalCycles ? Math.round(baseAmt * totalCycles * 100) / 100 : null;
      }
    }

    const effectiveStartDate = isCustom && scheduleDates.length > 0
      ? scheduleDates[0].date
      : (startDate || dueDate || todayIso);
    const effectiveEndDate = isCustom && scheduleDates.length > 0
      ? scheduleDates[scheduleDates.length - 1].date
      : (endDate || null);

    const recurringSchedulePayload = isScheduled
      ? {
          is_scheduled: true,
          frequency,
          start_date: effectiveStartDate,
          end_date: effectiveEndDate,
          total_installments: totalCycles,
          completed_installments: 0,
          amount_per_cycle: baseAmt,
          total_amount: totalAmt,
          custom_dates: isCustom ? scheduleDates.map((d) => d.date) : null,
          schedule_dates: isCustom ? scheduleDates : null,
        }
      : {
          is_scheduled: false,
          frequency: frequency || "MONTHLY",
          start_date: dueDate || effectiveStartDate,
          end_date: null,
          total_installments: null,
          completed_installments: 0,
          amount_per_cycle: baseAmt,
          total_amount: null,
        };

    const updatePayload: any = {
      request_type: isScheduled ? "SCHEDULED_PAYMENT" : "RECURRING",
      amount: baseAmt,
      unit_price: baseAmt,
      due_date: dueDate || effectiveStartDate || null,
      description: description.trim() || request.description || null,
      recurring_schedule: recurringSchedulePayload,
    };

    try {
      await updateMutation.mutateAsync({
        id: String(request.id),
        data: updatePayload,
      });

      queryClient.invalidateQueries({ queryKey: ["purchasing"] });
      queryClient.invalidateQueries({ queryKey: ["purchasing-request", String(request.id)] });
      queryClient.invalidateQueries({ queryKey: ["recurring-requests"] });

      toast.success(
        `Request #${request.id} successfully converted to Recurring Purchase!`
      );
      onOpenChange(false);
      if (onSuccess) onSuccess();

      // Navigate to recurring payments view so user sees it in their subscriptions list
      navigate("/purchasing/recurring");
    } catch (err: any) {
      console.error("Failed to convert request to recurring:", err);
      toast.error(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to convert request to recurring purchase."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Repeat className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                Convert Request #{request.id} to Recurring Purchase
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-zinc-400">
                Transform this one-time spend request into an ongoing subscription or scheduled cycle.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Informational Request Summary Card */}
        <div className="rounded-lg bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 p-3 text-xs space-y-1.5">
          <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-zinc-200">
            <span className="truncate max-w-[320px]">{request.title}</span>
            <Badge variant="outline" className="font-mono text-[10px] uppercase">
              Current: {request.request_type || "SPEND"}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 text-[11px]">
            <span>
              Requester: <strong className="text-slate-700 dark:text-zinc-300">{request.requester || "—"}</strong>
              {request.department ? ` • ${request.department}` : ""}
            </span>
            <span>
              Stated Total: <strong className="text-slate-800 dark:text-zinc-200">{formatMoney(initialAmount, request.currency || "USD")}</strong>
            </span>
          </div>
        </div>

        <form onSubmit={handleConvert} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Amount per cycle */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Cycle Amount (USD) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-semibold">$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={cycleAmount}
                  onChange={(e) => setCycleAmount(e.target.value)}
                  className="h-9 text-xs font-mono pl-7 bg-white dark:bg-zinc-950"
                  required
                />
              </div>
            </div>

            {/* Frequency Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Billing Cadence <span className="text-rose-500">*</span>
              </label>
              <Select
                value={frequency}
                onValueChange={(val: any) => setFrequency(val)}
              >
                <SelectTrigger className="h-9 text-xs bg-white dark:bg-zinc-950">
                  <SelectValue placeholder="Select Frequency" />
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

            {/* Next Due Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                <span>Next Due Date <span className="text-rose-500">*</span></span>
              </label>
              <div className="relative">
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-9 text-xs bg-white dark:bg-zinc-950"
                  required
                />
              </div>
            </div>
          </div>

          {/* Schedule Builder for milestones or fixed start/end dates */}
          <div className="pt-1">
            <ScheduleDatesBuilder
              isScheduled={isScheduled}
              onIsScheduledChange={setIsScheduled}
              frequency={frequency}
              onFrequencyChange={setFrequency}
              startDate={startDate}
              onStartDateChange={setStartDate}
              endDate={endDate}
              onEndDateChange={setEndDate}
              scheduleDates={scheduleDates}
              onScheduleDatesChange={setScheduleDates}
              baseAmount={numCycleAmount}
              currency={request.currency || "USD"}
            />
          </div>

          {/* Description & Terms */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Subscription Terms / Renewal Notes
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Annual auto-renewal, monthly SaaS subscription, cancellation terms..."
              rows={2}
              className="text-xs bg-white dark:bg-zinc-950 resize-none"
            />
          </div>

          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Once converted, this request will transition to <strong>Recurring Payments</strong> and follow subscription billing schedules and reminder workflows.
            </span>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={updateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Converting...</span>
                </>
              ) : (
                <>
                  <Repeat className="h-3.5 w-3.5" />
                  <span>Confirm &amp; Convert to Recurring</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
