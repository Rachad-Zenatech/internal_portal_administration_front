import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
      <DialogContent
        className="!w-[95vw] !max-w-[1200px] sm:!max-w-[1200px] max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl"
        style={{ width: "95vw", maxWidth: "1200px" }}
      >
        <div className="p-6 sm:px-8 border-b border-slate-100 dark:border-zinc-800/80 shrink-0">
          <DialogHeader className="gap-0">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
                <Repeat className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  Convert Request #{request.id} to Recurring Purchase
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
                  Transform this one-time spend request into an ongoing subscription or scheduled recurring payment cycle.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <form onSubmit={handleConvert} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
            {/* Informational Request Summary Card */}
            <div className="rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700/60 p-4 sm:p-5 text-sm space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 font-semibold text-slate-800 dark:text-zinc-100">
                <span className="text-base truncate max-w-[650px]">{request.title}</span>
                <Badge variant="outline" className="font-mono text-xs uppercase px-2.5 py-0.5 border-slate-300 dark:border-zinc-700">
                  Current Type: {request.request_type || "SPEND"}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 text-slate-500 dark:text-zinc-400 text-xs sm:text-sm">
                <span>
                  Requester: <strong className="text-slate-800 dark:text-zinc-200 font-medium">{request.requester || "—"}</strong>
                  {request.department ? ` • ${request.department}` : ""}
                </span>
                <span>
                  Current Total: <strong className="text-slate-900 dark:text-zinc-100 text-sm font-semibold">{formatMoney(initialAmount, request.currency || "USD")}</strong>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Amount per cycle */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                  Cycle Amount (USD) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-semibold">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={cycleAmount}
                    onChange={(e) => setCycleAmount(e.target.value)}
                    className="h-10 text-sm font-mono pl-8 bg-white dark:bg-zinc-950"
                    required
                  />
                </div>
              </div>

              {/* Next Due Date */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                  <span>Next Billing Due Date <span className="text-rose-500">*</span></span>
                </label>
                <div className="relative">
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="h-10 text-sm bg-white dark:bg-zinc-950"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Schedule Builder for milestones or fixed start/end dates */}
            <div className="pt-2">
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
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                Subscription Terms / Renewal Notes
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Annual auto-renewal, monthly SaaS subscription, cancellation terms..."
                rows={3}
                className="text-sm bg-white dark:bg-zinc-950 resize-y"
              />
            </div>

            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs sm:text-sm">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Once converted, this request will transition to <strong>Recurring Payments</strong> and follow subscription billing schedules and reminder workflows.
              </span>
            </div>
          </div>

          <div className="p-4 sm:px-8 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/80 dark:bg-zinc-900/90 backdrop-blur-xs flex items-center justify-end gap-3 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
              className="h-10 px-5 text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="default"
              disabled={updateMutation.isPending}
              className="h-10 px-6 text-sm bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-medium shadow-xs"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Converting...</span>
                </>
              ) : (
                <>
                  <Repeat className="h-4 w-4" />
                  <span>Confirm &amp; Convert to Recurring</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
