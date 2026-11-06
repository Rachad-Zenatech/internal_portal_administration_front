import React from "react";
import { Banknote, ShoppingCart, Layers, Repeat, RotateCw } from "lucide-react";
import type { ARWorkflowState, ARWorkflowType } from "../../../../types/ar";

export const STEP_SEQUENCE: ARWorkflowState[] = [
  "DRAFT",
  "PENDING_REVIEW",
  "INVOICE_SENT",
  "AWAITING_PAYMENT",
  "RECONCILED",
  "COMPLETED",
];

export const STATE_COLORS: Record<ARWorkflowState, { label: string; bg: string; text: string; border: string }> = {
  DRAFT: {
    label: "Draft",
    bg: "bg-slate-500/10",
    text: "text-slate-600 dark:text-slate-400",
    border: "border-slate-500/20",
  },
  PENDING_REVIEW: {
    label: "Pending Review",
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/20",
  },
  CLERK_REVIEW: {
    label: "Clerk Review",
    bg: "bg-amber-500/15",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/30",
  },
  INVOICE_SENT: {
    label: "Invoice Sent",
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/20",
  },
  AWAITING_PAYMENT: {
    label: "Awaiting Payment",
    bg: "bg-purple-500/10",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-500/20",
  },
  DUNNING_REMINDER: {
    label: "Dunning / Overdue",
    bg: "bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-500/20",
  },
  RECONCILED: {
    label: "Reconciled",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/20",
  },
  COMPLETED: {
    label: "Completed & Provisioned",
    bg: "bg-emerald-500/15",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/30",
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-zinc-500/10",
    text: "text-zinc-500 dark:text-zinc-400",
    border: "border-zinc-500/20",
  },
};

export const TYPE_CONFIGS: Record<
  ARWorkflowType,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  CASH: { label: "Cash Reconciliation", icon: Banknote, color: "text-emerald-500" },
  INITIAL_SALE: { label: "Initial Sale", icon: ShoppingCart, color: "text-blue-500" },
  ADD_ON: { label: "Add-On / Upgrade", icon: Layers, color: "text-indigo-500" },
  MONTHLY_SUBSCRIPTION: { label: "Monthly Subscription", icon: Repeat, color: "text-violet-500" },
  RENEWAL: { label: "Contract Renewal", icon: RotateCw, color: "text-amber-500" },
};
