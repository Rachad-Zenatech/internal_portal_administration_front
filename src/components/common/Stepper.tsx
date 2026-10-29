import React from "react";
import { Circle, CheckCircle2, Clock, AlertTriangle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { STATUS_LABEL, SPEND_FLOW } from "@/pages/Purchasing/purchasingMeta";
import { RequestStatus } from "@/types/purchasing";
import { isExceptionStatus, parseRequestStatus, pipelineRank } from "@/lib/requestStatus";

interface StepperProps {
  /** Ordered workflow states (ADMIN_FLOW, SPEND_FLOW, RECURRING_FLOW, QUOTE_FLOW) */
  flow?: readonly RequestStatus[];
  /**
   * Raw status from the API. Parsed once on the way in; every decision below is
   * made on the RequestStatus union, not on characters.
   */
  requestStatus?: string | null;
}

/** How a step is drawn. */
type StepState = "done" | "current" | "pending" | "hold" | "rejected";

interface DisplayStep {
  /** null for a step rendered from an unidentifiable raw status. */
  status: RequestStatus | null;
  label: string;
  state: StepState;
}

function stepStateFor(index: number, activeIndex: number): StepState {
  if (activeIndex === -1) return "pending";
  if (index < activeIndex) return "done";
  if (index === activeIndex) return "current";
  return "pending";
}

function exceptionStateFor(status: RequestStatus | null): StepState {
  return status === RequestStatus.Rejected ? "rejected" : "hold";
}

/**
 * Resolves the steps to draw for a flow and a raw status.
 */
export function resolveSteps(
  flow: readonly RequestStatus[] | undefined,
  requestStatus?: string | null,
): DisplayStep[] {
  const source = flow && flow.length > 0 ? flow : SPEND_FLOW;
  const steps: RequestStatus[] = [...source];

  const status = parseRequestStatus(requestStatus);

  // Absent status → the request sits on the first step.
  let activeIndex = status === null ? 0 : steps.indexOf(status);

  let exception: DisplayStep | null = null;

  if (status !== null && activeIndex === -1) {
    const rank = isExceptionStatus(status) ? null : pipelineRank(status);

    if (rank === null) {
      exception = { status, label: STATUS_LABEL[status], state: exceptionStateFor(status) };
    } else {
      let insertAt = steps.length;
      for (let i = 0; i < steps.length; i++) {
        const r = pipelineRank(steps[i]);
        if (r !== null && r > rank) {
          insertAt = i;
          break;
        }
      }
      steps.splice(insertAt, 0, status);
      activeIndex = insertAt;
    }
  } else if (status === null && requestStatus) {
    exception = { status: null, label: String(requestStatus), state: "hold" };
    activeIndex = -1;
  }

  const rendered: DisplayStep[] = steps.map((step, i) => {
    let state: StepState = exception ? "pending" : stepStateFor(i, activeIndex);
    if (step === RequestStatus.Completed && state === "current") {
      state = "done";
    }
    return {
      status: step,
      label: STATUS_LABEL[step],
      state,
    };
  });

  if (exception) rendered.push(exception);
  return rendered;
}

// Simple visual tokens for each step state
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

/**
 * Responsive horizontal stepper component with uniform step sizing that scales across screen widths.
 */
const Stepper: React.FC<StepperProps> = ({ flow = SPEND_FLOW, requestStatus }) => {
  const steps = resolveSteps(flow, requestStatus);
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
  }, [requestStatus, flow]);

  const scrollBy = (offset: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <div className="relative w-full flex items-center group py-1">
      {/* Left scroll arrow */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollBy(-200)}
          aria-label="Scroll left"
          className="absolute left-1 z-10 flex items-center justify-center h-7 w-7 rounded-full bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 shadow-md border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {/* Left fade hint */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-zinc-900 to-transparent z-5 pointer-events-none rounded-l-xl" />
      )}

      {/* Scrollable / Scalable track */}
      <div
        ref={scrollRef}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        className="w-full overflow-x-auto overflow-y-hidden flex items-center justify-between gap-1 sm:gap-1.5 py-1.5 px-0.5 touch-pan-x scroll-smooth [&::-webkit-scrollbar]:hidden"
      >
        {steps.map((step, i) => {
          const isActive = step.state === "current" || step.state === "hold" || step.state === "rejected";
          return (
            <React.Fragment key={`${step.status ?? "unknown"}-${i}`}>
              {/* Equal-sized step container */}
              <div
                ref={isActive ? activeStepRef : null}
                className="flex items-center shrink-0"
              >
                <div
                  title={step.label}
                  className={`w-max px-3 h-8 sm:h-9 inline-flex items-center justify-center gap-1.5 px-2 rounded-lg text-[11px] sm:text-xs font-medium whitespace-nowrap shrink-0 box-border transition-all duration-200 ${STEP_STYLES[step.state]}`}
                >
                  <StepIcon state={step.state} />
                  <span className="text-center">{step.label}</span>
                </div>
              </div>

              {/* Flexible connector line */}
              {i < steps.length - 1 && (
                <div
                  className={`h-[2px] flex-1 min-w-[10px] sm:min-w-[16px] rounded-full transition-colors duration-200 shrink-0 ${
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
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-zinc-900 to-transparent z-5 pointer-events-none rounded-r-xl" />
      )}

      {/* Right scroll arrow */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollBy(200)}
          aria-label="Scroll right"
          className="absolute right-1 z-10 flex items-center justify-center h-7 w-7 rounded-full bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 shadow-md border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all shrink-0"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default Stepper;


