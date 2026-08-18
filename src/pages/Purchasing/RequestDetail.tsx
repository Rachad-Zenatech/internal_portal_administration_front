import { ManualPriceDialog } from "./ManualPriceDialog";
import { CurrencyAutocomplete } from "./CurrencyAutocomplete";
import { useState, useEffect, useMemo, useRef } from "react";
import HelpIcon from "@/components/ui/HelpIcon";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Bell,
  Clock,
  ExternalLink,
  FileText,
  Package,
  Paperclip,
  ReceiptText,
  Stamp,
  RefreshCw,
  Upload,
  X,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  usePurchaseRequest,
  useTransitionRequest,
  usePossibleApprovers,
  useExtractProductInfo,
  useUploadAttachments,
  } from "@/hooks/usePurchasing";
import * as purchasingService from "@/services/purchasingService";
import { EditRequestDialog } from "./EditRequestDialog";
import Stepper from "@/components/Stepper";
import { RequestStatus, PAYMENT_METHOD_LABEL } from "@/types/purchasing";
import type {
  PurchaseOrderInput,
  InvoiceInput,
  ApprovalInput,
  TrackingInput,
  HoldInput,
  TransitionInput,
  WorkflowAction,
  PaymentMethod,
} from "@/types/purchasing";

// Product extraction only ever runs automatically right after creation, while
// the request is still NEW. If it hasn't produced product_info by this point,
// treat it as failed rather than polling/blocking forever — the backend has
// no explicit success/failure signal, only the presence of product_info.
const EXTRACTION_TIMEOUT_MS = 60000;
import {
  ACTION_META,
  ADMIN_FLOW,
  SPEND_FLOW,
  RECURRING_FLOW,
  QUOTE_FLOW,
  PAYMENT_BADGE,
  PAYMENT_LABEL,
  PRIORITY_BADGE,
  STATUS_BADGE,
  getStatusBadge,
  getStatusLabel,
  formatDate,
  formatMoney,
  SHIPPED_TO_LOCATIONS,
  TAX_RATE,
} from "./purchasingMeta";

type FormKind = "po" | "invoice" | "approval" | "tracking" | "confirmGoods" | "hold";

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = usePurchaseRequest(id);
  const extractProductMutation = useExtractProductInfo(id ?? "");

  // Extraction only ever runs automatically right after creation (NEW status).
  // Reset the "gave up" flag whenever we land on a different request.
  const [extractionTimedOut, setExtractionTimedOut] = useState(false);
  useEffect(() => {
    setExtractionTimedOut(false);
  }, [id]);

  const [isManualPriceOpen, setIsManualPriceOpen] = useState(false);
  const [hasShownManualPrice, setHasShownManualPrice] = useState(false);

  const isExtracting =
    extractProductMutation.isPending ||
    ((data?.request?.status === RequestStatus.New || data?.request?.status === RequestStatus.Initial) &&
      !!data?.request?.item_url &&
      !data?.request?.product_info &&
      !extractionTimedOut);

  const needsManualPrice = data?.request?.product_info?.price === "N/A" || extractionTimedOut;
  useEffect(() => {
    if (needsManualPrice && !hasShownManualPrice) {
      setIsManualPriceOpen(true);
      setHasShownManualPrice(true);
    }
  }, [needsManualPrice, hasShownManualPrice]);

  // Poll for the extraction result while it may still be in flight; give up
  // (and stop blocking the workflow) after EXTRACTION_TIMEOUT_MS.
  useEffect(() => {
    if (!isExtracting || extractProductMutation.isPending) return;
    const pollInterval = setInterval(() => refetch(), 3000);
    const giveUp = setTimeout(() => setExtractionTimedOut(true), EXTRACTION_TIMEOUT_MS);
    return () => {
      clearInterval(pollInterval);
      clearTimeout(giveUp);
    };
  }, [isExtracting, extractProductMutation.isPending, refetch]);

  const transition = useTransitionRequest(id ?? "");
  const uploadAttachments = useUploadAttachments(id ?? "");


  const { data: approvers = [], isLoading: isLoadingApprovers } = usePossibleApprovers(id);

  const [activeForm, setActiveForm] = useState<{ action: WorkflowAction; kind: FormKind } | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [po, setPo] = useState<PurchaseOrderInput>({
    vendor: "",
    item: "",
    amount: 0,
    quote_number: "",
    description: "",
    currency: "",
    payment_method: undefined,
    shipped_to_location: "",
    expected_delivery_date: "",
  });
  const [invoice, setInvoice] = useState<InvoiceInput>({ vendor: "", amount: 0, invoice_date: "", due_date: "", gl_code: "", asset_flag: false });
  const [approval, setApproval] = useState<ApprovalInput>({ approver: "", comment: "" });
  const [tracking, setTracking] = useState<TrackingInput>({ tracking_number: "" });
  const [hold, setHold] = useState<HoldInput>({ reason: "" });
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    if (approvers && approvers.length > 0 && !approval.approver) {
      setApproval(prev => ({ ...prev, approver: approvers[0].user_id }));
    }
  }, [approvers, approval.approver]);

  useEffect(() => {
    if (data?.request) {
      document.dispatchEvent(
        new CustomEvent("set-breadcrumb-title", {
          detail: {
            path: `/purchasing/requests/${data.request.id}`,
            title: `${data.request.title} (${data.request.id})`,
          },
        })
      );
    }
  }, [data?.request]);

  if (isLoading) {
    return <div className="p-8 text-sm text-muted-foreground">Loading request...</div>;
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Button variant="outline" onClick={() => navigate("/purchasing/requests")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <p className="mt-4 text-sm text-red-600">Request not found.</p>
      </div>
    );
  }

  const { request, purchase_order, invoice: inv, approvals, notifications, available_actions } = data;
  let flow = SPEND_FLOW;
  if (request.request_type === "ADMIN") flow = ADMIN_FLOW;
  else if (request.request_type === "RECURRING") flow = RECURRING_FLOW;
  else if (request.request_type === "QUOTE") flow = QUOTE_FLOW;

  const dispatch = async (payload: TransitionInput): Promise<boolean> => {
    try {
      await transition.mutateAsync(payload);
      toast.success(`${ACTION_META[payload.action].label} done`);
      setActiveForm(null);
      if (payload.action === "DELETE_REQUEST") {
        navigate("/purchasing/requests");
      }
      return true;
    } catch (err) {
      toast.error((err as Error).message || "Action failed");
      return false;
    }
  };

  const onAction = (action: WorkflowAction) => {
    const meta = ACTION_META[action];
    if (!meta.form) {
      void dispatch({ action });
      return;
    }
    // Prefill sensible defaults from existing data.
    if (meta.form === "invoice") {
      setInvoice({
        vendor: purchase_order?.vendor ?? "",
        amount: purchase_order?.amount ?? 0,
        // Bill Date defaults to the date the request was marked Ordered/Purchased, if known.
        invoice_date: data.ordered_date ?? "",
        due_date: "",
        gl_code: "",
        asset_flag: false,
      });
      setPendingFiles([]);
    }
    if (meta.form === "po") {
      // Map whatever the automatic extraction found onto the PO form. Fields
      // it couldn't determine come back as "N/A" — treat those (and blanks)
      // as unknown and leave the field empty for the user to fill in.
      const info = request.product_info;
      const isUsable = (v: string | undefined | null) => !!v && !!v.trim() && v.trim().toUpperCase() !== "N/A";
      setPo({
        vendor: info && isUsable(info.vendor) ? info.vendor : "",
        item: info && isUsable(info.name) ? info.name : "",
        quantity: request.quantity ?? 1,
        unit_price: request.unit_price ?? 0,
        amount: request.amount ?? 0,
        quote_number: "",
        description: info && isUsable(info.description) ? info.description : "",
        currency: request.currency ?? (info && isUsable(info.currency) ? info.currency.toUpperCase() : "USD"),
        payment_method: undefined,
        shipped_to_location: "",
        expected_delivery_date: "",
      });
    }
    setActiveForm({ action, kind: meta.form });
  };

  const submitForm = () => {
    if (!activeForm) return;
    const { action, kind } = activeForm;
    if (kind === "po") {
      if (!po.vendor || !po.item) return toast.error("Vendor and item are required.");
      if (!po.payment_method) return toast.error("Payment format is required.");
      if (!po.shipped_to_location || !po.shipped_to_location.trim()) return toast.error("Shipped to location is required.");
      void dispatch({ action, purchase_order: { ...po, amount: Number(po.amount) || 0, quantity: Number(po.quantity) || 1, unit_price: Number(po.unit_price) || 0 } });
    } else if (kind === "invoice") {
      if (!invoice.vendor || !invoice.invoice_date || !invoice.invoice_type) return toast.error("Vendor, bill date, and invoice type are required.");
      void (async () => {
        const ok = await dispatch({ action, invoice: { ...invoice, amount: Number(invoice.amount) || 0 } });
        if (ok && pendingFiles.length > 0 && id) {
          try {
            await uploadAttachments.mutateAsync(pendingFiles);
            setPendingFiles([]);
          } catch {
            toast.error("Bill recorded, but attachment upload failed.");
          }
        }
      })();
    } else if (kind === "approval") {
      if (!approval.approver) return toast.error("Approver is required.");
      void dispatch({ action, approval });
    } else if (kind === "tracking") {
      if (!tracking.tracking_number) return toast.error("Tracking number is required.");
      void dispatch({ action, tracking });
    } else if (kind === "confirmGoods") {
      void dispatch({ action });
    } else if (kind === "hold") {
      if (!hold.reason || !hold.reason.trim()) return toast.error("Hold reason is required.");
      void dispatch({ action, hold });
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <Button variant="outline" size="icon" className="mt-1 shrink-0 h-8 w-8 rounded-full" onClick={() => navigate("/purchasing/requests")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
                {request.title}
              </h2>
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                #{request.id}
              </span>
              <HelpIcon text="Detailed view of a single purchase request, including purchase order, invoices, and workflow approval logs." />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">Current status:</span>
              <Badge variant="outline" className={getStatusBadge(request.status)}>{getStatusLabel(request.status)}</Badge>
              <Badge variant="outline" className={PRIORITY_BADGE[request.priority]}>{request.priority}</Badge>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {(request.status === RequestStatus.Initial || available_actions.length > 0) && (
              <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
                Edit Request
              </Button>
            )}
            {available_actions.includes("DELETE_REQUEST") && (
              <Button
                variant="destructive"
                size="sm"
                disabled={transition.isPending || isExtracting}
                onClick={() => onAction("DELETE_REQUEST")}
              >
                {ACTION_META["DELETE_REQUEST"].label}
              </Button>
            )}
          </div>
        </div>
        {available_actions.filter(a => a !== "DELETE_REQUEST").length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">Move to:</span>
            {isExtracting && (
              <span className="text-xs text-slate-500 dark:text-zinc-400 self-center italic">
                Waiting for product details...
              </span>
            )}
            {available_actions.filter(a => a !== "DELETE_REQUEST").map((action) => {
                const meta = ACTION_META[action];
                return (
                  <Button
                    key={action}
                    variant={meta.variant === "destructive" ? "destructive" : meta.variant === "outline" ? "outline" : "default"}
                    disabled={transition.isPending || isExtracting}
                    onClick={() => onAction(action)}
                  >
                    {meta.label}
                  </Button>
                );
              })}
          </div>
        )}
      </div>

      {/* Workflow Stepper */}
      <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm">
        <CardContent className="py-5 px-6">
          <Stepper flow={flow} requestStatus={request.status} />
          {request.status === "REJECTED" && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm font-medium text-red-600 dark:text-red-400">
              This request was rejected.
            </div>
          )}
        </CardContent>
      </Card>

      {request.status === RequestStatus.OnHold && request.hold_reason && (
        <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 !text-amber-600 dark:!text-amber-400" />
          <AlertTitle className="flex items-center justify-between font-semibold">
            <span>On Hold</span>
            {request.hold_date && <span className="text-xs font-normal opacity-75">{formatDate(request.hold_date)}</span>}
          </AlertTitle>
          <AlertDescription className="mt-2 whitespace-pre-wrap">
            {request.hold_reason}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200 dark:border-zinc-800">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Request Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <Field label="Requester" value={request.requester} />
              <Field label="Department" value={request.department} />
              <Field label="Type" value={request.request_type} />
              <AssignedUsersField label="Assigned To" value={request.assigned_user ?? "—"} />
              <Field label="Requested" value={formatDate(request.request_date)} />
              <Field label="Last Updated" value={formatDate(request.updated_at)} />
              <Field label="Quantity" value={String(request.quantity ?? 1)} />
              <Field label="Unit Price" value={formatMoney(request.unit_price ?? 0)} />
              <Field label="Total Amount (Pre-Tax)" value={formatMoney(request.amount ?? 0)} />
              <Field label="Total Amount (After-Tax)" value={formatMoney((request.amount ?? 0) * (1 + TAX_RATE))} />
              <Field label="Currency" value={request.currency || "USD"} />
              <div className="col-span-2">
                <div className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Description</div>
                <div className="text-slate-800 dark:text-zinc-200">{request.description || "—"}</div>
              </div>
              {(request.item_url || purchase_order?.item_url) && (
                <div className="col-span-2">
                  <div className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Product / Vendor Link</div>
                  <div className="flex flex-col gap-3">
                    <a
                      href={(request.item_url || purchase_order?.item_url || "").startsWith("http") ? (request.item_url || purchase_order?.item_url || "#") : `https://${request.item_url || purchase_order?.item_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={request.item_url || purchase_order?.item_url || undefined}
                      className="inline-flex max-w-full items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      <span className="min-w-0 truncate">Open Product Page ({request.item_url || purchase_order?.item_url})</span>
                    </a>

                    {request.product_info ? (
                      <Card className="border-indigo-100 bg-indigo-50/50 dark:border-indigo-900/50 dark:bg-indigo-950/20 shadow-sm mt-2">
                        <CardHeader className="py-3 px-4 border-b border-indigo-100 dark:border-indigo-900/50">
                          <CardTitle className="text-sm font-semibold flex items-center justify-between text-indigo-900 dark:text-indigo-100">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4" /> AI Product Analysis
                            </div>
                            {(request.product_info.price === "N/A" || request.product_info.name === "N/A") && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs px-2"
                                onClick={() => extractProductMutation.mutate()}
                                disabled={extractProductMutation.isPending}
                              >
                                <RefreshCw className={cn("h-3 w-3 mr-1", extractProductMutation.isPending && "animate-spin")} />
                                Re-run Analysis
                              </Button>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 grid grid-cols-2 gap-4 text-sm">
                          <div className="col-span-2">
                            <div className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mb-1">Product Name</div>
                            <div className="font-medium text-slate-900 dark:text-slate-100">{request.product_info.name}</div>
                          </div>
                          <div>
                            <div className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mb-1">Price</div>
                            <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                              {request.product_info.price}
                              {request.product_info.currency && request.product_info.currency.toUpperCase() !== "N/A" ? ` ${request.product_info.currency}` : ""}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mb-1">Brand</div>
                            <div className="text-slate-700 dark:text-slate-300">{request.product_info.brand}</div>
                          </div>
                          <div>
                            <div className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mb-1">Vendor</div>
                            <div className="text-slate-700 dark:text-slate-300">{request.product_info.vendor}</div>
                          </div>
                          <div>
                            <div className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mb-1">Category</div>
                            <Badge variant="outline" className="bg-white dark:bg-zinc-900 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">{request.product_info.category}</Badge>
                          </div>
                          <div className="col-span-2">
                            <div className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mb-1">Description</div>
                            <div className="text-slate-600 dark:text-slate-400 leading-relaxed text-xs">{request.product_info.description}</div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : isExtracting ? (
                      <div className="flex items-center gap-3 p-3 mt-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                          <RefreshCw className="h-4 w-4 text-indigo-600 dark:text-indigo-400 animate-spin" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">Automatically Extracting...</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Please wait while the AI extracts the product details from the URL. This may take up to 15 seconds.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 mt-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                            <Package className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">Product details unavailable</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Automatic extraction couldn't retrieve details from this link. You can retry or continue without it.</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1.5 text-xs shrink-0 self-start sm:self-auto bg-white dark:bg-slate-800"
                          disabled={extractProductMutation.isPending}
                          onClick={() => {
                            setExtractionTimedOut(false);
                            extractProductMutation.mutate(undefined, {
                              onSuccess: () => {
                                refetch();
                                toast.success("Product details extracted successfully");
                              },
                              onError: (err: any) => {
                                refetch();
                                toast.error(err?.message || "Failed to extract product details");
                              },
                            });
                          }}
                        >
                          <RefreshCw className={cn("h-3.5 w-3.5", extractProductMutation.isPending && "animate-spin")} />
                          Retry Extraction
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {purchase_order && (
            <Card className="border border-slate-200 dark:border-zinc-800">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4" /> Purchase Order · {purchase_order.id}</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <Field label="Vendor" value={purchase_order.vendor} />
                <Field label="Item" value={purchase_order.item} />
                <Field label="Quote / PO #" value={purchase_order.quote_number ?? "—"} />
                <Field label="Quantity" value={String(request.quantity ?? 1)} />
                <Field label="Unit Price" value={formatMoney(request.unit_price ?? 0)} />
                <Field label="Total Amount (Pre-Tax)" value={`${formatMoney(request.amount)}${purchase_order.currency ? ` ${purchase_order.currency}` : ""}`} />
                <Field label="Total Amount (After-Tax)" value={`${formatMoney(request.amount * (1 + TAX_RATE))}${purchase_order.currency ? ` ${purchase_order.currency}` : ""}`} />
                <Field label="Payment Format" value={purchase_order.payment_method ? PAYMENT_METHOD_LABEL[purchase_order.payment_method] : "—"} />
                <Field label="Shipped To" value={purchase_order.shipped_to_location ?? "—"} />
                <Field label="Approval" value={purchase_order.approval_status} />
                <Field label="Tracking #" value={purchase_order.tracking_number ?? "—"} />
                <Field label="Goods Received" value={purchase_order.goods_received ? `Yes, on ${formatDate(purchase_order.goods_received_at)}` : "No"} />
                {purchase_order.description && (
                  <div className="col-span-2">
                    <div className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Description</div>
                    <div className="text-slate-800 dark:text-zinc-200">{purchase_order.description}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {inv && (
            <Card className="border border-slate-200 dark:border-zinc-800">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><ReceiptText className="h-4 w-4" /> Invoice · {inv.id}</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <Field label="Vendor" value={inv.vendor} />
                <Field label="Amount" value={formatMoney(inv.amount)} />
                <Field label="Invoice Type" value={inv.invoice_type ?? "—"} />
                <Field label="Description" value={inv.description ?? "—"} />
                <Field label="Bill Date" value={formatDate(inv.invoice_date)} />
                <Field label="Expected Delivery Date" value={formatDate(inv.due_date)} />
                <div>
                  <div className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Payment Status</div>
                  {/* payment_status only tracks the pre-payment lifecycle; a settled
                      invoice is identified by paid_date. */}
                  {inv.paid_date ? (
                    <Badge variant="outline" className={STATUS_BADGE.COMPLETED}>Settled · {formatDate(inv.paid_date)}</Badge>
                  ) : (
                    <Badge variant="outline" className={PAYMENT_BADGE[inv.payment_status]}>{PAYMENT_LABEL[inv.payment_status]}</Badge>
                  )}
                </div>

                <Field label="GL Code" value={inv.gl_code ?? "—"} />
                <Field label="Asset Flag" value={inv.asset_flag ? "Yes" : "No"} />
                {data.attachments.length > 0 && (
                  <div className="col-span-2">
                    <div className="text-xs text-slate-500 dark:text-zinc-400 mb-1.5">Attachments</div>
                    <ul className="space-y-1.5">
                      {data.attachments.map((att) => (
                        <li key={att.id} className="flex items-center justify-between gap-2 text-xs bg-slate-50 dark:bg-zinc-800/50 rounded-md px-2.5 py-1.5">
                          <span className="flex items-center gap-1.5 min-w-0">
                            <Paperclip className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">{att.filename}</span>
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                              onClick={() => purchasingService.downloadAttachment(request.id, att.id, att.filename)}
                            >
                              Download
                            </button>

                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Activity: approvals + notifications */}
        <div className="space-y-6">
          
          
<EditRequestDialog request={request} open={isEditOpen} onOpenChange={setIsEditOpen} />
          

          <Card className="border border-slate-200 dark:border-zinc-800">
            <CardHeader><CardTitle className="text-base flex items-center justify-between"><div className="flex items-center gap-2"><Stamp className="h-4 w-4" /> Approvals</div></CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {approvals.length === 0 ? (
                <p className="text-slate-500">No approval activity yet.</p>
              ) : (
                approvals.map((a) => (
                  <div key={a.id} className="border-l-2 pl-3 border-slate-200 dark:border-zinc-700">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{a.approver}</span>
                      <Badge variant="outline" className={a.decision === "APPROVED" ? STATUS_BADGE.APPROVED : STATUS_BADGE.REJECTED}>
                        {a.decision}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500">{formatDate(a.approval_date)}</div>
                    {a.comment && <div className="text-slate-700 dark:text-zinc-300 mt-1">{a.comment}</div>}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-zinc-800">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4" /> Notifications</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {notifications.length === 0 ? (
                <p className="text-slate-500">No notifications sent yet.</p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="border-l-2 pl-3 border-blue-200 dark:border-blue-900">
                    <div className="text-slate-800 dark:text-zinc-200">{n.message}</div>
                    <div className="text-xs text-slate-500">To {n.user_id} · {formatDate(n.created_at)}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-zinc-800">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" /> System Logs</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4 pt-2">
                {data.history && data.history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No system logs found.</p>
                ) : (
                  <div className="relative border-l border-muted pl-5 ml-2 space-y-6 pb-2">
                    {data.history?.map((h) => (
                      <div key={h.id} className="relative">
                        <div className="absolute -left-[27px] top-1.5 h-3.5 w-3.5 rounded-full bg-primary ring-4 ring-background" />
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm font-medium">{h.changed_by_name} <span className="font-normal text-muted-foreground">({h.action})</span></span>
                          <span className="text-xs text-muted-foreground">{formatDate(h.created_at)}</span>
                          {(h.old_value || h.new_value) && (
                            <div className="text-xs bg-muted/50 p-2 rounded mt-1 border">
                              {h.old_value && <span className="line-through text-muted-foreground mr-2">{h.old_value}</span>}
                              {h.new_value && <span>{h.new_value}</span>}
                            </div>
                          )}
                          {h.comment && <p className="text-sm mt-1">{h.comment}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action dialog */}
      <Dialog open={!!activeForm} onOpenChange={(open) => !open && setActiveForm(null)}>
        <DialogContent aria-describedby={undefined} className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{activeForm ? ACTION_META[activeForm.action].label : ""}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {activeForm?.kind === "po" && (
              <>
                <TwoUp>
                  <FieldInput label="Quote / PO #" value={po.quote_number ?? ""} onChange={(v) => setPo({ ...po, quote_number: v })} />
                  <FieldInput label="Vendor" value={po.vendor} onChange={(v) => setPo({ ...po, vendor: v })} />
                </TwoUp>
                <TwoUp>
                  <FieldInput label="Item" value={po.item} onChange={(v) => setPo({ ...po, item: v })} />
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Payment Format <span className="text-red-500">*</span></label>
                    <Select
                      value={po.payment_method ?? undefined}
                      onValueChange={(v) => setPo({ ...po, payment_method: v as PaymentMethod })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select payment format..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(PAYMENT_METHOD_LABEL) as [PaymentMethod, string][]).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TwoUp>
                <div className="grid grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quantity</label>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={String(po.quantity ?? 1)}
                      onChange={(e) => {
                        const q = Number(e.target.value);
                        setPo({ ...po, quantity: q, amount: Math.round(q * (po.unit_price || 0) * 100) / 100 });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Unit Price</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={String(po.unit_price ?? 0)}
                      onChange={(e) => {
                        const p = Number(e.target.value);
                        setPo({ ...po, unit_price: p, amount: Math.round((po.quantity || 1) * p * 100) / 100 });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Total (Pre-Tax)</label>
                    <Input
                      type="number"
                      value={String(po.amount)}
                      disabled
                      className="bg-slate-50 dark:bg-zinc-800 text-slate-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Total (After-Tax)</label>
                    <Input
                      type="number"
                      value={String(Math.round(po.amount * (1 + TAX_RATE) * 100) / 100)}
                      disabled
                      className="bg-slate-50 dark:bg-zinc-800 text-slate-500 font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Currency</label>
                    <CurrencyAutocomplete value={po.currency ?? ""} onChange={(v) => setPo({ ...po, currency: v })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Shipped to Location <span className="text-red-500">*</span></label>
                  <LocationAutocomplete value={po.shipped_to_location ?? ""} onChange={(v) => setPo({ ...po, shipped_to_location: v })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    rows={3}
                    placeholder="Additional details about this purchase..."
                    value={po.description ?? ""}
                    onChange={(e) => setPo({ ...po, description: e.target.value })}
                  />
                </div>
              </>
            )}
            {activeForm?.kind === "invoice" && (
              <>
                <TwoUp>
                  <FieldInput label="Vendor" value={invoice.vendor} onChange={(v) => setInvoice({ ...invoice, vendor: v })} />
                  <FieldInput label="Amount" type="number" value={String(invoice.amount)} onChange={(v) => setInvoice({ ...invoice, amount: Number(v) })} />
                </TwoUp>
                <TwoUp>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Invoice Type <span className="text-red-500">*</span></label>
                    <Select value={invoice.invoice_type || undefined} onValueChange={(v) => setInvoice({ ...invoice, invoice_type: v })}>
                      <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Purchase">Purchase</SelectItem>
                        <SelectItem value="Quote">Quote</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div />
                </TwoUp>
                <TwoUp>
                  <FieldInput label="Bill Date" type="date" value={invoice.invoice_date} onChange={(v) => setInvoice({ ...invoice, invoice_date: v })} />
                  <FieldInput label="Expected Delivery Date" type="date" value={invoice.due_date ?? ""} onChange={(v) => setInvoice({ ...invoice, due_date: v })} />
                </TwoUp>
                <TwoUp>
                  <FieldInput label="GL Code" value={invoice.gl_code ?? ""} onChange={(v) => setInvoice({ ...invoice, gl_code: v })} />
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Asset Flag</label>
                    <div className="flex items-center h-10">
                      <input type="checkbox" className="h-4 w-4" checked={invoice.asset_flag || false} onChange={(e) => setInvoice({ ...invoice, asset_flag: e.target.checked })} />
                      <span className="ml-2 text-sm text-slate-700">Mark as Asset</span>
                    </div>
                  </div>
                </TwoUp>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    rows={2}
                    placeholder="Additional details..."
                    value={invoice.description ?? ""}
                    onChange={(e) => setInvoice({ ...invoice, description: e.target.value })}
                  />
                </div>
                <AttachmentDropzone
                  files={pendingFiles}
                  onFilesSelected={(files) => setPendingFiles((prev) => [...prev, ...files])}
                  onRemove={(index) => setPendingFiles((prev) => prev.filter((_, i) => i !== index))}
                />
              </>
            )}
            {activeForm?.kind === "approval" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Approver</label>
                  <Select
                    value={approval.approver}
                    onValueChange={(v) => setApproval({ ...approval, approver: v })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select approver..." />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingApprovers ? (
                        <SelectItem value="_loading" disabled>Loading approvers...</SelectItem>
                      ) : approvers.length > 0 ? (
                        approvers.map((appr) => (
                          <SelectItem key={appr.user_id} value={appr.user_id}>
                            {appr.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="_none" disabled>No assignees found</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Comment</label>
                  <Textarea value={approval.comment ?? ""} onChange={(e) => setApproval({ ...approval, comment: e.target.value })} rows={2} />
                </div>
              </>
            )}
            {activeForm?.kind === "tracking" && (
              <>
                <FieldInput label="Tracking Number" value={tracking.tracking_number} onChange={(v) => setTracking({ ...tracking, tracking_number: v })} />
                <label className="text-sm font-medium">Note</label>
                <Textarea
                  rows={3}
                  placeholder="Add a note..."
                  value={tracking.note ?? ''}
                  onChange={(e) => setTracking({ ...tracking, note: e.target.value })}
                />
              </>
            )}
            {activeForm?.kind === "confirmGoods" && (
              <p className="text-sm text-muted-foreground">Are you sure you want to confirm goods received?</p>
            )}
            {activeForm?.kind === "hold" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Hold Reason <span className="text-red-500">*</span></label>
                <Textarea
                  rows={3}
                  placeholder="Why is this being put on hold?"
                  value={hold.reason}
                  onChange={(e) => setHold({ reason: e.target.value })}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveForm(null)}>Cancel</Button>
            <Button onClick={submitForm} disabled={transition.isPending}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {id && (
        <ManualPriceDialog
          requestId={id}
          isOpen={isManualPriceOpen}
          onOpenChange={setIsManualPriceOpen}
        />
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500 dark:text-zinc-400 mb-1">{label}</div>
      <div className="text-slate-800 dark:text-zinc-200">{value}</div>
</div>
  );
}

function AssignedUsersField({ label, value }: { label: string; value: string }) {
  if (!value || value === "—") return <Field label={label} value="—" />;

  const users = value.split(", ").map(u => u.trim()).filter(Boolean);
  const displayedUsers = users.slice(0, 2);
  const hiddenUsers = users.slice(2);
  
  const chipClass = "inline-flex items-center px-3 py-1 rounded-full border border-slate-200 bg-white text-xs font-medium text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 shadow-sm whitespace-nowrap";

  return (
    <div className="flex flex-col">
      <div className="text-xs text-slate-500 dark:text-zinc-400 mb-2">{label}</div>
      <div className="flex flex-wrap items-center gap-2">
        {displayedUsers.map((u, i) => (
          <span key={i} className={chipClass}>{u}</span>
        ))}
        
        {hiddenUsers.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`${chipClass} hover:bg-slate-50 dark:hover:bg-zinc-700 cursor-pointer focus:outline-none transition-colors`}>
                +{hiddenUsers.length} more... <ChevronDown className="ml-1 h-3.5 w-3.5 text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80 p-4 shadow-lg rounded-xl">
              <div className="text-sm font-semibold text-slate-500 dark:text-zinc-400 mb-3">
                Additional Users
              </div>
              <div className="flex flex-wrap gap-2">
                {hiddenUsers.map((u, i) => (
                  <span key={i} className={chipClass}>{u}</span>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

function TwoUp({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-4">{children}</div>;
}


const ATTACHMENT_ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.rtf,.odt,.ods";

function AttachmentDropzone({
  files,
  onFilesSelected,
  onRemove,
}: {
  files: File[];
  onFilesSelected: (files: File[]) => void;
  onRemove: (index: number) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Attachments</label>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files?.length) onFilesSelected(Array.from(e.dataTransfer.files));
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed p-4 text-center cursor-pointer transition-colors",
          isDragging
            ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30"
            : "border-slate-300 dark:border-zinc-700 hover:border-slate-400 dark:hover:border-zinc-600"
        )}
      >
        <Upload className="h-5 w-5 text-slate-400" />
        <p className="text-xs text-slate-600 dark:text-zinc-300">
          Drag & drop files here, or click to browse
        </p>
        <p className="text-[11px] text-slate-400 dark:text-zinc-500">
          Supports .xlsx, .xls, .pdf, .doc, .docx and most document types
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ATTACHMENT_ACCEPT}
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) onFilesSelected(Array.from(e.target.files));
            e.target.value = "";
          }}
        />
      </div>
      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center justify-between gap-2 text-xs bg-slate-50 dark:bg-zinc-800/50 rounded-md px-2.5 py-1.5"
            >
              <span className="flex items-center gap-1.5 min-w-0">
                <Paperclip className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{file.name}</span>
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(index);
                }}
                className="text-slate-400 hover:text-red-500 shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
</div>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
</div>
  );
}

// Test



function LocationAutocomplete({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return SHIPPED_TO_LOCATIONS;
    return SHIPPED_TO_LOCATIONS.filter((c) => c.toLowerCase().includes(q));
  }, [query]);

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={query}
        onFocus={() => setIsOpen(true)}
        onChange={(e) => {
          const next = e.target.value;
          setQuery(next);
          onChange(next);
          setIsOpen(true);
        }}
        placeholder="Enter location"
        maxLength={200}
      />
      {isOpen && filtered.length > 0 && (
        <div className="absolute z-50 right-0 left-0 mt-1.5 w-full max-h-72 overflow-y-auto bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-xl py-1 text-sm">
          {filtered.map((loc) => (
            <div
              key={loc}
              className="px-3 py-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/80 flex items-center gap-2"
              onMouseDown={(e) => {
                e.preventDefault();
                setQuery(loc);
                onChange(loc);
                setIsOpen(false);
              }}
            >
              <span className="font-medium">{loc}</span>
            </div>
          ))}
        </div>
      )}
</div>
  );
}
