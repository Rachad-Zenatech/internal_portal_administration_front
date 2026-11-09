import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/apiClient";
import { downloadAttachment, getAttachmentBlob, deletePurchaseRequest } from "@/services/purchasingService";
import { useRequestDetail, useTransitionRequest, useUploadAttachments, useDeleteAttachment, useGLCodes, useUpdateWireTransfer } from "@/hooks/usePurchasing";
import { type RequestDetail, type CustomScheduleDate, type FrequencyType, type AttachmentInfo, type Priority } from "@/types/purchasing";
import { type PreviewFileTarget } from "../../dialogs/FilePreviewModal";
import { calculateInstallmentsCount, formatDateToIso, type ProjectedInstallment } from "../../utils/recurringScheduleUtils";
import { toast } from "sonner";

export function usePurchaseRequestDetailActions() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: requestDetail, isLoading, error, refetch } = useRequestDetail(id);
  const { data: glCodes = [] } = useGLCodes();
  const request = requestDetail?.request;
  const invoice = requestDetail?.invoice;
  const allInvoices = (requestDetail?.invoices && requestDetail.invoices.length > 0)
    ? requestDetail.invoices
    : (requestDetail?.invoice ? [requestDetail.invoice] : []);
  const approvals = requestDetail?.approvals || [];
  const attachments = requestDetail?.attachments || [];
  const history = requestDetail?.history || [];
  const itemUrl = request?.item_url || (requestDetail as any)?.purchase_order?.item_url;
  const formattedItemUrl = itemUrl ? (itemUrl.startsWith("http://") || itemUrl.startsWith("https://") ? itemUrl : `https://${itemUrl}`) : "";
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isScheduleLedgerOpen, setIsScheduleLedgerOpen] = useState(false);
  const [isRecordInvoiceOpen, setIsRecordInvoiceOpen] = useState(false);
  const [isEditWireOpen, setIsEditWireOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<ProjectedInstallment | null>(null);
  const [invoiceFiles, setInvoiceFiles] = useState<File[]>([]);
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);
  const [expandedInstallments, setExpandedInstallments] = useState<Record<number, boolean>>({});
  const [expandedInvoices, setExpandedInvoices] = useState<Record<string | number, boolean>>({});
  const [invoiceSortOrder, setInvoiceSortOrder] = useState<"desc" | "asc">("desc");
  const [isHoldDialogOpen, setIsHoldDialogOpen] = useState(false);
  const [holdReason, setHoldReason] = useState("");
  const [isChangeApproverOpen, setIsChangeApproverOpen] = useState(false);
  const updateWireTransfer = useUpdateWireTransfer(id ?? "");
  // Edit form state
  const [editForm, setEditForm] = useState({
    title: "",
    requester: "",
    department: "",
    class: "",
    location: "",
    amount: "",
    currency: "USD",
    due_date: "",
    description: "",
    gl_code: "",
    priority: "MEDIUM" as Priority,
    is_scheduled: false,
    frequency: "MONTHLY" as FrequencyType,
    start_date: "",
    end_date: "",
    completed_installments: 0,
    schedule_dates: [] as CustomScheduleDate[],
    item_url: "",
  });
  // Invoice form state
  const [invoiceForm, setInvoiceForm] = useState({
    vendor: "",
    amount: "",
    invoice_date: new Date().toISOString().split("T")[0],
    due_date: "",
    bank_account: "",
    gl_code: "",
    department: "General",
    from_location: "USA",
    asset_flag: false,
    description: "",
    interest: "",
    principal_paid: "",
    balance: "",
    actual_cost_after_tax: "",
  });
  const isScheduledPayment =
    request?.request_type === "SCHEDULED_PAYMENT" ||
    (request?.request_type === "RECURRING" &&
      Boolean(request?.recurring_schedule?.is_scheduled || request?.recurring_schedule?.frequency === "CUSTOM"));
  const isRecurring =
    request?.request_type === "RECURRING" ||
    request?.request_type === "SCHEDULED_PAYMENT";
  useEffect(() => {
    if (request) {
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
              { title: `${request.title || "Request"} (#${request.id})` },
            ],
          },
        })
      );
    }
  }, [request, isScheduledPayment, isRecurring]);
  const handleOpenEdit = () => {
    if (!request) return;
    const sched = request.recurring_schedule;
    const isSched = Boolean(sched?.is_scheduled);
    let schedDates: CustomScheduleDate[] = [];
    if (sched?.schedule_dates && sched.schedule_dates.length > 0) {
      schedDates = sched.schedule_dates;
    } else if (sched?.custom_dates && sched.custom_dates.length > 0) {
      schedDates = sched.custom_dates.map((d: string, i: number) => ({
        date: d,
        amount: sched?.amount_per_cycle || request.amount,
        note: `Installment #${i + 1}`,
      }));
    } else if (isSched) {
      const baseDate = sched?.start_date ? sched.start_date.split("T")[0] : (request.due_date ? request.due_date.split("T")[0] : new Date().toISOString().split("T")[0]);
      const nextMonth = new Date(baseDate + "T00:00:00");
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const nextMonthIso = formatDateToIso(nextMonth);
      schedDates = [
        { date: baseDate, amount: request.amount || undefined, note: "Installment #1" },
        { date: nextMonthIso, amount: request.amount || undefined, note: "Installment #2" },
      ];
    }

    const reqLoc = (request as any).location || (request as any).from_location || request.quote_data?.location || request.quote_data?.shipped_to_location || "";
    const reqClass = (request as any).class || request.quote_data?.class || "";

    setEditForm({
      title: request.title || "",
      requester: request.requester || "",
      department: request.department || "",
      class: reqClass,
      location: reqLoc,
      amount: request.amount ? request.amount.toString() : "",
      currency: request.currency || "USD",
      due_date: request.due_date ? request.due_date.split("T")[0] : "",
      description: request.description || "",
      gl_code: request.gl_code || "",
      priority: request.priority || "MEDIUM",
      is_scheduled: isSched,
      frequency: (sched?.frequency as FrequencyType) || (isSched ? "CUSTOM" : "MONTHLY"),
      start_date: sched?.start_date ? sched.start_date.split("T")[0] : (schedDates[0]?.date || (request.due_date ? request.due_date.split("T")[0] : "")),
      end_date: sched?.end_date ? sched.end_date.split("T")[0] : (schedDates[schedDates.length - 1]?.date || ""),
      completed_installments: sched?.completed_installments || 0,
      schedule_dates: schedDates,
      item_url: request.item_url || (requestDetail as any)?.purchase_order?.item_url || "",
    });
    setIsEditOpen(true);
  };
  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (!id) throw new Error("No ID");
      return await apiClient.put<RequestDetail>(`/api/purchasing/requests/${id}`, payload);
    },
    onSuccess: (res) => {
      toast.success(`Request #${res.request.id} updated successfully`);
      setIsEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ["purchasing", "request", id] });
      queryClient.invalidateQueries({ queryKey: ["recurring-requests"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update request");
    },
  });
  const reviewMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      if (!id) throw new Error("No ID");
      return await apiClient.patch<RequestDetail>(`/api/purchasing/requests/${id}/review-status`, {
        review_status: newStatus,
      });
    },
    onSuccess: (res) => {
      toast.success(
        `Marked as ${res.request.review_status === "REVIEWED" ? "Reviewed" : "Waiting for Review"}`
      );
      queryClient.invalidateQueries({ queryKey: ["purchasing", "request", id] });
      queryClient.invalidateQueries({ queryKey: ["recurring-requests"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update review status");
    },
  });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("No ID");
      await deletePurchaseRequest(id);
    },
    onSuccess: () => {
      toast.success("Recurring payment deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["recurring-requests"] });
      queryClient.invalidateQueries({ queryKey: ["purchasing"] });
      queryClient.invalidateQueries({ queryKey: ["purchasing", "requests"] });
      queryClient.invalidateQueries({ queryKey: ["purchasing-summary"] });
      navigate("/purchasing/recurring");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete recurring payment");
    },
  });
  const recordInvoiceMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (!id) throw new Error("No ID");
      return await apiClient.post<RequestDetail>(`/api/purchasing/requests/${id}/invoices`, payload);
    },
    onSuccess: () => {
      toast.success(
        selectedInstallment
          ? `Payment recorded successfully for Installment #${selectedInstallment.installmentNumber}`
          : "Invoice recorded successfully"
      );
      setIsRecordInvoiceOpen(false);
      setSelectedInstallment(null);
      queryClient.invalidateQueries({ queryKey: ["purchasing", "request", id] });
      queryClient.invalidateQueries({ queryKey: ["recurring-requests"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to record invoice");
    },
  });
  const transitionMutation = useTransitionRequest(id || "");
  const uploadMutation = useUploadAttachments(id || "");
  const deleteAttachmentMutation = useDeleteAttachment(id || "");
  const [previewTarget, setPreviewTarget] = useState<PreviewFileTarget | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const handlePreviewAttachment = async (att: AttachmentInfo) => {
    if (!id) return;
    setIsLoadingPreview(true);
    try {
      const blob = await getAttachmentBlob(id, att.id);
      const contentType = blob.type || att.content_type || "";
      const url = URL.createObjectURL(blob);
      setPreviewTarget({
        name: att.filename,
        size: att.size,
        url,
        contentType,
        onDownload: () => downloadAttachment(id, att.id, att.filename),
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
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    const isCustom = editForm.frequency === "CUSTOM";
    const customDates = isCustom ? editForm.schedule_dates : [];
    const isSched = Boolean(
      editForm.is_scheduled &&
      (isCustom ? customDates.length > 0 : editForm.start_date && editForm.end_date)
    );

    const customSum = isCustom ? customDates.reduce((acc, itm) => acc + (itm.amount != null ? itm.amount : 0), 0) : 0;
    let baseAmt = parseFloat(editForm.amount) || 0;

    if (isSched && isCustom) {
      if (customDates.length === 0) {
        toast.error("Please add at least one installment date");
        return;
      }
      if (customSum <= 0 && baseAmt <= 0) {
        toast.error("Please enter an amount for the installment dates (greater than $0.00)");
        return;
      }
    } else {
      if (baseAmt <= 0) {
        toast.error("Please enter a valid amount greater than $0.00");
        return;
      }
    }

    let totalCycles: number | null = null;
    let totalAmt: number | null = null;
    let amt = baseAmt;

    if (isSched) {
      if (isCustom) {
        totalCycles = customDates.length;
        totalAmt = customSum > 0 ? customSum : (baseAmt > 0 ? baseAmt * totalCycles : 0);
        const completedCount = editForm.completed_installments || 0;
        const activeCycleDate = customDates[completedCount] || customDates[0];
        const cycleAmt = activeCycleDate?.amount != null && activeCycleDate.amount > 0
          ? activeCycleDate.amount
          : (baseAmt > 0 ? baseAmt : (totalCycles > 0 ? Math.round((totalAmt / totalCycles) * 100) / 100 : 0));
        const sanitizedDates = customDates.map((d, i) => ({
          date: d.date,
          amount: d.amount != null && d.amount > 0 ? d.amount : cycleAmt,
          interest: d.interest != null ? d.interest : null,
          principal_paid: d.principal_paid != null ? d.principal_paid : null,
          balance: d.balance != null ? d.balance : null,
          note: d.note || `Installment #${i + 1}`,
        }));

        const effectiveStartDate = sanitizedDates.length > 0 ? sanitizedDates[0].date : editForm.start_date;
        const effectiveEndDate = sanitizedDates.length > 0 ? sanitizedDates[sanitizedDates.length - 1].date : editForm.end_date;
        const effectiveDueDate = effectiveStartDate || editForm.due_date;

        updateMutation.mutate({
          title: editForm.title,
          requester: editForm.requester,
          department: editForm.class || editForm.department,
          class: editForm.class || null,
          location: editForm.location || null,
          request_type: (isSched || request?.request_type === "SCHEDULED_PAYMENT") ? "SCHEDULED_PAYMENT" : (request?.request_type || "RECURRING"),
          priority: editForm.priority,
          currency: editForm.currency || "USD",
          amount: cycleAmt,
          unit_price: cycleAmt,
          quantity: 1,
          description: editForm.description,
          gl_code: request?.gl_code || editForm.gl_code || null,
          due_date: effectiveDueDate || null,
          quote_data: {
            ...(request?.quote_data || {}),
            location: editForm.location || "",
            class: editForm.class || "",
            department: editForm.department || "",
          },
          recurring_schedule: {
            is_scheduled: true,
            frequency: editForm.frequency,
            start_date: effectiveStartDate,
            end_date: effectiveEndDate,
            total_installments: totalCycles,
            completed_installments: editForm.completed_installments || 0,
            amount_per_cycle: cycleAmt,
            total_amount: totalAmt,
            custom_dates: sanitizedDates.map((d) => d.date),
            schedule_dates: sanitizedDates,
          },
        });
        return;
      } else {
        totalCycles = calculateInstallmentsCount(editForm.start_date, editForm.end_date, editForm.frequency);
        totalAmt = totalCycles ? Math.round(amt * totalCycles * 100) / 100 : null;
      }
    }

    const effectiveStartDate = isCustom && customDates.length > 0 ? customDates[0].date : editForm.start_date;
    const effectiveEndDate = isCustom && customDates.length > 0 ? customDates[customDates.length - 1].date : editForm.end_date;
    const effectiveDueDate = (isSched && effectiveStartDate) ? effectiveStartDate : editForm.due_date;

    updateMutation.mutate({
      title: editForm.title,
      requester: editForm.requester,
      department: editForm.class || editForm.department,
      class: editForm.class || null,
      location: editForm.location || null,
      request_type: (isSched || request?.request_type === "SCHEDULED_PAYMENT") ? "SCHEDULED_PAYMENT" : (request?.request_type || "RECURRING"),
      priority: editForm.priority,
      currency: editForm.currency || "USD",
      amount: amt,
      unit_price: amt,
      quantity: 1,
      description: editForm.description,
      gl_code: request?.gl_code || editForm.gl_code || null,
      due_date: effectiveDueDate || null,
      item_url: editForm.item_url?.trim() || null,
      quote_data: {
        ...(request?.quote_data || {}),
        location: editForm.location || "",
        class: editForm.class || "",
        department: editForm.department || "",
      },
      recurring_schedule: isSched
        ? {
            is_scheduled: true,
            frequency: editForm.frequency,
            start_date: effectiveStartDate,
            end_date: effectiveEndDate,
            total_installments: totalCycles,
            completed_installments: editForm.completed_installments || 0,
            amount_per_cycle: totalCycles && totalCycles > 0 ? Math.round((totalAmt! / totalCycles) * 100) / 100 : amt,
            total_amount: totalAmt,
            custom_dates: isCustom ? customDates.map((d) => d.date) : null,
            schedule_dates: isCustom ? customDates : null,
          }
        : {
            is_scheduled: false,
            frequency: editForm.frequency || "MONTHLY",
            start_date: editForm.start_date || editForm.due_date || new Date().toISOString().split("T")[0],
            end_date: null,
            total_installments: null,
            completed_installments: editForm.completed_installments || 0,
            amount_per_cycle: amt,
            total_amount: null,
          },
    });
  };
  const handleRecordInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const uploadInstallment = selectedInstallment ? String(selectedInstallment.installmentNumber) : undefined;
    const amt = parseFloat(invoiceForm.amount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!invoiceForm.bank_account?.trim()) {
      toast.error("Bank Account is required");
      return;
    }
    if (!invoiceForm.gl_code?.trim()) {
      toast.error("Category (GL Code) is required");
      return;
    }
    recordInvoiceMutation.mutate(
      {
        vendor: invoiceForm.vendor || request?.title || "",
        amount: amt,
        invoice_date: invoiceForm.invoice_date,
        due_date: invoiceForm.due_date || null,
        bank_account: invoiceForm.bank_account.trim(),
        gl_code: invoiceForm.gl_code.trim(),
        department: invoiceForm.department || request?.department || "General",
        from_location: invoiceForm.from_location || "USA",
        asset_flag: invoiceForm.asset_flag,
        description: invoiceForm.description || null,
        interest: invoiceForm.interest && invoiceForm.interest.trim() !== "" ? parseFloat(invoiceForm.interest.replace("$", "").replace(",", "")) : null,
        principal_paid: invoiceForm.principal_paid && invoiceForm.principal_paid.trim() !== "" ? parseFloat(invoiceForm.principal_paid.replace("$", "").replace(",", "")) : null,
        balance: invoiceForm.balance && invoiceForm.balance.trim() !== "" ? parseFloat(invoiceForm.balance.replace("$", "").replace(",", "")) : null,
        currency: request?.currency || "USD",
        actual_cost_after_tax: invoiceForm.actual_cost_after_tax.trim() !== "" ? parseFloat(invoiceForm.actual_cost_after_tax) : null,
      },
      {
        onSuccess: () => {
          if (invoiceFiles.length > 0) {
            // Tag the receipts with the installment being paid so the next payment does not show them
            uploadMutation.mutate({ files: invoiceFiles, installment: uploadInstallment }, {
              onSuccess: () => {
                setInvoiceFiles([]);
              },
            });
          }
        },
      }
    );
  };
  return { id, navigate, queryClient, requestDetail, isLoading, error, refetch, glCodes, request, invoice, allInvoices, approvals, attachments, history, formattedItemUrl, isEditOpen, setIsEditOpen, isScheduleLedgerOpen, setIsScheduleLedgerOpen, isRecordInvoiceOpen, setIsRecordInvoiceOpen, isEditWireOpen, setIsEditWireOpen, selectedInstallment, setSelectedInstallment, invoiceFiles, setInvoiceFiles, isDraggingPdf, setIsDraggingPdf, expandedInstallments, setExpandedInstallments, expandedInvoices, setExpandedInvoices, invoiceSortOrder, setInvoiceSortOrder, isHoldDialogOpen, setIsHoldDialogOpen, holdReason, setHoldReason, isChangeApproverOpen, setIsChangeApproverOpen, updateWireTransfer, editForm, setEditForm, invoiceForm, setInvoiceForm, handleOpenEdit, updateMutation, reviewMutation, isDeleteDialogOpen, setIsDeleteDialogOpen, deleteMutation, recordInvoiceMutation, transitionMutation, uploadMutation, deleteAttachmentMutation, previewTarget, isPreviewOpen, isLoadingPreview, handlePreviewAttachment, handlePreviewFile, handleClosePreview, handleEditSubmit, handleRecordInvoiceSubmit };
}
