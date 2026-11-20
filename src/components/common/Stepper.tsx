import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { STATUS_LABEL, SPEND_FLOW } from "@/pages/Purchasing/utils/purchasingMeta";
import { RequestStatus } from "@/types/purchasing";
import { isExceptionStatus, parseRequestStatus, pipelineRank } from "@/lib/requestStatus";
import {
  StepperStepNode,
  type DisplayStep,
  type DisplaySubStep,
  type StepState,
  STEP_STYLES,
  StepIcon,
} from "./StepperStepNode";

export type { DisplayStep, DisplaySubStep, StepState };
export { STEP_STYLES, StepIcon, StepperStepNode };

interface StepperProps {
  /** Ordered workflow states (ADMIN_FLOW, SPEND_FLOW, RECURRING_FLOW, QUOTE_FLOW) */
  flow?: readonly RequestStatus[];
  /**
   * Raw status from the API. Parsed once on the way in; every decision below is
   * made on the RequestStatus union, not on characters.
   */
  requestStatus?: string | null;
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

  // Absent status -> the request sits on the first step.
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

  // Check if this flow has the 3 AP matching steps: Approved, GoodsReceived, InvoiceReceived
  const appIdx = steps.indexOf(RequestStatus.Approved);
  const grIdx = steps.indexOf(RequestStatus.GoodsReceived);
  const irIdx = steps.indexOf(RequestStatus.InvoiceReceived);
  const hasThreeWayCluster = appIdx !== -1 && grIdx === appIdx + 1 && irIdx === grIdx + 1;

  if (hasThreeWayCluster) {
    const rendered: DisplayStep[] = [];
    for (let i = 0; i < steps.length; i++) {
      if (i === appIdx) {
        const clusterState: StepState =
          exception ? "pending" :
          activeIndex > irIdx ? "done" :
          activeIndex >= appIdx && activeIndex <= irIdx ? "current" : "pending";

        const subSteps: DisplaySubStep[] = [
          {
            status: RequestStatus.Approved,
            label: "Approved PO",
            state: exception ? "pending" : stepStateFor(appIdx, activeIndex),
          },
          {
            status: RequestStatus.GoodsReceived,
            label: "Goods / Service Confirmed",
            state: exception ? "pending" : stepStateFor(grIdx, activeIndex),
          },
          {
            status: RequestStatus.InvoiceReceived,
            label: "Vendor Invoice",
            state: exception ? "pending" : stepStateFor(irIdx, activeIndex),
          },
        ];

        rendered.push({
          status: RequestStatus.Approved,
          label: "3-Way Match",
          state: clusterState,
          subSteps,
        });

        i = irIdx;
      } else {
        let state: StepState = exception ? "pending" : stepStateFor(i, activeIndex);
        if (steps[i] === RequestStatus.Completed && state === "current") {
          state = "done";
        }
        rendered.push({
          status: steps[i],
          label: STATUS_LABEL[steps[i]],
          state,
        });
      }
    }
    if (exception) rendered.push(exception);
    return rendered;
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

      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-zinc-900 to-transparent z-5 pointer-events-none rounded-l-xl" />
      )}

      <div
        ref={scrollRef}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        className="w-full overflow-x-auto overflow-y-hidden flex items-center justify-between gap-1 sm:gap-1.5 py-1.5 px-0.5 touch-pan-x scroll-smooth [&::-webkit-scrollbar]:hidden"
      >
        {steps.map((step, i) => {
          const isActive = step.state === "current" || step.state === "hold" || step.state === "rejected";
          return (
            <React.Fragment key={`${step.status ?? "unknown"}-${i}`}>
              <StepperStepNode step={step} isActive={isActive} activeRef={activeStepRef} />

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

      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-zinc-900 to-transparent z-5 pointer-events-none rounded-r-xl" />
      )}

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
