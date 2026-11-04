import React from "react";
import { Banknote, ShoppingCart, Layers, Repeat, RotateCw } from "lucide-react";
import type { ARWorkflowState, ARWorkflowType } from "../../../types/ar";

export const DEFAULT_STEP_SEQUENCE: ARWorkflowState[] = [
  "DRAFT",
  "PENDING_REVIEW",
  "INVOICE_SENT",
  "AWAITING_PAYMENT",
  "RECONCILED",
  "COMPLETED",
];

export const CASH_STEP_SEQUENCE: ARWorkflowState[] = [
  "PENDING_REVIEW",
  "RECONCILED",
  "COMPLETED",
];

export const CASH_CLERK_STEP_SEQUENCE: ARWorkflowState[] = [
  "PENDING_REVIEW",
  "CLERK_REVIEW",
  "RECONCILED",
  "COMPLETED",
];

export const STATE_CONFIG: Record<
  ARWorkflowState,
  { label: string; bg: string; text: string; border: string; desc: string }
> = {
  DRAFT: {
    label: "Draft",
    bg: "bg-slate-500/10",
    text: "text-slate-600 dark:text-slate-400",
    border: "border-slate-500/20",
    desc: "Workflow initialized and awaiting submission or review.",
  },
  PENDING_REVIEW: {
    label: "Pending Review",
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/20",
    desc: "Under AR manager approval and billing terms verification.",
  },
  CLERK_REVIEW: {
    label: "Clerk Review",
    bg: "bg-amber-500/15",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/30",
    desc: "Payment shortfall / discrepancy assigned to AR Clerk for customer dispute resolution.",
  },
  INVOICE_SENT: {
    label: "Invoice Sent",
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/20",
    desc: "Invoice has been generated and dispatched to customer.",
  },
  AWAITING_PAYMENT: {
    label: "Awaiting Payment",
    bg: "bg-purple-500/10",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-500/20",
    desc: "Awaiting customer settlement via wire, card, or check.",
  },
  DUNNING_REMINDER: {
    label: "Dunning / Overdue",
    bg: "bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-500/20",
    desc: "Payment is overdue. Automated dunning timer cycle active.",
  },
  RECONCILED: {
    label: "Reconciled",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/20",
    desc: "Funds matched and posted to general ledger.",
  },
  COMPLETED: {
    label: "Completed & Provisioned",
    bg: "bg-emerald-500/15",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/30",
    desc: "Workflow lifecycle completed. Services fulfilled & provisioned.",
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-zinc-500/10",
    text: "text-zinc-500 dark:text-zinc-400",
    border: "border-zinc-500/20",
    desc: "Workflow terminated.",
  },
};

export const TYPE_CONFIGS: Record<
  ARWorkflowType,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bg: string;
    desc: string;
  }
> = {
  CASH: {
    label: "Cash Reconciliation",
    icon: Banknote,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    desc: "Inbound Payment & Bank Matching",
  },
  INITIAL_SALE: {
    label: "Initial Sale",
    icon: ShoppingCart,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    desc: "Sales Order & Direct Invoicing",
  },
  ADD_ON: {
    label: "Add-On / Upgrade",
    icon: Layers,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-500/10 border-indigo-500/20",
    desc: "Contract Amendment & Pro-Rata",
  },
  MONTHLY_SUBSCRIPTION: {
    label: "Monthly Subscription",
    icon: Repeat,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
    desc: "Recurring Billing & Auto-Charge",
  },
  RENEWAL: {
    label: "Contract Renewal",
    icon: RotateCw,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    desc: "Term Extension & Quote Review",
  },
};
