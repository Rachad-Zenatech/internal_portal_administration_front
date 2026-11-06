import { toast } from "sonner";
import { Clock, ShoppingCart, FileWarning, CheckCircle2 } from "lucide-react";
import { type RequestCreateInput } from "@/types/purchasing";
import { calculateInstallmentsCount } from "../../utils/recurringScheduleUtils";
import { formatMoney } from "../../utils/purchasingMeta";
import { uploadAttachments } from "@/services/purchasingService";
import type { usePurchaseRequestsActions } from "./usePurchaseRequestsActions";
import type { usePurchaseRequestsActions2 } from "./usePurchaseRequestsActions2";

export function usePurchaseRequestsActions3(ctx: ReturnType<typeof usePurchaseRequestsActions> & ReturnType<typeof usePurchaseRequestsActions2>) {
  const { setIsDialogOpen, setShowUnsavedConfirm, isDirty, navigate, quoteFile, quoteExtraction, createMutation, taxEstimate, apWireForm, form, extractedProductInfo, lineItemsCurrency, itemMode, totalCalculatedAmount, schedFrequency, schedEndDate, schedStartDate, isScheduled, schedDates, quoteItems, summary } = ctx;
  const handleRequestClose = () => {
    if (isDirty) {
      setShowUnsavedConfirm(true);
    } else {
      setIsDialogOpen(false);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isAP = form.request_type === "ACCOUNTS_PAYABLE";
    const isRecurring = form.request_type === "RECURRING";
    let effectiveTitle = form.title;
    if (isAP && !effectiveTitle && apWireForm.vendor) {
      effectiveTitle = `Payment for ${apWireForm.vendor}${apWireForm.invoice_number ? ` - Inv #${apWireForm.invoice_number}` : ""}`;
    }

    if (!effectiveTitle || !form.requester || !form.department) {
      toast.error("Title, requester and department are required.");
      return;
    }

    if (isAP && (!apWireForm.vendor?.trim() || !apWireForm.amount || Number(apWireForm.amount) <= 0 || !apWireForm.pay_from?.trim())) {
      toast.error("Please fill in all required wire transfer fields (Vendor, Amount, Pay From, Entered By, Date).");
      return;
    }

    if (isRecurring && (!form.amount || Number(form.amount) <= 0) && (!schedDates.length || schedFrequency !== "CUSTOM")) {
      toast.error("Please enter a recurring payment amount.");
      return;
    }

    if (!isRecurring && itemMode === "MULTIPLE" && quoteItems.length === 0) {
      toast.error("Please upload a quote PDF or add at least one line item for Multiple Parts.");
      return;
    }

    try {
      const sourceQuoteCurrency =
        quoteExtraction?.extraction?.conversion?.original_currency ||
        quoteExtraction?.extraction?.currency;
      const isForeign = Boolean(
        quoteExtraction?.extraction?.conversion?.is_converted &&
        sourceQuoteCurrency === lineItemsCurrency,
      );
      const rate = quoteExtraction?.extraction?.conversion?.exchange_rate || 1.0;
      const quoteCurr = lineItemsCurrency || form.currency || "USD";
      const finalUsdAmount = isForeign ? Math.round(totalCalculatedAmount * rate * 100) / 100 : totalCalculatedAmount;

      const finalItems = itemMode === "MULTIPLE" ? quoteItems.map((itm) => ({
        ...itm,
        converted_unit_price: isForeign ? Math.round(Number(itm.unit_price || 0) * rate * 100) / 100 : Number(itm.unit_price || 0),
        converted_total: isForeign ? Math.round(Number(itm.total || 0) * rate * 100) / 100 : Number(itm.total || 0),
        original_unit_price: Number(itm.unit_price || 0),
        original_total: Number(itm.total || 0),
        original_currency: isForeign ? quoteCurr : undefined,
      })) : undefined;

      const isCustom = schedFrequency === "CUSTOM";
      const customDates = isCustom ? schedDates : [];
      const isSched = Boolean(
        isScheduled &&
        (isCustom ? customDates.length > 0 : schedStartDate && schedEndDate)
      );

      let totalCycles: number | null = null;
      let totalAmt: number | null = null;
      const baseAmt = isCustom && customDates.length > 0
        ? customDates.reduce((acc, itm) => acc + (itm.amount != null ? itm.amount : 0), 0)
        : Number(form.amount || form.unit_price || 0);

      if (isSched) {
        if (isCustom) {
          totalCycles = customDates.length;
          totalAmt = customDates.reduce((acc, itm) => acc + (itm.amount != null ? itm.amount : baseAmt), 0);
        } else {
          totalCycles = calculateInstallmentsCount(schedStartDate, schedEndDate, schedFrequency);
          totalAmt = totalCycles ? Math.round(baseAmt * totalCycles * 100) / 100 : null;
        }
      }

      const effectiveStartDate = isCustom && customDates.length > 0 ? customDates[0].date : (schedStartDate || form.due_date || new Date().toISOString().split("T")[0]);
      const effectiveEndDate = isCustom && customDates.length > 0 ? customDates[customDates.length - 1].date : schedEndDate;

      const recurringScheduleObj = isRecurring ? (isSched ? {
        is_scheduled: true,
        frequency: schedFrequency,
        start_date: effectiveStartDate,
        end_date: effectiveEndDate,
        total_installments: totalCycles,
        completed_installments: 0,
        amount_per_cycle: baseAmt,
        total_amount: totalAmt,
        custom_dates: isCustom ? customDates.map((d) => d.date) : null,
        schedule_dates: isCustom ? customDates : null,
      } : {
        is_scheduled: false,
        frequency: schedFrequency || "MONTHLY",
        start_date: form.due_date || effectiveStartDate,
        end_date: null,
        total_installments: null,
        completed_installments: 0,
        amount_per_cycle: baseAmt,
        total_amount: null,
      }) : undefined;

      const payload: RequestCreateInput = {
        ...form,
        title: effectiveTitle,
        item_mode: isAP || isRecurring ? "SINGLE" : itemMode,
        amount: isAP
          ? (Number(apWireForm.amount) || 0)
          : isRecurring
          ? baseAmt
          : (itemMode === "MULTIPLE" && isForeign ? finalUsdAmount : totalCalculatedAmount),
        unit_price: isRecurring ? baseAmt : form.unit_price,
        currency: isAP
          ? (apWireForm.currency || "USD")
          : itemMode === "MULTIPLE"
          ? (isForeign ? "USD" : lineItemsCurrency)
          : (form.currency || "USD"),
        product_info: extractedProductInfo || form.product_info || undefined,
        due_date: isAP
          ? (apWireForm.due_date || undefined)
          : isRecurring
          ? (form.due_date || effectiveStartDate)
          : undefined,
        recurring_schedule: recurringScheduleObj,
        items: (isAP || isRecurring) ? undefined : finalItems,
        quote_file_id: quoteExtraction?.file_id || undefined,
        quote_data: (isAP || isRecurring) ? undefined : (quoteExtraction ? { ...quoteExtraction.extraction, file_id: quoteExtraction.file_id } : undefined),
        wire_transfer: isAP ? {
          ...apWireForm,
          amount: Number(apWireForm.amount) || 0,
          vendor: apWireForm.vendor || effectiveTitle,
        } : undefined,
        // Tax counts toward the $10k Level 2 threshold (backend uses at least its minimum rate).
        estimated_tax_rate: taxEstimate?.rateDecimal ?? undefined,
      };

      const detail = await createMutation.mutateAsync(payload);
      if (quoteFile && !quoteExtraction?.file_id) {
        try {
          await uploadAttachments(detail.request.id, [quoteFile]);
        } catch (attErr) {
          console.error("Failed to upload quote attachment:", attErr);
          toast.error("Request created, but failed to upload quote attachment.");
        }
      }
      toast.success(isRecurring ? `Recurring request #${detail.request.id} created successfully` : `Request ${detail.request.id} created`);
      setIsDialogOpen(false);
      navigate(`/purchasing/requests/${detail.request.id}`);
    } catch (err) {
      toast.error((err as Error).message || "Failed to create request");
    }
  };
  const cards = [
    { label: "Open Requests", value: summary?.open_requests ?? 0, icon: ShoppingCart, tint: "text-blue-600", statusKey: "OPEN" },
    { label: "Waiting for Review", value: summary?.status_counts?.UNDER_REVIEW ?? 0, icon: Clock, tint: "text-orange-600", statusKey: "UNDER_REVIEW" },
    {
      label: "Unpaid Invoices",
      value: summary?.unpaid_invoices ?? 0,
      sub: summary ? formatMoney(summary.unpaid_amount) : undefined,
      icon: FileWarning,
      tint: "text-fuchsia-600",
      statusKey: "WAITING_PAYMENT",
    },
    { label: "Completed", value: summary?.completed ?? 0, icon: CheckCircle2, tint: "text-green-600", statusKey: "COMPLETED" },
  ];
  return { handleRequestClose, handleSubmit, cards };
}
