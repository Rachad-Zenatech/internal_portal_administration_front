import { useGLCodes } from "@/hooks/usePurchasing";
import { renderBankAccountBadge as renderBankAccountBadgeUtil, renderCategoryBadge as renderCategoryBadgeUtil } from "@/utils/glAccountUtils";
import { getApiErrorStatus } from "@/services/helper";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { type PreviewFileTarget } from "../../dialogs/FilePreviewModal";
import { usePurchaseRequest, useTransitionRequest, useUploadAttachments, useDeleteAttachment, useUpdateReviewStatus, useUpdateWireTransfer, useExtractQuote, useRedirectToVanessa } from "@/hooks/usePurchasing";
import * as purchasingService from "@/services/purchasingService";
import { useAuth } from "@/lib/AuthContext";
import { RequestStatus } from "@/types/purchasing";
import type { PurchaseOrderInput, WireTransferInput, InvoiceInput, InvoiceItemInput, ApprovalInput, TrackingInput, HoldInput, WorkflowAction, AttachmentInfo } from "@/types/purchasing";
import type { FormKind } from "../types";

export function useRequestDetailActions() {
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
  const { data, isLoading, isError, error, refetch } = usePurchaseRequest(id);
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
  const deleteAttachment = useDeleteAttachment(id ?? "");
  const reviewMutation = useUpdateReviewStatus();
  const extractQuoteMutation = useExtractQuote();
  const quoteDetailFileInputRef = useRef<HTMLInputElement>(null);
  const [previewTarget, setPreviewTarget] = useState<PreviewFileTarget | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const invoiceReceiptInputRef = useRef<HTMLInputElement>(null);
  const wireReceiptInputRef = useRef<HTMLInputElement>(null);
  const handlePreviewAttachment = async (att: AttachmentInfo) => {
    if (!id) return;
    setIsLoadingPreview(true);
    try {
      const blob = await purchasingService.getAttachmentBlob(id, att.id);
      const contentType = blob.type || att.content_type || "";
      const url = URL.createObjectURL(blob);
      setPreviewTarget({
        name: att.filename,
        size: att.size,
        url,
        contentType,
        onDownload: () => purchasingService.downloadAttachment(id, att.id, att.filename),
      });
      setIsPreviewOpen(true);
    } catch (err: unknown) {
      toast.error("Could not load file preview: " + ((err as Error)?.message || "Unknown error"));
    } finally {
      setIsLoadingPreview(false);
    }
  };
  const handlePreviewFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setPreviewTarget({
      name: file.name,
      size: file.size,
      url,
      contentType: file.type,
      onDownload: () => {
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      },
    });
    setIsPreviewOpen(true);
  };
  const handleClosePreview = (open: boolean) => {
    setIsPreviewOpen(open);
    if (!open && previewTarget?.url) {
      URL.revokeObjectURL(previewTarget.url);
      setPreviewTarget(null);
    }
  };
  const { user, roles: userRoles = [], workflow_roles = [], hasRole } = useAuth();
  const [isScheduleLedgerOpen, setIsScheduleLedgerOpen] = useState(false);
  const [activeForm, setActiveForm] = useState<{ action: WorkflowAction; kind: FormKind } | null>(null);
  const [invoicePoNumber, setInvoicePoNumber] = useState<string>("");
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
  const [isChangeApproverOpen, setIsChangeApproverOpen] = useState(false);
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
  const [isConvertToRecurringOpen, setIsConvertToRecurringOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isRedirectVanessaDialogOpen, setIsRedirectVanessaDialogOpen] = useState(false);
  const [vanessaRedirectReason, setVanessaRedirectReason] = useState("");
  const redirectToVanessaMutation = useRedirectToVanessa();
  useEffect(() => {
    if (searchParams.get("redirect_to") === "vanessa") {
      setIsRedirectVanessaDialogOpen(true);
    }
  }, [searchParams]);
  const [activeDetailTab, setActiveDetailTab] = useState<string>(() => {
    return searchParams.get("tab") === "messages" ? "messages" : "overview";
  });
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "messages") {
      setActiveDetailTab("messages");
    }
  }, [searchParams]);
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
              path: window.location.pathname,
              items: [
                {
                  title: "Recurring Payments",
                  path: "/purchasing/recurring",
                },
                ...(isScheduledPayment
                  ? [
                      {
                        title: "M&A Scheduled Payments",
                        path: "/purchasing/recurring?filter=MA_SCHEDULED",
                      },
                    ]
                  : []),
                { title: `${data.request.title || "Request"} (#${data.request.id})` },
              ],
            },
          })
        );
      } else {
        document.dispatchEvent(
          new CustomEvent("set-breadcrumb-trail", {
            detail: {
              path: window.location.pathname,
              items: [
                { title: "Purchase Requests", path: "/purchasing/requests" },
                { title: `${data.request.title || "Request"} (#${data.request.id})` },
              ],
            },
          })
        );
      }
    }
  }, [data?.request, isRecurring, isScheduledPayment]);
  const hasItemsTab = Boolean((data?.request?.items && data.request.items.length > 0) || (data?.request?.quote_data?.items && data.request.quote_data.items.length > 0));
  const hasPoTab = Boolean(data?.purchase_order);
  const hasInvoiceTab = Boolean(data?.invoice);
  const hasWireTab = Boolean(data?.wire_transfer);
  // Rent / Note wire transfers belong to a series of payments: they get a Payments tab
  const hasPaymentsTab = Boolean(data?.wire_transfer?.payment_series);
  const hasRecurringTab = Boolean(isRecurring);
  useEffect(() => {
    if (activeDetailTab === "items" && !hasItemsTab) setActiveDetailTab("overview");
    if (activeDetailTab === "po" && !hasPoTab) setActiveDetailTab("overview");
    if (activeDetailTab === "invoice" && !hasInvoiceTab) setActiveDetailTab("overview");
    if (activeDetailTab === "wire" && !hasWireTab) setActiveDetailTab("overview");
    if (activeDetailTab === "payments" && !hasPaymentsTab) setActiveDetailTab("overview");
    if (activeDetailTab === "recurring" && !hasRecurringTab) setActiveDetailTab("overview");
  }, [activeDetailTab, hasItemsTab, hasPoTab, hasInvoiceTab, hasWireTab, hasPaymentsTab, hasRecurringTab]);
  // A deleted request's notifications are removed server-side on the 404; refresh so they disappear here too
  const isRequestGone = isError && getApiErrorStatus(error) === 404;
  useEffect(() => {
    if (isRequestGone) {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  }, [isRequestGone, queryClient]);
  return { id, glCodes, renderBankAccount, renderCategory, navigate, queryClient, data, isLoading, isError, error, refetch, isManualPriceOpen, setIsManualPriceOpen, isProjectDialogOpen, setIsProjectDialogOpen, quickProjectValue, setQuickProjectValue, isWireDialogOpen, setIsWireDialogOpen, isDraft, transition, updateWireTransfer, isEditWireOpen, setIsEditWireOpen, handleUpdateWire, uploadAttachments, deleteAttachment, reviewMutation, extractQuoteMutation, quoteDetailFileInputRef, previewTarget, isPreviewOpen, isLoadingPreview, invoiceReceiptInputRef, wireReceiptInputRef, handlePreviewAttachment, handlePreviewFile, handleClosePreview, user, userRoles, workflow_roles, hasRole, isScheduleLedgerOpen, setIsScheduleLedgerOpen, activeForm, setActiveForm, invoicePoNumber, setInvoicePoNumber, pendingFiles, setPendingFiles, poItems, setPoItems, poShippingFee, setPoShippingFee, poItemCurrency, setPoItemCurrency, poFxRate, setPoFxRate, po, setPo, invoice, setInvoice, invoiceItems, setInvoiceItems, approval, setApproval, tracking, setTracking, hold, setHold, isChangeApproverOpen, setIsChangeApproverOpen, completeData, setCompleteData, calculateNextDueDate, confirmGoods, setConfirmGoods, isActivityLogsOpen, setIsActivityLogsOpen, isEditOpen, setIsEditOpen, isConvertToRecurringOpen, setIsConvertToRecurringOpen, searchParams, setSearchParams, isRedirectVanessaDialogOpen, setIsRedirectVanessaDialogOpen, vanessaRedirectReason, setVanessaRedirectReason, redirectToVanessaMutation, activeDetailTab, setActiveDetailTab, isScheduledPayment, isRecurring, isAPRequest, backUrl, backLabel, hasItemsTab, hasPoTab, hasInvoiceTab, hasWireTab, hasPaymentsTab, hasRecurringTab };
}
