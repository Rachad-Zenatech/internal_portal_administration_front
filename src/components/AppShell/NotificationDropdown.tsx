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
  Mail,
  Send,
  Loader2,
  Truck,
  CheckCircle2,
  Clock3,
  PauseCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useClearAllNotifications,
  type Notification,
} from "@/hooks/useNotifications";
import { useAuth } from "@/lib/AuthContext";
import { apiClient } from "@/services/apiClient";
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

function formatStatusLabel(status: string | null): string {
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

function getStatusBadgeClass(status: string | null): string {
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

export function NotificationDropdownContent({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"grouped" | "all" | "unread">("grouped");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [isEmailTesterOpen, setIsEmailTesterOpen] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState(user?.email || "alvin.tsang@zenatech.com");
  const [activeSendingAction, setActiveSendingAction] = useState<string | null>(null);

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
        const m = notif.link_url.match(/\/requests\/(\d+)/);
        if (m) reqId = m[1];
      }

      let title = notif.title || "";
      if (title.startsWith("Request #") || title.startsWith("Request Approved") || title.startsWith("Request Rejected") || title.startsWith("Order Purchased") || title.startsWith("Order Shipped") || title.startsWith("Request On Hold")) {
        const m = title.match(/'([^']+)'/);
        if (m) {
          title = m[1];
        } else {
          title = title.replace(/^Request\s+#\d+:\s*/i, "").trim();
        }
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

  const handleSendTestEmail = async (actionKey: string, payload: any) => {
    if (!testEmailRecipient || !testEmailRecipient.includes("@")) {
      toast.error("Please enter a valid recipient email address.");
      return;
    }
    setActiveSendingAction(actionKey);
    try {
      if (actionKey === "trigger_scan") {
        const res: any = await apiClient.post("/api/purchasing/admin/trigger-draft-reminders");
        toast.success(`Draft scan complete! ${res?.emails_sent ?? 0} reminder email(s) sent.`);
      } else {
        const res: any = await apiClient.post("/api/purchasing/admin/send-test-email", {
          to_email: testEmailRecipient,
          ...payload,
        });
        toast.success(res?.message || "Test email sent successfully! Check your inbox.");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || "Failed to send test email.");
    } finally {
      setActiveSendingAction(null);
    }
  };

  return (
    <>
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

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEmailTesterOpen(true)}
              className="h-7.5 px-2.5 text-xs font-semibold gap-1.5 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
              title="Test SendGrid Email Notifications"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Test Email</span>
            </Button>

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
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 hover:underline cursor-pointer"
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

        {/* Notification Scrollable Body */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800">
          {activeTab === "grouped" ? (
            // Grouped By Request View
            groups.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center text-slate-400 dark:text-zinc-500">
                <Inbox className="h-9 w-9 mb-2 stroke-1" />
                <p className="text-sm font-medium">No purchase request notifications yet</p>
                <p className="text-xs mt-1">Updates on requests will appear here automatically</p>
              </div>
            ) : (
              groups.map((grp) => {
                const isExpanded = !!expandedGroups[grp.key];
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
                      className="p-3 px-4 flex items-start gap-3 hover:bg-slate-50/80 dark:hover:bg-zinc-900/40 cursor-pointer group"
                    >
                      {/* Icon */}
                      <div className="mt-0.5 h-8 w-8 rounded-lg bg-blue-50 dark:bg-zinc-800 border border-blue-100 dark:border-zinc-700 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                        <ShoppingCart className="h-4 w-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Line 1: Request Badge + Title + Time */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {grp.requestId && (
                              <Badge variant="outline" className="text-[10px] font-bold px-1.5 py-0 border-slate-300 dark:border-zinc-700 shrink-0 font-mono">
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

                        {/* Line 2: Status tag + Notification preview + steps toggle */}
                        <div className="flex items-center justify-between mt-1.5 gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {grp.latestStatus && (
                              <span
                                className={`inline-flex items-center gap-1 text-[9.5px] font-semibold px-2 py-0.5 rounded-full border shrink-0 whitespace-nowrap leading-none tracking-normal select-none ${getStatusBadgeClass(grp.latestStatus)}`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75 shrink-0" />
                                <span className="whitespace-nowrap">{formatStatusLabel(grp.latestStatus)}</span>
                              </span>
                            )}
                            <span className="text-xs text-slate-500 dark:text-zinc-400 truncate min-w-0 flex-1">
                              {grp.notifications[0]?.message ? formatNotificationText(grp.notifications[0].message) : "Activity on request"}
                            </span>
                          </div>

                          {grp.notifications.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => toggleGroup(grp.key, e)}
                              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 shrink-0 ml-1 cursor-pointer"
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
                          {grp.notifications.map((n, i) => {
                            const stepStatus = extractStatus(n.message) || extractStatus(n.title);
                            return (
                              <div key={n.id || i} className="relative group/step">
                                <div className={`absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-zinc-950 ${
                                  !n.is_read ? "bg-blue-600 ring-2 ring-blue-100 dark:ring-blue-900" : "bg-slate-300 dark:bg-zinc-600"
                                }`} />
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                    {stepStatus && (
                                      <span
                                        className={`inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.2 rounded-full border shrink-0 whitespace-nowrap leading-none select-none ${getStatusBadgeClass(stepStatus)}`}
                                      >
                                        <span className="w-1 h-1 rounded-full bg-current opacity-75 shrink-0" />
                                        <span className="whitespace-nowrap">{formatStatusLabel(stepStatus)}</span>
                                      </span>
                                    )}
                                    <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate">
                                      {formatNotificationText(n.title)}
                                    </p>
                                  </div>
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
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )
          ) : (
            // Timeline & Unread View (Refined clean 2-row layout)
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
                let reqId = notif.entity_id;
                if (!reqId && notif.link_url) {
                  const m = notif.link_url.match(/\/requests\/(\d+)/);
                  if (m) reqId = m[1];
                }

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

                      <div className="min-w-0 flex-1 space-y-1">
                        {/* Line 1: Request badge + Title */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          {reqId && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 shrink-0 font-mono">
                              REQ-{reqId}
                            </span>
                          )}
                          <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate flex-1">
                            {formatNotificationText(notif.title)}
                          </span>
                        </div>

                        {/* Line 2: Status tag + Message excerpt */}
                        <div className="flex items-center gap-2 min-w-0">
                          {status && (
                            <span
                              className={`inline-flex items-center gap-1 text-[9.5px] font-semibold px-2 py-0.5 rounded-full border shrink-0 whitespace-nowrap leading-none tracking-normal select-none ${getStatusBadgeClass(status)}`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75 shrink-0" />
                              <span className="whitespace-nowrap">{formatStatusLabel(status)}</span>
                            </span>
                          )}
                          {notif.message && (
                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate flex-1 min-w-0">
                              {formatNotificationText(notif.message)}
                            </p>
                          )}
                        </div>
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
                          className="w-5 h-5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 flex items-center justify-center text-blue-600 transition-colors cursor-pointer"
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
      <Dialog open={isEmailTesterOpen} onOpenChange={setIsEmailTesterOpen}>
        <DialogContent className="max-w-md p-6 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl">
          <DialogHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <span>Test Email Notifications</span>
              </DialogTitle>
              <Badge variant="outline" className="text-[10px] font-semibold border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-300">
                SendGrid v3
              </Badge>
            </div>
            <DialogDescription className="text-xs text-slate-500 dark:text-zinc-400">
              Dispatched from <strong className="text-slate-700 dark:text-zinc-200">purchases@zenatech.com</strong>. Trigger sample emails to test delivery and layout in your inbox.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Recipient Address Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                <span>Recipient Email Address</span>
                <span className="text-[10px] text-slate-400">Where test emails are delivered</span>
              </label>
              <Input
                type="email"
                placeholder="your.email@zenatech.com"
                value={testEmailRecipient}
                onChange={(e) => setTestEmailRecipient(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            {/* Test Action Buttons Grid */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Workflow Status Emails
              </label>

              <div className="grid grid-cols-2 gap-2">
                {/* 1. Reject */}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!!activeSendingAction}
                  onClick={() =>
                    handleSendTestEmail("reject", {
                      email_type: "status",
                      status: "REJECTED",
                      request_id: 2,
                      request_title: "Logitech MX Master 3S Mouse",
                      reason: "Item rejected: Exceeds department budget allocation for this quarter.",
                    })
                  }
                  className="h-auto py-2.5 px-3 flex flex-col items-start text-left border-rose-200 dark:border-rose-900/50 hover:bg-rose-50/50 dark:hover:bg-rose-950/20"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                    {activeSendingAction === "reject" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    <span>Reject Notice</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
                    Includes reason banner & portal link
                  </span>
                </Button>

                {/* 2. On Hold */}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!!activeSendingAction}
                  onClick={() =>
                    handleSendTestEmail("on_hold", {
                      email_type: "status",
                      status: "ON_HOLD",
                      request_id: 2,
                      request_title: "Dell UltraSharp 27 Monitor",
                      reason: "Placed on hold pending quote comparison from secondary vendor.",
                    })
                  }
                  className="h-auto py-2.5 px-3 flex flex-col items-start text-left border-amber-200 dark:border-amber-900/50 hover:bg-amber-50/50 dark:hover:bg-amber-950/20"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                    {activeSendingAction === "on_hold" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <PauseCircle className="h-3.5 w-3.5" />
                    )}
                    <span>On Hold Notice</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
                    Includes hold justification alert
                  </span>
                </Button>

                {/* 3. Ordered / Purchased */}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!!activeSendingAction}
                  onClick={() =>
                    handleSendTestEmail("purchased", {
                      email_type: "status",
                      status: "PURCHASED",
                      request_id: 2,
                      request_title: "Ergonomic Office Chair & Desk",
                    })
                  }
                  className="h-auto py-2.5 px-3 flex flex-col items-start text-left border-sky-200 dark:border-sky-900/50 hover:bg-sky-50/50 dark:hover:bg-sky-950/20"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400">
                    {activeSendingAction === "purchased" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    <span>Purchased Notice</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
                    Order confirmation & settlement
                  </span>
                </Button>

                {/* 4. Shipped */}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!!activeSendingAction}
                  onClick={() =>
                    handleSendTestEmail("shipped", {
                      email_type: "status",
                      status: "SHIPPED",
                      request_id: 2,
                      request_title: "15x MacBook Pro Power Adapters",
                      tracking_number: "1Z9999999999999999",
                      shipping_note: "Shipped via FedEx Express Priority",
                    })
                  }
                  className="h-auto py-2.5 px-3 flex flex-col items-start text-left border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {activeSendingAction === "shipped" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Truck className="h-3.5 w-3.5" />
                    )}
                    <span>Shipped Notice</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
                    With tracking # & courier details
                  </span>
                </Button>
              </div>
            </div>

            {/* Stale Draft Reminders Section */}
            <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-zinc-800">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Stale Draft Reminder Emails (3+ Days)
              </label>

              <div className="grid grid-cols-1 gap-2">
                {/* 5. Stale Drafts Template Test */}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!!activeSendingAction}
                  onClick={() =>
                    handleSendTestEmail("draft_sample", {
                      email_type: "draft_reminder",
                    })
                  }
                  className="w-full justify-start h-auto py-2.5 px-3 border-amber-200 bg-amber-50/30 dark:bg-amber-950/20 dark:border-amber-900/50 hover:bg-amber-50"
                >
                  <div className="flex items-center gap-2">
                    {activeSendingAction === "draft_sample" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-amber-600 shrink-0" />
                    ) : (
                      <Clock3 className="h-4 w-4 text-amber-600 shrink-0" />
                    )}
                    <div className="text-left">
                      <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
                        Test Stale Drafts Digest Template
                      </div>
                      <div className="text-[10px] text-amber-700/80 dark:text-amber-300/80 font-normal">
                        "You have not submit your purchase request for 2 requests (Order Mouse, Order Laptop)..."
                      </div>
                    </div>
                  </div>
                </Button>

                {/* 6. Live Trigger DB Scan */}
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!!activeSendingAction}
                  onClick={() => handleSendTestEmail("trigger_scan", {})}
                  className="w-full justify-center h-8 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800"
                >
                  {activeSendingAction === "trigger_scan" ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                  ) : (
                    <Send className="h-3 w-3 mr-1.5" />
                  )}
                  <span>Run Live Database Scan & Dispatch (Tasks &gt; 3 Days)</span>
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
