import { Edit2, ExternalLink } from "lucide-react";
import LocationAutocomplete from "../../fields/LocationAutocomplete";
import { type Priority } from "@/types/purchasing";
import { ScheduleDatesBuilder } from "../../fields/ScheduleDatesBuilder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CurrencyAutocomplete } from "../../fields/CurrencyAutocomplete";
import type { PurchaseRequestDetailViewState } from "../hooks/usePurchaseRequestDetailTail";

export function EditRequestModal({ v }: { v: PurchaseRequestDetailViewState }) {
  const { updateMutation, setIsEditOpen, editForm, setEditForm, request, handleEditSubmit, isEditOpen } = v;
  return (
    <>
      {isEditOpen && (
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-[1440px] 2xl:max-w-[1600px] max-h-[92vh] overflow-y-auto p-6 sm:p-8 rounded-2xl">
            <form onSubmit={handleEditSubmit} className="space-y-5">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50 shadow-2xs shrink-0">
                    <Edit2 className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold text-slate-900 dark:text-zinc-100">
                      Edit Recurring Payment Request #{request.id}
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      Update recurring subscription details, amount, schedule milestones, and GL account mapping.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 py-2">
                {/* Left Column: General Details */}
                <div className="lg:col-span-6 space-y-4 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Title / Service Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="h-10 text-sm font-medium"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                          Amount ({editForm.currency || "USD"}) <span className="text-red-500">*</span>
                        </label>
                        {editForm.is_scheduled && editForm.frequency === "CUSTOM" ? (
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                            (Installments)
                          </span>
                        ) : editForm.is_scheduled ? (
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                            (Per cycle)
                          </span>
                        ) : null}
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">{editForm.currency || "USD"}</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={
                            editForm.is_scheduled && editForm.frequency === "CUSTOM" && editForm.schedule_dates.length > 0
                              ? (editForm.schedule_dates.reduce((acc, itm) => acc + (itm.amount != null ? itm.amount : 0), 0) || "").toString()
                              : editForm.amount
                          }
                          onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                          disabled={editForm.is_scheduled && editForm.frequency === "CUSTOM"}
                          className="h-10 text-sm font-mono pl-12 disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed"
                          required={!(editForm.is_scheduled && editForm.frequency === "CUSTOM")}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Currency</label>
                      <CurrencyAutocomplete
                        value={editForm.currency || "USD"}
                        onChange={(code) => setEditForm((prev) => ({ ...prev, currency: (code || "USD").toUpperCase() }))}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        Frequency <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={editForm.frequency}
                        onValueChange={(val: any) => setEditForm({ ...editForm, frequency: val })}
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
                        {editForm.is_scheduled && editForm.frequency === "CUSTOM" && (
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                            (From Schedule)
                          </span>
                        )}
                      </div>
                      <Input
                        type="date"
                        value={
                          editForm.is_scheduled && editForm.frequency === "CUSTOM" && editForm.schedule_dates.length > 0
                            ? (editForm.schedule_dates[0]?.date || editForm.due_date)
                            : editForm.due_date
                        }
                        onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                        disabled={editForm.is_scheduled && editForm.frequency === "CUSTOM"}
                        className="h-10 text-sm disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Requester</label>
                      <Input
                        value={editForm.requester}
                        onChange={(e) => setEditForm({ ...editForm, requester: e.target.value })}
                        className="h-10 text-sm"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Department</label>
                      <Input
                        value={editForm.department}
                        onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                        className="h-10 text-sm"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Priority</label>
                      <Select
                        value={editForm.priority}
                        onValueChange={(val) => setEditForm({ ...editForm, priority: val as Priority })}
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

                  <div>
                    <LocationAutocomplete
                      value={editForm.location}
                      onChange={(val) => setEditForm((prev) => ({ ...prev, location: val }))}
                      placeholder="Search or enter location..."
                      label="Location"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                      <span>Product / Web Link (URL)</span>
                      {editForm.item_url?.trim() && (
                        <a
                          href={editForm.item_url.startsWith("http") ? editForm.item_url : `https://${editForm.item_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-normal"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Test Link</span>
                        </a>
                      )}
                    </label>
                    <Input
                      type="url"
                      placeholder="https://example.com/product"
                      value={editForm.item_url}
                      onChange={(e) => setEditForm({ ...editForm, item_url: e.target.value })}
                      className="h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5 flex-1 flex flex-col">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Description / Terms</label>
                    <textarea
                      className="w-full text-sm rounded-lg border border-input bg-background px-3 py-2.5 flex-1 min-h-[95px] focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    />
                  </div>
                </div>

                {/* Right Column: Schedule Dates Builder */}
                <div className="lg:col-span-6 flex flex-col h-full">
                  <ScheduleDatesBuilder
                    currency={editForm.currency || "USD"}
                    isScheduled={editForm.is_scheduled}
                    onIsScheduledChange={(val) => setEditForm((p) => ({ ...p, is_scheduled: val }))}
                    frequency={editForm.frequency}
                    onFrequencyChange={(val) => setEditForm((p) => ({ ...p, frequency: val }))}
                    startDate={editForm.start_date}
                    onStartDateChange={(val) => setEditForm((p) => ({ ...p, start_date: val }))}
                    endDate={editForm.end_date}
                    onEndDateChange={(val) => setEditForm((p) => ({ ...p, end_date: val }))}
                    scheduleDates={editForm.schedule_dates}
                    onScheduleDatesChange={(dates) => setEditForm((p) => ({ ...p, schedule_dates: dates }))}
                    baseAmount={parseFloat(editForm.amount) || 0}
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5">
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
