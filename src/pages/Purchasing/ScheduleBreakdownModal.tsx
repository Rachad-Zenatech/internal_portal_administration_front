import React, { useMemo, useState } from "react";
import type { PurchaseRequest, RecurringSchedule } from "@/types/purchasing";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  formatRemainingDuration,
  generatePaymentSchedule,
  FREQUENCY_LABELS,
  type FrequencyType,
  type ProjectedInstallment,
} from "./recurringScheduleUtils";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Calendar,
  ArrowUpRight,
  Landmark,
  FileText,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getRequest } from "@/services/purchasingService";

interface ScheduleBreakdownModalProps {
  request: PurchaseRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditRequest?: (request: PurchaseRequest) => void;
  onEditWireInfo?: (request: PurchaseRequest) => void;
}

export const ScheduleBreakdownModal: React.FC<ScheduleBreakdownModalProps> = ({
  request,
  open,
  onOpenChange,
  onEditRequest,
  onEditWireInfo,
}) => {
  const navigate = useNavigate();

  // Read-only Wire Info modal state
  const [isWireInfoOpen, setIsWireInfoOpen] = useState(false);
  const [wireData, setWireData] = useState<any>(null);
  const [isLoadingWire, setIsLoadingWire] = useState(false);

  const handleOpenWireInfo = async () => {
    setIsWireInfoOpen(true);
    const existing = (request as any)?.wire_transfer || request?.quote_data?.wire_transfer;
    if (existing) {
      setWireData(existing);
    }
    if (request?.id) {
      try {
        setIsLoadingWire(!existing);
        const res = await getRequest(String(request.id));
        if (res?.wire_transfer) {
          setWireData(res.wire_transfer);
        }
      } catch {
        // Fallback to existing data
      } finally {
        setIsLoadingWire(false);
      }
    }
  };

  const schedule: RecurringSchedule | null = useMemo(() => {
    if (!request) return null;
    return (
      request.recurring_schedule || {
        is_scheduled: false,
        frequency: "MONTHLY" as FrequencyType,
        start_date: request.due_date
          ? String(request.due_date).split("T")[0]
          : String(request.request_date).split("T")[0],
        end_date: null,
        total_installments: null,
        completed_installments: 0,
        amount_per_cycle: request.amount || 0,
        total_amount: null,
      }
    );
  }, [request]);

  const installments = useMemo(() => {
    if (!request || !schedule) return [];
    return generatePaymentSchedule(
      schedule,
      request.amount || 0,
      request.currency || "USD",
      request.status,
      request.due_date || request.request_date
    );
  }, [request, schedule]);

  if (!request || !schedule) return null;

  const formatMoney = (val?: number | null) => {
    if (val == null || isNaN(val)) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: request.currency || "USD",
      minimumFractionDigits: 2,
    }).format(val);
  };

  const formatDate = (dStr: string) => {
    if (!dStr) return "-";
    const date = new Date(dStr.includes("T") ? dStr : dStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isCustom = schedule.frequency === "CUSTOM" || Boolean(schedule.schedule_dates?.length || schedule.custom_dates?.length);
  const durationInfo = isCustom
    ? { text: `${installments.length} Custom Milestone Dates`, isExpired: false, isNearEnd: false, totalDays: 0 }
    : formatRemainingDuration(schedule.end_date, schedule.start_date);
  const totalInstallments = schedule.total_installments || (schedule.end_date ? installments.length : null);
  const completedInstallments = schedule.completed_installments || 0;
  const cycleAmount =
    schedule.amount_per_cycle != null && schedule.amount_per_cycle > 0
      ? schedule.amount_per_cycle
      : request.amount || 0;
  const totalCommitment =
    schedule.total_amount != null
      ? schedule.total_amount
      : totalInstallments
      ? cycleAmount * totalInstallments
      : null;
  const paidToDate = installments
    .filter((it) => it.status === "PAID")
    .reduce((acc, it) => acc + (it.amount || 0), 0);
  const remainingBalance = totalCommitment != null ? Math.max(0, totalCommitment - paidToDate) : null;
  const progressPercent =
    totalInstallments && totalInstallments > 0
      ? Math.min(100, Math.round((completedInstallments / totalInstallments) * 100))
      : (completedInstallments > 0 ? 100 : 0);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[94vw] max-w-[94vw] sm:max-w-5xl lg:max-w-[1250px] max-h-[88vh] flex flex-col p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="p-5 pb-3 border-b bg-slate-50/70 dark:bg-zinc-900/50">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-100/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                  <CalendarClock className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-slate-900 dark:text-zinc-100">
                    Recurring Schedule Breakdown: {request.title}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Request #{request.id} &bull; {request.department} &bull; Requester: {request.requester}
                  </DialogDescription>
                  {request.item_url && (
                    <div className="mt-1 flex items-center gap-1.5">
                      <a
                        href={request.item_url.startsWith("http") ? request.item_url : `https://${request.item_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        <span>{request.item_url}</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                {request && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenWireInfo}
                    className="gap-1.5 text-xs font-semibold bg-white dark:bg-zinc-800 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 shadow-xs h-8 px-3 cursor-pointer"
                  >
                    <Landmark className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Wire Info</span>
                  </Button>
                )}
                <Badge
                  variant="outline"
                  className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800 text-xs font-semibold px-2.5 py-1"
                >
                  {durationInfo.text}
                </Badge>
              </div>
            </div>

            {/* Overview Metrics Cards */}
            <div className="grid grid-cols-4 gap-2.5 pt-3">
              <div className="p-2.5 rounded-lg border bg-white dark:bg-zinc-900/80 shadow-2xs">
                <div className="text-[11px] font-medium text-muted-foreground">Frequency</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-zinc-100 mt-0.5">
                  {FREQUENCY_LABELS[(schedule.frequency as FrequencyType) || "MONTHLY"] || schedule.frequency}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {formatMoney(cycleAmount)} / cycle
                </div>
              </div>

              <div className="p-2.5 rounded-lg border bg-white dark:bg-zinc-900/80 shadow-2xs">
                <div className="text-[11px] font-medium text-muted-foreground">Progress</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-zinc-100 mt-0.5">
                  {totalInstallments ? `${completedInstallments} / ${totalInstallments} Cycles` : `${completedInstallments} Cycles Settled (Ongoing)`}
                </div>
                <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg border bg-white dark:bg-zinc-900/80 shadow-2xs">
                <div className="text-[11px] font-medium text-muted-foreground">Paid to Date</div>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {formatMoney(paidToDate)}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {completedInstallments} installments settled
                </div>
              </div>

              <div className="p-2.5 rounded-lg border bg-white dark:bg-zinc-900/80 shadow-2xs">
                <div className="text-[11px] font-medium text-muted-foreground">
                  {totalCommitment != null ? "Total Commitment" : "Cycle Commitment"}
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-0.5">
                  {totalCommitment != null ? formatMoney(totalCommitment) : `${formatMoney(cycleAmount)} / cycle`}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {remainingBalance != null ? `${formatMoney(remainingBalance)} remaining` : "Ongoing Billing"}
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Payment Schedule Table */}
          <div className="flex-1 overflow-y-auto p-0">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50/90 dark:bg-zinc-900/80 sticky top-0 border-b text-[11px] text-slate-600 dark:text-zinc-400 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-4 w-12">#</th>
                  <th className="py-2.5 px-4">Date of Payment</th>
                  <th className="py-2.5 px-4 text-right">Payment</th>
                  <th className="py-2.5 px-4 text-center">Interest</th>
                  <th className="py-2.5 px-4 text-center">Principal Paid</th>
                  <th className="py-2.5 px-4 text-right">Balance</th>
                  <th className="py-2.5 px-4 text-center w-28">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {installments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-muted-foreground">
                      No schedule dates generated.
                    </td>
                  </tr>
                ) : (
                  installments.map((inst: ProjectedInstallment) => {
                    const isPaid = inst.status === "PAID";
                    const isCurrent = inst.status === "CURRENT";
                    const interestVal = inst.interest != null && inst.interest > 0 ? formatMoney(inst.interest) : "—";
                    const principalVal = inst.principal_paid != null && inst.principal_paid > 0 ? formatMoney(inst.principal_paid) : "—";
                    const balanceVal = inst.balance != null ? formatMoney(inst.balance) : formatMoney(inst.cumulativeAmount);

                    return (
                      <tr
                        key={inst.installmentNumber}
                        className={`transition-colors ${
                          isCurrent
                            ? "bg-amber-50/40 dark:bg-amber-950/20 font-medium"
                            : isPaid
                            ? "hover:bg-slate-50/60 dark:hover:bg-zinc-800/40"
                            : "hover:bg-slate-50/40 dark:hover:bg-zinc-800/20 text-muted-foreground"
                        }`}
                      >
                        <td className="py-2.5 px-4 font-mono font-medium text-slate-500">
                          #{inst.installmentNumber}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-800 dark:text-zinc-200">
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            {formatDate(inst.dueDate)}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-zinc-100">
                          {formatMoney(inst.amount)}
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono text-muted-foreground">
                          {interestVal}
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono text-muted-foreground">
                          {principalVal}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-700 dark:text-zinc-300">
                          {balanceVal}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {isPaid ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 text-[10px] px-2 py-0.5 gap-1 font-semibold">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              Paid
                            </Badge>
                          ) : isCurrent ? (
                            <Badge className="bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 text-[10px] px-2 py-0.5 gap-1 font-semibold">
                              <Clock className="h-3 w-3 text-amber-600" />
                              Current Due
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-slate-400 dark:text-zinc-500 border-slate-200 dark:border-zinc-800 text-[10px] px-2 py-0.5 font-normal"
                            >
                              Projected
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <DialogFooter className="mx-0 mb-0 px-6 py-3.5 border-t bg-slate-50/90 dark:bg-zinc-900/90 flex flex-col sm:flex-row items-center justify-between sm:justify-between gap-3 shrink-0">
            <div className="text-xs text-muted-foreground">
              Schedule: {formatDate(schedule.start_date || "")} - {formatDate(schedule.end_date || "")}
            </div>
            <div className="flex items-center gap-2.5">
              {onEditWireInfo && request && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    onEditWireInfo(request);
                  }}
                  className="gap-1.5 text-xs h-8 px-3 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 shadow-2xs font-medium"
                >
                  <Landmark className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Edit Wire Info</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  if (onEditRequest && request) {
                    onEditRequest(request);
                  } else if (request) {
                    navigate(`/purchasing/requests/${request.id}`);
                  }
                }}
                className="gap-1.5 text-xs h-8 px-3 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/60 font-medium"
              >
                <span>Open Request Details</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-xs h-8 px-4 font-semibold shadow-xs"
              >
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Read-Only Wire Info Dialog ── */}
      <Dialog open={isWireInfoOpen} onOpenChange={setIsWireInfoOpen}>
        <DialogContent className="w-[95vw] sm:max-w-3xl lg:max-w-4xl max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="p-5 pb-3 border-b bg-slate-50/80 dark:bg-zinc-900/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-100/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <span>Wire Transfer Information</span>
                  <Badge variant="outline" className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
                    Read-Only
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Request #{request.id} &bull; {request.title}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 overflow-y-auto space-y-5 text-xs">
            {isLoadingWire ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                <span>Loading wire transfer details...</span>
              </div>
            ) : !wireData ? (
              <div className="py-12 text-center text-muted-foreground space-y-2">
                <Landmark className="h-10 w-10 mx-auto opacity-30 text-indigo-600" />
                <p className="font-semibold text-sm text-slate-800 dark:text-zinc-200">No Wire Transfer Info Found</p>
                <p className="text-xs max-w-sm mx-auto">No wire transfer banking information has been recorded for this request yet.</p>
              </div>
            ) : (
              <>
                {/* General Payment Details */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Payment & Vendor Details</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 p-4 rounded-xl bg-slate-50/70 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-zinc-800">
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Payment Type</span>
                      <span className="font-semibold text-slate-900 dark:text-zinc-100">
                        <Badge variant="secondary" className="text-[11px] px-1.5 py-0 mt-0.5 font-semibold">
                          {wireData.category || wireData.payment_type || "Others"}
                        </Badge>
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Vendor</span>
                      <span className="font-semibold text-slate-900 dark:text-zinc-100 break-words">{wireData.vendor || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Amount</span>
                      <span className="font-semibold text-slate-900 dark:text-zinc-100 font-mono">
                        {formatMoney(wireData.amount != null ? Number(wireData.amount) : request.amount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Payment Date</span>
                      <span className="font-semibold text-slate-900 dark:text-zinc-100">{formatDate(wireData.payment_date || wireData.entry_date)}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Due Date</span>
                      <span className="font-semibold text-slate-900 dark:text-zinc-100">{formatDate(wireData.due_date || request.due_date)}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Pay From</span>
                      <span className="font-semibold text-slate-900 dark:text-zinc-100">{wireData.pay_from || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Entered By</span>
                      <span className="font-semibold text-slate-900 dark:text-zinc-100">{wireData.entered_by || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Invoice #</span>
                      <span className="font-semibold text-slate-900 dark:text-zinc-100 font-mono">{wireData.invoice_number || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Vendor Email</span>
                      <span className="font-semibold text-slate-900 dark:text-zinc-100 break-words">{wireData.vendor_email || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* Bank & Clearing Details */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Landmark className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Banking & Clearing Information</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 p-4 rounded-xl bg-slate-50/70 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-zinc-800">
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Bank Name</span>
                      <span className="font-semibold text-slate-900 dark:text-zinc-100 break-words">{wireData.bank_name || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Bank Country</span>
                      <span className="font-semibold text-slate-900 dark:text-zinc-100">{wireData.bank_country || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Bank Account #</span>
                      <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100">
                        {wireData.bank_account_number || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Tax ID / EIN</span>
                      <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100">{wireData.tax_id || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Routing (Wire)</span>
                      <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100">{wireData.routing_wire || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Routing (ACH)</span>
                      <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100">{wireData.routing_ach || "—"}</span>
                    </div>
                    {wireData.swift_code && (
                      <div>
                        <span className="text-[11px] text-muted-foreground block">SWIFT Code</span>
                        <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100">{wireData.swift_code}</span>
                      </div>
                    )}
                    {wireData.iban && (
                      <div>
                        <span className="text-[11px] text-muted-foreground block">IBAN</span>
                        <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100">{wireData.iban}</span>
                      </div>
                    )}
                    {wireData.sort_code && (
                      <div>
                        <span className="text-[11px] text-muted-foreground block">Sort Code</span>
                        <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100">{wireData.sort_code}</span>
                      </div>
                    )}
                    {wireData.transit_code_ca && (
                      <div>
                        <span className="text-[11px] text-muted-foreground block">Transit Code</span>
                        <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100">{wireData.transit_code_ca}</span>
                      </div>
                    )}
                    {wireData.institution_code && (
                      <div>
                        <span className="text-[11px] text-muted-foreground block">Institution Code</span>
                        <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100">{wireData.institution_code}</span>
                      </div>
                    )}
                    {wireData.clearing_code && (
                      <div>
                        <span className="text-[11px] text-muted-foreground block">Clearing Code</span>
                        <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100">{wireData.clearing_code}</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="mx-0 mb-0 px-6 py-3 border-t bg-slate-50/80 dark:bg-zinc-900/80 flex items-center justify-between sm:justify-between">
            <div>
              {onEditWireInfo && request && wireData && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsWireInfoOpen(false);
                    onOpenChange(false);
                    onEditWireInfo({ ...request, wire_transfer: wireData } as any);
                  }}
                  className="gap-1.5 text-xs text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50"
                >
                  <Landmark className="h-3.5 w-3.5" />
                  Edit Wire Info
                </Button>
              )}
            </div>
            <Button size="sm" onClick={() => setIsWireInfoOpen(false)} className="text-xs h-8 px-4 font-semibold">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
