import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "../../ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../ui/alert-dialog";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Trash2, AlertTriangle } from "lucide-react";
import Stepper from "@/components/common/Stepper";
import { RequestStatus } from "@/types/purchasing";
import { parseRequestStatus } from "@/lib/requestStatus";
import { getStatusBadge, getStatusLabel, PRIORITY_BADGE, formatRequestType } from "@/pages/Purchasing/utils/purchasingMeta";
import type { TaskDetailPanelGuardedState } from "./hooks/useTaskDetailPanel";
import { useTaskDetailPanelTail } from "./hooks/useTaskDetailPanelTail";
import { OverviewDetailCardsColumn } from "./sections/OverviewDetailCardsColumn";
import { NotesActivityTabsColumn } from "./sections/NotesActivityTabsColumn";

export function TaskDetailPanelBody({ s }: { s: TaskDetailPanelGuardedState }) {
  const v = { ...s, ...useTaskDetailPanelTail(s) };
  const { confirmDeleteNote, setDeleteNoteId, deleteNoteId, handleApprove, handleReject, canApprove, task, flow, afterTaxAmount, taskTax, totalAmount, formatGLCode, handleDelete, readOnly, onClose } = v;
  return (
    <Sheet open={!!task} onOpenChange={(open) => !open && onClose()}>
      <SheetContent aria-describedby={undefined} className="!max-w-[90vw] lg:!max-w-[80vw] !w-[90vw] lg:!w-[80vw] flex flex-col p-0 bg-slate-100 dark:bg-zinc-950 text-foreground border-l border-slate-200 dark:border-zinc-800 shadow-2xl">
        {/* Header */}
        <SheetHeader className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 p-4 sm:p-6 shrink-0 pr-14 shadow-2xs">

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                    #{task.id}
                  </span>
                  <SheetTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    {task.product_name || "Task Overview"}
                  </SheetTitle>
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={handleDelete}
                      title="Delete Order"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={getStatusBadge(task.status)}>
                    {getStatusLabel(task.status)}
                  </Badge>
                  <Badge variant="outline" className={PRIORITY_BADGE[task.priority?.toUpperCase()] || "bg-slate-100 text-slate-800"}>
                    {task.priority || 'Medium'}
                  </Badge>
                  <Badge variant="outline" className="bg-slate-100 dark:bg-zinc-800 font-mono text-xs">
                    {formatRequestType(task.category || task.request_type || 'SPEND')}
                  </Badge>
                  {task.gl_code && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800 font-mono text-xs">
                      GL: {formatGLCode(task.gl_code)}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="text-left sm:text-right space-y-1 bg-white dark:bg-zinc-900 p-3 rounded-lg border border-slate-200 dark:border-zinc-800 shadow-sm min-w-[180px]">
                <div className="text-xs text-muted-foreground font-medium">Total Pre-Tax</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  ${totalAmount.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">{task.currency || "USD"}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {task.invoice?.actual_cost_after_tax != null ? (
                    <>Actual After-Tax: <span className="font-semibold text-slate-700 dark:text-slate-300">{Number(task.invoice.actual_cost_after_tax).toFixed(2)} {task.invoice.currency || task.currency || "USD"}</span></>
                  ) : (
                    <>Est. After-Tax ({taskTax.label}): <span className="font-semibold text-slate-700 dark:text-slate-300">{afterTaxAmount.toFixed(2)} {task.currency || "USD"}</span></>
                  )}
                </div>
              </div>
            </div>
        </SheetHeader>

        <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4 bg-slate-50/70 dark:bg-zinc-950">
          {/* Stepper Card */}
          <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
            <CardContent className="p-4 sm:p-5">
              <Stepper flow={flow} requestStatus={task.status} />
              {parseRequestStatus(task.status) === RequestStatus.Rejected && (
                <p className="mt-3 text-sm font-medium text-red-600">This order was rejected.</p>
              )}
            </CardContent>
          </Card>

          {/* Hold Alert */}
          {task.status === "ON_HOLD" && task.hold_reason && (
            <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4 !text-amber-600 dark:!text-amber-400" />
              <AlertTitle className="flex items-center justify-between font-semibold">
                <span>On Hold</span>
                {task.hold_date && <span className="text-xs font-normal opacity-75">{format(new Date(task.hold_date), "MMM d, yyyy")}</span>}
              </AlertTitle>
              <AlertDescription className="mt-2 whitespace-pre-wrap">
                {task.hold_reason}
              </AlertDescription>
            </Alert>
          )}

          {/* Main Grid: Details on Left, Tabs on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Overview & Detail Cards Column */}
            <OverviewDetailCardsColumn v={v} />

            {/* Notes & Activity Tabs Column */}
            <NotesActivityTabsColumn v={v} />
          </div>
        </div>

        {canApprove && (
          <SheetFooter className="px-6 py-4 border-t bg-white dark:bg-zinc-900 flex-row sm:flex-row justify-center flex-wrap gap-4 sm:gap-6 mt-0 shadow-sm z-10">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground mr-1">Approval:</span>
              <Button onClick={handleReject} variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10">Reject</Button>
              <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700 text-white shadow-sm">Approve</Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>

      <AlertDialog open={deleteNoteId !== null} onOpenChange={(open) => !open && setDeleteNoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
              Any attached files will also be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteNote} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
