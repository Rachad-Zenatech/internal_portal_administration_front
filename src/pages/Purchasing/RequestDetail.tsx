import { useGLCodes } from "@/hooks/usePurchasing";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GLCodeAutocomplete } from "./GLCodeAutocomplete";
import { ManualPriceDialog } from "./ManualPriceDialog";
import { CurrencyAutocomplete } from "./CurrencyAutocomplete";
import { useState, useEffect, useMemo, useRef } from "react";
import HelpIcon from "@/components/ui/HelpIcon";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
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
  Building2,
  CheckCircle2,
  Truck,
  Plus,
  Pencil,
  Trash2,
  Download,
  Landmark,
  Calendar,
  ShieldAlert,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  useExtractProductInfo,
  useUploadAttachments,
  useUpdateReviewStatus,
  useUpdateWireTransfer,
} from "@/hooks/usePurchasing";
import * as purchasingService from "@/services/purchasingService";
import { EditRequestDialog } from "./EditRequestDialog";
import { WireTransferDialog } from "./WireTransferDialog";
import { useAuth } from "@/lib/AuthContext";
import Stepper from "@/components/Stepper";
import { RequestStatus, PAYMENT_METHOD_LABEL } from "@/types/purchasing";
import type {
  PurchaseOrderInput,
  WireTransferInput,
  InvoiceInput,
  InvoiceItemInput,
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
  ACCOUNTS_PAYABLE_FLOW,
  QUOTE_FLOW,
  PAYMENT_BADGE,
  PAYMENT_LABEL,
  PRIORITY_BADGE,
  STATUS_BADGE,
  getStatusBadge,
  getStatusLabel,
  formatDate,
  formatDateTime,
  formatMoney,
  formatRequestType,
  formatActivityAction,
  formatActivityValue,
  SHIPPED_TO_LOCATIONS,
  TAX_RATE,
} from "./purchasingMeta";

type FormKind = "po" | "invoice" | "approval" | "tracking" | "confirmGoods" | "hold" | "complete";

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: glCodes = [] } = useGLCodes();

  const getGLAccountDetails = (code: string | null | undefined): { number: string; name: string } | null => {
    if (!code) return null;
    const trimmed = String(code).trim();
    if (!trimmed || trimmed === "—") return null;

    // Check in glCodes list
    const found = glCodes.find((c) => {
      if (c.account_number === trimmed) return true;
      if (c.display_label === trimmed) return true;
      if (c.account_name.toLowerCase() === trimmed.toLowerCase()) return true;
      if (trimmed.startsWith(c.account_number + " - ")) return true;
      if (trimmed.startsWith(c.account_number + " ")) return true;
      return false;
    });

    if (found) {
      return {
        number: found.account_number,
        name: found.account_name,
      };
    }

    if (trimmed.includes(" - ")) {
      const parts = trimmed.split(" - ");
      return {
        number: parts[0].trim(),
        name: parts.slice(1).join(" - ").trim(),
      };
    }

    if (trimmed.includes(" ")) {
      const firstSpace = trimmed.indexOf(" ");
      return {
        number: trimmed.substring(0, firstSpace).trim(),
        name: trimmed.substring(firstSpace + 1).trim(),
      };
    }

    return {
      number: trimmed,
      name: "",
    };
  };

  const formatGLCode = (code: string | null | undefined) => {
    if (!code) return "—";
    const details = getGLAccountDetails(code);
    if (!details) return String(code);
    return details.name ? `${details.number} - ${details.name}` : details.number;
  };

  const renderGLAccountBadge = (code: string | null | undefined) => {
    const details = getGLAccountDetails(code);
    if (!details) {
      return <span className="text-slate-400 italic text-xs">Unassigned</span>;
    }
    return (
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 shrink-0">
          {details.number}
        </span>
        {details.name ? (
          <span className="font-medium text-slate-800 dark:text-zinc-200 break-words">
            {details.name}
          </span>
        ) : null}
      </div>
    );
  };
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
  const [isWireDialogOpen, setIsWireDialogOpen] = useState(false);
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
  const updateWireTransfer = useUpdateWireTransfer(id ?? "");
  const [isEditWireOpen, setIsEditWireOpen] = useState(false);

  const handleUpdateWire = async (wireData: WireTransferInput) => {
    try {
      await updateWireTransfer.mutateAsync(wireData);
      setIsEditWireOpen(false);
    } catch {
      // Error handled by hook toast
    }
  };
  const uploadAttachments = useUploadAttachments(id ?? "");
  const reviewMutation = useUpdateReviewStatus();


  const { user } = useAuth();

  const [activeForm, setActiveForm] = useState<{ action: WorkflowAction; kind: FormKind } | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [poItems, setPoItems] = useState<any[]>([]);
  const [poShippingFee, setPoShippingFee] = useState<number>(0);
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
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItemInput[]>([]);
  const [approval, setApproval] = useState<ApprovalInput>({ approver: "", comment: "" });
  const [tracking, setTracking] = useState<TrackingInput>({ tracking_number: "" });
  const [hold, setHold] = useState<HoldInput>({ reason: "" });
  const [completeData, setCompleteData] = useState<{
    selectionType: "PERIOD" | "DATE";
    period: "BI_WEEKLY" | "MONTHLY" | "ANNUALLY";
    next_due_date: string;
    comment: string;
  }>({
    selectionType: "PERIOD",
    period: "MONTHLY",
    next_due_date: "",
    comment: "",
  });

  const calculateNextDueDate = (baseDateStr: string | null | undefined, period: "BI_WEEKLY" | "MONTHLY" | "ANNUALLY"): string => {
    const today = new Date();
    let base: Date;
    if (baseDateStr && /^\d{4}-\d{2}-\d{2}/.test(baseDateStr)) {
      const [y, m, d] = baseDateStr.slice(0, 10).split("-").map(Number);
      base = new Date(y, m - 1, d);
    } else {
      base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    }

    const target = new Date(base.getTime());

    if (period === "BI_WEEKLY") {
      target.setDate(target.getDate() + 14);
    } else if (period === "MONTHLY") {
      const curMonth = target.getMonth();
      const curDay = target.getDate();
      target.setMonth(curMonth + 1);
      if (target.getDate() !== curDay) {
        target.setDate(0);
      }
    } else if (period === "ANNUALLY") {
      target.setFullYear(target.getFullYear() + 1);
    }

    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, "0");
    const dd = String(target.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };
  const [confirmGoods, setConfirmGoods] = useState({ description: "" });
  const [isActivityLogsOpen, setIsActivityLogsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      setApproval(prev => ({ ...prev, approver: user.id }));
    }
  }, [user]);

  const isRecurring = data?.request?.request_type === "RECURRING";
  const isAP = data?.request?.request_type === "ACCOUNTS_PAYABLE";
  const backUrl = isRecurring ? "/purchasing/recurring" : "/purchasing/requests";
  const backLabel = isRecurring ? "Recurring Payments" : "Purchase Requests";

  useEffect(() => {
    if (data?.request) {
      if (isRecurring) {
        document.dispatchEvent(
          new CustomEvent("set-breadcrumb-trail", {
            detail: {
              path: `/purchasing/requests/${data.request.id}`,
              items: [
                { title: "Purchasing" },
                { title: "Recurring Payments", path: "/purchasing/recurring" },
                { title: `${data.request.title} (${data.request.id})` },
              ],
            },
          })
        );
      } else {
        document.dispatchEvent(
          new CustomEvent("set-breadcrumb-title", {
            detail: {
              path: `/purchasing/requests/${data.request.id}`,
              title: `${data.request.title} (${data.request.id})`,
            },
          })
        );
      }
    }
  }, [data?.request, isRecurring]);

  if (isLoading) {
    return <div className="p-8 text-sm text-muted-foreground">Loading request...</div>;
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Button variant="outline" onClick={() => navigate(backUrl)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <p className="mt-4 text-sm text-red-600">Request not found.</p>
      </div>
    );
  }

  const { request, purchase_order, invoice: inv, approvals, available_actions } = data;
  const isMulti = request.item_mode === "MULTIPLE" || Boolean(request.items && request.items.length > 0) || Boolean(request.quote_data?.items && request.quote_data.items.length > 0);

  const multiPartsList: any[] = (request?.items && request.items.length > 0)
    ? request.items
    : (request?.quote_data?.items || request?.quote_data?.line_items || []);

  const getItemGLCode = (itm: any, idx: number): string | null => {
    if (data?.invoice?.items && data.invoice.items.length > 0) {
      const matched = data.invoice.items.find((invItm: any) =>
        (itm.id && String(invItm.request_item_id) === String(itm.id)) ||
        (invItm.sku && itm.sku && itm.sku.trim() !== "" && invItm.sku.trim() === itm.sku.trim())
      ) || data.invoice.items[idx];
      if (matched?.gl_code) return matched.gl_code;
    }
    if (itm.gl_code) return itm.gl_code;
    return null;
  };
  let flow = SPEND_FLOW;
  if (request.request_type === "ADMIN") flow = ADMIN_FLOW;
  else if (request.request_type === "ACCOUNTS_PAYABLE") flow = ACCOUNTS_PAYABLE_FLOW;
  else if (request.request_type === "RECURRING") flow = RECURRING_FLOW;
  else if (request.request_type === "QUOTE") flow = QUOTE_FLOW;

  const dispatch = async (payload: TransitionInput): Promise<boolean> => {
    try {
      await transition.mutateAsync(payload);
      toast.success(`${ACTION_META[payload.action].label} done`);
      setActiveForm(null);
      if (payload.action === "DELETE_REQUEST") {
        navigate(backUrl);
      }
      return true;
    } catch (err) {
      toast.error((err as Error).message || "Action failed");
      return false;
    }
  };

  const handleConfirmWire = async (wireData: WireTransferInput) => {
    const ok = await dispatch({
      action: "MARK_PURCHASED",
      wire_transfer: wireData,
    });
    if (ok) {
      setIsWireDialogOpen(false);
      toast.success("Wire transfer details saved & marked as purchased.");
    }
  };

  const onAction = (action: WorkflowAction) => {
    const isWire =
      purchase_order?.payment_method === "W" ||
      (purchase_order?.payment_method as any) === "WIRE";
    if (action === "MARK_PURCHASED" && isWire) {
      setIsWireDialogOpen(true);
      return;
    }

    const meta = ACTION_META[action];
    if (action === "COMPLETE") {
      // The next due date calculation dialog only shows for recurring payment cycles, not standard requests
      if (isRecurring) {
        const baseDate = request.due_date || request.request_date || new Date().toISOString().split("T")[0];
        const initialCalculated = calculateNextDueDate(baseDate, "MONTHLY");
        setCompleteData({
          selectionType: "PERIOD",
          period: "MONTHLY",
          next_due_date: initialCalculated,
          comment: "",
        });
        setActiveForm({ kind: "complete", action: "COMPLETE" });
        return;
      }
      // Standard requests complete directly without recurring schedule prompt
      void dispatch({ action });
      return;
    }

    if (!meta.form) {
      void dispatch({ action });
      return;
    }
    // Prefill sensible defaults from existing data.
    if (meta.form === "invoice") {
      const defaultVendor =
        purchase_order?.vendor ??
        request.quote_data?.vendor?.name ??
        (request.request_type === 'RECURRING' ? request.title : "") ??
        "";
      const isDefaultAsset =
        request.request_type === 'RECURRING' || request.request_type === 'ACCOUNTS_PAYABLE';
      const initialGL = purchase_order?.gl_code ?? request.gl_code ?? "";

      const rawItems = (request.items && request.items.length > 0)
        ? request.items
        : (request.quote_data?.items || request.quote_data?.line_items || []);

      const prefilledItems: InvoiceItemInput[] = (rawItems || []).map((itm: any) => ({
        request_item_id: itm.id && !isNaN(Number(itm.id)) ? Number(itm.id) : undefined,
        description: itm.description || itm.title || "Item",
        sku: itm.sku || "",
        quantity: Number(itm.quantity) || 1,
        unit_price: Number(itm.unit_price) || 0,
        amount: Number(itm.total ?? itm.amount ?? ((Number(itm.quantity) || 1) * (Number(itm.unit_price) || 0))) || 0,
        gl_code: itm.gl_code || initialGL,
        asset_flag: isDefaultAsset,
      }));

      setInvoiceItems(prefilledItems);
      setInvoice({
        vendor: defaultVendor,
        amount: purchase_order?.amount ?? request.amount ?? request.unit_price ?? 0,
        invoice_date: new Date().toISOString().split("T")[0],
        due_date: "",
        gl_code: initialGL,
        asset_flag: isDefaultAsset,
      });
      setPendingFiles([]);
    }
    if (meta.form === "po") {
      const info = request.product_info;
      const isUsable = (v: string | undefined | null) => !!v && !!v.trim() && v.trim().toUpperCase() !== "N/A";
      const quoteVendor = request.quote_data?.vendor?.name;
      const quoteNum = request.quote_data?.quote_number;

      const rawItems = (request.items && request.items.length > 0)
        ? request.items
        : (request.quote_data?.items || request.quote_data?.line_items || []);

      const parsedPoItems = rawItems.map((i: any, idx: number) => ({
        id: i.id,
        sku: i.sku || "",
        description: i.description || `Part ${idx + 1}`,
        quantity: Number(i.quantity) || 1,
        unit_price: Number(i.unit_price) || 0,
        total: Number(i.total) || (Math.round((Number(i.quantity) || 1) * Number(i.unit_price || 0) * 100) / 100),
      }));
      setPoItems(parsedPoItems);
      const initShipping = Number(request.quote_data?.totals?.shipping) || 0;
      setPoShippingFee(initShipping);

      const isMultiReq = request.item_mode === "MULTIPLE" || parsedPoItems.length > 0;
      setPo({
        vendor: quoteVendor || (info && isUsable(info.vendor) ? info.vendor : ""),
        item: isMultiReq ? (parsedPoItems.length ? `Multi Parts (${parsedPoItems.length} parts)` : (request.title || "Multi Parts")) : (request.title || (info && isUsable(info.name) ? info.name : "")),
        quantity: isMultiReq ? (parsedPoItems.length || 1) : (request.quantity ?? 1),
        unit_price: isMultiReq ? 0 : (request.unit_price ?? 0),
        amount: request.amount ?? 0,
        quote_number: quoteNum || "",
        description: (info && isUsable(info.description) ? info.description : (request.description || "")),
        currency: request.currency ?? (info && isUsable(info.currency) ? info.currency.toUpperCase() : "USD"),
        payment_method: undefined,
        shipped_to_location: "",
        expected_delivery_date: "",
      });
    }
    if (meta.form === "approval") {
      setApproval({ approver: user?.id || "", comment: "" });
    }
    setConfirmGoods({ description: "" });
    setActiveForm({ action, kind: meta.form });
  };

  const submitForm = () => {
    if (!activeForm) return;
    const { action, kind } = activeForm;
    if (kind === "po") {
      if (!po.quote_number || !po.quote_number.trim()) return toast.error("Quote / PO # is required.");
      if (!po.vendor || !po.item) return toast.error("Vendor and item are required.");
      if (!po.payment_method) return toast.error("Payment format is required.");
      if (!po.shipped_to_location || !po.shipped_to_location.trim()) return toast.error("Shipped to location is required.");
      void dispatch({ action, purchase_order: { ...po, amount: Number(po.amount) || 0, quantity: Number(po.quantity) || 1, unit_price: Number(po.unit_price) || 0 } });
    } else if (kind === "invoice") {
      if (!invoice.vendor || !invoice.invoice_date) return toast.error("Vendor and bill date are required.");

      const isMulti = invoiceItems.length > 1;
      if (isMulti) {
        const missingGl = invoiceItems.some(it => !it.gl_code || !it.gl_code.trim());
        if (missingGl) {
          return toast.error("GL Code is required for all line items.");
        }
      } else {
        if (!invoice.gl_code || !invoice.gl_code.trim()) {
          return toast.error("GL Code is required.");
        }
      }

      void (async () => {
        const cleanDueDate = invoice.due_date && invoice.due_date.trim() !== "" ? invoice.due_date : undefined;
        const ok = await dispatch({
          action,
          invoice: {
            ...invoice,
            invoice_type: "Purchase",
            amount: Number(invoice.amount) || 0,
            due_date: cleanDueDate,
            gl_code: invoice.gl_code?.trim() || (invoiceItems.length > 0 ? invoiceItems[0].gl_code?.trim() : undefined),
            items: isMulti ? invoiceItems.map(it => ({
              ...it,
              amount: Number(it.amount) || 0,
              quantity: Number(it.quantity) || 1,
              unit_price: Number(it.unit_price) || 0,
              gl_code: it.gl_code.trim(),
            })) : undefined,
          },
        });
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
      const approverId = approval.approver || user?.id || user?.full_name || user?.email || "Approver";
      void dispatch({ action, approval: { ...approval, approver: approverId } });
    } else if (kind === "tracking") {
      if (!tracking.tracking_number) return toast.error("Tracking number is required.");
      void dispatch({ action, tracking });
    } else if (kind === "confirmGoods") {
      void dispatch({ action, confirm_goods: { description: confirmGoods.description.trim() } });
    } else if (kind === "hold") {
      if (!hold.reason || !hold.reason.trim()) return toast.error("Hold reason is required.");
      void dispatch({ action, hold });
    } else if (kind === "complete") {
      if (!completeData.next_due_date || !completeData.next_due_date.trim()) {
        return toast.error("Next due date is required.");
      }
      void dispatch({
        action,
        next_due_date: completeData.next_due_date,
        comment: completeData.comment?.trim() || undefined,
      });
    }
  };

  // Crawled product foreign currency & original price resolution
  const pInfo = request.product_info;
  const pVendor = (pInfo?.vendor || "").toLowerCase();
  const isCaVendor = pVendor.includes(".ca") || pVendor.includes("amazon.ca") || (request.item_url || "").toLowerCase().includes("amazon.ca");
  
  let crawledOrigPrice: number | null = null;
  let crawledOrigCurr: string | null = null;

  if (pInfo?.original_price && pInfo?.original_currency) {
    crawledOrigPrice = Number(pInfo.original_price);
    crawledOrigCurr = pInfo.original_currency;
  } else if (pInfo?.currency && pInfo.currency.toUpperCase() !== "USD" && pInfo.currency.toUpperCase() !== "N/A" && pInfo.price && pInfo.price !== "N/A") {
    crawledOrigPrice = Number(String(pInfo.price).replace(/[^0-9.]/g, ""));
    crawledOrigCurr = pInfo.currency;
  } else if (isCaVendor) {
    crawledOrigCurr = "CAD";
    if (pInfo?.price && pInfo.price !== "N/A") {
      const pNum = Number(String(pInfo.price).replace(/[^0-9.]/g, ""));
      crawledOrigPrice = pNum > 0 ? Math.round((pNum / 0.73) * 100) / 100 : null;
    } else if (request.unit_price) {
      crawledOrigPrice = Math.round((request.unit_price / 0.73) * 100) / 100;
    }
  }

  const hasCrawledForeignPrice = Boolean(
    crawledOrigPrice &&
    crawledOrigPrice > 0 &&
    crawledOrigCurr &&
    crawledOrigCurr.toUpperCase() !== (request.currency || "USD").toUpperCase()
  );

  const isReviewed = request.review_status === "REVIEWED";

  const isForeignQuote = Boolean(
    request.quote_data?.conversion?.is_converted &&
    request.quote_data?.conversion?.original_currency &&
    request.quote_data?.conversion?.original_currency !== "USD"
  );
  const quoteNativeCurrency = request.quote_data?.conversion?.original_currency || request.quote_data?.currency || "USD";
  const quoteExchangeRate = Number(request.quote_data?.conversion?.exchange_rate) || 1.0;

  const rawItemsList = (request.items && request.items.length > 0) ? request.items : (request.quote_data?.items || []);
  const itemsSumNative = rawItemsList.reduce((acc: number, itm: any) => {
    const itmTotal = Number(itm.original_total ?? itm.total ?? (Number(itm.quantity || 1) * Number(itm.unit_price || 0)));
    return acc + itmTotal;
  }, 0);

  const quoteShippingNative = Number(request.quote_data?.conversion?.original_shipping ?? request.quote_data?.totals?.shipping) || 0;
  const quoteTaxNative = Number(request.quote_data?.conversion?.original_tax ?? request.quote_data?.totals?.tax) || 0;
  const quoteDiscountNative = Number(request.quote_data?.conversion?.original_discount ?? request.quote_data?.totals?.discount) || 0;

  const calculatedQuoteTotalNative = Math.round((itemsSumNative + quoteShippingNative + quoteTaxNative - quoteDiscountNative) * 100) / 100;
  const statedGrandTotalNative = Math.round(Number(request.quote_data?.conversion?.original_total ?? request.quote_data?.totals?.total ?? (isForeignQuote ? itemsSumNative : request.amount)) * 100) / 100;

  const statedGrandTotalUsd = Math.round(Number(request.amount || request.quote_data?.conversion?.converted_total || (statedGrandTotalNative * quoteExchangeRate)) * 100) / 100;
  const calculatedQuoteTotalUsd = Math.round((calculatedQuoteTotalNative * quoteExchangeRate) * 100) / 100;

  const totalsMatch = Math.abs(calculatedQuoteTotalNative - statedGrandTotalNative) < 0.05 || Math.abs(calculatedQuoteTotalUsd - statedGrandTotalUsd) < 0.05;
  const vendorCompanyName = request.quote_data?.vendor?.name || (request.title?.includes(" - ") ? request.title.split(" - ")[0] : "");
  const customerCompanyName = request.quote_data?.customer?.name;

  const isEditableStatus = (
    [RequestStatus.Initial, RequestStatus.New, RequestStatus.UnderReview] as readonly RequestStatus[]
  ).includes(request.status);

  const isRequester = Boolean(
    user && (
      (request.requester_id && String(request.requester_id) === String(user.id)) ||
      (request.requester && (
        (user.full_name && request.requester.toLowerCase().trim() === user.full_name.toLowerCase().trim()) ||
        (user.email && request.requester.toLowerCase().trim() === user.email.toLowerCase().trim()) ||
        (request.requester_email && user.email && request.requester_email.toLowerCase().trim() === user.email.toLowerCase().trim())
      ))
    )
  );

  const isAssigned = Boolean(
    user && (
      (request.assigned_user_id && String(request.assigned_user_id) === String(user.id)) ||
      (request.assigned_user_ids && request.assigned_user_ids.some(uid => String(uid) === String(user.id))) ||
      (request.assigned_user && (
        (user.full_name && request.assigned_user.toLowerCase().includes(user.full_name.toLowerCase().trim())) ||
        (user.email && request.assigned_user.toLowerCase().includes(user.email.toLowerCase().trim()))
      ))
    )
  );

  const canEditRequest = isEditableStatus && (isRequester || isAssigned || Boolean(user?.is_super_admin));
  const isWaitingApproval = (
    [RequestStatus.WaitingApproval, RequestStatus.UnderReview, "WAITING_APPROVAL", "UNDER_REVIEW"] as readonly string[]
  ).includes(request.status);
  const isSelfApprovalBlocked = isWaitingApproval && isRequester;

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      {/* Top Navigation & Record Actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap border-b border-border/40 pb-3">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-xs font-medium text-muted-foreground hover:text-foreground -ml-2 h-8 px-2"
          onClick={() => navigate(backUrl)}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to {backLabel}</span>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsActivityLogsOpen(true)}
            className="h-8 text-xs gap-1.5 shadow-xs"
          >
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Activity Logs</span>
          </Button>

          {canEditRequest && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditOpen(true)}
              className="h-8 text-xs gap-1.5 shadow-xs"
            >
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Edit Request</span>
            </Button>
          )}

          {available_actions.includes("DELETE_REQUEST") && (
            <Button
              variant="destructive"
              size="sm"
              disabled={transition.isPending || isExtracting}
              onClick={() => onAction("DELETE_REQUEST")}
              className="h-8 text-xs gap-1.5 shadow-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{ACTION_META["DELETE_REQUEST"].label}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Request Header (Full Width) */}
      <div className="w-full space-y-2.5">
        {/* Title with ID prefix and HelpIcon - Takes 100% full width */}
        <div className="flex items-start gap-2.5 w-full">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 leading-snug break-words flex-1 min-w-0">
            <span className="text-blue-600 dark:text-blue-400 font-semibold mr-2 font-mono text-lg sm:text-xl">
              #{request.id}
            </span>
            {request.title}
          </h1>
          <span className="mt-1 shrink-0 inline-flex">
            <HelpIcon text="Detailed view of a single purchase request, including purchase order, invoices, and workflow approval logs." />
          </span>
        </div>

        {/* Status, Context Subtitle & Transition Actions Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 dark:text-zinc-400">
            {/* Primary Status Badge */}
            <Badge variant="outline" className={cn("font-medium gap-1.5 shadow-xs shrink-0 py-0.5 px-2.5", getStatusBadge(request.status))}>
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
              {getStatusLabel(request.status)}
            </Badge>

            {/* Priority: only show pill when HIGH or URGENT */}
            {(request.priority === "HIGH" || request.priority === "URGENT") && (
              <Badge variant="outline" className={cn("font-semibold shadow-xs shrink-0 py-0.5 px-2", PRIORITY_BADGE[request.priority])}>
                {request.priority}
              </Badge>
            )}

            {isRecurring && (
              <button
                onClick={() => {
                  const newRev = isReviewed ? "WAITING_FOR_REVIEW" : "REVIEWED";
                  reviewMutation.mutate({ id: request.id, review_status: newRev });
                }}
                disabled={reviewMutation.isPending}
                className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95 shrink-0 ${
                  isReviewed
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800"
                    : "bg-amber-50 text-amber-900 border-amber-400 hover:bg-amber-100 ring-2 ring-amber-300/50 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700"
                }`}
                title={isReviewed ? "Click to revert to Waiting for Review" : "Click to mark as Reviewed"}
              >
                {isReviewed ? (
                  <>
                    <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Reviewed</span>
                    <span className="text-[10px] opacity-60 group-hover:opacity-100 font-normal ml-0.5">
                      (Click to undo)
                    </span>
                  </>
                ) : (
                  <>
                    <Clock size={13} className="text-amber-600 dark:text-amber-400 shrink-0 animate-pulse" />
                    <span>Waiting for Review</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-200/90 dark:bg-amber-900 text-amber-800 dark:text-amber-200 group-hover:bg-amber-300 transition-colors">
                      Click to Review ➔
                    </span>
                  </>
                )}
              </button>
            )}

            <span className="text-slate-300 dark:text-zinc-700">·</span>

            {/* Clean contextual text */}
            <span className="font-medium text-slate-700 dark:text-zinc-300">
              {formatRequestType(request.request_type)}
            </span>

            <span className="opacity-40">·</span>

            <span>
              Requested by <strong className="font-medium text-slate-700 dark:text-zinc-300">{request.requester || "Unknown"}</strong>
              {request.department && <span className="opacity-75"> ({request.department})</span>}
            </span>

            {request.request_date && (
              <>
                <span className="opacity-40">·</span>
                <span>{formatDate(request.request_date)}</span>
              </>
            )}
          </div>

          {/* Workflow Transition Action Buttons */}
          {available_actions.filter(a => {
            if (a === "DELETE_REQUEST") return false;
            if ((isRecurring || isAP) && a === "CREATE_PO") return false;
            return true;
          }).length > 0 && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Action:</span>
              {isExtracting && (
                <span className="text-xs text-slate-500 dark:text-zinc-400 italic">
                  Waiting for product details...
                </span>
              )}
              {isRecurring && !isReviewed && available_actions.includes("RECORD_INVOICE") && (
                <Button
                  size="sm"
                  disabled={reviewMutation.isPending}
                  onClick={() => reviewMutation.mutate({ id: request.id, review_status: "REVIEWED" })}
                  className="h-8 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white border-none shadow-sm flex items-center gap-1.5 cursor-pointer animate-pulse"
                  title="Click to mark as Reviewed and enable Record Invoice"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Mark as Reviewed
                </Button>
              )}
              {available_actions
                .filter(a => {
                  if (a === "DELETE_REQUEST") return false;
                  if ((isRecurring || isAP) && a === "CREATE_PO") return false;
                  return true;
                })
                .map((action) => {
                  const meta = ACTION_META[action];
                  const isRecordInvoiceDisabled = isRecurring && action === "RECORD_INVOICE" && !isReviewed;
                  const isDisabled = transition.isPending || isExtracting || isRecordInvoiceDisabled;
                  const buttonTitle = isRecordInvoiceDisabled
                    ? "Recurring request must be marked as 'Reviewed' before recording an invoice."
                    : undefined;

                  const isApprove = action === "APPROVE";
                  const isReject = action === "REJECT";
                  const customClass = isApprove
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                    : isReject
                    ? "bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                    : isRecordInvoiceDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : "shadow-xs";

                  return (
                    <div key={action} title={buttonTitle} className="inline-block">
                      <Button
                        size="sm"
                        variant={isApprove || isReject ? "default" : meta.variant === "destructive" ? "destructive" : meta.variant === "outline" ? "outline" : "default"}
                        disabled={isDisabled}
                        onClick={() => onAction(action)}
                        className={cn("h-8 text-xs font-medium", customClass)}
                      >
                        {meta.label}
                      </Button>
                    </div>
                  );
                })}
              {isRecurring && !isReviewed && available_actions.includes("RECORD_INVOICE") && (
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium italic ml-1">
                  ← Click 'Mark as Reviewed' to enable Record Invoice
                </span>
              )}
            </div>
          )}

          {isSelfApprovalBlocked && available_actions.filter(a => a !== "DELETE_REQUEST" && !((isRecurring || isAP) && a === "CREATE_PO")).length === 0 && (
            <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 px-2.5 py-1 rounded-md shrink-0">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>Awaiting review by another approver (self-approval prohibited)</span>
            </div>
          )}
        </div>
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

      {/* Self-Approval Restriction Banner */}
      {isSelfApprovalBlocked && (
        <Alert className="bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200">
          <ShieldAlert className="h-4 w-4 !text-amber-600 dark:!text-amber-400" />
          <AlertTitle className="font-semibold text-xs sm:text-sm">Self-Approval Restriction</AlertTitle>
          <AlertDescription className="text-xs text-amber-800 dark:text-amber-300 mt-1">
            As the requester of this purchase request, you cannot approve or reject your own request. Another eligible approver must review and take action on this submission.
          </AlertDescription>
        </Alert>
      )}

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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          <Card className="border border-slate-200 dark:border-zinc-800">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Request Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <Field label="Requester" value={request.requester} />
              <Field label="Department" value={request.department} />
              <Field label="Type" value={formatRequestType(request.request_type)} />
              <Field
                label="Configuration"
                value={
                  request.item_mode === "MULTIPLE" || (request.items && request.items.length > 0)
                    ? `Multiple Parts (${request.items?.length || 0} parts)`
                    : "Single Item"
                }
              />
              <AssignedUsersField label="Assigned To" value={request.assigned_user ?? "—"} />
              {isMulti ? (
                <div>
                  <div className="text-xs text-slate-500 dark:text-zinc-400 mb-1">GL Code / Account</div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="outline" className="bg-indigo-50/80 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800 text-xs font-normal">
                      Itemized per Part ({multiPartsList.length} parts)
                    </Badge>
                    {data?.invoice?.items && data.invoice.items.length > 0 && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        • Recorded in Bill
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <Field label="GL Code / Account" value={formatGLCode(request.gl_code || data?.purchase_order?.gl_code)} />
              )}
              <Field label="Requested" value={formatDate(request.request_date)} />
              <Field label="Last Updated" value={formatDate(request.updated_at)} />
              {(request.due_date || isRecurring) && (
                <Field
                  label="Next Due Date"
                  value={
                    request.due_date ? (
                      <span className="font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        {formatDate(request.due_date)}
                      </span>
                    ) : (
                      "—"
                    )
                  }
                />
              )}
              {!(request.item_mode === "MULTIPLE" || (request.items && request.items.length > 0)) && (
                <>
                  <Field label="SKU / Part #" value={request.sku || request.items?.[0]?.sku || "—"} />
                  <Field label="Quantity" value={String(request.quantity ?? 1)} />
                  <Field
                    label="Unit Price"
                    value={
                      <span>
                        {formatMoney(request.unit_price ?? 0)} {request.currency || "USD"}
                        {hasCrawledForeignPrice && (
                          <span className="text-slate-500 text-xs ml-1.5 font-normal">
                            ({formatMoney(crawledOrigPrice!)} {crawledOrigCurr})
                          </span>
                        )}
                      </span>
                    }
                  />
                </>
              )}
              <Field
                label="Total Amount (Pre-Tax)"
                value={
                  <span>
                    {formatMoney(request.amount ?? 0)} {request.currency || "USD"}
                    {hasCrawledForeignPrice && (
                      <span className="text-slate-500 text-xs ml-1.5 font-normal">
                        ({formatMoney(crawledOrigPrice! * (Number(request.quantity) || 1))} {crawledOrigCurr})
                      </span>
                    )}
                  </span>
                }
              />
              <Field
                label="Total Amount (After-Tax)"
                value={
                  <span>
                    {formatMoney((request.amount ?? 0) * (1 + TAX_RATE))} {request.currency || "USD"}
                    {hasCrawledForeignPrice && (
                      <span className="text-slate-500 text-xs ml-1.5 font-normal">
                        ({formatMoney(crawledOrigPrice! * (Number(request.quantity) || 1) * (1 + TAX_RATE))} {crawledOrigCurr})
                      </span>
                    )}
                  </span>
                }
              />
              <Field label="Currency" value={request.currency || "USD"} />
              <div className="col-span-2">
                <div className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Description</div>
                <div className="text-slate-800 dark:text-zinc-200">{request.description || "—"}</div>
              </div>

              {isMulti && multiPartsList.length > 0 && (
                <div className="col-span-2 pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                      Parts &amp; GL Account Allocations ({multiPartsList.length} items)
                    </span>
                    <span className="text-xs text-slate-500">
                      Per-part accounting allocation
                    </span>
                  </div>
                  <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800 text-xs">
                    <div className="bg-slate-50 dark:bg-zinc-800/60 px-3 py-2 grid grid-cols-12 gap-3 font-semibold text-slate-600 dark:text-zinc-400">
                      <div className="col-span-1 text-center">#</div>
                      <div className="col-span-5">Part / Description</div>
                      <div className="col-span-2 text-right pr-6">Amount</div>
                      <div className="col-span-4 pl-4 border-l border-slate-200 dark:border-zinc-700">GL Code / Account</div>
                    </div>
                    {multiPartsList.map((itm: any, idx: number) => {
                      const itemGL = getItemGLCode(itm, idx);
                      const rawPrice = Number(itm.original_unit_price ?? itm.unit_price ?? 0);
                      const rawTot = Number(itm.original_total ?? itm.total ?? (rawPrice * (Number(itm.quantity) || 1)));
                      return (
                        <div key={itm.id || idx} className="px-3 py-2.5 grid grid-cols-12 gap-3 items-center bg-white dark:bg-zinc-900 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                          <div className="col-span-1 text-center font-mono text-slate-400">{idx + 1}</div>
                          <div className="col-span-5 pr-2">
                            <div className="font-medium text-slate-900 dark:text-zinc-100 break-words whitespace-normal leading-snug">
                              {itm.sku ? <span className="font-mono text-indigo-600 dark:text-indigo-400 mr-1">[{itm.sku}]</span> : null}
                              {itm.description}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Qty: {itm.quantity} {rawPrice > 0 ? `· ${formatMoney(rawPrice)} each` : ""}
                            </div>
                          </div>
                          <div className="col-span-2 text-right pr-6 font-mono font-semibold text-slate-800 dark:text-zinc-200">
                            {formatMoney(rawTot)}
                          </div>
                          <div className="col-span-4 pl-4 border-l border-slate-100 dark:border-zinc-800">
                            {renderGLAccountBadge(itemGL)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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
                                onClick={() => extractProductMutation.mutate(undefined)}
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
                            <div className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-baseline gap-2 flex-wrap">
                              <span>
                                {request.product_info.price ? (request.product_info.price.startsWith("$") ? request.product_info.price : `$${request.product_info.price}`) : "—"}
                                {request.product_info.currency && request.product_info.currency.toUpperCase() !== "N/A" ? ` ${request.product_info.currency}` : ""}
                              </span>
                              {hasCrawledForeignPrice && (
                                <span className="text-xs font-semibold text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-700">
                                  ({formatMoney(crawledOrigPrice!)} {crawledOrigCurr})
                                </span>
                              )}
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
                          <div className="min-w-0">
                            <div className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mb-1">Category</div>
                            <Badge variant="outline" className="bg-white dark:bg-zinc-900 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 max-w-full truncate block" title={request.product_info.category}>{request.product_info.category}</Badge>
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


          {Boolean((request.items && request.items.length > 0) || (request.quote_data?.items && request.quote_data.items.length > 0)) && (
            <Card className="border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-b from-indigo-50/20 to-transparent shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-indigo-950 dark:text-indigo-200">
                    <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-semibold text-base">Quotation Items &amp; Parts Breakdown ({(request.items?.length || request.quote_data?.items?.length || 0)})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 font-mono text-xs font-semibold">
                      {isForeignQuote
                        ? `Currency: ${quoteNativeCurrency} (Converted @ 1 ${quoteNativeCurrency} = $${quoteExchangeRate} USD)`
                        : `Currency: USD`}
                    </Badge>
                  </div>
                </div>

                {/* Company & Quote Metadata */}
                <div className="text-xs text-slate-600 dark:text-zinc-400 flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 border-t border-indigo-100 dark:border-indigo-900/40 mt-1">
                  {vendorCompanyName && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <strong>Company / Vendor:</strong>
                      <span className="font-medium text-slate-900 dark:text-zinc-100">{vendorCompanyName}</span>
                    </span>
                  )}
                  {customerCompanyName && (
                    <span><strong>Customer / Bill To:</strong> {customerCompanyName}</span>
                  )}
                  {request.quote_data?.quote_number && (
                    <span><strong>Quote Ref:</strong> <span className="font-mono">{request.quote_data.quote_number}</span></span>
                  )}
                  {request.quote_data?.quote_date && (
                    <span><strong>Date:</strong> {request.quote_data.quote_date}</span>
                  )}
                  {request.quote_data?.valid_until && (
                    <span><strong>Valid Until:</strong> {request.quote_data.valid_until}</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-slate-200 dark:border-zinc-800 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-zinc-800/60">
                      <TableRow>
                        <TableHead className="w-10 text-center">#</TableHead>
                        <TableHead className="w-24 font-semibold">SKU</TableHead>
                        <TableHead className="font-semibold">Description</TableHead>
                        <TableHead className="w-16 text-right font-semibold">Qty</TableHead>
                        <TableHead className="w-24 text-right font-semibold">Unit Price ({quoteNativeCurrency})</TableHead>
                        <TableHead className="w-24 text-right pr-6 font-semibold">Total ({quoteNativeCurrency})</TableHead>
                        <TableHead className="w-48 pl-4 border-l border-slate-200 dark:border-zinc-700 font-semibold">GL Code / Account</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(request.items?.length ? request.items : (request.quote_data?.items || [])).map((itm: any, idx: number) => {
                        const rawPrice = Number(itm.original_unit_price ?? itm.unit_price ?? 0);
                        const rawTot = Number(itm.original_total ?? itm.total ?? (rawPrice * (Number(itm.quantity) || 1)));
                        const convPrice = Number(itm.converted_unit_price ?? (rawPrice * quoteExchangeRate));
                        const convTot = Number(itm.converted_total ?? (rawTot * quoteExchangeRate));

                        return (
                          <TableRow key={itm.id || idx}>
                            <TableCell className="text-xs text-slate-400 font-mono text-center">{idx + 1}</TableCell>
                            <TableCell className="text-xs text-slate-500 font-mono">{itm.sku || "—"}</TableCell>
                            <TableCell className="font-medium text-slate-900 dark:text-zinc-100 text-sm">{itm.description}</TableCell>
                            <TableCell className="text-right text-slate-600 dark:text-zinc-400">{itm.quantity}</TableCell>
                            <TableCell className="text-right text-slate-600 dark:text-zinc-400">
                              <div>{formatMoney(rawPrice)} {quoteNativeCurrency}</div>
                              {isForeignQuote && (
                                <div className="text-[10.5px] text-slate-400 font-mono">
                                  ({formatMoney(convPrice)} USD)
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right pr-6 font-semibold font-mono text-slate-900 dark:text-zinc-100">
                              <div>{formatMoney(rawTot)} {quoteNativeCurrency}</div>
                              {isForeignQuote && (
                                <div className="text-[10.5px] text-slate-400 font-mono font-normal">
                                  ({formatMoney(convTot)} USD)
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-slate-700 dark:text-zinc-300 pl-4 border-l border-slate-100 dark:border-zinc-800">
                              {renderGLAccountBadge(getItemGLCode(itm, idx))}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-zinc-800">
                  {/* Math Matching Status Indicator */}
                  <div className="text-xs">
                    {totalsMatch ? (
                      <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-900/60 font-medium">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                        <span>
                          Calculated sum matches Grand Total ({formatMoney(statedGrandTotalNative)} {quoteNativeCurrency}
                          {isForeignQuote ? ` / ${formatMoney(statedGrandTotalUsd)} USD` : ""})
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-900/60">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                        <span>
                          Discrepancy: Calculated sum is {formatMoney(calculatedQuoteTotalNative)} {quoteNativeCurrency} vs stated Grand Total of {formatMoney(statedGrandTotalNative)} {quoteNativeCurrency}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Summary Totals Breakdown */}
                  <div className="text-right space-y-1 text-xs min-w-[220px]">
                    <div className="text-slate-500 flex justify-between gap-4">
                      <span>Items Subtotal:</span>
                      <span className="font-medium font-mono text-slate-700 dark:text-zinc-300">
                        {formatMoney(itemsSumNative)} {quoteNativeCurrency}
                        {isForeignQuote && <span className="text-[10.5px] text-slate-400 ml-1">({formatMoney(itemsSumNative * quoteExchangeRate)} USD)</span>}
                      </span>
                    </div>
                    {quoteShippingNative > 0 && (
                      <div className="text-slate-600 dark:text-zinc-300 flex justify-between gap-4 font-medium">
                        <span className="flex items-center gap-1"><Truck className="h-3 w-3 text-indigo-500" /> Shipping Fee:</span>
                        <span className="font-mono">
                          {formatMoney(quoteShippingNative)} {quoteNativeCurrency}
                          {isForeignQuote && <span className="text-[10.5px] text-slate-400 ml-1">({formatMoney(quoteShippingNative * quoteExchangeRate)} USD)</span>}
                        </span>
                      </div>
                    )}
                    {quoteTaxNative > 0 && (
                      <div className="text-slate-500 flex justify-between gap-4">
                        <span>Tax:</span>
                        <span className="font-medium font-mono">
                          {formatMoney(quoteTaxNative)} {quoteNativeCurrency}
                          {isForeignQuote && <span className="text-[10.5px] text-slate-400 ml-1">({formatMoney(quoteTaxNative * quoteExchangeRate)} USD)</span>}
                        </span>
                      </div>
                    )}
                    {quoteDiscountNative > 0 && (
                      <div className="text-emerald-600 flex justify-between gap-4">
                        <span>Discount:</span>
                        <span className="font-medium font-mono">
                          -{formatMoney(quoteDiscountNative)} {quoteNativeCurrency}
                          {isForeignQuote && <span className="text-[10.5px] text-emerald-500 ml-1">(-{formatMoney(quoteDiscountNative * quoteExchangeRate)} USD)</span>}
                        </span>
                      </div>
                    )}
                    <div className="pt-1.5 border-t border-slate-200 dark:border-zinc-800 text-sm flex justify-between gap-4 items-baseline">
                      <span className="text-slate-900 dark:text-zinc-100 font-semibold">Grand Total:</span>
                      <div className="text-right">
                        <div className="font-bold text-slate-900 dark:text-zinc-100 text-base font-mono">
                          {formatMoney(statedGrandTotalNative)} {quoteNativeCurrency}
                        </div>
                        {isForeignQuote && (
                          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                            ({formatMoney(statedGrandTotalUsd)} USD)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {purchase_order && (
            <Card className="border border-slate-200 dark:border-zinc-800">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4" /> Purchase Order · {purchase_order.id}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <Field label="Vendor" value={purchase_order.vendor} />
                  <Field label="Item" value={purchase_order.item} />
                  <Field label="Quote / PO #" value={purchase_order.quote_number ?? "—"} />
                  {!isMulti && <Field label="Quantity" value={String(request.quantity ?? 1)} />}
                  {!isMulti && <Field label="Unit Price" value={formatMoney(request.unit_price ?? 0)} />}
                  {isMulti && quoteShippingNative > 0 && (
                    <Field label="Shipping Fee" value={`${formatMoney(quoteShippingNative)}${purchase_order.currency ? ` ${purchase_order.currency}` : ""}`} />
                  )}
                  <Field label="Total Amount (Pre-Tax)" value={`${formatMoney(purchase_order.amount || request.amount)}${purchase_order.currency ? ` ${purchase_order.currency}` : ""}`} />
                  <Field label="Total Amount (After-Tax)" value={`${formatMoney((purchase_order.amount || request.amount) * (1 + TAX_RATE))}${purchase_order.currency ? ` ${purchase_order.currency}` : ""}`} />
                  <Field label="Payment Format" value={purchase_order.payment_method ? PAYMENT_METHOD_LABEL[purchase_order.payment_method] : "—"} />
                  <Field label="Shipped To" value={purchase_order.shipped_to_location ?? "—"} />
                  <Field label="Approval" value={purchase_order.approval_status} />
                  <Field label="Tracking #" value={purchase_order.tracking_number ?? "—"} />
                  <Field label="Shipping Note" value={purchase_order.shipping_note || "—"} />
                  <Field label="Goods Received" value={purchase_order.goods_received ? `Yes, on ${formatDate(purchase_order.goods_received_at)}` : "No"} />
                  <Field label="Goods Received Notes" value={purchase_order.goods_received_note || "—"} />
                  {purchase_order.description && (
                    <div className="col-span-2">
                      <div className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Description</div>
                      <div className="text-slate-800 dark:text-zinc-200 whitespace-pre-wrap">{purchase_order.description}</div>
                    </div>
                  )}
                </div>

                {isMulti && Boolean((request.items && request.items.length > 0) || (request.quote_data?.items && request.quote_data.items.length > 0)) && (
                  <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        Line Items &amp; Parts Breakdown ({(request.items?.length || request.quote_data?.items?.length)} items)
                      </div>
                      <Badge variant="outline" className="text-[11px] font-mono">
                        Currency: {quoteNativeCurrency}
                      </Badge>
                    </div>
                    <div className="rounded-lg border border-slate-200 dark:border-zinc-800 overflow-hidden">
                      <Table>
                        <TableHeader className="bg-slate-50 dark:bg-zinc-800/60">
                          <TableRow>
                            <TableHead className="w-10 text-center text-xs">#</TableHead>
                            <TableHead className="w-28 text-xs font-semibold">SKU</TableHead>
                            <TableHead className="text-xs font-semibold">Description</TableHead>
                            <TableHead className="w-16 text-right text-xs font-semibold">Qty</TableHead>
                            <TableHead className="w-24 text-right text-xs font-semibold">Unit Price ({quoteNativeCurrency})</TableHead>
                            <TableHead className="w-24 text-right text-xs font-semibold pr-6">Total ({quoteNativeCurrency})</TableHead>
                            <TableHead className="w-48 text-xs font-semibold pl-4 border-l border-slate-200 dark:border-zinc-700">GL Code / Account</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(request.items?.length ? request.items : (request.quote_data?.items || [])).map((itm: any, idx: number) => {
                            const rawPrice = Number(itm.original_unit_price ?? itm.unit_price ?? 0);
                            const rawTot = Number(itm.original_total ?? itm.total ?? (rawPrice * (Number(itm.quantity) || 1)));
                            const convPrice = Number(itm.converted_unit_price ?? (rawPrice * quoteExchangeRate));
                            const convTot = Number(itm.converted_total ?? (rawTot * quoteExchangeRate));

                            return (
                              <TableRow key={itm.id || idx}>
                                <TableCell className="text-xs text-slate-400 font-mono text-center">{idx + 1}</TableCell>
                                <TableCell className="text-xs text-slate-500 font-mono">{itm.sku || "—"}</TableCell>
                                <TableCell className="font-medium text-slate-900 dark:text-zinc-100 text-xs">{itm.description}</TableCell>
                                <TableCell className="text-right text-xs text-slate-600 dark:text-zinc-400">{itm.quantity}</TableCell>
                                <TableCell className="text-right text-xs text-slate-600 dark:text-zinc-400">
                                  <div>{formatMoney(rawPrice)} {quoteNativeCurrency}</div>
                                  {isForeignQuote && (
                                    <div className="text-[10px] text-slate-400 font-mono">
                                      ({formatMoney(convPrice)} USD)
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="text-right text-xs font-semibold font-mono text-slate-900 dark:text-zinc-100 pr-6">
                                  <div>{formatMoney(rawTot)} {quoteNativeCurrency}</div>
                                  {isForeignQuote && (
                                    <div className="text-[10px] text-slate-400 font-mono font-normal">
                                      ({formatMoney(convTot)} USD)
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="text-xs text-slate-700 dark:text-zinc-300 pl-4 border-l border-slate-100 dark:border-zinc-800">
                                  {renderGLAccountBadge(getItemGLCode(itm, idx))}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* PO Line Items Summary Breakdown */}
                    <div className="flex justify-end pt-1">
                      <div className="text-right space-y-1 text-xs min-w-[220px]">
                        <div className="text-slate-500 flex justify-between gap-4">
                          <span>Items Subtotal:</span>
                          <span className="font-medium font-mono text-slate-700 dark:text-zinc-300">
                            {formatMoney(itemsSumNative)} {quoteNativeCurrency}
                            {isForeignQuote && <span className="text-[10px] text-slate-400 ml-1">({formatMoney(itemsSumNative * quoteExchangeRate)} USD)</span>}
                          </span>
                        </div>
                        {quoteShippingNative > 0 && (
                          <div className="text-slate-600 dark:text-zinc-300 flex justify-between gap-4 font-medium">
                            <span className="flex items-center gap-1"><Truck className="h-3 w-3 text-indigo-500" /> Shipping Fee:</span>
                            <span className="font-mono">
                              {formatMoney(quoteShippingNative)} {quoteNativeCurrency}
                              {isForeignQuote && <span className="text-[10px] text-slate-400 ml-1">({formatMoney(quoteShippingNative * quoteExchangeRate)} USD)</span>}
                            </span>
                          </div>
                        )}
                        {quoteTaxNative > 0 && (
                          <div className="text-slate-500 flex justify-between gap-4">
                            <span>Tax &amp; Fees:</span>
                            <span className="font-medium font-mono">
                              {formatMoney(quoteTaxNative)} {quoteNativeCurrency}
                              {isForeignQuote && <span className="text-[10px] text-slate-400 ml-1">({formatMoney(quoteTaxNative * quoteExchangeRate)} USD)</span>}
                            </span>
                          </div>
                        )}
                        {quoteDiscountNative > 0 && (
                          <div className="text-emerald-600 flex justify-between gap-4">
                            <span>Discount:</span>
                            <span className="font-medium font-mono">
                              -{formatMoney(quoteDiscountNative)} {quoteNativeCurrency}
                              {isForeignQuote && <span className="text-[10px] text-emerald-500 ml-1">(-{formatMoney(quoteDiscountNative * quoteExchangeRate)} USD)</span>}
                            </span>
                          </div>
                        )}
                        <div className="pt-1.5 border-t border-slate-200 dark:border-zinc-800 text-sm flex justify-between gap-4 items-baseline">
                          <span className="text-slate-900 dark:text-zinc-100 font-semibold">Grand Total:</span>
                          <div className="text-right">
                            <div className="font-bold text-slate-900 dark:text-zinc-100 text-base font-mono">
                              {formatMoney(statedGrandTotalNative)} {quoteNativeCurrency}
                            </div>
                            {isForeignQuote && (
                              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                                ({formatMoney(statedGrandTotalUsd)} USD)
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
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
                <Field label="Description" value={inv.description ?? "—"} />
                <Field label="Bill Date" value={formatDate(inv.paid_date || inv.invoice_date)} />
                <Field label="Date Arrived" value={formatDate(inv.due_date)} />
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

                <Field
                  label="GL Code"
                  value={
                    inv.items && inv.items.length > 1 ? (
                      <Badge variant="outline" className="bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-300 dark:border-zinc-700 text-xs font-normal">
                        Split ({inv.items.length} lines)
                      </Badge>
                    ) : (
                      formatGLCode(inv.gl_code || request.gl_code)
                    )
                  }
                />
                <Field label="Asset Flag" value={inv.asset_flag ? "Yes" : "No"} />

                {inv.items && inv.items.length > 0 && (
                  <div className="col-span-2 mt-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                    <div className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-2 flex items-center justify-between">
                      <span>Itemized GL Allocations ({inv.items.length} items)</span>
                    </div>
                    <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800 text-xs">
                      <div className="bg-slate-50 dark:bg-zinc-800/50 px-3 py-1.5 grid grid-cols-12 gap-2 font-medium text-slate-500">
                        <div className="col-span-5">Item</div>
                        <div className="col-span-2 text-right pr-6">Amount</div>
                        <div className="col-span-4 pl-4 border-l border-slate-200 dark:border-zinc-700">GL Code</div>
                        <div className="col-span-1 text-center">Asset</div>
                      </div>
                      {inv.items.map((it, idx) => (
                        <div key={idx} className="px-3 py-2 grid grid-cols-12 gap-2 items-center bg-white dark:bg-zinc-900">
                          <div className="col-span-5 break-words whitespace-normal leading-snug font-medium text-slate-800 dark:text-zinc-200" title={it.description}>
                            {it.sku ? <span className="font-mono text-indigo-600 dark:text-indigo-400 mr-1">[{it.sku}]</span> : null}{it.description}
                          </div>
                          <div className="col-span-2 text-right pr-6 font-mono font-medium text-slate-700 dark:text-zinc-300">
                            {formatMoney(it.amount)}
                          </div>
                          <div className="col-span-4 pl-4 border-l border-slate-100 dark:border-zinc-800">
                            {renderGLAccountBadge(it.gl_code)}
                          </div>
                          <div className="col-span-1 text-center">
                            {it.asset_flag ? <Badge variant="outline" className="text-[10px] px-1 py-0 bg-emerald-50 text-emerald-700 border-emerald-200">Asset</Badge> : "—"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {data?.wire_transfer && (
            <Card className="border border-slate-200 dark:border-zinc-800">
              <CardHeader className="bg-indigo-50/40 dark:bg-indigo-950/20 border-b border-slate-100 dark:border-zinc-800 px-6 py-3.5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-semibold text-base">
                  <Landmark className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Wire Transfer Details</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-semibold px-2.5 py-0.5 my-auto">
                    TREASURY RECORDED
                  </Badge>
                  {Boolean(
                    request.status === RequestStatus.Purchased ||
                    (request.status as string) === "ORDERED" ||
                    request.status === RequestStatus.WaitingPayment ||
                    (request.status as string) === "SENT_TO_AP"
                  ) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditWireOpen(true)}
                      className="h-7 text-xs px-2.5 bg-white dark:bg-zinc-900 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 dark:border-indigo-800 dark:text-indigo-300 gap-1.5 shadow-xs"
                    >
                      <Pencil className="h-3 w-3" />
                      <span>Edit Wire Info</span>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  <Field label="Entered By" value={data.wire_transfer.entered_by || "—"} />
                  <Field label="Entry Date" value={formatDate(data.wire_transfer.entry_date)} />
                  <Field label="Payment Date" value={formatDate(data.wire_transfer.payment_date)} />
                  <Field label="Due Date" value={formatDate(data.wire_transfer.due_date)} />
                  <Field label="Pay Date (Terms)" value={data.wire_transfer.pay_date || "—"} />
                  <Field label="Pay From" value={data.wire_transfer.pay_from || "—"} />
                  <Field label="Vendor" value={data.wire_transfer.vendor || "—"} />
                  <Field label="New Vendor?" value={data.wire_transfer.is_new_vendor ? "Yes" : "No"} />
                  <Field label="Invoice #" value={data.wire_transfer.invoice_number || "—"} />
                  <Field label="Amount" value={`${formatMoney(data.wire_transfer.amount || 0)} ${data.wire_transfer.currency || "USD"}`} />
                  <Field label="Conversion" value={data.wire_transfer.conversion_rate || "—"} />
                  <Field label="Vendor Email" value={data.wire_transfer.vendor_email || "—"} />
                  <Field label="Bank Name" value={data.wire_transfer.bank_name || "—"} />
                  <Field label="Bank Country" value={data.wire_transfer.bank_country || "—"} />
                  <Field label="Tax ID" value={data.wire_transfer.tax_id || "—"} />
                  <Field label="Bank Account #" value={data.wire_transfer.bank_account_number || "—"} />
                  <Field label="Routing (Wire)" value={data.wire_transfer.routing_wire || "—"} />
                  <Field label="Routing (ACH)" value={data.wire_transfer.routing_ach || "—"} />
                  <Field label="SWIFT Code" value={data.wire_transfer.swift_code || "—"} />
                  <Field label="BIC" value={data.wire_transfer.bic || "—"} />
                  <Field label="IBAN" value={data.wire_transfer.iban || "—"} />
                  <Field label="Sort Code" value={data.wire_transfer.sort_code || "—"} />
                  <Field label="Transit Code (CA)" value={data.wire_transfer.transit_code_ca || "—"} />
                  <Field label="Transit Number (CA)" value={data.wire_transfer.transit_number_ca || "—"} />
                  <Field label="Institution Code" value={data.wire_transfer.institution_code || "—"} />
                  <Field label="Branch Code" value={data.wire_transfer.branch_code || "—"} />
                  <Field label="BSB Australia" value={data.wire_transfer.bsb_australia || "—"} />
                  <Field label="Clearing Code" value={data.wire_transfer.clearing_code || "—"} />
                  <Field label="Bank Code" value={data.wire_transfer.bank_code || "—"} />
                  <Field label="ABA" value={data.wire_transfer.aba || "—"} />
                  <Field label="Region" value={data.wire_transfer.region || "—"} />
                  <Field label="Contact Name (China)" value={data.wire_transfer.contact_name_china || "—"} />
                  {data.wire_transfer.comments && (
                    <div className="col-span-2 sm:col-span-3">
                      <div className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Comments / Memo</div>
                      <div className="text-slate-800 dark:text-zinc-200 whitespace-pre-wrap">{data.wire_transfer.comments}</div>
                    </div>
                  )}
                  {data.wire_transfer.vendor_address && (
                    <div className="col-span-2 sm:col-span-3">
                      <div className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Vendor Address</div>
                      <div className="text-slate-800 dark:text-zinc-200 whitespace-pre-wrap">{data.wire_transfer.vendor_address}</div>
                    </div>
                  )}
                  {data.wire_transfer.bank_address && (
                    <div className="col-span-2 sm:col-span-3">
                      <div className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Bank Address</div>
                      <div className="text-slate-800 dark:text-zinc-200 whitespace-pre-wrap">{data.wire_transfer.bank_address}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Activity: approvals + notifications */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-6">

          <EditRequestDialog request={request} open={isEditOpen} onOpenChange={setIsEditOpen} />

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
                <TabsList className="h-8 p-0.5 bg-muted/60 w-full grid grid-cols-2">
                  <TabsTrigger value="approvals" className="text-xs px-2.5 h-7 gap-1.5 data-[state=active]:shadow-xs">
                    <Stamp className="h-3.5 w-3.5" />
                    <span>Approvals</span>
                    {approvals.length > 0 && (
                      <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                        {approvals.length}
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
                <TabsContent value="approvals" className="m-0 space-y-3">
                  {approvals.length === 0 ? (
                    <div className="py-4 text-center">
                      <div className="inline-flex p-2 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 mb-1.5">
                        <Stamp className="h-4 w-4" />
                      </div>
                      <p className="text-xs font-medium text-slate-600 dark:text-zinc-400">No approval activity yet</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Approval records will appear here once reviewed.
                      </p>
                    </div>
                  ) : (
                    approvals.map((a) => (
                      <div key={a.id} className="border-l-2 pl-3 border-slate-200 dark:border-zinc-700 py-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-xs sm:text-sm text-foreground">{a.approver}</span>
                          <Badge variant="outline" className={a.decision === "APPROVED" ? STATUS_BADGE.APPROVED : STATUS_BADGE.REJECTED}>
                            {a.decision}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{formatDate(a.approval_date)}</div>
                        {a.comment && (
                          <div className="text-xs text-slate-700 dark:text-zinc-300 mt-1 bg-muted/40 p-2 rounded border border-border/50">
                            {a.comment}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </TabsContent>

                {/* Attachments Tab */}
                <TabsContent value="attachments" className="m-0">
                  {(!data.attachments || data.attachments.length === 0) ? (
                    <div className="py-4 text-center">
                      <div className="inline-flex p-2 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 mb-1.5">
                        <Paperclip className="h-4 w-4" />
                      </div>
                      <p className="text-xs font-medium text-slate-600 dark:text-zinc-400">No attachments uploaded</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Uploaded quotes, documents, or files will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100 dark:divide-zinc-800/60">
                      {data.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-start justify-between gap-2.5 pt-2.5 first:pt-0 group hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 p-2 rounded-lg transition-colors"
                        >
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            <div className="p-1.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 shrink-0 mt-0.5">
                              <Paperclip className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-slate-900 dark:text-zinc-100 break-all whitespace-normal leading-snug" title={att.filename}>
                                {att.filename}
                              </p>
                              <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400 dark:text-zinc-500 flex-wrap">
                                {att.size ? <span>{(att.size / 1024).toFixed(1)} KB</span> : null}
                                {att.uploader_name ? (
                                  <>
                                    <span>•</span>
                                    <span className="font-medium text-slate-600 dark:text-zinc-400">By {att.uploader_name}</span>
                                  </>
                                ) : null}
                                {att.uploaded_at ? (
                                  <>
                                    <span>•</span>
                                    <span>{formatDateTime(att.uploaded_at)}</span>
                                  </>
                                ) : null}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 shrink-0 gap-1 cursor-pointer"
                            onClick={() => purchasingService.downloadAttachment(request.id, att.id, att.filename)}
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>


        </div>
      </div>

      {/* Action dialog */}
      <Dialog open={!!activeForm} onOpenChange={(open) => !open && setActiveForm(null)}>
        <DialogContent
          aria-describedby={undefined}
          className={
            activeForm?.kind === "invoice" || activeForm?.kind === "po"
              ? "w-[95vw] md:w-[80vw] max-w-[95vw] md:max-w-[80vw] max-h-[90vh] overflow-y-auto"
              : "sm:max-w-xl max-h-[90vh] overflow-y-auto"
          }
          style={
            activeForm?.kind === "invoice" || activeForm?.kind === "po"
              ? { width: "80vw", maxWidth: "80vw" }
              : undefined
          }
        >
          <DialogHeader>
            <DialogTitle>{activeForm ? ACTION_META[activeForm.action].label : ""}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {activeForm?.kind === "po" && (
              <>
                <TwoUp>
                  <FieldInput
                    label={
                      <span>
                        Quote / PO # <span className="text-red-500">*</span>
                      </span>
                    }
                    value={po.quote_number ?? ""}
                    onChange={(v) => setPo({ ...po, quote_number: v })}
                  />
                  <FieldInput
                    label={
                      <span>
                        Vendor <span className="text-red-500">*</span>
                      </span>
                    }
                    value={po.vendor}
                    onChange={(v) => setPo({ ...po, vendor: v })}
                  />
                </TwoUp>
                <TwoUp>
                  <FieldInput
                    label={
                      <span>
                        Item <span className="text-red-500">*</span>
                      </span>
                    }
                    value={po.item}
                    onChange={(v) => setPo({ ...po, item: v })}
                    placeholder={isMulti ? "Multiple Parts / Items" : "Product or Item name"}
                  />
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

                {!isMulti ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Quantity</label>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={String(po.quantity ?? 1)}
                        onChange={(e) => {
                          const q = Math.max(1, Number(e.target.value) || 1);
                          const itemsCost = Math.round(q * (po.unit_price || 0) * 100) / 100;
                          setPo({ ...po, quantity: q, amount: Math.round((itemsCost + poShippingFee) * 100) / 100 });
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Unit Price</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={String(po.unit_price ?? 0)}
                        onChange={(e) => {
                          const p = Math.max(0, Number(e.target.value) || 0);
                          const itemsCost = Math.round((po.quantity || 1) * p * 100) / 100;
                          setPo({ ...po, unit_price: p, amount: Math.round((itemsCost + poShippingFee) * 100) / 100 });
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium flex items-center gap-1">
                        <Truck className="h-3 w-3 text-indigo-500" />
                        <span>Shipping</span>
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={String(poShippingFee)}
                        onChange={(e) => {
                          const sf = Math.max(0, Number(e.target.value) || 0);
                          setPoShippingFee(sf);
                          const itemsCost = Math.round((po.quantity || 1) * (po.unit_price || 0) * 100) / 100;
                          setPo({ ...po, amount: Math.round((itemsCost + sf) * 100) / 100 });
                        }}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Total (Pre-Tax)</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={String(po.amount)}
                        onChange={(e) => {
                          const amt = Math.max(0, Number(e.target.value) || 0);
                          setPo({ ...po, amount: amt });
                        }}
                        className="font-mono bg-white dark:bg-zinc-900 font-semibold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Total (After-Tax)</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={String(Math.round(po.amount * (1 + TAX_RATE) * 100) / 100)}
                        onChange={(e) => {
                          const afterTax = Math.max(0, Number(e.target.value) || 0);
                          const preTax = Math.round((afterTax / (1 + TAX_RATE)) * 100) / 100;
                          setPo({ ...po, amount: preTax });
                        }}
                        className="font-semibold font-mono bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Currency</label>
                      <CurrencyAutocomplete value={po.currency ?? ""} onChange={(v) => setPo({ ...po, currency: v })} />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Items Subtotal</label>
                      <Input
                        type="number"
                        value={String(Math.round(poItems.reduce((acc, it) => acc + (Number(it.total) || 0), 0) * 100) / 100)}
                        disabled
                        className="font-mono bg-slate-50 dark:bg-zinc-800 text-slate-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium flex items-center gap-1">
                        <Truck className="h-3.5 w-3.5 text-indigo-500" />
                        <span>Shipping Fee</span>
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={String(poShippingFee)}
                        onChange={(e) => {
                          const sf = Math.max(0, Number(e.target.value) || 0);
                          setPoShippingFee(sf);
                          const itemsSum = poItems.reduce((acc, it) => acc + (Number(it.total) || 0), 0);
                          setPo((prev) => ({ ...prev, amount: Math.round((itemsSum + sf) * 100) / 100 }));
                        }}
                        className="font-mono bg-white dark:bg-zinc-900"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Total (Pre-Tax)</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={String(po.amount)}
                        onChange={(e) => {
                          const amt = Math.max(0, Number(e.target.value) || 0);
                          setPo({ ...po, amount: amt });
                        }}
                        className="font-mono bg-white dark:bg-zinc-900 font-semibold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Total (After-Tax)</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={String(Math.round(po.amount * (1 + TAX_RATE) * 100) / 100)}
                        onChange={(e) => {
                          const afterTax = Math.max(0, Number(e.target.value) || 0);
                          const preTax = Math.round((afterTax / (1 + TAX_RATE)) * 100) / 100;
                          setPo({ ...po, amount: preTax });
                        }}
                        className="font-semibold font-mono bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Currency</label>
                      <CurrencyAutocomplete value={po.currency ?? ""} onChange={(v) => setPo({ ...po, currency: v })} />
                    </div>
                  </div>
                )}

                {/* Multiple Parts Interactive Editable Table */}
                {isMulti && (
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        Line Items &amp; Parts Breakdown ({poItems.length})
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const next = [
                            ...poItems,
                            {
                              id: undefined,
                              sku: "",
                              description: `Part ${poItems.length + 1}`,
                              quantity: 1,
                              unit_price: 0,
                              total: 0,
                            },
                          ];
                          setPoItems(next);
                          const sum = next.reduce((acc, itm) => acc + (Number(itm.total) || 0), 0);
                          setPo((prev) => ({ ...prev, amount: Math.round(sum * 100) / 100 }));
                        }}
                        className="h-7 text-xs flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Part
                      </Button>
                    </div>

                    <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 dark:border-zinc-700 shadow-xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 uppercase text-[11px] font-semibold ">
                          <tr>
                            <th className="p-2 w-8 text-center text-slate-400">#</th>
                            <th className="p-2 w-24">SKU</th>
                            <th className="p-2">Description</th>
                            <th className="p-2 w-20 text-right">Qty</th>
                            <th className="p-2 w-24 text-right">Unit Price</th>
                            <th className="p-2 w-24 text-right">Total</th>
                            <th className="p-2 w-8 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                          {poItems.map((itm, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/50">
                              <td className="p-2 text-center font-mono text-slate-400">{idx + 1}</td>
                              <td className="p-2 w-24">
                                <Input
                                  value={itm.sku || ""}
                                  onChange={(e) => {
                                    const next = [...poItems];
                                    next[idx] = { ...next[idx], sku: e.target.value };
                                    setPoItems(next);
                                  }}
                                  placeholder="SKU / Part #"
                                  className="h-7 text-xs font-mono"
                                />
                              </td>
                              <td className="p-2">
                                <Input
                                  value={itm.description}
                                  onChange={(e) => {
                                    const next = [...poItems];
                                    next[idx] = { ...next[idx], description: e.target.value };
                                    setPoItems(next);
                                  }}
                                  placeholder="Part description..."
                                  className="h-7 text-xs font-medium"
                                />
                              </td>
                              <td className="p-2 w-20">
                                <Input
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={itm.quantity}
                                  onChange={(e) => {
                                    const q = Math.max(1, Number(e.target.value) || 1);
                                    const next = [...poItems];
                                    const tot = Math.round(q * Number(next[idx].unit_price || 0) * 100) / 100;
                                    next[idx] = { ...next[idx], quantity: q, total: tot };
                                    setPoItems(next);
                                    const sum = next.reduce((acc, it) => acc + (Number(it.total) || 0), 0);
                                    setPo((prev) => ({ ...prev, amount: Math.round(sum * 100) / 100 }));
                                  }}
                                  className="h-7 text-xs text-right"
                                />
                              </td>
                              <td className="p-2 w-24">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={itm.unit_price}
                                  onChange={(e) => {
                                    const p = Math.max(0, Number(e.target.value) || 0);
                                    const next = [...poItems];
                                    const tot = Math.round(Number(next[idx].quantity || 1) * p * 100) / 100;
                                    next[idx] = { ...next[idx], unit_price: p, total: tot };
                                    setPoItems(next);
                                    const sum = next.reduce((acc, it) => acc + (Number(it.total) || 0), 0);
                                    setPo((prev) => ({ ...prev, amount: Math.round(sum * 100) / 100 }));
                                  }}
                                  className="h-7 text-xs text-right font-mono"
                                />
                              </td>
                              <td className="p-2 w-24 text-right font-mono font-semibold text-slate-800 dark:text-zinc-200">
                                {formatMoney(itm.total || 0)}
                              </td>
                              <td className="p-2 text-center w-8">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                                  onClick={() => {
                                    const next = poItems.filter((_, i) => i !== idx);
                                    setPoItems(next);
                                    const sum = next.reduce((acc, it) => acc + (Number(it.total) || 0), 0);
                                    setPo((prev) => ({ ...prev, amount: Math.round(sum * 100) / 100 }));
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                          {poItems.length === 0 && (
                            <tr>
                              <td colSpan={6} className="text-center py-4 text-slate-400 text-xs">
                                No line items added. Click &quot;Add Part&quot; above to add part lines.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

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
                  <FieldInput
                    label={
                      <span>
                        Vendor <span className="text-red-500">*</span>
                      </span>
                    }
                    value={invoice.vendor}
                    onChange={(v) => setInvoice({ ...invoice, vendor: v })}
                  />
                  <FieldInput
                    label={
                      <span>
                        Price / Amount <span className="text-red-500">*</span>
                      </span>
                    }
                    type="number"
                    value={String(invoice.amount)}
                    onChange={(v) => setInvoice({ ...invoice, amount: Number(v) })}
                  />
                </TwoUp>

                <TwoUp>
                  <FieldInput
                    label={
                      <span>
                        Bill Date <span className="text-red-500">*</span>
                      </span>
                    }
                    type="date"
                    value={invoice.invoice_date}
                    onChange={(v) => setInvoice({ ...invoice, invoice_date: v })}
                  />
                  {request.request_type !== "RECURRING" ? (
                    <FieldInput label="Date Arrived" type="date" value={invoice.due_date ?? ""} onChange={(v) => setInvoice({ ...invoice, due_date: v })} />
                  ) : (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Asset Flag</label>
                      <div className="flex items-center h-10">
                        <input type="checkbox" className="h-4 w-4" checked={invoice.asset_flag || false} onChange={(e) => setInvoice({ ...invoice, asset_flag: e.target.checked })} />
                        <span className="ml-2 text-sm text-slate-700">Mark as Asset</span>
                      </div>
                    </div>
                  )}
                </TwoUp>

                {invoiceItems.length > 1 ? (
                  <div className="space-y-3 pt-1">
                    <div className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/50 p-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                          Default GL Code / Account
                        </label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs px-2.5 font-medium border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800"
                          onClick={() => {
                            if (invoice.gl_code?.trim()) {
                              setInvoiceItems(prev => prev.map(item => ({ ...item, gl_code: invoice.gl_code || "" })));
                              toast.success("Applied GL Code to all line items");
                            } else {
                              toast.error("Select a GL code above first");
                            }
                          }}
                        >
                          Apply to All Lines
                        </Button>
                      </div>
                      <GLCodeAutocomplete
                        value={invoice.gl_code || ""}
                        onChange={(v) => {
                          setInvoice(prev => ({ ...prev, gl_code: v }));
                        }}
                        placeholder="Select GL code to apply to lines..."
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                          Line Items GL Allocation ({invoiceItems.length} items) <span className="text-rose-500">*</span>
                        </span>
                        <span className="text-xs text-slate-500">GL Code is required for all items</span>
                      </div>
                      <div className="border border-slate-200 dark:border-zinc-800 rounded-lg divide-y divide-slate-200 dark:divide-zinc-800 text-xs shadow-xs bg-white dark:bg-zinc-900">
                        <div className="bg-slate-100/80 dark:bg-zinc-800/70 px-3 py-2.5 grid grid-cols-12 gap-3 font-semibold text-slate-700 dark:text-zinc-300">
                          <div className="col-span-5">Item / Description</div>
                          <div className="col-span-2 text-right pr-6">Amount</div>
                          <div className="col-span-4 pl-4 border-l border-slate-200 dark:border-zinc-700">GL Code *</div>
                          <div className="col-span-1 text-center">Asset</div>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                          {invoiceItems.map((itm, idx) => (
                            <div key={idx} className="px-3 py-2.5 grid grid-cols-12 gap-3 items-center hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                              <div className="col-span-5 pr-1">
                                <div className="font-medium text-slate-900 dark:text-zinc-100 break-words whitespace-normal leading-snug" title={itm.description}>
                                  {itm.sku ? <span className="font-mono text-indigo-600 dark:text-indigo-400 mr-1">[{itm.sku}]</span> : null}{itm.description}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5">Qty: {itm.quantity}</div>
                              </div>
                              <div className="col-span-2 text-right pr-6 font-mono font-semibold text-slate-800 dark:text-zinc-200">
                                {formatMoney(itm.amount)}
                              </div>
                              <div className="col-span-4 pl-4 border-l border-slate-100 dark:border-zinc-800">
                                <GLCodeAutocomplete
                                  value={itm.gl_code || ""}
                                  onChange={(v) => {
                                    setInvoiceItems(prev => {
                                      const updated = [...prev];
                                      updated[idx] = { ...updated[idx], gl_code: v };
                                      return updated;
                                    });
                                  }}
                                  placeholder="Select GL code *"
                                />
                              </div>
                              <div className="col-span-1 flex justify-center">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                  checked={itm.asset_flag || false}
                                  onChange={(e) => {
                                    setInvoiceItems(prev => {
                                      const updated = [...prev];
                                      updated[idx] = { ...updated[idx], asset_flag: e.target.checked };
                                      return updated;
                                    });
                                  }}
                                  title="Mark as Asset"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="bg-slate-50/80 dark:bg-zinc-900/90 px-3 py-2.5 flex items-center justify-between text-xs">
                          <span className="text-slate-600 dark:text-zinc-400">
                            Lines Total: <strong className="font-mono text-slate-900 dark:text-zinc-100 text-sm ml-1">{formatMoney(invoiceItems.reduce((s, it) => s + (Number(it.amount) || 0), 0))}</strong>
                          </span>
                          <span className="text-slate-600 dark:text-zinc-400">
                            Invoice Amount: <strong className="font-mono text-slate-900 dark:text-zinc-100 text-sm ml-1">{formatMoney(invoice.amount)}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <TwoUp>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        GL Code / Account <span className="text-rose-500">*</span>
                      </label>
                      <GLCodeAutocomplete
                        value={invoice.gl_code ?? data?.purchase_order?.gl_code ?? data?.request.gl_code ?? ""}
                        onChange={(v) => setInvoice({ ...invoice, gl_code: v })}
                        placeholder="Select GL Code *"
                      />
                    </div>
                    {request.request_type !== "RECURRING" && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Asset Flag</label>
                        <div className="flex items-center h-10">
                          <input type="checkbox" className="h-4 w-4" checked={invoice.asset_flag || false} onChange={(e) => setInvoice({ ...invoice, asset_flag: e.target.checked })} />
                          <span className="ml-2 text-sm text-slate-700">Mark as Asset</span>
                        </div>
                      </div>
                    )}
                  </TwoUp>
                )}

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
                  <label className="text-sm font-medium">{activeForm.action === "REJECT" ? "Reviewer / Approver" : "Approver"}</label>
                  <Select
                    value={user?.id || approval.approver || "_current_user"}
                    disabled
                  >
                    <SelectTrigger className="w-full bg-muted/50 cursor-not-allowed opacity-80">
                      <SelectValue>
                        {user?.full_name || user?.email || "Logged in User"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={user?.id || "_current_user"}>
                        {user?.full_name || user?.email || "Logged in User"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{activeForm.action === "REJECT" ? "Rejection Reason / Comments" : "Comment"}</label>
                  <Textarea
                    placeholder={activeForm.action === "REJECT" ? "Please provide a reason for rejecting this request..." : "Add an optional comment..."}
                    value={approval.comment ?? ""}
                    onChange={(e) => setApproval({ ...approval, comment: e.target.value })}
                    rows={3}
                  />
                </div>
              </>
            )}
            {activeForm?.kind === "tracking" && (
              <>
                <FieldInput
                  label={
                    <span>
                      Tracking Number <span className="text-red-500">*</span>
                    </span>
                  }
                  value={tracking.tracking_number}
                  onChange={(v) => setTracking({ ...tracking, tracking_number: v })}
                />
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
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Are you sure you want to confirm goods received?</p>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Description / Notes <span className="text-muted-foreground text-xs font-normal">(Optional)</span>
                  </label>
                  <Textarea
                    rows={3}
                    placeholder="Add optional notes (e.g. packages received, item condition, storage location)..."
                    value={confirmGoods.description}
                    onChange={(e) => setConfirmGoods({ description: e.target.value })}
                  />
                </div>
              </div>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveForm(null)}>Cancel</Button>
            <Button
              onClick={submitForm}
              disabled={transition.isPending}
              variant={activeForm?.action === "REJECT" ? "destructive" : "default"}
              className={activeForm?.action === "REJECT" ? "bg-rose-600 hover:bg-rose-700 text-white font-semibold" : ""}
            >
              {activeForm?.action === "REJECT" ? "Confirm Rejection" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

function Field({ label, value }: { label: string; value: React.ReactNode }) {
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
  placeholder,
}: {
  label: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <Input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
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
