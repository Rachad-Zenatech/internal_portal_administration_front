import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/services/apiClient";
import { useWorkflowAssignments } from "@/hooks/usePurchasing";
import type { PurchaseRequest, RequestDetail, BatchNotificationSettings } from "@/types/purchasing";
import { toast } from "sonner";

export function useBatchApprovalData() {
  const { data: assignments = [] } = useWorkflowAssignments();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [actionComment, setActionComment] = useState("");
  // Fetch all requests in WAITING_APPROVAL
  const { data: requests = [], isLoading } = useQuery<PurchaseRequest[]>({
    queryKey: ["batch-waiting-approvals"],
    queryFn: async () => {
      return await apiClient.get<PurchaseRequest[]>(
        "/api/purchasing/requests?status=WAITING_APPROVAL"
      );
    },
  });
  // Fetch batch notification settings
  const { data: notifSettings, refetch: refetchSettings } = useQuery<BatchNotificationSettings>({
    queryKey: ["batch-notification-settings"],
    queryFn: async () => {
      return await apiClient.get<BatchNotificationSettings>(
        "/api/purchasing/batch-notification-settings"
      );
    },
  });
  const [settingsForm, setSettingsForm] = useState<BatchNotificationSettings>({
    enabled: true,
    midday_time: "12:00",
    end_of_day_time: "17:00",
    timezone: "America/New_York",
    recipient_role: "MANAGER",
    custom_emails: [],
  });
  // Batch approve mutation
  const approveMutation = useMutation({
    mutationFn: async ({ request_ids, comment }: { request_ids: number[]; comment?: string }) => {
      return await apiClient.post<RequestDetail[]>("/api/purchasing/batch-approve", {
        request_ids,
        comment,
      });
    },
    onSuccess: (res) => {
      toast.success(`Successfully approved ${res.length} request(s)`);
      setSelectedIds([]);
      setIsApproveOpen(false);
      setActionComment("");
      queryClient.invalidateQueries({ queryKey: ["batch-waiting-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["purchasing-summary"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Batch approval failed");
    },
  });
  // Batch reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ request_ids, comment }: { request_ids: number[]; comment?: string }) => {
      return await apiClient.post<RequestDetail[]>("/api/purchasing/batch-reject", {
        request_ids,
        comment,
      });
    },
    onSuccess: (res) => {
      toast.success(`Successfully rejected ${res.length} request(s)`);
      setSelectedIds([]);
      setIsRejectOpen(false);
      setActionComment("");
      queryClient.invalidateQueries({ queryKey: ["batch-waiting-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["purchasing-summary"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Batch rejection failed");
    },
  });
  // Trigger manual notification mutation
  const notifyMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.post<any>("/api/purchasing/batch-notify", {});
    },
    onSuccess: (res) => {
      if (res.sent) {
        toast.success(`Batch approval notification sent to managers (${res.recipients?.join(", ") || "Configured recipients"})`);
      } else {
        toast.info(res.message || "Notification completed");
      }
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to trigger notification");
    },
  });
  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (payload: BatchNotificationSettings) => {
      return await apiClient.put<BatchNotificationSettings>(
        "/api/purchasing/batch-notification-settings",
        payload
      );
    },
    onSuccess: () => {
      toast.success("Batch notification settings saved successfully");
      setIsSettingsOpen(false);
      refetchSettings();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to save settings");
    },
  });
  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (searchTerm && searchTerm.trim()) {
        const rawTerm = searchTerm.toLowerCase().trim();
        const cleanIdTerm = rawTerm.replace(/^(?:req-#|req-|rec-#|rec-|#)/i, "").trim();
        const idStr = String(r.id ?? "").toLowerCase();
        const titleStr = String(r.title ?? "").toLowerCase();
        const reqStr = String(r.requester ?? "").toLowerCase();
        const deptStr = String(r.department ?? "").toLowerCase();
        const descStr = String(r.description ?? "").toLowerCase();

        const matches =
          idStr.includes(rawTerm) ||
          (cleanIdTerm.length > 0 && idStr.includes(cleanIdTerm)) ||
          titleStr.includes(rawTerm) ||
          reqStr.includes(rawTerm) ||
          deptStr.includes(rawTerm) ||
          descStr.includes(rawTerm);

        if (!matches) {
          return false;
        }
      }
      return true;
    });
  }, [requests, searchTerm]);
  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredRequests.map((r) => parseInt(r.id)));
    } else {
      setSelectedIds([]);
    }
  };
  const handleSelectRow = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };
  const selectedTotalAmount = useMemo(() => {
    return requests
      .filter((r) => selectedIds.includes(parseInt(r.id)))
      .reduce((sum, r) => sum + (r.amount || 0), 0);
  }, [requests, selectedIds]);
  const allSelected =
    filteredRequests.length > 0 &&
    filteredRequests.every((r) => selectedIds.includes(parseInt(r.id)));
  return { assignments, navigate, selectedIds, searchTerm, setSearchTerm, isApproveOpen, setIsApproveOpen, isRejectOpen, setIsRejectOpen, isSettingsOpen, setIsSettingsOpen, actionComment, setActionComment, requests, isLoading, notifSettings, settingsForm, setSettingsForm, approveMutation, rejectMutation, notifyMutation, saveSettingsMutation, filteredRequests, handleSelectAll, handleSelectRow, selectedTotalAmount, allSelected };
}
