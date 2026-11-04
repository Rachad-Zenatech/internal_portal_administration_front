import { Clock, Mail, ShieldCheck, Send, Loader2, Check } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { GlobalSettingsDialogState } from "../hooks/useGlobalSettingsDialog";

export function EnableLongHeldItems({ s }: { s: GlobalSettingsDialogState }) {
  const { saveHoldMutation, holdForm, testTriggerHoldMutation, handleRemoveCustomEmailHold, handleAddCustomEmailHold, setCustomEmailHoldInput, customEmailHoldInput, setHoldForm } = s;
  return (
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
  );
}
