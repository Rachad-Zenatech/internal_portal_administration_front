import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  ArrowLeft,
  ArrowRight,
  Edit2,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Receipt,
  Paperclip,
  History,
  ShieldCheck,
  Building2,
  Plus,
  RefreshCw,
  Check,
  AlertTriangle,
  X,
  UploadCloud,
  Download,
  Landmark,
  Pencil,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ArrowUpDown,
  Trash2,
  Eye,
  PauseCircle,
  PlayCircle,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiClient } from "@/services/apiClient";
import { downloadAttachment, getAttachmentBlob, deletePurchaseRequest } from "@/services/purchasingService";
import { useRequestDetail, useTransitionRequest, useUploadAttachments, useDeleteAttachment, useGLCodes, useUpdateWireTransfer } from "@/hooks/usePurchasing";
import { BankAccountAutocomplete } from "./BankAccountAutocomplete";
import { CategoryAutocomplete } from "./CategoryAutocomplete";
import LocationAutocomplete from "./LocationAutocomplete";
import { renderBankAccountBadge, renderCategoryBadge } from "@/utils/glAccountUtils";
import {
  RequestStatus,
  type RequestDetail,
  type CustomScheduleDate,
  type FrequencyType,
  type WireTransferInput,
  type AttachmentInfo,
  type Priority,
} from "@/types/purchasing";
import { FilePreviewModal, type PreviewFileTarget } from "./FilePreviewModal";
import { WireTransferDialog } from "./WireTransferDialog";
import { ChangeLevel1ApproverModal } from "./ChangeLevel1ApproverModal";
import { parseRequestStatus } from "@/lib/requestStatus";
import {
  formatDate,
  formatMoney,
  getStatusBadge,
  getStatusLabel,
} from "./purchasingMeta";
import {
  formatRemainingDuration,
  calculateInstallmentsCount,
  generatePaymentSchedule,
  formatDateToIso,
  FREQUENCY_LABELS,
  type ProjectedInstallment,
} from "./recurringScheduleUtils";
import { ScheduleDatesBuilder } from "./ScheduleDatesBuilder";
import { ScheduleBreakdownModal } from "./ScheduleBreakdownModal";
import PrioritySelector from "./PrioritySelector";
import { Button } from "@/components/ui/button";
import HelpIcon from "@/components/ui/HelpIcon";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function PurchaseRequestDetail() {
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
    due_date: "",
    description: "",
    gl_code: "",
    priority: "MEDIUM" as Priority,
    is_scheduled: true,
    frequency: "CUSTOM" as FrequencyType,
    start_date: "",
    end_date: "",
    completed_installments: 0,
    schedule_dates: [] as CustomScheduleDate[],
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
    const isSched = sched?.is_scheduled !== undefined ? Boolean(sched.is_scheduled) : true;
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
      due_date: request.due_date ? request.due_date.split("T")[0] : "",
      description: request.description || "",
      gl_code: request.gl_code || "",
      priority: request.priority || "MEDIUM",
      is_scheduled: isSched,
      frequency: (sched?.frequency as FrequencyType) || "CUSTOM",
      start_date: sched?.start_date ? sched.start_date.split("T")[0] : (schedDates[0]?.date || (request.due_date ? request.due_date.split("T")[0] : "")),
      end_date: sched?.end_date ? sched.end_date.split("T")[0] : (schedDates[schedDates.length - 1]?.date || ""),
      completed_installments: sched?.completed_installments || 0,
      schedule_dates: schedDates,
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
      amount: amt,
      unit_price: amt,
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
      },
      {
        onSuccess: () => {
          if (invoiceFiles.length > 0) {
            uploadMutation.mutate(invoiceFiles, {
              onSuccess: () => {
                setInvoiceFiles([]);
              },
            });
          }
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm font-medium">Loading recurring request details...</p>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100">Request Not Found</h2>
        <p className="text-sm text-slate-500">
          The request #{id} could not be located or you don't have permission to access it.
        </p>
        <Button onClick={() => navigate("/purchasing/recurring")} variant="outline" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Recurring Payments
        </Button>
      </div>
    );
  }

  const sched = request.recurring_schedule || {
    is_scheduled: false,
    frequency: "MONTHLY" as FrequencyType,
    start_date: request.due_date ? String(request.due_date).split("T")[0] : String(request.request_date).split("T")[0],
    end_date: null,
    total_installments: null,
    completed_installments: 0,
    amount_per_cycle: request.amount || 0,
    total_amount: null,
  };

  const isReviewed = request.review_status === "REVIEWED";
  const parsedStatus = parseRequestStatus(request.status);
  const effectiveCompletedInstallments = Math.max(
    sched.completed_installments || 0,
    invoice ? 1 : 0
  );

  const completedCount = sched.completed_installments || 0;
  const isCustomMilestones = sched.frequency === "CUSTOM" || Boolean(sched.schedule_dates?.length);
  const activeMilestoneIndex = sched.schedule_dates && sched.schedule_dates.length > 0
    ? (completedCount < sched.schedule_dates.length ? completedCount : sched.schedule_dates.length - 1)
    : 0;
  const currentMilestoneDate = sched.schedule_dates?.[activeMilestoneIndex];
  const currentCycleAmount = isCustomMilestones && currentMilestoneDate?.amount != null && Number(currentMilestoneDate.amount) > 0
    ? Number(currentMilestoneDate.amount)
    : (sched.amount_per_cycle != null && Number(sched.amount_per_cycle) > 0
        ? Number(sched.amount_per_cycle)
        : (request.amount || 0));

  const durationInfo = isCustomMilestones
    ? { text: `${sched.schedule_dates?.length || 0} Custom Milestone Dates`, isExpired: false, isNearEnd: false, totalDays: 0 }
    : formatRemainingDuration(sched.end_date, sched.start_date);
  const isOngoing = !sched.total_installments && !sched.end_date && !isCustomMilestones;
  const totalCommitment = sched.total_amount != null
    ? sched.total_amount
    : (sched.schedule_dates && sched.schedule_dates.length > 0
        ? sched.schedule_dates.reduce((s: number, it: any) => s + (Number(it.amount) || 0), 0)
        : (sched.total_installments
            ? sched.total_installments * currentCycleAmount
            : (sched.end_date && !isCustomMilestones
                ? calculateInstallmentsCount(sched.start_date, sched.end_date, sched.frequency) * currentCycleAmount
                : null)));
  const effectiveTotalCycles = sched.total_installments
    || (sched.end_date && !isCustomMilestones ? calculateInstallmentsCount(sched.start_date, sched.end_date, sched.frequency) : null)
    || (isCustomMilestones ? sched.schedule_dates?.length : null);
  const paidToDate = (sched.schedule_dates && sched.schedule_dates.length > 0)
    ? sched.schedule_dates.slice(0, effectiveCompletedInstallments).reduce((s: number, it: any) => s + (Number(it.amount) || 0), 0)
    : effectiveCompletedInstallments * currentCycleAmount;

  const currentCycle = effectiveCompletedInstallments + 1;
  const totalCycles = effectiveTotalCycles;
  const allCyclesCompleted = Boolean(
    totalCycles && effectiveCompletedInstallments >= totalCycles
  );
  const cycleBracket = parsedStatus === RequestStatus.Completed
    ? (totalCycles ? ` (${totalCycles}/${totalCycles} Cycles)` : ` (${effectiveCompletedInstallments} Cycles Completed)`)
    : (totalCycles ? ` (Cycle ${Math.min(currentCycle, totalCycles)}/${totalCycles})` : ` (Cycle ${currentCycle} - Ongoing)`);

  // Generate the full payment installments schedule
  const allInstallments: ProjectedInstallment[] = generatePaymentSchedule(
    { ...sched, completed_installments: effectiveCompletedInstallments },
    request.amount,
    request.currency || "USD",
    request.status,
    request.due_date || request.request_date
  );

  const handleOpenRecordPayment = (inst?: ProjectedInstallment) => {
    setSelectedInstallment(inst || null);
    const instAmt = inst?.amount != null && inst.amount > 0 ? inst.amount : (request?.amount || 0);
    const instDate = inst?.dueDate || (request?.due_date ? String(request.due_date).split("T")[0] : new Date().toISOString().split("T")[0]);
    const instNum = inst?.installmentNumber || currentCycle;

    const rawInterest = inst?.interest != null ? String(inst.interest) : ((request?.quote_data as any)?.interest != null ? String((request?.quote_data as any).interest) : "");
    const rawPrincipal = inst?.principal_paid != null ? String(inst.principal_paid) : ((request?.quote_data as any)?.principal_paid != null ? String((request?.quote_data as any).principal_paid) : "");
    const rawBalance = inst?.balance != null ? String(inst.balance) : ((request?.quote_data as any)?.balance != null ? String((request?.quote_data as any).balance) : ((request?.quote_data as any)?.remaining_balance != null ? String((request?.quote_data as any).remaining_balance) : ""));

    setInvoiceForm({
      vendor: invoice?.vendor || request?.title || "",
      amount: instAmt.toString(),
      invoice_date: instDate,
      due_date: instDate,
      bank_account: (request as any)?.bank_account || invoice?.bank_account || "",
      gl_code: request?.gl_code || invoice?.gl_code || "",
      department: request?.department || "General",
      from_location: (request as any)?.from_location || "USA",
      asset_flag: Boolean(request?.request_type === "SCHEDULED_PAYMENT" || request?.request_type === "RECURRING" || invoice?.asset_flag),
      description: `Payment for Installment #${instNum} (${formatDate(instDate)}) - ${request?.title || ""}`,
      interest: rawInterest,
      principal_paid: rawPrincipal,
      balance: rawBalance,
    });
    setInvoiceFiles([]);
    setIsRecordInvoiceOpen(true);
  };

  const isOnHold = parsedStatus === RequestStatus.OnHold;
  const canPutOnHold = parsedStatus !== RequestStatus.Initial &&
                       parsedStatus !== RequestStatus.New &&
                       parsedStatus !== RequestStatus.UnderReview &&
                       parsedStatus !== RequestStatus.Completed &&
                       parsedStatus !== RequestStatus.Rejected &&
                       !isOnHold;

  // Workflow steps for Recurring Requests
  const workflowSteps = [
    { key: RequestStatus.UnderReview, label: "Under Review" },
    { key: RequestStatus.WaitingPayment, label: `Waiting Payment ${cycleBracket}` },
    { key: RequestStatus.InvoiceReceived, label: `Invoice Received ${cycleBracket}` },
    { key: RequestStatus.Completed, label: "Completed" },
  ];

  const currentStepIndex = workflowSteps.findIndex((s) => s.key === parsedStatus);

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
      <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xl font-bold font-mono text-slate-400 dark:text-zinc-500">
                #{request.id}
              </span>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-zinc-100">
                {request.title}
              </h1>
              <Badge
                variant="outline"
                className={`text-xs px-2.5 py-1 font-semibold ${getStatusBadge(request.status)}`}
              >
                {getStatusLabel(request.status)}{cycleBracket}
              </Badge>

              {/* Priority Selector (1-click inline update) */}
              <PrioritySelector
                requestId={request.id}
                priority={request.priority}
                size="sm"
              />

              {/* Review status badge with inline toggle action */}
              <button
                type="button"
                onClick={() => reviewMutation.mutate(isReviewed ? "WAITING_FOR_REVIEW" : "REVIEWED")}
                disabled={reviewMutation.isPending}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                  isReviewed
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100"
                    : "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 hover:bg-amber-100"
                }`}
                title="Click to toggle review status"
              >
                {isReviewed ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Reviewed
                  </>
                ) : (
                  <>
                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                    Waiting for Review
                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 underline ml-0.5">
                      Click to Review ➔
                    </span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-2 flex-wrap">
              <span>· Recurring</span>
              <span>· Requested by <strong className="text-slate-800 dark:text-zinc-200">{request.requester}</strong> ({request.department})</span>
              {((request as any).class || request.quote_data?.class) && (
                <span className="inline-flex items-center gap-1">
                  · Class: <strong className="text-slate-800 dark:text-zinc-200">{(request as any).class || request.quote_data?.class}</strong>
                </span>
              )}
              {((request as any).location || request.quote_data?.location) && (
                <span className="inline-flex items-center gap-1">
                  · Location: <strong className="text-slate-800 dark:text-zinc-200">{(request as any).location || request.quote_data?.location}</strong>
                </span>
              )}
              <span>· {formatDate(request.request_date || request.created_at)}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsScheduleLedgerOpen(true)}
              className="text-xs gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-900/60 dark:text-indigo-300"
            >
              <CalendarClock className="h-4 w-4 text-indigo-600" />
              View Ledger
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="text-xs p-2 h-8 w-8"
              title="Refresh"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            </Button>
          </div>
        </div>

        {/* ── On Hold Banner ── */}
        {isOnHold && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
                <PauseCircle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200 flex items-center gap-2">
                  <span>Recurring Payment is Currently On Hold</span>
                  <Badge variant="outline" className="bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/60 dark:text-rose-300 text-[10px] py-0">
                    Workflow Paused
                  </Badge>
                </h4>
                <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">
                  {request.hold_reason ? `Reason: ${request.hold_reason}` : "Payment workflow is temporarily suspended."}
                  {request.hold_date ? ` (Since ${formatDate(request.hold_date)})` : ""}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() =>
                transitionMutation.mutate({
                  action: "RESUME_WORKFLOW",
                  comment: "Resumed workflow from On Hold",
                })
              }
              disabled={transitionMutation.isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1.5 h-8 font-semibold shadow-2xs"
            >
              <PlayCircle className="h-3.5 w-3.5" />
              {transitionMutation.isPending ? "Resuming..." : "Resume Workflow"}
            </Button>
          </div>
        )}

        {/* ── Workflow Action Bar / Stepper ── */}
        <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
              Workflow Status
            </span>
            <span className="text-xs text-slate-500 dark:text-zinc-400">
              {isOnHold ? (
                <span className="text-rose-600 dark:text-rose-400 font-medium">
                  ⏸ Request is On Hold (Workflow Paused)
                </span>
              ) : isReviewed ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  ✓ Request Reviewed & Verified
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  Action Required: Click 'Mark as Reviewed' to unlock invoice records & settlement
                </span>
              )}
            </span>
          </div>

          {/* Stepper Pipeline */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {workflowSteps.map((step, idx) => {
              const isCompleted = currentStepIndex > idx || parsedStatus === RequestStatus.Completed;
              const isCurrent = currentStepIndex === idx;

              return (
                <div
                  key={step.key}
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-xs transition-all ${
                    isCurrent
                      ? isOnHold
                        ? "bg-rose-50/80 border-rose-300 dark:bg-rose-950/50 dark:border-rose-800 text-rose-950 dark:text-rose-200 font-bold shadow-2xs"
                        : "bg-indigo-50/80 border-indigo-300 dark:bg-indigo-950/50 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200 font-bold shadow-2xs"
                      : isCompleted
                      ? "bg-slate-50 border-slate-200 dark:bg-zinc-800/40 dark:border-zinc-800 text-slate-600 dark:text-zinc-400"
                      : "bg-white dark:bg-zinc-950 border-dashed border-slate-200 dark:border-zinc-800 text-slate-400"
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isCurrent
                        ? isOnHold
                          ? "bg-rose-600 text-white"
                          : "bg-indigo-600 text-white"
                        : isCompleted
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-200 dark:bg-zinc-800 text-slate-500"
                    }`}
                  >
                    {isCompleted ? <Check className="h-3 w-3" /> : idx + 1}
                  </div>
                  <span className="truncate">{step.label}</span>
                </div>
              );
            })}
          </div>

          {/* Action Prompt Banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 flex items-center justify-between flex-wrap gap-3">
            <div className="text-xs text-slate-700 dark:text-zinc-300 flex items-center gap-2">
              <span className="font-bold text-indigo-600 dark:text-indigo-400">Action Required:</span>
              {isOnHold ? (
                <span>Payment workflow is currently <strong>ON HOLD</strong>. Click 'Resume Workflow' to reactivate schedule processing.</span>
              ) : !isReviewed ? (
                <span>Review pending. Click <strong>'Mark as Reviewed'</strong> to enable invoice records and milestone settlements.</span>
              ) : parsedStatus === RequestStatus.InvoiceReceived ? (
                <span>
                  Cycle {Math.min(currentCycle, totalCycles || currentCycle)} invoice received. Confirm settlement to return to <strong>Waiting Payment (Cycle {Math.min(currentCycle + 1, totalCycles || currentCycle + 1)})</strong>.
                </span>
              ) : parsedStatus === RequestStatus.WaitingPayment ? (
                <span>
                  Waiting for Cycle {Math.min(currentCycle, totalCycles || currentCycle)} payment {request.due_date ? `(Due: ${formatDate(request.due_date)})` : ""}. Record invoice from the schedule breakdown below when received.
                </span>
              ) : parsedStatus === RequestStatus.Completed ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  All recurring installment cycles have been completed.
                </span>
              ) : (
                <span>Request is verified. Manage upcoming cycle milestones from the schedule breakdown below.</span>
              )}
            </div>

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
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1.5 h-8 font-semibold shadow-2xs"
                >
                  <PlayCircle className="h-3.5 w-3.5" />
                  {transitionMutation.isPending ? "Resuming..." : "Resume Workflow"}
                </Button>
              ) : !isReviewed ? (
                <Button
                  size="sm"
                  onClick={() => reviewMutation.mutate("REVIEWED")}
                  disabled={reviewMutation.isPending}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5 h-8 font-semibold shadow-2xs"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Mark as Reviewed
                </Button>
              ) : (
                <>
                  {parsedStatus === RequestStatus.InvoiceReceived && (
                    <Button
                      size="sm"
                      onClick={() =>
                        transitionMutation.mutate({
                          action: "COMPLETE",
                          comment: `Settled cycle ${currentCycle} payment and advanced recurring cycle`,
                        })
                      }
                      disabled={transitionMutation.isPending}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5 h-8 font-semibold shadow-2xs"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                      {allCyclesCompleted || (totalCycles && currentCycle >= totalCycles)
                        ? "Confirm Settlement & Mark Completed"
                        : `Confirm Payment & Advance to Cycle ${currentCycle + 1}`}
                    </Button>
                  )}
                  {allCyclesCompleted && parsedStatus !== RequestStatus.Completed && parsedStatus !== RequestStatus.InvoiceReceived && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        transitionMutation.mutate({
                          action: "COMPLETE",
                          comment: "Completed recurring billing item",
                        })
                      }
                      disabled={transitionMutation.isPending}
                      className="text-xs h-8 text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Mark Completed
                    </Button>
                  )}
                  {canPutOnHold && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsHoldDialogOpen(true)}
                      disabled={transitionMutation.isPending}
                      className="text-xs h-8 text-rose-700 border-rose-300 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-300 font-medium"
                    >
                      <PauseCircle className="h-3.5 w-3.5 mr-1 text-rose-600" />
                      Put on Hold
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── ALL PAYMENTS & ACTION SCHEDULE ── */}
      <Card className="shadow-xs border-indigo-100 dark:border-zinc-800">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800 flex flex-row items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-zinc-100">
              <CalendarClock className="h-5 w-5 text-indigo-600" />
              <span>All Payments & Action Items</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Complete breakdown of every scheduled payment cycle, settled status, and next actions.
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 border-indigo-200">
            {isOngoing
              ? `Ongoing Schedule · Cycle ${currentCycle} Active`
              : `${totalCycles || allInstallments.length} Total ${(totalCycles || allInstallments.length) === 1 ? 'Payment' : 'Payments'}`}
          </Badge>
        </CardHeader>

        <CardContent className="p-0 text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/60 text-slate-600 dark:text-zinc-400 font-semibold">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Scheduled Date</th>
                  <th className="py-3 px-4 text-right">Cycle Amount</th>
                  <th className="py-3 px-4 text-right">Balance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">What Needs to Be Done</th>
                  <th className="py-3 px-3 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {allInstallments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      No payment dates generated. Edit the schedule to set frequency or installment dates.
                    </td>
                  </tr>
                ) : (
                  allInstallments.map((inst) => {
                    const isPaid = inst.status === "PAID";
                    const isCurrent = inst.status === "CURRENT";
                    const isExpanded = expandedInstallments[inst.installmentNumber] ?? isCurrent;

                    return (
                      <React.Fragment key={inst.installmentNumber}>
                        <tr
                          onClick={() =>
                            setExpandedInstallments((prev) => ({
                              ...prev,
                              [inst.installmentNumber]: !isExpanded,
                            }))
                          }
                          className={`cursor-pointer hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors ${
                            isCurrent ? "bg-indigo-50/40 dark:bg-indigo-950/20 font-medium" : ""
                          }`}
                        >
                          <td className="py-3 px-4 text-center font-bold text-slate-500">
                            {inst.installmentNumber}
                          </td>
                          <td className="py-3 px-4 font-mono">
                            {formatDate(inst.dueDate)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-zinc-100">
                            {formatMoney(inst.amount)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                            {formatMoney(inst.balance !== undefined && inst.balance !== null ? inst.balance : inst.cumulativeAmount)}
                          </td>
                          <td className="py-3 px-4">
                            {isPaid ? (
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 font-semibold gap-1 text-[11px] py-0.5">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Settled / Paid
                              </Badge>
                            ) : isCurrent ? (
                              <Badge className="bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 font-semibold gap-1 text-[11px] py-0.5">
                                <Clock className="h-3 w-3 text-amber-600" /> Due Now
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-slate-500 border-slate-200 dark:text-zinc-400 text-[11px] py-0.5">
                                Upcoming / Projected
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-700 dark:text-zinc-300">
                            {isPaid ? (
                              <span className="text-emerald-700 dark:text-emerald-400 text-[11px] flex items-center gap-1 font-medium">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                Payment settled & recorded
                              </span>
                            ) : isCurrent ? (
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-7 px-2.5 gap-1.5 font-semibold shadow-2xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenRecordPayment(inst);
                                  }}
                                >
                                  <Receipt className="h-3.5 w-3.5" />
                                  Record Payment
                                </Button>
                                <span className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3 text-amber-600" />
                                  Due Now
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-[11px]">
                                Upcoming cycle
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 mx-auto text-indigo-600 dark:text-indigo-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 mx-auto" />
                            )}
                          </td>
                        </tr>

                        {/* Accordion Drawer for Interest, Principal Paid & Details */}
                        {isExpanded && (
                          <tr className="bg-slate-50/80 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-zinc-800">
                            <td colSpan={7} className="py-3 px-8">
                              <div className="flex flex-wrap items-center gap-6 text-xs">
                                <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-zinc-700">
                                  <span className="text-muted-foreground font-medium">Interest:</span>
                                  <span className="font-mono font-semibold text-slate-800 dark:text-zinc-200">
                                    {inst.interest !== undefined && inst.interest !== null ? formatMoney(inst.interest) : "—"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-zinc-700">
                                  <span className="text-muted-foreground font-medium">Principal Paid:</span>
                                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                    {inst.principal_paid !== undefined && inst.principal_paid !== null ? formatMoney(inst.principal_paid) : "—"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-zinc-700">
                                  <span className="text-muted-foreground font-medium">Remaining Balance:</span>
                                  <span className="font-mono font-semibold text-slate-700 dark:text-zinc-300">
                                    {formatMoney(inst.balance !== undefined && inst.balance !== null ? inst.balance : inst.cumulativeAmount)}
                                  </span>
                                </div>
                                {inst.note && (
                                  <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <span className="font-medium">Note:</span>
                                    <span className="italic">{inst.note}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Primary Column (7 cols): Request Details & Invoices */}
        <div className="lg:col-span-7 space-y-6">
          {/* Request Details Property Table */}
          <Card className="shadow-xs border-slate-200 dark:border-zinc-800">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800/80">
              <CardTitle className="text-base font-bold flex items-center justify-between">
                <span>Request Details</span>
                <Badge variant="outline" className="text-xs font-normal">
                  ID: #{request.id}
                </Badge>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0 divide-y divide-slate-100 dark:divide-zinc-800/60 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-zinc-800/60">
                <div className="p-3.5 flex justify-between gap-2">
                  <span className="text-muted-foreground font-medium">Requester</span>
                  <span className="font-semibold text-slate-900 dark:text-zinc-100 text-right">
                    {request.requester}
                  </span>
                </div>
                <div className="p-3.5 flex justify-between gap-2">
                  <span className="text-muted-foreground font-medium">Assigned To</span>
                  <span className="font-semibold text-slate-900 dark:text-zinc-100 text-right">
                    {request.assigned_user || "David Caro / David Hernandez"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-zinc-800/60">
                <div className="p-3.5 flex justify-between gap-2">
                  <span className="text-muted-foreground font-medium">Type</span>
                  <Badge variant="outline" className="text-[11px] bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold py-0">
                    Recurring
                  </Badge>
                </div>
                <div className="p-3.5 flex justify-between items-center gap-2">
                  <span className="text-muted-foreground font-medium">Priority</span>
                  <PrioritySelector
                    requestId={request.id}
                    priority={request.priority}
                    size="xs"
                  />
                </div>
                <div className="p-3.5 flex justify-between gap-2">
                  <span className="text-muted-foreground font-medium">Payment Method</span>
                  <span className="font-semibold text-slate-900 dark:text-zinc-100 text-right">
                    {invoice?.payment_status ? "Direct Billing / Auto-Debit" : "—"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-zinc-800/60">
                <div className="p-3.5 flex justify-between gap-2">
                  <span className="text-muted-foreground font-medium">Requested Date</span>
                  <span className="font-semibold text-slate-900 dark:text-zinc-100 text-right">
                    {formatDate(request.request_date || request.created_at)}
                  </span>
                </div>
                <div className="p-3.5 flex justify-between gap-2">
                  <span className="text-muted-foreground font-medium">Last Updated</span>
                  <span className="font-semibold text-slate-900 dark:text-zinc-100 text-right">
                    {formatDate(request.updated_at)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-zinc-800/60">
                <div className="p-3.5 flex justify-between gap-2">
                  <span className="text-muted-foreground font-medium">Schedule Timeframe & Range</span>
                  <span className="font-semibold text-slate-900 dark:text-zinc-100 text-right">
                    {sched.end_date
                      ? `${formatDate(sched.start_date)} – ${formatDate(sched.end_date)}`
                      : `Indefinite (${formatDate(sched.start_date)} – Ongoing)`}
                  </span>
                </div>
                <div className="p-3.5 flex justify-between gap-2">
                  <span className="text-muted-foreground font-medium">Next Due Date</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 text-right">
                    {request.due_date ? formatDate(request.due_date) : "—"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-zinc-800/60">
                <div className="p-3.5 flex justify-between gap-2">
                  <span className="text-muted-foreground font-medium">Installment Progress</span>
                  <span className="font-semibold text-slate-900 dark:text-zinc-100 text-right">
                    {sched.total_installments 
                      ? `${sched.completed_installments || 0} / ${sched.total_installments} Cycles Completed` 
                      : `${sched.completed_installments || 0} Cycles Completed (Ongoing)`}
                  </span>
                </div>
                <div className="p-3.5 flex justify-between gap-2">
                  <span className="text-muted-foreground font-medium">Currency</span>
                  <span className="font-semibold text-slate-900 dark:text-zinc-100 text-right">
                    {request.currency || "USD"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-zinc-800/60">
                <div className="p-3.5 flex justify-between gap-2">
                  <span className="text-muted-foreground font-medium">Cycle Amount</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-right">
                    {formatMoney(currentCycleAmount, request.currency || "USD")}
                  </span>
                </div>
                <div className="p-3.5 flex justify-between gap-2 bg-slate-50/50 dark:bg-zinc-900/30">
                  <span className="text-muted-foreground font-medium">
                    {totalCommitment != null ? "Total Commitment" : "Cycle Commitment"}
                  </span>
                  <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300 text-right">
                    {totalCommitment != null ? formatMoney(totalCommitment, request.currency || "USD") : `${formatMoney(currentCycleAmount, request.currency || "USD")} / cycle (Ongoing)`}
                  </span>
                </div>
              </div>

              {request.description && (
                <div className="p-3.5 space-y-1">
                  <span className="text-muted-foreground font-medium block">Description</span>
                  <p className="text-slate-800 dark:text-zinc-200 leading-relaxed bg-white dark:bg-zinc-950 p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800">
                    {request.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Wire Transfer Details Card ── */}
          {(requestDetail?.wire_transfer || (request as any)?.wire_transfer) ? (
            <Card className="shadow-xs border-slate-200 dark:border-zinc-800">
              <CardHeader className="bg-indigo-50/40 dark:bg-indigo-950/20 border-b border-slate-100 dark:border-zinc-800 px-6 py-3.5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-semibold text-base">
                  <Landmark className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Wire Transfer Details</span>
                </div>
                <div className="flex items-center gap-2.5">
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
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {(() => {
                  const wt = requestDetail?.wire_transfer || (request as any)?.wire_transfer;
                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Entered By</span>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.entered_by || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Entry Date</span>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">{formatDate(wt.entry_date)}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Payment Date</span>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">{formatDate(wt.payment_date)}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Due Date</span>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">{formatDate(wt.due_date)}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Pay Date (Terms)</span>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.pay_date || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Pay From</span>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.pay_from || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Vendor</span>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.vendor || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">New Vendor?</span>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.is_new_vendor ? "Yes" : "No"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Invoice #</span>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.invoice_number || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Amount</span>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">{formatMoney(wt.amount || 0, wt.currency || "USD")}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Conversion Rate</span>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">
                          {wt.conversion_rate
                            ? `${wt.conversion_rate}${
                                wt.currency &&
                                wt.currency.toUpperCase() !== "USD" &&
                                parseFloat(wt.conversion_rate) > 0
                                  ? ` (≈ $${(
                                      Number(wt.amount || 0) *
                                      parseFloat(wt.conversion_rate)
                                    ).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD)`
                                  : ""
                              }`
                            : (wt.currency || "USD").toUpperCase() === "USD"
                            ? "1.00"
                            : "—"}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Vendor Email</span>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.vendor_email || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Bank Name</span>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.bank_name || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Bank Country</span>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.bank_country || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Tax ID</span>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.tax_id || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Bank Account #</span>
                        <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100 text-xs block break-words">
                          {wt.bank_account_number
                            ? wt.bank_account_number.trim().length > 4
                              ? `•••• •••• ${wt.bank_account_number.trim().slice(-4)}`
                              : wt.bank_account_number
                            : "—"}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Routing (Wire)</span>
                        <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.routing_wire || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Routing (ACH)</span>
                        <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.routing_ach || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">SWIFT Code</span>
                        <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.swift_code || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">BIC</span>
                        <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.bic || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">IBAN</span>
                        <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.iban || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Sort Code</span>
                        <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.sort_code || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Transit Code (CA)</span>
                        <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.transit_code_ca || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Transit Number (CA)</span>
                        <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.transit_number_ca || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Institution Code</span>
                        <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.institution_code || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Branch Code</span>
                        <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.branch_code || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">BSB Australia</span>
                        <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.bsb_australia || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Clearing Code</span>
                        <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.clearing_code || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Bank Code</span>
                        <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.bank_code || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">ABA</span>
                        <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.aba || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Region</span>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.region || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Contact Name (China)</span>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.contact_name_china || "—"}</span>
                      </div>
                      {wt.comments && (
                        <div className="col-span-2 sm:col-span-3">
                          <div className="text-xs text-slate-500 dark:text-zinc-400 mb-1 font-medium">Comments / Memo</div>
                          <div className="text-slate-800 dark:text-zinc-200 whitespace-pre-wrap">{wt.comments}</div>
                        </div>
                      )}
                      {wt.vendor_address && (
                        <div className="col-span-2 sm:col-span-3">
                          <div className="text-xs text-slate-500 dark:text-zinc-400 mb-1 font-medium">Vendor Address</div>
                          <div className="text-slate-800 dark:text-zinc-200 whitespace-pre-wrap">{wt.vendor_address}</div>
                        </div>
                      )}
                      {wt.bank_address && (
                        <div className="col-span-2 sm:col-span-3">
                          <div className="text-xs text-slate-500 dark:text-zinc-400 mb-1 font-medium">Bank Address</div>
                          <div className="text-slate-800 dark:text-zinc-200 whitespace-pre-wrap">{wt.bank_address}</div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-xs border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Landmark className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100 block">Wire Transfer Details</span>
                    <span className="text-[11px] text-muted-foreground block">No wire transfer banking instructions recorded yet for this schedule.</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditWireOpen(true)}
                  className="h-7 text-xs px-2.5 bg-white dark:bg-zinc-900 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 gap-1.5 shadow-xs"
                >
                  <Plus className="h-3 w-3" />
                  <span>Record Wire Info</span>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ── Invoice Details Card (Option A: Collapsible Table with Inline Drawers) ── */}
          <Card className="shadow-xs border-slate-200 dark:border-zinc-800">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-indigo-600" />
                    <span>Invoice & Billing Records</span>
                  </CardTitle>
                  {allInvoices.length > 0 && (
                    <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800">
                      {allInvoices.length} {allInvoices.length === 1 ? 'Record' : 'Records'}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {allInvoices.length > 1 && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setInvoiceSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
                        className="text-xs h-7 px-2 gap-1 text-muted-foreground hover:text-foreground"
                        title={invoiceSortOrder === "desc" ? "Showing newest first" : "Showing oldest first"}
                      >
                        <ArrowUpDown className="h-3 w-3" />
                        <span>{invoiceSortOrder === "desc" ? "Newest First" : "Oldest First"}</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const isAll = allInvoices.every((inv, idx) => expandedInvoices[inv.id || idx]);
                          const next: Record<string | number, boolean> = {};
                          allInvoices.forEach((inv, idx) => {
                            next[inv.id || idx] = !isAll;
                          });
                          setExpandedInvoices(next);
                        }}
                        className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
                      >
                        {allInvoices.every((inv, idx) => expandedInvoices[inv.id || idx]) ? "Collapse All" : "Expand All"}
                      </Button>
                    </>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenRecordPayment(allInstallments.find(i => i.status === "CURRENT") || allInstallments[0])}
                    className="text-xs h-7 gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Record Invoice
                  </Button>
                </div>
              </div>

              {/* Summary KPI Roll-Up Banner for Multiple Records */}
              {allInvoices.length > 0 && (() => {
                const totalInvoiced = allInvoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
                const schedTotal = totalCommitment;
                const progressPct = schedTotal && schedTotal > 0 ? Math.min(100, Math.round((totalInvoiced / schedTotal) * 100)) : null;

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800/80">
                    <div className="p-2.5 rounded-lg bg-slate-50/80 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
                      <div className="text-[11px] font-medium text-muted-foreground">Total Settled</div>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          {formatMoney(totalInvoiced)}
                        </span>
                        {schedTotal != null && schedTotal > 0 && (
                          <span className="text-[11px] font-mono text-muted-foreground">
                            / {formatMoney(schedTotal)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50/80 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
                      <div className="text-[11px] font-medium text-muted-foreground">Settled Cycles</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                          {totalCycles
                            ? `${allInvoices.length} of ${totalCycles} Cycles`
                            : `${allInvoices.length} ${allInvoices.length === 1 ? 'Cycle Settled (Ongoing)' : 'Cycles Settled (Ongoing)'}`}
                        </span>
                        {progressPct !== null && (
                          <Badge variant="secondary" className="text-[10px] font-mono py-0 px-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            {progressPct}%
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="col-span-2 sm:col-span-1 p-2.5 rounded-lg bg-slate-50/80 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
                      <div className="text-[11px] font-medium text-muted-foreground">Avg per Billing</div>
                      <div className="text-sm font-bold font-mono text-slate-800 dark:text-zinc-200 mt-0.5">
                        {formatMoney(totalInvoiced / (allInvoices.length || 1))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardHeader>

            <CardContent className="p-0 text-xs">
              {allInvoices.length > 0 ? (() => {
                const sortedInvoices = [...allInvoices].sort((a, b) => {
                  const dateA = new Date(a.invoice_date || a.created_at || 0).getTime();
                  const dateB = new Date(b.invoice_date || b.created_at || 0).getTime();
                  return invoiceSortOrder === "desc" ? dateB - dateA : dateA - dateB;
                });

                return (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/80 dark:bg-zinc-900/80 border-b border-slate-200/80 dark:border-zinc-800">
                        <TableHead className="w-[100px] text-xs font-semibold">Record</TableHead>
                        <TableHead className="text-xs font-semibold">Bill Date</TableHead>
                        <TableHead className="text-xs font-semibold">Vendor</TableHead>
                        <TableHead className="text-xs font-semibold">Bank Account</TableHead>
                        <TableHead className="text-xs font-semibold">Category (GL)</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Amount</TableHead>
                        <TableHead className="w-[140px] text-xs font-semibold text-center">Status</TableHead>
                        <TableHead className="w-[45px] text-center"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedInvoices.map((inv, idx) => {
                        const key = inv.id || idx;
                        const isExpanded = !!expandedInvoices[key];
                        const recordNum = invoiceSortOrder === "desc" ? allInvoices.length - idx : idx + 1;

                        return (
                          <React.Fragment key={key}>
                            <TableRow
                              className={cn(
                                "cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-zinc-800/50",
                                isExpanded && "bg-slate-50/60 dark:bg-zinc-800/40"
                              )}
                              onClick={() => setExpandedInvoices(prev => ({ ...prev, [key]: !prev[key] }))}
                            >
                              <TableCell className="font-semibold py-2.5">
                                <div className="flex items-center gap-1.5">
                                  <Badge variant="outline" className="text-[10px] font-mono py-0 px-1.5 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300">
                                    #{inv.id || recordNum}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="font-medium text-slate-900 dark:text-zinc-100 whitespace-nowrap py-2.5">
                                {formatDate(inv.invoice_date || inv.created_at)}
                              </TableCell>
                              <TableCell className="text-slate-700 dark:text-zinc-300 font-medium max-w-[160px] truncate py-2.5">
                                {inv.vendor || request.title}
                              </TableCell>
                              <TableCell className="py-2.5">
                                {renderBankAccountBadge(inv.bank_account || (request as any)?.bank_account, glCodes)}
                              </TableCell>
                              <TableCell className="py-2.5">
                                {renderCategoryBadge(inv.gl_code || (inv as any)?.category || request.gl_code, glCodes)}
                              </TableCell>
                              <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap py-2.5">
                                {formatMoney(inv.amount)}
                              </TableCell>
                              <TableCell className="text-center py-2.5">
                                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 font-semibold py-0 whitespace-nowrap">
                                  {inv.paid_date ? `Settled · ${formatDate(inv.paid_date)}` : "Settled · " + formatDate(inv.invoice_date)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center p-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedInvoices(prev => ({ ...prev, [key]: !prev[key] }));
                                  }}
                                >
                                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                </Button>
                              </TableCell>
                            </TableRow>

                            {/* Collapsible Row Drawer */}
                            {isExpanded && (
                              <TableRow className="bg-slate-50/60 dark:bg-zinc-800/30 hover:bg-slate-50/60 border-b border-slate-200 dark:border-zinc-800">
                                <TableCell colSpan={8} className="p-0">
                                  <div className="p-3.5 sm:p-4 bg-slate-50/80 dark:bg-zinc-800/50 border-t border-b border-slate-200/60 dark:border-zinc-700/60 space-y-3">
                                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/50 dark:border-zinc-700/50">
                                      <div className="font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                                        <span>Billing Record #{recordNum} Details</span>
                                        <span className="font-mono text-slate-400 font-normal">ID #{inv.id}</span>
                                      </div>
                                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                                        {formatMoney(inv.amount)}
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                      <div className="p-2.5 rounded-md bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800">
                                        <div className="text-muted-foreground font-medium flex items-center gap-1 mb-1">
                                          <span>Asset Flag</span>
                                          <HelpIcon text="Asset Flag designates whether this invoice represents a Capitalized Fixed Asset (CapEx) — such as equipment, hardware, lease/financing agreements, or software licenses — rather than an immediate operational expense (OpEx). When checked, the cost is capitalized on the balance sheet and depreciated/amortized over time instead of expensed in full in the current period. It automatically defaults to active for Scheduled Payments, Recurring obligations, and Accounts Payable." />
                                        </div>
                                        <span className="font-semibold text-slate-900 dark:text-zinc-100">
                                          {inv.asset_flag ? "Yes (Capitalized Asset)" : "No (OpEx)"}
                                        </span>
                                      </div>

                                      <div className="p-2.5 rounded-md bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800">
                                        <div className="text-muted-foreground font-medium mb-1">Date Arrived</div>
                                        <span className="font-semibold text-slate-900 dark:text-zinc-100">
                                          {formatDate(inv.created_at)}
                                        </span>
                                      </div>

                                      <div className="p-2.5 rounded-md bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800">
                                        <div className="text-muted-foreground font-medium mb-1">Department / Location</div>
                                        <span className="font-semibold text-slate-900 dark:text-zinc-100">
                                          {inv.department || request.department || "General"} {inv.from_location ? `· ${inv.from_location}` : ""}
                                        </span>
                                      </div>

                                      <div className="p-2.5 rounded-md bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800">
                                        <div className="text-muted-foreground font-medium mb-1">Payment Settlement</div>
                                        <span className="font-semibold text-slate-900 dark:text-zinc-100">
                                          {inv.paid_date ? formatDate(inv.paid_date) : formatDate(inv.invoice_date)}
                                        </span>
                                      </div>
                                    </div>

                                    {(inv.interest != null || inv.principal_paid != null || inv.balance != null) && (
                                      <div className="grid grid-cols-3 gap-3 text-xs">
                                        <div className="p-2.5 rounded-md bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800">
                                          <div className="text-muted-foreground font-medium mb-1">Interest</div>
                                          <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100">
                                            {inv.interest != null ? formatMoney(inv.interest) : "—"}
                                          </span>
                                        </div>
                                        <div className="p-2.5 rounded-md bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800">
                                          <div className="text-muted-foreground font-medium mb-1">Principal Paid</div>
                                          <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100">
                                            {inv.principal_paid != null ? formatMoney(inv.principal_paid) : "—"}
                                          </span>
                                        </div>
                                        <div className="p-2.5 rounded-md bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800">
                                          <div className="text-muted-foreground font-medium mb-1">Remaining Balance</div>
                                          <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100">
                                            {inv.balance != null ? formatMoney(inv.balance) : "—"}
                                          </span>
                                        </div>
                                      </div>
                                    )}

                                    {inv.description && (
                                      <div className="p-2.5 rounded-md bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 text-xs">
                                        <span className="text-muted-foreground font-medium block mb-0.5">Description / Memo</span>
                                        <span className="text-slate-800 dark:text-zinc-200 italic">
                                          {inv.description}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                );
              })() : (
                <div className="p-6 text-center text-muted-foreground space-y-2">
                  <Receipt className="h-8 w-8 mx-auto text-slate-300 dark:text-zinc-700" />
                  <p className="text-xs">No invoice recorded for this recurring schedule item yet.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenRecordPayment(allInstallments[0])}
                    className="text-xs mt-2"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Record First Invoice
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (5 cols): Scheduled Horizon & Tabbed Activity */}
        <div className="lg:col-span-5 space-y-6">
          {/* Scheduled Range & Payment Horizon Card */}
          <Card className="shadow-xs border-indigo-100 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-zinc-900">
            <CardHeader className="pb-3 border-b border-indigo-100 dark:border-indigo-900/40">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-indigo-600" />
                  <span>Scheduled Range & Payment Horizon</span>
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4 text-xs">
              {/* Scheduled Horizon Range */}
              <div className="space-y-1">
                <span className="text-muted-foreground font-medium">Scheduled Horizon</span>
                <div className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <span>{formatDate(sched.start_date)}</span>
                  <span className="text-slate-400 font-normal">to</span>
                  <span>{sched.end_date ? formatDate(sched.end_date) : "Ongoing"}</span>
                </div>
              </div>

              {/* Remaining Duration Banner */}
              <div className="p-3 rounded-xl bg-white dark:bg-zinc-950 border border-indigo-100 dark:border-indigo-900/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Remaining Duration</span>
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold text-[11px]">
                    {durationInfo.text}
                  </Badge>
                </div>
                <div className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  {isCustomMilestones
                    ? `${sched.schedule_dates?.length || sched.total_installments || 0} Milestone Dates (${formatMoney(currentCycleAmount)} / ${allCyclesCompleted ? "last milestone" : "cycle"})`
                    : `${FREQUENCY_LABELS[sched.frequency as FrequencyType] || "Monthly"} (${formatMoney(currentCycleAmount)} / cycle)`}
                </div>
              </div>

              {/* Cycle Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-slate-600 dark:text-zinc-400">Cycle Progress</span>
                  <span className="text-slate-900 dark:text-zinc-100">
                    {sched.total_installments 
                      ? `${sched.completed_installments || 0} / ${sched.total_installments} Cycles (${Math.min(100, Math.round(((sched.completed_installments || 0) / sched.total_installments) * 100))}%)`
                      : `${sched.completed_installments || 0} Cycles Settled`}
                  </span>
                </div>
                {sched.total_installments ? (
                  <div className="w-full bg-slate-200 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            ((sched.completed_installments || 0) / sched.total_installments) * 100
                          )
                        )}%`,
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-xs">
                    <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-semibold">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span>Ongoing Subscription</span>
                    </div>
                    <Badge variant="outline" className="bg-white dark:bg-zinc-900 border-indigo-200 dark:border-indigo-800 text-[10px] text-indigo-700 dark:text-indigo-300 font-bold">
                      Cycle {(sched.completed_installments || 0) + 1} Active
                    </Badge>
                  </div>
                )}
              </div>

              {/* Total Commitment Summary Box */}
              <div className="p-3.5 rounded-xl bg-indigo-600 text-white space-y-1 shadow-xs">
                <div className="text-[11px] font-medium text-indigo-200">
                  {totalCommitment != null ? "Total Commitment" : "Cycle Commitment"}
                </div>
                <div className="text-xl font-black font-mono tracking-tight">
                  {totalCommitment != null 
                    ? formatMoney(totalCommitment) 
                    : `${formatMoney(sched.amount_per_cycle || request.amount)} / cycle`}
                </div>
                <div className="text-[11px] text-indigo-100 flex items-center justify-between pt-1 border-t border-indigo-500/60">
                  <span>{formatMoney(paidToDate)} paid to date</span>
                  <span>
                    {totalCommitment != null 
                      ? `${formatMoney(Math.max(0, totalCommitment - paidToDate))} remaining` 
                      : "Ongoing Billing"}
                  </span>
                </div>
              </div>

              {/* Ledger Breakdown Modal Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsScheduleLedgerOpen(true)}
                className="w-full text-xs font-semibold bg-white dark:bg-zinc-950 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 gap-1.5"
              >
                <CalendarClock className="h-3.5 w-3.5 text-indigo-600" />
                View Full Milestone Schedule / Ledger
              </Button>
            </CardContent>
          </Card>

          {/* ── Tabs: Approvals, Attachments & History ── */}
          <Card className="shadow-xs border-slate-200 dark:border-zinc-800">
            <Tabs defaultValue="approvals" className="w-full">
              <CardHeader className="p-3 pb-0 border-b border-slate-100 dark:border-zinc-800">
                <TabsList className="grid grid-cols-3 w-full h-8 bg-slate-100 dark:bg-zinc-800">
                  <TabsTrigger value="approvals" className="text-xs">
                    Approvals ({approvals.length})
                  </TabsTrigger>
                  <TabsTrigger value="attachments" className="text-xs">
                    Attachments ({attachments.length})
                  </TabsTrigger>
                  <TabsTrigger value="history" className="text-xs">
                    History ({history.length})
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent className="p-4 text-xs">
                {/* Approvals Tab */}
                <TabsContent value="approvals" className="mt-0 space-y-4">
                  {/* SECTION 1: WHO CAN APPROVE */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Who Can Approve</span>
                      <span className="text-[10px] font-normal normal-case text-slate-400">
                        {request?.requires_second_level ? "2-Level Approval Required" : "1-Level Approval Required"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {/* Level 1 Approver Card */}
                      <div className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs space-y-2.5">
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 shrink-0 mt-0.5">
                              <Building2 className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 dark:text-zinc-100 leading-snug break-words">
                                {request?.level_1_approver_name && request?.level_1_approver_name !== "Unassigned"
                                  ? request.level_1_approver_name
                                  : request?.assigned_user && request?.assigned_user !== "Unassigned"
                                  ? request.assigned_user
                                  : "Department Level 1 Approver"}
                              </div>
                              <div className="text-[10.5px] text-slate-500 dark:text-zinc-400 mt-0.5">
                                Level 1 • Department / Manager Approver
                              </div>
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center">
                            {request?.level_1_approved_at || request?.status === "APPROVED" || request?.status === "PURCHASED" || request?.status === "SHIPPED" || request?.status === "GOODS_RECEIVED" || request?.status === "INVOICE_RECEIVED" || request?.status === "COMPLETED" ? (
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-[10px] font-medium gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Approved
                              </Badge>
                            ) : request?.status === "REJECTED" ? (
                              <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 text-[10px] font-medium">
                                Rejected
                              </Badge>
                            ) : request?.status === "WAITING_APPROVAL" && (request?.current_approval_level || 1) === 1 ? (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 text-[10px] font-medium gap-1">
                                <Clock className="h-3 w-3 animate-pulse" /> Pending Review
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 text-[10px] font-normal">
                                Scheduled
                              </Badge>
                            )}
                          </div>
                        </div>

                        {!request?.level_1_approved_at && request?.status !== "COMPLETED" && request?.status !== "REJECTED" && (
                          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                            <span className="text-[10px] text-slate-400">Need to change routing?</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setIsChangeApproverOpen(true)}
                              className="h-6 px-2.5 text-[10.5px] font-semibold text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/50 dark:bg-indigo-950/40 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/60 gap-1 rounded-md cursor-pointer"
                              title="Change Level 1 Approver"
                            >
                              <UserCheck className="h-3 w-3" />
                              <span>Change Approver</span>
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Level 2 Approver Card */}
                      {(request?.requires_second_level || (request?.amount && Number(request.amount) >= 10000) || request?.level_2_approver_name || request?.second_level_requested) && (
                        <div className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs space-y-2.5">
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div className="p-1.5 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 shrink-0 mt-0.5">
                                <ShieldCheck className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-900 dark:text-zinc-100 leading-snug break-words">
                                  {request?.level_2_approver_name && request?.level_2_approver_name !== "Unassigned"
                                    ? request.level_2_approver_name
                                    : "Shaun Passley (CEO)"}
                                </div>
                                <div className="text-[10.5px] text-purple-600 dark:text-purple-400 mt-0.5 flex items-center gap-1">
                                  <span>Level 2 • Company Approver</span>
                                  <span className="text-[9.5px] px-1 py-0.2 rounded bg-purple-100 dark:bg-purple-900/60 font-medium">≥ $10k</span>
                                </div>
                              </div>
                            </div>
                            <div className="shrink-0 flex items-center">
                              {request?.level_2_approved_at || (request?.status === "APPROVED" && (request?.current_approval_level || 1) >= 2) || (request?.status === "PURCHASED" && request?.requires_second_level) ? (
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-[10px] font-medium gap-1">
                                  <CheckCircle2 className="h-3 w-3" /> Approved
                                </Badge>
                              ) : request?.status === "REJECTED" ? (
                                <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 text-[10px] font-medium">
                                  Rejected
                                </Badge>
                              ) : request?.status === "WAITING_APPROVAL" && request?.current_approval_level === 2 ? (
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800 text-[10px] font-medium gap-1">
                                  <Clock className="h-3 w-3 animate-pulse" /> Pending L2 Review
                                </Badge>
                              ) : request?.status === "WAITING_APPROVAL" && (request?.current_approval_level || 1) === 1 ? (
                                <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 text-[10px] font-normal">
                                  Awaiting Level 1
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 text-[10px] font-normal">
                                  Scheduled
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SECTION 2: WHO APPROVED IT */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                      Who Approved It
                    </div>

                    {approvals.length === 0 ? (
                      <div className="py-3 px-3 rounded-lg border border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 text-center">
                        <p className="text-xs text-slate-600 dark:text-zinc-400 font-medium">No review actions recorded yet</p>
                        <p className="text-[10.5px] text-muted-foreground mt-0.5">
                          Sign-off history, comments, and decision timestamps will appear here once reviewed.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {approvals.map((a) => (
                          <div key={a.id} className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/50 space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-zinc-200">
                                  {(a.approver || "U").slice(0, 2).toUpperCase()}
                                </div>
                                <span className="font-semibold text-xs text-slate-900 dark:text-zinc-100">{a.approver}</span>
                              </div>
                              <Badge variant="outline" className={a.decision === "APPROVED" ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 text-[10px]" : "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800 text-[10px]"}>
                                {a.decision === "APPROVED" ? "Approved" : "Rejected"}
                              </Badge>
                            </div>
                            {a.comment && (
                              <div className="text-xs text-slate-700 dark:text-zinc-300 bg-white/80 dark:bg-zinc-800/80 p-2 rounded border border-slate-100 dark:border-zinc-700/60 leading-relaxed">
                                {a.comment}
                              </div>
                            )}
                            <div className="text-[10px] text-muted-foreground flex items-center justify-between">
                              <span>Recorded Sign-off</span>
                              <span>{formatDate(a.approval_date)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Attachments Tab */}
                <TabsContent value="attachments" className="mt-0 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Files ({attachments.length})
                    </span>
                    <div>
                      <input
                        id="tab-attachment-upload-input"
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            const files = Array.from(e.target.files);
                            uploadMutation.mutate(files);
                            e.target.value = "";
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1.5 border-slate-200 dark:border-zinc-800"
                        onClick={() => document.getElementById("tab-attachment-upload-input")?.click()}
                        disabled={uploadMutation.isPending}
                      >
                        {uploadMutation.isPending ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <UploadCloud className="h-3.5 w-3.5 text-indigo-600" />
                        )}
                        Upload File
                      </Button>
                    </div>
                  </div>

                  {attachments.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground space-y-1.5 border border-dashed rounded-lg border-slate-200 dark:border-zinc-800">
                      <Paperclip className="h-7 w-7 mx-auto text-slate-300 dark:text-zinc-700" />
                      <p className="font-semibold text-slate-700 dark:text-zinc-300">No files attached</p>
                      <p className="text-[11px]">Upload invoice receipts, contract agreements, or POs.</p>
                    </div>
                  ) : (
                    attachments.map((att) => (
                      <div
                        key={att.id}
                        className="p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-2 bg-white dark:bg-zinc-950 hover:bg-slate-50/50 dark:hover:bg-zinc-900/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate min-w-0">
                          <FileText className="h-4 w-4 text-indigo-600 shrink-0" />
                          <div className="truncate">
                            <span className="font-medium truncate text-slate-800 dark:text-zinc-200 block">
                              {att.filename}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {Math.round(att.size / 1024)} KB
                              {att.uploaded_by ? ` • by ${att.uploaded_by}` : ""}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 gap-1 cursor-pointer"
                            onClick={() => handlePreviewAttachment(att)}
                            disabled={isLoadingPreview}
                            title="Preview file"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span className="text-[11px]">Preview</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 cursor-pointer"
                            onClick={() => {
                              if (id) {
                                downloadAttachment(id, att.id, att.filename).catch((err) => {
                                  toast.error(err?.message || "Failed to download attachment");
                                });
                              }
                            }}
                            title="Download file"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span className="text-[11px]">Download</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to remove attachment "${att.filename}"?`)) {
                                deleteAttachmentMutation.mutate(att.id);
                              }
                            }}
                            title="Remove attachment"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history" className="mt-0 space-y-2 max-h-60 overflow-y-auto pr-1">
                  {history.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground space-y-1">
                      <History className="h-7 w-7 mx-auto text-slate-300 dark:text-zinc-700" />
                      <p className="font-semibold text-slate-700 dark:text-zinc-300">No activity history yet</p>
                    </div>
                  ) : (
                    history.map((hist) => (
                      <div
                        key={hist.id}
                        className="p-2 rounded-lg bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800 text-[11px] space-y-0.5"
                      >
                        <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-zinc-200">
                          <span>{hist.changed_by_name || hist.changed_by}</span>
                          <span className="text-muted-foreground font-normal text-[10px]">
                            {formatDate(hist.created_at)}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-zinc-400">
                          {hist.action}: {hist.old_value ? `${hist.old_value} ➔ ` : ""}
                          <strong className="text-slate-900 dark:text-zinc-100">{hist.new_value || hist.comment}</strong>
                        </p>
                      </div>
                    ))
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>

      {/* ── Edit Request Modal ── */}
      {isEditOpen && (
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-[1440px] 2xl:max-w-[1600px] max-h-[92vh] overflow-y-auto p-6 sm:p-8 rounded-2xl">
            <form onSubmit={handleEditSubmit} className="space-y-5">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50 shadow-2xs shrink-0">
                    <Edit2 className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold text-slate-900 dark:text-zinc-100">
                      Edit Recurring Payment Request #{request.id}
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      Update recurring subscription details, amount, schedule milestones, and GL account mapping.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 py-2">
                {/* Left Column: General Details */}
                <div className="lg:col-span-6 space-y-4 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Title / Service Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="h-10 text-sm font-medium"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                          Amount (USD) <span className="text-red-500">*</span>
                        </label>
                        {editForm.is_scheduled && editForm.frequency === "CUSTOM" ? (
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                            (Managed by Schedule)
                          </span>
                        ) : editForm.is_scheduled ? (
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                            (Amount per cycle)
                          </span>
                        ) : null}
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-semibold">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={
                            editForm.is_scheduled && editForm.frequency === "CUSTOM" && editForm.schedule_dates.length > 0
                              ? (editForm.schedule_dates.reduce((acc, itm) => acc + (itm.amount != null ? itm.amount : 0), 0) || "").toString()
                              : editForm.amount
                          }
                          onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                          disabled={editForm.is_scheduled && editForm.frequency === "CUSTOM"}
                          className="h-10 text-sm font-mono pl-7 disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed"
                          required={!(editForm.is_scheduled && editForm.frequency === "CUSTOM")}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Next Due Date</label>
                        {editForm.is_scheduled && editForm.frequency === "CUSTOM" && (
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                            (Managed by Schedule)
                          </span>
                        )}
                      </div>
                      <Input
                        type="date"
                        value={
                          editForm.is_scheduled && editForm.frequency === "CUSTOM" && editForm.schedule_dates.length > 0
                            ? (editForm.schedule_dates[0]?.date || editForm.due_date)
                            : editForm.due_date
                        }
                        onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                        disabled={editForm.is_scheduled && editForm.frequency === "CUSTOM"}
                        className="h-10 text-sm disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Requester</label>
                      <Input
                        value={editForm.requester}
                        onChange={(e) => setEditForm({ ...editForm, requester: e.target.value })}
                        className="h-10 text-sm"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Department</label>
                      <Input
                        value={editForm.department}
                        onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                        className="h-10 text-sm"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Priority</label>
                      <Select
                        value={editForm.priority}
                        onValueChange={(val) => setEditForm({ ...editForm, priority: val as Priority })}
                      >
                        <SelectTrigger className="h-10 text-sm">
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="URGENT">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <LocationAutocomplete
                      value={editForm.location}
                      onChange={(val) => setEditForm((prev) => ({ ...prev, location: val }))}
                      placeholder="Search or enter location..."
                      label="Location"
                    />
                  </div>



                  <div className="space-y-1.5 flex-1 flex flex-col">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Description / Terms</label>
                    <textarea
                      className="w-full text-sm rounded-lg border border-input bg-background px-3 py-2.5 flex-1 min-h-[95px] focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    />
                  </div>
                </div>

                {/* Right Column: Schedule Dates Builder */}
                <div className="lg:col-span-6 flex flex-col h-full">
                  <ScheduleDatesBuilder
                    isScheduled={editForm.is_scheduled}
                    onIsScheduledChange={(val) => setEditForm((p) => ({ ...p, is_scheduled: val }))}
                    frequency={editForm.frequency}
                    onFrequencyChange={(val) => setEditForm((p) => ({ ...p, frequency: val }))}
                    startDate={editForm.start_date}
                    onStartDateChange={(val) => setEditForm((p) => ({ ...p, start_date: val }))}
                    endDate={editForm.end_date}
                    onEndDateChange={(val) => setEditForm((p) => ({ ...p, end_date: val }))}
                    scheduleDates={editForm.schedule_dates}
                    onScheduleDatesChange={(dates) => setEditForm((p) => ({ ...p, schedule_dates: dates }))}
                    baseAmount={parseFloat(editForm.amount) || 0}
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5">
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Record Invoice Dialog ── */}
      {isRecordInvoiceOpen && (
        <Dialog open={isRecordInvoiceOpen} onOpenChange={setIsRecordInvoiceOpen}>
          <DialogContent className="sm:max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Receipt className="w-5 h-5 text-indigo-600" />
                <span>Record Payment for #{request.id}</span>
                {selectedInstallment && (
                  <Badge variant="outline" className="text-xs font-mono bg-indigo-50 text-indigo-700 border-indigo-200">
                    Cycle #{selectedInstallment.installmentNumber}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                Record payment details, bank account, and category for billing processing.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleRecordInvoiceSubmit} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Vendor Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={invoiceForm.vendor}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, vendor: e.target.value })}
                  placeholder="e.g. Netflix, AWS"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Amount (USD) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={invoiceForm.amount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Bill Date</label>
                  <Input
                    type="date"
                    value={invoiceForm.invoice_date}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Bank Account <span className="text-red-500">*</span>
                </label>
                <BankAccountAutocomplete
                  value={invoiceForm.bank_account}
                  onChange={(val) => setInvoiceForm({ ...invoiceForm, bank_account: val })}
                  placeholder="Select Bank Account *"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Category <span className="text-red-500">*</span>
                </label>
                <CategoryAutocomplete
                  value={invoiceForm.gl_code}
                  onChange={(val) => setInvoiceForm({ ...invoiceForm, gl_code: val })}
                  placeholder="Select Category *"
                />
              </div>

              {/* Financial Breakdown (Interest, Principal Paid, Remaining Balance) */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 space-y-2">
                <div className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Financial Breakdown (Schedule Details)
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400">Interest</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="—"
                        value={invoiceForm.interest}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, interest: e.target.value })}
                        className="pl-6 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400">Principal Paid</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="—"
                        value={invoiceForm.principal_paid}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, principal_paid: e.target.value })}
                        className="pl-6 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400">Remaining Balance</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="—"
                        value={invoiceForm.balance}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, balance: e.target.value })}
                        className="pl-6 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Notes / Description</label>
                <Input
                  value={invoiceForm.description}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                  placeholder="Optional billing note..."
                />
              </div>

              {/* Receipt & Invoice Attachment Dropzone */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                  <span>Attach Invoice / Receipt (.PDF, .PNG, .JPG)</span>
                  <span className="text-[11px] text-muted-foreground font-normal">Accepted: .pdf, images</span>
                </label>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingPdf(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDraggingPdf(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingPdf(false);
                    const droppedFiles = Array.from(e.dataTransfer.files).filter((f) => {
                      const ext = f.name.split(".").pop()?.toLowerCase() || "";
                      return (
                        ["pdf", "png", "jpg", "jpeg", "webp"].includes(ext) ||
                        f.type.startsWith("image/") ||
                        f.type === "application/pdf"
                      );
                    });
                    if (droppedFiles.length === 0) {
                      toast.error("Please upload PDF or image (.png, .jpg, .jpeg) receipt files");
                      return;
                    }
                    setInvoiceFiles((prev) => [...prev, ...droppedFiles]);
                  }}
                  className={`border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer ${
                    isDraggingPdf
                      ? "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40"
                      : "border-slate-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/30"
                  }`}
                  onClick={() => document.getElementById("invoice-pdf-upload-input")?.click()}
                >
                  <input
                    id="invoice-pdf-upload-input"
                    type="file"
                    accept=".pdf,image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        const selectedFiles = Array.from(e.target.files).filter((f) => {
                          const ext = f.name.split(".").pop()?.toLowerCase() || "";
                          return (
                            ["pdf", "png", "jpg", "jpeg", "webp"].includes(ext) ||
                            f.type.startsWith("image/") ||
                            f.type === "application/pdf"
                          );
                        });
                        if (selectedFiles.length === 0) {
                          toast.error("Please upload PDF or image (.png, .jpg, .jpeg) receipt files");
                          return;
                        }
                        setInvoiceFiles((prev) => [...prev, ...selectedFiles]);
                      }
                    }}
                  />
                  <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                    <div className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                      <UploadCloud className="h-5 w-5" />
                    </div>
                    <div className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Click to upload</span> or drag and drop
                    </div>
                    <p className="text-[11px] text-muted-foreground">PDF invoice copies or payment receipts (max 25MB each)</p>
                  </div>
                </div>

                {/* Staged files for current record */}
                {invoiceFiles.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                      <span>Selected Receipts to Upload ({invoiceFiles.length})</span>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-normal">Will save with this bill</span>
                    </div>
                    {invoiceFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg border bg-white dark:bg-zinc-900 text-xs shadow-2xs"
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <FileText className="h-4 w-4 text-rose-500 shrink-0" />
                          <span className="font-medium text-slate-800 dark:text-zinc-200 truncate">{file.name}</span>
                          <span className="text-[11px] text-muted-foreground shrink-0">
                            ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 gap-1 cursor-pointer"
                            onClick={() => handlePreviewFile(file)}
                          >
                            <Eye className="h-3 w-3" />
                            <span>Preview</span>
                          </Button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setInvoiceFiles((prev) => prev.filter((_, i) => i !== idx));
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                            title="Remove file"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Previously saved attachments on this recurring request */}
                {attachments && attachments.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
                    <div className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                      <span>Saved Receipts &amp; Documents ({attachments.length})</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">Saved in this spot</span>
                    </div>
                    <ul className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {attachments.map((att) => (
                        <li
                          key={att.id}
                          className="flex items-center justify-between gap-2 text-xs bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg px-3 py-1.5 border border-emerald-100 dark:border-emerald-900/30"
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <Receipt className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <span className="truncate text-slate-800 dark:text-zinc-200" title={att.filename}>{att.filename}</span>
                            {att.size ? <span className="text-[10px] text-slate-400 shrink-0">({(att.size / 1024).toFixed(1)} KB)</span> : null}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-[11px] text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 gap-1 cursor-pointer"
                              onClick={() => handlePreviewAttachment(att)}
                              disabled={isLoadingPreview}
                            >
                              <Eye className="h-3 w-3" />
                              <span>Preview</span>
                            </Button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to remove receipt "${att.filename}"?`)) {
                                  deleteAttachmentMutation.mutate(att.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-red-500 rounded cursor-pointer transition-colors"
                              title="Remove saved attachment"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <DialogFooter className="pt-3 border-t">
                <Button type="button" variant="outline" onClick={() => setIsRecordInvoiceOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={recordInvoiceMutation.isPending || uploadMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                >
                  {recordInvoiceMutation.isPending || uploadMutation.isPending ? "Recording..." : "Save Payment"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Schedule Breakdown Ledger Modal ── */}
      <ScheduleBreakdownModal
        request={request}
        open={isScheduleLedgerOpen}
        onOpenChange={setIsScheduleLedgerOpen}
        onEditRequest={() => {
          setIsScheduleLedgerOpen(false);
          handleOpenEdit();
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
