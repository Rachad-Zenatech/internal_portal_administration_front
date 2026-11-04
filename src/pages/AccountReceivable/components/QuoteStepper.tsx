import React from "react";
import { Circle, CheckCircle2, Clock, AlertTriangle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import type { ARQuote } from "@/services/arQuoteService";

interface QuoteStepperProps {
  quote: ARQuote;
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

export function resolveQuoteSteps(quote: ARQuote): DisplayStep[] {
  const isSigned = quote.customer_response_state === "SIGNED";
  const isChanges = quote.customer_response_state === "CHANGES_REQUESTED";
  const isSuperseded = quote.publication_state === "DISABLED" || quote.customer_response_state === "SUPERSEDED" || !!quote.superseded_by_id;
  const isPublished = quote.publication_state === "PUBLISHED" && !isSuperseded;
  const isDraft = quote.publication_state === "DRAFT" && !isSuperseded;
  const hasInvoice = !!quote.invoice_id;
  const isPaid = quote.payment_status === "PAID";

  if (isSuperseded) {
    return [
      { key: "draft", label: "Draft", state: "done" },
      { key: "disabled", label: `Version Disabled (Superseded)`, state: "rejected" },
    ];
  }

  // 1. Draft
  const draftState: StepState = !isDraft ? "done" : "current";

  // 2. Published & Sent
  let publishState: StepState = "pending";
  if ((quote.active_links_count || 0) > 0 || !!quote.last_viewed_at || isSigned || isChanges || hasInvoice || isPaid) {
    publishState = "done";
  } else if (isPublished) {
    publishState = "current";
  }

  // 3. Customer Review
  let reviewState: StepState = "pending";
  if (isSigned || hasInvoice || isPaid) {
    reviewState = "done";
  } else if (isChanges) {
    reviewState = "hold";
  } else if (isPublished && ((quote.active_links_count || 0) > 0 || !!quote.last_viewed_at)) {
    reviewState = "current";
  }

  // 4. Accepted & Signed
  let signedState: StepState = "pending";
  if (hasInvoice || isPaid) {
    signedState = "done";
  } else if (isSigned) {
    signedState = "done";
  }

  // 5. Invoice Generated
  let invoiceState: StepState = "pending";
  if (isPaid) {
    invoiceState = "done";
  } else if (hasInvoice) {
    invoiceState = "current";
  } else if (isSigned) {
    invoiceState = "current";
  }

  // 6. Payment Settled
  let paymentState: StepState = "pending";
  if (isPaid) {
    paymentState = "done";
  } else if (hasInvoice) {
    paymentState = "pending";
  }

  return [
    { key: "draft", label: "Draft", state: draftState },
    { key: "publish", label: "Published & Sent", state: publishState },
    {
      key: "review",
      label: isChanges ? "Changes Requested" : "Customer Review",
      state: reviewState,
    },
    { key: "signed", label: "Accepted & Signed", state: signedState },
    { key: "invoice", label: "Invoice Generated", state: invoiceState },
    { key: "payment", label: "Payment Settled", state: paymentState },
  ];
}

export const QuoteStepper: React.FC<QuoteStepperProps> = ({ quote, className = "" }) => {
  const steps = resolveQuoteSteps(quote);
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
      const elementRect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      if (elementRect.left < containerRect.left || elementRect.right > containerRect.right) {
        const scrollLeft = element.offsetLeft - container.offsetWidth / 2 + element.offsetWidth / 2;
        container.scrollTo({ left: Math.max(0, scrollLeft), behavior: "smooth" });
      }
    }
  }, [quote]);

  const scrollBy = (offset: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <div className={`relative w-full flex items-center group py-1 ${className}`}>
      {/* Left scroll arrow */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollBy(-200)}
          aria-label="Scroll left"
          className="absolute left-1 z-10 flex items-center justify-center h-7 w-7 rounded-full bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 shadow-md border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all shrink-0 cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {/* Left fade hint */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-slate-900 to-transparent z-5 pointer-events-none rounded-l-xl" />
      )}

      {/* Scrollable track */}
      <div
        ref={scrollRef}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        className="w-full overflow-x-auto overflow-y-hidden flex items-center justify-between gap-1 sm:gap-2 py-1.5 px-0.5 touch-pan-x scroll-smooth [&::-webkit-scrollbar]:hidden"
      >
        {steps.map((step, i) => {
          const isActive = step.state === "current" || step.state === "hold" || step.state === "rejected";
          return (
            <React.Fragment key={`${step.key}-${i}`}>
              {/* Equal-sized step container */}
              <div
                ref={isActive ? activeStepRef : null}
                className="flex items-center shrink-0"
              >
                <div
                  title={step.label}
                  className={`w-max px-3 h-8 sm:h-9 inline-flex items-center justify-center gap-1.5 rounded-lg text-[11px] sm:text-xs font-medium whitespace-nowrap shrink-0 box-border transition-all duration-200 ${STEP_STYLES[step.state]}`}
                >
                  <StepIcon state={step.state} />
                  <span className="text-center">{step.label}</span>
                </div>
              </div>

              {/* Flexible connector line */}
              {i < steps.length - 1 && (
                <div
                  className={`h-[2px] flex-1 min-w-[12px] sm:min-w-[20px] rounded-full transition-colors duration-200 shrink-0 ${
                    step.state === "done"
                      ? "bg-emerald-500/60 dark:bg-emerald-500/40"
                      : "bg-slate-200 dark:bg-zinc-700/80"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Right fade hint */}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-slate-900 to-transparent z-5 pointer-events-none rounded-r-xl" />
      )}

      {/* Right scroll arrow */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollBy(200)}
          aria-label="Scroll right"
          className="absolute right-1 z-10 flex items-center justify-center h-7 w-7 rounded-full bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 shadow-md border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all shrink-0 cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default QuoteStepper;
