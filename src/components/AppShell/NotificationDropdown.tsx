import { Bell, X, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNotificationDropdown } from "./notificationDropdown/hooks/useNotificationDropdown";
import type { NotificationDropdownProps } from "./notificationDropdown/types";
import { SegmentedFilterControls } from "./notificationDropdown/sections/SegmentedFilterControls";
import { NotificationListView } from "./notificationDropdown/sections/NotificationListView";
import { SendgridEmailTesterModal } from "./notificationDropdown/sections/SendgridEmailTesterModal";

export function NotificationDropdownContent(props: NotificationDropdownProps) {
  const s = useNotificationDropdown(props);
  const { isClearingAll, clearAll, notifications, navigate, onClose, activeTab, totalUnread, unreadRecurringCount, recurringNotifications, unreadInvoiceCount, invoiceNotifications } = s;
  return (
    <>
      <div className="flex flex-col h-[540px] max-h-[85vh] bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">
        {/* Header */}
        <div className="p-4 pb-3 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-800/60">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">Notifications</h3>
                {totalUnread > 0 && (
                  <Badge className="bg-blue-600 hover:bg-blue-600 text-white text-[11px] font-semibold px-2 py-0.2">
                    {totalUnread} new
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Purchasing updates, recurring payments, and request alerts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Segmented Filter Controls */}
        <SegmentedFilterControls s={s} />

        {/* Quick Windows Notification Enable Banner */}
        {typeof window !== "undefined" && "Notification" in window && Notification.permission === "default" && (
          <div className="px-4 py-2 bg-blue-50/80 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900/50 flex items-center justify-between text-xs gap-2 shrink-0">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 min-w-0">
              <Laptop className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
              <span className="truncate">Enable Windows notifications for alerts while tab is backgrounded</span>
            </div>
            <button
              onClick={async () => {
                try {
                  const res = await Notification.requestPermission();
                  if (res === "granted") {
                    localStorage.setItem("windowsNotifications", "true");
                    new Notification("Zenatech Notifications Enabled", {
                      body: "You will now receive desktop notifications for purchase requests and recurring payments.",
                      icon: "/favicon.svg",
                    });
                    toast.success("Windows notifications enabled!");
                  }
                } catch (e) {
                  console.error(e);
                }
              }}
              className="text-xs font-bold text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 underline shrink-0 cursor-pointer"
            >
              Enable
            </button>
          </div>
        )}

        {/* Notification Scrollable Body */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800">
          <NotificationListView s={s} />
        </div>

        {/* Footer Actions */}
        <div className="p-3 px-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50 shrink-0">
          <span className="text-xs text-slate-500 dark:text-zinc-400">
            {activeTab === "invoices"
              ? `${invoiceNotifications.length} invoice updates • ${unreadInvoiceCount} unread`
              : activeTab === "recurring"
              ? `${recurringNotifications.length} recurring • ${unreadRecurringCount} unread`
              : `${notifications.length} total • ${totalUnread} unread`}
          </span>

          <div className="flex items-center gap-2">
            {activeTab === "invoices" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  navigate("/account-receivable?tab=invoices");
                }}
                className="h-7 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 cursor-pointer"
              >
                <span>Invoices Table</span>
              </Button>
            )}

            {activeTab === "recurring" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  navigate("/purchasing/recurring");
                }}
                className="h-7 text-xs font-semibold text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950 cursor-pointer"
              >
                <span>Recurring Payments Table</span>
              </Button>
            )}

            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearAll(undefined, { onSuccess: () => toast.success("All notifications cleared") })}
                disabled={isClearingAll}
                className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
              >
                Clear all
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* SendGrid Email Tester Modal */}
      <SendgridEmailTesterModal s={s} />
    </>
  );
}

export { isRecurringNotification } from "./notificationDropdown/utils";
