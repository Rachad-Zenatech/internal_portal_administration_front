import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Landmark,
  User,
  DollarSign,
  Globe2,
  FileText,
  Building2,
  ShieldCheck,
  MapPin,
  SendHorizontal,
  AlertCircle,
  ArrowRightLeft,
  Check,
  Sparkles,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { getTreasuryUsers, getExchangeRate } from "@/services/purchasingService";
import { CurrencyAutocomplete } from "./CurrencyAutocomplete";
import type { WireTransferInput, PurchaseOrder, PurchaseRequest } from "@/types/purchasing";
import { useAuth } from "@/lib/AuthContext";

interface WireTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: PurchaseRequest;
  purchaseOrder?: PurchaseOrder | null;
  initialData?: WireTransferInput | null;
  isEditMode?: boolean;
  onConfirm: (data: WireTransferInput) => void;
  isSubmitting?: boolean;
}

const COMMON_PAY_FROM = [
  "Weddle",
  "Laventure",
  "DaaS",
  "A&J",
  "Rampart",
  "Spiewack",
  "Wallace",
  "Zenatech",
];

const COMMON_CURRENCIES = ["USD", "CAD", "EUR", "GBP", "AUD", "CNY"];

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  CAD: "C$",
  EUR: "€",
  GBP: "£",
  AUD: "A$",
  CNY: "¥",
  JPY: "¥",
  CHF: "Fr",
  MXN: "Mex$",
  INR: "₹",
};

export function WireTransferDialog({
  open,
  onOpenChange,
  request,
  purchaseOrder,
  initialData,
  isEditMode = false,
  onConfirm,
  isSubmitting = false,
}: WireTransferDialogProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("general");
  const [treasuryUsers, setTreasuryUsers] = useState<
    Array<{ id: string; full_name: string; email: string; department?: string }>
  >([]);
  const [enteredByQuery, setEnteredByQuery] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  const [fxSourceInfo, setFxSourceInfo] = useState<{ source?: string; rate_date?: string } | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState<WireTransferInput>({
    entered_by: "",
    entered_by_user_id: undefined,
    entry_date: todayStr,
    due_date: request.due_date || "",
    payment_date: todayStr,
    vendor: purchaseOrder?.vendor || request.product_info?.vendor || request.requester || "",
    is_new_vendor: false,
    pay_date: "Same Day",
    amount: purchaseOrder?.amount || request.amount || 0,
    currency: purchaseOrder?.currency || request.currency || "USD",
    conversion_rate: "",
    pay_from: "",
    invoice_number: "",
    comments: request.title ? `Payment for ${request.title}` : "",
    vendor_address: "",
    bank_address: "",
    vendor_email: "",
    bank_name: "",
    tax_id: "",
    bank_country: "",
    routing_wire: "",
    routing_ach: "",
    bank_account_number: "",
    swift_code: "",
    sort_code: "",
    transit_code_ca: "",
    transit_number_ca: "",
    institution_code: "",
    branch_code: "",
    bsb_australia: "",
    clearing_code: "",
    bank_code: "",
    iban: "",
    bic: "",
    transit: "",
    aba: "",
    region: "",
    contact_name_china: "",
  });

  useEffect(() => {
    if (open) {
      setActiveTab("general");
      setValidationErrors({});
      getTreasuryUsers()
        .then((res: any) => {
          const list = Array.isArray(res) ? res : (res?.data || []);
          setTreasuryUsers(list);
          // Default to the first treasurer set in the role if no initial data
          if (!initialData?.entered_by && list.length > 0) {
            const firstTreasurer = list[0];
            const defaultName = (firstTreasurer.full_name || "").trim();
            setEnteredByQuery(defaultName);
            setForm((prev) => ({
              ...prev,
              entered_by: defaultName,
              entered_by_user_id: firstTreasurer.id,
            }));
          }
        })
        .catch(() => setTreasuryUsers([]));

      if (initialData) {
        setEnteredByQuery(initialData.entered_by || "");
        setForm({
          entered_by: initialData.entered_by || "",
          entered_by_user_id: initialData.entered_by_user_id || undefined,
          entry_date: initialData.entry_date || todayStr,
          due_date: initialData.due_date || "",
          payment_date: initialData.payment_date || todayStr,
          vendor: initialData.vendor || purchaseOrder?.vendor || request.product_info?.vendor || request.requester || "",
          is_new_vendor: !!initialData.is_new_vendor,
          pay_date: initialData.pay_date || "Same Day",
          amount: initialData.amount || purchaseOrder?.amount || request.amount || 0,
          currency: initialData.currency || purchaseOrder?.currency || request.currency || "USD",
          conversion_rate: initialData.conversion_rate || (
            (initialData.currency || purchaseOrder?.currency || request.currency || "USD").toUpperCase() === "USD" ? "1.0" : ""
          ),
          pay_from: initialData.pay_from || "",
          invoice_number: initialData.invoice_number || "",
          comments: initialData.comments || "",
          vendor_address: initialData.vendor_address || "",
          bank_address: initialData.bank_address || "",
          vendor_email: initialData.vendor_email || "",
          bank_name: initialData.bank_name || "",
          tax_id: initialData.tax_id || "",
          bank_country: initialData.bank_country || "",
          routing_wire: initialData.routing_wire || "",
          routing_ach: initialData.routing_ach || "",
          bank_account_number: initialData.bank_account_number || "",
          swift_code: initialData.swift_code || "",
          sort_code: initialData.sort_code || "",
          transit_code_ca: initialData.transit_code_ca || "",
          transit_number_ca: initialData.transit_number_ca || "",
          institution_code: initialData.institution_code || "",
          branch_code: initialData.branch_code || "",
          bsb_australia: initialData.bsb_australia || "",
          clearing_code: initialData.clearing_code || "",
          bank_code: initialData.bank_code || "",
          iban: initialData.iban || "",
          bic: initialData.bic || "",
          transit: initialData.transit || "",
          aba: initialData.aba || "",
          region: initialData.region || "",
          contact_name_china: initialData.contact_name_china || "",
        });
      } else {
        const defaultTreasurer = treasuryUsers.length > 0 ? treasuryUsers[0] : null;
        const initialEnteredBy = defaultTreasurer ? (defaultTreasurer.full_name || "").trim() : "";
        const initialEnteredById = defaultTreasurer ? defaultTreasurer.id : undefined;
        setEnteredByQuery(initialEnteredBy);
        setForm((prev) => ({
          ...prev,
          entered_by: initialEnteredBy,
          entered_by_user_id: initialEnteredById,
          entry_date: todayStr,
          payment_date: todayStr,
          vendor: purchaseOrder?.vendor || request.product_info?.vendor || prev.vendor,
          amount: purchaseOrder?.amount || request.amount || prev.amount,
          currency: purchaseOrder?.currency || request.currency || prev.currency || "USD",
          conversion_rate: (purchaseOrder?.currency || request.currency || prev.currency || "USD").toUpperCase() === "USD" ? "1.0" : "",
        }));

        const initCurr = (purchaseOrder?.currency || request.currency || "USD").toUpperCase();
        if (initCurr !== "USD") {
          getExchangeRate(initCurr).then((res) => {
            if (res && res.exchange_rate) {
              setForm((prev) => ({ ...prev, conversion_rate: String(res.exchange_rate) }));
              setFxSourceInfo({ source: res.source, rate_date: res.rate_date });
            }
          }).catch(() => {});
        }
      }
    }
  }, [open, request, purchaseOrder, user, todayStr, initialData]);

  const filteredTreasuryUsers = useMemo(() => {
    if (!enteredByQuery.trim()) return treasuryUsers;
    const q = enteredByQuery.toLowerCase();
    return treasuryUsers.filter(
      (u) =>
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.department?.toLowerCase().includes(q)
    );
  }, [treasuryUsers, enteredByQuery]);

  const handleInvoiceChange = (val: string) => {
    const sanitized = val.replace(/[^a-zA-Z0-9\-_]/g, "");
    setForm({ ...form, invoice_number: sanitized });
  };

  const handleCurrencyChange = async (newCurrency: string) => {
    const code = (newCurrency || "USD").trim().toUpperCase();
    setForm((prev) => ({
      ...prev,
      currency: code,
    }));

    if (code === "USD") {
      setForm((prev) => ({
        ...prev,
        currency: "USD",
        conversion_rate: "1.0",
      }));
      setFxSourceInfo(null);
      return;
    }

    setIsFetchingRate(true);
    try {
      const res = await getExchangeRate(code);
      if (res && res.exchange_rate) {
        setForm((prev) => ({
          ...prev,
          currency: code,
          conversion_rate: String(res.exchange_rate),
        }));
        setFxSourceInfo({
          source: res.source,
          rate_date: res.rate_date,
        });
        toast.success(`Exchange rate fetched: 1 ${code} = $${res.exchange_rate} USD`, {
          description: `${res.source} (${res.rate_date})`,
        });
      }
    } catch (err) {
      console.error("Failed to fetch exchange rate for", code, err);
    } finally {
      setIsFetchingRate(false);
    }
  };

  const cleanDate = (d?: string | null) => {
    if (!d || d.trim() === "" || d === "null" || d === "undefined") return undefined;
    return d.trim();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, boolean> = {};

    if (!form.entered_by?.trim()) newErrors.entered_by = true;
    if (!form.entry_date?.trim()) newErrors.entry_date = true;
    if (!form.vendor?.trim()) newErrors.vendor = true;
    if (!form.amount || Number(form.amount) <= 0) newErrors.amount = true;
    if (!form.pay_from?.trim()) newErrors.pay_from = true;

    if (Object.keys(newErrors).length > 0) {
      setValidationErrors(newErrors);
      toast.error("Please fill in all required fields marked with * (Entered By, Date, Vendor, Amount, Pay From).");
      setActiveTab("general");
      return;
    }

    setValidationErrors({});

    onConfirm({
      ...form,
      amount: Number(form.amount) || 0,
      entry_date: cleanDate(form.entry_date),
      due_date: cleanDate(form.due_date),
      payment_date: cleanDate(form.payment_date),
    });
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setShowDiscardConfirm(true);
          } else {
            onOpenChange(true);
          }
        }}
      >
        <DialogContent
          aria-describedby={undefined}
          onPointerDownOutside={(e) => {
            e.preventDefault();
            setShowDiscardConfirm(true);
          }}
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            setShowDiscardConfirm(true);
          }}
          className="!w-[92vw] !max-w-[1000px] sm:!max-w-[1000px] h-[90vh] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl"
          style={{ width: "92vw", maxWidth: "1000px" }}
        >
          {/* FIXED HEADER */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/90 dark:bg-zinc-900/70 shrink-0">
            <DialogHeader className="p-0">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200/50 dark:border-indigo-800/50">
                    <Landmark className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100 truncate flex items-center gap-2">
                      <span>{isEditMode ? "Edit Wire Transfer" : "Wire Transfer Information"}</span>
                      <span className="text-muted-foreground font-normal text-sm">· Request #{request.id}</span>
                    </DialogTitle>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {isEditMode
                        ? "Update the wire payment and banking details."
                        : "Complete the wire payment details to record this transaction."}
                    </p>
                  </div>
                </div>
                <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 text-xs font-semibold shrink-0 py-1 px-2.5">
                  TREASURY STAGE
                </Badge>
              </div>
            </DialogHeader>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              {/* FIXED TABS SELECTOR */}
              <div className="px-6 pt-3.5 pb-2.5 bg-white dark:bg-zinc-950 border-b border-slate-100 dark:border-zinc-800/80 shrink-0">
                <TabsList className="grid grid-cols-3 w-full max-w-md h-9">
                  <TabsTrigger value="general" className="flex items-center gap-1.5 text-xs">
                    <FileText className="w-3.5 h-3.5" />
                    General & Payment
                  </TabsTrigger>
                  <TabsTrigger value="banking" className="flex items-center gap-1.5 text-xs">
                    <Building2 className="w-3.5 h-3.5" />
                    Bank & Routing
                  </TabsTrigger>
                  <TabsTrigger value="international" className="flex items-center gap-1.5 text-xs">
                    <Globe2 className="w-3.5 h-3.5" />
                    International
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* SCROLLABLE BODY */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                {/* TAB 1: GENERAL & PAYMENT */}
                <TabsContent value="general" className="space-y-4 mt-0">
                {/* Assignment & Scheduling */}
                <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/50 rounded-lg border border-slate-200 dark:border-zinc-700 space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-300">
                      Assignment & Scheduling
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Entered By */}
                    <div className="relative space-y-1.5 sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium">
                          Entered By <span className="text-red-500">*</span>{" "}
                          <span className="text-slate-400 font-normal text-[11px]">(Treasury User)</span>
                        </label>
                        {validationErrors.entered_by && (
                          <span className="text-[10px] text-red-500 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Required
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <Input
                          value={enteredByQuery}
                          onChange={(e) => {
                            setEnteredByQuery(e.target.value);
                            setForm({ ...form, entered_by: e.target.value, entered_by_user_id: undefined });
                            setShowUserDropdown(true);
                            if (validationErrors.entered_by) {
                              setValidationErrors((prev) => ({ ...prev, entered_by: false }));
                            }
                          }}
                          onFocus={() => setShowUserDropdown(true)}
                          placeholder="Type or select Treasury assignee..."
                          className={`h-9 text-xs pl-8 bg-white dark:bg-zinc-900 ${
                            validationErrors.entered_by ? "border-red-500 focus-visible:ring-red-500" : ""
                          }`}
                        />
                        <User className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                      </div>

                      {showUserDropdown && filteredTreasuryUsers.length > 0 && (
                        <div
                          data-radix-scroll-lock-ignore=""
                          onWheel={(e) => e.stopPropagation()}
                          onTouchMove={(e) => e.stopPropagation()}
                          style={{ scrollbarWidth: "thin", overscrollBehavior: "contain" }}
                          className="absolute z-50 left-0 right-0 mt-1 max-h-52 overflow-y-auto overscroll-contain bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-xl py-1"
                        >
                          {filteredTreasuryUsers.map((u) => (
                            <button
                              key={u.id}
                              type="button"
                              className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center justify-between transition-colors"
                              onClick={() => {
                                const selectedName = (u.full_name || "").trim();
                                setForm({
                                  ...form,
                                  entered_by: selectedName,
                                  entered_by_user_id: u.id,
                                });
                                setEnteredByQuery(selectedName);
                                setShowUserDropdown(false);
                                setValidationErrors((prev) => ({ ...prev, entered_by: false }));
                              }}
                            >
                              <div>
                                <div className="font-semibold text-slate-800 dark:text-zinc-200">{u.full_name}</div>
                                <div className="text-[11px] text-muted-foreground">{u.email}</div>
                              </div>
                              {u.department && (
                                <Badge variant="secondary" className="text-[10px]">{u.department}</Badge>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Date */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium">
                          Date <span className="text-red-500">*</span>
                        </label>
                        {validationErrors.entry_date && (
                          <span className="text-[10px] text-red-500 font-medium">Required</span>
                        )}
                      </div>
                      <Input
                        type="date"
                        value={form.entry_date || ""}
                        onChange={(e) => {
                          setForm({ ...form, entry_date: e.target.value });
                          if (validationErrors.entry_date) {
                            setValidationErrors((prev) => ({ ...prev, entry_date: false }));
                          }
                        }}
                        className={`h-9 text-xs bg-white dark:bg-zinc-900 ${
                          validationErrors.entry_date ? "border-red-500 focus-visible:ring-red-500" : ""
                        }`}
                      />
                    </div>

                    {/* Payment Date */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Payment Date</label>
                      <Input
                        type="date"
                        value={form.payment_date || ""}
                        onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
                        className="h-9 text-xs bg-white dark:bg-zinc-900"
                      />
                    </div>

                    {/* Due Date */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Due Date</label>
                      <Input
                        type="date"
                        value={form.due_date || ""}
                        onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                        className="h-9 text-xs bg-white dark:bg-zinc-900"
                      />
                    </div>

                    {/* Pay Date */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Pay Date (Terms)</label>
                      <Input
                        value={form.pay_date || ""}
                        onChange={(e) => setForm({ ...form, pay_date: e.target.value })}
                        placeholder="e.g. Same Day, Net 30"
                        className="h-9 text-xs bg-white dark:bg-zinc-900"
                      />
                    </div>

                    {/* New Vendor */}
                    <div className="flex items-center sm:col-span-2 pt-6">
                      <label
                        htmlFor="is_new_vendor"
                        className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer select-none"
                      >
                        <Checkbox
                          id="is_new_vendor"
                          checked={form.is_new_vendor}
                          onCheckedChange={(checked) => setForm({ ...form, is_new_vendor: !!checked })}
                        />
                        <span>New Vendor?</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Payment & Settlement */}
                <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/50 rounded-lg border border-slate-200 dark:border-zinc-700 space-y-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-300">
                      Payment & Settlement
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Vendor */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium">
                          Vendor <span className="text-red-500">*</span>
                        </label>
                        {validationErrors.vendor && (
                          <span className="text-[10px] text-red-500 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Required
                          </span>
                        )}
                      </div>
                      <Input
                        required
                        value={form.vendor || ""}
                        onChange={(e) => {
                          setForm({ ...form, vendor: e.target.value });
                          if (validationErrors.vendor) {
                            setValidationErrors((prev) => ({ ...prev, vendor: false }));
                          }
                        }}
                        placeholder="Vendor Name"
                        className={`h-9 text-xs font-medium bg-white dark:bg-zinc-900 ${
                          validationErrors.vendor ? "border-red-500 focus-visible:ring-red-500" : ""
                        }`}
                      />
                    </div>

                    {/* Amount */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium">
                          Amount <span className="text-red-500">*</span>{" "}
                          <span className="text-indigo-600 dark:text-indigo-400 font-normal text-[11px]">
                            ({form.currency || "USD"})
                          </span>
                        </label>
                        {validationErrors.amount && (
                          <span className="text-[10px] text-red-500 font-medium">Required</span>
                        )}
                      </div>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2.5 text-xs font-semibold text-slate-400 select-none">
                          {CURRENCY_SYMBOLS[(form.currency || "USD").toUpperCase()] || "$"}
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          required
                          value={form.amount ?? ""}
                          onChange={(e) => {
                            setForm({ ...form, amount: parseFloat(e.target.value) || 0 });
                            if (validationErrors.amount) {
                              setValidationErrors((prev) => ({ ...prev, amount: false }));
                            }
                          }}
                          placeholder="0.00"
                          className={`h-9 text-xs font-semibold pl-8 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-900 ${
                            validationErrors.amount ? "border-red-500 focus-visible:ring-red-500" : ""
                          }`}
                        />
                      </div>
                    </div>

                    {/* Currency */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium">Currency</label>
                        <div className="flex items-center gap-1">
                          {COMMON_CURRENCIES.slice(0, 4).map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => handleCurrencyChange(c)}
                              className={`text-[10px] px-1.5 py-0.5 rounded font-medium border transition-colors ${
                                (form.currency || "USD").toUpperCase() === c
                                  ? "bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-700 dark:text-indigo-300 font-bold"
                                  : "bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-slate-100"
                              }`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>
                      <CurrencyAutocomplete
                        value={form.currency || "USD"}
                        onChange={handleCurrencyChange}
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Pay From */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium">
                          Pay From (Entity) <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-1">
                          {COMMON_PAY_FROM.slice(0, 4).map((pf) => (
                            <button
                              key={pf}
                              type="button"
                              onClick={() => {
                                setForm({ ...form, pay_from: pf });
                                setValidationErrors((prev) => ({ ...prev, pay_from: false }));
                              }}
                              className={`text-[10px] px-1.5 py-0.5 rounded font-medium border transition-colors ${
                                form.pay_from === pf
                                  ? "bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-700 dark:text-indigo-300"
                                  : "bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-slate-100"
                              }`}
                            >
                              {pf}
                            </button>
                          ))}
                        </div>
                      </div>
                      <Input
                        value={form.pay_from || ""}
                        onChange={(e) => {
                          setForm({ ...form, pay_from: e.target.value });
                          if (validationErrors.pay_from) {
                            setValidationErrors((prev) => ({ ...prev, pay_from: false }));
                          }
                        }}
                        placeholder="e.g. Weddle, DaaS, Laventure, Rampart..."
                        className={`h-9 text-xs bg-white dark:bg-zinc-900 ${
                          validationErrors.pay_from ? "border-red-500 focus-visible:ring-red-500" : ""
                        }`}
                      />
                    </div>

                    {/* Invoice */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">
                        Invoice <span className="text-slate-400 font-normal">(alphanumeric)</span>
                      </label>
                      <Input
                        value={form.invoice_number || ""}
                        onChange={(e) => handleInvoiceChange(e.target.value)}
                        placeholder="e.g. 40408"
                        className="h-9 text-xs font-mono bg-white dark:bg-zinc-900"
                      />
                    </div>

                    {/* Conversion Rate */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium">
                          Conversion Rate{" "}
                          <span className="text-slate-400 font-normal text-[11px]">(FX Rate)</span>
                        </label>
                        <div className="flex items-center gap-1.5">
                          {form.currency && form.currency.toUpperCase() !== "USD" && form.conversion_rate && (
                            <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
                              1 {form.currency} = ${form.conversion_rate}
                            </span>
                          )}
                          {form.currency && form.currency.toUpperCase() !== "USD" && (
                            <button
                              type="button"
                              onClick={() => handleCurrencyChange(form.currency || "USD")}
                              disabled={isFetchingRate}
                              title="Fetch latest rate from Python Currency Service"
                              className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 inline-flex items-center gap-0.5 hover:underline disabled:opacity-50"
                            >
                              <RefreshCw className={`h-2.5 w-2.5 ${isFetchingRate ? "animate-spin" : ""}`} />
                              <span>Fetch Live</span>
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="relative">
                        <ArrowRightLeft className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                        <Input
                          value={form.conversion_rate || ""}
                          onChange={(e) => setForm({ ...form, conversion_rate: e.target.value })}
                          disabled={isFetchingRate}
                          placeholder={
                            (form.currency || "USD").toUpperCase() === "USD"
                              ? "1.00 (USD)"
                              : isFetchingRate
                              ? "Fetching live rate..."
                              : (form.currency || "").toUpperCase() === "CAD"
                              ? "e.g. 0.7400"
                              : (form.currency || "").toUpperCase() === "EUR"
                              ? "e.g. 1.0850"
                              : (form.currency || "").toUpperCase() === "GBP"
                              ? "e.g. 1.2800"
                              : "e.g. 1.0000"
                          }
                          className="h-9 text-xs font-mono pl-8 pr-8 bg-white dark:bg-zinc-900"
                        />
                        {isFetchingRate && (
                          <div className="absolute right-2.5 top-2.5">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />
                          </div>
                        )}
                      </div>
                      {fxSourceInfo && form.currency && form.currency.toUpperCase() !== "USD" && (
                        <div className="text-[10px] text-slate-500 dark:text-zinc-400 flex items-center justify-between px-0.5">
                          <span className="truncate">Source: {fxSourceInfo.source}</span>
                          <span className="shrink-0 font-mono text-[9px] text-slate-400">{fxSourceInfo.rate_date}</span>
                        </div>
                      )}
                    </div>

                    {/* FX CONVERSION SUMMARY BANNER */}
                    <div className="sm:col-span-4 -mt-1">
                      {(form.currency || "USD").toUpperCase() !== "USD" ? (
                        parseFloat(form.conversion_rate || "0") > 0 && Number(form.amount) > 0 ? (
                          <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 rounded-lg text-xs">
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                              <span className="text-slate-700 dark:text-zinc-300">
                                Estimated USD Settlement:{" "}
                                <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300 font-mono">
                                  ${(
                                    Number(form.amount) * parseFloat(form.conversion_rate || "1")
                                  ).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                                  USD
                                </span>
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                ({Number(form.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })} {form.currency} ×{" "}
                                {form.conversion_rate})
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const currentRate = parseFloat(form.conversion_rate || "0");
                                if (currentRate > 0) {
                                  const inverted = (1 / currentRate).toFixed(6).replace(/\.?0+$/, "");
                                  setForm({ ...form, conversion_rate: inverted });
                                }
                              }}
                              className="text-[10px] text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-medium underline underline-offset-2 transition-colors"
                              title="Invert FX rate (1 / rate)"
                            >
                              Invert Rate (1/x)
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 rounded-lg text-xs text-amber-700 dark:text-amber-300">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            <span>
                              Wiring in <strong>{form.currency || "Foreign Currency"}</strong>. Enter the conversion rate (FX rate to USD) above to calculate estimated USD equivalent.
                            </span>
                          </div>
                        )
                      ) : (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/60 dark:border-zinc-800 rounded-lg text-xs text-slate-500 dark:text-zinc-400">
                          <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Standard currency is USD. Conversion rate defaults to 1.00.</span>
                        </div>
                      )}
                    </div>

                    {/* Comments */}
                    <div className="space-y-1.5 sm:col-span-4">
                      <label className="text-xs font-medium">Comments / Memo</label>
                      <Input
                        value={form.comments || ""}
                        onChange={(e) => setForm({ ...form, comments: e.target.value })}
                        placeholder="e.g. August Rent Payment, vendor deposit..."
                        className="h-9 text-xs bg-white dark:bg-zinc-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Vendor Contact & Location */}
                <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/50 rounded-lg border border-slate-200 dark:border-zinc-700 space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-600 dark:text-zinc-400" />
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-300">
                      Vendor Contact & Location
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Vendor Email */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-medium">Vendor Email</label>
                      <Input
                        type="email"
                        value={form.vendor_email || ""}
                        onChange={(e) => setForm({ ...form, vendor_email: e.target.value })}
                        placeholder="vendor-billing@domain.com"
                        className="h-9 text-xs bg-white dark:bg-zinc-900"
                      />
                    </div>

                    {/* Contact Name China */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Contact (China)</label>
                      <Input
                        value={form.contact_name_china || ""}
                        onChange={(e) => setForm({ ...form, contact_name_china: e.target.value })}
                        placeholder="Name for CN transfers"
                        className="h-9 text-xs bg-white dark:bg-zinc-900"
                      />
                    </div>

                    {/* Region */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Region / State</label>
                      <Input
                        value={form.region || ""}
                        onChange={(e) => setForm({ ...form, region: e.target.value })}
                        placeholder="Region / State"
                        className="h-9 text-xs bg-white dark:bg-zinc-900"
                      />
                    </div>

                    {/* Vendor Address */}
                    <div className="space-y-1.5 sm:col-span-4">
                      <label className="text-xs font-medium">Vendor Address</label>
                      <Input
                        value={form.vendor_address || ""}
                        onChange={(e) => setForm({ ...form, vendor_address: e.target.value })}
                        placeholder="Street Address, City, State/Province, Postal Code, Country..."
                        className="h-9 text-xs bg-white dark:bg-zinc-900"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* TAB 2: BANK & ROUTING */}
              <TabsContent value="banking" className="space-y-4 mt-0">
                <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/50 rounded-lg border border-slate-200 dark:border-zinc-700 space-y-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-300">
                      Beneficiary Bank Details
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {/* Bank Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Bank Name</label>
                      <Input
                        value={form.bank_name || ""}
                        onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                        placeholder="e.g. CIBC, JPMorgan Chase"
                        className="h-9 text-xs bg-white dark:bg-zinc-900"
                      />
                    </div>

                    {/* Bank Country */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Bank Country</label>
                      <Input
                        value={form.bank_country || ""}
                        onChange={(e) => setForm({ ...form, bank_country: e.target.value })}
                        placeholder="e.g. Canada, United States, China"
                        className="h-9 text-xs bg-white dark:bg-zinc-900"
                      />
                    </div>

                    {/* Tax ID */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Tax ID / EIN</label>
                      <Input
                        value={form.tax_id || ""}
                        onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
                        placeholder="Tax ID Number"
                        className="h-9 text-xs bg-white dark:bg-zinc-900"
                      />
                    </div>

                    {/* Bank Account Number */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Bank Account #</label>
                      <Input
                        value={form.bank_account_number || ""}
                        onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })}
                        placeholder="Account Number"
                        className="h-9 text-xs font-mono font-medium bg-white dark:bg-zinc-900"
                      />
                    </div>

                    {/* Routing Wire */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Routing (Wire)</label>
                      <Input
                        value={form.routing_wire || ""}
                        onChange={(e) => setForm({ ...form, routing_wire: e.target.value })}
                        placeholder="Wire Routing Number"
                        className="h-9 text-xs font-mono bg-white dark:bg-zinc-900"
                      />
                    </div>

                    {/* Routing ACH */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Routing (ACH)</label>
                      <Input
                        value={form.routing_ach || ""}
                        onChange={(e) => setForm({ ...form, routing_ach: e.target.value })}
                        placeholder="ACH Routing Number"
                        className="h-9 text-xs font-mono bg-white dark:bg-zinc-900"
                      />
                    </div>

                    {/* ABA */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">ABA Number</label>
                      <Input
                        value={form.aba || ""}
                        onChange={(e) => setForm({ ...form, aba: e.target.value })}
                        placeholder="ABA Number"
                        className="h-9 text-xs font-mono bg-white dark:bg-zinc-900"
                      />
                    </div>

                    {/* Bank Address */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-medium">Bank Branch Address</label>
                      <Input
                        value={form.bank_address || ""}
                        onChange={(e) => setForm({ ...form, bank_address: e.target.value })}
                        placeholder="Branch Address, City, Country, Postal Code..."
                        className="h-9 text-xs bg-white dark:bg-zinc-900"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* TAB 3: INTERNATIONAL CODES */}
              <TabsContent value="international" className="space-y-4 mt-0">
                <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/50 rounded-lg border border-slate-200 dark:border-zinc-700 space-y-3">
                  <div className="flex items-center gap-2">
                    <Globe2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-300">
                      Global & Regional Clearing Codes
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {/* SWIFT */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">SWIFT Code</label>
                      <Input
                        value={form.swift_code || ""}
                        onChange={(e) => setForm({ ...form, swift_code: e.target.value.toUpperCase() })}
                        placeholder="e.g. CIBCCATT"
                        className="h-9 text-xs font-mono uppercase bg-white dark:bg-zinc-900"
                      />
                    </div>

                    {/* BIC */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">BIC Code</label>
                      <Input
                        value={form.bic || ""}
                        onChange={(e) => setForm({ ...form, bic: e.target.value.toUpperCase() })}
                        placeholder="BIC Code"
                        className="h-9 text-xs font-mono uppercase bg-white dark:bg-zinc-900"
                      />
                    </div>

                    {/* IBAN */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">IBAN</label>
                      <Input
                        value={form.iban || ""}
                        onChange={(e) => setForm({ ...form, iban: e.target.value.toUpperCase() })}
                        placeholder="IBAN Number"
                        className="h-9 text-xs font-mono uppercase bg-white dark:bg-zinc-900"
                      />
                    </div>

                    {/* Sort Code */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Sort Code (UK)</label>
                      <Input
                        value={form.sort_code || ""}
                        onChange={(e) => setForm({ ...form, sort_code: e.target.value })}
                        placeholder="6-digit code"
                        className="h-9 text-xs font-mono bg-white dark:bg-zinc-900"
                      />
                    </div>

                    {/* Transit Code Canada */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Transit Code (CA)</label>
                      <Input
                        value={form.transit_code_ca || ""}
                        onChange={(e) => setForm({ ...form, transit_code_ca: e.target.value })}
                        placeholder="e.g. 00303"
                        className="h-9 text-xs font-mono bg-white dark:bg-zinc-900"
                      />
                    </div>

                    {/* Transit Number Canada */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Transit # (CA)</label>
                      <Input
                        value={form.transit_number_ca || ""}
                        onChange={(e) => setForm({ ...form, transit_number_ca: e.target.value })}
                        placeholder="Transit Number"
                        className="h-9 text-xs font-mono bg-white dark:bg-zinc-900"
                      />
                    </div>

                    {/* Institution Code */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Institution Code</label>
                      <Input
                        value={form.institution_code || ""}
                        onChange={(e) => setForm({ ...form, institution_code: e.target.value })}
                        placeholder="e.g. 0010"
                        className="h-9 text-xs font-mono bg-white dark:bg-zinc-900"
                      />
                    </div>

                    {/* Branch Code */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Branch Code</label>
                      <Input
                        value={form.branch_code || ""}
                        onChange={(e) => setForm({ ...form, branch_code: e.target.value })}
                        placeholder="Branch Code"
                        className="h-9 text-xs font-mono bg-white dark:bg-zinc-900"
                      />
                    </div>

                    {/* BSB Australia */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">BSB (Australia)</label>
                      <Input
                        value={form.bsb_australia || ""}
                        onChange={(e) => setForm({ ...form, bsb_australia: e.target.value })}
                        placeholder="e.g. 000-000"
                        className="h-9 text-xs font-mono bg-white dark:bg-zinc-900"
                      />
                    </div>

                    {/* Clearing Code */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Clearing Code</label>
                      <Input
                        value={form.clearing_code || ""}
                        onChange={(e) => setForm({ ...form, clearing_code: e.target.value })}
                        placeholder="Clearing Code"
                        className="h-9 text-xs font-mono bg-white dark:bg-zinc-900"
                      />
                    </div>

                    {/* Bank Code */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Bank Code</label>
                      <Input
                        value={form.bank_code || ""}
                        onChange={(e) => setForm({ ...form, bank_code: e.target.value })}
                        placeholder="Bank Code"
                        className="h-9 text-xs font-mono bg-white dark:bg-zinc-900"
                      />
                    </div>

                    {/* Transit */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Transit</label>
                      <Input
                        value={form.transit || ""}
                        onChange={(e) => setForm({ ...form, transit: e.target.value })}
                        placeholder="Transit"
                        className="h-9 text-xs font-mono bg-white dark:bg-zinc-900"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              </div>
            </Tabs>

            {/* FIXED FOOTER */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/90 dark:bg-zinc-900/70 shrink-0">
              <DialogFooter className="p-0 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Treasury settlement audit trail will be logged upon submission.</span>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDiscardConfirm(true)}
                    disabled={isSubmitting}
                    className="h-9 px-4 text-xs font-medium"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-9 px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <SendHorizontal className="h-4 w-4" />
                    {isEditMode ? "Save Changes" : "Confirm Wire & Mark Purchased"}
                  </Button>
                </div>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DISCARD CONFIRMATION MODAL */}
      <AlertDialog open={showDiscardConfirm} onOpenChange={setShowDiscardConfirm}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <AlertDialogTitle>Discard Wire Information?</AlertDialogTitle>
                <AlertDialogDescription className="text-xs mt-1">
                  You have unsaved wire transfer details. Are you sure you want to discard your changes and close?
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogAction
              type="button"
              onClick={() => setShowDiscardConfirm(false)}
            >
              Stay
            </AlertDialogAction>
            <AlertDialogCancel
              type="button"
              onClick={() => {
                setShowDiscardConfirm(false);
                onOpenChange(false);
              }}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
            >
              Discard
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
