import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Sparkles,
  Users,
  Repeat,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  ArrowRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  arInvoiceService,
  type AddonPreviewResponse,
} from "../../services/arInvoiceService";
import { arQuoteService, type ARQuote } from "../../services/arQuoteService";

interface AddSeatsAddonsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string;
  customerId: string;
  customerName: string;
  parentInvoiceNumber?: string;
  onSuccess: () => void;
  lineItems?: Array<{ activity?: string; name?: string; description?: string }>;
  targetParentIndex?: number;
  onAddDirectSubItem?: (subItem: any, targetParentIndex: number) => void;
}

export const AddSeatsAddonsModal: React.FC<AddSeatsAddonsModalProps> = ({
  isOpen,
  onClose,
  invoiceId,
  customerId,
  customerName,
  parentInvoiceNumber,
  onSuccess,
  lineItems = [],
  targetParentIndex = 0,
  onAddDirectSubItem,
}) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl lg:max-w-5xl max-h-[92vh] overflow-y-auto p-6 sm:p-7 rounded-2xl bg-card border border-border shadow-xl">
        <DialogHeader className="pb-1 border-b border-border/80">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-foreground">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <span>Add Prorated Charge to Subscription</span>
            </DialogTitle>
            <Badge variant="outline" className="text-xs font-mono bg-muted/60 text-foreground border-border">
              Invoice #{parentInvoiceNumber || invoiceId}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            Calculate prorated additions or services attached to parent subscription with automated proration math.
          </DialogDescription>
        </DialogHeader>

        {/* ── ROW 1: Customer & Subscription Context Strip ──────────────── */}
        <div className="p-3 bg-muted/50 rounded-xl border border-border text-xs flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-semibold uppercase text-[10px]">Customer:</span>
            <span className="font-bold text-foreground">{customerName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-semibold uppercase text-[10px]">Current Base:</span>
            <span className="font-bold text-foreground font-mono">{baseQty} seats</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-semibold uppercase text-[10px]">Period:</span>
            <span className="font-mono text-foreground font-medium">
              {billingPeriodStart} <ArrowRight className="inline w-3 h-3 mx-0.5 text-muted-foreground" /> {billingPeriodEnd}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-semibold uppercase text-[10px]">Plan:</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {primarySub?.service_name || "Annual Enterprise Plan"}
            </span>
          </div>
        </div>

        {/* Attach Under Activity Selection */}
        {lineItems.length > 0 && (
          <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/40 flex items-center justify-between gap-3 flex-wrap text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="font-semibold text-foreground">Attach sub-item under Activity:</span>
            </div>
            <div className="w-72">
              <Select value={String(selectedParentIdx)} onValueChange={(val) => setSelectedParentIdx(Number(val))}>
                <SelectTrigger className="h-8 text-xs bg-card border-border">
                  <SelectValue placeholder="Select parent activity..." />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  {lineItems.map((li, idx) => (
                    <SelectItem key={idx} value={String(idx)}>
                      {li.activity || li.name || `Item ${idx + 1}`} {li.description ? `(${li.description.slice(0, 24)}...)` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="space-y-4 pt-1">
          {/* ── ROW 2: Linked Quote & Addition Type Selection ────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            {/* Signed Quote Dropdown */}
            <div className="md:col-span-7 space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Linked Signed Customer Proposal</span>
                </Label>
                {selectedQuoteId && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Auto-Prefilled
                  </span>
                )}
              </div>
              <Select value={selectedQuoteId} onValueChange={handleQuoteSelect}>
                <SelectTrigger className="h-9 text-xs bg-card border-border hover:border-blue-500/50 shadow-2xs">
                  <SelectValue placeholder="Select or prefilled quote..." />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  {customerQuotes.map((q: ARQuote) => (
                    <SelectItem key={q.id} value={q.id}>
                      {q.quote_number} · ${Number(q.total_amount).toFixed(2)} USD (Signed by {q.signer_name || "Customer"})
                    </SelectItem>
                  ))}
                  {customerQuotes.length === 0 && (
                    <SelectItem value="none" disabled>
                      No active signed quotes found for this customer
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Addition Type Pill Switcher */}
            <div className="md:col-span-5 space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Addition Type</Label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-muted/70 rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => handleAdditionTypeChange("SEATS")}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    additionType === "SEATS"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/70"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Seats</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAdditionTypeChange("RECURRING_ADDON")}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    additionType === "RECURRING_ADDON"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/70"
                  }`}
                >
                  <Repeat className="w-3.5 h-3.5" />
                  <span>Recurring</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAdditionTypeChange("ONETIME_FEE")}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    additionType === "ONETIME_FEE"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/70"
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>One-Time</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── ROW 3: Core Fields in Aligned Grid ─────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-muted/30 p-3.5 rounded-xl border border-border">
            {/* Field 1: Service Name */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-foreground">Service Name</Label>
              <Input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Additional Seats"
                className="h-8 text-xs font-medium bg-card"
              />
            </div>

            {/* Field 2: Quantity with Resulting Total */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">Quantity</Label>
                {additionType === "SEATS" && (
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                    Total: {resultingSeats}
                  </span>
                )}
              </div>
              <Input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="h-8 text-xs font-mono font-bold bg-card"
              />
            </div>

            {/* Field 3: Unit Price */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-foreground">Full-Period Rate ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="h-8 text-xs font-mono bg-card"
              />
            </div>

            {/* Field 4: Billing Frequency */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-foreground">Billing Frequency</Label>
              <Select value={billingFrequency} onValueChange={setBillingFrequency}>
                <SelectTrigger className="h-8 text-xs bg-card border-input">
                  <SelectValue placeholder="Select frequency..." />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="Annually">Annually (12 months)</SelectItem>
                  <SelectItem value="Monthly">Monthly (1 month)</SelectItem>
                  <SelectItem value="One-Time">One-Time (No proration)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Field 5: Billing Start Date Option */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-foreground">Billing Start Date</Label>
              <Select value={billingStartDateOption} onValueChange={handleStartDateOptionChange}>
                <SelectTrigger className="h-8 text-xs bg-card border-input">
                  <SelectValue placeholder="Select start option..." />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="Immediate">Immediate (Today)</SelectItem>
                  <SelectItem value="Upon signing">Upon signing</SelectItem>
                  <SelectItem value="At payment">At payment</SelectItem>
                  <SelectItem value="First of next month">First of next month</SelectItem>
                  <SelectItem value="Custom">Custom Date</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Field 6: Effective Date */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-foreground">Effective Date</Label>
              <Input
                type="date"
                value={effectiveDate}
                onChange={(e) => {
                  setEffectiveDate(e.target.value);
                  setBillingStartDateOption("Custom");
                }}
                className="h-8 text-xs font-mono bg-card"
              />
            </div>
          </div>

          {/* ── ROW 4: Live Arithmetic & Proration Breakdown Strip ────────── */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 text-foreground border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-foreground uppercase tracking-wide">
                  Live Proration &amp; Renewal Arithmetic
                </span>
              </div>
              <Badge className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 text-[10px] font-semibold">
                {isPreviewLoading ? "Calculating..." : (previewData?.proration_badge || "Prorated")}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
              {/* Coverage Days */}
              <div className="space-y-0.5">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Service Coverage</span>
                <div className="font-semibold text-foreground">
                  {previewData?.date_range_label || "Calculating..."}
                </div>
              </div>

              {/* Formula */}
              <div className="space-y-0.5 md:col-span-1">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Exact Formula</span>
                <div className="font-mono text-[11px] text-blue-700 dark:text-blue-300 truncate" title={previewData?.formula_string || ""}>
                  {previewData?.formula_string || "..."}
                </div>
              </div>

              {/* Immediate Charge */}
              <div className="space-y-0.5">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Immediate Due</span>
                <div className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                  +${Number(previewData?.actual_charge || 0).toFixed(2)} USD
                </div>
              </div>

              {/* Future Renewal */}
              <div className="space-y-0.5">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Next Annual Renewal</span>
                <div className="text-xs font-bold font-mono text-foreground">
                  ${Number(previewData?.full_recurring_value || 0).toFixed(2)} / yr
                </div>
              </div>
            </div>

            {previewData?.quote_warnings && previewData.quote_warnings.length > 0 && (
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>{previewData.quote_warnings.join(" ")}</span>
              </div>
            )}
          </div>

          {/* ── ROW 5: Overrides & Optional Notes in One Row ──────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* Manual Price Override */}
            <div className="p-3 bg-muted/40 rounded-xl border border-border space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold cursor-pointer flex items-center gap-2 text-foreground">
                  <input
                    type="checkbox"
                    checked={isManualOverride}
                    onChange={(e) => setIsManualOverride(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Manual Price Override</span>
                </Label>
                {isManualOverride && (
                  <Badge variant="outline" className="text-[10px] text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                    Override Active
                  </Badge>
                )}
              </div>

              {isManualOverride && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground font-medium">
                      Amount ($) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={overrideCharge}
                      onChange={(e) => setOverrideCharge(e.target.value)}
                      placeholder={String(previewData?.calculated_charge || "0.00")}
                      className="h-7 text-xs font-mono font-bold bg-card"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground font-medium">
                      Justification <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="e.g. Courtesy discount"
                      className="h-7 text-xs bg-card"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Customer Note */}
            <div className="p-3 bg-muted/40 rounded-xl border border-border space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Optional Reference Note</Label>
              <Input
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                placeholder="e.g. Added under contract amendment #2"
                className="h-7 text-xs bg-card"
              />
            </div>
          </div>
        </div>

        {/* ── FOOTER: Actions ───────────────────────────────────────────── */}
        <DialogFooter className="pt-3 border-t border-border flex items-center justify-between sm:justify-between w-full">
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs cursor-pointer border-border">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={addMutation.isPending || (isManualOverride && (!overrideCharge || !overrideReason.trim()))}
            className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs gap-1.5 cursor-pointer font-semibold"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Confirm &amp; Add to Invoice</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
