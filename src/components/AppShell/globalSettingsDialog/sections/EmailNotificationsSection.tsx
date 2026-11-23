import { Loader2, Mail, Send } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { GlobalSettingsDialogState } from "../hooks/useGlobalSettingsDialog";
import type { PurchasingEmailNotificationSettings } from "../hooks/useEmailNotificationsSettings";

interface ToggleRowProps {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

function EmailToggleRow({ title, description, checked, disabled, onChange }: ToggleRowProps) {
  return (
    <label
      className={`flex items-center justify-between gap-4 p-3 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 transition-opacity ${
        disabled ? "opacity-55 cursor-not-allowed" : "cursor-pointer hover:bg-slate-50/70 dark:hover:bg-zinc-900/60"
      }`}
    >
      <div className="space-y-0.5">
        <div className="text-xs font-semibold text-slate-900 dark:text-zinc-100">{title}</div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
      />
    </label>
  );
}

const EVENT_TOGGLES: Array<{
  key: keyof PurchasingEmailNotificationSettings;
  title: string;
  description: string;
}> = [
  {
    key: "on_request_created_or_assigned",
    title: "Request Created or Assigned",
    description: "Email approvers and assignees when a purchase request or payable is created, submitted, assigned, or reassigned.",
  },
  {
    key: "on_status_changed",
    title: "Request Status Changed",
    description: "Email requesters and stakeholders when status changes (Approved, Rejected, On Hold, Purchased, Shipped, Completed).",
  },
  {
    key: "on_new_message",
    title: "New Message & Info Requests",
    description: "Email participants when a message or request-for-information comment is posted on a request thread.",
  },
  {
    key: "payables_morning_digest_enabled",
    title: "Daily Payables Morning Digest",
    description: "Send the daily morning summary email of due and overdue payables to AP and Treasury.",
  },
];

function EventEmailTogglesCard({ s }: { s: GlobalSettingsDialogState }) {
  const { emailForm, saveEmailSettingsMutation, toggleEmailSetting } = s;
  const isSaving = saveEmailSettingsMutation.isPending;

  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 space-y-3.5">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <Label className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <Mail className="h-4 w-4 text-indigo-500" />
            <span>Email Notification Controls</span>
            <Badge
              variant="outline"
              className={
                emailForm.master_enabled
                  ? "text-[10px] border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "text-[10px] border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
              }
            >
              {emailForm.master_enabled ? "Enabled" : "Paused"}
            </Badge>
          </Label>
          <p className="text-xs text-muted-foreground">
            Master switch to turn all automated purchasing and payable email notifications on or off at any time.
          </p>
        </div>
        <input
          type="checkbox"
          checked={emailForm.master_enabled}
          disabled={isSaving}
          onChange={(e) => toggleEmailSetting("master_enabled", e.target.checked)}
          className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
        />
      </div>

      <div className="space-y-2 pt-1">
        {EVENT_TOGGLES.map((item) => (
          <EmailToggleRow
            key={item.key}
            title={item.title}
            description={item.description}
            checked={Boolean(emailForm[item.key])}
            disabled={!emailForm.master_enabled || isSaving}
            onChange={(val) => toggleEmailSetting(item.key, val)}
          />
        ))}
      </div>
    </div>
  );
}

function TestPayableEmailCard({ s }: { s: GlobalSettingsDialogState }) {
  const {
    testPayableEmail,
    setTestPayableEmail,
    testPayableDaysAhead,
    setTestPayableDaysAhead,
    sendTestPayableEmailMutation,
    handleSendTestPayableEmail,
  } = s;

  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 space-y-3.5">
      <div>
        <Label className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
          <Send className="h-4 w-4 text-emerald-600" />
          <span>Test Payable Email</span>
        </Label>
        <p className="text-xs text-muted-foreground mt-0.5">
          Send a test Daily Payables Due Digest email to a specific address (uses live due payables or a sample item if none are due).
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
        <div className="sm:col-span-6 space-y-1">
          <Label className="text-xs font-semibold">Recipient Email</Label>
          <Input
            type="email"
            value={testPayableEmail}
            onChange={(e) => setTestPayableEmail(e.target.value)}
            placeholder="your.email@zenatech.com"
            className="h-9 text-xs bg-white dark:bg-zinc-950"
          />
        </div>
        <div className="sm:col-span-3 space-y-1">
          <Label className="text-xs font-semibold">Lookahead Window</Label>
          <select
            value={testPayableDaysAhead}
            onChange={(e) => setTestPayableDaysAhead(Number(e.target.value))}
            className="h-9 w-full rounded-md border border-input bg-white dark:bg-zinc-950 px-2.5 text-xs"
          >
            <option value={0}>Due Today &amp; Overdue</option>
            <option value={7}>Next 7 Days</option>
            <option value={30}>Next 30 Days</option>
          </select>
        </div>
        <div className="sm:col-span-3">
          <Button
            type="button"
            size="sm"
            disabled={sendTestPayableEmailMutation.isPending}
            onClick={handleSendTestPayableEmail}
            className="w-full h-9 text-xs gap-1.5 cursor-pointer"
          >
            {sendTestPayableEmailMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            <span>{sendTestPayableEmailMutation.isPending ? "Sending..." : "Send Test Email"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function EmailNotificationsSection({ s }: { s: GlobalSettingsDialogState }) {
  return (
    <TabsContent value="email" className="mt-0 space-y-5 outline-none">
      <EventEmailTogglesCard s={s} />
      <TestPayableEmailCard s={s} />
    </TabsContent>
  );
}
