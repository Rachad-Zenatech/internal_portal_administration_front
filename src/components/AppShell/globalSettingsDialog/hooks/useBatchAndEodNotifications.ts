import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/services/apiClient";
import type { BatchNotificationSettings } from "@/types/purchasing";

export interface PurchasingEodReminderSettings {
  enabled: boolean;
  reminder_time: string;
  timezone: string;
  stale_drafts_enabled: boolean;
  unanswered_messages_enabled: boolean;
}

export function useBatchAndEodNotifications(open: boolean, canManageAdminSettings: boolean) {
  const queryClient = useQueryClient();

  const { data: batchData } = useQuery<BatchNotificationSettings>({
    queryKey: ["batch-notification-settings"],
    queryFn: () => apiClient.get<BatchNotificationSettings>("/api/purchasing/batch-notification-settings"),
    enabled: open && canManageAdminSettings,
  });

  const [batchForm, setBatchForm] = useState<BatchNotificationSettings>({
    enabled: true,
    midday_time: "12:00",
    end_of_day_time: "17:00",
    timezone: "America/New_York",
    recipient_role: "MANAGER",
    custom_emails: [],
  });

  useEffect(() => {
    if (batchData) {
      setBatchForm({
        enabled: batchData.enabled ?? true,
        midday_time: batchData.midday_time || "12:00",
        end_of_day_time: batchData.end_of_day_time || "17:00",
        timezone: batchData.timezone || "America/New_York",
        recipient_role: batchData.recipient_role || "MANAGER",
        custom_emails: batchData.custom_emails || [],
      });
    }
  }, [batchData]);

  const saveBatchMutation = useMutation({
    mutationFn: (payload: BatchNotificationSettings) =>
      apiClient.put<BatchNotificationSettings>("/api/purchasing/batch-notification-settings", payload),
    onSuccess: () => {
      toast.success("Batch approval notification settings saved");
      queryClient.invalidateQueries({ queryKey: ["batch-notification-settings"] });
    },
    onError: (err: any) => toast.error(err?.message || "Failed to save batch notification settings"),
  });

  const triggerBatchMutation = useMutation({
    mutationFn: () => apiClient.post<any>("/api/purchasing/batch-notify", {}),
    onSuccess: (res: any) => {
      if (res?.sent) toast.success(`Batch digest sent (${res.recipients?.join(", ") || "managers"})`);
      else toast.info(res?.message || "No pending approvals to notify");
    },
    onError: (err: any) => toast.error(err?.message || "Failed to trigger batch notification"),
  });

  const { data: eodData } = useQuery<PurchasingEodReminderSettings>({
    queryKey: ["purchasing-eod-reminder-settings"],
    queryFn: () => apiClient.get<PurchasingEodReminderSettings>("/api/purchasing/settings/eod-reminders"),
    enabled: open && canManageAdminSettings,
  });

  const [eodForm, setEodForm] = useState<PurchasingEodReminderSettings>({
    enabled: true,
    reminder_time: "17:00",
    timezone: "America/New_York",
    stale_drafts_enabled: true,
    unanswered_messages_enabled: true,
  });

  useEffect(() => {
    if (eodData) setEodForm(eodData);
  }, [eodData]);

  const saveEodMutation = useMutation({
    mutationFn: (payload: PurchasingEodReminderSettings) =>
      apiClient.put<PurchasingEodReminderSettings>("/api/purchasing/settings/eod-reminders", payload),
    onSuccess: () => {
      toast.success("End-of-day purchasing reminder settings saved");
      queryClient.invalidateQueries({ queryKey: ["purchasing-eod-reminder-settings"] });
    },
    onError: (err: any) => toast.error(err?.message || "Failed to save EOD reminder settings"),
  });

  return { batchForm, setBatchForm, saveBatchMutation, triggerBatchMutation, eodForm, setEodForm, saveEodMutation };
}
