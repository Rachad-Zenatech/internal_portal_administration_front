import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/services/apiClient";
import { useAuth } from "@/lib/AuthContext";

export interface PurchasingEmailNotificationSettings {
  master_enabled: boolean;
  on_request_created_or_assigned: boolean;
  on_status_changed: boolean;
  on_new_message: boolean;
  payables_morning_digest_enabled: boolean;
}

const DEFAULT_EMAIL_SETTINGS: PurchasingEmailNotificationSettings = {
  master_enabled: true,
  on_request_created_or_assigned: true,
  on_status_changed: true,
  on_new_message: true,
  payables_morning_digest_enabled: true,
};

export function useEmailNotificationsSettings(open: boolean, canManageAdminSettings: boolean) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: emailData, isLoading: isLoadingEmailSettings } = useQuery<PurchasingEmailNotificationSettings>({
    queryKey: ["purchasing-email-notification-settings"],
    queryFn: () =>
      apiClient.get<PurchasingEmailNotificationSettings>("/api/purchasing/settings/email-notifications"),
    enabled: open && canManageAdminSettings,
  });

  const [emailForm, setEmailForm] = useState<PurchasingEmailNotificationSettings>(DEFAULT_EMAIL_SETTINGS);
  const [testPayableEmail, setTestPayableEmail] = useState<string>(user?.email || "");
  const [testPayableDaysAhead, setTestPayableDaysAhead] = useState<number>(0);

  useEffect(() => {
    if (emailData) {
      setEmailForm({
        master_enabled: emailData.master_enabled ?? true,
        on_request_created_or_assigned: emailData.on_request_created_or_assigned ?? true,
        on_status_changed: emailData.on_status_changed ?? true,
        on_new_message: emailData.on_new_message ?? true,
        payables_morning_digest_enabled: emailData.payables_morning_digest_enabled ?? true,
      });
    }
  }, [emailData]);

  useEffect(() => {
    if (open && !testPayableEmail && user?.email) {
      setTestPayableEmail(user.email);
    }
  }, [open, testPayableEmail, user?.email]);

  const saveEmailSettingsMutation = useMutation({
    mutationFn: (payload: PurchasingEmailNotificationSettings) =>
      apiClient.put<PurchasingEmailNotificationSettings>(
        "/api/purchasing/settings/email-notifications",
        payload,
        { skipGlobalLoading: true }
      ),
    onSuccess: (saved) => {
      setEmailForm(saved);
      queryClient.setQueryData(["purchasing-email-notification-settings"], saved);
      toast.success("Email notification settings updated");
    },
    onError: (err: any) => {
      if (emailData) setEmailForm(emailData);
      toast.error(err?.message || "Failed to update email notification settings");
    },
  });

  const toggleEmailSetting = (key: keyof PurchasingEmailNotificationSettings, nextValue: boolean) => {
    const next = { ...emailForm, [key]: nextValue };
    setEmailForm(next);
    saveEmailSettingsMutation.mutate(next);
  };

  const sendTestPayableEmailMutation = useMutation({
    mutationFn: ({ email, daysAhead }: { email: string; daysAhead: number }) => {
      const cleanEmail = email.trim();
      const params = new URLSearchParams({
        force: "true",
        days_ahead: String(Math.max(0, daysAhead || 0)),
      });
      if (cleanEmail) {
        params.set("test_email", cleanEmail);
      }
      return apiClient.post<any>(
        `/api/purchasing/payables/send-due-digest?${params.toString()}`,
        {},
        {
          actionLabel: "Sending Test Payable Email",
          actionSubtitle: "Building payables digest and dispatching test email...",
        }
      );
    },
    onSuccess: (res: any) => {
      const recipients = Array.isArray(res?.recipients) ? res.recipients.join(", ") : testPayableEmail;
      toast.success(res?.message || `Test payable email sent to ${recipients || "recipient"}`);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to send test payable email");
    },
  });

  const handleSendTestPayableEmail = () => {
    const clean = testPayableEmail.trim();
    if (!clean || !clean.includes("@")) {
      toast.error("Please enter a valid recipient email address");
      return;
    }
    sendTestPayableEmailMutation.mutate({ email: clean, daysAhead: testPayableDaysAhead });
  };

  return {
    emailForm,
    isLoadingEmailSettings,
    saveEmailSettingsMutation,
    toggleEmailSetting,
    testPayableEmail,
    setTestPayableEmail,
    testPayableDaysAhead,
    setTestPayableDaysAhead,
    sendTestPayableEmailMutation,
    handleSendTestPayableEmail,
  };
}
