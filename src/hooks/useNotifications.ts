import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, BASE_URL } from "@/services/apiClient";

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

/**
 * Hook to subscribe to real-time notifications over WebSocket with automatic
 * reconnect.
 *
 * This previously used SSE (/api/notifications/stream). CloudFront caps the
 * total duration of a streaming HTTP response at ~60s, so the stream was
 * severed every minute and the browser reconnected in a permanent loop
 * (ERR_HTTP2_PROTOCOL_ERROR alongside a 200). WebSockets are not subject to
 * that cap, so the connection stays up.
 */
export function useNotificationStream() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;

    const toWebSocketScheme = (url: string) => url.replace(/^http/i, "ws");

    const connect = () => {
      if (!isMounted) return;
      try {
        const base = /^https?:\/\//i.test(BASE_URL)
          ? toWebSocketScheme(BASE_URL)
          : `${toWebSocketScheme(window.location.origin)}${BASE_URL}`;
        const token = sessionStorage.getItem("token");
        const tokenParam = token ? `?token=${encodeURIComponent(token)}` : "";

        socket = new WebSocket(`${base}/ws/notifications${tokenParam}`);

        socket.onmessage = (event) => {
          if (!event.data) return;
          try {
            const data = JSON.parse(event.data);
            // Keep-alive frames carry no notification payload.
            if (!data || data.type === "ping") return;
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
          } catch {
            // Ignore non-JSON frames
          }
        };

        socket.onclose = () => {
          socket = null;
          if (isMounted) {
            reconnectTimeout = setTimeout(connect, 5000);
          }
        };

        socket.onerror = () => {
          // onclose always follows and owns the reconnect.
          socket?.close();
        };
      } catch {
        if (isMounted) {
          reconnectTimeout = setTimeout(connect, 5000);
        }
      }
    };

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socket) {
        // Detach before closing so unmount does not schedule a reconnect and
        // leave an extra socket behind.
        socket.onclose = null;
        socket.close();
      }
    };
  }, [queryClient]);
}

export function useNotifications(options?: { refetchInterval?: number | false }) {
  useNotificationStream();
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiClient.get<Notification[]>("/api/notifications"),
    refetchInterval: options?.refetchInterval ?? false,
    refetchOnWindowFocus: true,
  });
}

export function useUnreadNotificationCount(options?: { refetchInterval?: number | false }) {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => apiClient.get<{ count: number }>("/api/notifications/unread-count"),
    refetchInterval: options?.refetchInterval ?? false,
    refetchOnWindowFocus: true,
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
