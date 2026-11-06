import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications, useUnreadNotificationCount, useMarkNotificationAsRead, useMarkAllNotificationsAsRead, useClearAllNotifications, type Notification } from "@/hooks/useNotifications";
import { useAuth } from "@/lib/AuthContext";
import { apiClient } from "@/services/apiClient";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PurchaseRequest } from "@/types/purchasing";
import type { RequestGroup, DueDateInfo } from "../types";
import { extractStatus, calculateDueInfo, isRecurringNotification } from "../utils";
import type { NotificationDropdownProps } from "../types";

export function useNotificationDropdownDerived(props: NotificationDropdownProps) {
  const { onClose } = props;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, roles = [], hasRole, hasPermission, canAccessNavigationItem } = useAuth();
  const isSuperAdmin = hasRole("SUPER_ADMIN") || user?.is_super_admin;
  const isRequester = hasRole("REQUESTER") || roles.some((r) => r.code === "REQUESTER");
  const isAP =
    roles.some((r) => {
      const c = (r.code || "").toUpperCase();
      const n = (r.name || "").toUpperCase();
      return (
        c.includes("AP") ||
        c.includes("PAY") ||
        n.includes("AP") ||
        n.includes("PAY")
      );
    }) ||
    hasRole("ACCTS_PAY") ||
    hasRole("AP") ||
    hasRole("ACCOUNTS_PAYABLE");
  const isTreasury = roles.some((r) => {
    const c = (r.code || "").toUpperCase();
    const n = (r.name || "").toUpperCase();
    return c.includes("TREASURY") || n.includes("TREASURY");
  });
  const hasRecurringPermission =
    hasPermission("RECURRING_PAYMENTS_READ") ||
    hasPermission("RECURRING_PAYMENTS_VIEW") ||
    hasPermission("RECURRING_PAYMENTS_UPDATE") ||
    canAccessNavigationItem("RECURRING_PAYMENTS", "PAGE_ACCESS") ||
    canAccessNavigationItem("RECURRING_PAYMENTS", "VIEW");
  // Requester role cannot see the recurring notifications tab
  const canViewRecurringTab =
    isSuperAdmin || (!isRequester && (isAP || isTreasury || hasRecurringPermission));
  const [activeTab, setActiveTab] = useState<"grouped" | "recurring" | "invoices" | "all" | "unread">("grouped");
  useEffect(() => {
    if (!canViewRecurringTab && activeTab === "recurring") {
      setActiveTab("grouped");
    }
  }, [canViewRecurringTab, activeTab]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [isEmailTesterOpen, setIsEmailTesterOpen] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState(user?.email || "alvin.tsang@zenatech.com");
  const [activeSendingAction, setActiveSendingAction] = useState<string | null>(null);
  const { data: notifications = [] } = useNotifications();
  const { data: unreadCountData } = useUnreadNotificationCount();
  const { mutate: markAsRead } = useMarkNotificationAsRead();
  const { mutate: markAllAsRead, isPending: isMarkingAll } = useMarkAllNotificationsAsRead();
  const { mutate: clearAll, isPending: isClearingAll } = useClearAllNotifications();
  // Query live recurring payments with active background synchronization
  const { data: recurringRequests = [] } = useQuery<PurchaseRequest[]>({
    queryKey: ["recurring-requests"],
    queryFn: async () => {
      return await apiClient.get<PurchaseRequest[]>("/api/purchasing/requests?request_type=RECURRING,SCHEDULED_PAYMENT");
    },
    enabled: canViewRecurringTab,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });
  // Toggle review status mutation with instant optimistic UI update
  const reviewMutation = useMutation({
    mutationFn: async ({ id, review_status }: { id: string; review_status: string }) => {
      return await apiClient.patch(`/api/purchasing/requests/${id}/review-status`, { review_status });
    },
    onMutate: async ({ id, review_status }) => {
      await queryClient.cancelQueries({ queryKey: ["recurring-requests"] });
      const prevData = queryClient.getQueryData<PurchaseRequest[]>(["recurring-requests"]);
      queryClient.setQueryData<PurchaseRequest[]>(["recurring-requests"], (old = []) =>
        old.map((item) =>
          String(item.id) === String(id)
            ? { ...item, review_status: review_status as any }
            : item
        )
      );
      return { prevData };
    },
    onError: (err: any, _, context: any) => {
      if (context?.prevData) {
        queryClient.setQueryData(["recurring-requests"], context.prevData);
      }
      toast.error(err?.message || "Failed to update review status");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-requests"] });
      queryClient.invalidateQueries({ queryKey: ["recurring-requests-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["purchasing"] });
      queryClient.invalidateQueries({ queryKey: ["purchasing-summary"] });
    },
    onSuccess: (_, variables) => {
      toast.success(
        `Recurring #${variables.id} marked as ${
          variables.review_status === "REVIEWED" ? "Reviewed" : "Waiting for Review"
        }`
      );
    },
  });
  const totalUnread = unreadCountData?.count ?? 0;
  // Helper to detect AR invoice notifications
  const isInvoiceNotification = (n: Notification): boolean => {
    if (!n) return false;
    const t = (n.type || "").toUpperCase();
    const ent = (n.entity_type || "").toUpperCase();
    const tit = (n.title || "").toLowerCase();
    const msg = (n.message || "").toLowerCase();
    const url = (n.link_url || "").toLowerCase();
    return (
      ent === "ARINVOICE" ||
      ent === "INVOICE" ||
      t.startsWith("AR_INVOICE") ||
      t.includes("INVOICE") ||
      tit.includes("invoice") ||
      msg.includes("invoice") ||
      url.includes("invoices") ||
      url.includes("account-receivable")
    );
  };
  // Separate recurring, invoice, and request notifications
  const recurringNotifications = useMemo(() => {
    return notifications.filter(isRecurringNotification);
  }, [notifications]);
  const invoiceNotifications = useMemo(() => {
    return notifications.filter(isInvoiceNotification);
  }, [notifications]);
  const requestNotifications = useMemo(() => {
    return notifications.filter((n) => !isRecurringNotification(n) && !isInvoiceNotification(n));
  }, [notifications]);
  const unreadRecurringCount = useMemo(() => {
    return recurringNotifications.filter((n) => !n.is_read).length;
  }, [recurringNotifications]);
  const unreadInvoiceCount = useMemo(() => {
    return invoiceNotifications.filter((n) => !n.is_read).length;
  }, [invoiceNotifications]);
  // Unified recurring items list combining live recurring requests and notification history
  const recurringItems = useMemo(() => {
    const notifsByReqId = new Map<string, Notification[]>();
    for (const notif of recurringNotifications) {
      let rId = notif.entity_id;
      if (!rId && notif.link_url) {
        const m = notif.link_url.match(/\/(?:requests|recurring)\/(\d+)/);
        if (m) rId = m[1];
      }
      if (rId) {
        if (!notifsByReqId.has(rId)) notifsByReqId.set(rId, []);
        notifsByReqId.get(rId)!.push(notif);
      }
    }

    const items: Array<{
      id: string;
      title: string;
      amount: number;
      currency: string;
      frequency: string;
      reviewStatus: string;
      workflowStatus: string;
      dueInfo: DueDateInfo;
      notifications: Notification[];
      hasUnread: boolean;
      unreadCount: number;
      latestDate: string;
      linkUrl: string;
    }> = [];

    // 1. Live recurring payments from DB that have updates/notifications
    for (const req of recurringRequests) {
      const idStr = String(req.id);
      const reqNotifs = notifsByReqId.get(idStr) || [];
      if (reqNotifs.length === 0) continue; // Only show recurring requests that have actual updates/notifications

      const dueInfo = calculateDueInfo(req);
      const unreadCount = reqNotifs.filter((n) => !n.is_read).length;
      const reviewStatus = (req.review_status || "WAITING_FOR_REVIEW").toUpperCase();
      const freq = req.recurring_schedule?.frequency || "MONTHLY";

      items.push({
        id: idStr,
        title: req.title || `Recurring Payment #${req.id}`,
        amount: Number(req.amount || 0),
        currency: req.currency || "USD",
        frequency: freq,
        reviewStatus,
        workflowStatus: req.status || "UNDER_REVIEW",
        dueInfo,
        notifications: reqNotifs,
        hasUnread: unreadCount > 0,
        unreadCount,
        latestDate:
          reqNotifs[0]?.created_at ||
          (req as any).updated_at ||
          (req as any).created_at ||
          new Date().toISOString(),
        linkUrl: `/purchasing/requests/${req.id}`,
      });
    }

    // 2. Standalone notifications not mapped to existing recurring tasks
    for (const notif of recurringNotifications) {
      let rId = notif.entity_id;
      if (!rId && notif.link_url) {
        const m = notif.link_url.match(/\/(?:requests|recurring)\/(\d+)/);
        if (m) rId = m[1];
      }
      if (rId && !recurringRequests.some((r) => String(r.id) === rId)) {
        const existing = items.find((itm) => itm.id === rId);
        if (!existing) {
          items.push({
            id: rId,
            title: notif.title || `Recurring Payment #${rId}`,
            amount: 0,
            currency: "USD",
            frequency: "MONTHLY",
            reviewStatus: notif.message?.toLowerCase().includes("reviewed")
              ? "REVIEWED"
              : "WAITING_FOR_REVIEW",
            workflowStatus: "UNDER_REVIEW",
            dueInfo: {
              dueDate: null,
              dueLabel: "Recurring Notification",
              isOverdue: false,
              isDueToday: false,
              isDueTomorrow: false,
              isDueSoon: false,
              diffDays: null,
              badgeClass:
                "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
            },
            notifications: [notif],
            hasUnread: !notif.is_read,
            unreadCount: notif.is_read ? 0 : 1,
            latestDate: notif.created_at,
            linkUrl: notif.link_url || `/purchasing/requests/${rId}`,
          });
        }
      }
    }

    // Sort: Overdue/Due Soon first -> Waiting for Review -> others
    return items.sort((a, b) => {
      if (a.dueInfo.isOverdue && !b.dueInfo.isOverdue) return -1;
      if (!a.dueInfo.isOverdue && b.dueInfo.isOverdue) return 1;
      if (a.dueInfo.isDueToday && !b.dueInfo.isDueToday) return -1;
      if (!a.dueInfo.isDueToday && b.dueInfo.isDueToday) return 1;
      if (a.dueInfo.isDueSoon && !b.dueInfo.isDueSoon) return -1;
      if (!a.dueInfo.isDueSoon && b.dueInfo.isDueSoon) return 1;
      if (a.reviewStatus === "WAITING_FOR_REVIEW" && b.reviewStatus === "REVIEWED") return -1;
      if (a.reviewStatus === "REVIEWED" && b.reviewStatus === "WAITING_FOR_REVIEW") return 1;
      return new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime();
    });
  }, [recurringRequests, recurringNotifications]);
  // Calculate badge counter for recurring tab: Unread recurring updates count
  const recurringAlertsCount = useMemo(() => {
    return recurringItems.reduce((acc, item) => acc + item.unreadCount, 0);
  }, [recurringItems]);
  // Group purchase request notifications by Request ID
  const requestGroups = useMemo<RequestGroup[]>(() => {
    const map = new Map<string, RequestGroup>();

    for (const notif of requestNotifications) {
      let reqId = notif.entity_id;
      if (!reqId && notif.link_url) {
        const m = notif.link_url.match(/\/requests\/(\d+)/);
        if (m) reqId = m[1];
      }

      let title = notif.title || "";
      if (
        title.startsWith("Request #") ||
        title.startsWith("Request Approved") ||
        title.startsWith("Request Rejected") ||
        title.startsWith("Order Purchased") ||
        title.startsWith("Order Shipped") ||
        title.startsWith("Request On Hold")
      ) {
        const m = title.match(/'([^']+)'/);
        if (m) {
          title = m[1];
        } else {
          title = title.replace(/^Request\s+#\d+:\s*/i, "").trim();
        }
      } else {
        title = title
          .replace(
            /^New purchase request|^Status changed for Request|^New recurring payment assigned|^New Accounts Payable request/i,
            ""
          )
          .trim();
        if (title.startsWith("(") && title.endsWith(")")) title = title.slice(1, -1);
      }

      const groupKey = reqId ? `req-${reqId}` : `other-${notif.id}`;

      if (!map.has(groupKey)) {
        map.set(groupKey, {
          key: groupKey,
          requestId: reqId || null,
          requestTitle: title || (reqId ? `Request #${reqId}` : "General Notification"),
          linkUrl: notif.link_url || (reqId ? `/purchasing/requests/${reqId}` : null),
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
  }, [requestNotifications]);
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
      } else if (actionKey === "recurring_trigger_reminders") {
        const res: any = await apiClient.post("/api/purchasing/recurring/send-due-reminders?force=true", {
          sender_email: testEmailRecipient,
        });
        toast.success(res?.message || "Recurring due reminder scan dispatched.");
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
  return { navigate, canViewRecurringTab, activeTab, setActiveTab, expandedGroups, isEmailTesterOpen, setIsEmailTesterOpen, testEmailRecipient, setTestEmailRecipient, activeSendingAction, notifications, markAsRead, markAllAsRead, isMarkingAll, clearAll, isClearingAll, reviewMutation, totalUnread, recurringNotifications, invoiceNotifications, unreadRecurringCount, unreadInvoiceCount, recurringItems, recurringAlertsCount, requestGroups, toggleGroup, handleOpenLink, filteredNotifications, handleSendTestEmail };
}
