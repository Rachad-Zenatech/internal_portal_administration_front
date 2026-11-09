import { ScheduleDatesBuilder } from "../../fields/ScheduleDatesBuilder";
import LocationAutocomplete from "../../fields/LocationAutocomplete";
import { CurrencyAutocomplete } from "../../fields/CurrencyAutocomplete";
import { resolveUserDepartment } from "@/lib/userDepartment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarClock, ExternalLink } from "lucide-react";
import { RequesterAutocomplete } from "../components/RequesterAutocomplete";
import type { RecurringPaymentsViewState } from "../hooks/useRecurringPaymentsTail";

export function CreateRecurringRequestModal({ v }: { v: RecurringPaymentsViewState }) {
  const { createMutation, setIsCreateOpen, newForm, setNewForm, rolesList, usersList, handleCreateSubmit, isCreateOpen } = v;
  return (
    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-[1440px] 2xl:max-w-[1600px] max-h-[92vh] overflow-y-auto p-6 sm:p-8 rounded-2xl">
          <form onSubmit={handleCreateSubmit} className="space-y-5">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50 shadow-2xs shrink-0">
                  <CalendarClock className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-slate-900 dark:text-zinc-100">
                    Create Recurring Payment Request
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Add a new recurring software license, subscription, or lease with automated or custom milestone installments.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 py-2">
              {/* Left Column: General Request Details */}
              <div className="lg:col-span-6 space-y-4 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Title / Service Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. AWS Cloud Infrastructure, Zoom Enterprise"
                    value={newForm.title}
                    onChange={(e) =>
                      setNewForm({ ...newForm, title: e.target.value })
                    }
                    className="h-10 text-sm font-medium"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        Amount ({newForm.currency || "USD"}) <span className="text-red-500">*</span>
                      </label>
                      {newForm.is_scheduled && newForm.frequency === "CUSTOM" && (
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                          (Installments)
                        </span>
                      )}
                      {newForm.is_scheduled && newForm.frequency !== "CUSTOM" && (
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                          (Per cycle)
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">{newForm.currency || "USD"}</span>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={
                          newForm.is_scheduled && newForm.frequency === "CUSTOM" && newForm.schedule_dates.length > 0
                            ? (newForm.schedule_dates.reduce((acc, itm) => acc + (itm.amount != null ? itm.amount : 0), 0) || "").toString()
                            : newForm.amount
                        }
                        onChange={(e) =>
                          setNewForm({ ...newForm, amount: e.target.value })
                        }
                        disabled={newForm.is_scheduled && newForm.frequency === "CUSTOM"}
                        className="h-10 text-sm font-mono pl-12 disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed"
                        required={!(newForm.is_scheduled && newForm.frequency === "CUSTOM")}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Currency <span className="text-red-500">*</span>
                    </label>
                    <CurrencyAutocomplete
                      value={newForm.currency || "USD"}
                      onChange={(code) => setNewForm((prev) => ({ ...prev, currency: (code || "USD").toUpperCase() }))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Frequency <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={newForm.frequency}
                      onValueChange={(val: any) => setNewForm({ ...newForm, frequency: val })}
                    >
                      <SelectTrigger className="h-10 text-sm bg-white dark:bg-zinc-950">
                        <SelectValue placeholder="Frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                        <SelectItem value="ANNUALLY">Annually</SelectItem>
                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                        <SelectItem value="BI_WEEKLY">Bi-Weekly</SelectItem>
                        <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                        <SelectItem value="SEMI_ANNUALLY">Semi-Annually</SelectItem>
                        <SelectItem value="DAILY">Daily</SelectItem>
                        <SelectItem value="CUSTOM">Custom Dates</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Next Due Date</label>
                      {newForm.is_scheduled && newForm.frequency === "CUSTOM" && (
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                          (From Schedule)
                        </span>
                      )}
                    </div>
                    <Input
                      type="date"
                      value={
                        newForm.is_scheduled && newForm.frequency === "CUSTOM" && newForm.schedule_dates.length > 0
                          ? (newForm.schedule_dates[0]?.date || newForm.due_date)
                          : (newForm.due_date || newForm.start_date)
                      }
                      onChange={(e) =>
                        setNewForm({ ...newForm, due_date: e.target.value })
                      }
                      disabled={newForm.is_scheduled && newForm.frequency === "CUSTOM"}
                      className="h-10 text-sm disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <RequesterAutocomplete
                    required
                    value={newForm.requester}
                    onChange={(val) => {
                      const matched = usersList.find(
                        (u) =>
                          (u.full_name && u.full_name.toLowerCase() === val.toLowerCase().trim()) ||
                          (u.email && u.email.toLowerCase() === val.toLowerCase().trim())
                      );
                      const dept = (matched?.department && matched.department.trim() && matched.department.toUpperCase() !== "REQUESTER")
                        ? matched.department.trim()
                        : (matched ? resolveUserDepartment(matched, rolesList) : "");
                      setNewForm((prev) => ({ ...prev, requester: val, department: dept || prev.department }));
                    }}
                    onSelectUser={(selectedUser) => {
                      const dept = (selectedUser?.department && selectedUser.department.trim() && selectedUser.department.toUpperCase() !== "REQUESTER")
                        ? selectedUser.department.trim()
                        : resolveUserDepartment(selectedUser, rolesList);
                      if (dept) {
                        setNewForm((prev) => ({ ...prev, department: dept }));
                      }
                    }}
                    users={usersList}
                    roles={rolesList}
                  />

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={newForm.department}
                      onChange={(e) =>
                        setNewForm({ ...newForm, department: e.target.value })
                      }
                      placeholder="e.g. Finance"
                      className="h-10 text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Priority <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={newForm.priority}
                      onValueChange={(val) =>
                        setNewForm({ ...newForm, priority: val })
                      }
                    >
                      <SelectTrigger className="h-10 text-sm">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Payment Category <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={newForm.payment_domain || "PURCHASE_REQUEST"}
                      onValueChange={(val: "PURCHASE_REQUEST" | "AP") =>
                        setNewForm({ ...newForm, payment_domain: val })
                      }
                    >
                      <SelectTrigger className="h-10 text-sm">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PURCHASE_REQUEST">Purchase Request (Subscriptions &amp; Scheduled)</SelectItem>
                        <SelectItem value="AP">A/P (Accounts Payable Scheduled)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full">
                    <LocationAutocomplete
                      value={newForm.location}
                      onChange={(val) => setNewForm((prev) => ({ ...prev, location: val }))}
                      placeholder="Search or enter location..."
                      label="Location"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                    <span>Product / Vendor Link (URL)</span>
                    {newForm.item_url && (
                      <a
                        href={newForm.item_url.startsWith("http") ? newForm.item_url : `https://${newForm.item_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Test Link</span>
                      </a>
                    )}
                  </label>
                  <Input
                    type="url"
                    value={newForm.item_url}
                    onChange={(e) =>
                      setNewForm({ ...newForm, item_url: e.target.value })
                    }
                    placeholder="https://example.com/product-or-subscription"
                    className="h-10 text-sm font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5 flex-1 flex flex-col">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Description / Terms</label>
                  <textarea
                    className="w-full text-sm rounded-lg border border-input bg-background px-3 py-2.5 flex-1 min-h-[95px] focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    placeholder="Monthly billing schedule, renewal terms, invoice reference..."
                    value={newForm.description}
                    onChange={(e) =>
                      setNewForm({ ...newForm, description: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Right Column: Schedule Dates Builder */}
              <div className="lg:col-span-6 flex flex-col h-full">
                <ScheduleDatesBuilder
                  isScheduled={newForm.is_scheduled}
                  onIsScheduledChange={(val) => setNewForm((p) => ({ ...p, is_scheduled: val }))}
                  frequency={newForm.frequency}
                  onFrequencyChange={(val) => setNewForm((p) => ({ ...p, frequency: val }))}
                  startDate={newForm.start_date}
                  onStartDateChange={(val) => setNewForm((p) => ({ ...p, start_date: val }))}
                  endDate={newForm.end_date}
                  onEndDateChange={(val) => setNewForm((p) => ({ ...p, end_date: val }))}
                  scheduleDates={newForm.schedule_dates}
                  onScheduleDatesChange={(dates) => setNewForm((p) => ({ ...p, schedule_dates: dates }))}
                  baseAmount={parseFloat(newForm.amount) || 0}
                  currency={newForm.currency || "USD"}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5">
                {createMutation.isPending ? "Creating..." : "Create Recurring Request"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
  );
}
