import { toast } from "sonner";
import { Bell, Laptop, Send } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { GlobalSettingsDialogState } from "../hooks/useGlobalSettingsDialog";

export function AppAlertsPreferencesSection({ s }: { s: GlobalSettingsDialogState }) {
  const {
    inAppAlerts,
    setInAppAlerts,
    windowsNotifications,
    onToggleWindowsNotifications,
    onTestWindowsNotification,
  } = s;

  return (
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
  );
}
