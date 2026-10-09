import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Settings,
  Bell,
  Clock,
  Mail,
  ShieldCheck,
  Send,
  Loader2,
  Check,
  PauseCircle,
  Calendar,
  Laptop,
  Receipt,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/services/apiClient";
import { arInvoiceService, type ARDueDateReminderSettings } from "@/services/arInvoiceService";
import { useAuth } from "@/lib/AuthContext";
import type { OnHoldReminderSettings, RecurringNotificationSettings } from "@/types/purchasing";

interface GlobalSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inAppAlerts: boolean;
  setInAppAlerts: (val: boolean) => void;
  windowsNotifications: boolean;
  onToggleWindowsNotifications: () => void;
  onTestWindowsNotification: () => void;
}

export default function GlobalSettingsDialog({
  open,
  onOpenChange,
  inAppAlerts,
  setInAppAlerts,
  windowsNotifications,
  onToggleWindowsNotifications,
  onTestWindowsNotification,
}: GlobalSettingsDialogProps) {
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
    mutationFn: (days?: number) =>
      arInvoiceService.triggerDueDateRemindersTest(days),
    onSuccess: (res: any) => {
      const count = res?.reminders_sent ?? 0;
      const checked = res?.invoices_checked ?? 0;
      if (count === 0) {
        toast.info(`Scanned ${checked} open invoice(s) due within ${arReminderForm.days_threshold} days: No pending reminder notices required.`);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[880px] md:max-w-[920px] p-0 overflow-hidden rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-950">
        <DialogHeader className="p-6 pb-4 bg-slate-50/80 dark:bg-zinc-900/60 border-b border-slate-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50 shadow-xs">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                System & Notification Settings
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {canManageAdminSettings
                  ? "Configure automated email reminders, on-hold follow-up rules, and portal alerts."
                  : "Configure your portal notifications and desktop alerts."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          {canManageAdminSettings && (
            <div className="px-6 py-3 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/40 dark:bg-zinc-900/30">
              <TabsList className="grid grid-cols-2 sm:grid-cols-4 h-auto sm:h-10 w-full bg-slate-200/70 dark:bg-zinc-800/70 p-1 rounded-xl gap-1">
                <TabsTrigger
                  value="hold"
                  className="text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 h-8 rounded-lg transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs data-[state=active]:text-slate-900 dark:data-[state=active]:text-zinc-100"
                >
                  <PauseCircle className="h-4 w-4 text-amber-500 shrink-0" />
                  <span className="truncate">On-Hold</span>
                </TabsTrigger>
                <TabsTrigger
                  value="recurring"
                  className="text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 h-8 rounded-lg transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs data-[state=active]:text-slate-900 dark:data-[state=active]:text-zinc-100"
                >
                  <Calendar className="h-4 w-4 text-indigo-500 shrink-0" />
                  <span className="truncate">Purchasing Due</span>
                </TabsTrigger>
                <TabsTrigger
                  value="ar-invoices"
                  className="text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 h-8 rounded-lg transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs data-[state=active]:text-slate-900 dark:data-[state=active]:text-zinc-100"
                >
                  <Receipt className="h-4 w-4 text-blue-500 shrink-0" />
                  <span className="truncate">Invoice Due Reminders</span>
                </TabsTrigger>
                <TabsTrigger
                  value="preferences"
                  className="text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 h-8 rounded-lg transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs data-[state=active]:text-slate-900 dark:data-[state=active]:text-zinc-100"
                >
                  <Bell className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="truncate">App & Alerts</span>
                </TabsTrigger>
              </TabsList>
            </div>
          )}

          <div className="p-6 max-h-[65vh] overflow-y-auto space-y-6">
            {/* 1. ON-HOLD REMINDERS */}
            <TabsContent value="hold" className="mt-0 space-y-5 outline-none">
              <div className="flex items-center justify-between p-4 rounded-xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="hold-toggle" className="text-sm font-bold text-amber-950 dark:text-amber-200">
                      Enable Long-Held Items Reminder
                    </Label>
                    <Badge variant="outline" className="text-[10px] bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border-amber-300">
                      AP & Treasury
                    </Badge>
                  </div>
                  <p className="text-xs text-amber-900/70 dark:text-amber-300/70">
                    Automatically scans and notifies AP & Treasury assigned users when purchase/recurring items remain on hold.
                  </p>
                </div>
                <input
                  id="hold-toggle"
                  type="checkbox"
                  checked={holdForm.enabled}
                  onChange={(e) => setHoldForm({ ...holdForm, enabled: e.target.checked })}
                  className="h-5 w-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Hold Duration Threshold (Days)
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={180}
                      value={holdForm.days_threshold}
                      onChange={(e) =>
                        setHoldForm({ ...holdForm, days_threshold: Math.max(1, parseInt(e.target.value) || 1) })
                      }
                      className="h-10 font-mono font-bold text-sm bg-slate-50/50 dark:bg-zinc-900/50"
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">Days on Hold</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[5, 7, 10, 14, 30].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setHoldForm({ ...holdForm, days_threshold: d })}
                        className={`text-[11px] px-2 py-0.5 rounded border transition-all cursor-pointer ${
                          holdForm.days_threshold === d
                            ? "bg-amber-500 text-white border-amber-600 font-bold"
                            : "bg-slate-100 dark:bg-zinc-800 text-muted-foreground hover:text-foreground border-slate-200 dark:border-zinc-700"
                        }`}
                      >
                        {d} days {d === 10 ? "(Default)" : ""}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Daily Dispatch Time (EST)
                  </Label>
                  <Input
                    type="time"
                    value={holdForm.reminder_time}
                    onChange={(e) => setHoldForm({ ...holdForm, reminder_time: e.target.value })}
                    className="h-10 font-mono text-sm bg-slate-50/50 dark:bg-zinc-900/50"
                  />
                  <p className="text-[11px] text-muted-foreground">Runs automatically once per day in the background.</p>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Target Notification Roles
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900/50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={holdForm.notify_ap}
                      onChange={(e) => setHoldForm({ ...holdForm, notify_ap: e.target.checked })}
                      className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="text-xs">
                      <div className="font-bold text-slate-800 dark:text-zinc-200">Accounts Payable (AP)</div>
                      <div className="text-muted-foreground text-[11px]">Notify AP users assigned to requests</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900/50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={holdForm.notify_treasury}
                      onChange={(e) => setHoldForm({ ...holdForm, notify_treasury: e.target.checked })}
                      className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="text-xs">
                      <div className="font-bold text-slate-800 dark:text-zinc-200">Treasury Team</div>
                      <div className="text-muted-foreground text-[11px]">Notify Treasury users and assignees</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  Additional Custom Email Recipients
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="finance-leads@zenatech.com"
                    value={customEmailHoldInput}
                    onChange={(e) => setCustomEmailHoldInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCustomEmailHold())}
                    className="h-9 text-xs"
                  />
                  <Button type="button" size="sm" onClick={handleAddCustomEmailHold} className="h-9 px-3 text-xs">
                    Add
                  </Button>
                </div>
                {holdForm.custom_emails && holdForm.custom_emails.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {holdForm.custom_emails.map((email) => (
                      <Badge
                        key={email}
                        variant="secondary"
                        className="text-xs py-1 px-2 gap-1.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                      >
                        <span>{email}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomEmailHold(email)}
                          className="hover:text-red-500 text-muted-foreground font-bold cursor-pointer"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-zinc-800/80">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => testTriggerHoldMutation.mutate(holdForm.days_threshold)}
                  disabled={testTriggerHoldMutation.isPending}
                  className="text-xs gap-1.5 text-amber-700 border-amber-300 hover:bg-amber-50 dark:text-amber-300 dark:border-amber-800 dark:hover:bg-amber-950/50"
                >
                  {testTriggerHoldMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span>Test Scan & Send Now</span>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => saveHoldMutation.mutate(holdForm)}
                  disabled={saveHoldMutation.isPending}
                  className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-1.5"
                >
                  {saveHoldMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  <span>Save On-Hold Settings</span>
                </Button>
              </div>
            </TabsContent>

            {/* 2. RECURRING DUE DATES */}
            <TabsContent value="recurring" className="mt-0 space-y-5 outline-none">
              <div className="flex items-center justify-between p-4 rounded-xl border border-indigo-200/60 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="rec-toggle" className="text-sm font-bold text-indigo-950 dark:text-indigo-200">
                      Enable Upcoming Due Date Reminders
                    </Label>
                    <Badge variant="outline" className="text-[10px] bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 border-indigo-300">
                      Automated
                    </Badge>
                  </div>
                  <p className="text-xs text-indigo-900/70 dark:text-indigo-300/70">
                    Sends advance reminder emails before recurring installments and subscription cycles become due.
                  </p>
                </div>
                <input
                  id="rec-toggle"
                  type="checkbox"
                  checked={recForm.enabled}
                  onChange={(e) => setRecForm({ ...recForm, enabled: e.target.checked })}
                  className="h-5 w-5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Notice Period (Days in Advance)
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={90}
                      value={recForm.days_ahead}
                      onChange={(e) => setRecForm({ ...recForm, days_ahead: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="h-10 font-mono font-bold text-sm bg-slate-50/50 dark:bg-zinc-900/50"
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">Days Before Due</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[3, 5, 7, 14, 30].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setRecForm({ ...recForm, days_ahead: d })}
                        className={`text-[11px] px-2 py-0.5 rounded border transition-all cursor-pointer ${
                          recForm.days_ahead === d
                            ? "bg-indigo-600 text-white border-indigo-700 font-bold"
                            : "bg-slate-100 dark:bg-zinc-800 text-muted-foreground hover:text-foreground border-slate-200 dark:border-zinc-700"
                        }`}
                      >
                        {d} days {d === 7 ? "(Default)" : ""}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Daily Dispatch Time (EST)
                  </Label>
                  <Input
                    type="time"
                    value={recForm.reminder_time}
                    onChange={(e) => setRecForm({ ...recForm, reminder_time: e.target.value })}
                    className="h-10 font-mono text-sm bg-slate-50/50 dark:bg-zinc-900/50"
                  />
                  <p className="text-[11px] text-muted-foreground">Runs automatically once daily at configured time.</p>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Target Notification Recipients
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={recForm.include_requester}
                      onChange={(e) => setRecForm({ ...recForm, include_requester: e.target.checked })}
                      className="h-4 w-4 rounded text-indigo-600"
                    />
                    <span className="text-xs font-semibold">Requester</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={recForm.include_ap}
                      onChange={(e) => setRecForm({ ...recForm, include_ap: e.target.checked })}
                      className="h-4 w-4 rounded text-indigo-600"
                    />
                    <span className="text-xs font-semibold">AP Team</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={recForm.include_treasury}
                      onChange={(e) => setRecForm({ ...recForm, include_treasury: e.target.checked })}
                      className="h-4 w-4 rounded text-indigo-600"
                    />
                    <span className="text-xs font-semibold">Treasury</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  Additional Email Recipients
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="audits@zenatech.com"
                    value={customEmailRecInput}
                    onChange={(e) => setCustomEmailRecInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCustomEmailRec())}
                    className="h-9 text-xs"
                  />
                  <Button type="button" size="sm" onClick={handleAddCustomEmailRec} className="h-9 px-3 text-xs">
                    Add
                  </Button>
                </div>
                {recForm.custom_emails && recForm.custom_emails.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {recForm.custom_emails.map((email) => (
                      <Badge
                        key={email}
                        variant="secondary"
                        className="text-xs py-1 px-2 gap-1.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                      >
                        <span>{email}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomEmailRec(email)}
                          className="hover:text-red-500 text-muted-foreground font-bold cursor-pointer"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-zinc-800/80">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => testTriggerRecMutation.mutate(recForm.days_ahead)}
                  disabled={testTriggerRecMutation.isPending}
                  className="text-xs gap-1.5 text-indigo-700 border-indigo-300 hover:bg-indigo-50 dark:text-indigo-300 dark:border-indigo-800 dark:hover:bg-indigo-950/50"
                >
                  {testTriggerRecMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span>Test Scan & Send Now</span>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => saveRecMutation.mutate(recForm)}
                  disabled={saveRecMutation.isPending}
                  className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-1.5"
                >
                  {saveRecMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  <span>Save Recurring Settings</span>
                </Button>
              </div>
            </TabsContent>

            {/* 3. A/R INVOICE DUE DATE REMINDERS */}
            <TabsContent value="ar-invoices" className="mt-0 space-y-5 outline-none">
              <div className="flex items-center justify-between p-4 rounded-xl border border-blue-200/60 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="ar-reminders-toggle" className="text-sm font-bold text-blue-950 dark:text-blue-200">
                      Automated Customer Payment Due Reminders
                    </Label>
                    <Badge variant="outline" className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300">
                      Accounts Receivable
                    </Badge>
                  </div>
                  <p className="text-xs text-blue-900/70 dark:text-blue-300/70">
                    Automatically scans all open invoices and dispatches email &amp; in-app payment reminders to clients when an invoice is due within the configured days threshold.
                  </p>
                </div>
                <input
                  id="ar-reminders-toggle"
                  type="checkbox"
                  checked={arReminderForm.enabled}
                  onChange={(e) => setArReminderForm({ ...arReminderForm, enabled: e.target.checked })}
                  className="h-5 w-5 rounded border-blue-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-blue-500" />
                    Reminder Threshold (Days Before Due)
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={90}
                      value={arReminderForm.days_threshold}
                      onChange={(e) =>
                        setArReminderForm({ ...arReminderForm, days_threshold: parseInt(e.target.value) || 7 })
                      }
                      className="h-10 font-bold text-sm w-28 bg-slate-50/50 dark:bg-zinc-900/50"
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">Days Before Due Date</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[3, 5, 7, 10, 14, 30].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setArReminderForm({ ...arReminderForm, days_threshold: d })}
                        className={`text-[11px] px-2 py-0.5 rounded border transition-all cursor-pointer ${
                          arReminderForm.days_threshold === d
                            ? "bg-blue-600 text-white border-blue-700 font-bold"
                            : "bg-slate-100 dark:bg-zinc-800 text-muted-foreground hover:text-foreground border-slate-200 dark:border-zinc-700"
                        }`}
                      >
                        {d} days {d === 7 ? "(Default: 7 Days)" : ""}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                    Channels &amp; Delivery Methods
                  </Label>
                  <div className="space-y-2 pt-1">
                    <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={arReminderForm.notify_customer_email}
                        onChange={(e) => setArReminderForm({ ...arReminderForm, notify_customer_email: e.target.checked })}
                        className="h-4 w-4 rounded text-blue-600"
                      />
                      <div className="text-xs">
                        <span className="font-semibold block">Send Customer Email</span>
                        <span className="text-[11px] text-muted-foreground">Emails the primary billing contact email on the invoice</span>
                      </div>
                    </label>
                    <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={arReminderForm.notify_in_app}
                        onChange={(e) => setArReminderForm({ ...arReminderForm, notify_in_app: e.target.checked })}
                        className="h-4 w-4 rounded text-blue-600"
                      />
                      <div className="text-xs">
                        <span className="font-semibold block">In-App Notification Stream</span>
                        <span className="text-[11px] text-muted-foreground">Broadcasts real-time portal notification banner &amp; event</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    Sender Email Address
                  </Label>
                  <Input
                    type="email"
                    value={arReminderForm.sender_email}
                    onChange={(e) => setArReminderForm({ ...arReminderForm, sender_email: e.target.value })}
                    placeholder="accounting@paceplus.com"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Sender Display Name
                  </Label>
                  <Input
                    type="text"
                    value={arReminderForm.sender_name}
                    onChange={(e) => setArReminderForm({ ...arReminderForm, sender_name: e.target.value })}
                    placeholder="Pace Plus Accounts Receivable"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Email Subject Template
                </Label>
                <Input
                  type="text"
                  value={arReminderForm.email_subject}
                  onChange={(e) => setArReminderForm({ ...arReminderForm, email_subject: e.target.value })}
                  placeholder="Invoice Payment Reminder - Due Soon ({invoice_number})"
                  className="h-9 text-xs font-mono"
                />
                <span className="text-[10px] text-muted-foreground">Supports dynamic placeholders: &#123;invoice_number&#125;, &#123;customer_name&#125;, &#123;due_date&#125;, &#123;balance_due&#125;</span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Custom Reminder Message Body
                </Label>
                <textarea
                  rows={3}
                  value={arReminderForm.custom_message}
                  onChange={(e) => setArReminderForm({ ...arReminderForm, custom_message: e.target.value })}
                  placeholder="This is a friendly reminder that your invoice is due soon. Please review the attached statement and remit payment."
                  className="w-full text-xs text-foreground border border-input rounded-md bg-transparent px-3 py-2 resize-y focus:outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-zinc-800/80">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => testTriggerArReminderMutation.mutate(arReminderForm.days_threshold)}
                  disabled={testTriggerArReminderMutation.isPending}
                  className="text-xs gap-1.5 text-blue-700 border-blue-300 hover:bg-blue-50 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-950/50 cursor-pointer"
                >
                  {testTriggerArReminderMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span>Test Scan &amp; Send Due Reminders</span>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => saveArReminderMutation.mutate(arReminderForm)}
                  disabled={saveArReminderMutation.isPending}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1.5 cursor-pointer shadow-xs"
                >
                  {saveArReminderMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  <span>Save A/R Reminder Settings</span>
                </Button>
              </div>
            </TabsContent>

            {/* 3. PREFERENCES & ALERTS */}
            <TabsContent value="preferences" className="mt-0 space-y-5 outline-none">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30">
                  <div className="space-y-1">
                    <Label className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                      <Bell className="h-4 w-4 text-indigo-500" />
                      In-App Toast Alerts
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Display bottom-right popup toast notifications for real-time status updates and order milestones.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={inAppAlerts}
                    onChange={(e) => {
                      setInAppAlerts(e.target.checked);
                      localStorage.setItem("inAppAlerts", String(e.target.checked));
                      toast.success(`In-App alerts ${e.target.checked ? "enabled" : "disabled"}`);
                    }}
                    className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                        <Laptop className="h-4 w-4 text-blue-500" />
                        Windows Desktop Notifications
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Show native OS notifications even when browser window is in background or minimized.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={windowsNotifications}
                      onChange={onToggleWindowsNotifications}
                      className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>

                  <div className="pt-2 flex justify-start">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onTestWindowsNotification}
                      className="text-xs gap-1.5"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Send Test Windows Alert</span>
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
