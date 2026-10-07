import React from "react";
import { Circle, CheckCircle2, Clock, AlertTriangle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";

export interface InvoiceStepperData {
  invoice_number?: string;
  status?: string;
  total_amount?: number;
  amount_paid?: number;
  balance_due?: number;
  due_date?: string;
  is_sent?: boolean;
}

interface InvoiceStepperProps {
  invoice: InvoiceStepperData;
  className?: string;
}

type StepState = "done" | "current" | "pending" | "hold" | "rejected";

interface DisplayStep {
  key: string;
  label: string;
  state: StepState;
}

const STEP_STYLES: Record<StepState, string> = {
  done: "bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400",
  current:
    "bg-amber-500/15 text-amber-800 border-2 border-amber-500 dark:bg-amber-500/25 dark:text-amber-300 font-semibold shadow-xs",
  pending:
    "bg-slate-100/80 text-slate-500 border border-slate-200/80 dark:bg-zinc-800/80 dark:text-zinc-400 dark:border-zinc-700/60",
  hold: "bg-orange-500/15 text-orange-800 border-2 border-orange-500 dark:bg-orange-500/25 dark:text-orange-300 font-semibold",
  rejected:
    "bg-red-500/15 text-red-800 border-2 border-red-500 dark:bg-red-500/25 dark:text-red-300 font-semibold",
};

const StepIcon: React.FC<{ state: StepState }> = ({ state }) => {
  switch (state) {
    case "done":
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />;
    case "current":
      return <Clock className="h-3.5 w-3.5 text-amber-500 animate-pulse shrink-0" />;
    case "hold":
      return <AlertTriangle className="h-3.5 w-3.5 text-orange-500 shrink-0" />;
    case "rejected":
      return <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />;
    case "pending":
      return <Circle className="h-3 w-3 text-slate-400 dark:text-zinc-500 shrink-0" />;
  }
};

export function resolveInvoiceSteps(invoice: InvoiceStepperData): DisplayStep[] {
  const rawStatus = (invoice.status || "").toUpperCase();
  const isPaid =
    rawStatus.startsWith("PAID") ||
    (invoice.balance_due === 0 && (invoice.amount_paid || 0) > 0 && (invoice.total_amount || 0) > 0);
  const isPartiallyPaid = rawStatus === "PARTIALLY_PAID" || (!isPaid && (invoice.amount_paid || 0) > 0);
  const isOverdue = rawStatus === "OVERDUE";
  const isDraft = rawStatus === "DRAFT";
  const isCancelled = rawStatus === "CANCELLED" || rawStatus === "VOID";

  if (isCancelled) {
    return [
      { key: "created", label: "Invoice Created", state: "done" },
      { key: "cancelled", label: `Invoice ${rawStatus}`, state: "rejected" },
    ];
  }

  // 1. Created & Drafted
  const createdState: StepState = !isDraft ? "done" : "current";

  // 2. Issued
  let issuedState: StepState = "pending";
  if (!isDraft) {
    issuedState = "done";
  }

  // 3. Sent to Customer
  let sentState: StepState = "pending";
  if (isPaid || isPartiallyPaid) {
    sentState = "done";
  } else if (!isDraft) {
    sentState = invoice.is_sent ? "done" : "current";
  }

  // 4. Awaiting Payment
  let awaitingState: StepState = "pending";
  if (isPaid) {
    awaitingState = "done";
  } else if (isOverdue) {
    awaitingState = "hold";
  } else if (isPartiallyPaid) {
    awaitingState = "current";
  } else if (!isDraft) {
    awaitingState = "current";
  }

  // 5. Payment Settled
  let paymentState: StepState = "pending";
  if (isPaid) {
    paymentState = "done";
  }

  return [
    { key: "created", label: "Invoice Created", state: createdState },
    { key: "issued", label: "Invoice Issued", state: issuedState },
    { key: "sent", label: "Sent to Customer", state: sentState },
    {
      key: "awaiting",
      label: isOverdue ? "Payment Overdue" : isPartiallyPaid ? "Partially Paid" : "Awaiting Payment",
      state: awaitingState,
    },
    {
      key: "settled",
      label: rawStatus === "PAID (PRORATED)" ? "Paid (Prorated)" : "Payment Settled",
      state: paymentState,
    },
  ];
}

export const InvoiceStepper: React.FC<InvoiceStepperProps> = ({ invoice, className = "" }) => {
  const steps = resolveInvoiceSteps(invoice);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const activeStepRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const checkScroll = React.useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 2);
  }, []);

  React.useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, steps]);

  React.useEffect(() => {
    if (activeStepRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const element = activeStepRef.current;
      const elemLeft = element.offsetLeft;
      const elemWidth = element.offsetWidth;
      const containerWidth = container.clientWidth;
      const scrollPos = elemLeft - containerWidth / 2 + elemWidth / 2;
      container.scrollTo({ left: Math.max(0, scrollPos), behavior: "smooth" });
    }
  }, [steps]);

  const scrollByAmount = (offset: number) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  return (
    <div className={`relative flex items-center group/stepper ${className}`}>
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollByAmount(-180)}
          className="absolute -left-2 z-10 p-1 rounded-full bg-card/90 dark:bg-zinc-800/90 border border-slate-200 dark:border-zinc-700 shadow-sm text-slate-600 dark:text-zinc-300 hover:text-foreground cursor-pointer transition-all backdrop-blur-xs"
          title="Scroll Left"
          aria-label="Scroll Left"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
      )}

      <div
        ref={scrollRef}
        className="w-full flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none scroll-smooth px-0.5"
      >
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          const isCurrent = step.state === "current" || step.state === "hold";
          const isDone = step.state === "done";

          return (
            <React.Fragment key={step.key}>
              <div
                ref={isCurrent ? activeStepRef : null}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs shrink-0 select-none transition-all duration-200 ${
                  STEP_STYLES[step.state]
                }`}
              >
                <StepIcon state={step.state} />
                <span className="whitespace-nowrap">{step.label}</span>
              </div>

              {!isLast && (
                <div
                  className={`h-0.5 w-4 sm:w-6 shrink-0 rounded-full transition-colors duration-200 ${
                    isDone
                      ? "bg-emerald-500/40 dark:bg-emerald-500/50"
                      : "bg-slate-200/80 dark:bg-zinc-700/60"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollByAmount(180)}
          className="absolute -right-2 z-10 p-1 rounded-full bg-card/90 dark:bg-zinc-800/90 border border-slate-200 dark:border-zinc-700 shadow-sm text-slate-600 dark:text-zinc-300 hover:text-foreground cursor-pointer transition-all backdrop-blur-xs"
          title="Scroll Right"
          aria-label="Scroll Right"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};

export default InvoiceStepper;
