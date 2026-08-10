import React from "react";
import { Circle, CheckCircle2, Clock } from "lucide-react";
import { STATUS_LABEL, SPEND_FLOW } from "@/pages/Purchasing/purchasingMeta";
import type { RequestStatus } from "@/types/purchasing";

interface StepperProps {
  /** Ordered list of workflow steps (e.g., ADMIN_FLOW, SPEND_FLOW) */
  flow?: string[];
  /** Current request status string */
  requestStatus: string;
}

/**
 * Premium horizontal stepper component.
 * - Displays all workflow steps cleanly within container bounds.
 * - Flexible connector lines adapt dynamically (flex-1 min-w-[4px]).
 * - Active step highlighted with amber glow, completed steps with green badges.
 */
const Stepper: React.FC<StepperProps> = ({ flow = SPEND_FLOW, requestStatus }) => {
  const safeFlow = Array.isArray(flow) && flow.length > 0 ? flow : SPEND_FLOW;
  
  const normKey = (s: string | undefined | null) => (s || "").toUpperCase().trim().replace(/\s+/g, "_");
  const normStatus = normKey(requestStatus);
  const normFlow = safeFlow.map((s) => normKey(s));

  let currentIndex = normFlow.indexOf(normStatus);

  // Robust fallback mapping if status format or legacy status doesn't match flow directly
  if (currentIndex === -1 && normStatus) {
    if (normStatus === "NEW_REQUEST" || normStatus === "NEW") {
      currentIndex = normFlow.indexOf("NEW") !== -1 ? normFlow.indexOf("NEW") : normFlow.indexOf("NEW_REQUEST");
    } else if (normStatus === "UNDER_REVIEW" || normStatus === "UNDERREVIEW") {
      currentIndex = normFlow.indexOf("UNDER_REVIEW");
    } else if (normStatus === "WAITING_APPROVAL" || normStatus === "WAITING_PAYMENT") {
      currentIndex = normFlow.indexOf("WAITING_APPROVAL") !== -1 ? normFlow.indexOf("WAITING_APPROVAL") : normFlow.indexOf("WAITING_PAYMENT");
    } else if (normStatus === "APPROVED") {
      currentIndex = normFlow.indexOf("APPROVED") !== -1 ? normFlow.indexOf("APPROVED") : normFlow.indexOf("WAITING_PAYMENT");
    } else if (normStatus === "ORDERED" || normStatus === "PURCHASED") {
      currentIndex = normFlow.indexOf("ORDERED") !== -1 ? normFlow.indexOf("ORDERED") : normFlow.indexOf("PURCHASED");
    } else if (normStatus === "SHIPPED") {
      currentIndex = normFlow.indexOf("SHIPPED") !== -1 ? normFlow.indexOf("SHIPPED") : normFlow.indexOf("PURCHASED");
    } else if (normStatus === "INVOICE_RECEIVED") {
      currentIndex = normFlow.indexOf("INVOICE_RECEIVED") !== -1 ? normFlow.indexOf("INVOICE_RECEIVED") : normFlow.indexOf("PURCHASED");
    } else if (normStatus === "SENT_TO_AP") {
      currentIndex = normFlow.indexOf("SENT_TO_AP") !== -1 ? normFlow.indexOf("SENT_TO_AP") : normFlow.indexOf("PURCHASED");
    } else if (normStatus === "PAID") {
      currentIndex = normFlow.indexOf("PAID") !== -1 ? normFlow.indexOf("PAID") : normFlow.indexOf("PURCHASED");
    } else if (normStatus === "COMPLETED") {
      currentIndex = normFlow.indexOf("COMPLETED");
    }
  }

  const isRejected = normStatus === "REJECTED";

  return (
    <div className="w-full py-1">
      <div className="flex items-center justify-between w-full gap-1 sm:gap-1.5">
        {safeFlow.map((step, i) => {
          const key = normKey(step) as RequestStatus;
          const label = STATUS_LABEL[key] ?? step;
          const isDone = !isRejected && currentIndex !== -1 && i < currentIndex;
          const isCurrent = !isRejected && currentIndex !== -1 && i === currentIndex;

          return (
            <React.Fragment key={step}>
              {/* Step Badge */}
              <div className="flex items-center shrink-0">
                <div
                  title={label}
                  className={`flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-medium px-2 sm:px-2.5 py-1.5 rounded-full transition-all duration-200 ${
                    isDone
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
                      : isCurrent
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40 ring-2 ring-amber-500/20 font-semibold shadow-sm"
                      : "bg-slate-100 dark:bg-zinc-800/80 text-slate-500 dark:text-zinc-300 border border-slate-200/50 dark:border-zinc-700/80"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  ) : isCurrent ? (
                    <Clock className="h-3.5 w-3.5 text-amber-500 animate-pulse shrink-0" />
                  ) : (
                    <Circle className="h-3 w-3 text-slate-400 dark:text-zinc-500 shrink-0" />
                  )}
                  <span className="truncate max-w-[65px] sm:max-w-[100px] md:max-w-none">
                    {label}
                  </span>
                </div>
              </div>

              {/* Connector line between steps */}
              {i < safeFlow.length - 1 && (
                <div
                  className={`h-[2px] flex-1 min-w-[4px] rounded-full transition-colors duration-200 ${
                    isDone ? "bg-emerald-500/50 dark:bg-emerald-500/40" : "bg-slate-200 dark:bg-zinc-800"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default Stepper;
