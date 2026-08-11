// Presentation metadata for Purchasing + Tasks.
import type {
  PaymentStatus,
  Priority,
  RequestStatus,
  WorkflowAction,
} from "@/types/purchasing";

export const STATUS_LABEL: Record<string, string> = {
  NEW: "New Request",
  NEW_REQUEST: "New Request",
  UNDER_REVIEW: "Under Review",
  WAITING_APPROVAL: "Waiting Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  WAITING_PAYMENT: "Waiting Payment",
  PURCHASED: "Purchased",
  SHIPPED: "Shipped",
  ORDERED: "Ordered",
  INVOICE_RECEIVED: "Invoice Received",
  SENT_TO_AP: "Sent to AP",
  PAID: "Paid",
  COMPLETED: "Completed",
};

export const STATUS_BADGE: Record<string, string> = {
  NEW: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300",
  NEW_REQUEST: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300",
  UNDER_REVIEW: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400",
  WAITING_APPROVAL: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400",
  APPROVED: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400",
  REJECTED: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400",
  WAITING_PAYMENT: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400",
  PURCHASED: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400",
  SHIPPED: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-400",
  ORDERED: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400",
  INVOICE_RECEIVED: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-400",
  SENT_TO_AP: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-950 dark:text-fuchsia-400",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400",
  COMPLETED: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400",
};

export function getStatusLabel(status: string | undefined | null): string {
  if (!status) return "New Request";
  const key = status.toUpperCase().trim().replace(/\s+/g, "_");
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
  PAID: "Paid",
};

export const PAYMENT_BADGE: Record<PaymentStatus, string> = {
  UNPAID: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300",
  WAITING_PAYMENT: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400",
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
  "ORDERED",
  "SHIPPED",
  "INVOICE_RECEIVED",
  "SENT_TO_AP",
  "PAID",
  "COMPLETED",
];

export const RECURRING_FLOW: RequestStatus[] = [
  "NEW",
  "UNDER_REVIEW",
  "INVOICE_RECEIVED",
  "SENT_TO_AP",
  "PAID",
  "COMPLETED",
];

export const ACTION_META: Record<WorkflowAction, { label: string; form?: "po" | "invoice" | "approval" | "tracking" | "confirmGoods"; variant?: "default" | "destructive" | "outline" }> = {
  START_REVIEW: { label: "Start Review", variant: "default" },
  CREATE_PO: { label: "Add Quote / PO", form: "po", variant: "default" },
  SUBMIT_FOR_APPROVAL: { label: "Submit for Approval", form: "approval", variant: "default" },
  APPROVE: { label: "Approve", form: "approval", variant: "default" },
  REJECT: { label: "Reject", form: "approval", variant: "destructive" },
  MARK_PURCHASED: { label: "Mark Purchased", variant: "default" },
  ADD_TRACKING: { label: "Add Tracking", form: "tracking", variant: "outline" },
  MARK_ORDERED: { label: "Mark Ordered", variant: "default" },
  MARK_SHIPPED: { label: "Mark Shipped", variant: "default" },
  RECORD_INVOICE: { label: "Record Invoice", form: "invoice", variant: "default" },
  SEND_TO_AP: { label: "Send to AP", variant: "default" },
  PAY_INVOICE: { label: "Pay Invoice", variant: "default" },
  CONFIRM_GOODS_RECEIVED: { label: "Confirm Goods Received", form: "confirmGoods", variant: "default" },
  PUT_ON_HOLD: { label: "Put on Hold", variant: "destructive" },
  RESUME_WORKFLOW: { label: "Resume Workflow", variant: "default" },
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
