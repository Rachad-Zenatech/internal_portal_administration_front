import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/services/apiClient";
import { arInvoiceService, type ARDueDateReminderSettings } from "@/services/arInvoiceService";
import { useAuth } from "@/lib/AuthContext";
import type { OnHoldReminderSettings, RecurringNotificationSettings } from "@/types/purchasing";
import type { GlobalSettingsDialogProps } from "../types";

export function useGlobalSettingsDialogActions(props: GlobalSettingsDialogProps) {
  const { open } = props;
  const queryClient = useQueryClient();
  const { user, roles = [], hasRole } = useAuth();
  const isSuperAdmin = hasRole("SUPER_ADMIN") || user?.is_super_admin;
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
  const isTreasury =
    roles.some((r) => {
      const c = (r.code || "").toUpperCase();
      const n = (r.name || "").toUpperCase();
      return c.includes("TREASURY") || n.includes("TREASURY");
    }) || hasRole("TREASURY");
  const isPurchasing =
    roles.some((r) => {
      const c = (r.code || "").toUpperCase();
      const n = (r.name || "").toUpperCase();
      return c.includes("PURCHAS") || n.includes("PURCHAS");
    }) ||
    hasRole("PURCHASING") ||
    hasRole("PURCHASING_TEAM");
  const isRequester =
    hasRole("REQUESTER") ||
    roles.some((r) => (r.code || "").toUpperCase() === "REQUESTER");
  // Admin / Workflow settings (On-Hold Reminders, Recurring Due Dates, AR Invoices)
  const canManageAdminSettings =
    Boolean(isSuperAdmin || (!isRequester && !isPurchasing && (isAP || isTreasury)));
  const [activeTab, setActiveTab] = useState<"hold" | "recurring" | "ar-invoices" | "preferences">(
    canManageAdminSettings ? "hold" : "preferences"
  );
  useEffect(() => {
    if (!canManageAdminSettings && activeTab !== "preferences") {
      setActiveTab("preferences");
    }
  }, [canManageAdminSettings, activeTab]);
  // AR Invoice Due Date Reminders State
  const { data: arReminderSettings } = useQuery<ARDueDateReminderSettings>({
    queryKey: ["ar-due-date-reminder-settings"],
    queryFn: () => arInvoiceService.getDueDateReminderSettings(),
    enabled: open && canManageAdminSettings,
  });
  const [arReminderForm, setArReminderForm] = useState<ARDueDateReminderSettings>({
    enabled: true,
    days_threshold: 7,
    monthly_enabled: true,
    monthly_days_threshold: 7,
    annual_enabled: true,
    annual_days_threshold: 60,
    notify_customer_email: true,
    notify_in_app: true,
    sender_email: "accounting@paceplus.com",
    sender_name: "Pace Plus Accounts Receivable",
    email_subject: "Invoice Payment Reminder - Due Soon ({invoice_number})",
    custom_message: "This is a friendly reminder that your invoice is due soon. Please review the attached statement and remit payment.",
  });
  useEffect(() => {
    if (arReminderSettings) {
      setArReminderForm({
        enabled: arReminderSettings.enabled ?? true,
        days_threshold: arReminderSettings.days_threshold ?? 7,
        monthly_enabled: arReminderSettings.monthly_enabled ?? true,
        monthly_days_threshold: arReminderSettings.monthly_days_threshold ?? (arReminderSettings.days_threshold ?? 7),
        annual_enabled: arReminderSettings.annual_enabled ?? true,
        annual_days_threshold: arReminderSettings.annual_days_threshold ?? 60,
        notify_customer_email: arReminderSettings.notify_customer_email ?? true,
        notify_in_app: arReminderSettings.notify_in_app ?? true,
        sender_email: arReminderSettings.sender_email || "accounting@paceplus.com",
        sender_name: arReminderSettings.sender_name || "Pace Plus Accounts Receivable",
        email_subject: arReminderSettings.email_subject || "Invoice Payment Reminder - Due Soon ({invoice_number})",
        custom_message: arReminderSettings.custom_message || "This is a friendly reminder that your invoice is due soon. Please review the attached statement and remit payment.",
      });
    }
  }, [arReminderSettings]);
  const saveArReminderMutation = useMutation({
    mutationFn: (payload: ARDueDateReminderSettings) =>
      arInvoiceService.saveDueDateReminderSettings(payload),
    onSuccess: () => {
      toast.success("A/R invoice due date reminder settings saved successfully");
      queryClient.invalidateQueries({ queryKey: ["ar-due-date-reminder-settings"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to save A/R invoice reminder settings");
    },
  });
  const testTriggerArReminderMutation = useMutation({
    mutationFn: (days?: number | void) =>
      arInvoiceService.triggerDueDateRemindersTest(typeof days === "number" ? days : undefined),
    onSuccess: (res: any) => {
      const count = res?.sent_count ?? res?.reminders_sent ?? 0;
      const checked = res?.processed_count ?? res?.invoices_checked ?? 0;
      if (count === 0) {
        toast.info(
          `Scanned ${checked} open invoice(s) (Monthly: ${arReminderForm.monthly_days_threshold ?? 7}d, Annual: ${arReminderForm.annual_days_threshold ?? 60}d): No pending reminder notices required.`
        );
      } else {
        toast.success(`Dispatched payment due reminders for ${count} invoice(s) across ${checked} open invoice(s)!`);
      }
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to trigger invoice reminder test");
    },
  });
  // On-Hold Reminders State
  const { data: holdSettings } = useQuery<OnHoldReminderSettings>({
    queryKey: ["on-hold-reminder-settings"],
    queryFn: () => apiClient.get<OnHoldReminderSettings>("/api/purchasing/settings/on-hold-reminders"),
    enabled: open && canManageAdminSettings,
  });
  const [holdForm, setHoldForm] = useState<OnHoldReminderSettings>({
    enabled: true,
    days_threshold: 10,
    reminder_time: "09:00",
    timezone: "America/New_York",
    notify_ap: true,
    notify_treasury: true,
    notify_requester: true,
    custom_emails: [],
  });
  const [customEmailHoldInput, setCustomEmailHoldInput] = useState("");
  useEffect(() => {
    if (holdSettings) {
      setHoldForm({
        enabled: holdSettings.enabled ?? true,
        days_threshold: holdSettings.days_threshold ?? 10,
        reminder_time: holdSettings.reminder_time || "09:00",
        timezone: holdSettings.timezone || "America/New_York",
        notify_ap: holdSettings.notify_ap ?? true,
        notify_treasury: holdSettings.notify_treasury ?? true,
        notify_requester: holdSettings.notify_requester ?? true,
        custom_emails: holdSettings.custom_emails || [],
      });
    }
  }, [holdSettings]);
  const saveHoldMutation = useMutation({
    mutationFn: (payload: OnHoldReminderSettings) =>
      apiClient.put<OnHoldReminderSettings>("/api/purchasing/settings/on-hold-reminders", payload),
    onSuccess: () => {
      toast.success("On-Hold reminder settings saved successfully");
      queryClient.invalidateQueries({ queryKey: ["on-hold-reminder-settings"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to save On-Hold reminder settings");
    },
  });
  const testTriggerHoldMutation = useMutation({
    mutationFn: (days?: number) =>
      apiClient.post<any>(`/api/purchasing/settings/on-hold-reminders/test-trigger${days ? `?days_threshold=${days}` : ""}`),
    onSuccess: (res: any) => {
      if (res?.held_count === 0) {
        toast.info(`Scanned for on-hold items (>= ${holdForm.days_threshold} days): No items found currently.`);
      } else {
        toast.success(`Dispatched on-hold reminders for ${res.held_count} item(s) to ${res.emails_sent} recipient(s)!`);
      }
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to trigger on-hold test reminder");
    },
  });
  // Recurring Reminders State
  const { data: recSettings } = useQuery<RecurringNotificationSettings>({
    queryKey: ["recurring-notification-settings"],
    queryFn: () => apiClient.get<RecurringNotificationSettings>("/api/purchasing/recurring/notification-settings"),
    enabled: open && canManageAdminSettings,
  });
  const [recForm, setRecForm] = useState<RecurringNotificationSettings>({
    enabled: true,
    days_ahead: 7,
    reminder_time: "08:30",
    timezone: "America/New_York",
    include_requester: true,
    include_ap: true,
    include_treasury: true,
    custom_emails: [],
  });
  const [customEmailRecInput, setCustomEmailRecInput] = useState("");
  useEffect(() => {
    if (recSettings) {
      setRecForm({
        enabled: recSettings.enabled ?? true,
        days_ahead: recSettings.days_ahead ?? 7,
        reminder_time: recSettings.reminder_time || "08:30",
        timezone: recSettings.timezone || "America/New_York",
        include_requester: recSettings.include_requester ?? true,
        include_ap: recSettings.include_ap ?? true,
        include_treasury: recSettings.include_treasury ?? true,
        custom_emails: recSettings.custom_emails || [],
      });
    }
  }, [recSettings]);
  const saveRecMutation = useMutation({
    mutationFn: (payload: RecurringNotificationSettings) =>
      apiClient.put<RecurringNotificationSettings>("/api/purchasing/recurring/notification-settings", payload),
    onSuccess: () => {
      toast.success("Recurring notification settings saved");
      queryClient.invalidateQueries({ queryKey: ["recurring-notification-settings"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to save recurring notification settings");
    },
  });
  const testTriggerRecMutation = useMutation({
    mutationFn: (days?: number) =>
      apiClient.post<any>(
        `/api/purchasing/recurring/send-due-reminders?force=true${days ? `&days_ahead=${days}` : ""}`,
        {}
      ),
    onSuccess: (res: any) => {
      const count = res?.count ?? res?.items_found ?? 0;
      if (count === 0) {
        toast.info(`Scanned for recurring items due within ${recForm.days_ahead} days: No upcoming items found.`);
      } else {
        toast.success(`Dispatched due date reminders for ${count} item(s)!`);
      }
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to trigger recurring reminder test");
    },
  });
  const handleAddCustomEmailHold = () => {
    if (!customEmailHoldInput || !customEmailHoldInput.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    const clean = customEmailHoldInput.trim().toLowerCase();
    if (!holdForm.custom_emails?.includes(clean)) {
      setHoldForm((prev) => ({
        ...prev,
        custom_emails: [...(prev.custom_emails || []), clean],
      }));
    }
    setCustomEmailHoldInput("");
  };
  const handleRemoveCustomEmailHold = (email: string) => {
    setHoldForm((prev) => ({
      ...prev,
      custom_emails: (prev.custom_emails || []).filter((e) => e !== email),
    }));
  };
  const handleAddCustomEmailRec = () => {
    if (!customEmailRecInput || !customEmailRecInput.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    const clean = customEmailRecInput.trim().toLowerCase();
    if (!recForm.custom_emails?.includes(clean)) {
      setRecForm((prev) => ({
        ...prev,
        custom_emails: [...(prev.custom_emails || []), clean],
      }));
    }
    setCustomEmailRecInput("");
  };
  const handleRemoveCustomEmailRec = (email: string) => {
    setRecForm((prev) => ({
      ...prev,
      custom_emails: (prev.custom_emails || []).filter((e) => e !== email),
    }));
  };
  return { canManageAdminSettings, activeTab, setActiveTab, arReminderForm, setArReminderForm, saveArReminderMutation, testTriggerArReminderMutation, holdForm, setHoldForm, customEmailHoldInput, setCustomEmailHoldInput, saveHoldMutation, testTriggerHoldMutation, recForm, setRecForm, customEmailRecInput, setCustomEmailRecInput, saveRecMutation, testTriggerRecMutation, handleAddCustomEmailHold, handleRemoveCustomEmailHold, handleAddCustomEmailRec, handleRemoveCustomEmailRec };
}
