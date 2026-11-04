import PrioritySelector from "../../fields/PrioritySelector";
import { RequestStatus } from "@/types/purchasing";
import { parseRequestStatus } from "@/lib/requestStatus";
import { formatDate, formatMoney, getStatusBadge, getStatusLabel } from "../../utils/purchasingMeta";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarClock, ExternalLink } from "lucide-react";
import { formatRemainingDuration } from "../../utils/recurringScheduleUtils";
import type { RecurringPaymentsViewState } from "../hooks/useRecurringPaymentsTail";

export function CalendarItemQuickPreview({ v }: { v: RecurringPaymentsViewState }) {
  const { selectedCalendarItem, navigate, handleOpenEdit, setSelectedCalendarItem, canManageRecurring, setScheduleModalRequest, selectedCalendarInstallment } = v;
  return (
    <>
      {selectedCalendarItem && (
        <Dialog
          open={!!selectedCalendarItem}
          onOpenChange={(open) => !open && setSelectedCalendarItem(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-muted-foreground">
                  #{selectedCalendarItem.id}
                </span>
                <div className="flex items-center gap-1.5">
                  <PrioritySelector
                    requestId={selectedCalendarItem.id}
                    priority={selectedCalendarItem.priority}
                    size="xs"
                  />
                  <Badge
                    variant="outline"
                    className={getStatusBadge(selectedCalendarItem.status)}
                  >
                    {getStatusLabel(selectedCalendarItem.status)}
                    {selectedCalendarItem.recurring_schedule ? (
                      parseRequestStatus(selectedCalendarItem.status) === RequestStatus.Completed
                        ? (selectedCalendarItem.recurring_schedule.total_installments ? ` (${selectedCalendarItem.recurring_schedule.total_installments}/${selectedCalendarItem.recurring_schedule.total_installments} Cycles)` : "")
                        : (selectedCalendarItem.recurring_schedule.total_installments
                          ? ` (Cycle ${Math.min((selectedCalendarItem.recurring_schedule.completed_installments || 0) + 1, selectedCalendarItem.recurring_schedule.total_installments)}/${selectedCalendarItem.recurring_schedule.total_installments})`
                          : ` (Cycle ${(selectedCalendarItem.recurring_schedule.completed_installments || 0) + 1})`)
                    ) : ""}
                  </Badge>
                </div>
              </div>
              <DialogTitle className="text-lg font-bold mt-1">
                {selectedCalendarItem.title}
              </DialogTitle>
              <DialogDescription>
                Recurring subscription item details and review status.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 border-y text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-bold text-slate-900 dark:text-zinc-100">
                  {formatMoney(
                    selectedCalendarInstallment?.amount ?? selectedCalendarItem.amount,
                    selectedCalendarInstallment?.currency || selectedCalendarItem.currency || "USD"
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next Due Date:</span>
                <span className="font-medium">
                  {selectedCalendarItem.due_date
                    ? formatDate(selectedCalendarItem.due_date)
                    : formatDate(selectedCalendarItem.request_date)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Requester:</span>
                <span className="font-medium">{selectedCalendarItem.requester}</span>
              </div>
              {selectedCalendarItem.item_url && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Product Link:</span>
                  <a
                    href={selectedCalendarItem.item_url.startsWith("http") ? selectedCalendarItem.item_url : `https://${selectedCalendarItem.item_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline text-xs"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Open Product Page</span>
                  </a>
                </div>
              )}
              {selectedCalendarItem.recurring_schedule?.is_scheduled && (
                <>
                  <div className="flex justify-between items-center bg-indigo-50/60 dark:bg-indigo-950/30 p-2 rounded border border-indigo-100 dark:border-indigo-900/50">
                    <span className="text-indigo-900 dark:text-indigo-200 font-medium">Schedule Horizon:</span>
                    <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900 dark:text-indigo-200 font-semibold">
                      {formatRemainingDuration(selectedCalendarItem.recurring_schedule.end_date).text}
                    </Badge>
                  </div>
                  {selectedCalendarInstallment?.installmentNumber && (
                    <div className="flex justify-between text-xs text-slate-600 dark:text-zinc-400">
                      <span>Milestone Cycle:</span>
                      <span className="font-semibold text-slate-900 dark:text-zinc-100">
                        Installment #{selectedCalendarInstallment.installmentNumber} of {selectedCalendarInstallment.totalInstallments || selectedCalendarItem.recurring_schedule.total_installments}
                        {selectedCalendarInstallment.isProjected ? " (Projected)" : selectedCalendarInstallment.isPaid ? " (Settled)" : " (Current)"}
                      </span>
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 text-xs cursor-pointer"
                    onClick={() => {
                      setScheduleModalRequest(selectedCalendarItem);
                    }}
                  >
                    <CalendarClock className="h-3.5 w-3.5 mr-1" />
                    View Full Payment Schedule / Ledger
                  </Button>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Department:</span>
                <span>{selectedCalendarItem.department}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Review Status:</span>
                <Badge
                  variant="outline"
                  className={
                    selectedCalendarItem.review_status === "REVIEWED"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                      : "bg-amber-50 text-amber-700 border-amber-300"
                  }
                >
                  {selectedCalendarItem.review_status === "REVIEWED"
                    ? "Reviewed"
                    : "Waiting for Review"}
                </Badge>
              </div>
              {selectedCalendarItem.description && (
                <div className="pt-2">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Description:
                  </span>
                  <p className="text-xs text-slate-700 dark:text-zinc-300 mt-1 bg-slate-50 dark:bg-zinc-800 p-2 rounded">
                    {selectedCalendarItem.description}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              {canManageRecurring && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const itm = selectedCalendarItem;
                    setSelectedCalendarItem(null);
                    handleOpenEdit(itm);
                  }}
                >
                  Edit Request
                </Button>
              )}
              <Button
                size="sm"
                onClick={() =>
                  navigate(`/purchasing/requests/${selectedCalendarItem.id}`)
                }
              >
                Open Full Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
