import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/apiClient";

export interface Notification {
  id: number;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link_url: string | null;
  entity_type: string | null;
  entity_id: string | null;
  sender_name: string | null;
  sender_avatar: string | null;
  attachments: any[] | null;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

export function useNotifications(options?: { refetchInterval?: number | false }) {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiClient.get<Notification[]>("/api/notifications"),
    refetchInterval: options?.refetchInterval ?? 5000, // Poll every 5 seconds by default
  });
}

export function useUnreadNotificationCount(options?: { refetchInterval?: number | false }) {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => apiClient.get<{ count: number }>("/api/notifications/unread-count"),
    refetchInterval: options?.refetchInterval ?? 5000, // Poll every 5 seconds by default
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: number) =>
      apiClient.patch(`/api/notifications/${notificationId}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.patch(`/api/notifications/read-all`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });
}

export function useClearReadNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.delete("/api/notifications/read"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });
}


export function useClearAllNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.delete("/api/notifications/all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });
}
