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
  topTag?: string;
  subSteps?: DisplaySubStep[];
}

export const STEP_STYLES: Record<StepState, string> = {
  done: "bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400 font-medium",
  current:
    "bg-amber-500/15 text-amber-800 border-2 border-amber-500 dark:bg-amber-500/25 dark:text-amber-300 font-semibold shadow-xs",
  pending:
    "bg-slate-100/80 text-slate-500 border border-slate-200/80 dark:bg-zinc-800/80 dark:text-zinc-400 dark:border-zinc-700/60 font-medium",
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
        className="flex flex-col gap-1.5 items-center justify-center shrink-0 py-0.5"
      >
        {step.subSteps.map((sub, sIdx) => (
          <div
            key={sIdx}
            title={sub.label}
            className={`w-max px-3 h-8 sm:h-9 inline-flex items-center justify-center gap-1.5 rounded-lg text-[11px] sm:text-xs font-medium whitespace-nowrap shrink-0 box-border transition-all duration-200 ${STEP_STYLES[sub.state]}`}
          >
            <StepIcon state={sub.state} />
            <span className="text-center">{sub.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={isActive ? activeRef : null}
      className="flex flex-col items-center shrink-0"
    >
      {step.topTag && (
        <span className="mb-1 px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wide bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800/60 leading-none">
          {step.topTag}
        </span>
      )}
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
