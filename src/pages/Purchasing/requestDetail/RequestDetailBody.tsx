import { FileText, Package, Truck, Paperclip, Stamp, MessageSquare } from "lucide-react";
import { FilePreviewModal } from "../dialogs/FilePreviewModal";
import { ChangeLevel1ApproverModal } from "../dialogs/ChangeLevel1ApproverModal";
import { RequestMessageThread } from "../components/RequestMessageThread";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EditCombinedRequestDialog } from "../dialogs/EditCombinedRequestDialog";
import { ConvertToRecurringDialog } from "../dialogs/ConvertToRecurringDialog";
import { WireTransferDialog } from "../dialogs/WireTransferDialog";
import { formatDate, formatRequestType, formatActivityAction, formatActivityValue } from "../utils/purchasingMeta";
import { Field } from "./components/Field";
import type { RequestDetailGuardedState } from "./hooks/useRequestDetail";
import { useRequestDetailTail } from "./hooks/useRequestDetailTail";
import { TopNavigationRecordActions } from "./sections/TopNavigationRecordActions";
import { MainRequestHeaderFull } from "./sections/MainRequestHeaderFull";
import { RequestOverview } from "./sections/RequestOverview";
import { TopDetailsGrid } from "./sections/TopDetailsGrid";
import { FinancialAccountingSection } from "./sections/FinancialAccountingSection";
import { DedicatedRecurringContractSchedule } from "./sections/DedicatedRecurringContractSchedule";
import { ProductVendorUrlAi } from "./sections/ProductVendorUrlAi";
import { Tab2LineItems } from "./sections/Tab2LineItems";
import { Tab4InvoiceBill } from "./sections/Tab4InvoiceBill";
import { Tab5WireTransfer } from "./sections/Tab5WireTransfer";
import { Tab7PaymentHistory } from "./sections/Tab7PaymentHistory";
import { Tab6RecurringHorizon } from "./sections/Tab6RecurringHorizon";
import { ApprovalsTab } from "./sections/ApprovalsTab";
import { AttachmentsTab } from "./sections/AttachmentsTab";
import { RedirectApprovalDialog } from "./sections/RedirectApprovalDialog";
import { WorkflowStepperSection } from "./sections/WorkflowStepperSection";
import { RequestDetailActionDialog } from "./sections/RequestDetailActionDialog";

export function RequestDetailBody({ s }: { s: RequestDetailGuardedState }) {
  const v = { ...s, ...useRequestDetailTail(s) };
  const { available_actions, onAction, previewTarget, handleClosePreview, isPreviewOpen, updateWireTransfer, handleUpdateWire, data, setIsEditWireOpen, isEditWireOpen, transition, handleConfirmWire, setIsWireDialogOpen, isWireDialogOpen, id, queryClient, setIsChangeApproverOpen, isChangeApproverOpen, setActiveDetailTab, approvals, setIsActivityLogsOpen, isActivityLogsOpen, refetch, request, setIsConvertToRecurringOpen, isConvertToRecurringOpen, setIsEditOpen, isEditOpen, purchase_order, hasPoTab, multiPartsList, isRecurring, activeDetailTab } = v;

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      {/* Top Navigation & Record Actions */}
      <TopNavigationRecordActions v={v} />

      {/* Main Request Header (Full Width) */}
      <MainRequestHeaderFull v={v} />

      {/* Stepper & 3-Way Matching Section */}
      <WorkflowStepperSection v={v} />

      {/* Rent / Note wire transfers: every payment of the series up front, like a scheduled payment */}
      <Tab7PaymentHistory v={v} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={v.hasPaymentsTab ? "lg:col-span-7 space-y-4" : "lg:col-span-8 xl:col-span-9 space-y-4"}>
          <Tabs value={activeDetailTab} onValueChange={setActiveDetailTab} className="w-full space-y-4">
            <RequestOverview v={v} />

            {/* TAB 1: Request Overview */}
            <TabsContent value="overview" className="m-0 focus-visible:outline-none space-y-6">
              <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/30">
                  <CardTitle className="text-base font-semibold flex items-center justify-between text-slate-900 dark:text-zinc-100">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span>Request Overview</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs font-normal bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700">
                        {formatRequestType(request.request_type)}
                      </Badge>
                      {!isRecurring && (
                        request.item_mode === "MULTIPLE" || (request.items && request.items.length > 0) ? (
                          <Badge variant="outline" className="text-xs font-medium bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800">
                            Multi-Part ({request.items?.length || multiPartsList.length} items)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs font-medium bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700">
                            Single Item
                          </Badge>
                        )
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-6">
                  {/* Top Details Grid */}
                  <TopDetailsGrid v={v} />

                  {/* Tracking number card: filled = green, empty = grey with the add button */}
                  {(purchase_order || available_actions.includes("UPDATE_TRACKING")) && (() => {
                    const trackingNo = String(purchase_order?.tracking_number ?? "").trim();
                    const hasTrackingNo = Boolean(trackingNo) && trackingNo.toUpperCase() !== "SHIPPED";
                    return (
                      <div className={`flex items-center gap-3 rounded-lg border p-3.5 ${hasTrackingNo ? "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/20" : "border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/40"}`}>
                        <div className={`h-9 w-9 shrink-0 rounded-md flex items-center justify-center ${hasTrackingNo ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-slate-200/70 dark:bg-zinc-800"}`}>
                          <Truck className={`h-5 w-5 ${hasTrackingNo ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-zinc-500"}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Tracking #</div>
                          {hasTrackingNo ? (
                            <div className="text-sm font-mono font-semibold text-slate-900 dark:text-zinc-100 break-all select-all">{trackingNo}</div>
                          ) : (
                            <div className="text-sm text-slate-400 dark:text-zinc-500">Not provided yet</div>
                          )}
                          {hasTrackingNo && purchase_order?.shipping_note && (
                            <div className="mt-1 text-xs text-slate-600 dark:text-zinc-400 whitespace-pre-wrap">{purchase_order.shipping_note}</div>
                          )}
                        </div>
                        {!hasTrackingNo && available_actions.includes("UPDATE_TRACKING") && (
                          <Button size="sm" variant="outline" disabled={transition.isPending} onClick={() => onAction("UPDATE_TRACKING")} className="h-8 text-xs font-medium shrink-0 ml-auto">
                            Add Tracking Number
                          </Button>
                        )}
                      </div>
                    );
                  })()}

                  {/* Financial & Accounting Section */}
                  <FinancialAccountingSection v={v} />

                  {/* Dedicated Recurring Contract & Schedule Horizon Card */}
                  <DedicatedRecurringContractSchedule v={v} />

                  {/* Description */}
                  {request.description && (
                    <div className="pt-4 border-t border-slate-100 dark:border-zinc-800">
                      <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                        Description
                      </div>
                      <div className="text-sm text-slate-800 dark:text-zinc-200 bg-slate-50 dark:bg-zinc-900/50 p-3.5 rounded-lg border border-slate-100 dark:border-zinc-800 whitespace-pre-wrap leading-relaxed">
                        {request.description}
                      </div>
                    </div>
                  )}

                  {/* Product / Vendor URL & AI Extraction for Single Item */}
                  <ProductVendorUrlAi v={v} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: Line Items & Quotes Breakdown */}
            <Tab2LineItems v={v} />

            {/* TAB 3: Purchase Order */}
            {hasPoTab && purchase_order && (
              <TabsContent value="po" className="m-0 focus-visible:outline-none space-y-6">
                <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm">
                  <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/30">
                    <CardTitle className="text-base font-semibold flex items-center justify-between text-slate-900 dark:text-zinc-100">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Purchase Order · {purchase_order.id}</span>
                      </div>
                      {purchase_order.quote_number && (
                        <Badge variant="outline" className="text-xs font-mono">
                          PO / Quote Ref: {purchase_order.quote_number}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-sm">
                      <Field label="Vendor" value={purchase_order.vendor} />
                      <Field label="Item" value={purchase_order.item} />
                      <Field label="Shipped To" value={purchase_order.shipped_to_location ?? "—"} />
                      <Field label="Approval Status" value={purchase_order.approval_status} />
                      <Field label="Tracking #" value={purchase_order.tracking_number && purchase_order.tracking_number !== "SHIPPED" ? purchase_order.tracking_number : "—"} />
                      <Field label="Shipping Note" value={purchase_order.shipping_note || "—"} />
                      <Field label="Goods Received" value={purchase_order.goods_received ? `Yes, on ${formatDate(purchase_order.goods_received_at)}` : "No"} />
                      <Field label="Goods Notes" value={purchase_order.goods_received_note || "—"} />
                      <Field label="Expected Delivery" value={formatDate(purchase_order.expected_delivery_date) || "—"} />
                    </div>
                    {purchase_order.description && (
                      <div className="pt-3 border-t border-slate-100 dark:border-zinc-800">
                        <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Description</div>
                        <div className="text-sm text-slate-800 dark:text-zinc-200 whitespace-pre-wrap">{purchase_order.description}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* TAB 4: Invoice & Bill */}
            <Tab4InvoiceBill v={v} />

            {/* TAB 5: Wire Transfer */}
            <Tab5WireTransfer v={v} />

            {/* TAB 6: Recurring Horizon */}
            <Tab6RecurringHorizon v={v} />

            {/* TAB: Message Thread & Inquiries */}
            <TabsContent value="messages" className="m-0 focus-visible:outline-none space-y-6">
              <RequestMessageThread data={data} refetch={refetch} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Activity: approvals + notifications */}
        <div className={v.hasPaymentsTab ? "lg:col-span-5 space-y-6" : "lg:col-span-4 xl:col-span-3 space-y-6"}>
          <EditCombinedRequestDialog open={isEditOpen} onOpenChange={setIsEditOpen} data={data} refetch={refetch} />

          <ConvertToRecurringDialog
            open={isConvertToRecurringOpen}
            onOpenChange={setIsConvertToRecurringOpen}
            request={request}
            onSuccess={refetch}
          />

          <Dialog open={isActivityLogsOpen} onOpenChange={setIsActivityLogsOpen}>
            <DialogContent aria-describedby={undefined} className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Activity Logs</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                {data.history && data.history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activity logs found.</p>
                ) : (
                  <div className="relative border-l border-muted pl-5 ml-2 space-y-6 pb-2">
                    {data.history?.map((h) => (
                      <div key={h.id} className="relative">
                        <div className="absolute -left-[27px] top-1.5 h-3.5 w-3.5 rounded-full bg-primary ring-4 ring-background" />
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm font-medium">{h.changed_by_name || "System"} <Badge variant="secondary" className="ml-1 text-xs font-normal">{formatActivityAction(h.action)}</Badge></span>
                          <span className="text-xs text-muted-foreground">{formatDate(h.created_at)}</span>
                          {(h.old_value || h.new_value) && (
                            <div className="text-xs bg-muted/50 p-2 rounded mt-1 border">
                              {h.old_value && <span className="line-through text-muted-foreground mr-2">{formatActivityValue(h.old_value)}</span>}
                              {h.new_value && <span className="font-medium text-slate-800 dark:text-zinc-200">{formatActivityValue(h.new_value)}</span>}
                            </div>
                          )}
                          {h.comment && <p className="text-sm mt-1">{h.comment}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Unified Tabbed Activity & Media Card */}
          <Card className="border border-slate-200 dark:border-zinc-800 shadow-xs">
            <Tabs defaultValue="approvals" className="w-full">
              <CardHeader className="pb-0 pt-3 px-4 border-b border-border/40">
                <TabsList className="h-8 p-0.5 bg-muted/60 w-full grid grid-cols-3">
                  <TabsTrigger value="approvals" className="text-xs px-2.5 h-7 gap-1.5 data-[state=active]:shadow-xs">
                    <Stamp className="h-3.5 w-3.5" />
                    <span>Approvals</span>
                    {approvals.length > 0 && (
                      <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                        {approvals.length}
                      </span>
                    )}
                  </TabsTrigger>

                  <TabsTrigger value="messages" className="text-xs px-2.5 h-7 gap-1.5 data-[state=active]:shadow-xs">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Messages</span>
                    {data.messages && data.messages.length > 0 && (
                      <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300">
                        {data.messages.length}
                      </span>
                    )}
                  </TabsTrigger>

                  <TabsTrigger value="attachments" className="text-xs px-2.5 h-7 gap-1.5 data-[state=active]:shadow-xs">
                    <Paperclip className="h-3.5 w-3.5" />
                    <span>Attachments</span>
                    {data.attachments && data.attachments.length > 0 && (
                      <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200">
                        {data.attachments.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent className="p-4">
                {/* Approvals Tab */}
                <ApprovalsTab v={v} />

                {/* Messages Sidebar Tab */}
                <TabsContent value="messages" className="m-0 space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b">
                    <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Thread Messages ({data.messages?.length || 0})
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveDetailTab("messages")}
                      className="text-xs h-6 px-1.5 text-sky-600 hover:text-sky-700"
                    >
                      Open Thread &rarr;
                    </Button>
                  </div>
                  {(!data.messages || data.messages.length === 0) ? (
                    <div className="text-center py-6 px-2 text-xs text-muted-foreground">
                      <MessageSquare className="h-5 w-5 mx-auto mb-1.5 opacity-50" />
                      No messages yet.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                      {data.messages.slice(-3).map((m) => (
                        <div key={m.id} className="p-2.5 rounded-lg border bg-muted/40 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-900 dark:text-zinc-100">{m.sender_name}</span>
                            <span className="text-[10px] text-muted-foreground">{formatDate(m.created_at)}</span>
                          </div>
                          <p className="line-clamp-2 text-slate-600 dark:text-zinc-400">{m.message_text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button
                    size="sm"
                    onClick={() => setActiveDetailTab("messages")}
                    className="w-full text-xs h-7 bg-sky-600 hover:bg-sky-700 text-white"
                  >
                    View / Send Messages
                  </Button>
                </TabsContent>

                {/* Attachments Tab */}
                <AttachmentsTab v={v} />
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>

      {/* Action Dialog */}
      <RequestDetailActionDialog v={v} />

      {data?.request && (
        <ChangeLevel1ApproverModal
          open={isChangeApproverOpen}
          onOpenChange={setIsChangeApproverOpen}
          request={data.request}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["purchaseRequest", id] });
          }}
        />
      )}

      {id && data?.request && (
        <>
          <WireTransferDialog
            open={isWireDialogOpen}
            onOpenChange={setIsWireDialogOpen}
            request={data.request}
            purchaseOrder={data.purchase_order}
            onConfirm={handleConfirmWire}
            isSubmitting={transition.isPending}
          />
          <WireTransferDialog
            open={isEditWireOpen}
            onOpenChange={setIsEditWireOpen}
            request={data.request}
            purchaseOrder={data.purchase_order}
            initialData={data.wire_transfer}
            isEditMode={true}
            onConfirm={handleUpdateWire}
            isSubmitting={updateWireTransfer.isPending}
          />
        </>
      )}

      <RedirectApprovalDialog v={v} />

      <FilePreviewModal
        open={isPreviewOpen}
        onOpenChange={handleClosePreview}
        target={previewTarget}
      />
    </div>
  );
}
