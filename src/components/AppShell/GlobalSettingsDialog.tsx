import { Settings, Bell, PauseCircle, Calendar, Receipt, Clock, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { GlobalSettingsDialogProps } from "./globalSettingsDialog/types";
import { useGlobalSettingsDialog } from "./globalSettingsDialog/hooks/useGlobalSettingsDialog";
import { EmailNotificationsSection } from "./globalSettingsDialog/sections/EmailNotificationsSection";
import { EnableLongHeldItems } from "./globalSettingsDialog/sections/EnableLongHeldItems";
import { EnableUpcomingDueDate } from "./globalSettingsDialog/sections/EnableUpcomingDueDate";
import { ReminderThresholdsMonthlyAnnually } from "./globalSettingsDialog/sections/ReminderThresholdsMonthlyAnnually";
import { BatchAndEodNotificationsSection } from "./globalSettingsDialog/sections/BatchAndEodNotificationsSection";
import { AppAlertsPreferencesSection } from "./globalSettingsDialog/sections/AppAlertsPreferencesSection";

export default function GlobalSettingsDialog(props: GlobalSettingsDialogProps) {
  const s = useGlobalSettingsDialog(props);
  const { canManageAdminSettings, setActiveTab, activeTab, onOpenChange, open } = s;
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
              <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 h-auto lg:h-10 w-full bg-slate-200/70 dark:bg-zinc-800/70 p-1 rounded-xl gap-1">
                <TabsTrigger value="email" className="text-xs font-semibold flex items-center justify-center gap-1.5 h-8 rounded-lg transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs">
                  <Mail className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                  <span className="truncate">Email Alerts</span>
                </TabsTrigger>
                <TabsTrigger value="hold" className="text-xs font-semibold flex items-center justify-center gap-1.5 h-8 rounded-lg transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs">
                  <PauseCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">On-Hold</span>
                </TabsTrigger>
                <TabsTrigger value="recurring" className="text-xs font-semibold flex items-center justify-center gap-1.5 h-8 rounded-lg transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs">
                  <Calendar className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                  <span className="truncate">Purchasing Due</span>
                </TabsTrigger>
                <TabsTrigger value="eod-batch" className="text-xs font-semibold flex items-center justify-center gap-1.5 h-8 rounded-lg transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs">
                  <Clock className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                  <span className="truncate">EOD &amp; Batch</span>
                </TabsTrigger>
                <TabsTrigger value="ar-invoices" className="text-xs font-semibold flex items-center justify-center gap-1.5 h-8 rounded-lg transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs">
                  <Receipt className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span className="truncate">Invoice Due</span>
                </TabsTrigger>
                <TabsTrigger value="preferences" className="text-xs font-semibold flex items-center justify-center gap-1.5 h-8 rounded-lg transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs">
                  <Bell className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">App &amp; Alerts</span>
                </TabsTrigger>
              </TabsList>
            </div>
          )}

          <div className="p-6 max-h-[65vh] overflow-y-auto space-y-6">
            {/* 0. EVENT EMAIL NOTIFICATIONS & TEST PAYABLE EMAIL */}
            <EmailNotificationsSection s={s} />

            {/* 1. ON-HOLD REMINDERS */}
            <EnableLongHeldItems s={s} />

            {/* 2. RECURRING DUE DATES */}
            <EnableUpcomingDueDate s={s} />

            {/* 3. EOD PURCHASING REMINDERS & BATCH APPROVAL DIGEST */}
            <BatchAndEodNotificationsSection s={s} />

            {/* 4. A/R INVOICE DUE DATE REMINDERS */}
            <ReminderThresholdsMonthlyAnnually s={s} />

            {/* 5. PREFERENCES & ALERTS */}
            <AppAlertsPreferencesSection s={s} />
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
