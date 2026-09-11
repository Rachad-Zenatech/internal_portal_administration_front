import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  ShoppingCart,
  X,
  Inbox,
  Laptop,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useClearAllNotifications,
  type Notification,
} from "@/hooks/useNotifications";
import { toast } from "sonner";

// Format notification text to remove underscores and capitalize status words
function formatNotificationText(text: string): string {
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

function formatRelativeTime(dateStr: string): string {
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

function diffDayVal(sec: number): number {
  return Math.floor(sec / 86400);
}

interface RequestGroup {
  key: string;
  requestId: string | null;
  requestTitle: string;
  linkUrl: string | null;
  latestDate: string;
  hasUnread: boolean;
  unreadCount: number;
  latestStatus: string | null;
  notifications: Notification[];
}

function extractStatus(text: string): string | null {
  if (!text) return null;
  const upper = text.toUpperCase();
  if (upper.includes("COMPLETED")) return "COMPLETED";
  if (upper.includes("WAITING_PAYMENT") || upper.includes("WAITING PAYMENT")) return "WAITING PAYMENT";
  if (upper.includes("APPROVED")) return "APPROVED";
  if (upper.includes("REJECTED")) return "REJECTED";
  if (upper.includes("UNDER_REVIEW") || upper.includes("UNDER REVIEW") || upper.includes("WAITING_FOR_REVIEW")) return "UNDER REVIEW";
  if (upper.includes("ON_HOLD") || upper.includes("HOLD")) return "ON HOLD";
  if (upper.includes("GOODS_RECEIVED") || upper.includes("GOODS RECEIVED")) return "GOODS RECEIVED";
  if (upper.includes("INVOICE")) return "INVOICE";
  if (upper.includes("NEW")) return "NEW";
  return null;
}

function getStatusBadgeClass(status: string | null): string {
  switch (status) {
    case "COMPLETED":
    case "APPROVED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800";
    case "WAITING PAYMENT":
    case "UNDER REVIEW":
    case "ON HOLD":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800";
    case "REJECTED":
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800";
    default:
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800";
  }
}

export function NotificationDropdownContent({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"grouped" | "all" | "unread">("grouped");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const { data: notifications = [] } = useNotifications();
  const { data: unreadCountData } = useUnreadNotificationCount();
  const { mutate: markAsRead } = useMarkNotificationAsRead();
  const { mutate: markAllAsRead, isPending: isMarkingAll } = useMarkAllNotificationsAsRead();
  const { mutate: clearAll, isPending: isClearingAll } = useClearAllNotifications();

  const totalUnread = unreadCountData?.count ?? 0;

  // Group notifications by Request ID or entity
  const groups = useMemo<RequestGroup[]>(() => {
    const map = new Map<string, RequestGroup>();

    for (const notif of notifications) {
      let reqId = notif.entity_id;
      if (!reqId && notif.link_url) {
        const match = notif.link_url.match(/\/requests\/(\d+)/i);
        if (match) reqId = match[1];
      }

      // Clean Title
      let title = notif.title || "Notification";
      const quoteMatch = title.match(/['"](.*?)['"]/);
      if (quoteMatch) {
        title = quoteMatch[1];
      } else {
        title = title.replace(/^New purchase request|^Status changed for Request|^New recurring payment assigned|^New Accounts Payable request/i, "").trim();
        if (title.startsWith("(") && title.endsWith(")")) title = title.slice(1, -1);
      }

      const groupKey = reqId ? `req-${reqId}` : `other-${notif.id}`;

      if (!map.has(groupKey)) {
        map.set(groupKey, {
          key: groupKey,
          requestId: reqId || null,
          requestTitle: title || (reqId ? `Request #${reqId}` : "General Notification"),
          linkUrl: notif.link_url,
          latestDate: notif.created_at,
          hasUnread: !notif.is_read,
          unreadCount: notif.is_read ? 0 : 1,
          latestStatus: extractStatus(notif.message) || extractStatus(notif.title),
          notifications: [notif],
        });
      } else {
        const grp = map.get(groupKey)!;
        grp.notifications.push(notif);
        if (!notif.is_read) {
          grp.hasUnread = true;
          grp.unreadCount += 1;
        }
        if (!grp.latestStatus) {
          grp.latestStatus = extractStatus(notif.message) || extractStatus(notif.title);
        }
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime()
    );
  }, [notifications]);

  const toggleGroup = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleOpenLink = (url: string | null, unreadNotifs: Notification[]) => {
    unreadNotifs.forEach((n) => {
      if (!n.is_read) markAsRead(n.id);
    });
    onClose();
    if (url) navigate(url);
  };

  const filteredNotifications = useMemo(() => {
    if (activeTab === "unread") {
      return notifications.filter((n) => !n.is_read);
    }
    return notifications;
  }, [notifications, activeTab]);

  return (
    <div className="flex flex-col h-[520px] max-h-[85vh] bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">
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
              Purchasing status updates and request activity
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Segmented Filter Controls */}
      <div className="px-4 py-2 bg-slate-50/70 dark:bg-zinc-900/50 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
        <div className="inline-flex p-0.5 bg-slate-200/70 dark:bg-zinc-800 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveTab("grouped")}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === "grouped"
                ? "bg-white dark:bg-zinc-950 text-blue-600 dark:text-blue-400 shadow-xs font-bold"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>By Request ({groups.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === "all"
                ? "bg-white dark:bg-zinc-950 text-blue-600 dark:text-blue-400 shadow-xs font-bold"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Timeline</span>
          </button>

          <button
            onClick={() => setActiveTab("unread")}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === "unread"
                ? "bg-white dark:bg-zinc-950 text-blue-600 dark:text-blue-400 shadow-xs font-bold"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
            }`}
          >
            <span>Unread</span>
            {totalUnread > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                {totalUnread}
              </span>
            )}
          </button>
        </div>

        {totalUnread > 0 && (
          <button
            onClick={() => markAllAsRead(undefined, { onSuccess: () => toast.success("All marked as read") })}
            disabled={isMarkingAll}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 hover:underline"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

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
                    body: "You will now receive desktop notifications for purchase requests.",
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

      {/* Main Notification Body */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800/80">
        {activeTab === "grouped" ? (
          // Grouped by Request View
          groups.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center text-slate-400 dark:text-zinc-500">
              <Inbox className="h-9 w-9 mb-2 stroke-1" />
              <p className="text-sm font-medium">No request notifications yet</p>
              <p className="text-xs text-slate-400">Updates will appear here as requests progress</p>
            </div>
          ) : (
            groups.map((grp) => {
              const isExpanded = expandedGroups[grp.key] ?? false;
              return (
                <div
                  key={grp.key}
                  className={`transition-colors duration-150 ${
                    grp.hasUnread ? "bg-blue-50/20 dark:bg-blue-950/10" : ""
                  }`}
                >
                  {/* Group Header Card */}
                  <div
                    onClick={() => handleOpenLink(grp.linkUrl, grp.notifications)}
                    className="p-3.5 px-4 flex items-start gap-3 hover:bg-slate-50/80 dark:hover:bg-zinc-900/40 cursor-pointer group"
                  >
                    {/* Icon */}
                    <div className="mt-0.5 h-8 w-8 rounded-lg bg-blue-50 dark:bg-zinc-800 border border-blue-100 dark:border-zinc-700 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                      <ShoppingCart className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {grp.requestId && (
                            <Badge variant="outline" className="text-[10px] font-bold px-1.5 py-0 border-slate-300 dark:border-zinc-700 shrink-0">
                              REQ-{grp.requestId}
                            </Badge>
                          )}
                          <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                            {grp.requestTitle}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {grp.hasUnread && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                          )}
                          <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">
                            {formatRelativeTime(grp.latestDate)}
                          </span>
                        </div>
                      </div>

                      {/* Status row + toggle */}
                      <div className="flex items-center justify-between mt-1.5 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {grp.latestStatus && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getStatusBadgeClass(grp.latestStatus)}`}>
                              {formatNotificationText(grp.latestStatus)}
                            </span>
                          )}
                          <span className="text-xs text-slate-500 dark:text-zinc-400 truncate">
                            {grp.notifications[0]?.message ? formatNotificationText(grp.notifications[0].message) : "Activity on request"}
                          </span>
                        </div>

                        {grp.notifications.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => toggleGroup(grp.key, e)}
                            className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 shrink-0"
                          >
                            <span>{grp.notifications.length} steps</span>
                            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Stepper Timeline */}
                  {isExpanded && grp.notifications.length > 1 && (
                    <div className="pl-14 pr-4 pb-3 pt-1 space-y-2 bg-slate-50/50 dark:bg-zinc-900/20 border-t border-slate-100 dark:border-zinc-800/50">
                      <div className="relative border-l-2 border-slate-200 dark:border-zinc-700 ml-2 pl-3 space-y-3 pt-1">
                        {grp.notifications.map((n, i) => (
                          <div key={n.id || i} className="relative group/step">
                            <div className={`absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-zinc-950 ${
                              !n.is_read ? "bg-blue-600 ring-2 ring-blue-100 dark:ring-blue-900" : "bg-slate-300 dark:bg-zinc-600"
                            }`} />
                            <div className="flex items-baseline justify-between gap-2">
                              <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                                {formatNotificationText(n.title)}
                              </p>
                              <span className="text-[10px] text-slate-400 dark:text-zinc-500 shrink-0">
                                {formatRelativeTime(n.created_at)}
                              </span>
                            </div>
                            {n.message && (
                              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                                {formatNotificationText(n.message)}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )
        ) : (
          // Timeline & Unread View (Dense scannable list)
          filteredNotifications.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center text-slate-400 dark:text-zinc-500">
              <Inbox className="h-9 w-9 mb-2 stroke-1" />
              <p className="text-sm font-medium">
                {activeTab === "unread" ? "No unread notifications" : "No notifications"}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const status = extractStatus(notif.message) || extractStatus(notif.title);
              return (
                <div
                  key={notif.id}
                  onClick={() => handleOpenLink(notif.link_url, [notif])}
                  className={`p-3 px-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-zinc-900/50 cursor-pointer group ${
                    !notif.is_read ? "bg-blue-50/20 dark:bg-blue-950/10" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-7 w-7 rounded-lg bg-blue-50 dark:bg-zinc-800 border border-blue-100 dark:border-zinc-700 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                      <ShoppingCart className="h-3.5 w-3.5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {status && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border uppercase ${getStatusBadgeClass(status)}`}>
                            {formatNotificationText(status)}
                          </span>
                        )}
                        <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate">
                          {formatNotificationText(notif.title)}
                        </span>
                      </div>
                      {notif.message && (
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                          {formatNotificationText(notif.message)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                      {formatRelativeTime(notif.created_at)}
                    </span>
                    {!notif.is_read ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notif.id);
                        }}
                        className="w-5 h-5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 flex items-center justify-center text-blue-600 transition-colors"
                        title="Mark as read"
                      >
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                      </button>
                    ) : (
                      <span className="w-5 h-5" />
                    )}
                  </div>
                </div>
              );
            })
          )
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-3 px-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50 shrink-0">
        <span className="text-xs text-slate-500 dark:text-zinc-400">
          {notifications.length} total • {totalUnread} unread
        </span>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:text-slate-900"
            onClick={() => clearAll(undefined, { onSuccess: () => toast.success("Notifications cleared") })}
            disabled={notifications.length === 0 || isClearingAll}
          >
            {isClearingAll ? "Clearing..." : "Clear all"}
          </Button>
        </div>
      </div>
    </div>
  );
}
