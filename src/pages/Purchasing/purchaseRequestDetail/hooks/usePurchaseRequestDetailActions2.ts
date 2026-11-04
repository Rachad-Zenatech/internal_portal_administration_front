import { RequestStatus, type FrequencyType } from "@/types/purchasing";
import { parseRequestStatus } from "@/lib/requestStatus";
import { formatDate } from "../../utils/purchasingMeta";
import { formatRemainingDuration, calculateInstallmentsCount, generatePaymentSchedule, type ProjectedInstallment } from "../../utils/recurringScheduleUtils";
import type { PurchaseRequestDetailGuardedState } from "./usePurchaseRequestDetail";

export function usePurchaseRequestDetailActions2(ctx: PurchaseRequestDetailGuardedState) {
  const { request, invoice, setIsRecordInvoiceOpen, setInvoiceFiles, setInvoiceForm, setSelectedInstallment } = ctx;
  const sched = request.recurring_schedule || {
    is_scheduled: false,
    frequency: "MONTHLY" as FrequencyType,
    start_date: request.due_date ? String(request.due_date).split("T")[0] : String(request.request_date).split("T")[0],
    end_date: null,
    total_installments: null,
    completed_installments: 0,
    amount_per_cycle: request.amount || 0,
    total_amount: null,
  };
  const isReviewed = request.review_status === "REVIEWED";
  const parsedStatus = parseRequestStatus(request.status);
  const effectiveCompletedInstallments = Math.max(
    sched.completed_installments || 0,
    invoice ? 1 : 0
  );
  const completedCount = sched.completed_installments || 0;
  const isCustomMilestones = sched.frequency === "CUSTOM" || Boolean(sched.schedule_dates?.length);
  const activeMilestoneIndex = sched.schedule_dates && sched.schedule_dates.length > 0
    ? (completedCount < sched.schedule_dates.length ? completedCount : sched.schedule_dates.length - 1)
    : 0;
  const currentMilestoneDate = sched.schedule_dates?.[activeMilestoneIndex];
  const currentCycleAmount = isCustomMilestones && currentMilestoneDate?.amount != null && Number(currentMilestoneDate.amount) > 0
    ? Number(currentMilestoneDate.amount)
    : (sched.amount_per_cycle != null && Number(sched.amount_per_cycle) > 0
        ? Number(sched.amount_per_cycle)
        : (request.amount || 0));
  const durationInfo = isCustomMilestones
    ? { text: `${sched.schedule_dates?.length || 0} Custom Milestone Dates`, isExpired: false, isNearEnd: false, totalDays: 0 }
    : formatRemainingDuration(sched.end_date, sched.start_date);
  const isOngoing = !sched.total_installments && !sched.end_date && !isCustomMilestones;
  const totalCommitment = sched.total_amount != null
    ? sched.total_amount
    : (sched.schedule_dates && sched.schedule_dates.length > 0
        ? sched.schedule_dates.reduce((s: number, it: any) => s + (Number(it.amount) || 0), 0)
        : (sched.total_installments
            ? sched.total_installments * currentCycleAmount
            : (sched.end_date && !isCustomMilestones
                ? calculateInstallmentsCount(sched.start_date, sched.end_date, sched.frequency) * currentCycleAmount
                : null)));
  const effectiveTotalCycles = sched.total_installments
    || (sched.end_date && !isCustomMilestones ? calculateInstallmentsCount(sched.start_date, sched.end_date, sched.frequency) : null)
    || (isCustomMilestones ? sched.schedule_dates?.length : null);
  const paidToDate = (sched.schedule_dates && sched.schedule_dates.length > 0)
    ? sched.schedule_dates.slice(0, effectiveCompletedInstallments).reduce((s: number, it: any) => s + (Number(it.amount) || 0), 0)
    : effectiveCompletedInstallments * currentCycleAmount;
  const currentCycle = effectiveCompletedInstallments + 1;
  const totalCycles = effectiveTotalCycles;
  const allCyclesCompleted = Boolean(
    totalCycles && effectiveCompletedInstallments >= totalCycles
  );
  const cycleBracket = parsedStatus === RequestStatus.Completed
    ? (totalCycles ? ` (${totalCycles}/${totalCycles} Cycles)` : ` (${effectiveCompletedInstallments} Cycles Completed)`)
    : (totalCycles ? ` (Cycle ${Math.min(currentCycle, totalCycles)}/${totalCycles})` : ` (Cycle ${currentCycle} - Ongoing)`);
  // Generate the full payment installments schedule
  const allInstallments: ProjectedInstallment[] = generatePaymentSchedule(
    { ...sched, completed_installments: effectiveCompletedInstallments },
    request.amount,
    request.currency || "USD",
    request.status,
    request.due_date || request.request_date
  );
  const handleOpenRecordPayment = (inst?: ProjectedInstallment) => {
    setSelectedInstallment(inst || null);
    const instAmt = inst?.amount != null && inst.amount > 0 ? inst.amount : (request?.amount || 0);
    const instDate = inst?.dueDate || (request?.due_date ? String(request.due_date).split("T")[0] : new Date().toISOString().split("T")[0]);
    const instNum = inst?.installmentNumber || currentCycle;

    const rawInterest = inst?.interest != null ? String(inst.interest) : ((request?.quote_data as any)?.interest != null ? String((request?.quote_data as any).interest) : "");
    const rawPrincipal = inst?.principal_paid != null ? String(inst.principal_paid) : ((request?.quote_data as any)?.principal_paid != null ? String((request?.quote_data as any).principal_paid) : "");
    const rawBalance = inst?.balance != null ? String(inst.balance) : ((request?.quote_data as any)?.balance != null ? String((request?.quote_data as any).balance) : ((request?.quote_data as any)?.remaining_balance != null ? String((request?.quote_data as any).remaining_balance) : ""));

    setInvoiceForm({
      vendor: invoice?.vendor || request?.title || "",
      amount: instAmt.toString(),
      invoice_date: instDate,
      due_date: instDate,
      bank_account: (request as any)?.bank_account || invoice?.bank_account || "",
      gl_code: request?.gl_code || invoice?.gl_code || "",
      department: request?.department || "General",
      from_location: (request as any)?.from_location || "USA",
      asset_flag: Boolean(request?.request_type === "SCHEDULED_PAYMENT" || request?.request_type === "RECURRING" || invoice?.asset_flag),
      description: `Payment for Installment #${instNum} (${formatDate(instDate)}) - ${request?.title || ""}`,
      interest: rawInterest,
      principal_paid: rawPrincipal,
      balance: rawBalance,
      actual_cost_after_tax: "",
    });
    setInvoiceFiles([]);
    setIsRecordInvoiceOpen(true);
  };
  const isOnHold = parsedStatus === RequestStatus.OnHold;
  const canPutOnHold = parsedStatus !== RequestStatus.Initial &&
                       parsedStatus !== RequestStatus.New &&
                       parsedStatus !== RequestStatus.UnderReview &&
                       parsedStatus !== RequestStatus.Completed &&
                       parsedStatus !== RequestStatus.Rejected &&
                       !isOnHold;
  // Workflow steps for Recurring Requests
  const workflowSteps = [
    { key: RequestStatus.UnderReview, label: "Under Review" },
    { key: RequestStatus.WaitingPayment, label: `Waiting Payment ${cycleBracket}` },
    { key: RequestStatus.Completed, label: "Completed" },
  ];
  const currentStepIndex = workflowSteps.findIndex((s) => s.key === parsedStatus);
  return { sched, isReviewed, parsedStatus, isCustomMilestones, currentCycleAmount, durationInfo, isOngoing, totalCommitment, paidToDate, currentCycle, totalCycles, allCyclesCompleted, cycleBracket, allInstallments, handleOpenRecordPayment, isOnHold, canPutOnHold, workflowSteps, currentStepIndex };
}
