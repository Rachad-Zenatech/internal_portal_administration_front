import { useGLCodes } from "@/hooks/usePurchasing";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "../../components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Textarea } from "../../components/ui/textarea";
import { useState } from "react";
import { apiClient as api } from "@/services/apiClient";
import { format } from "date-fns";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Trash2, Edit2, Paperclip, ExternalLink, FileText, Package, ReceiptText, AlertTriangle, User, Building2, Tag, Layers } from "lucide-react";
import Stepper from "@/components/Stepper";
import { RequestStatus, PAYMENT_METHOD_LABEL } from "@/types/purchasing";
import { parseRequestStatus } from "@/lib/requestStatus";
import {
  SPEND_FLOW,
  ADMIN_FLOW,
  RECURRING_FLOW,
  QUOTE_FLOW,
  getStatusBadge,
  getStatusLabel,
  PRIORITY_BADGE,
  TAX_RATE,
  formatDate,
  formatActivityAction,
  formatActivityValue,
} from "@/pages/Purchasing/purchasingMeta";

interface TaskDetailPanelProps {
  task: any | null;
  onClose: () => void;
  onUpdate: () => void;
  readOnly?: boolean;
}

function DetailField({ label, value, icon: Icon, badge }: { label: string; value: React.ReactNode; icon?: any; badge?: boolean }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />}
        {label}
      </div>
      <div className="text-sm font-medium text-slate-800 dark:text-zinc-200">
        {badge && typeof value === "string" ? (
          <Badge variant="outline" className="font-mono text-xs bg-slate-50 dark:bg-zinc-800">{value}</Badge>
        ) : (
          value || <span className="text-slate-400 dark:text-zinc-500 font-normal">—</span>
        )}
      </div>
    </div>
  );
}

export default function TaskDetailPanel({ task, onClose, onUpdate, readOnly = false }: TaskDetailPanelProps) {
  const { data: glCodes = [] } = useGLCodes();
  const [note, setNote] = useState("");

  const formatGLCode = (code: string | null | undefined) => {
    if (!code) return null;
    const trimmed = String(code).trim();
    const found = glCodes.find(
      (c) => c.account_number === trimmed || c.display_label === trimmed || c.account_name.toLowerCase() === trimmed.toLowerCase()
    );
    if (found) {
      return found.display_label || `${found.account_number} - ${found.account_name}`;
    }
    return trimmed;
  };
  const [isDragging, setIsDragging] = useState(false);
  const [deleteNoteId, setDeleteNoteId] = useState<number | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editNoteText, setEditNoteText] = useState("");

  if (!task) return null;

  // Parse product info if JSON string
  let parsedProductInfo: any = null;
  if (task.product_info) {
    if (typeof task.product_info === "object") {
      parsedProductInfo = task.product_info;
    } else if (typeof task.product_info === "string") {
      try {
        parsedProductInfo = JSON.parse(task.product_info);
      } catch (e) {
        parsedProductInfo = null;
      }
    }
  }

  // Parse quote data if JSON string
  let parsedQuoteData: any = null;
  if (task.quote_data) {
    if (typeof task.quote_data === "object") {
      parsedQuoteData = task.quote_data;
    } else if (typeof task.quote_data === "string") {
      try {
        parsedQuoteData = JSON.parse(task.quote_data);
      } catch (e) {
        parsedQuoteData = null;
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const formData = new FormData();
      formData.append("file", file);

      try {
        await api.post(`/tasks/${task.id}/notes/upload`, formData);
        toast.success(`Attached file: ${file.name}`);
        onUpdate();
      } catch (err: any) {
        toast.error(err.message || "Failed to upload file");
      }
    }
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;
    try {
      await api.post<any>(`/tasks/${task.id}/notes`, { note_text: note });
      setNote("");
      toast.success("Note added successfully");
      onUpdate();
    } catch (e: any) {
      console.error("Failed to add note", e);
      toast.error(e.message || "Failed to add note");
    }
  };

  const handleEditNote = async (noteId: number) => {
    if (!editNoteText.trim()) return;
    try {
      await api.put(`/tasks/${task.id}/notes/${noteId}`, { note_text: editNoteText });
      toast.success("Note updated");
      setEditingNoteId(null);
      setEditNoteText("");
      onUpdate();
    } catch (e: any) {
      toast.error(e.message || "Failed to update note");
    }
  };

  const handleDeleteNote = (noteId: number) => {
    setDeleteNoteId(noteId);
  };

  const confirmDeleteNote = async () => {
    if (deleteNoteId === null) return;
    try {
      await api.delete(`/tasks/${task.id}/notes/${deleteNoteId}`);
      toast.success("Note deleted");
      onUpdate();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete note");
    } finally {
      setDeleteNoteId(null);
    }
  };

  const handleApprove = async () => {
    try {
      await api.post<any>(`/tasks/${task.id}/approve`, { action: "APPROVE", comment: "" });
      toast.success("Task approved successfully");
      onUpdate();
      onClose();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to approve task");
    }
  };

  const handleReject = async () => {
    const reason = prompt("Enter rejection reason:");
    if (reason === null) return;
    try {
      await api.post<any>(`/tasks/${task.id}/approve`, { action: "REJECT", comment: reason });
      toast.success("Task rejected successfully");
      onUpdate();
      onClose();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to reject task");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this order? This action cannot be undone.")) return;

    try {
      await api.delete(`/tasks/${task.id}`);
      toast.success("Order deleted successfully");
      onUpdate();
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete order");
    }
  };

  const isHighValue = Number(task.amount) > 10000;
  const isInvoiceOrWire = task.payment_method?.toLowerCase() === 'invoice' || task.payment_method?.toLowerCase() === 'wire';
  const needsApproval = isHighValue || isInvoiceOrWire;
  const canApprove = task.current_tier_id != null && needsApproval;

  let flow = SPEND_FLOW;
  const category = (task.category || task.request_type || "").toUpperCase();
  if (category === 'ADMIN') flow = ADMIN_FLOW;
  else if (category === 'RECURRING') flow = RECURRING_FLOW;
  else if (category === 'QUOTE') flow = QUOTE_FLOW;

  const totalAmount = Number(task.amount || 0);
  const unitPrice = Number(task.unit_price || 0);
  const quantity = Number(task.quantity || 1);
  const afterTaxAmount = totalAmount * (1 + TAX_RATE);

  const rawItems = (task.items && task.items.length > 0)
    ? task.items
    : (parsedQuoteData?.items || parsedQuoteData?.line_items || []);
  const isMulti = task.item_mode === "MULTIPLE" || rawItems.length > 0;

  return (
    <Sheet open={!!task} onOpenChange={(open) => !open && onClose()}>
      <SheetContent aria-describedby={undefined} className="!max-w-[80vw] !w-[80vw] flex flex-col p-0 bg-slate-50/50 dark:bg-zinc-950">
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-6">
          {/* Header */}
          <SheetHeader className="pr-8">
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
                    {task.category || task.request_type || 'SPEND'}
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
                  Est. After-Tax: <span className="font-semibold text-slate-700 dark:text-slate-300">${afterTaxAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </SheetHeader>

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
            <div className="lg:col-span-7 space-y-6">
              {/* Request Details Card */}
              <Card className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-zinc-800">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800 dark:text-zinc-200">
                    <FileText className="h-4 w-4 text-primary" /> Request Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  <DetailField label="Requester" value={task.requester_name || task.requester} icon={User} />
                  <DetailField label="Department" value={task.department} icon={Building2} />
                  <DetailField label="Type" value={task.category || task.request_type} icon={Layers} />
                  <DetailField
                    label="Configuration"
                    value={
                      isMulti ? (
                        <Badge variant="outline" className="text-xs bg-indigo-50/50 text-indigo-700 border-indigo-200">
                          Multi Parts ({rawItems.length} parts)
                        </Badge>
                      ) : (
                        "Single Item"
                      )
                    }
                  />
                  <DetailField label="Assigned To" value={task.assignee_name} icon={User} />
                  <DetailField label="GL Code" value={formatGLCode(task.gl_code)} icon={Tag} badge />
                  <DetailField label="Requested Date" value={task.created_at ? formatDate(task.created_at) : null} />
                  <DetailField label="Last Updated" value={task.updated_at ? formatDate(task.updated_at) : null} />
                  {!isMulti && (
                    <>
                      <DetailField label="Quantity" value={quantity} />
                      <DetailField label="Unit Price" value={`$${unitPrice.toFixed(2)}`} />
                    </>
                  )}
                  <DetailField label="Total (Pre-Tax)" value={`$${totalAmount.toFixed(2)}`} />
                  <DetailField label="Total (After-Tax)" value={`$${afterTaxAmount.toFixed(2)}`} />
                  <DetailField label="Currency" value={task.currency || "USD"} />

                  {task.description && (
                    <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
                      <div className="text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1">Description</div>
                      <p className="text-sm text-slate-700 dark:text-zinc-300 whitespace-pre-wrap">{task.description}</p>
                    </div>
                  )}

                  {task.item_url && (
                    <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
                      <div className="text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1.5">Product / Vendor Link</div>
                      <a
                        href={task.item_url.startsWith("http") ? task.item_url : `https://${task.item_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex max-w-full items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        <span className="min-w-0 truncate">Open Product Page ({task.item_url})</span>
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AI Product Analysis Card */}
              {parsedProductInfo && (
                <Card className="border-indigo-100 bg-indigo-50/40 dark:border-indigo-900/50 dark:bg-indigo-950/20 shadow-sm">
                  <CardHeader className="py-3 px-4 border-b border-indigo-100 dark:border-indigo-900/50">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-indigo-900 dark:text-indigo-100">
                      <Package className="h-4 w-4" /> AI Product Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 grid grid-cols-2 gap-4 text-sm">
                    <div className="col-span-2">
                      <div className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mb-1">Product Title</div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{parsedProductInfo.name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mb-1">Extracted Price</div>
                      <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {parsedProductInfo.price} {parsedProductInfo.currency && parsedProductInfo.currency !== "N/A" ? parsedProductInfo.currency : ""}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mb-1">Brand</div>
                      <div className="text-slate-700 dark:text-slate-300">{parsedProductInfo.brand}</div>
                    </div>
                    <div>
                      <div className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mb-1">Vendor</div>
                      <div className="text-slate-700 dark:text-slate-300">{parsedProductInfo.vendor}</div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mb-1">Category</div>
                      <Badge variant="outline" className="bg-white dark:bg-zinc-900 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 max-w-full truncate block" title={parsedProductInfo.category}>
                        {parsedProductInfo.category}
                      </Badge>
                    </div>
                    {parsedProductInfo.description && (
                      <div className="col-span-2">
                        <div className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mb-1">Summary</div>
                        <div className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">{parsedProductInfo.description}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Purchase Order Card */}
              {task.purchase_order && (() => {
                const po = task.purchase_order;
                const rawItems = (task.items && task.items.length > 0)
                  ? task.items
                  : (parsedQuoteData?.items || parsedQuoteData?.line_items || []);
                const isMultiPO = task.item_mode === "MULTIPLE" || rawItems.length > 0;
                const poItemsSum = rawItems.reduce((acc: number, itm: any) => acc + (Number(itm.total) || 0), 0);
                const poShipping = Number(parsedQuoteData?.totals?.shipping || 0) || (Number(po.amount || totalAmount) > poItemsSum && poItemsSum > 0 ? Math.round((Number(po.amount || totalAmount) - poItemsSum) * 100) / 100 : 0);

                return (
                  <Card className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                    <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-zinc-800">
                      <CardTitle className="text-sm font-semibold flex items-center justify-between gap-2 text-slate-800 dark:text-zinc-200">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-emerald-600" /> Purchase Order #{po.id}
                        </div>
                        {isMultiPO && (
                          <Badge variant="outline" className="text-xs bg-indigo-50/50 text-indigo-700 border-indigo-200">
                            Multi Parts ({rawItems.length} parts)
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4 text-sm">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <DetailField label="Vendor" value={po.vendor} />
                        <DetailField label="Item" value={po.item} />
                        <DetailField label="Quote / PO #" value={po.quote_number} />
                        {!isMultiPO && (
                          <>
                            <DetailField label="Quantity" value={po.quantity || quantity} />
                            <DetailField label="Unit Price" value={`$${Number(po.unit_price || unitPrice).toFixed(2)}`} />
                          </>
                        )}
                        <DetailField label="PO Amount" value={`$${Number(po.amount || totalAmount).toFixed(2)}`} />
                        {poShipping > 0 && (
                          <DetailField label="Shipping Fee" value={`$${Number(poShipping).toFixed(2)}`} />
                        )}
                        <DetailField label="Payment Format" value={po.payment_method ? (PAYMENT_METHOD_LABEL[po.payment_method as keyof typeof PAYMENT_METHOD_LABEL] || po.payment_method) : "—"} />
                        <DetailField label="GL Code" value={formatGLCode(po.gl_code || task.gl_code)} badge />
                        <DetailField label="Shipped To" value={po.shipped_to_location} />
                        <DetailField label="Approval" value={po.approval_status} />
                        <DetailField label="Tracking #" value={po.tracking_number} />
                        <DetailField
                          label="Goods Received"
                          value={po.goods_received ? `Yes (${po.goods_received_at ? formatDate(po.goods_received_at) : "Received"})` : "No"}
                        />
                      </div>

                      {/* Embedded Line Items Table for Multiple Parts */}
                      {isMultiPO && rawItems.length > 0 && (
                        <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-2">
                          <div className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                            Line Items &amp; Parts Breakdown ({rawItems.length})
                          </div>
                          <div className="overflow-hidden rounded-md border border-slate-200 dark:border-zinc-700">
                            <Table>
                              <TableHeader className="bg-slate-50 dark:bg-zinc-800/80">
                                <TableRow>
                                  <TableHead className="w-10 text-xs font-semibold text-center">#</TableHead>
                                  <TableHead className="w-28 text-xs font-semibold">SKU</TableHead>
                                  <TableHead className="text-xs font-semibold">Description</TableHead>
                                  <TableHead className="w-16 text-xs font-semibold text-right">Qty</TableHead>
                                  <TableHead className="w-24 text-xs font-semibold text-right">Unit Price</TableHead>
                                  <TableHead className="w-24 text-xs font-semibold text-right">Total</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody className="divide-y divide-slate-100 dark:divide-zinc-800 text-xs">
                                {rawItems.map((itm: any, idx: number) => (
                                  <TableRow key={idx}>
                                    <TableCell className="text-center text-slate-400 font-mono text-[11px]">{idx + 1}</TableCell>
                                    <TableCell className="text-xs text-slate-500 font-mono">{itm.sku || "—"}</TableCell>
                                    <TableCell className="font-medium text-slate-900 dark:text-zinc-100 text-xs">{itm.description}</TableCell>
                                    <TableCell className="text-right text-xs">{itm.quantity ?? 1}</TableCell>
                                    <TableCell className="text-right font-mono text-xs">${Number(itm.unit_price || 0).toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-semibold font-mono text-xs text-slate-900 dark:text-zinc-100">
                                      ${Number(itm.total ?? ((itm.quantity || 1) * (itm.unit_price || 0))).toFixed(2)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Invoice Card */}
              {task.invoice && (
                <Card className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                  <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-zinc-800">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800 dark:text-zinc-200">
                      <ReceiptText className="h-4 w-4 text-indigo-600" /> Invoice #{task.invoice.id}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                    <DetailField label="Vendor" value={task.invoice.vendor} />
                    <DetailField label="Amount" value={`$${Number(task.invoice.amount || 0).toFixed(2)}`} />
                    <DetailField
                      label="Payment Status"
                      value={
                        task.invoice.paid_date || task.status === "COMPLETED" || task.invoice.payment_status === "PAID"
                          ? "PAID"
                          : task.invoice.payment_status === "WAITING_PAYMENT"
                          ? "WAITING_PAYMENT"
                          : task.invoice.payment_status || "UNPAID"
                      }
                      badge
                    />
                    <DetailField label="Bill Date" value={formatDate(task.invoice.invoice_date || task.invoice.paid_date)} />
                    <DetailField label="Date Arrived" value={formatDate(task.invoice.due_date || task.purchase_order?.goods_received_at)} />
                    <DetailField label="Paid Date" value={formatDate(task.invoice.paid_date)} />
                    <DetailField label="GL Code" value={formatGLCode(task.invoice.gl_code || task.gl_code)} badge />
                    <DetailField label="Asset Flag" value={task.invoice.asset_flag ? "Yes" : "No"} />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Notes & Activity Tabs Column */}
            <div className="lg:col-span-5 space-y-4">
              <Tabs defaultValue="notes" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-zinc-800 p-1">
                  <TabsTrigger value="notes" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 font-medium">
                    Notes ({task.notes?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="history" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 font-medium">
                    Activity ({task.history?.length || 0})
                  </TabsTrigger>
                </TabsList>

                {/* Notes Tab Content */}
                <TabsContent value="notes" className="relative outline-none mt-3">
                  <Card className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                    <CardContent className="p-4 space-y-4">
                      <div
                        className={`relative rounded-lg p-2 -mx-2 transition-colors ${isDragging ? 'bg-primary/5 ring-2 ring-primary/20 border-dashed' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        {isDragging && (
                          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm border-2 border-dashed border-primary rounded-lg text-primary pointer-events-none">
                            <p className="font-semibold text-sm">Drop file to attach</p>
                          </div>
                        )}

                        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                          {task.notes?.map((n: any) => (
                            <div key={n.id} className="bg-slate-50 dark:bg-zinc-800/60 p-3 rounded-lg border border-slate-200/60 dark:border-zinc-700/60 text-sm group relative">
                              <div className="flex justify-between items-start mb-1.5">
                                {n.user_name && (
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                                      {n.user_name.split(" ").map((x: string) => x[0]).join("").substring(0, 2).toUpperCase()}
                                    </div>
                                    <span className="font-medium text-xs text-slate-800 dark:text-zinc-200">{n.user_name}</span>
                                  </div>
                                )}
                                {!readOnly && (
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => { setEditingNoteId(n.id); setEditNoteText(n.note_text); }}>
                                      <Edit2 className="w-3 h-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteNote(n.id)}>
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>

                              {editingNoteId === n.id ? (
                                <div className="flex flex-col gap-2 mt-2">
                                  <Textarea value={editNoteText} onChange={e => setEditNoteText(e.target.value)} className="min-h-[60px]" />
                                  <div className="flex gap-2 justify-end">
                                    <Button variant="outline" size="sm" onClick={() => setEditingNoteId(null)}>Cancel</Button>
                                    <Button size="sm" onClick={() => handleEditNote(n.id)}>Save</Button>
                                  </div>
                                </div>
                              ) : (
                                (() => {
                                  const isEdited = (n.updated_at && n.updated_at !== n.created_at) || n.is_edited || n.note_text.endsWith('\n[Edited]');
                                  const displayText = n.note_text.endsWith('\n[Edited]') ? n.note_text.slice(0, -9) : n.note_text;

                                  const renderText = (text: string) => {
                                    const parts = text.split(/(\[Attached: .*?\])/g);
                                    return parts.map((part, i) => {
                                      const match = part.match(/^\[Attached: (.*?)\]$/);
                                      if (match) {
                                        return (
                                          <a
                                            key={i}
                                            href="#"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              api.downloadFile(`/tasks/notes/download/${encodeURIComponent(match[1])}`, match[1])
                                                .catch((err) => toast.error(err.message || "Failed to download file"));
                                            }}
                                            className="text-primary hover:underline font-medium inline-flex items-center bg-primary/10 px-2 py-1 rounded-md mt-1 mb-1"
                                          >
                                            <Paperclip className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                                            <span className="underline decoration-primary/50 underline-offset-4">{match[1]}</span>
                                          </a>
                                        );
                                      }
                                      return <span key={i}>{part}</span>;
                                    });
                                  };

                                  return (
                                    <>
                                      <p className="whitespace-pre-wrap text-slate-700 dark:text-zinc-300">{renderText(displayText)}</p>
                                      <div className="text-[11px] text-muted-foreground mt-2 flex items-center gap-2">
                                        {n.created_at ? format(new Date(n.created_at), 'MMM d, yyyy h:mm a') : ''}
                                        {isEdited && (
                                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-medium text-muted-foreground">Edited</Badge>
                                        )}
                                      </div>
                                    </>
                                  );
                                })()
                              )}
                            </div>
                          ))}
                          {(!task.notes || task.notes.length === 0) && (
                            <p className="text-sm text-muted-foreground italic py-6 text-center">No notes yet.</p>
                          )}
                        </div>

                        {!readOnly && (
                          <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800 mt-2">
                            <Textarea
                              placeholder="Add a note... (or drag & drop files here)"
                              value={note}
                              onChange={(e) => setNote(e.target.value)}
                              className="min-h-[70px] text-sm"
                            />
                            <Button onClick={handleAddNote} className="self-end shrink-0">Post</Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Activity History Tab Content */}
                <TabsContent value="history" className="outline-none mt-3">
                  <Card className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                    <CardContent className="p-4">
                      <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1 relative before:absolute before:inset-0 before:ml-[0.625rem] before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-200 dark:before:bg-zinc-800">
                        {task.history?.map((h: any) => (
                          <div key={h.id} className="relative flex items-start gap-3.5">
                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary z-10 shrink-0 mt-1 shadow-sm ring-4 ring-white dark:ring-zinc-900" />
                            <div className="flex-1 p-3 rounded-lg bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-700/60 shadow-xs text-xs space-y-1">
                              {h.changed_by_name && (
                                <div className="flex items-center gap-1.5 mb-1 text-slate-500 dark:text-zinc-400 font-medium">
                                  <span>{h.changed_by_name}</span>
                                </div>
                              )}
                              <p className="font-semibold text-slate-900 dark:text-zinc-100 text-xs">{formatActivityAction(h.action)}</p>
                              {h.old_value && h.new_value && (
                                <p className="text-muted-foreground text-[11px] font-medium flex items-center gap-1.5"><Badge variant="outline" className="text-[10px] px-1.5 py-0">{formatActivityValue(h.old_value)}</Badge> <span>&rarr;</span> <Badge variant="outline" className="text-[10px] px-1.5 py-0">{formatActivityValue(h.new_value)}</Badge></p>
                              )}
                              {!h.old_value && h.new_value && (
                                <p className="text-muted-foreground text-[11px] font-medium"><Badge variant="outline" className="text-[10px] px-1.5 py-0">{formatActivityValue(h.new_value)}</Badge></p>
                              )}
                              {h.comment && (
                                <p className="mt-1 bg-white dark:bg-zinc-900 p-1.5 rounded border border-slate-200/60 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 italic">{h.comment}</p>
                              )}
                              <time className="block text-[10px] text-slate-400 dark:text-zinc-500 pt-1">
                                {h.created_at ? format(new Date(h.created_at), 'MMM d, yyyy h:mm a') : ''}
                              </time>
                            </div>
                          </div>
                        ))}
                        {(!task.history || task.history.length === 0) && (
                          <p className="text-sm text-muted-foreground italic py-6 text-center">No activity history recorded.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
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
