// Presentation metadata (labels, badge colors, workflow copy) for the
// Purchasing + AP pages. Kept out of src/types (types only) and out of the
// components so the three pages render statuses consistently.
import type {
  PaymentStatus,
  Priority,
  RequestStatus,
  WorkflowAction,
} from "@/types/purchasing";

export const STATUS_LABEL: Record<RequestStatus, string> = {
  NEW: "New Request",
  UNDER_REVIEW: "Under Review",
  WAITING_APPROVAL: "Waiting Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PURCHASED: "Purchased",
  SHIPPED: "Shipped",
  ORDERED: "Ordered",
  INVOICE_RECEIVED: "Invoice Received",
  SENT_TO_AP: "Sent to AP",
  PAID: "Paid",
  COMPLETED: "Completed",
};

// Tailwind classes for a shadcn <Badge variant="outline"> per status.
export const STATUS_BADGE: Record<RequestStatus, string> = {
  NEW: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300",
  UNDER_REVIEW: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400",
  WAITING_APPROVAL: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400",
  APPROVED: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400",
  REJECTED: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400",
  PURCHASED: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400",
  SHIPPED: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-400",
  ORDERED: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400",
  INVOICE_RECEIVED: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-400",
  SENT_TO_AP: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-950 dark:text-fuchsia-400",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400",
  COMPLETED: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400",
};

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

// The canonical lifecycle order used to render a progress stepper per type.
export const SIMPLE_FLOW: RequestStatus[] = [
  "NEW",
  "UNDER_REVIEW",
  "WAITING_APPROVAL",
  "APPROVED",
  "PURCHASED",
  "SHIPPED",
  "COMPLETED",
];

export const COMPLEX_FLOW: RequestStatus[] = [
  "NEW",
  "UNDER_REVIEW",
  "WAITING_APPROVAL",
  "APPROVED",
  "ORDERED",
  "INVOICE_RECEIVED",
  "SENT_TO_AP",
  "PAID",
  "COMPLETED",
];

type ActionMeta = {
  label: string;
  // Which detail dialog (if any) the action needs before submitting.
  form?: "po" | "invoice" | "approval" | "tracking";
  variant?: "default" | "destructive" | "outline";
};

export const ACTION_META: Record<WorkflowAction, ActionMeta> = {
  START_REVIEW: { label: "Start Review" },
  CREATE_PO: { label: "Add Quote / PO", form: "po" },
  SUBMIT_FOR_APPROVAL: { label: "Submit for Approval" },
  APPROVE: { label: "Approve", form: "approval" },
  REJECT: { label: "Reject", form: "approval", variant: "destructive" },
  MARK_PURCHASED: { label: "Mark Purchased" },
  ADD_TRACKING: { label: "Add Tracking", form: "tracking" },
  MARK_ORDERED: { label: "Mark Ordered" },
  RECORD_INVOICE: { label: "Record Invoice", form: "invoice" },
  SEND_TO_AP: { label: "Send to AP" },
  PAY_INVOICE: { label: "Mark Paid" },
  COMPLETE: { label: "Complete" },
};

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
