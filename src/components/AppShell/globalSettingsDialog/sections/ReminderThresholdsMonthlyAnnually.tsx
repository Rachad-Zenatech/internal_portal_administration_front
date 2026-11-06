import { Clock, Mail, ShieldCheck, Send, Loader2, Check, Calendar } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { GlobalSettingsDialogState } from "../hooks/useGlobalSettingsDialog";

export function ReminderThresholdsMonthlyAnnually({ s }: { s: GlobalSettingsDialogState }) {
  const { saveArReminderMutation, arReminderForm, testTriggerArReminderMutation, setArReminderForm } = s;
  return (
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

              {/* Reminder Thresholds: Monthly & Annually separated */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Monthly Reminder Option */}
                <div
                  className={`p-4 rounded-xl border transition-all ${
                    (arReminderForm.monthly_enabled ?? true)
                      ? "border-blue-200/80 dark:border-blue-900/50 bg-blue-50/25 dark:bg-blue-950/20"
                      : "border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/20 opacity-70"
                  }`}
                >
                  <div className="flex items-center justify-between pb-2.5 border-b border-blue-100 dark:border-blue-950/60">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-200">
                        Monthly Reminder
                      </span>
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={arReminderForm.monthly_enabled ?? true}
                        onChange={(e) =>
                          setArReminderForm({ ...arReminderForm, monthly_enabled: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-[11px] font-semibold text-muted-foreground">Enabled</span>
                    </label>
                  </div>

                  <div className="pt-2.5 space-y-2">
                    <p className="text-[11px] text-muted-foreground">
                      Advance notice threshold for monthly recurring invoices and standard billings.
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={90}
                        value={arReminderForm.monthly_days_threshold ?? 7}
                        onChange={(e) =>
                          setArReminderForm({
                            ...arReminderForm,
                            monthly_days_threshold: parseInt(e.target.value) || 7,
                            days_threshold: parseInt(e.target.value) || 7,
                          })
                        }
                        className="h-9 font-bold text-sm w-24 bg-white dark:bg-zinc-900"
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">Days Before Due Date</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[3, 5, 7, 10, 14, 30].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() =>
                            setArReminderForm({
                              ...arReminderForm,
                              monthly_days_threshold: d,
                              days_threshold: d,
                            })
                          }
                          className={`text-[11px] px-2 py-0.5 rounded border transition-all cursor-pointer ${
                            (arReminderForm.monthly_days_threshold ?? 7) === d
                              ? "bg-blue-600 text-white border-blue-700 font-bold shadow-xs"
                              : "bg-white dark:bg-zinc-800 text-muted-foreground hover:text-foreground border-slate-200 dark:border-zinc-700"
                          }`}
                        >
                          {d} days {d === 7 ? "(Default: 7 Days)" : ""}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Annually Reminder Option */}
                <div
                  className={`p-4 rounded-xl border transition-all ${
                    (arReminderForm.annual_enabled ?? true)
                      ? "border-indigo-200/80 dark:border-indigo-900/50 bg-indigo-50/25 dark:bg-indigo-950/20"
                      : "border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/20 opacity-70"
                  }`}
                >
                  <div className="flex items-center justify-between pb-2.5 border-b border-indigo-100 dark:border-indigo-950/60">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-indigo-500" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-200">
                        Annually Reminder
                      </span>
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={arReminderForm.annual_enabled ?? true}
                        onChange={(e) =>
                          setArReminderForm({ ...arReminderForm, annual_enabled: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="text-[11px] font-semibold text-muted-foreground">Enabled</span>
                    </label>
                  </div>

                  <div className="pt-2.5 space-y-2">
                    <p className="text-[11px] text-muted-foreground">
                      Advance notice threshold for annual contracts, yearly subscriptions & renewals.
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={180}
                        value={arReminderForm.annual_days_threshold ?? 60}
                        onChange={(e) =>
                          setArReminderForm({
                            ...arReminderForm,
                            annual_days_threshold: parseInt(e.target.value) || 60,
                          })
                        }
                        className="h-9 font-bold text-sm w-24 bg-white dark:bg-zinc-900"
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">Days Before Due Date</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[14, 30, 45, 60, 90].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() =>
                            setArReminderForm({ ...arReminderForm, annual_days_threshold: d })
                          }
                          className={`text-[11px] px-2 py-0.5 rounded border transition-all cursor-pointer ${
                            (arReminderForm.annual_days_threshold ?? 60) === d
                              ? "bg-indigo-600 text-white border-indigo-700 font-bold shadow-xs"
                              : "bg-white dark:bg-zinc-800 text-muted-foreground hover:text-foreground border-slate-200 dark:border-zinc-700"
                          }`}
                        >
                          {d} days {d === 60 ? "(Default: 60 Days)" : ""}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Channels & Delivery Methods */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/20 space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                  Channels &amp; Delivery Methods
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900/50 cursor-pointer bg-white dark:bg-zinc-900/40">
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
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900/50 cursor-pointer bg-white dark:bg-zinc-900/40">
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
                  onClick={() => testTriggerArReminderMutation.mutate()}
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
  );
}
