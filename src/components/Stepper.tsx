import React from "react";
import { Circle, CheckCircle2, Clock, AlertTriangle, XCircle } from "lucide-react";
import { STATUS_LABEL, SPEND_FLOW } from "@/pages/Purchasing/purchasingMeta";

interface StepperProps {
  /** Ordered list of workflow steps (ADMIN_FLOW, SPEND_FLOW, RECURRING_FLOW, QUOTE_FLOW) */
  flow?: string[];
  /** Current request status string (may be missing on freshly created requests) */
  requestStatus?: string | null;
}

/** Legacy / backend aliases mapped onto the canonical statuses used by the flows. */
const STATUS_ALIASES: Record<string, string> = {
  NEW_REQUEST: "NEW",
  NEW_PURCHASE_REQUEST: "NEW",
  NEW_SPEND: "NEW",
  UNDERREVIEW: "UNDER_REVIEW",
  IN_REVIEW: "UNDER_REVIEW",
  PENDING_APPROVAL: "WAITING_APPROVAL",
  AWAITING_APPROVAL: "WAITING_APPROVAL",
  APPROVE: "APPROVED",
  REJECT: "REJECTED",
  SENT_TO_AP: "WAITING_PAYMENT",
  PENDING_PAYMENT: "WAITING_PAYMENT",
  AP_PENDING: "WAITING_PAYMENT",
  ORDERED: "PURCHASED",
  ORDER_PLACED: "PURCHASED",
  IN_TRANSIT: "SHIPPED",
  RECEIVED: "GOODS_RECEIVED",
  ITEMS_RECEIVED: "GOODS_RECEIVED",
  INVOICE_RECORDED: "INVOICE_RECEIVED",
  CLOSED: "COMPLETED",
  FINALISED: "COMPLETED",
  FINALIZED: "COMPLETED",
  HOLD: "ON_HOLD",
  PAUSED: "ON_HOLD",
};

/**
 * Global progress order, used to place a status that is not part of the request's
 * own flow — an ADMIN request that reached WAITING_APPROVAL, a QUOTE request with
 * an invoice. A status present in the flow always uses its own position instead,
 * so flow-local ordering (SPEND_FLOW pays before it purchases) still wins.
 */
const STATUS_RANK: Record<string, number> = {
  NEW: 0,
  UNDER_REVIEW: 1,
  WAITING_APPROVAL: 2,
  APPROVED: 3,
  PURCHASED: 4,
  SHIPPED: 5,
  GOODS_RECEIVED: 6,
  INVOICE_RECEIVED: 7,
  WAITING_PAYMENT: 8,
  COMPLETED: 9,
};

/** Statuses that sit outside the happy path and carry no position in the flow. */
const EXCEPTION_STATUSES = new Set(["REJECTED", "ON_HOLD"]);

/**
 * Substring fallback mirroring `map_db_status` in the backend's purchasing_service,
 * including its precedence. Rows are stored with display spellings in places
 * ("Ordered / Purchased", "Waiting Approval"), so exact keys are not enough.
 * Order matters — keep it in sync with the backend.
 */
const LOOSE_MATCHERS: ReadonlyArray<readonly [string, string]> = [
  ["HOLD", "ON_HOLD"],
  ["INVOICE RECEIVED", "INVOICE_RECEIVED"],
  ["GOODS", "GOODS_RECEIVED"],
  ["UNDER REVIEW", "UNDER_REVIEW"],
  ["WAITING APPROVAL", "WAITING_APPROVAL"],
  ["WAITING PAYMENT", "WAITING_PAYMENT"],
  ["SENT TO AP", "WAITING_PAYMENT"],
  ["PURCHASED", "PURCHASED"],
  ["ORDERED", "PURCHASED"],
  ["SHIPPED", "SHIPPED"],
  ["APPROVED", "APPROVED"],
  ["REJECTED", "REJECTED"],
  ["NEW", "NEW"],
  ["COMPLETED", "COMPLETED"],
];

const looseMatch = (raw: string): string | null => {
  const s = raw.replace(/_/g, " ");
  for (const [needle, status] of LOOSE_MATCHERS) {
    if (s.includes(needle)) return status;
  }
  return null;
};

const normKey = (s: unknown): string => {
  if (!s) return "";
  let val: unknown = s;
  if (typeof s === "object") {
    const rec = s as Record<string, unknown>;
    val = rec.value ?? rec.status ?? rec.name ?? String(s);
  }
  return String(val).toUpperCase().trim().replace(/\s+/g, "_");
};

type StepState = "done" | "current" | "pending" | "hold" | "rejected";

interface DisplayStep {
  key: string;
  label: string;
  state: StepState;
}

/**
 * Resolves the rendered steps for a flow + status pair.
 *
 * Rules:
 * - The supplied flow is always the flow that gets rendered; an unrecognised
 *   status never swaps it out for another one.
 * - A status that belongs to the flow marks everything before it as done.
 * - A status outside the flow (an ADMIN request awaiting approval, a QUOTE
 *   request with an invoice) is spliced in at its rank position so progress stays
 *   readable instead of collapsing to step 0.
 * - REJECTED / ON_HOLD / unknown statuses are appended as an exception chip.
 */
export function resolveSteps(flow: string[] | undefined, requestStatus?: string | null): DisplayStep[] {
  const source = Array.isArray(flow) && flow.length > 0 ? flow : SPEND_FLOW;
  const steps = source.map(normKey).filter(Boolean);

  const raw = normKey(requestStatus);
  let canonical = STATUS_ALIASES[raw] ?? raw;
  const label = (key: string) => STATUS_LABEL[key] ?? STATUS_LABEL[raw] ?? (requestStatus ? String(requestStatus) : key);

  // No status yet → the request sits on the first step.
  let activeIndex = canonical ? steps.indexOf(canonical) : 0;

  // Still unrecognised: fall back to the backend's substring matching, which
  // covers display spellings such as "Ordered / Purchased". Runs only after the
  // exact lookups fail, so custom flow keys are never matched away.
  if (activeIndex === -1 && !EXCEPTION_STATUSES.has(canonical) && STATUS_RANK[canonical] === undefined) {
    const loose = looseMatch(raw);
    if (loose) {
      canonical = loose;
      activeIndex = steps.indexOf(canonical);
    }
  }

  let exception: DisplayStep | null = null;

  if (activeIndex === -1) {
    if (EXCEPTION_STATUSES.has(canonical)) {
      exception = {
        key: canonical,
        label: label(canonical),
        state: canonical === "REJECTED" ? "rejected" : "hold",
      };
    } else if (STATUS_RANK[canonical] !== undefined) {
      // Off-flow but comparable: splice it in at its position in the pipeline.
      const rank = STATUS_RANK[canonical];
      let insertAt = steps.length;
      for (let i = 0; i < steps.length; i++) {
        const r = STATUS_RANK[steps[i]];
        if (r !== undefined && r > rank) {
          insertAt = i;
          break;
        }
      }
      steps.splice(insertAt, 0, canonical);
      activeIndex = insertAt;
    } else {
      // Unknown status: show it rather than silently pretending it is step 0.
      exception = { key: canonical, label: label(canonical), state: "hold" };
    }
  }

  const rendered: DisplayStep[] = steps.map((key, i) => ({
    key,
    label: STATUS_LABEL[key] ?? key,
    state: exception ? "pending" : i < activeIndex ? "done" : i === activeIndex ? "current" : "pending",
  }));

  if (exception) rendered.push(exception);
  return rendered;
}

const STEP_STYLES: Record<StepState, string> = {
  done: "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/30",
  current:
    "bg-amber-500/15 text-amber-600 dark:bg-amber-500/25 dark:text-amber-400 border border-amber-500/40 ring-2 ring-amber-500/20 font-semibold shadow-sm",
  pending:
    "bg-slate-100 dark:bg-zinc-800/80 text-slate-500 dark:text-zinc-300 border border-slate-200/50 dark:border-zinc-700/80",
  hold: "bg-orange-500/15 text-orange-600 dark:bg-orange-500/25 dark:text-orange-400 border border-orange-500/40 font-semibold",
  rejected:
    "bg-red-500/15 text-red-600 dark:bg-red-500/25 dark:text-red-400 border border-red-500/40 font-semibold",
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
    default:
      return <Circle className="h-3 w-3 text-slate-400 dark:text-zinc-500 shrink-0" />;
  }
};

/**
 * Premium horizontal stepper component.
 * - Displays all workflow steps cleanly within container bounds.
 * - Flexible connector lines adapt dynamically (flex-1 min-w-[8px]).
 * - Active step highlighted with amber glow, completed steps with green badges.
 */
const Stepper: React.FC<StepperProps> = ({ flow = SPEND_FLOW, requestStatus }) => {
  const steps = resolveSteps(flow, requestStatus);

  return (
    <div className="w-full py-1 overflow-x-auto">
      <div
        className="flex items-center w-full gap-1 sm:gap-1.5"
        style={{ minWidth: steps.length > 6 ? `${steps.length * 120}px` : undefined }}
      >
        {steps.map((step, i) => (
          <React.Fragment key={`${step.key}-${i}`}>
            {/* Step Badge */}
            <div className="flex items-center shrink-0">
              <div
                title={step.label}
                className={`flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-medium px-2 sm:px-2.5 py-1.5 rounded-full whitespace-nowrap transition-all duration-200 ${STEP_STYLES[step.state]}`}
              >
                <StepIcon state={step.state} />
                <span className="whitespace-nowrap">{step.label}</span>
              </div>
            </div>

            {/* Connector line between steps */}
            {i < steps.length - 1 && (
              <div
                className={`h-[2px] flex-1 min-w-[8px] rounded-full transition-colors duration-200 ${
                  step.state === "done" ? "bg-emerald-500/50 dark:bg-emerald-500/40" : "bg-slate-200 dark:bg-zinc-700"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default Stepper;
