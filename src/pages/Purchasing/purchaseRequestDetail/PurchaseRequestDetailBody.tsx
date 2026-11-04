import { ArrowLeft, Edit2, Trash2, PauseCircle, PlayCircle, ExternalLink } from "lucide-react";
import { type WireTransferInput } from "@/types/purchasing";
import { FilePreviewModal } from "../dialogs/FilePreviewModal";
import { WireTransferDialog } from "../dialogs/WireTransferDialog";
import { ChangeLevel1ApproverModal } from "../dialogs/ChangeLevel1ApproverModal";
import { ScheduleBreakdownModal } from "../dialogs/ScheduleBreakdownModal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { PurchaseRequestDetailGuardedState } from "./hooks/usePurchaseRequestDetail";
import { usePurchaseRequestDetailTail } from "./hooks/usePurchaseRequestDetailTail";
import { MainRequestHeaderBanner } from "./sections/MainRequestHeaderBanner";
import { AllPaymentsActionSchedule } from "./sections/AllPaymentsActionSchedule";
import { RequestDetailsPropertyTable } from "./sections/RequestDetailsPropertyTable";
import { WireTransferDetailsCard } from "./sections/WireTransferDetailsCard";
import { InvoiceDetailsCardOption } from "./sections/InvoiceDetailsCardOption";
import { ScheduledRangePaymentHorizon } from "./sections/ScheduledRangePaymentHorizon";
import { TabsApprovalsAttachmentsHistory } from "./sections/TabsApprovalsAttachmentsHistory";
import { EditRequestModal } from "./sections/EditRequestModal";
import { RecordInvoiceDialog } from "./sections/RecordInvoiceDialog";

export function PurchaseRequestDetailBody({ s }: { s: PurchaseRequestDetailGuardedState }) {
  const v = { ...s, ...usePurchaseRequestDetailTail(s) };
  const { refetch, request, setIsChangeApproverOpen, isChangeApproverOpen, previewTarget, handleClosePreview, isPreviewOpen, deleteMutation, setIsDeleteDialogOpen, isDeleteDialogOpen, transitionMutation, setHoldReason, setIsHoldDialogOpen, holdReason, isHoldDialogOpen, queryClient, id, setIsEditWireOpen, updateWireTransfer, requestDetail, isEditWireOpen, setIsScheduleLedgerOpen, handleOpenEdit, isScheduleLedgerOpen, formattedItemUrl, canPutOnHold, isOnHold, navigate } = v;
  return (
    <div className="w-full space-y-6 pb-12">
      {/* ── Top Navigation Action Bar ── */}
      <div className="flex items-center justify-between gap-4 pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/purchasing/recurring")}
          className="text-xs gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Recurring
        </Button>

        <div className="flex items-center gap-2">
          {isOnHold ? (
            <Button
              size="sm"
              onClick={() =>
                transitionMutation.mutate({
                  action: "RESUME_WORKFLOW",
                  comment: "Resumed workflow from On Hold",
                })
              }
              disabled={transitionMutation.isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1.5 shadow-xs font-semibold"
            >
              <PlayCircle className="h-3.5 w-3.5" />
              Resume Workflow
            </Button>
          ) : canPutOnHold ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsHoldDialogOpen(true)}
              className="text-rose-700 border-rose-300 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-300 text-xs gap-1.5 shadow-xs font-medium"
            >
              <PauseCircle className="h-3.5 w-3.5 text-rose-600" />
              Put on Hold
            </Button>
          ) : null}

          {formattedItemUrl && (
            <a
              href={formattedItemUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 transition-colors shadow-2xs shrink-0"
              title={`Open vendor product page in new tab: ${formattedItemUrl}`}
            >
              <ExternalLink className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>Open Link ↗</span>
            </a>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 text-xs gap-1.5 shadow-xs"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Request
          </Button>
          <Button
            size="sm"
            onClick={handleOpenEdit}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5 shadow-xs"
          >
            <Edit2 className="h-3.5 w-3.5" />
            Edit Request
          </Button>
        </div>
      </div>

      {/* ── Main Request Header Banner ── */}
      <MainRequestHeaderBanner v={v} />

      {/* ── ALL PAYMENTS & ACTION SCHEDULE ── */}
      <AllPaymentsActionSchedule v={v} />

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Primary Column (7 cols): Request Details & Invoices */}
        <div className="lg:col-span-7 space-y-6">
          {/* Request Details Property Table */}
          <RequestDetailsPropertyTable v={v} />

          {/* ── Wire Transfer Details Card ── */}
          <WireTransferDetailsCard v={v} />

          {/* ── Invoice Details Card (Option A: Collapsible Table with Inline Drawers) ── */}
          <InvoiceDetailsCardOption v={v} />
        </div>

        {/* Right Column (5 cols): Scheduled Horizon & Tabbed Activity */}
        <div className="lg:col-span-5 space-y-6">
          {/* Scheduled Range & Payment Horizon Card */}
          <ScheduledRangePaymentHorizon v={v} />

          {/* ── Tabs: Approvals, Attachments & History ── */}
          <TabsApprovalsAttachmentsHistory v={v} />
        </div>
      </div>

      {/* ── Edit Request Modal ── */}
      <EditRequestModal v={v} />

      {/* ── Record Invoice Dialog ── */}
      <RecordInvoiceDialog v={v} />

      {/* ── Schedule Breakdown Ledger Modal ── */}
      <ScheduleBreakdownModal
        request={request}
        open={isScheduleLedgerOpen}
        onOpenChange={setIsScheduleLedgerOpen}
        onEditRequest={() => {
          setIsScheduleLedgerOpen(false);
          handleOpenEdit();
        }}
        onEditWireInfo={() => {
          setIsScheduleLedgerOpen(false);
          setIsEditWireOpen(true);
        }}
      />

      {/* ── Wire Transfer Dialog (Edit / Record Wire Details) ── */}
      {request && (
        <WireTransferDialog
          open={isEditWireOpen}
          onOpenChange={setIsEditWireOpen}
          request={request}
          purchaseOrder={requestDetail?.purchase_order}
          initialData={requestDetail?.wire_transfer || (request as any)?.wire_transfer}
          isEditMode={Boolean(requestDetail?.wire_transfer || (request as any)?.wire_transfer)}
          isSubmitting={updateWireTransfer.isPending}
          onConfirm={async (data: WireTransferInput) => {
            await updateWireTransfer.mutateAsync(data);
            setIsEditWireOpen(false);
            queryClient.invalidateQueries({ queryKey: ["purchasing", "request", id] });
            queryClient.invalidateQueries({ queryKey: ["recurring-requests"] });
          }}
        />
      )}

      {/* ── Put On Hold Dialog ── */}
      <Dialog open={isHoldDialogOpen} onOpenChange={setIsHoldDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2.5 text-rose-600">
              <PauseCircle className="h-5 w-5" />
              <DialogTitle className="text-lg font-bold">Put Recurring Payment On Hold</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Temporarily pause processing and cycle advancement for this recurring payment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Reason for Hold <span className="text-muted-foreground font-normal">(Optional)</span>
              </label>
              <textarea
                className="w-full text-sm rounded-lg border border-input bg-background px-3 py-2 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                placeholder="e.g. Contract renegotiation, vendor billing verification, budget freeze..."
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsHoldDialogOpen(false);
                setHoldReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={transitionMutation.isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white font-medium"
              onClick={() => {
                transitionMutation.mutate(
                  {
                    action: "PUT_ON_HOLD",
                    comment: holdReason.trim() || "Put on hold",
                    hold: { reason: holdReason.trim() || "No reason provided" },
                  },
                  {
                    onSuccess: () => {
                      setIsHoldDialogOpen(false);
                      setHoldReason("");
                    },
                  }
                );
              }}
            >
              {transitionMutation.isPending ? "Putting on Hold..." : "Confirm Hold"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recurring Payment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong className="text-slate-900 dark:text-zinc-100">{request?.title}</strong> (ID #{request?.id})? This will permanently remove the recurring payment schedule and all associated cycle records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Payment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FilePreviewModal
        open={isPreviewOpen}
        onOpenChange={handleClosePreview}
        target={previewTarget}
      />
      {request && (
        <ChangeLevel1ApproverModal
          open={isChangeApproverOpen}
          onOpenChange={setIsChangeApproverOpen}
          request={request}
          onSuccess={() => {
            refetch();
          }}
        />
      )}
    </div>
  );
}
