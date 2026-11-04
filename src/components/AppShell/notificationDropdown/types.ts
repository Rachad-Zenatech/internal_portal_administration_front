import { type Notification } from "@/hooks/useNotifications";

export interface RequestGroup {
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

export interface DueDateInfo {
  dueDate: string | null;
  dueLabel: string;
  isOverdue: boolean;
  isDueToday: boolean;
  isDueTomorrow: boolean;
  isDueSoon: boolean;
  diffDays: number | null;
  badgeClass: string;
}

export type NotificationDropdownProps = { onClose: () => void };
