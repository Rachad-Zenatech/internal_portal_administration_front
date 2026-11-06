import { CheckCheck, Clock, Layers, RefreshCw, Receipt } from "lucide-react";
import type { ComponentType } from "react";
import { toast } from "sonner";
import type { NotificationDropdownState } from "../hooks/useNotificationDropdown";

type TabKey = "grouped" | "recurring" | "invoices" | "all";

interface TabDef {
  key: TabKey;
  label: string;
  icon: ComponentType<{ className?: string }>;
  /** total items in this tab */
  count?: number;
  /** unread/alert items in this tab, shown as a coloured badge */
  alerts?: number;
  active: string;
  badge: string;
}

export function SegmentedFilterControls({ s }: { s: NotificationDropdownState }) {
  const {
    isMarkingAll, markAllAsRead, totalUnread, activeTab, setActiveTab, unreadInvoiceCount, invoiceNotifications,
    recurringAlertsCount, recurringItems, canViewRecurringTab, requestGroups,
  } = s;

  // A fixed number of equal-width tabs (never a horizontal scroll bar); "Unread" is a filter, so it sits on its own row.
  const tabs: TabDef[] = [
    { key: "grouped", label: "Requests", icon: Layers, count: requestGroups.length, active: "text-blue-600 dark:text-blue-400", badge: "bg-blue-600" },
    ...(canViewRecurringTab
      ? [{ key: "recurring" as const, label: "Recurring", icon: RefreshCw, count: recurringItems.length, alerts: recurringAlertsCount, active: "text-purple-600 dark:text-purple-400", badge: "bg-purple-600" }]
      : []),
    { key: "invoices", label: "Invoices", icon: Receipt, count: invoiceNotifications.length, alerts: unreadInvoiceCount, active: "text-emerald-600 dark:text-emerald-400", badge: "bg-emerald-600" },
    { key: "all", label: "Timeline", icon: Clock, active: "text-blue-600 dark:text-blue-400", badge: "bg-blue-600" },
  ];

  return (
    <div className="px-4 pt-2.5 pb-2 bg-slate-50/70 dark:bg-zinc-900/50 border-b border-slate-100 dark:border-zinc-800 shrink-0 space-y-2">
      <div role="tablist" aria-label="Notification views" className="grid grid-flow-col auto-cols-fr gap-0.5 p-0.5 bg-slate-200/70 dark:bg-zinc-800 rounded-lg text-xs font-semibold">
        {tabs.map(({ key, label, icon: Icon, count, alerts, active, badge }) => {
          const selected = activeTab === key;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveTab(key)}
              className={`relative min-w-0 px-1.5 py-1.5 rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
                selected
                  ? `bg-white dark:bg-zinc-950 ${active} shadow-xs font-bold`
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{label}</span>
              {count !== undefined && (
                <span className={`shrink-0 text-[10px] font-semibold tabular-nums ${selected ? "opacity-80" : "opacity-60"}`}>{count}</span>
              )}
              {alerts !== undefined && alerts > 0 && (
                <span className={`absolute -top-1 -right-0.5 min-w-4 h-4 px-1 rounded-full ${badge} text-white text-[10px] leading-none flex items-center justify-center font-bold ring-2 ring-slate-50 dark:ring-zinc-900`}>
                  {alerts}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setActiveTab(activeTab === "unread" ? "grouped" : "unread")}
          aria-pressed={activeTab === "unread"}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-colors cursor-pointer ${
            activeTab === "unread"
              ? "bg-blue-600 border-blue-600 text-white"
              : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:border-blue-300 hover:text-blue-600"
          }`}
        >
          <span>Unread only</span>
          {totalUnread > 0 && (
            <span className={`min-w-4 h-4 px-1 rounded-full text-[10px] flex items-center justify-center font-bold ${activeTab === "unread" ? "bg-white text-blue-600" : "bg-blue-600 text-white"}`}>
              {totalUnread}
            </span>
          )}
        </button>

        {totalUnread > 0 && (
          <button
            onClick={() => markAllAsRead(undefined, { onSuccess: () => toast.success("All marked as read") })}
            disabled={isMarkingAll}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 hover:underline cursor-pointer shrink-0 disabled:opacity-50"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>
    </div>
  );
}
