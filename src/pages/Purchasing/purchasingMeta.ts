// Presentation metadata for Purchasing + Tasks.
import type {
  PaymentStatus,
  Priority,
  RequestStatus,
  WorkflowAction,
} from "@/types/purchasing";

export const STATUS_LABEL: Record<string, string> = {
  NEW: "New Request",
  UNDER_REVIEW: "Under Review",
  WAITING_APPROVAL: "Waiting Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  ORDERED: "Ordered / Purchased",
  PURCHASED: "Ordered / Purchased",
  SHIPPED: "Shipped",
  GOODS_RECEIVED: "Goods Received",
  INVOICE_RECEIVED: "Invoice Received",
  SENT_TO_AP: "Sent to AP",
  WAITING_PAYMENT: "Waiting Payment",

  COMPLETED: "Completed",
  ON_HOLD: "On Hold / Exception",
};

export const STATUS_BADGE: Record<string, string> = {
  NEW: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300",
  NEW_REQUEST: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300",
  UNDER_REVIEW: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400",
  WAITING_APPROVAL: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400",
  APPROVED: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400",
  REJECTED: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400",
  ORDERED: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400",
  PURCHASED: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400",
  SHIPPED: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-400",
  GOODS_RECEIVED: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-400",
  INVOICE_RECEIVED: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-400",
  SENT_TO_AP: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-950 dark:text-fuchsia-400",
  WAITING_PAYMENT: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400",

  COMPLETED: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400",
  ON_HOLD: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-400",
};

export function getStatusLabel(status: string | undefined | null): string {
  if (!status) return "New Request";
  const key = status.toUpperCase().trim().replace(/\s+/g, "_");
  if (key === "NEW_REQUEST") return "New Request";
  return STATUS_LABEL[key] ?? status;
}

export function getStatusBadge(status: string | undefined | null): string {
  if (!status) return STATUS_BADGE.NEW;
  const key = status.toUpperCase().trim().replace(/\s+/g, "_");
  return STATUS_BADGE[key] ?? STATUS_BADGE.NEW;
}

export const PRIORITY_BADGE: Record<Priority, string> = {
  LOW: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300",
  MEDIUM: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400",
  HIGH: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400",
  URGENT: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400",
};

export const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  UNPAID: "Unpaid",
  WAITING_PAYMENT: "Waiting Payment",
};

export const PAYMENT_BADGE: Record<PaymentStatus, string> = {
  UNPAID: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300",
  WAITING_PAYMENT: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400",
};

export const ADMIN_FLOW: RequestStatus[] = [
  "NEW",
  "UNDER_REVIEW",
  "COMPLETED",
];

export const SPEND_FLOW: RequestStatus[] = [
  "NEW",
  "UNDER_REVIEW",
  "WAITING_APPROVAL",
  "APPROVED",
  "WAITING_PAYMENT",
  "PURCHASED",
  "SHIPPED",
  "GOODS_RECEIVED",
  "INVOICE_RECEIVED",
  "COMPLETED",
];

export const RECURRING_FLOW: RequestStatus[] = [
  "NEW",
  "UNDER_REVIEW",
  "WAITING_APPROVAL",
  "APPROVED",
  "INVOICE_RECEIVED",
  "WAITING_PAYMENT",
  "COMPLETED",
];

export const QUOTE_FLOW: RequestStatus[] = [
  "NEW",
  "UNDER_REVIEW",
  "WAITING_APPROVAL",
  "APPROVED",
  "PURCHASED",
  "COMPLETED",
];

/**
 * Status values offered in filter dropdowns. Built from SPEND_FLOW because it is
 * the superset pipeline, and deduplicated against STATUS_LABEL, which also carries
 * legacy spellings (ORDERED, SENT_TO_AP) that render the same label as their
 * canonical counterpart and would otherwise appear twice in the list.
 */
export const STATUS_FILTER_OPTIONS: RequestStatus[] = [...SPEND_FLOW, "REJECTED", "ON_HOLD"];

export const ACTION_META: Record<WorkflowAction, { label: string; form?: "po" | "invoice" | "approval" | "tracking" | "confirmGoods"; variant?: "default" | "destructive" | "outline" }> = {
  START_REVIEW: { label: "Start Review", variant: "default" },
  CREATE_PO: { label: "Quote / PO #", form: "po", variant: "default" },
  SUBMIT_FOR_APPROVAL: { label: "Submit for Approval", form: "approval", variant: "default" },
  APPROVE: { label: "Approve", form: "approval", variant: "default" },
  REJECT: { label: "Reject", form: "approval", variant: "destructive" },
  MARK_PURCHASED: { label: "Mark Purchased", variant: "default" },
  ADD_TRACKING: { label: "Add Tracking & Mark Shipped", form: "tracking", variant: "default" },
  MARK_SHIPPED: { label: "Mark Shipped", variant: "default" },
  RECORD_INVOICE: { label: "Record Invoice", form: "invoice", variant: "default" },
  SEND_TO_AP: { label: "Send to AP", variant: "default" },
  PAY_INVOICE: { label: "Pay Invoice", variant: "default" },
  CONFIRM_GOODS_RECEIVED: { label: "Confirm Goods Received", form: "confirmGoods", variant: "default" },
  PUT_ON_HOLD: { label: "Put on Hold", variant: "destructive" },
  RESUME_WORKFLOW: { label: "Resume Request", variant: "default" },
  COMPLETE: { label: "Complete", variant: "default" },
};

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return String(iso);
  }
}

export function formatMoney(val: number | null | undefined): string {
  if (val == null) return "$0.00";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
}
