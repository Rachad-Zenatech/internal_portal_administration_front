import { PageConnectionBanner } from "@/components/ui/PageConnectionBanner";
import { FloatingVerticalFilter } from "@/components/ui/FloatingVerticalFilter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Calendar as CalendarIcon, CalendarClock, Table as TableIcon, Plus, AlertTriangle, Search, CheckCircle2, Clock, RefreshCw, ChevronLeft, ChevronRight, XCircle, Layers, PauseCircle } from "lucide-react";
import { ScheduleBreakdownModal } from "../dialogs/ScheduleBreakdownModal";
import { WireTransferDialog } from "../dialogs/WireTransferDialog";
import { MasterTransactionsTable } from "../components/MasterTransactionsTable";
import type { RecurringPaymentsGuardedState } from "./hooks/useRecurringPayments";
import { useRecurringPaymentsTail } from "./hooks/useRecurringPaymentsTail";
import { CompactInteractiveKpiFilter } from "./sections/CompactInteractiveKpiFilter";
import { RecurringRequestsTable } from "./sections/RecurringRequestsTable";
import { CalendarGrid } from "./sections/CalendarGrid";
import { CalendarItemQuickPreview } from "./sections/CalendarItemQuickPreview";
import { CreateRecurringRequestModal } from "./sections/CreateRecurringRequestModal";
import { EditRecurringRequestModal } from "./sections/EditRecurringRequestModal";
import { useFitToScreen } from "@/components/common/FluidList";

export function RecurringPaymentsBody({ s }: { s: RecurringPaymentsGuardedState }) {
  const v = { ...s, ...useRecurringPaymentsTail(s) };
  const { handleSaveWire, isUpdatingWire, wireModalRequest, setWireModalRequest, handleOpenWireModal, setScheduleModalRequest, handleOpenEdit, canManageRecurring, scheduleModalRequest, deleteMutation, requestToDelete, setRequestToDelete, month, year, setCurrentCalendarDate, monthName, viewMode, reviewMutation, isSuperAdmin, isAP, isLoading, filteredRequests, setStatusFilter, statusFilter, setReviewFilter, reviewFilter, setPriorityFilter, priorityFilter, setDueFilter, dueFilter, setSearchTerm, searchTerm, kpiRef, handleCardFilterChange, cardFilter, stats, handleOpenCreate, canCreateRecurring, setViewMode } = v;
  const fit = useFitToScreen();
  return (
    <div className="w-full flex flex-col gap-3 sm:gap-3.5 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      {/* Header */}
      <PageConnectionBanner serviceName="Cross-Portal AP & Treasury Integration" mode="Connected (Live)" description="Real-time multi-entity recurring payments and installment tracking" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Recurring Payments</h1>
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800">
              AP & Treasury
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Manage recurring subscriptions, process workflow from New Request → Waiting for Payment → Invoice (Fixed Assets) → Completed, and track AP review statuses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-lg border border-slate-200 dark:border-zinc-700">
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              className={`h-8 gap-1.5 text-xs font-semibold transition-all ${
                viewMode === "table"
                  ? "bg-primary text-primary-foreground shadow-xs hover:bg-primary/95"
                  : "text-muted-foreground hover:text-foreground hover:bg-slate-200/60 dark:hover:bg-zinc-700/60"
              }`}
              onClick={() => setViewMode("table")}
            >
              <TableIcon size={14} />
              Subscriptions
            </Button>
            <Button
              variant={viewMode === "calendar" ? "default" : "ghost"}
              size="sm"
              className={`h-8 gap-1.5 text-xs font-semibold transition-all ${
                viewMode === "calendar"
                  ? "bg-primary text-primary-foreground shadow-xs hover:bg-primary/95"
                  : "text-muted-foreground hover:text-foreground hover:bg-slate-200/60 dark:hover:bg-zinc-700/60"
              }`}
              onClick={() => setViewMode("calendar")}
            >
              <CalendarIcon size={14} />
              Calendar View
            </Button>
            <Button
              variant={viewMode === "master" ? "default" : "ghost"}
              size="sm"
              className={`h-8 gap-1.5 text-xs font-semibold transition-all ${
                viewMode === "master"
                  ? "bg-primary text-primary-foreground shadow-xs hover:bg-primary/95"
                  : "text-muted-foreground hover:text-foreground hover:bg-slate-200/60 dark:hover:bg-zinc-700/60"
              }`}
              onClick={() => setViewMode("master")}
            >
              <Layers size={14} />
              Master View
            </Button>
          </div>

          {canCreateRecurring && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleOpenCreate}
                className="h-9 gap-1.5 bg-sky-600 hover:bg-sky-700 text-white shadow-xs"
              >
                <Plus size={16} />
                New Recurring Request
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Slim Vertical Floating Quick Filter (Follows card colors & appears on scroll) */}
      <FloatingVerticalFilter
        items={[
          {
            key: "ALL",
            label: "All Recurring Payments",
            count: stats.total,
            icon: RefreshCw,
            color: "blue",
          },
          {
            key: "MA_SCHEDULED",
            label: "M&A Scheduled",
            count: stats.maScheduled,
            icon: CalendarClock,
            color: "violet",
          },
          {
            key: "DUE_SOON",
            label: "Due in 7 Days",
            count: stats.dueSoon,
            icon: AlertTriangle,
            color: "amber",
          },
          {
            key: "WAITING_REVIEW",
            label: "Waiting Review",
            count: stats.waitingReview,
            icon: Clock,
            color: "amber",
          },
          {
            key: "REVIEWED",
            label: "Reviewed (AP)",
            count: stats.reviewed,
            icon: CheckCircle2,
            color: "sky",
          },
          {
            key: "ON_HOLD",
            label: "On Hold",
            count: stats.onHold,
            icon: PauseCircle,
            color: "rose",
          },
          {
            key: "COMPLETED",
            label: "Completed",
            count: stats.completed,
            icon: CheckCircle2,
            color: "green",
          },
          {
            key: "REJECTED",
            label: "Rejected",
            count: stats.rejected,
            icon: XCircle,
            color: "rose",
          },
        ]}
        activeKey={cardFilter}
        onSelect={handleCardFilterChange}
        defaultKey="ALL"
        onReset={() => handleCardFilterChange("ALL")}
        scrollThreshold={130}
        title="Subscriptions"
        kpiRef={kpiRef}
      />

      {/* Compact Interactive KPI Filter Cards */}
      <CompactInteractiveKpiFilter v={v} />

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search recurring payments by title, requester, department, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Select value={dueFilter} onValueChange={setDueFilter}>
            <SelectTrigger className="w-[150px] h-9 text-xs">
              <SelectValue placeholder="Due Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Due Dates</SelectItem>
              <SelectItem value="DUE_TODAY">Due Today</SelectItem>
              <SelectItem value="DUE_7_DAYS">Due in 7 Days</SelectItem>
              <SelectItem value="OVERDUE">Overdue</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Priorities</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={reviewFilter} onValueChange={setReviewFilter}>
            <SelectTrigger className="w-[160px] h-9 text-xs">
              <SelectValue placeholder="Review Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Review States</SelectItem>
              <SelectItem value="WAITING_FOR_REVIEW">Waiting for Review</SelectItem>
              <SelectItem value="REVIEWED">Reviewed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-9 text-xs">
              <SelectValue placeholder="Workflow Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Workflow Statuses</SelectItem>
              <SelectItem value="INITIAL">Draft</SelectItem>
              <SelectItem value="WAITING_PAYMENT">Waiting Payment</SelectItem>
              <SelectItem value="INVOICE_RECEIVED">Invoice Received</SelectItem>
              <SelectItem value="ON_HOLD">On Hold</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

            {/* Main View: Master, Table, or Calendar */}
      {viewMode === "master" ? (
        <MasterTransactionsTable
          requests={filteredRequests}
          isLoading={isLoading}
          isAP={isAP}
          isSuperAdmin={isSuperAdmin}
          onOpenBreakdownModal={(req) => setScheduleModalRequest(req)}
          onToggleReviewStatus={(req) => {
            const revStatus = req.review_status || "WAITING_FOR_REVIEW";
            const isRev = revStatus === "REVIEWED";
            reviewMutation.mutate({
              id: req.id,
              review_status: isRev ? "WAITING_FOR_REVIEW" : "REVIEWED",
            });
          }}
          reviewMutationPending={reviewMutation.isPending}
        />
      ) : viewMode === "table" ? (
        <Card {...fit} className="border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xs bg-white dark:bg-zinc-900 overflow-hidden flex flex-col">
          <RecurringRequestsTable v={v} />
        </Card>
      ) : (
        /* Calendar View */
        <Card className="border border-slate-200 dark:border-zinc-800 p-6">
          {/* Calendar Month Header & Legend */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100">
                {monthName} {year}
              </h2>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs font-semibold"
                onClick={() => setCurrentCalendarDate(new Date())}
              >
                Today
              </Button>
            </div>

            {/* Legend & Navigation */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-3 text-xs text-muted-foreground mr-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                  <span>Reviewed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span>Waiting Review</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    setCurrentCalendarDate(new Date(year, month - 1, 1))
                  }
                  title="Previous Month"
                >
                  <ChevronLeft size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    setCurrentCalendarDate(new Date(year, month + 1, 1))
                  }
                  title="Next Month"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
            <div className="py-1 bg-slate-50 dark:bg-zinc-800/60 rounded">Sun</div>
            <div className="py-1 bg-slate-50 dark:bg-zinc-800/60 rounded">Mon</div>
            <div className="py-1 bg-slate-50 dark:bg-zinc-800/60 rounded">Tue</div>
            <div className="py-1 bg-slate-50 dark:bg-zinc-800/60 rounded">Wed</div>
            <div className="py-1 bg-slate-50 dark:bg-zinc-800/60 rounded">Thu</div>
            <div className="py-1 bg-slate-50 dark:bg-zinc-800/60 rounded">Fri</div>
            <div className="py-1 bg-slate-50 dark:bg-zinc-800/60 rounded">Sat</div>
          </div>

          {/* Calendar Grid */}
          <CalendarGrid v={v} />
        </Card>
      )}

      {/* Calendar Item Quick Preview Modal */}
      <CalendarItemQuickPreview v={v} />

      {/* Create Recurring Request Modal */}
      <CreateRecurringRequestModal v={v} />

      {/* Edit Recurring Request Modal */}
      <EditRecurringRequestModal v={v} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!requestToDelete} onOpenChange={(open) => !open && setRequestToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recurring Payment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong className="text-slate-900 dark:text-zinc-100">{requestToDelete?.title}</strong> (ID #{requestToDelete?.id})? This will permanently remove the recurring payment schedule and all associated cycle records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (requestToDelete) {
                  deleteMutation.mutate(requestToDelete.id);
                }
              }}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Payment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Schedule Breakdown Ledger Modal */}
      <ScheduleBreakdownModal
        request={scheduleModalRequest}
        open={!!scheduleModalRequest}
        onOpenChange={(open) => !open && setScheduleModalRequest(null)}
        // Without onEditRequest the modal links to the request detail page instead.
        onEditRequest={canManageRecurring ? (req) => {
          setScheduleModalRequest(null);
          handleOpenEdit(req);
        } : undefined}
        onEditWireInfo={(req) => {
          setScheduleModalRequest(null);
          handleOpenWireModal(req, (req as any)?.wire_transfer);
        }}
      />

      {/* Wire Transfer Dialog (Edit / Record Wire Info for Scheduled Payment) */}
      {wireModalRequest && (
        <WireTransferDialog
          open={!!wireModalRequest}
          onOpenChange={(open) => !open && setWireModalRequest(null)}
          request={wireModalRequest}
          initialData={(wireModalRequest as any)?.wire_transfer}
          isEditMode={Boolean((wireModalRequest as any)?.wire_transfer)}
          title="Edit Wire Transfer"
          submitLabel="Save Changes"
          isSubmitting={isUpdatingWire}
          onConfirm={handleSaveWire}
        />
      )}
    </div>
  );
}
