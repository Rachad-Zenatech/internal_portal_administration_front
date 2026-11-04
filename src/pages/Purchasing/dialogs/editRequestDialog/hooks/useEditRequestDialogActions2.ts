import { useEffect, useMemo } from "react";
import { useVendorDirectory } from "@/hooks/usePurchasing";
import { useRef } from "react";
import { toast } from "sonner";
import { calculateInstallmentsCount } from "../../../utils/recurringScheduleUtils";
import { detectTaxWithPriority } from "@/utils/taxRates";
import type { EditRequestDialogProps } from "../types";
import type { useEditRequestDialogActions } from "./useEditRequestDialogActions";

export function useEditRequestDialogActions2(props: EditRequestDialogProps, ctx: ReturnType<typeof useEditRequestDialogActions>) {
  const { request, onOpenChange, wireTransfer } = props;
  const { setItems, items, formData, itemMode, apWireForm, taxFee, setTaxFee, discountFee, shippingFee, updateMutation, schedStartDate, schedFrequency, schedEndDate, isScheduled, schedDates } = ctx;
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        item_order: prev.length,
        description: "",
        quantity: 1,
        unit_price: 0,
        discount: 0,
        tax: 0,
        total: 0,
      },
    ]);
  };
  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };
  const itemsSubtotal = useMemo(() => {
    return items.reduce((sum, itm) => sum + (Number(itm.total) || 0), 0);
  }, [items]);
  const currentSubtotal = useMemo(() => {
    if (itemMode === "MULTIPLE") return itemsSubtotal;
    return (Number(formData.unit_price) || 0) * (Number(formData.quantity) || 1) || (Number(formData.amount) || 0);
  }, [itemMode, itemsSubtotal, formData.unit_price, formData.quantity, formData.amount]);
  const { data: vendorDirectory = {} } = useVendorDirectory();
  const effectiveVendorName = useMemo(() => {
    if (formData.request_type === "ACCOUNTS_PAYABLE") return apWireForm.vendor || "";
    if (wireTransfer?.vendor) return wireTransfer.vendor;
    if (request?.quote_data?.vendor?.name) return request.quote_data.vendor.name;
    if (request?.product_info?.vendor && request.product_info.vendor !== "N/A") return request.product_info.vendor;
    if (formData.title?.includes(" - ")) {
      const candidate = formData.title.split(" - ")[0].trim();
      if (candidate.length > 1 && candidate.length < 50) return candidate;
    }
    return "";
  }, [formData.request_type, apWireForm.vendor, wireTransfer, request, formData.title]);
  const effectiveVendorAddress = useMemo(() => {
    if (formData.request_type === "ACCOUNTS_PAYABLE") return apWireForm.vendor_address || "";
    if (wireTransfer?.vendor_address) return wireTransfer.vendor_address;
    if (request?.quote_data?.vendor?.address) return request.quote_data.vendor.address;
    return "";
  }, [formData.request_type, apWireForm.vendor_address, wireTransfer, request]);
  const taxEstimate = useMemo(() => {
    return detectTaxWithPriority({
      shippingAddress: formData.shipping_address || "",
      vendorAddress: effectiveVendorAddress,
      vendorName: effectiveVendorName,
      knownVendorLocations: vendorDirectory,
      currency: request?.currency || "USD",
    });
  }, [formData.shipping_address, effectiveVendorAddress, effectiveVendorName, vendorDirectory, request?.currency]);
  const estimatedTaxAmount = useMemo(() => {
    if (!taxEstimate || currentSubtotal <= 0) return 0;
    return Math.round(currentSubtotal * taxEstimate.rateDecimal * 100) / 100;
  }, [taxEstimate, currentSubtotal]);
  const prevEstimatedAddrRef = useRef<string>("");
  useEffect(() => {
    const locKey = `${formData.shipping_address || ""}|${effectiveVendorAddress || ""}|${effectiveVendorName || ""}`;
    if (locKey && locKey !== prevEstimatedAddrRef.current) {
      prevEstimatedAddrRef.current = locKey;
      if (taxEstimate && currentSubtotal > 0 && taxFee === 0) {
        setTaxFee(estimatedTaxAmount);
      }
    }
  }, [formData.shipping_address, effectiveVendorAddress, effectiveVendorName, taxEstimate, currentSubtotal, taxFee, estimatedTaxAmount]);
  const calculatedAmount = useMemo(() => {
    if (itemMode === "MULTIPLE") {
      const total = itemsSubtotal + Number(shippingFee || 0) + Number(taxFee || 0) - Number(discountFee || 0);
      return Math.max(0, Math.round(total * 100) / 100);
    }
    if (formData.request_type === "ACCOUNTS_PAYABLE") {
      const val = apWireForm.amount !== undefined && apWireForm.amount !== null && !isNaN(Number(apWireForm.amount))
        ? Number(apWireForm.amount)
        : (formData.amount ? parseFloat(formData.amount) : 0);
      return Math.max(0, Math.round(val * 100) / 100);
    }
    if (formData.request_type === "RECURRING") {
      const val = formData.amount ? parseFloat(formData.amount) : (formData.unit_price ? parseFloat(formData.unit_price) : 0);
      return Math.max(0, Math.round(val * 100) / 100);
    }
    const up = formData.unit_price ? parseFloat(formData.unit_price) : 0;
    const qty = formData.quantity ? parseInt(formData.quantity) : 1;
    return Math.round(up * qty * 100) / 100;
  }, [itemMode, itemsSubtotal, shippingFee, taxFee, discountFee, formData.unit_price, formData.quantity, formData.request_type, formData.amount, apWireForm.amount]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.request_type || !formData.department) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (itemMode === "MULTIPLE" && items.length === 0) {
      toast.error("Please add at least one line item for Multiple Parts mode.");
      return;
    }

    try {
      const unitPrice = formData.unit_price ? parseFloat(formData.unit_price) : 0;
      const quantity = formData.quantity ? parseInt(formData.quantity) : 1;
      const payload: any = {
        title: formData.title,
        request_type: formData.request_type,
        priority: formData.priority,
        requester: formData.requester,
        department: formData.department,
        shipping_address: formData.shipping_address || null,
        phone_number: formData.phone_number || null,
        item_mode: itemMode,
        gl_code: formData.gl_code || null,
        due_date: formData.due_date || null,
        description: formData.description || null,
        amount: calculatedAmount,
        project_name: formData.project_name?.trim() || null,
      };

      if (formData.request_type === "RECURRING" || isScheduled) {
        const isCustom = schedFrequency === "CUSTOM";
        const customDates = isCustom ? schedDates : [];
        const isSched = Boolean(
          isScheduled &&
          (isCustom ? customDates.length > 0 : schedStartDate && schedEndDate)
        );

        let totalCycles: number | null = null;
        let totalAmt: number | null = null;

        if (isSched) {
          if (isCustom) {
            totalCycles = customDates.length;
            totalAmt = customDates.reduce((acc, itm) => acc + (itm.amount || calculatedAmount), 0);
          } else {
            totalCycles = calculateInstallmentsCount(schedStartDate, schedEndDate, schedFrequency);
            totalAmt = totalCycles ? Math.round(calculatedAmount * totalCycles * 100) / 100 : null;
          }
        }

        const effectiveStartDate = isCustom && customDates.length > 0 ? customDates[0].date : schedStartDate;
        const effectiveEndDate = isCustom && customDates.length > 0 ? customDates[customDates.length - 1].date : schedEndDate;

        payload.due_date = formData.due_date || (isSched ? effectiveStartDate : null);
        payload.recurring_schedule = isSched
          ? {
              is_scheduled: true,
              frequency: schedFrequency,
              start_date: effectiveStartDate,
              end_date: effectiveEndDate,
              total_installments: totalCycles,
              completed_installments: request?.recurring_schedule?.completed_installments || 0,
              amount_per_cycle: calculatedAmount,
              total_amount: totalAmt,
              custom_dates: isCustom ? customDates.map((d) => d.date) : null,
              schedule_dates: isCustom ? customDates : null,
            }
          : {
              is_scheduled: false,
              frequency: schedFrequency || "MONTHLY",
              start_date: formData.due_date || schedStartDate || new Date().toISOString().split("T")[0],
              end_date: null,
              total_installments: null,
              completed_installments: request?.recurring_schedule?.completed_installments || 0,
              amount_per_cycle: calculatedAmount,
              total_amount: null,
            };
      }

      if (formData.request_type === "ACCOUNTS_PAYABLE") {
        payload.amount = calculatedAmount;
        payload.unit_price = calculatedAmount;
        payload.quantity = 1;
        payload.item_url = formData.item_url || null;
        payload.items = [];
        payload.due_date = apWireForm.due_date || formData.due_date || null;
        payload.wire_transfer = {
          ...apWireForm,
          amount: calculatedAmount,
          vendor: apWireForm.vendor || formData.title,
        };
      } else if (formData.request_type === "RECURRING") {
        payload.unit_price = calculatedAmount;
        payload.currency = formData.currency || "USD";
        payload.quantity = 1;
        payload.item_url = formData.item_url || null;
        payload.items = [];
      } else if (itemMode === "SINGLE") {
        payload.unit_price = unitPrice;
        payload.quantity = quantity;
        payload.item_url = formData.item_url || null;
        payload.items = [];
      } else {
        payload.items = items;
        payload.quote_data = {
          ...(request.quote_data || {}),
          totals: {
            ...(request.quote_data?.totals || {}),
            subtotal: itemsSubtotal,
            shipping: Number(shippingFee || 0),
            tax: Number(taxFee || 0),
            discount: Number(discountFee || 0),
            total: calculatedAmount,
          },
        };
      }

      await updateMutation.mutateAsync({ id: request.id, data: payload });
      toast.success("Request updated successfully.");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || err?.message || "Failed to update request.");
    }
  };
  return { handleAddItem, handleRemoveItem, itemsSubtotal, currentSubtotal, vendorDirectory, effectiveVendorName, effectiveVendorAddress, taxEstimate, calculatedAmount, handleSubmit };
}
