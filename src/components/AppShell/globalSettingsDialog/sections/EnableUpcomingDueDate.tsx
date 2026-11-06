import { Clock, Mail, ShieldCheck, Send, Loader2, Check } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { GlobalSettingsDialogState } from "../hooks/useGlobalSettingsDialog";

export function EnableUpcomingDueDate({ s }: { s: GlobalSettingsDialogState }) {
  const { saveRecMutation, recForm, testTriggerRecMutation, handleRemoveCustomEmailRec, handleAddCustomEmailRec, setCustomEmailRecInput, customEmailRecInput, setRecForm } = s;
  return (
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
  );
}
