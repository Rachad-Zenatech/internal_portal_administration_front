import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { arInvoiceService, type AddonPreviewResponse } from "../../../../../services/arInvoiceService";
import { arQuoteService, type ARQuote } from "../../../../../services/arQuoteService";

export function useAddSeatsAddonsModalActions(props) {
  const { isOpen, onClose, invoiceId, customerId, customerName, onSuccess, targetParentIndex = 0, onAddDirectSubItem } = props;
  // Fetch existing subscriptions for customer
  const { data: subscriptions = [] } = useQuery({
    queryKey: ["ar-customer-subscriptions", customerId],
    queryFn: () => arInvoiceService.getCustomerSubscriptions(customerId),
    enabled: isOpen && !!customerId,
  });
  // Fetch signed quotes for customer
  const { data: allQuotes = [] } = useQuery({
    queryKey: ["ar-quotes"],
    queryFn: () => arQuoteService.listQuotes(),
    enabled: isOpen,
  });
  const customerQuotes = allQuotes.filter(
    (q: ARQuote) =>
      q.customer_response_state === "SIGNED" &&
      (q.customer_id === customerId ||
        q.customer_id === `CUST-${customerId}` ||
        customerId.includes(q.customer_id || "") ||
        (q.customer_name && q.customer_name.toLowerCase() === customerName.toLowerCase()))
  );
  const primarySub = subscriptions.length > 0 ? subscriptions[0] : null;
  // Form State
  const [selectedSubId, setSelectedSubId] = useState<string>("");
  const [additionType, setAdditionType] = useState<"SEATS" | "RECURRING_ADDON" | "ONETIME_FEE">("SEATS");
  const [productName, setProductName] = useState<string>("Additional Seats");
  const [description, setDescription] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("5");
  const [chargeType, setChargeType] = useState<"RECURRING" | "ONE_TIME">("RECURRING");
  const [unitPrice, setUnitPrice] = useState<string>("360");
  const [billingFrequency, setBillingFrequency] = useState<string>("Monthly");
  const [billingStartDateOption, setBillingStartDateOption] = useState<string>("Immediate");
  const [effectiveDate, setEffectiveDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [billingPeriodStart, setBillingPeriodStart] = useState<string>(
    primarySub?.current_period_start || `${new Date().getFullYear()}-01-01`
  );
  const [billingPeriodEnd, setBillingPeriodEnd] = useState<string>(
    primarySub?.current_period_end || `${new Date().getFullYear()}-12-31`
  );
  const [prorationMethod, setProrationMethod] = useState<string>("DAILY_ACTUAL");
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>("");
  const [customerNote, setCustomerNote] = useState<string>("");
  const [selectedParentIdx, setSelectedParentIdx] = useState<number>(targetParentIndex ?? 0);
  useEffect(() => {
    if (targetParentIndex !== undefined) {
      setSelectedParentIdx(targetParentIndex);
    }
  }, [targetParentIndex]);
  // Sync effective date when start date option changes
  const handleStartDateOptionChange = (opt: string) => {
    setBillingStartDateOption(opt);
    const now = new Date();
    if (opt === "First of next month") {
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      setEffectiveDate(format(nextMonth, "yyyy-MM-dd"));
    } else if (opt === "Immediate" || opt === "Upon signing" || opt === "At payment") {
      setEffectiveDate(format(now, "yyyy-MM-dd"));
    }
  };
  // Manual Override State
  const [isManualOverride, setIsManualOverride] = useState<boolean>(false);
  const [overrideCharge, setOverrideCharge] = useState<string>("");
  const [overrideReason, setOverrideReason] = useState<string>("");
  // Live preview calculation state
  const [previewData, setPreviewData] = useState<AddonPreviewResponse | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  // Sync selected subscription defaults
  useEffect(() => {
    if (primarySub && !selectedSubId) {
      setSelectedSubId(primarySub.id);
      setUnitPrice(String(primarySub.unit_price || "360"));
      setBillingPeriodStart(primarySub.current_period_start || `${new Date().getFullYear()}-01-01`);
      setBillingPeriodEnd(primarySub.current_period_end || `${new Date().getFullYear()}-12-31`);
      if (primarySub.billing_frequency) {
        const bf = primarySub.billing_frequency.toUpperCase();
        setBillingFrequency(bf.includes("ANNU") || bf.includes("YEAR") ? "Annually" : bf === "MONTHLY" ? "Monthly" : "Monthly");
      }
    }
  }, [primarySub, selectedSubId]);
  // Handle Addition Type Change
  const handleAdditionTypeChange = (type: "SEATS" | "RECURRING_ADDON" | "ONETIME_FEE") => {
    setAdditionType(type);
    if (type === "SEATS") {
      setProductName("Additional Seats");
      setChargeType("RECURRING");
      setProrationMethod("DAILY_ACTUAL");
      setBillingFrequency("Monthly");
      setUnitPrice(String(primarySub?.unit_price || "360"));
    } else if (type === "RECURRING_ADDON") {
      setProductName("Reporting add-on");
      setChargeType("RECURRING");
      setProrationMethod("DAILY_ACTUAL");
      setBillingFrequency("Monthly");
      setUnitPrice("1200");
    } else {
      setProductName("Setup & Integration Fee");
      setChargeType("ONE_TIME");
      setProrationMethod("NONE");
      setBillingFrequency("One-Time");
      setUnitPrice("500");
    }
  };
  // Handle Quote Selection & Prefill
  const handleQuoteSelect = (quoteId: string) => {
    setSelectedQuoteId(quoteId);
    const q = customerQuotes.find((item: ARQuote) => item.id === quoteId);
    if (q && q.line_items && q.line_items.length > 0) {
      const item = q.line_items[0];
      setProductName(item.name || "Additional Seats");
      setDescription(item.description || "");
      setQuantity(String(item.quantity || 1));
      setUnitPrice(String(item.price || unitPrice));

      const nameLower = (item.name || "").toLowerCase();
      if (nameLower.includes("seat") || nameLower.includes("user") || nameLower.includes("license")) {
        setAdditionType("SEATS");
        setChargeType("RECURRING");
        setProrationMethod("DAILY_ACTUAL");
      } else if (
        item.billing_frequency === "One-Time" ||
        item.billing_frequency === "One-time" ||
        nameLower.includes("setup") ||
        nameLower.includes("one-time")
      ) {
        setAdditionType("ONETIME_FEE");
        setChargeType("ONE_TIME");
        setProrationMethod("NONE");
      } else {
        setAdditionType("RECURRING_ADDON");
        setChargeType("RECURRING");
        setProrationMethod("DAILY_ACTUAL");
      }
    }
  };
  // Auto-select first signed quote when available
  useEffect(() => {
    if (isOpen && customerQuotes.length > 0 && !selectedQuoteId) {
      handleQuoteSelect(customerQuotes[0].id);
    }
  }, [isOpen, customerQuotes.length, selectedQuoteId]);
  // Trigger Live Preview Calculation
  useEffect(() => {
    if (!isOpen) return;
    const qtyNum = parseFloat(quantity) || 1;
    const priceNum = parseFloat(unitPrice) || 0;
    const baseQtyNum = primarySub ? parseFloat(primarySub.base_quantity) : 10;

    const freqNormalized = billingFrequency.toUpperCase() === "ANNUALLY"
      ? "ANNUAL"
      : billingFrequency.toUpperCase() === "MONTHLY"
      ? "MONTHLY"
      : billingFrequency.toUpperCase() === "QUARTERLY"
      ? "QUARTERLY"
      : billingFrequency.toUpperCase() === "SEMI-ANNUALLY"
      ? "SEMI_ANNUAL"
      : "ONE_TIME";

    setIsPreviewLoading(true);
    arInvoiceService
      .previewAddon({
        addition_type: additionType,
        charge_type: chargeType,
        full_period_unit_price: priceNum,
        quantity: qtyNum,
        effective_date: effectiveDate,
        billing_period_start: billingPeriodStart,
        billing_period_end: billingPeriodEnd,
        proration_method: prorationMethod,
        manual_override_charge: isManualOverride && overrideCharge ? parseFloat(overrideCharge) : null,
        override_reason: isManualOverride ? overrideReason : null,
        base_quantity: baseQtyNum,
        billing_frequency: freqNormalized,
        currency: primarySub?.currency || "USD",
        quote_id: selectedQuoteId || undefined,
      })
      .then((res) => {
        setPreviewData(res);
      })
      .catch((err) => {
        console.error("Preview calculation error:", err);
      })
      .finally(() => {
        setIsPreviewLoading(false);
      });
  }, [
    isOpen,
    additionType,
    chargeType,
    quantity,
    unitPrice,
    billingFrequency,
    effectiveDate,
    billingPeriodStart,
    billingPeriodEnd,
    prorationMethod,
    isManualOverride,
    overrideCharge,
    overrideReason,
    selectedQuoteId,
    primarySub,
  ]);
  // Submit Mutation
  const addMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        subscription_id: selectedSubId || primarySub?.id,
        addition_type: additionType,
        product_name: productName.trim(),
        description: description.trim(),
        quantity: parseFloat(quantity) || 1,
        charge_type: chargeType,
        full_period_unit_price: parseFloat(unitPrice) || 0,
        effective_date: effectiveDate,
        billing_period_start: billingPeriodStart,
        billing_period_end: billingPeriodEnd,
        proration_method: prorationMethod,
        manual_override_charge: isManualOverride && overrideCharge ? parseFloat(overrideCharge) : null,
        override_reason: isManualOverride ? overrideReason.trim() : null,
        quote_id: selectedQuoteId || null,
        customer_note: customerNote.trim(),
        billing_frequency: billingFrequency.toUpperCase() === "ANNUALLY" ? "ANNUAL" : billingFrequency.toUpperCase() === "MONTHLY" ? "MONTHLY" : billingFrequency.toUpperCase() === "QUARTERLY" ? "QUARTERLY" : billingFrequency.toUpperCase() === "SEMI-ANNUALLY" ? "SEMI_ANNUAL" : "ONE_TIME",
        currency: primarySub?.currency || "USD",
        base_quantity: primarySub?.base_quantity || 10,
      };

      return arInvoiceService.addSeatsOrAddons(invoiceId, payload);
    },
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err: any) => {
      alert(`Failed to add prorated charge: ${err.message || err}`);
    },
  });
  const handleConfirm = () => {
    const calculatedAmt = previewData?.calculated_charge ?? (isManualOverride && overrideCharge ? parseFloat(overrideCharge) : (parseFloat(quantity) || 1) * (parseFloat(unitPrice) || 0));
    
    if (onAddDirectSubItem) {
      const subItem = {
        id: `sub-${Date.now()}`,
        date: effectiveDate,
        activity: productName,
        name: productName,
        title: productName,
        product_name: productName,
        description: description.trim() || productName,
        quantity: quantity,
        unit_price: unitPrice,
        unit_discount: 0,
        discount_type: "%" as const,
        billing_frequency: billingFrequency,
        term: 1,
        billing_start_date: effectiveDate,
        tax_rate: 0,
        total: calculatedAmt,
        charge: calculatedAmt,
        badge: previewData?.proration_badge || (chargeType === "RECURRING" ? "Prorated" : "One-Time"),
        is_reference_only: false,
        reference_amount: 0,
        calculation: previewData?.formula_string || `${quantity} × $${unitPrice}`,
        date_range: previewData?.date_range_label || `${billingPeriodStart} to ${billingPeriodEnd}`,
        full_recurring_label: previewData?.full_recurring_value ? `Full term: $${Number(previewData.full_recurring_value).toFixed(2)}/yr` : undefined,
        is_manual_override: isManualOverride,
        override_reason: isManualOverride ? overrideReason : undefined,
      };
      onAddDirectSubItem(subItem, selectedParentIdx);
    }

    if (invoiceId) {
      addMutation.mutate();
    } else {
      onSuccess();
      onClose();
    }
  };
  const baseQty = primarySub ? parseFloat(primarySub.base_quantity) : 10;
  const resultingSeats = baseQty + (parseFloat(quantity) || 0);
  return { customerQuotes, primarySub, additionType, productName, setProductName, quantity, setQuantity, unitPrice, setUnitPrice, billingFrequency, setBillingFrequency, billingStartDateOption, setBillingStartDateOption, effectiveDate, setEffectiveDate, billingPeriodStart, billingPeriodEnd, selectedQuoteId, customerNote, setCustomerNote, selectedParentIdx, setSelectedParentIdx, handleStartDateOptionChange, isManualOverride, setIsManualOverride, overrideCharge, setOverrideCharge, overrideReason, setOverrideReason, previewData, isPreviewLoading, handleAdditionTypeChange, handleQuoteSelect, addMutation, handleConfirm, baseQty, resultingSeats };
}
