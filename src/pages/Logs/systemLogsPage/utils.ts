import { RefreshCw, Activity, CheckCircle2, XCircle, PlusCircle, Send, Eye, FileText, CreditCard, Edit3, Trash2 } from "lucide-react";
import type { AuditLogItem } from "./types";

// Helper to format human-readable action details
export function getActionMeta(action: string) {
  const act = (action || "").toUpperCase();

  if (act.includes("CREATE") || act === "NEW_REQUEST") {
    return {
      label: "Created",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
      icon: PlusCircle,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      dotColor: "bg-emerald-500",
    };
  }
  if (act.includes("SUBMIT")) {
    return {
      label: "Submitted for Approval",
      color: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800",
      icon: Send,
      iconColor: "text-sky-600 dark:text-sky-400",
      dotColor: "bg-sky-500",
    };
  }
  if (act.includes("REVIEW") || act === "START_REVIEW") {
    return {
      label: "Under Review",
      color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
      icon: Eye,
      iconColor: "text-purple-600 dark:text-purple-400",
      dotColor: "bg-purple-500",
    };
  }
  if (act.includes("APPROV") || act.includes("DECISION")) {
    return {
      label: "Approved",
      color: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800",
      icon: CheckCircle2,
      iconColor: "text-teal-600 dark:text-teal-400",
      dotColor: "bg-teal-500",
    };
  }
  if (act.includes("REJECT")) {
    return {
      label: "Rejected",
      color: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
      icon: XCircle,
      iconColor: "text-rose-600 dark:text-rose-400",
      dotColor: "bg-rose-500",
    };
  }
  if (act.includes("PO_") || act.includes("PURCHASE_ORDER")) {
    return {
      label: "PO Issued",
      color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
      icon: FileText,
      iconColor: "text-amber-600 dark:text-amber-400",
      dotColor: "bg-amber-500",
    };
  }
  if (act.includes("PAID") || act.includes("INVOICE_PAID") || act.includes("PAYMENT")) {
    return {
      label: "Invoice Paid",
      color: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800",
      icon: CreditCard,
      iconColor: "text-indigo-600 dark:text-indigo-400",
      dotColor: "bg-indigo-500",
    };
  }
  if (act.includes("STATUS_CHANGE") || act.includes("TRANSITION")) {
    return {
      label: "Status Changed",
      color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
      icon: RefreshCw,
      iconColor: "text-blue-600 dark:text-blue-400",
      dotColor: "bg-blue-500",
    };
  }
  if (act.includes("UPDATE") || act.includes("EDIT")) {
    return {
      label: "Updated",
      color: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
      icon: Edit3,
      iconColor: "text-slate-600 dark:text-zinc-400",
      dotColor: "bg-slate-500",
    };
  }
  if (act.includes("DELETE") || act.includes("REMOVE")) {
    return {
      label: "Deleted",
      color: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
      icon: Trash2,
      iconColor: "text-rose-600 dark:text-rose-400",
      dotColor: "bg-rose-500",
    };
  }

  return {
    label: action.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
    color: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
    icon: Activity,
    iconColor: "text-slate-600 dark:text-zinc-400",
    dotColor: "bg-slate-400",
  };
}

// Generate a concise human-readable summary of what changed
export function generateChangeSummary(log: AuditLogItem): string {
  const changes = log.changes || log.new_value;
  if (!changes) {
    const meta = getActionMeta(log.action);
    return `${meta.label} on ${log.entity_type} #${log.entity_id}`;
  }

  if (typeof changes === "object") {
    if (changes.status) {
      if (changes.old_status) {
        return `Status transitioned: ${changes.old_status} → ${changes.status}`;
      }
      return `Status set to: ${changes.status}`;
    }
    if (changes.amount != null) {
      return `Amount: $${Number(changes.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    }
    if (changes.approver_name || changes.approver_id) {
      return `Decision recorded by ${changes.approver_name || "Approver"}`;
    }
    if (changes.message) {
      return String(changes.message);
    }
    const keys = Object.keys(changes).filter((k) => k !== "id" && k !== "updated_at");
    if (keys.length > 0) {
      return `Modified ${keys.slice(0, 3).join(", ")}${keys.length > 3 ? ` +${keys.length - 3} more` : ""}`;
    }
  }

  return getActionMeta(log.action).label;
}

// Helper to format timestamps cleanly
export function formatLogDate(dateStr: string) {
  if (!dateStr) return { date: "-", time: "", relative: "" };
  try {
    const d = new Date(dateStr);
    const dateFormatted = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timeFormatted = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    // Calculate relative time
    const diffSeconds = Math.floor((Date.now() - d.getTime()) / 1000);
    let relative = "";
    if (diffSeconds < 60) relative = "Just now";
    else if (diffSeconds < 3600) relative = `${Math.floor(diffSeconds / 60)}m ago`;
    else if (diffSeconds < 86400) relative = `${Math.floor(diffSeconds / 3600)}h ago`;
    else relative = `${Math.floor(diffSeconds / 86400)}d ago`;

    return { date: dateFormatted, time: timeFormatted, relative };
  } catch {
    return { date: dateStr, time: "", relative: "" };
  }
}

// User Initials generator
export function getInitials(name?: string | null) {
  if (!name) return "SYS";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
