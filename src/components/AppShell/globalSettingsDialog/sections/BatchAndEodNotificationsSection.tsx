import { Clock, MailCheck, Save, Send } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { GlobalSettingsDialogState } from "../hooks/useGlobalSettingsDialog";

function EodRemindersCard({ s }: { s: GlobalSettingsDialogState }) {
  const { eodForm, setEodForm, saveEodMutation } = s;
  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Label className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-500" />
            <span>End-of-Day Purchasing Reminders (Once Daily)</span>
          </Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Runs all purchasing reminders (Stale Drafts, Unanswered Questions, On-Hold, Recurring Due) once per day at end of day.
          </p>
        </div>
        <input
          type="checkbox"
          checked={eodForm.enabled}
          onChange={(e) => setEodForm({ ...eodForm, enabled: e.target.checked })}
          className="h-5 w-5 rounded text-indigo-600 cursor-pointer"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs font-semibold">End-of-Day Send Time</Label>
          <Input type="time" value={eodForm.reminder_time} onChange={(e) => setEodForm({ ...eodForm, reminder_time: e.target.value })} className="h-9 text-xs font-mono" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Timezone</Label>
          <Input value={eodForm.timezone} onChange={(e) => setEodForm({ ...eodForm, timezone: e.target.value })} className="h-9 text-xs font-mono" />
        </div>
      </div>
      <div className="flex flex-wrap gap-4 text-xs">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={eodForm.stale_drafts_enabled} onChange={(e) => setEodForm({ ...eodForm, stale_drafts_enabled: e.target.checked })} className="h-4 w-4 rounded cursor-pointer" />
          <span>Stale Drafts (&gt; 3 days)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={eodForm.unanswered_messages_enabled} onChange={(e) => setEodForm({ ...eodForm, unanswered_messages_enabled: e.target.checked })} className="h-4 w-4 rounded cursor-pointer" />
          <span>Unanswered Thread Questions</span>
        </label>
      </div>
      <div className="flex justify-end">
        <Button type="button" size="sm" disabled={saveEodMutation.isPending} onClick={() => saveEodMutation.mutate(eodForm)} className="text-xs gap-1.5">
          <Save className="w-3.5 h-3.5" />
          <span>{saveEodMutation.isPending ? "Saving..." : "Save EOD Reminders"}</span>
        </Button>
      </div>
    </div>
  );
}

function BatchApprovalCard({ s }: { s: GlobalSettingsDialogState }) {
  const { batchForm, setBatchForm, saveBatchMutation, triggerBatchMutation } = s;
  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Label className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <MailCheck className="h-4 w-4 text-emerald-600" />
            <span>Batch Approval Digest</span>
          </Label>
          <p className="text-xs text-muted-foreground mt-0.5">Schedule manager digest emails for pending purchase approvals.</p>
        </div>
        <input
          type="checkbox"
          checked={batchForm.enabled}
          onChange={(e) => setBatchForm({ ...batchForm, enabled: e.target.checked })}
          className="h-5 w-5 rounded text-emerald-600 cursor-pointer"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Midday Time</Label>
          <Input type="time" value={batchForm.midday_time} onChange={(e) => setBatchForm({ ...batchForm, midday_time: e.target.value })} className="h-9 text-xs font-mono" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">End-of-Day Time</Label>
          <Input type="time" value={batchForm.end_of_day_time} onChange={(e) => setBatchForm({ ...batchForm, end_of_day_time: e.target.value })} className="h-9 text-xs font-mono" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Timezone</Label>
          <Input value={batchForm.timezone} onChange={(e) => setBatchForm({ ...batchForm, timezone: e.target.value })} className="h-9 text-xs font-mono" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" disabled={triggerBatchMutation.isPending} onClick={() => triggerBatchMutation.mutate()} className="text-xs gap-1.5">
          <Send className="w-3.5 h-3.5" />
          <span>{triggerBatchMutation.isPending ? "Sending..." : "Send Digest Now"}</span>
        </Button>
        <Button type="button" size="sm" disabled={saveBatchMutation.isPending} onClick={() => saveBatchMutation.mutate(batchForm)} className="text-xs gap-1.5">
          <Save className="w-3.5 h-3.5" />
          <span>{saveBatchMutation.isPending ? "Saving..." : "Save Batch Settings"}</span>
        </Button>
      </div>
    </div>
  );
}

export function BatchAndEodNotificationsSection({ s }: { s: GlobalSettingsDialogState }) {
  return (
    <TabsContent value="eod-batch" className="mt-0 space-y-5 outline-none">
      <EodRemindersCard s={s} />
      <BatchApprovalCard s={s} />
    </TabsContent>
  );
}
