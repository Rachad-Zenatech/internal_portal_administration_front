import React from "react";
import { Circle, CheckCircle2, Clock, AlertTriangle, XCircle } from "lucide-react";
import { RequestStatus } from "@/types/purchasing";

export type StepState = "done" | "current" | "pending" | "hold" | "rejected";

export interface DisplaySubStep {
  status: RequestStatus;
  label: string;
  state: StepState;
}

export interface DisplayStep {
  status: RequestStatus | null;
  label: string;
  state: StepState;
  subSteps?: DisplaySubStep[];
}

export const STEP_STYLES: Record<StepState, string> = {
  done: "bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400",
  current:
    "bg-amber-500/15 text-amber-800 border-2 border-amber-500 dark:bg-amber-500/25 dark:text-amber-300 font-semibold shadow-xs",
  pending:
    "bg-slate-100/80 text-slate-500 border border-slate-200/80 dark:bg-zinc-800/80 dark:text-zinc-400 dark:border-zinc-700/60",
  hold: "bg-orange-500/15 text-orange-800 border-2 border-orange-500 dark:bg-orange-500/25 dark:text-orange-300 font-semibold",
  rejected:
    "bg-red-500/15 text-red-800 border-2 border-red-500 dark:bg-red-500/25 dark:text-red-300 font-semibold",
};

export const StepIcon: React.FC<{ state: StepState; size?: "sm" | "md" }> = ({ state, size = "md" }) => {
  const iconClass = size === "sm" ? "h-3 w-3 shrink-0" : "h-3.5 w-3.5 shrink-0";
  switch (state) {
    case "done":
      return <CheckCircle2 className={`${iconClass} text-emerald-500`} />;
    case "current":
      return <Clock className={`${iconClass} text-amber-500 animate-pulse`} />;
    case "hold":
      return <AlertTriangle className={`${iconClass} text-orange-500`} />;
    case "rejected":
      return <XCircle className={`${iconClass} text-red-500`} />;
    case "pending":
      return <Circle className={`${size === "sm" ? "h-2 w-2" : "h-3 w-3"} text-slate-400 dark:text-zinc-500 shrink-0`} />;
  }
};

interface StepperStepNodeProps {
  step: DisplayStep;
  isActive: boolean;
  activeRef: React.RefObject<HTMLDivElement | null>;
}

export function StepperStepNode({ step, isActive, activeRef }: StepperStepNodeProps) {
  if (step.subSteps && step.subSteps.length > 0) {
    return (
      <div
        ref={isActive ? activeRef : null}
        className="flex items-center shrink-0"
      >
        <div
          title={step.label}
          className={`flex flex-col gap-1 px-2.5 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-medium shrink-0 box-border transition-all duration-200 border ${
            step.state === "current"
              ? "bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-200 shadow-xs"
              : step.state === "done"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
              : "bg-slate-100/80 border-slate-200/80 text-slate-500 dark:bg-zinc-800/80 dark:border-zinc-700/60 dark:text-zinc-400"
          }`}
        >
          <div className="flex items-center justify-between gap-2 border-b border-border/30 pb-0.5 text-[9px] uppercase tracking-wider font-semibold opacity-75">
            <span>3-Way Match</span>
            <StepIcon state={step.state} size="sm" />
          </div>
          <div className="flex flex-col gap-0.5">
            {step.subSteps.map((sub, sIdx) => (
              <div key={sIdx} className="flex items-center gap-1.5 whitespace-nowrap">
                <StepIcon state={sub.state} size="sm" />
                <span className={sub.state === "current" ? "font-semibold underline decoration-amber-500" : ""}>
                  {sub.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={isActive ? activeRef : null}
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
  );
}
