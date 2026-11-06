import { TimezoneAutocomplete } from "../../fields/TimezoneAutocomplete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Settings } from "lucide-react";
import { RoleAutocomplete } from "../components/RoleAutocomplete";
import type { BatchApprovalState } from "../hooks/useBatchApproval";

export function NotificationScheduleSettingsModal({ s }: { s: BatchApprovalState }) {
  const { saveSettingsMutation, settingsForm, setIsSettingsOpen, assignments, setSettingsForm, isSettingsOpen } = s;
  return (
    <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings size={18} />
              Batch Approval Notification Settings
            </DialogTitle>
            <DialogDescription>
              Configure the automated twice-daily manager notification schedule dispatched via Microsoft Graph API / SMTP.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-sm">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="font-semibold text-slate-900 dark:text-zinc-100">
                  Enable Scheduled Email Notifications
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sends scheduled email digests of all pending approvals.
                </p>
              </div>
              <Checkbox
                checked={settingsForm.enabled}
                onCheckedChange={(checked) =>
                  setSettingsForm({ ...settingsForm, enabled: !!checked })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  Midday Time (HH:MM)
                </label>
                <Input
                  type="time"
                  value={settingsForm.midday_time}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      midday_time: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  End of Day Time (HH:MM)
                </label>
                <Input
                  type="time"
                  value={settingsForm.end_of_day_time}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      end_of_day_time: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Timezone
              </label>
              <TimezoneAutocomplete
                value={settingsForm.timezone}
                onChange={(tz) =>
                  setSettingsForm({ ...settingsForm, timezone: tz })
                }
                placeholder="Select timezone (e.g. America/New_York)..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Recipient Role
              </label>
              <RoleAutocomplete
                value={settingsForm.recipient_role}
                onChange={(val) =>
                  setSettingsForm({
                    ...settingsForm,
                    recipient_role: val,
                  })
                }
                assignments={assignments}
              />
              <p className="text-[11px] text-muted-foreground">
                Emails all users assigned to this role in Workflow Assignments.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSettingsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={saveSettingsMutation.isPending}
              onClick={() => saveSettingsMutation.mutate(settingsForm)}
            >
              {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}
