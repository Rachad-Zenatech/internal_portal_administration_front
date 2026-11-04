import { Mail, Send, Loader2, Truck, CheckCircle2, Clock3, PauseCircle, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { NotificationDropdownState } from "../hooks/useNotificationDropdown";

export function SendgridEmailTesterModal({ s }: { s: NotificationDropdownState }) {
  const { activeSendingAction, handleSendTestEmail, setTestEmailRecipient, testEmailRecipient, setIsEmailTesterOpen, isEmailTesterOpen } = s;
  return (
    <Dialog open={isEmailTesterOpen} onOpenChange={setIsEmailTesterOpen}>
        <DialogContent className="max-w-md p-6 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl">
          <DialogHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <span>Test Email Notifications</span>
              </DialogTitle>
              <Badge variant="outline" className="text-[10px] font-semibold border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-300">
                SendGrid v3
              </Badge>
            </div>
            <DialogDescription className="text-xs text-slate-500 dark:text-zinc-400">
              Dispatched from <strong className="text-slate-700 dark:text-zinc-200">purchases@zenatech.com</strong>. Trigger sample emails to test delivery and layout in your inbox.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Recipient Address Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                <span>Recipient Email Address</span>
                <span className="text-[10px] text-slate-400">Where test emails are delivered</span>
              </label>
              <Input
                type="email"
                placeholder="your.email@zenatech.com"
                value={testEmailRecipient}
                onChange={(e) => setTestEmailRecipient(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            {/* Test Action Buttons Grid */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Workflow Status Emails
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {/* 1. Approved */}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!!activeSendingAction}
                  onClick={() =>
                    handleSendTestEmail("approved", {
                      email_type: "status",
                      status: "APPROVED",
                      request_id: 2,
                      request_title: "Logitech MX Master 3S Mouse",
                      reason: "Approved by Department Head. Allocated under Q3 hardware budget.",
                    })
                  }
                  className="h-auto py-2.5 px-3 flex flex-col items-start text-left border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {activeSendingAction === "approved" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    <span>Approved Notice</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
                    Approval confirmation & next steps
                  </span>
                </Button>

                {/* 2. Reject */}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!!activeSendingAction}
                  onClick={() =>
                    handleSendTestEmail("reject", {
                      email_type: "status",
                      status: "REJECTED",
                      request_id: 2,
                      request_title: "Logitech MX Master 3S Mouse",
                      reason: "Item rejected: Exceeds department budget allocation for this quarter.",
                    })
                  }
                  className="h-auto py-2.5 px-3 flex flex-col items-start text-left border-rose-200 dark:border-rose-900/50 hover:bg-rose-50/50 dark:hover:bg-rose-950/20"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                    {activeSendingAction === "reject" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    <span>Reject Notice</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
                    Includes reason banner & portal link
                  </span>
                </Button>

                {/* 3. On Hold */}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!!activeSendingAction}
                  onClick={() =>
                    handleSendTestEmail("on_hold", {
                      email_type: "status",
                      status: "ON_HOLD",
                      request_id: 2,
                      request_title: "Dell UltraSharp 27 Monitor",
                      reason: "Placed on hold pending quote comparison from secondary vendor.",
                    })
                  }
                  className="h-auto py-2.5 px-3 flex flex-col items-start text-left border-amber-200 dark:border-amber-900/50 hover:bg-amber-50/50 dark:hover:bg-amber-950/20"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                    {activeSendingAction === "on_hold" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <PauseCircle className="h-3.5 w-3.5" />
                    )}
                    <span>On Hold Notice</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
                    Includes hold justification alert
                  </span>
                </Button>

                {/* 4. Ordered / Purchased */}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!!activeSendingAction}
                  onClick={() =>
                    handleSendTestEmail("purchased", {
                      email_type: "status",
                      status: "PURCHASED",
                      request_id: 2,
                      request_title: "Ergonomic Office Chair & Desk",
                    })
                  }
                  className="h-auto py-2.5 px-3 flex flex-col items-start text-left border-sky-200 dark:border-sky-900/50 hover:bg-sky-50/50 dark:hover:bg-sky-950/20"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400">
                    {activeSendingAction === "purchased" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    <span>Purchased Notice</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
                    Order confirmation & settlement
                  </span>
                </Button>

                {/* 5. Shipped */}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!!activeSendingAction}
                  onClick={() =>
                    handleSendTestEmail("shipped", {
                      email_type: "status",
                      status: "SHIPPED",
                      request_id: 2,
                      request_title: "15x MacBook Pro Power Adapters",
                      tracking_number: "1Z9999999999999999",
                      shipping_note: "Shipped via FedEx Express Priority",
                    })
                  }
                  className="h-auto py-2.5 px-3 flex flex-col items-start text-left border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {activeSendingAction === "shipped" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Truck className="h-3.5 w-3.5" />
                    )}
                    <span>Shipped Notice</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
                    With tracking # & courier details
                  </span>
                </Button>
              </div>
            </div>

            {/* Stale Draft Reminders Section */}
            <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-zinc-800">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Stale Draft Reminder Emails (3+ Days)
              </label>

              <div className="grid grid-cols-1 gap-2">
                {/* 5. Stale Drafts Template Test */}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!!activeSendingAction}
                  onClick={() =>
                    handleSendTestEmail("draft_sample", {
                      email_type: "draft_reminder",
                    })
                  }
                  className="w-full justify-start h-auto py-2.5 px-3 border-amber-200 bg-amber-50/30 dark:bg-amber-950/20 dark:border-amber-900/50 hover:bg-amber-50"
                >
                  <div className="flex items-center gap-2">
                    {activeSendingAction === "draft_sample" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-amber-600 shrink-0" />
                    ) : (
                      <Clock3 className="h-4 w-4 text-amber-600 shrink-0" />
                    )}
                    <div className="text-left">
                      <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
                        Test Stale Drafts Digest Template
                      </div>
                      <div className="text-[10px] text-amber-700/80 dark:text-amber-300/80 font-normal">
                        "You have not submit your purchase request for 2 requests (Order Mouse, Order Laptop)..."
                      </div>
                    </div>
                  </div>
                </Button>

                {/* 6. Live Trigger DB Scan */}
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!!activeSendingAction}
                  onClick={() => handleSendTestEmail("trigger_scan", {})}
                  className="w-full justify-center h-8 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800"
                >
                  {activeSendingAction === "trigger_scan" ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                  ) : (
                    <Send className="h-3 w-3 mr-1.5" />
                  )}
                  <span>Run Live Database Scan & Dispatch (Tasks &gt; 3 Days)</span>
                </Button>
              </div>
            </div>

            {/* Recurring Payment Due Reminders Section */}
            <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Recurring Payment Due Date Alerts
                </label>
                <Badge variant="outline" className="text-[9px] font-semibold border-purple-200 text-purple-700 bg-purple-50 dark:bg-purple-950/50 dark:border-purple-800 dark:text-purple-300">
                  Recurring
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {/* 7. Recurring Due Reminder Test */}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!!activeSendingAction}
                  onClick={() =>
                    handleSendTestEmail("recurring_sample", {
                      email_type: "status",
                      status: "WAITING_PAYMENT",
                      request_id: 15,
                      request_title: "Slack Enterprise Grid Subscription (Recurring)",
                      reason: "Upcoming monthly installment due in 7 days. Scheduled review: REVIEWED.",
                    })
                  }
                  className="w-full justify-start h-auto py-2.5 px-3 border-purple-200 bg-purple-50/30 dark:bg-purple-950/20 dark:border-purple-900/50 hover:bg-purple-50"
                >
                  <div className="flex items-center gap-2">
                    {activeSendingAction === "recurring_sample" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-purple-600 shrink-0" />
                    ) : (
                      <RefreshCw className="h-4 w-4 text-purple-600 shrink-0" />
                    )}
                    <div className="text-left">
                      <div className="text-xs font-bold text-purple-900 dark:text-purple-200">
                        Test Recurring Payment Due Notice
                      </div>
                      <div className="text-[10px] text-purple-700/80 dark:text-purple-300/80 font-normal">
                        "Upcoming installment due notice with schedule breakdown and review status..."
                      </div>
                    </div>
                  </div>
                </Button>

                {/* 8. Live Trigger Recurring Due Scan */}
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!!activeSendingAction}
                  onClick={() => handleSendTestEmail("recurring_trigger_reminders", {})}
                  className="w-full justify-center h-8 text-xs font-semibold text-purple-700 hover:text-purple-900 dark:text-purple-300 dark:hover:text-purple-100 hover:bg-purple-50 dark:hover:bg-purple-950/50"
                >
                  {activeSendingAction === "recurring_trigger_reminders" ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                  ) : (
                    <RefreshCw className="h-3 w-3 mr-1.5" />
                  )}
                  <span>Run Live Recurring Payments Due Scan & Dispatch</span>
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
  );
}
