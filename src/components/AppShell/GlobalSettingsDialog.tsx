import { toast } from "sonner";
import { Settings, Bell, Send, PauseCircle, Calendar, Laptop, Receipt } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { GlobalSettingsDialogProps } from "./globalSettingsDialog/types";
import { useGlobalSettingsDialog } from "./globalSettingsDialog/hooks/useGlobalSettingsDialog";
import { EnableLongHeldItems } from "./globalSettingsDialog/sections/EnableLongHeldItems";
import { EnableUpcomingDueDate } from "./globalSettingsDialog/sections/EnableUpcomingDueDate";
import { ReminderThresholdsMonthlyAnnually } from "./globalSettingsDialog/sections/ReminderThresholdsMonthlyAnnually";

export default function GlobalSettingsDialog(props: GlobalSettingsDialogProps) {
  const s = useGlobalSettingsDialog(props);
  const { onTestWindowsNotification, onToggleWindowsNotifications, windowsNotifications, setInAppAlerts, inAppAlerts, canManageAdminSettings, setActiveTab, activeTab, onOpenChange, open } = s;
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
            <EnableLongHeldItems s={s} />

            {/* 2. RECURRING DUE DATES */}
            <EnableUpcomingDueDate s={s} />

            {/* 3. A/R INVOICE DUE DATE REMINDERS */}
            <ReminderThresholdsMonthlyAnnually s={s} />

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
