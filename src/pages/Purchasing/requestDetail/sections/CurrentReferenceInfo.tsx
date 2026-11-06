import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "../../utils/purchasingMeta";
import type { RequestDetailViewState } from "../hooks/useRequestDetailTail";

export function CurrentReferenceInfo({ v }: { v: RequestDetailViewState }) {
  const { completeData, setCompleteData, calculateNextDueDate, request, isRecurring, activeForm } = v;
  return (
    <>
      {activeForm?.kind === "complete" && (
              <div className="space-y-4">
                {/* Current Reference Info */}
                <div className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/50 p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 dark:text-zinc-300">Request:</span>
                    <span className="font-medium text-slate-900 dark:text-zinc-100">{request.title}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 dark:text-zinc-300">Current Due Date:</span>
                    <span className="font-mono text-slate-800 dark:text-zinc-200 font-semibold">
                      {request.due_date ? formatDate(request.due_date) : "Not Set (Using Today)"}
                    </span>
                  </div>
                  {isRecurring && (
                    <div className="text-[11.5px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded border border-amber-200 dark:border-amber-900/60 mt-1 leading-relaxed">
                      ℹ️ Marking as complete will finalize the current cycle and advance this recurring request to <strong>Under Review</strong> for the upcoming cycle due on the date chosen below.
                    </div>
                  )}
                </div>

                {/* Mode Selection / Quick Period Buttons */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                    Select Period (Auto-Calculate)
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(
                      [
                        { id: "BI_WEEKLY", label: "Bi-Weekly", sub: "+14 Days" },
                        { id: "MONTHLY", label: "Monthly", sub: "+1 Month" },
                        { id: "ANNUALLY", label: "Annually", sub: "+1 Year" },
                      ] as const
                    ).map((opt) => {
                      const isSelected = completeData.selectionType === "PERIOD" && completeData.period === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            const baseDate = request.due_date || request.request_date || new Date().toISOString().split("T")[0];
                            const nextDue = calculateNextDueDate(baseDate, opt.id);
                            setCompleteData({
                              ...completeData,
                              selectionType: "PERIOD",
                              period: opt.id,
                              next_due_date: nextDue,
                            });
                          }}
                          className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all cursor-pointer",
                            isSelected
                              ? "border-indigo-600 bg-indigo-50/90 text-indigo-900 font-semibold ring-2 ring-indigo-400/40 dark:border-indigo-500 dark:bg-indigo-950/70 dark:text-indigo-200"
                              : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 shadow-xs"
                          )}
                        >
                          <span className="text-xs font-semibold">{opt.label}</span>
                          <span className="text-[11px] opacity-70 mt-0.5">{opt.sub}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Target Next Due Date Picker */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Next Due Date <span className="text-red-500">*</span>
                    </label>
                    {completeData.selectionType === "PERIOD" && (
                      <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                        Calculated by {completeData.period === "BI_WEEKLY" ? "Bi-Weekly" : completeData.period === "MONTHLY" ? "Monthly" : "Annually"}
                      </span>
                    )}
                  </div>
                  <Input
                    type="date"
                    value={completeData.next_due_date}
                    onChange={(e) => {
                      setCompleteData({
                        ...completeData,
                        selectionType: "DATE",
                        next_due_date: e.target.value,
                      });
                    }}
                    className="font-mono text-sm bg-white dark:bg-zinc-900 cursor-pointer"
                  />
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-zinc-400 font-medium pt-0.5">
                    <Calendar className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    <span>
                      Next Due Date: <strong className="text-slate-900 dark:text-zinc-100">{formatDate(completeData.next_due_date)}</strong>
                    </span>
                  </div>
                </div>

                {/* Optional Note / Comment */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                    Completion Note / Memo <span className="text-slate-400 text-[11px]">(Optional)</span>
                  </label>
                  <Textarea
                    rows={2}
                    placeholder="e.g., Cycle payment finalized and marked complete..."
                    value={completeData.comment}
                    onChange={(e) => setCompleteData({ ...completeData, comment: e.target.value })}
                    className="text-xs bg-white dark:bg-zinc-900"
                  />
                </div>
              </div>
            )}
    </>
  );
}
