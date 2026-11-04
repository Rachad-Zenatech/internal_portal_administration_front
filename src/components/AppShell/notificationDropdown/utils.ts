import { type Notification } from "@/hooks/useNotifications";
import type { PurchaseRequest } from "@/types/purchasing";
import { generatePaymentSchedule } from "@/pages/Purchasing/utils/recurringScheduleUtils";
import type { DueDateInfo } from "./types";

// Format notification text to remove underscores and capitalize status words
export function formatNotificationText(text: string): string {
  if (!text) return "";
  return text
    .replace(/waiting_payment/gi, "Waiting Payment")
    .replace(/waiting_approval/gi, "Waiting Approval")
    .replace(/waiting_for_review/gi, "Waiting for Review")
    .replace(/under_review/gi, "Under Review")
    .replace(/goods_received/gi, "Goods Received")
    .replace(/invoice_received/gi, "Invoice Received")
    .replace(/new_request/gi, "New Request")
    .replace(/on_hold/gi, "On Hold")
    .replace(/_(\w)/g, (_, c) => " " + c.toUpperCase());
}

export function formatStatusLabel(status: string | null): string {
  if (!status) return "";
  const s = status.toUpperCase().replace(/[_\s]+/g, " ").trim();
  if (s === "WAITING PAYMENT" || s === "WAITING_PAYMENT") return "Waiting Payment";
  if (s === "WAITING APPROVAL" || s === "WAITING_APPROVAL") return "Waiting Approval";
  if (s === "UNDER REVIEW" || s === "UNDER_REVIEW" || s === "WAITING FOR REVIEW" || s === "WAITING_FOR_REVIEW") return "Under Review";
  if (s === "ON HOLD" || s === "ON_HOLD" || s === "HOLD") return "On Hold";
  if (s === "GOODS RECEIVED" || s === "GOODS_RECEIVED") return "Goods Received";
  if (s === "INVOICE" || s === "INVOICE RECEIVED" || s === "INVOICE_RECEIVED") return "Invoice";
  if (s === "COMPLETED") return "Completed";
  if (s === "APPROVED") return "Approved";
  if (s === "REJECTED") return "Rejected";
  if (s === "PURCHASED" || s === "ORDERED") return "Purchased";
  if (s === "SHIPPED") return "Shipped";
  if (s === "INITIAL" || s === "DRAFT") return "Draft";
  if (s === "NEW") return "New";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const diffSec = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffDayVal(diffSec));
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function diffDayVal(sec: number): number {
  return Math.floor(sec / 86400);
}

export function extractStatus(text: string): string | null {
  if (!text) return null;
  const upper = text.toUpperCase();
  if (upper.includes("COMPLETED")) return "COMPLETED";
  if (upper.includes("WAITING_PAYMENT") || upper.includes("WAITING PAYMENT")) return "WAITING PAYMENT";
  if (upper.includes("WAITING_APPROVAL") || upper.includes("WAITING APPROVAL")) return "WAITING APPROVAL";
  if (upper.includes("APPROVED")) return "APPROVED";
  if (upper.includes("REJECTED")) return "REJECTED";
  if (upper.includes("UNDER_REVIEW") || upper.includes("UNDER REVIEW") || upper.includes("WAITING_FOR_REVIEW")) return "UNDER REVIEW";
  if (upper.includes("ON_HOLD") || upper.includes("HOLD")) return "ON HOLD";
  if (upper.includes("GOODS_RECEIVED") || upper.includes("GOODS RECEIVED")) return "GOODS RECEIVED";
  if (upper.includes("PURCHASED") || upper.includes("ORDERED")) return "PURCHASED";
  if (upper.includes("SHIPPED")) return "SHIPPED";
  if (upper.includes("INVOICE")) return "INVOICE";
  if (upper.includes("NEW")) return "NEW";
  return null;
}

export function getStatusBadgeClass(status: string | null): string {
  if (!status) return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700";
  const s = status.toUpperCase().replace(/[_\s]+/g, " ").trim();
  switch (s) {
    case "COMPLETED":
    case "APPROVED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200/90 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/80";
    case "WAITING PAYMENT":
    case "UNDER REVIEW":
    case "WAITING FOR REVIEW":
    case "WAITING APPROVAL":
    case "ON HOLD":
      return "bg-amber-50 text-amber-700 border-amber-200/90 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/80";
    case "PURCHASED":
    case "ORDERED":
    case "SHIPPED":
      return "bg-sky-50 text-sky-700 border-sky-200/90 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/80";
    case "REJECTED":
      return "bg-rose-50 text-rose-700 border-rose-200/90 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/80";
    default:
      return "bg-blue-50 text-blue-700 border-blue-200/90 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/80";
  }
}

export function formatMoney(amount: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${Number(amount || 0).toFixed(2)}`;
  }
}

export function calculateDueInfo(req: PurchaseRequest): DueDateInfo {
  const statusUpper = (req.status || "").toUpperCase();
  const isCompleted = statusUpper === "COMPLETED" || statusUpper === "PAID";
  const isRejected = statusUpper === "REJECTED";

  if (isCompleted) {
    return {
      dueDate: req.due_date || null,
      dueLabel: "Completed",
      isOverdue: false,
      isDueToday: false,
      isDueTomorrow: false,
      isDueSoon: false,
      diffDays: null,
      badgeClass:
        "bg-emerald-50 text-emerald-700 border-emerald-200/90 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/80 font-medium",
    };
  }

  if (isRejected) {
    return {
      dueDate: req.due_date || null,
      dueLabel: "Rejected",
      isOverdue: false,
      isDueToday: false,
      isDueTomorrow: false,
      isDueSoon: false,
      diffDays: null,
      badgeClass:
        "bg-rose-50 text-rose-700 border-rose-200/90 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/80 font-medium",
    };
  }

  let targetDateStr: string | null = null;
  const sched = req.recurring_schedule;

  if (sched?.schedule_dates && sched.schedule_dates.length > 0) {
    const completed = sched.completed_installments || 0;
    for (let i = 0; i < sched.schedule_dates.length; i++) {
      const itm = sched.schedule_dates[i];
      const dStr = typeof itm === "string" ? itm : itm?.date;
      if (i >= completed && dStr) {
        targetDateStr = dStr.split("T")[0];
        break;
      }
    }
  }

  if (!targetDateStr && sched) {
    try {
      const fallbackDate = req.due_date || (req as any).request_date || undefined;
      const installments = generatePaymentSchedule(
        sched,
        Number(req.amount || 0),
        req.currency || "USD",
        req.status || undefined,
        fallbackDate
      );
      const curr = installments.find((inst) => inst.status === "CURRENT");
      if (curr?.dueDate) {
        targetDateStr = curr.dueDate;
      } else {
        const nextProj = installments.find((inst) => inst.status === "PROJECTED");
        if (nextProj?.dueDate) {
          targetDateStr = nextProj.dueDate;
        }
      }
    } catch (e) {
      console.warn("Failed to generate schedule for recurring item:", e);
    }
  }

  if (!targetDateStr) {
    targetDateStr = req.due_date || (req as any).request_date || null;
  }

  if (!targetDateStr) {
    return {
      dueDate: null,
      dueLabel: "Active Schedule",
      isOverdue: false,
      isDueToday: false,
      isDueTomorrow: false,
      isDueSoon: false,
      diffDays: null,
      badgeClass:
        "bg-purple-50 text-purple-700 border-purple-200/90 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800 font-medium",
    };
  }

  const d = new Date(targetDateStr.includes("T") ? targetDateStr : targetDateStr + "T00:00:00");
  if (isNaN(d.getTime())) {
    return {
      dueDate: targetDateStr,
      dueLabel: targetDateStr,
      isOverdue: false,
      isDueToday: false,
      isDueTomorrow: false,
      isDueSoon: false,
      diffDays: null,
      badgeClass:
        "bg-slate-50 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
    };
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const dateFormatted = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (diffDays < 0) {
    return {
      dueDate: targetDateStr,
      dueLabel: `Overdue (${Math.abs(diffDays)}d) • ${dateFormatted}`,
      isOverdue: true,
      isDueToday: false,
      isDueTomorrow: false,
      isDueSoon: true,
      diffDays,
      badgeClass:
        "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 font-bold",
    };
  } else if (diffDays === 0) {
    return {
      dueDate: targetDateStr,
      dueLabel: `Due Today • ${dateFormatted}`,
      isOverdue: false,
      isDueToday: true,
      isDueTomorrow: false,
      isDueSoon: true,
      diffDays: 0,
      badgeClass: "bg-rose-600 text-white font-bold animate-pulse shadow-sm",
    };
  } else if (diffDays === 1) {
    return {
      dueDate: targetDateStr,
      dueLabel: `Due Tomorrow • ${dateFormatted}`,
      isOverdue: false,
      isDueToday: false,
      isDueTomorrow: true,
      isDueSoon: true,
      diffDays: 1,
      badgeClass: "bg-amber-600 text-white font-bold",
    };
  } else if (diffDays <= 7) {
    return {
      dueDate: targetDateStr,
      dueLabel: `Due in ${diffDays} days • ${dateFormatted}`,
      isOverdue: false,
      isDueToday: false,
      isDueTomorrow: false,
      isDueSoon: true,
      diffDays,
      badgeClass:
        "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 font-semibold",
    };
  } else if (diffDays <= 14) {
    return {
      dueDate: targetDateStr,
      dueLabel: `Due in ${diffDays} days • ${dateFormatted}`,
      isOverdue: false,
      isDueToday: false,
      isDueTomorrow: false,
      isDueSoon: false,
      diffDays,
      badgeClass:
        "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800 font-medium",
    };
  }

  return {
    dueDate: targetDateStr,
    dueLabel: `Next Due: ${dateFormatted}`,
    isOverdue: false,
    isDueToday: false,
    isDueTomorrow: false,
    isDueSoon: false,
    diffDays,
    badgeClass:
      "bg-slate-50 text-slate-600 border-slate-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800 font-medium",
  };
}

export function isRecurringNotification(notif: Notification): boolean {
  if (!notif) return false;
  const entityType = (notif.entity_type || "").toLowerCase();
  if (entityType.includes("recurring")) return true;

  const link = (notif.link_url || "").toLowerCase();
  if (link.includes("/recurring") || link.includes("/purchasing/recurring")) return true;

  const type = (notif.type || "").toLowerCase();
  if (type.includes("recurring")) return true;

  const title = (notif.title || "").toLowerCase();
  const message = (notif.message || "").toLowerCase();
  if (title.includes("recurring") || message.includes("recurring")) return true;
  if (title.includes("review status") || message.includes("review status")) return true;
  if (title.includes("schedule breakdown") || message.includes("schedule breakdown")) return true;
  if (title.includes("installment") || message.includes("installment")) return true;

  return false;
}
