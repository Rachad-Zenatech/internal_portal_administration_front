import { useGLCodes } from "@/hooks/usePurchasing";
import {
  renderBankAccountBadge as renderBankAccountBadgeUtil,
  renderCategoryBadge as renderCategoryBadgeUtil,
  renderPaymentMethodBadge,
  parseGLAccount,
  isBankAccountOption,
  mapPaymentMethodToBankAccount,
} from "@/utils/glAccountUtils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BankAccountAutocomplete } from "./BankAccountAutocomplete";
import { CategoryAutocomplete } from "./CategoryAutocomplete";
import DepartmentAutocomplete from "./DepartmentAutocomplete";
import LocationAutocomplete from "./LocationAutocomplete";
import { PaymentMethodSelect } from "./PaymentMethodSelect";
import { ManualPriceDialog } from "./ManualPriceDialog";
import { ProjectAutocomplete } from "./ProjectAutocomplete";
import { updateRequest } from "@/services/purchasingService";
import { CurrencyAutocomplete } from "./CurrencyAutocomplete";
import { VendorAutocomplete } from "./VendorAutocomplete";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
  Upload,
  X,
  AlertTriangle,
  ChevronDown,
  Building2,
  FolderKanban,
  CheckCircle2,
  Truck,
  Plus,
  Pencil,
  Trash2,
  Download,
  Landmark,
  Calendar,
  CalendarClock,
  ShieldAlert,
  DollarSign,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { formatRemainingDuration, FREQUENCY_LABELS, type FrequencyType } from "./recurringScheduleUtils";
import { ScheduleBreakdownModal } from "./ScheduleBreakdownModal";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  usePurchaseRequest,
  useTransitionRequest,
  useUploadAttachments,
  useUpdateReviewStatus,
  useUpdateWireTransfer,
} from "@/hooks/usePurchasing";
import * as purchasingService from "@/services/purchasingService";
import { EditCombinedRequestDialog } from "./EditCombinedRequestDialog";
import { WireTransferDialog } from "./WireTransferDialog";
import { useAuth } from "@/lib/AuthContext";
import Stepper from "@/components/Stepper";
import { RequestStatus } from "@/types/purchasing";
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
} from "@/types/purchasing";


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
  TAX_RATE,
} from "./purchasingMeta";

type FormKind = "po" | "invoice" | "approval" | "tracking" | "confirmGoods" | "hold" | "complete";

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: glCodes = [] } = useGLCodes();



  const renderBankAccount = (val: string | null | undefined) => {
    return renderBankAccountBadgeUtil(val, glCodes);
  };

  const renderCategory = (val: string | null | undefined) => {
    return renderCategoryBadgeUtil(val, glCodes);
  };
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = usePurchaseRequest(id);
  const [isManualPriceOpen, setIsManualPriceOpen] = useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [quickProjectValue, setQuickProjectValue] = useState("");
  const [isWireDialogOpen, setIsWireDialogOpen] = useState(false);

  const isDraft =
    data?.request?.status === RequestStatus.Initial ||
    (data?.request?.status as any) === "INITIAL" ||
    (data?.request?.status as any) === "Draft";

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


  const { user, roles: userRoles = [], workflow_roles = [], hasRole } = useAuth();

  const [isScheduleLedgerOpen, setIsScheduleLedgerOpen] = useState(false);
  const [activeForm, setActiveForm] = useState<{ action: WorkflowAction; kind: FormKind } | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [poItems, setPoItems] = useState<any[]>([]);
  const [poShippingFee, setPoShippingFee] = useState<number>(0);
  const [poItemCurrency, setPoItemCurrency] = useState<string>("USD");
  const [poFxRate, setPoFxRate] = useState<number>(1.0);
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
  const [invoice, setInvoice] = useState<InvoiceInput>({
    vendor: "",
    amount: 0,
    invoice_date: "",
    due_date: "",
    gl_code: "",
    bank_account: "",
    asset_flag: false,
    department: "",
    from_location: "",
  });
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
  const [activeDetailTab, setActiveDetailTab] = useState<string>("overview");

  useEffect(() => {
    if (user?.id) {
      setApproval(prev => ({ ...prev, approver: user.id }));
    }
  }, [user]);

  const isScheduledPayment =
    data?.request?.request_type === "SCHEDULED_PAYMENT" ||
    (data?.request?.request_type === "RECURRING" && Boolean(data?.request?.recurring_schedule?.is_scheduled || data?.request?.recurring_schedule?.frequency === "CUSTOM"));
  const isRecurring =
    data?.request?.request_type === "RECURRING" ||
    data?.request?.request_type === "SCHEDULED_PAYMENT";
  const isAPRequest = data?.request?.request_type === "ACCOUNTS_PAYABLE";
  const backUrl = isRecurring ? "/purchasing/recurring" : "/purchasing/requests";
  const backLabel = isScheduledPayment ? "Scheduled Payments" : (isRecurring ? "Recurring Payments" : "Purchase Requests");

  useEffect(() => {
    if (data?.request) {
      if (isRecurring) {
        document.dispatchEvent(
          new CustomEvent("set-breadcrumb-trail", {
            detail: {
              path: `/purchasing/requests/${data.request.id}`,
              items: [
                { title: "Purchasing" },
                { title: isScheduledPayment ? "Scheduled Payments" : "Recurring Payments", path: "/purchasing/recurring" },
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

  const hasItemsTab = Boolean((data?.request?.items && data.request.items.length > 0) || (data?.request?.quote_data?.items && data.request.quote_data.items.length > 0));
  const hasPoTab = Boolean(data?.purchase_order);
  const hasInvoiceTab = Boolean(data?.invoice);
  const hasWireTab = Boolean(data?.wire_transfer);
  const hasRecurringTab = Boolean(isRecurring);

  useEffect(() => {
    if (activeDetailTab === "items" && !hasItemsTab) setActiveDetailTab("overview");
    if (activeDetailTab === "po" && !hasPoTab) setActiveDetailTab("overview");
    if (activeDetailTab === "invoice" && !hasInvoiceTab) setActiveDetailTab("overview");
    if (activeDetailTab === "wire" && !hasWireTab) setActiveDetailTab("overview");
    if (activeDetailTab === "recurring" && !hasRecurringTab) setActiveDetailTab("overview");
  }, [activeDetailTab, hasItemsTab, hasPoTab, hasInvoiceTab, hasWireTab, hasRecurringTab]);

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
  const pmStr = String((request as any)?.payment_method || data?.purchase_order?.payment_method || "");
  const isCC = pmStr === "CC" || pmStr.includes("(Credit Card)") || pmStr.toLowerCase().includes("credit");
  let flow = SPEND_FLOW;
  if (request.request_type === "ADMIN") flow = ADMIN_FLOW;
  else if (request.request_type === "ACCOUNTS_PAYABLE") flow = ACCOUNTS_PAYABLE_FLOW;
  else if (request.request_type === "RECURRING") flow = RECURRING_FLOW;
  else if (request.request_type === "QUOTE") flow = QUOTE_FLOW;

  if (isCC && flow === SPEND_FLOW) {
    flow = flow.filter(st => st !== RequestStatus.WaitingPayment);
  }

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
    const poPm = String(purchase_order?.payment_method || "");
    const isWire =
      poPm === "W" ||
      poPm === "WIRE" ||
      poPm.toLowerCase().includes("wire");
    if (action === "MARK_PURCHASED" && isWire) {
      setIsWireDialogOpen(true);
      return;
    }

    const meta = ACTION_META[action];
    if (action === "COMPLETE") {
      // If it is a scheduled recurring payment, bypass period picker dialog since time range and dates are predetermined
      if (isRecurring) {
        if (request.recurring_schedule?.is_scheduled) {
          void dispatch({ action });
          return;
        }
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
        gl_code: itm.gl_code || purchase_order?.gl_code || request.gl_code || "",
        asset_flag: isDefaultAsset,
      }));

      const isRecurringReq = request.request_type === 'RECURRING';
      const completedInstallments = request.recurring_schedule?.completed_installments || 0;
      const currentCycleDate = request.recurring_schedule?.schedule_dates?.[completedInstallments];
      const cycleAmount = currentCycleDate?.amount != null && Number(currentCycleDate.amount) > 0
        ? Number(currentCycleDate.amount)
        : (request.recurring_schedule?.amount_per_cycle != null && Number(request.recurring_schedule.amount_per_cycle) > 0
            ? Number(request.recurring_schedule.amount_per_cycle)
            : (purchase_order?.amount ?? request.unit_price ?? request.amount ?? 0));

      const defaultInvoiceAmount = isRecurringReq
        ? cycleAmount
        : (purchase_order?.amount ?? request.amount ?? request.unit_price ?? 0);

      setInvoiceItems(prefilledItems);
      setInvoice({
        vendor: defaultVendor,
        amount: defaultInvoiceAmount,
        invoice_date: new Date().toISOString().split("T")[0],
        due_date: "",
        gl_code: purchase_order?.gl_code || request.gl_code || "",
        bank_account: mapPaymentMethodToBankAccount(purchase_order?.payment_method || (request as any)?.payment_method, glCodes) || "",
        asset_flag: isDefaultAsset,
        department: "",
        from_location: "",
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

      const quoteCurr = (
        request.quote_data?.conversion?.original_currency ||
        request.quote_data?.currency ||
        (request.items && request.items[0]?.original_currency) ||
        request.currency ||
        "USD"
      ).toUpperCase();
      const quoteConv = request.quote_data?.conversion;
      const isForeign = Boolean(quoteConv?.is_converted) || (quoteCurr !== "USD");
      const fxRate = (isForeign && Number(quoteConv?.exchange_rate)) ? Number(quoteConv.exchange_rate) : 1.0;

      setPoItemCurrency(isForeign ? quoteCurr : "USD");
      setPoFxRate(fxRate);

      const parsedPoItems = rawItems.map((i: any, idx: number) => {
        const q = Number(i.quantity) || 1;
        const p = Number(i.original_unit_price ?? i.unit_price ?? 0);
        const t = Number(i.original_total ?? i.total ?? (Math.round(q * p * 100) / 100));
        return {
          id: i.id,
          sku: i.sku || "",
          description: i.description || `Part ${idx + 1}`,
          quantity: q,
          unit_price: p,
          total: t,
        };
      });
      setPoItems(parsedPoItems);

      const initShipping = Number(request.quote_data?.conversion?.original_shipping ?? request.quote_data?.totals?.shipping) || 0;
      setPoShippingFee(initShipping);

      const itemsSumNative = parsedPoItems.reduce((acc: number, it: any) => acc + (Number(it.total) || 0), 0);
      const isMultiReq = request.item_mode === "MULTIPLE" || parsedPoItems.length > 0;

      // Totals ALWAYS show USD. Foreign items sum and shipping immediately convert to USD:
      const totalNative = isMultiReq
        ? (itemsSumNative + initShipping)
        : (Number(request.quantity ?? 1) * Number(parsedPoItems[0]?.unit_price ?? request.unit_price ?? 0) + initShipping);

      const usdAmount = isForeign
        ? (request.amount && Math.abs(Number(request.amount) - (totalNative * fxRate)) < 1 ? Number(request.amount) : Math.round(totalNative * fxRate * 100) / 100)
        : Math.round(totalNative * 100) / 100;

      const singleUnitPrice = isMultiReq
        ? 0
        : (parsedPoItems[0]?.unit_price ? parsedPoItems[0].unit_price : (request.unit_price ?? 0));

      setPo({
        vendor: quoteVendor || (info && isUsable(info.vendor) ? info.vendor : ""),
        item: isMultiReq ? (parsedPoItems.length ? `Multi Parts (${parsedPoItems.length} parts)` : (request.title || "Multi Parts")) : (request.title || (info && isUsable(info.name) ? info.name : "")),
        quantity: isMultiReq ? (parsedPoItems.length || 1) : (request.quantity ?? 1),
        unit_price: singleUnitPrice,
        amount: usdAmount,
        quote_number: quoteNum || "",
        description: (info && isUsable(info.description) ? info.description : (request.description || "")),
        currency: "USD",
        payment_method: undefined,
        shipped_to_location: "",
        expected_delivery_date: "",
      });
    }
    if (meta.form === "approval") {
      const effectiveAmount = Number(data?.request?.amount || data?.purchase_order?.amount || data?.invoice?.amount || 0);
      const isLevel1 = (data?.request?.current_approval_level || 1) === 1;
      const defaultPassToL2 = action === "APPROVE" && isLevel1 && effectiveAmount >= 10000;
      setApproval({ approver: user?.id || "", comment: "", pass_to_level_2: defaultPassToL2 });
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
      void dispatch({ action, purchase_order: { ...po, amount: Number(po.amount) || 0, quantity: Number(po.quantity) || 1, unit_price: Number(po.unit_price) || 0, currency: po.currency || "USD", items: poItems } });
    } else if (kind === "invoice") {
      if (!invoice.vendor || !invoice.invoice_date) return toast.error("Vendor and bill date are required.");
      if (!invoice.department || !invoice.department.trim()) return toast.error("Class is required.");
      if (!invoice.from_location || !invoice.from_location.trim()) return toast.error("From Location is required.");

      const isMulti = invoiceItems.length > 1;
      if (isMulti) {
        const missingCategory = invoiceItems.some(it => !it.gl_code || !it.gl_code.trim());
        if (missingCategory) {
          return toast.error("Category is required for all line items.");
        }
      } else {
        if (!invoice.gl_code || !invoice.gl_code.trim()) {
          return toast.error("Category is required.");
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
            department: invoice.department?.trim() || undefined,
            from_location: invoice.from_location?.trim() || undefined,
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

  const recalculatePoUsdTotal = (items: any[], shippingFeeNative: number, rate: number) => {
    const sumNative = items.reduce((acc, it) => acc + (Number(it.total) || 0), 0);
    const subtotalUsd = Math.round(sumNative * rate * 100) / 100;
    const shippingUsd = Math.round(shippingFeeNative * rate * 100) / 100;
    const totalUsd = Math.round((subtotalUsd + shippingUsd) * 100) / 100;
    return { sumNative, subtotalUsd, shippingUsd, totalUsd };
  };

  const handlePoItemCurrencyChange = async (newCurr: string) => {
    const targetCurr = (newCurr || "USD").toUpperCase();
    setPoItemCurrency(targetCurr);
    if (targetCurr === "USD") {
      setPoFxRate(1.0);
      const { totalUsd } = recalculatePoUsdTotal(poItems, poShippingFee, 1.0);
      setPo((prev) => ({ ...prev, amount: totalUsd, currency: "USD" }));
      return;
    }

    try {
      let rate = 1.0;
      if (targetCurr === quoteNativeCurrency && quoteExchangeRate > 0) {
        rate = quoteExchangeRate;
      } else {
        const res = await purchasingService.getExchangeRate(targetCurr, "USD");
        rate = Number(res?.exchange_rate) || 1.0;
      }
      setPoFxRate(rate);

      const { totalUsd } = recalculatePoUsdTotal(poItems, poShippingFee, rate);
      setPo((prev) => ({ ...prev, amount: totalUsd, currency: "USD" }));
      toast.info(`Item currency: ${targetCurr} (Rate: 1 ${targetCurr} = $${rate.toFixed(4)} USD)`);
    } catch (err: any) {
      toast.error(`Failed to fetch exchange rate for ${targetCurr}: ${err?.message || "Unknown error"}`);
    }
  };

  const isReviewed = request.review_status === "REVIEWED";

  const quoteNativeCurrency = (
    request.quote_data?.conversion?.original_currency ||
    request.quote_data?.currency ||
    (request.items && request.items[0]?.original_currency) ||
    request.currency ||
    "USD"
  ).toUpperCase();
  const quoteExchangeRate = Number(request.quote_data?.conversion?.exchange_rate) || 1.0;
  const isForeignQuote = Boolean(
    (request.quote_data?.conversion?.is_converted && quoteNativeCurrency !== "USD") ||
    (quoteNativeCurrency !== "USD")
  );

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

  const isEditableStatus =
    request.status !== RequestStatus.Completed &&
    (request.status as string) !== "COMPLETED" &&
    request.status !== RequestStatus.Rejected &&
    (request.status as string) !== "REJECTED";

  // Role checks for PURCHASING, AP, MANAGER, EXECUTIVE, and SUPER ADMIN (plus ADMIN)
  const isPurchasing = Boolean(
    workflow_roles.includes("PURCHASING") ||
    workflow_roles.includes("PURCHASER") ||
    hasRole?.("PURCHASING") ||
    hasRole?.("PURCHASER") ||
    hasRole?.("BUYER") ||
    userRoles.some((r) => {
      const c = (r.code || "").toUpperCase();
      const n = (r.name || "").toUpperCase();
      return c === "PURCHASING" || c === "PURCHASER" || c.includes("PURCHAS") || n === "PURCHASING" || n.includes("PURCHAS");
    }) ||
    user?.department?.toUpperCase().includes("PURCHAS")
  );

  const isAPRole = Boolean(
    workflow_roles.includes("AP") ||
    workflow_roles.includes("ACCOUNTS_PAYABLE") ||
    workflow_roles.includes("ACCTS_PAY") ||
    hasRole?.("AP") ||
    hasRole?.("ACCTS_PAY") ||
    hasRole?.("ACCOUNTS_PAYABLE") ||
    userRoles.some((r) => {
      const c = (r.code || "").toUpperCase();
      const n = (r.name || "").toUpperCase();
      return c === "AP" || c === "ACCTS_PAY" || c.includes("AP") || n === "AP" || n.includes("ACCOUNTS PAYABLE");
    }) ||
    user?.department?.toUpperCase().includes("ACCOUNT") ||
    user?.department?.toUpperCase().includes("AP")
  );

  const isManager = Boolean(
    workflow_roles.includes("MANAGER") ||
    hasRole?.("MANAGER") ||
    userRoles.some((r) => {
      const c = (r.code || "").toUpperCase();
      const n = (r.name || "").toUpperCase();
      return c === "MANAGER" || c.includes("MANAGER") || n === "MANAGER" || n.includes("MANAGER");
    })
  );

  const isExecutive = Boolean(
    workflow_roles.includes("EXECUTIVE") ||
    workflow_roles.includes("EXEC") ||
    hasRole?.("EXECUTIVE") ||
    hasRole?.("EXEC") ||
    userRoles.some((r) => {
      const c = (r.code || "").toUpperCase();
      const n = (r.name || "").toUpperCase();
      return c === "EXECUTIVE" || c === "EXEC" || c.includes("EXEC") || n === "EXECUTIVE" || n.includes("EXECUTIVE");
    })
  );

  const isSuperAdmin = Boolean(
    user?.is_super_admin ||
    workflow_roles.includes("SUPER_ADMIN") ||
    workflow_roles.includes("SUPER ADMIN") ||
    workflow_roles.includes("SUPERADMIN") ||
    hasRole?.("SUPER_ADMIN") ||
    hasRole?.("SUPER ADMIN") ||
    hasRole?.("SUPERADMIN") ||
    userRoles.some((r) => {
      const c = (r.code || "").toUpperCase();
      const n = (r.name || "").toUpperCase();
      return c === "SUPER_ADMIN" || c === "SUPER ADMIN" || c.includes("SUPER_ADMIN") || n === "SUPER ADMIN" || n.includes("SUPER ADMIN");
    })
  );

  const isAdmin = Boolean(
    isSuperAdmin ||
    workflow_roles.includes("ADMIN") ||
    workflow_roles.includes("ADMINISTRATOR") ||
    hasRole?.("ADMIN") ||
    hasRole?.("ADMINISTRATOR") ||
    userRoles.some((r) => {
      const c = (r.code || "").toUpperCase();
      const n = (r.name || "").toUpperCase();
      return c === "ADMIN" || c.includes("ADMIN") || n === "ADMIN" || n.includes("ADMIN");
    })
  );

  const isPrivilegedPurchasingRole = isPurchasing || isAPRole || isManager || isExecutive || isAdmin || isSuperAdmin;

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

  const isUnderReview = request.status === RequestStatus.UnderReview || (request.status as string) === "UNDER_REVIEW";
  const canEditRequest = isEditableStatus && (
    isPrivilegedPurchasingRole ||
    isAssigned ||
    (isUnderReview ? false : isRequester)
  );
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
              disabled={transition.isPending}
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

            {/* Project / Group Project Badge */}
            {request.project_name ? (
              <Badge
                variant="outline"
                className="font-medium gap-1.5 shadow-xs shrink-0 py-0.5 px-2.5 bg-indigo-50/80 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
                onClick={() => navigate(`/purchasing/requests?project=${encodeURIComponent(request.project_name!)}`)}
                title={`View all requests in project: ${request.project_name} (click to filter)`}
              >
                <FolderKanban className="h-3.5 w-3.5 text-indigo-500" />
                <span>Project: <strong className="text-indigo-900 dark:text-indigo-100">{request.project_name}</strong></span>
              </Badge>
            ) : canEditRequest ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuickProjectValue("");
                  setIsProjectDialogOpen(true);
                }}
                className="h-6 text-[11px] px-2 gap-1 border-dashed border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950/50"
                title="Assign this purchase request to a project"
              >
                <FolderKanban className="h-3 w-3 text-indigo-500" />
                <span>+ Add to Project</span>
              </Button>
            ) : null}

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
            if ((isRecurring || isAPRequest) && a === "CREATE_PO") return false;
            return true;
          }).length > 0 && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Action:</span>
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
                  if ((isRecurring || isAPRequest) && a === "CREATE_PO") return false;
                  return true;
                })
                .map((action) => {
                  const meta = ACTION_META[action];
                  const isRecordInvoiceDisabled = isRecurring && action === "RECORD_INVOICE" && !isReviewed;
                  const isDisabled = transition.isPending || isRecordInvoiceDisabled;
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

          {isSelfApprovalBlocked && available_actions.filter(a => a !== "DELETE_REQUEST" && !((isRecurring || isAPRequest) && a === "CREATE_PO")).length === 0 && (
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
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          <Tabs value={activeDetailTab} onValueChange={setActiveDetailTab} className="w-full space-y-4">
            <div className="border-b border-slate-200 dark:border-zinc-800 pb-1">
              <TabsList className="h-auto p-1 bg-slate-100/90 dark:bg-zinc-800/90 rounded-lg flex flex-wrap items-center gap-1 w-full sm:w-auto justify-start">
                <TabsTrigger
                  value="overview"
                  className="text-xs px-3.5 h-8 gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs font-medium"
                >
                  <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Request Overview</span>
                </TabsTrigger>

                {hasItemsTab && (
                  <TabsTrigger
                    value="items"
                    className="text-xs px-3.5 h-8 gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs font-medium"
                  >
                    <Package className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Line Items &amp; Quotes</span>
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {request.items?.length || request.quote_data?.items?.length || 0}
                    </span>
                  </TabsTrigger>
                )}

                {hasPoTab && (
                  <TabsTrigger
                    value="po"
                    className="text-xs px-3.5 h-8 gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs font-medium"
                  >
                    <Truck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Purchase Order</span>
                    {purchase_order?.id && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        #{purchase_order.id}
                      </span>
                    )}
                  </TabsTrigger>
                )}

                {hasInvoiceTab && (
                  <TabsTrigger
                    value="invoice"
                    className="text-xs px-3.5 h-8 gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs font-medium"
                  >
                    <ReceiptText className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Invoice &amp; Bill</span>
                    {inv?.paid_date ? (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Paid
                      </span>
                    ) : inv?.payment_status ? (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        {PAYMENT_LABEL[inv.payment_status] || inv.payment_status}
                      </span>
                    ) : null}
                  </TabsTrigger>
                )}

                {hasWireTab && (
                  <TabsTrigger
                    value="wire"
                    className="text-xs px-3.5 h-8 gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs font-medium"
                  >
                    <Landmark className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Wire Transfer</span>
                  </TabsTrigger>
                )}

                {hasRecurringTab && (
                  <TabsTrigger
                    value="recurring"
                    className="text-xs px-3.5 h-8 gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs font-medium"
                  >
                    <CalendarClock className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                    <span>{isScheduledPayment ? "Milestones" : "Recurring Horizon"}</span>
                    {request.recurring_schedule?.completed_installments !== undefined && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300">
                        {request.recurring_schedule.completed_installments}/{request.recurring_schedule.total_installments || (request.recurring_schedule.schedule_dates?.length || 24)}
                      </span>
                    )}
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-sm">
                    <Field label="Requester" value={`${request.requester || "Unknown"}${request.department ? ` (${request.department})` : ""}`} />
                    <AssignedUsersField label="Assigned To" value={request.assigned_user ?? "—"} />
                    <Field
                      label="Group Project"
                      value={
                        request.project_name ? (
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className="text-xs bg-indigo-50/80 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/60"
                              onClick={() => navigate(`/purchasing/requests?project=${encodeURIComponent(request.project_name!)}`)}
                              title={`View all requests in project: ${request.project_name}`}
                            >
                              <FolderKanban className="h-3 w-3 mr-1 text-indigo-500" />
                              {request.project_name}
                            </Badge>
                            {canEditRequest && (
                              <button
                                type="button"
                                onClick={() => {
                                  setQuickProjectValue(request.project_name || "");
                                  setIsProjectDialogOpen(true);
                                }}
                                className="text-[11px] text-indigo-600 hover:underline dark:text-indigo-400"
                              >
                                Change
                              </button>
                            )}
                          </div>
                        ) : canEditRequest ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setQuickProjectValue("");
                              setIsProjectDialogOpen(true);
                            }}
                            className="h-6 px-1.5 text-xs text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40 gap-1 font-normal"
                          >
                            <FolderKanban className="h-3 w-3" />
                            <span>+ Add to Project</span>
                          </Button>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )
                      }
                    />

                    <Field label="Requested Date" value={formatDate(request.request_date)} />
                    <Field label="Last Updated" value={formatDate(request.updated_at)} />
                    {isRecurring && (
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
                  </div>

                  {/* Financial & Accounting Section */}
                  <div className="pt-4 border-t border-slate-100 dark:border-zinc-800">
                    <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                      Accounting &amp; Payment Details
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-sm">
                      {!isRecurring && (
                        isMulti ? (
                          <div>
                            <div className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Category</div>
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
                          <Field label="Category" value={renderCategory(request.gl_code || data?.purchase_order?.gl_code || data?.invoice?.gl_code)} />
                        )
                      )}

                      <Field
                        label="Payment Method"
                        value={
                          (data?.purchase_order?.payment_method || (request as any)?.payment_method)
                            ? renderPaymentMethodBadge(data?.purchase_order?.payment_method || (request as any)?.payment_method)
                            : "—"
                        }
                      />

                      <Field
                        label="Bank Account"
                        value={renderBankAccount(
                          data?.invoice?.bank_account ||
                          (request as any)?.bank_account ||
                          (purchase_order as any)?.bank_account ||
                          (isBankAccountOption(parseGLAccount(request.gl_code, glCodes)) ? request.gl_code : null) ||
                          (isBankAccountOption(parseGLAccount(data?.purchase_order?.gl_code, glCodes)) ? data?.purchase_order?.gl_code : null) ||
                          mapPaymentMethodToBankAccount(data?.purchase_order?.payment_method || (request as any)?.payment_method, glCodes)
                        )}
                      />

                      {/* Financial Totals for Single Items */}
                      {!isRecurring && !(request.item_mode === "MULTIPLE" || (request.items && request.items.length > 0)) && (
                        <>
                          {!isRecurring && <Field label="SKU / Part #" value={request.sku || request.items?.[0]?.sku || "—"} />}
                          {!isRecurring && <Field label="Quantity" value={String(request.quantity ?? 1)} />}
                          <Field
                            label={isRecurring ? "Amount / Cycle" : "Unit Price"}
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

                      {isScheduledPayment ? (
                        <>
                          <Field
                            label="Active Milestone Amount"
                            value={
                              <span className="font-semibold text-slate-900 dark:text-zinc-100">
                                {formatMoney(
                                  request.recurring_schedule?.schedule_dates?.[request.recurring_schedule?.completed_installments || 0]?.amount ||
                                  request.recurring_schedule?.amount_per_cycle ||
                                  request.amount ||
                                  0
                                )} {request.currency || "USD"}
                              </span>
                            }
                          />
                          <Field
                            label="Total Contract Commitment"
                            value={
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {formatMoney(
                                  request.recurring_schedule?.total_amount ||
                                  (request.recurring_schedule?.schedule_dates && request.recurring_schedule.schedule_dates.length > 0
                                    ? request.recurring_schedule.schedule_dates.reduce((s: number, it: any) => s + (Number(it.amount) || 0), 0)
                                    : (request.recurring_schedule?.total_installments
                                        ? (request.recurring_schedule.amount_per_cycle || request.amount || 0) * request.recurring_schedule.total_installments
                                        : (request.amount || 0)))
                                )} {request.currency || "USD"}
                              </span>
                            }
                          />
                          <Field
                            label="Milestone Progress"
                            value={
                              <span className="font-medium text-slate-700 dark:text-zinc-300">
                                Installment {(request.recurring_schedule?.completed_installments || 0) + 1} of {request.recurring_schedule?.total_installments || request.recurring_schedule?.schedule_dates?.length || 1}
                              </span>
                            }
                          />
                        </>
                      ) : isRecurring ? (
                        <>
                          <Field
                            label="Cycle Amount"
                            value={
                              <span className="font-semibold text-slate-900 dark:text-zinc-100">
                                {formatMoney(
                                  request.recurring_schedule?.amount_per_cycle ||
                                  request.amount ||
                                  0
                                )} {request.currency || "USD"}
                              </span>
                            }
                          />
                          <Field
                            label="Cadence & Frequency"
                            value={
                              <span className="font-medium text-slate-700 dark:text-zinc-300">
                                {FREQUENCY_LABELS[(request.recurring_schedule?.frequency as FrequencyType) || "MONTHLY"] || "Monthly"}
                              </span>
                            }
                          />
                          <Field
                            label="Total Commitment"
                            value={
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {formatMoney(
                                  request.recurring_schedule?.total_amount ||
                                  ((request.recurring_schedule?.amount_per_cycle || request.amount || 0) * (request.recurring_schedule?.total_installments || 24))
                                )} {request.currency || "USD"}
                              </span>
                            }
                          />
                        </>
                      ) : (
                        <>
                          <Field
                            label="Total"
                            value={
                              <span className="font-semibold text-slate-900 dark:text-zinc-100">
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
                            label="Total (After-Tax · 13% HST)"
                            value={
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {formatMoney((request.amount ?? 0) * (1 + TAX_RATE))} {request.currency || "USD"}
                                {hasCrawledForeignPrice && (
                                  <span className="text-slate-500 text-xs ml-1.5 font-normal">
                                    ({formatMoney(crawledOrigPrice! * (Number(request.quantity) || 1) * (1 + TAX_RATE))} {crawledOrigCurr})
                                  </span>
                                )}
                              </span>
                            }
                          />
                        </>
                      )}

                      <Field label="Currency" value={request.currency || "USD"} />
                    </div>
                  </div>

                  {/* Dedicated Recurring Contract & Schedule Horizon Card */}
                  {isRecurring && (
                    <Card className="border border-indigo-200/90 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/50 via-white to-sky-50/30 dark:from-indigo-950/20 dark:via-zinc-900/40 dark:to-zinc-900 shadow-sm overflow-hidden">
                      <CardHeader className="pb-3 border-b border-indigo-100/80 dark:border-indigo-950/60">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-950 dark:text-indigo-200">
                            <CalendarClock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            Scheduled Range &amp; Payment Horizon
                          </CardTitle>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-2.5 font-semibold text-indigo-700 bg-white hover:bg-indigo-50 dark:bg-zinc-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 shadow-2xs"
                            onClick={() => setIsScheduleLedgerOpen(true)}
                          >
                            <Calendar className="h-3.5 w-3.5 mr-1" />
                            Open Installment Ledger
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="p-3 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 shadow-2xs">
                            <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Scheduled Horizon</div>
                            <div className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1">
                              {formatDate(request.recurring_schedule?.start_date || request.due_date || request.request_date)}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <span>to</span>
                              <strong className="text-slate-800 dark:text-zinc-200">
                                {request.recurring_schedule?.end_date ? formatDate(request.recurring_schedule.end_date) : "Ongoing"}
                              </strong>
                            </div>
                          </div>

                          <div className="p-3 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 shadow-2xs">
                            <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Remaining Duration</div>
                            <div className="mt-1">
                              <Badge variant="outline" className="bg-indigo-100/80 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold border-indigo-300 text-xs">
                                {request.recurring_schedule?.frequency === 'CUSTOM' || Boolean(request.recurring_schedule?.schedule_dates?.length) ? `${request.recurring_schedule?.total_installments || request.recurring_schedule?.schedule_dates?.length || 0} Milestone Dates` : formatRemainingDuration(request.recurring_schedule?.end_date, request.recurring_schedule?.start_date || request.due_date).text}
                              </Badge>
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-1">
                              {FREQUENCY_LABELS[(request.recurring_schedule?.frequency as FrequencyType) || "MONTHLY"] || "Monthly"} ({formatMoney(request.recurring_schedule?.amount_per_cycle || request.amount || 0)} / cycle)
                            </div>
                          </div>

                          <div className="p-3 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 shadow-2xs">
                            <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Cycle Progress</div>
                            <div className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1">
                              {request.recurring_schedule?.total_installments 
                                ? `${request.recurring_schedule?.completed_installments || 0} / ${request.recurring_schedule?.total_installments} Cycles` 
                                : `${request.recurring_schedule?.completed_installments || 0} Cycles Settled (Ongoing)`}
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                              <div
                                className="bg-indigo-600 h-full rounded-full transition-all"
                                style={{
                                  width: request.recurring_schedule?.total_installments 
                                    ? `${Math.min(100, Math.round(((request.recurring_schedule?.completed_installments || 0) / request.recurring_schedule?.total_installments) * 100))}%`
                                    : ((request.recurring_schedule?.completed_installments || 0) > 0 ? "100%" : "0%")
                                }}
                              />
                            </div>
                          </div>

                          <div className="p-3 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 shadow-2xs">
                            <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                              {request.recurring_schedule?.total_amount || request.recurring_schedule?.total_installments ? "Total Commitment" : "Cycle Commitment"}
                            </div>
                            <div className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1">
                              {request.recurring_schedule?.total_amount 
                                ? formatMoney(request.recurring_schedule.total_amount) 
                                : request.recurring_schedule?.total_installments 
                                ? formatMoney((request.recurring_schedule?.amount_per_cycle || request.amount || 0) * request.recurring_schedule.total_installments) 
                                : `${formatMoney(request.recurring_schedule?.amount_per_cycle || request.amount || 0)} / cycle`}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

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
                  {(request.item_url || purchase_order?.item_url) && (
                    <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-3">
                      <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                        Vendor Listing &amp; Product Extraction
                      </div>
                      <div className="flex flex-col gap-3">
                        <a
                          href={(request.item_url || purchase_order?.item_url || "").startsWith("http") ? (request.item_url || purchase_order?.item_url || "#") : `https://${request.item_url || purchase_order?.item_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={request.item_url || purchase_order?.item_url || undefined}
                          className="inline-flex max-w-full items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 transition-colors self-start"
                        >
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          <span className="min-w-0 truncate">Open Vendor Product Page</span>
                        </a>

                        {!isDraft && request.product_info && (
                          <Card className="border-indigo-100 bg-indigo-50/50 dark:border-indigo-900/50 dark:bg-indigo-950/20 shadow-sm">
                            <CardHeader className="py-2.5 px-4 border-b border-indigo-100 dark:border-indigo-900/50">
                              <CardTitle className="text-sm font-semibold flex items-center justify-between text-indigo-900 dark:text-indigo-100">
                                <div className="flex items-center gap-2">
                                  <Package className="h-4 w-4 text-indigo-600" />
                                  <span>Extracted Product Information</span>
                                </div>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                              <div className="sm:col-span-2">
                                <div className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mb-0.5">Product Name</div>
                                <div className="font-medium text-slate-900 dark:text-slate-100">{request.product_info.name}</div>
                              </div>
                              <div>
                                <div className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mb-0.5">Price</div>
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
                                <div className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mb-0.5">Brand</div>
                                <div className="text-slate-700 dark:text-slate-300">{request.product_info.brand}</div>
                              </div>
                              <div>
                                <div className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mb-0.5">Vendor</div>
                                <div className="text-slate-700 dark:text-slate-300">{request.product_info.vendor}</div>
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mb-0.5">Category</div>
                                <Badge variant="outline" className="bg-white dark:bg-zinc-900 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 max-w-full truncate inline-block" title={request.product_info.category}>{request.product_info.category}</Badge>
                              </div>
                              {request.product_info.description && request.product_info.description !== "N/A" && (
                                <div className="sm:col-span-2">
                                  <div className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mb-0.5">Description</div>
                                  <div className="text-slate-600 dark:text-slate-400 leading-relaxed text-xs">{request.product_info.description}</div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: Line Items & Quotes Breakdown */}
            {hasItemsTab && (
              <TabsContent value="items" className="m-0 focus-visible:outline-none space-y-6">
                <Card className="border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-b from-indigo-50/20 to-transparent shadow-sm">
                  <CardHeader className="pb-3 border-b border-indigo-100 dark:border-indigo-900/40">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-indigo-950 dark:text-indigo-200">
                        <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        <span className="font-semibold text-base">Items &amp; Parts Breakdown ({(request.items?.length || request.quote_data?.items?.length || 0)})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 font-mono text-xs font-semibold">
                          {isForeignQuote
                            ? `Currency: ${quoteNativeCurrency} (Converted @ 1 ${quoteNativeCurrency} = $${quoteExchangeRate} USD)`
                            : `Currency: ${quoteNativeCurrency || request.currency || "USD"}`}
                        </Badge>
                      </div>
                    </div>

                    {/* Company & Quote Metadata (if present) */}
                    {(vendorCompanyName || customerCompanyName || request.quote_data?.quote_number || request.quote_data?.quote_date) && (
                      <div className="text-xs text-slate-600 dark:text-zinc-400 flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 border-t border-indigo-100/60 dark:border-indigo-900/30 mt-1">
                        {vendorCompanyName && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            <strong>Vendor:</strong>
                            <span className="font-medium text-slate-900 dark:text-zinc-100">{vendorCompanyName}</span>
                          </span>
                        )}
                        {customerCompanyName && (
                          <span><strong>Bill To:</strong> {customerCompanyName}</span>
                        )}
                        {request.quote_data?.quote_number && (
                          <span><strong>Quote Ref:</strong> <span className="font-mono font-medium text-slate-800 dark:text-zinc-200">{request.quote_data.quote_number}</span></span>
                        )}
                        {request.quote_data?.quote_date && (
                          <span><strong>Date:</strong> {request.quote_data.quote_date}</span>
                        )}
                        {request.quote_data?.valid_until && (
                          <span><strong>Valid Until:</strong> {request.quote_data.valid_until}</span>
                        )}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="rounded-lg border border-slate-200 dark:border-zinc-800 overflow-hidden">
                      <Table>
                        <TableHeader className="bg-slate-50 dark:bg-zinc-800/60">
                          <TableRow>
                            <TableHead className="w-10 text-center text-xs">#</TableHead>
                            <TableHead className="w-24 text-xs font-semibold">SKU / Part #</TableHead>
                            <TableHead className="text-xs font-semibold">Description</TableHead>
                            <TableHead className="w-16 text-right text-xs font-semibold">Qty</TableHead>
                            <TableHead className="w-28 text-right text-xs font-semibold">Unit Price ({quoteNativeCurrency})</TableHead>
                            <TableHead className="w-28 text-right text-xs font-semibold pr-6">Total ({quoteNativeCurrency})</TableHead>
                            <TableHead className="w-48 text-xs font-semibold pl-4 border-l border-slate-200 dark:border-zinc-700">Category</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(request.items?.length ? request.items : (request.quote_data?.items || [])).map((itm: any, idx: number) => {
                            const rawPrice = Number(itm.original_unit_price ?? itm.unit_price ?? 0);
                            const rawTot = Number(itm.original_total ?? itm.total ?? (rawPrice * (Number(itm.quantity) || 1)));
                            const convPrice = Number(itm.converted_unit_price ?? (rawPrice * quoteExchangeRate));
                            const convTot = Number(itm.converted_total ?? (rawTot * quoteExchangeRate));

                            return (
                              <TableRow key={itm.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30">
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
                                  {renderCategory(getItemGLCode(itm, idx))}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Totals Breakdown and Math Matching */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-zinc-800">
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
                              Discrepancy: Calculated sum is {formatMoney(calculatedQuoteTotalNative)} {quoteNativeCurrency} vs stated {formatMoney(statedGrandTotalNative)} {quoteNativeCurrency}
                            </span>
                          </div>
                        )}
                      </div>

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
                  </CardContent>
                </Card>
              </TabsContent>
            )}

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
            {hasInvoiceTab && inv && (
              <TabsContent value="invoice" className="m-0 focus-visible:outline-none space-y-6">
                <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm">
                  <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/30">
                    <CardTitle className="text-base font-semibold flex items-center justify-between text-slate-900 dark:text-zinc-100">
                      <div className="flex items-center gap-2">
                        <ReceiptText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <span>Invoice &amp; Bill · {inv.id}</span>
                      </div>
                      <Badge variant="outline" className={inv.paid_date ? STATUS_BADGE.COMPLETED : PAYMENT_BADGE[inv.payment_status]}>
                        {inv.paid_date ? `Settled · ${formatDate(inv.paid_date)}` : (PAYMENT_LABEL[inv.payment_status] || inv.payment_status)}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-sm">
                      <Field label="Vendor" value={inv.vendor} />
                      <Field label="Amount" value={formatMoney(inv.amount)} />
                      <Field label="Bill Date" value={formatDate(inv.paid_date || inv.invoice_date)} />
                      <Field label="Due Date / Date Arrived" value={formatDate(inv.due_date)} />
                      <Field
                        label="Bank Account"
                        value={renderBankAccount(inv.bank_account)}
                      />
                      <Field
                        label="Category"
                        value={
                          inv.items && inv.items.length > 1 ? (
                            <Badge variant="outline" className="bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-300 dark:border-zinc-700 text-xs font-normal">
                              Split ({inv.items.length} lines)
                            </Badge>
                          ) : (
                            renderCategory(inv.gl_code)
                          )
                        }
                      />
                      <Field label="Class (Department)" value={inv.department || "—"} />
                      <Field label="From Location" value={inv.from_location || "—"} />
                      <Field label="Asset Flag" value={inv.asset_flag ? "Yes" : "No"} />
                    </div>

                    {inv.description && (
                      <div className="pt-3 border-t border-slate-100 dark:border-zinc-800">
                        <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Description</div>
                        <div className="text-sm text-slate-800 dark:text-zinc-200 whitespace-pre-wrap">{inv.description}</div>
                      </div>
                    )}

                    {inv.items && inv.items.length > 0 && (
                      <div className="mt-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                        <div className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-2 flex items-center justify-between">
                          <span>Itemized Category Allocations ({inv.items.length} items)</span>
                        </div>
                        <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800 text-xs">
                          <div className="bg-slate-50 dark:bg-zinc-800/50 px-3 py-1.5 grid grid-cols-12 gap-2 font-medium text-slate-500">
                            <div className="col-span-5">Item</div>
                            <div className="col-span-2 text-right pr-6">Amount</div>
                            <div className="col-span-4 pl-4 border-l border-slate-200 dark:border-zinc-700">Category</div>
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
                                {renderCategory(it.gl_code)}
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
              </TabsContent>
            )}

            {/* TAB 5: Wire Transfer */}
            {hasWireTab && data?.wire_transfer && (
              <TabsContent value="wire" className="m-0 focus-visible:outline-none space-y-6">
                <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm">
                  <CardHeader className="bg-indigo-50/40 dark:bg-indigo-950/20 border-b border-slate-100 dark:border-zinc-800 px-6 py-3.5 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-semibold text-base">
                      <Landmark className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>Wire Transfer Details</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      {Boolean(
                        request.request_type === "ACCOUNTS_PAYABLE" ||
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
                  <CardContent className="p-5 space-y-4">
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
                      <Field
                        label="Conversion Rate"
                        value={
                          data.wire_transfer.conversion_rate
                            ? `${data.wire_transfer.conversion_rate}${
                                data.wire_transfer.currency &&
                                data.wire_transfer.currency.toUpperCase() !== "USD" &&
                                parseFloat(data.wire_transfer.conversion_rate) > 0
                                  ? ` (≈ $${(
                                      Number(data.wire_transfer.amount || 0) *
                                      parseFloat(data.wire_transfer.conversion_rate)
                                    ).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD)`
                                  : ""
                              }`
                            : (data.wire_transfer.currency || "USD").toUpperCase() === "USD"
                            ? "1.00 (USD)"
                            : "—"
                        }
                      />
                      <Field label="Vendor Email" value={data.wire_transfer.vendor_email || "—"} />
                      <Field label="Bank Name" value={data.wire_transfer.bank_name || "—"} />
                      <Field label="Bank Country" value={data.wire_transfer.bank_country || "—"} />
                      <Field label="Tax ID" value={data.wire_transfer.tax_id || "—"} />
                      <Field
                        label="Bank Account #"
                        value={
                          data.wire_transfer.bank_account_number
                            ? data.wire_transfer.bank_account_number.trim().length > 4
                              ? `•••• •••• ${data.wire_transfer.bank_account_number.trim().slice(-4)}`
                              : data.wire_transfer.bank_account_number
                            : "—"
                        }
                      />
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
              </TabsContent>
            )}

            {/* TAB 6: Recurring Horizon */}
            {hasRecurringTab && (
              <TabsContent value="recurring" className="m-0 focus-visible:outline-none space-y-6">
                <Card className="border border-indigo-200/90 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/50 via-white to-sky-50/30 dark:from-indigo-950/20 dark:via-zinc-900/40 dark:to-zinc-900 shadow-sm overflow-hidden">
                  <CardHeader className="pb-3 border-b border-indigo-100/80 dark:border-indigo-950/60">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-950 dark:text-indigo-200">
                        <CalendarClock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        {isScheduledPayment ? "Scheduled Milestone Payments & Horizon" : "Recurring Payment & Subscription Horizon"}
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-2.5 font-semibold text-indigo-700 bg-white hover:bg-indigo-50 dark:bg-zinc-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 shadow-2xs"
                        onClick={() => setIsScheduleLedgerOpen(true)}
                      >
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        {isScheduledPayment ? "Open Milestone Ledger" : "Open Installment Ledger"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 shadow-2xs">
                        <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                          {isScheduledPayment ? "Milestone Span" : "Scheduled Horizon"}
                        </div>
                        <div className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1">
                          {formatDate(request.recurring_schedule?.start_date || request.due_date || request.request_date)}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <span>to</span>
                          <strong className="text-slate-800 dark:text-zinc-200">
                            {request.recurring_schedule?.end_date ? formatDate(request.recurring_schedule.end_date) : "Ongoing (2 Yrs)"}
                          </strong>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 shadow-2xs">
                        <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                          {isScheduledPayment ? "Milestone Plan" : "Duration & Cadence"}
                        </div>
                        <div className="mt-1">
                          <Badge variant="outline" className="bg-indigo-100/80 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold border-indigo-300 text-xs">
                            {request.recurring_schedule?.frequency === 'CUSTOM' || Boolean(request.recurring_schedule?.schedule_dates?.length) ? `${request.recurring_schedule?.total_installments || request.recurring_schedule?.schedule_dates?.length || 0} Milestone Dates` : formatRemainingDuration(request.recurring_schedule?.end_date, request.recurring_schedule?.start_date || request.due_date).text}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1">
                          {FREQUENCY_LABELS[(request.recurring_schedule?.frequency as FrequencyType) || "MONTHLY"] || "Monthly"} ({formatMoney(request.recurring_schedule?.amount_per_cycle || request.amount || 0)} / cycle)
                        </div>
                      </div>

                      <div className="p-3 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 shadow-2xs">
                        <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                          {isScheduledPayment ? "Milestones Settled" : "Cycle Progress"}
                        </div>
                        <div className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1">
                          {request.recurring_schedule?.completed_installments || 0} / {request.recurring_schedule?.total_installments || request.recurring_schedule?.schedule_dates?.length || 24} {isScheduledPayment ? "Milestones" : "Cycles"}
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, Math.round(((request.recurring_schedule?.completed_installments || 0) / (request.recurring_schedule?.total_installments || request.recurring_schedule?.schedule_dates?.length || 24)) * 100))}%`
                            }}
                          />
                        </div>
                      </div>

                      <div className="p-3 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 shadow-2xs">
                        <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                          {isScheduledPayment ? "Contract Commitment" : "Total Commitment"}
                        </div>
                        <div className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1">
                          {formatMoney(
                            request.recurring_schedule?.total_amount ||
                            (request.recurring_schedule?.schedule_dates && request.recurring_schedule.schedule_dates.length > 0
                              ? request.recurring_schedule.schedule_dates.reduce((s: number, it: any) => s + (Number(it.amount) || 0), 0)
                              : ((request.recurring_schedule?.amount_per_cycle || request.amount || 0) * (request.recurring_schedule?.total_installments || 24)))
                          )}
                        </div>
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                          {formatMoney(
                            request.recurring_schedule?.schedule_dates && request.recurring_schedule.schedule_dates.length > 0
                              ? request.recurring_schedule.schedule_dates.slice(0, request.recurring_schedule.completed_installments || 0).reduce((s: number, it: any) => s + (Number(it.amount) || 0), 0)
                              : (request.recurring_schedule?.amount_per_cycle || request.amount || 0) * (request.recurring_schedule?.completed_installments || 0)
                          )} paid to date
                        </div>
                      </div>
                    </div>

                    {/* If custom milestone schedule dates are defined, render an inline preview table */}
                    {isScheduledPayment && request.recurring_schedule?.schedule_dates && request.recurring_schedule.schedule_dates.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-indigo-100/60 dark:border-indigo-950/40">
                        <div className="text-xs font-semibold text-indigo-900 dark:text-indigo-200 mb-2 flex items-center justify-between">
                          <span>Milestone Installment Ledger ({request.recurring_schedule.schedule_dates.length} Milestones)</span>
                          <span className="text-[11px] font-normal text-muted-foreground">
                            Cycle {(request.recurring_schedule.completed_installments || 0) + 1} Active
                          </span>
                        </div>
                        <div className="border border-indigo-100/80 dark:border-indigo-950/60 rounded-lg overflow-hidden divide-y divide-indigo-50 dark:divide-zinc-800 text-xs">
                          <div className="bg-indigo-50/60 dark:bg-zinc-800/60 px-3 py-1.5 grid grid-cols-12 gap-2 font-semibold text-indigo-900 dark:text-indigo-200">
                            <div className="col-span-1">#</div>
                            <div className="col-span-3">Target Date</div>
                            <div className="col-span-5">Milestone / Description</div>
                            <div className="col-span-3 text-right">Amount</div>
                          </div>
                          {request.recurring_schedule.schedule_dates.map((m: any, idx: number) => {
                            const completedCount = request.recurring_schedule?.completed_installments || 0;
                            const isPaid = idx < completedCount;
                            const isCurrent = idx === completedCount;
                            return (
                              <div
                                key={idx}
                                className={`px-3 py-2 grid grid-cols-12 gap-2 items-center transition-colors ${
                                  isPaid
                                    ? "bg-emerald-50/40 dark:bg-emerald-950/10 text-muted-foreground"
                                    : isCurrent
                                    ? "bg-amber-50/70 dark:bg-amber-950/30 font-medium text-amber-950 dark:text-amber-200"
                                    : "bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200"
                                }`}
                              >
                                <div className="col-span-1 flex items-center gap-1">
                                  {isPaid ? (
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                                  ) : isCurrent ? (
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0 animate-ping" />
                                  ) : (
                                    <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-zinc-600 shrink-0" />
                                  )}
                                  <span>{idx + 1}</span>
                                </div>
                                <div className="col-span-3 font-mono">{formatDate(m.date)}</div>
                                <div className="col-span-5 truncate" title={m.note || `Milestone #${idx + 1}`}>
                                  {m.note || `Milestone #${idx + 1}`}
                                  {isPaid && <span className="ml-1.5 text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">(Settled)</span>}
                                  {isCurrent && <span className="ml-1.5 text-[10px] text-amber-700 dark:text-amber-300 font-bold">(Active Next)</span>}
                                </div>
                                <div className="col-span-3 text-right font-mono font-semibold">
                                  {formatMoney(m.amount != null ? m.amount : request.recurring_schedule?.amount_per_cycle || request.amount || 0)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Activity: approvals + notifications */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-6">

          <EditCombinedRequestDialog open={isEditOpen} onOpenChange={setIsEditOpen} data={data} refetch={refetch} />

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
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Vendor <span className="text-red-500">*</span>
                    </label>
                    <VendorAutocomplete
                      value={po.vendor}
                      onChange={(v) => setPo({ ...po, vendor: v })}
                      placeholder="Search or enter vendor name..."
                    />
                  </div>
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
                    <PaymentMethodSelect
                      value={po.payment_method}
                      onChange={(v) => setPo({ ...po, payment_method: v })}
                    />
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
                          const itemsCostNative = Math.round(q * (po.unit_price || 0) * 100) / 100;
                          const totalUsd = Math.round((itemsCostNative * poFxRate + poShippingFee * poFxRate) * 100) / 100;
                          setPo((prev) => ({ ...prev, quantity: q, amount: totalUsd, currency: "USD" }));
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Unit Price ({poItemCurrency})</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={String(po.unit_price ?? 0)}
                        onChange={(e) => {
                          const p = Math.max(0, Number(e.target.value) || 0);
                          const itemsCostNative = Math.round((po.quantity || 1) * p * 100) / 100;
                          const totalUsd = Math.round((itemsCostNative * poFxRate + poShippingFee * poFxRate) * 100) / 100;
                          setPo((prev) => ({ ...prev, unit_price: p, amount: totalUsd, currency: "USD" }));
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium flex items-center gap-1">
                        <Truck className="h-3 w-3 text-indigo-500" />
                        <span>Shipping ({poItemCurrency})</span>
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={String(poShippingFee)}
                        onChange={(e) => {
                          const sf = Math.max(0, Number(e.target.value) || 0);
                          setPoShippingFee(sf);
                          const itemsCostNative = Math.round((po.quantity || 1) * (po.unit_price || 0) * 100) / 100;
                          const totalUsd = Math.round((itemsCostNative * poFxRate + sf * poFxRate) * 100) / 100;
                          setPo((prev) => ({ ...prev, amount: totalUsd, currency: "USD" }));
                        }}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Total Pre-Tax (USD)</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={String(po.amount)}
                        onChange={(e) => {
                          const amt = Math.max(0, Number(e.target.value) || 0);
                          setPo((prev) => ({ ...prev, amount: amt, currency: "USD" }));
                        }}
                        className="font-mono bg-white dark:bg-zinc-900 font-semibold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Total After-Tax (USD)</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={String(Math.round(po.amount * (1 + TAX_RATE) * 100) / 100)}
                        onChange={(e) => {
                          const afterTax = Math.max(0, Number(e.target.value) || 0);
                          const preTax = Math.round((afterTax / (1 + TAX_RATE)) * 100) / 100;
                          setPo((prev) => ({ ...prev, amount: preTax, currency: "USD" }));
                        }}
                        className="font-semibold font-mono bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Item Currency</label>
                      <CurrencyAutocomplete value={poItemCurrency} onChange={handlePoItemCurrencyChange} />
                    </div>
                    {poItemCurrency && poItemCurrency !== "USD" && (
                      <div className="col-span-full mt-1 p-2 bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-lg flex items-center justify-between text-xs text-blue-900 dark:text-blue-200">
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span>
                            <strong>FX Rate Conversion:</strong> 1 {poItemCurrency} = ${poFxRate.toFixed(6)} USD via CurrencyConverter
                          </span>
                        </div>
                        <span className="text-[11px] text-blue-700 dark:text-blue-300 font-medium">
                          Item prices in {poItemCurrency} automatically convert to USD totals
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium">Items Subtotal (USD)</label>
                        {poItemCurrency !== "USD" && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {poItems.reduce((acc, it) => acc + (Number(it.total) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} {poItemCurrency}
                          </span>
                        )}
                      </div>
                      <Input
                        type="text"
                        value={`$${(Math.round(poItems.reduce((acc, it) => acc + (Number(it.total) || 0), 0) * poFxRate * 100) / 100).toFixed(2)}`}
                        disabled
                        className="font-mono bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium flex items-center gap-1">
                          <Truck className="h-3.5 w-3.5 text-indigo-500" />
                          <span>Shipping Fee {poItemCurrency !== "USD" ? `(${poItemCurrency})` : "(USD)"}</span>
                        </label>
                        {poItemCurrency !== "USD" && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            ≈ ${(poShippingFee * poFxRate).toFixed(2)} USD
                          </span>
                        )}
                      </div>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={String(poShippingFee)}
                        onChange={(e) => {
                          const sf = Math.max(0, Number(e.target.value) || 0);
                          setPoShippingFee(sf);
                          const { totalUsd } = recalculatePoUsdTotal(poItems, sf, poFxRate);
                          setPo((prev) => ({ ...prev, amount: totalUsd, currency: "USD" }));
                        }}
                        className="font-mono bg-white dark:bg-zinc-900"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Total Pre-Tax (USD)</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={String(po.amount)}
                        onChange={(e) => {
                          const amt = Math.max(0, Number(e.target.value) || 0);
                          setPo((prev) => ({ ...prev, amount: amt, currency: "USD" }));
                        }}
                        className="font-mono bg-white dark:bg-zinc-900 font-semibold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Total After-Tax (USD)</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={String(Math.round(po.amount * (1 + TAX_RATE) * 100) / 100)}
                        onChange={(e) => {
                          const afterTax = Math.max(0, Number(e.target.value) || 0);
                          const preTax = Math.round((afterTax / (1 + TAX_RATE)) * 100) / 100;
                          setPo((prev) => ({ ...prev, amount: preTax, currency: "USD" }));
                        }}
                        className="font-semibold font-mono bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Item Currency</label>
                      <CurrencyAutocomplete value={poItemCurrency} onChange={handlePoItemCurrencyChange} />
                    </div>
                    {poItemCurrency && poItemCurrency !== "USD" && (
                      <div className="col-span-full mt-1 p-2 bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-lg flex items-center justify-between text-xs text-blue-900 dark:text-blue-200">
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span>
                            <strong>FX Rate Conversion:</strong> 1 {poItemCurrency} = ${poFxRate.toFixed(6)} USD via CurrencyConverter
                          </span>
                        </div>
                        <span className="text-[11px] text-blue-700 dark:text-blue-300 font-medium">
                          Table items in {poItemCurrency} automatically convert to USD totals
                        </span>
                      </div>
                    )}
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
                          const { totalUsd } = recalculatePoUsdTotal(next, poShippingFee, poFxRate);
                          setPo((prev) => ({ ...prev, amount: totalUsd, currency: "USD" }));
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
                            <th className="p-2 w-28 text-right">Unit Price ({poItemCurrency})</th>
                            <th className="p-2 w-32 text-right">Total ({poItemCurrency})</th>
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
                                    const { totalUsd } = recalculatePoUsdTotal(next, poShippingFee, poFxRate);
                                    setPo((prev) => ({ ...prev, amount: totalUsd, currency: "USD" }));
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
                                    const { totalUsd } = recalculatePoUsdTotal(next, poShippingFee, poFxRate);
                                    setPo((prev) => ({ ...prev, amount: totalUsd, currency: "USD" }));
                                  }}
                                  className="h-7 text-xs text-right font-mono"
                                />
                              </td>
                              <td className="p-2 w-32 text-right font-mono font-semibold text-slate-800 dark:text-zinc-200">
                                <div>{formatMoney(itm.total || 0, poItemCurrency)}</div>
                                {poItemCurrency !== "USD" && (
                                  <div className="text-[10px] font-normal text-slate-500 dark:text-zinc-400">
                                    ≈ ${(Math.round(Number(itm.total || 0) * poFxRate * 100) / 100).toFixed(2)} USD
                                  </div>
                                )}
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
                                    const { totalUsd } = recalculatePoUsdTotal(next, poShippingFee, poFxRate);
                                    setPo((prev) => ({ ...prev, amount: totalUsd, currency: "USD" }));
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
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Vendor <span className="text-red-500">*</span>
                    </label>
                    <VendorAutocomplete
                      value={invoice.vendor}
                      onChange={(v) => setInvoice({ ...invoice, vendor: v })}
                      placeholder="Search or enter vendor name..."
                    />
                  </div>
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

                <TwoUp>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Class <span className="text-red-500">*</span>
                    </label>
                    <DepartmentAutocomplete
                      value={invoice.department || ""}
                      onChange={(v) => setInvoice({ ...invoice, department: v })}
                      placeholder="Select department / class *"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      From Location <span className="text-red-500">*</span>
                    </label>
                    <LocationAutocomplete
                      value={invoice.from_location || ""}
                      onChange={(v) => setInvoice({ ...invoice, from_location: v })}
                      placeholder="Select or enter location *"
                      required
                    />
                  </div>
                </TwoUp>

                {invoiceItems.length > 1 ? (
                  <div className="space-y-3 pt-1">
                    <TwoUp>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Bank Account <span className="text-rose-500">*</span>
                        </label>
                        <BankAccountAutocomplete
                          value={invoice.bank_account || ""}
                          onChange={(v) => setInvoice({ ...invoice, bank_account: v })}
                          placeholder="Select Bank Account *"
                        />
                      </div>
                      {request.request_type !== "RECURRING" ? (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Asset Flag</label>
                          <div className="flex items-center h-10">
                            <input type="checkbox" className="h-4 w-4" checked={invoice.asset_flag || false} onChange={(e) => setInvoice({ ...invoice, asset_flag: e.target.checked })} />
                            <span className="ml-2 text-sm text-slate-700">Mark as Asset</span>
                          </div>
                        </div>
                      ) : <div />}
                    </TwoUp>

                    <div className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/50 p-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                          Default Category
                        </label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs px-2.5 font-medium border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800"
                          onClick={() => {
                            if (invoice.gl_code?.trim()) {
                              setInvoiceItems(prev => prev.map(item => ({ ...item, gl_code: invoice.gl_code || "" })));
                              toast.success("Applied Category to all line items");
                            } else {
                              toast.error("Select a category above first");
                            }
                          }}
                        >
                          Apply to All Lines
                        </Button>
                      </div>
                      <CategoryAutocomplete
                        value={invoice.gl_code || ""}
                        onChange={(v) => {
                          setInvoice(prev => ({ ...prev, gl_code: v }));
                        }}
                        placeholder="Select category to apply to lines..."
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                          Line Items Category Allocation ({invoiceItems.length} items) <span className="text-rose-500">*</span>
                        </span>
                        <span className="text-xs text-slate-500">Category is required for all items</span>
                      </div>
                      <div className="border border-slate-200 dark:border-zinc-800 rounded-lg divide-y divide-slate-200 dark:divide-zinc-800 text-xs shadow-xs bg-white dark:bg-zinc-900">
                        <div className="bg-slate-100/80 dark:bg-zinc-800/70 px-3 py-2.5 grid grid-cols-12 gap-3 font-semibold text-slate-700 dark:text-zinc-300">
                          <div className="col-span-5">Item / Description</div>
                          <div className="col-span-2 text-right pr-6">Amount</div>
                          <div className="col-span-4 pl-4 border-l border-slate-200 dark:border-zinc-700">Category *</div>
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
                                <CategoryAutocomplete
                                  value={itm.gl_code || ""}
                                  onChange={(v) => {
                                    setInvoiceItems(prev => {
                                      const updated = [...prev];
                                      updated[idx] = { ...updated[idx], gl_code: v };
                                      return updated;
                                    });
                                  }}
                                  placeholder="Select category *"
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
                  <>
                    <TwoUp>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Bank Account <span className="text-rose-500">*</span>
                        </label>
                        <BankAccountAutocomplete
                          value={invoice.bank_account || ""}
                          onChange={(v) => setInvoice({ ...invoice, bank_account: v })}
                          placeholder="Select Bank Account *"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Category <span className="text-rose-500">*</span>
                        </label>
                        <CategoryAutocomplete
                          value={invoice.gl_code || ""}
                          onChange={(v) => setInvoice({ ...invoice, gl_code: v })}
                          placeholder="Select Category *"
                        />
                      </div>
                    </TwoUp>
                    {request.request_type !== "RECURRING" && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Asset Flag</label>
                        <div className="flex items-center h-10">
                          <input type="checkbox" className="h-4 w-4" checked={invoice.asset_flag || false} onChange={(e) => setInvoice({ ...invoice, asset_flag: e.target.checked })} />
                          <span className="ml-2 text-sm text-slate-700">Mark as Asset</span>
                        </div>
                      </div>
                    )}
                  </>
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

                {activeForm.action === "APPROVE" && (data?.request?.current_approval_level || 1) === 1 && Number(data?.request?.amount || data?.purchase_order?.amount || data?.invoice?.amount || 0) >= 10000 && (
                  <div className="p-3 bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 rounded-xl space-y-1.5">
                    <div className="flex items-center space-x-2.5">
                      <Checkbox
                        id="pass_to_level_2"
                        checked={approval.pass_to_level_2 ?? true}
                        onCheckedChange={(checked) => setApproval({ ...approval, pass_to_level_2: !!checked })}
                      />
                      <label
                        htmlFor="pass_to_level_2"
                        className="text-xs font-semibold text-purple-950 dark:text-purple-200 cursor-pointer flex items-center gap-1.5"
                      >
                        <span>Pass to Level 2 Approver (Company Approver)</span>
                        <Badge variant="outline" className="text-[10px] bg-purple-100/80 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300 border-purple-300">
                          ≥ $10,000
                        </Badge>
                      </label>
                    </div>
                    <p className="text-[11px] text-purple-700 dark:text-purple-300 pl-6 leading-relaxed">
                      {approval.pass_to_level_2
                        ? "This approval will pass to the assigned Company Level 2 Approver(s) for final Level 2 approval. The request will stay in Waiting Approval state until approved or rejected by a Level 2 approver."
                        : "Level 2 executive approval bypassed. This request will move directly to payment processing upon approval."}
                    </p>
                  </div>
                )}

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
        <>
          <ScheduleBreakdownModal
            request={data?.request || null}
            open={isScheduleLedgerOpen}
            onOpenChange={setIsScheduleLedgerOpen}
          />

          <ManualPriceDialog
            requestId={id}
            isOpen={isManualPriceOpen}
            onOpenChange={setIsManualPriceOpen}
          />

          {/* Quick Add / Change Group Project Dialog */}
          <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-indigo-600" />
                  <span>{request.project_name ? "Change Group Project" : "Add to Group Project"}</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Assign this request to a group project (e.g. &quot;Drone Project&quot;). All related purchases under this project will be grouped together.
                </DialogDescription>
              </DialogHeader>
              <div className="py-3 space-y-2">
                <Label className="text-xs font-semibold">Project Name</Label>
                <ProjectAutocomplete
                  value={quickProjectValue}
                  onChange={setQuickProjectValue}
                  placeholder="Select existing project or type new project name..."
                />
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setIsProjectDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={async () => {
                    try {
                      await updateRequest(request.id, {
                        project_name: quickProjectValue.trim() || null,
                      });
                      queryClient.invalidateQueries({ queryKey: ["purchasing", "request", request.id] });
                      queryClient.invalidateQueries({ queryKey: ["purchasing", "requests"] });
                      queryClient.invalidateQueries({ queryKey: ["purchasing", "projects"] });
                      toast.success(
                        quickProjectValue.trim()
                          ? `Assigned to project "${quickProjectValue.trim()}"`
                          : "Removed from project"
                      );
                      setIsProjectDialogOpen(false);
                    } catch (err: any) {
                      toast.error(err?.message || "Failed to update project");
                    }
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Save Project
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
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


