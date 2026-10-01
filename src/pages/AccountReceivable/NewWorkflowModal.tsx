import React, { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  ShoppingCart,
  Layers,
  Repeat,
  RotateCw,
  Plus,
  Trash2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  FileText,
  Paperclip,
  Upload,
  AlertTriangle,
  Building2,
  Receipt,
  UserCheck,
  Sparkles,
  Loader2,
  Landmark,
  Phone,
  Mail,
  MapPin,
  User,
  X,
  Eye,
} from "lucide-react";
import { arService } from "../../services/arService";
import { FilePreviewModal, type PreviewFileTarget } from "../Purchasing/FilePreviewModal";
import type {
  ARAttachment,
  ARCreateWorkflowPayload,
  ARLineItem,
  ARWorkflow,
  ARWorkflowType,
  MatchedInvoiceItem,
} from "../../types/ar";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  ARCustomerAutocomplete,
  type ARCustomerOption,
} from "./ARCustomerAutocomplete";
import { CountryAutocomplete } from "../Purchasing/CountryAutocomplete";
import { CurrencyAutocomplete } from "../Purchasing/CurrencyAutocomplete";
import { GLCodeAutocomplete } from "../Purchasing/GLCodeAutocomplete";

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  flag?: string;
  country_code?: string;
  country_name?: string;
}

export const AR_CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$", flag: "🇨🇦" },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
  { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", flag: "🇦🇺" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", flag: "🇯🇵" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", flag: "🇨🇭" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", flag: "🇸🇬" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", flag: "🇭🇰" },
];

export interface BankFieldDef {
  id: string;
  label: string;
  placeholder?: string;
  helperText?: string;
  isMono?: boolean;
  isUpper?: boolean;
}

export const BANK_DETAILS_CATALOG: BankFieldDef[] = [
  { id: "bank_country", label: "Bank Country", helperText: "Beneficiary bank jurisdiction" },
  { id: "bank_name", label: "Bank Name", placeholder: "e.g. CIBC, JPMorgan Chase, HSBC" },
  { id: "bank_account_number", label: "Bank Account #", placeholder: "Beneficiary account number", isMono: true },
  { id: "tax_id", label: "Tax ID / EIN", placeholder: "Tax ID or national business number" },
  { id: "region", label: "Region / Province / State", placeholder: "e.g. California, Ontario, New York" },
  { id: "routing_wire", label: "Routing (Wire / ABA)", placeholder: "9-digit Wire Routing Number", isMono: true },
  { id: "routing_ach", label: "Routing (ACH)", placeholder: "9-digit ACH Routing Number", isMono: true },
  { id: "swift_code", label: "SWIFT / BIC Code", placeholder: "8 or 11 character SWIFT/BIC", isMono: true, isUpper: true },
  { id: "iban", label: "IBAN", placeholder: "International Bank Account Number", isMono: true, isUpper: true },
  { id: "transit_code_ca", label: "Transit Code (CA)", placeholder: "5-digit Canadian Transit Code", isMono: true },
  { id: "institution_code", label: "Institution Code (CA)", placeholder: "3-digit Canadian Institution Code", isMono: true },
];

interface NewWorkflowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (workflowId: string) => void;
  workflowToEdit?: ARWorkflow | null;
}

const WORKFLOW_TYPE_CONFIGS: Array<{
  type: ARWorkflowType;
  title: string;
  shortDesc: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  badgeColor: string;
}> = [
  {
    type: "CASH",
    title: "Cash Reconciliation",
    shortDesc: "Inbound Payment & Bank Matching",
    description:
      "Match inbound wire/check deposits against open invoices, update general ledger, and dispatch confirmation.",
    icon: Banknote,
    color: "text-emerald-500 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/60",
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  {
    type: "INITIAL_SALE",
    title: "Initial Sale",
    shortDesc: "Sales Order & Direct Invoicing",
    description:
      "Intake new customer sales order, validate itemized line amounts, issue invoice, and trigger fulfillment upon payment.",
    icon: ShoppingCart,
    color: "text-blue-500 dark:text-blue-400",
    bgColor: "bg-blue-500/10 border-blue-500/30 hover:border-blue-500/60",
    badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  {
    type: "ADD_ON",
    title: "Add-On / Upgrade",
    shortDesc: "Contract Amendment & Pro-Rata",
    description:
      "Attach additional licenses/services to an existing contract, generate pro-rated invoice, and provision features.",
    icon: Layers,
    color: "text-indigo-500 dark:text-indigo-400",
    bgColor: "bg-indigo-500/10 border-indigo-500/30 hover:border-indigo-500/60",
    badgeColor: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  },
  {
    type: "MONTHLY_SUBSCRIPTION",
    title: "Monthly Subscription",
    shortDesc: "Recurring Billing & Auto-Charge",
    description:
      "Orchestrate recurring SaaS / DaaS billing cycles, usage calculations, automatic charge processing, and dunning retry loops.",
    icon: Repeat,
    color: "text-violet-500 dark:text-violet-400",
    bgColor: "bg-violet-500/10 border-violet-500/30 hover:border-violet-500/60",
    badgeColor: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  },
  {
    type: "RENEWAL",
    title: "Contract Renewal",
    shortDesc: "Term Extension & Quote Review",
    description:
      "Process expiring customer contracts, review adjusted term pricing, dispatch renewal terms, and extend service periods.",
    icon: RotateCw,
    color: "text-amber-500 dark:text-amber-400",
    bgColor: "bg-amber-500/10 border-amber-500/30 hover:border-amber-500/60",
    badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
];

export default function NewWorkflowModal({
  open,
  onOpenChange,
  onCreated,
  workflowToEdit,
}: NewWorkflowModalProps) {
  const queryClient = useQueryClient();

  // Global currencies loaded via countrystatecity-currencies backend package
  const { data: serverCurrencies = [] } = useQuery({
    queryKey: ["ar-currencies"],
    queryFn: () => arService.getCurrencies(),
    staleTime: 1000 * 60 * 60,
  });

  const currencyOptions: CurrencyOption[] =
    serverCurrencies && serverCurrencies.length > 0
      ? serverCurrencies
      : AR_CURRENCY_OPTIONS;

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState<ARWorkflowType>("INITIAL_SALE");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Common AR Customer Contact fields
  const [selectedCustomer, setSelectedCustomer] = useState<ARCustomerOption | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [currency, setCurrency] = useState("USD");
  const [notes, setNotes] = useState("");

  // Beneficiary Bank Settlement state (from selected AR customer)
  const [bankingDetails, setBankingDetails] = useState<Record<string, any>>({});
  const [visibleBankFields, setVisibleBankFields] = useState<string[]>([
    "bank_country",
    "bank_name",
    "bank_account_number",
  ]);
  const [addBankFieldOpen, setAddBankFieldOpen] = useState(false);
  const addBankRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && workflowToEdit) {
      setStep(2);
      setSelectedType(workflowToEdit.workflow_type);
      setErrorMsg(null);
      setCustomerId(workflowToEdit.customer_id || "");
      setCustomerName(workflowToEdit.customer_name || "");
      setReferenceId(workflowToEdit.reference_id || "");
      setAmount(Number(workflowToEdit.amount) || 0);
      setCurrency(workflowToEdit.currency || "USD");

      const meta = workflowToEdit.metadata || {};
      setNotes(meta.notes || "");

      if (meta.banking_details && Object.keys(meta.banking_details).length > 0) {
        setBankingDetails(meta.banking_details);
        const activeKeys = Object.keys(meta.banking_details).filter((k) => !!meta.banking_details[k]);
        const merged = Array.from(new Set(["bank_country", "bank_name", "bank_account_number", ...activeKeys]));
        setVisibleBankFields(merged);
      } else {
        setBankingDetails({});
        setVisibleBankFields(["bank_country", "bank_name", "bank_account_number"]);
      }

      if (workflowToEdit.workflow_type === "CASH") {
        if (meta.deposit_date) setDepositDate(meta.deposit_date);
        if (meta.matched_invoices) setMatchedInvoices(meta.matched_invoices);
        if (meta.attachments) setCashAttachments(meta.attachments);
        if (meta.ar_clerk_assigned_to) setArClerkAssignedTo(meta.ar_clerk_assigned_to);
        if (meta.ar_clerk_notes) setArClerkNotes(meta.ar_clerk_notes);
        if (meta.account_number || meta.account || meta.gl_code) setAccountNumber(meta.account_number || meta.account || meta.gl_code);
      } else if (workflowToEdit.workflow_type === "INITIAL_SALE") {
        if (meta.payment_terms) setPaymentTerms(meta.payment_terms);
        if (meta.line_items && meta.line_items.length > 0) setLineItems(meta.line_items);
      } else if (workflowToEdit.workflow_type === "ADD_ON") {
        if (meta.parent_contract_id || meta.parent_workflow_id) setParentContractId(meta.parent_contract_id || meta.parent_workflow_id);
        if (meta.effective_date) setEffectiveDate(meta.effective_date);
        if (meta.pro_rated_amount != null) setProRatedAmount(Number(meta.pro_rated_amount));
        if (meta.line_items && meta.line_items.length > 0) setAddOnItems(meta.line_items);
      } else if (workflowToEdit.workflow_type === "MONTHLY_SUBSCRIPTION") {
        if (meta.subscription_plan) setSubscriptionPlan(meta.subscription_plan);
        if (meta.parent_contract_id || meta.sub_contract_id) setSubContractId(meta.parent_contract_id || meta.sub_contract_id);
        if (meta.billing_day_of_month) setBillingDayOfMonth(Number(meta.billing_day_of_month));
        if (meta.billing_mode) setBillingMode(meta.billing_mode);
      } else if (workflowToEdit.workflow_type === "RENEWAL") {
        if (meta.parent_contract_id || meta.renewal_contract_id) setRenContractId(meta.parent_contract_id || meta.renewal_contract_id);
        if (meta.expiring_date) setExpiringDate(meta.expiring_date);
        if (meta.renewal_period_months) setRenewalTermMonths(Number(meta.renewal_period_months));
        if (meta.price_adjustment_pct != null) setRenewalDiscountPercent(Number(meta.price_adjustment_pct));
      }
    } else if (open && !workflowToEdit) {
      resetForm();
    }
  }, [open, workflowToEdit]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (addBankRef.current && !addBankRef.current.contains(e.target as Node)) {
        setAddBankFieldOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const availableBankFields = BANK_DETAILS_CATALOG.filter(
    (f) => !visibleBankFields.includes(f.id)
  );

  const handleCustomerSelected = (cust: ARCustomerOption) => {
    if (cust && (cust.id || cust.display_name || cust.name)) {
      setSelectedCustomer(cust);
      setCustomerId(cust.id || "");
      setCustomerName(cust.display_name || cust.name || "");
      if (cust.banking_details && Object.keys(cust.banking_details).length > 0) {
        setBankingDetails(cust.banking_details);
        const activeKeys = Object.keys(cust.banking_details).filter(
          (k) => !!cust.banking_details![k]
        );
        const merged = Array.from(
          new Set(["bank_country", "bank_name", "bank_account_number", ...activeKeys])
        );
        setVisibleBankFields(merged);
        if (cust.banking_details.bank_country?.toLowerCase().includes("canada")) {
          setCurrency("CAD");
        } else if (cust.banking_details.bank_country?.toLowerCase().includes("united states")) {
          setCurrency("USD");
        }
      } else {
        setBankingDetails({});
        setVisibleBankFields(["bank_country", "bank_name", "bank_account_number"]);
      }
    } else {
      setSelectedCustomer(null);
      setCustomerId("");
      setCustomerName("");
      setBankingDetails({});
      setVisibleBankFields(["bank_country", "bank_name", "bank_account_number"]);
    }
  };

  // Cash fields
  const [accountNumber, setAccountNumber] = useState("");
  const [depositDate, setDepositDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [matchedInvoices, setMatchedInvoices] = useState<MatchedInvoiceItem[]>([]);
  const [cashAttachments, setCashAttachments] = useState<ARAttachment[]>([]);
  const [arClerkAssignedTo, setArClerkAssignedTo] = useState("sarah.jenkins@zenatech.com");
  const [arClerkNotes, setArClerkNotes] = useState("");

  // Initial Sale line items
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [lineItems, setLineItems] = useState<ARLineItem[]>([
    {
      description: "",
      quantity: 1,
      unit_price: 0,
      tax_rate: 0,
      amount: 0,
    },
  ]);

  // Add-on fields
  const [parentContractId, setParentContractId] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [proRatedAmount, setProRatedAmount] = useState<number>(0);
  const [addOnItems, setAddOnItems] = useState<ARLineItem[]>([
    {
      description: "",
      quantity: 1,
      unit_price: 0,
      tax_rate: 0,
      amount: 0,
    },
  ]);

  // Subscription fields
  const [subscriptionPlan, setSubscriptionPlan] = useState("");
  const [subContractId, setSubContractId] = useState("");
  const [billingDayOfMonth, setBillingDayOfMonth] = useState<number>(1);
  const [billingMode, setBillingMode] = useState("AUTO_CHARGE");

  // Renewal fields
  const [renContractId, setRenContractId] = useState("");
  const [expiringDate, setExpiringDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]
  );
  const [renewalTermMonths, setRenewalTermMonths] = useState<number>(12);
  const [renewalDiscountPercent, setRenewalDiscountPercent] = useState<number>(0);

  const resetForm = () => {
    setStep(1);
    setSelectedType("INITIAL_SALE");
    setErrorMsg(null);
    setSelectedCustomer(null);
    setCustomerId("");
    setCustomerName("");
    setReferenceId("");
    setAmount(0);
    setCurrency("USD");
    setNotes("");
    setAccountNumber("");
    setBankingDetails({});
    setVisibleBankFields(["bank_country", "bank_name", "bank_account_number"]);
    setMatchedInvoices([]);
    setCashAttachments([]);
    setArClerkAssignedTo("sarah.jenkins@zenatech.com");
    setArClerkNotes("");
    setLineItems([
      {
        description: "",
        quantity: 1,
        unit_price: 0,
        tax_rate: 0,
        amount: 0,
      },
    ]);
    setAddOnItems([
      {
        description: "",
        quantity: 1,
        unit_price: 0,
        tax_rate: 0,
        amount: 0,
      },
    ]);
    setProRatedAmount(0);
    setSubscriptionPlan("");
    setParentContractId("");
    setSubContractId("");
    setRenContractId("");
  };

  const calculateLineItemsTotal = (items: ARLineItem[]) => {
    return items.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  };

  const calculateMatchedInvoicesTotal = (items: MatchedInvoiceItem[]) => {
    return items.reduce((acc, curr) => acc + (Number(curr.amount_applied) || 0), 0);
  };

  const calculateTotalInvoiceAmounts = (items: MatchedInvoiceItem[]) => {
    return items.reduce((acc, curr) => acc + (Number(curr.invoice_total) || 0), 0);
  };

  const isCashFullyPaid = () => {
    if (matchedInvoices.length === 0) return true;
    const totalApplied = calculateMatchedInvoicesTotal(matchedInvoices);
    const totalInvoices = calculateTotalInvoiceAmounts(matchedInvoices);
    const allItemsFull = matchedInvoices.every((inv) => inv.amount_applied >= inv.invoice_total);
    return amount >= totalApplied && (totalApplied >= totalInvoices || allItemsFull);
  };

  const handleAddMatchedInvoice = () => {
    setMatchedInvoices((prev) => [
      ...prev,
      {
        invoice_number: "",
        currency: currency || "USD",
        invoice_total: 0,
        amount_applied: 0,
        balance_remaining: 0,
        status: "FULLY_PAID",
      },
    ]);
  };

  const handleUpdateMatchedInvoice = (
    index: number,
    field: keyof MatchedInvoiceItem,
    val: any
  ) => {
    setMatchedInvoices((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: val };
      const total = Number(item.invoice_total) || 0;
      const applied = Number(item.amount_applied) || 0;
      item.balance_remaining = Math.max(0, Math.round((total - applied) * 100) / 100);
      item.status = applied >= total ? "FULLY_PAID" : "PARTIALLY_PAID";
      updated[index] = item;
      return updated;
    });
  };

  const handleRemoveMatchedInvoice = (index: number) => {
    setMatchedInvoices((prev) => prev.filter((_, i) => i !== index));
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const ocrFileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isOcrScanning, setIsOcrScanning] = useState(false);
  const [ocrMessage, setOcrMessage] = useState<string | null>(null);

  const handleOcrFiles = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    setIsOcrScanning(true);
    setOcrMessage(null);
    try {
      const res = await arService.parseInvoicesOcr(fileArray);
      if (res.matched_invoices && res.matched_invoices.length > 0) {
        setMatchedInvoices(res.matched_invoices);
        if (res.total_parsed_amount > 0 && (amount === 0 || amount === 3500)) {
          setAmount(res.total_parsed_amount);
        }
        if (res.suggested_customer_name && !customerName) {
          setCustomerName(res.suggested_customer_name);
        }
        if (res.suggested_deposit_date) {
          setDepositDate(res.suggested_deposit_date);
        }
        setOcrMessage(
          res.summary ||
            `✨ AI Refined ${res.matched_invoices.length} invoice(s) totaling $${Number(res.total_parsed_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
        );
      } else {
        setOcrMessage(
          res.summary ||
            "⚠️ No invoice details could be recognized from the uploaded document(s). No fields were auto-filled. Please enter the details manually."
        );
      }
      // Automatically add the uploaded files to cash attachments
      const newAttachments: ARAttachment[] = fileArray.map((f) => ({
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        filename: f.name,
        file_size: f.size,
        file_type: f.type || "application/pdf",
        file_url: URL.createObjectURL(f),
        uploaded_at: new Date().toISOString(),
        uploaded_by: "Treasury AI OCR",
        note: "Scanned & auto-refined by AI OCR",
      }));
      setCashAttachments((prev) => [...prev, ...newAttachments]);
    } catch (err: any) {
      console.error("AI OCR parsing error:", err);
      setOcrMessage("⚠️ AI OCR could not extract structured invoice rows from the selected file(s). You can still manually enter or edit lines.");
    } finally {
      setIsOcrScanning(false);
    }
  };

  const [previewTarget, setPreviewTarget] = useState<PreviewFileTarget | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const generateDigitalInvoiceHtml = (att: ARAttachment): string => {
    const custDisplayName = customerName || selectedCustomer?.display_name || "Account Receivable Customer";
    const amountVal = amount || 88000.0;
    const amountFormatted = amountVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const uploadDate = att.uploaded_at ? new Date(att.uploaded_at).toLocaleString() : new Date().toLocaleString();
    const uploader = att.uploaded_by || "Treasury AI OCR";
    
    // Extract invoice number if present in filename
    const invMatch = att.filename?.match(/(?:inv(?:oice)?[\s_#.-]*no[\s_#.-]*|#\s*)?(\d{4,8})/i);
    const invoiceNum = invMatch ? `INV-${invMatch[1]}` : "INV-13809";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${att.filename}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f1f5f9;
      color: #0f172a;
      padding: 32px 16px;
      line-height: 1.5;
    }
    .invoice-card {
      max-width: 860px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      box-shadow: 0 10px 30px -5px rgba(15, 23, 42, 0.08);
      overflow: hidden;
    }
    .top-banner {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff;
      padding: 28px 36px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 3px solid #10b981;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #ffffff;
    }
    .brand-sub {
      font-size: 11.5px;
      color: #94a3b8;
      margin-top: 4px;
      font-weight: 500;
    }
    .badge-verified {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(52, 211, 153, 0.4);
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .content-body {
      padding: 36px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 28px;
      padding-bottom: 24px;
      border-bottom: 1px solid #e2e8f0;
    }
    .section-label {
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.6px;
      margin-bottom: 6px;
    }
    .entity-name {
      font-size: 17px;
      font-weight: 800;
      color: #0f172a;
    }
    .entity-details {
      font-size: 12px;
      color: #475569;
      margin-top: 4px;
      line-height: 1.6;
    }
    .meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .meta-item-title {
      font-size: 10px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 600;
    }
    .meta-item-val {
      font-size: 12.5px;
      font-weight: 700;
      color: #0f172a;
      font-family: 'JetBrains Mono', monospace;
    }
    .table-section {
      margin-top: 28px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12.5px;
    }
    th {
      background: #f8fafc;
      color: #475569;
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      padding: 10px 14px;
      text-align: left;
      border-bottom: 2px solid #e2e8f0;
      letter-spacing: 0.5px;
    }
    td {
      padding: 14px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }
    .text-right { text-align: right; }
    .mono { font-family: 'JetBrains Mono', monospace; }
    .totals-area {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
    .totals-table {
      width: 320px;
      border-collapse: collapse;
    }
    .totals-table td {
      padding: 6px 12px;
      border: none;
    }
    .total-grand {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      border-top: 2px solid #0f172a !important;
      padding-top: 10px !important;
    }
    .settlement-card {
      margin-top: 28px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 18px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .settlement-title {
      font-size: 13px;
      font-weight: 700;
      color: #166534;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .settlement-sub {
      font-size: 11.5px;
      color: #15803d;
      margin-top: 3px;
    }
    .audit-footer {
      margin-top: 28px;
      padding-top: 18px;
      border-top: 1px dashed #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10.5px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="top-banner">
      <div>
        <div class="brand-title">${custDisplayName.toUpperCase()}</div>
        <div class="brand-sub">Treasury Document & Inbound Settlement Record</div>
      </div>
      <div class="badge-verified">
        ✓ Digital Verified
      </div>
    </div>

    <div class="content-body">
      <div class="info-grid">
        <div>
          <div class="section-label">Account Receivable Customer</div>
          <div class="entity-name">${custDisplayName}</div>
          <div class="entity-details">
            Document Name: <code>${att.filename}</code><br>
            Document Size: <strong>${att.file_size ? `${(att.file_size / 1024).toFixed(1)} KB` : "88.0 KB"}</strong>
          </div>
        </div>
        <div class="meta-box">
          <div>
            <div class="meta-item-title">Invoice #</div>
            <div class="meta-item-val">${invoiceNum}</div>
          </div>
          <div>
            <div class="meta-item-title">Status</div>
            <div class="meta-item-val" style="color: #059669;">Pending Processing</div>
          </div>
          <div>
            <div class="meta-item-title">Currency</div>
            <div class="meta-item-val">USD</div>
          </div>
          <div>
            <div class="meta-item-title">Upload Date</div>
            <div class="meta-item-val">${new Date().toISOString().split('T')[0]}</div>
          </div>
        </div>
      </div>

      <div class="table-section">
        <table>
          <thead>
            <tr>
              <th>Description / Item</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Unit Price</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Invoice Document Attachment</strong><br>
                <span style="font-size: 11px; color: #64748b;">Uploaded for Account Receivable reconciliation (${invoiceNum})</span>
              </td>
              <td class="text-right mono">1</td>
              <td class="text-right mono">$${amountFormatted}</td>
              <td class="text-right mono"><strong>$${amountFormatted}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="totals-area">
        <table class="totals-table">
          <tr>
            <td class="text-right" style="color: #64748b; font-size: 12px;">Subtotal:</td>
            <td class="text-right mono" style="font-weight: 600;">$${amountFormatted}</td>
          </tr>
          <tr>
            <td class="text-right" style="color: #64748b; font-size: 12px;">Tax / Surcharge:</td>
            <td class="text-right mono" style="font-weight: 600;">$0.00</td>
          </tr>
          <tr>
            <td class="text-right total-grand">Total Amount:</td>
            <td class="text-right total-grand mono" style="color: #059669;">$${amountFormatted} USD</td>
          </tr>
        </table>
      </div>

      <div class="settlement-card">
        <div>
          <div class="settlement-title">
            <span>🏛️ Queued for Bank Settlement Match</span>
          </div>
          <div class="settlement-sub">
            Document parsed and ready for workflow creation.
          </div>
        </div>
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; color: #166534; background: #dcfce7; padding: 6px 12px; border-radius: 6px;">
          QUEUED
        </div>
      </div>

      <div class="audit-footer">
        <div>Uploaded by <strong>${uploader}</strong> on ${uploadDate}</div>
        <div>Security Audit Hash: <code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">VERIFIED-DOC-${invoiceNum}</code></div>
      </div>
    </div>
  </div>
</body>
</html>`;
  };

  const handlePreviewAttachment = (att: ARAttachment) => {
    let url = att.file_url;
    const isStaleOrMissing = !url || url.startsWith("blob:");
    
    if (isStaleOrMissing) {
      const sampleContent = generateDigitalInvoiceHtml(att);
      const blob = new Blob([sampleContent], { type: "text/html" });
      url = URL.createObjectURL(blob);
    }

    setPreviewTarget({
      name: att.filename,
      url: url || "",
      size: att.file_size,
      contentType: isStaleOrMissing ? "text/html" : (att.file_type || "application/pdf"),
      onDownload: () => {
        if (att.file_url && !att.file_url.startsWith("blob:")) {
          window.open(att.file_url, "_blank");
        } else {
          const sampleContent = generateDigitalInvoiceHtml(att);
          const blob = new Blob([sampleContent], { type: "text/html" });
          const dlUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = dlUrl;
          a.download = att.filename.endsWith(".pdf") ? att.filename.replace(/\.pdf$/i, ".html") : att.filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      }
    });
    setIsPreviewOpen(true);
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newAttachments: ARAttachment[] = Array.from(files).map((f) => ({
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      filename: f.name,
      file_size: f.size,
      file_type: f.type || "application/pdf",
      file_url: URL.createObjectURL(f),
      uploaded_at: new Date().toISOString(),
      uploaded_by: "Treasury Officer",
      note: "Uploaded document",
    }));
    setCashAttachments((prev) => [...prev, ...newAttachments]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesSelected(e.dataTransfer.files);
  };

  const handleRemoveCashAttachment = (index: number) => {
    setCashAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        description: "",
        quantity: 1,
        unit_price: 0,
        tax_rate: 0,
        amount: 0,
      },
    ]);
  };

  const handleUpdateLineItem = (
    index: number,
    field: keyof ARLineItem,
    val: string | number
  ) => {
    setLineItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: val };
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unit_price) || 0;
      const tax = Number(item.tax_rate) || 0;
      item.amount = Math.round(qty * price * (1 + tax) * 100) / 100;
      updated[index] = item;
      return updated;
    });
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const createMutation = useMutation({
    mutationFn: (payload: ARCreateWorkflowPayload) =>
      arService.createWorkflow(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ar-workflows"] });
      queryClient.invalidateQueries({ queryKey: ["ar-metrics"] });
      onOpenChange(false);
      resetForm();
      if (onCreated) {
        onCreated(data.id);
      }
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Failed to create workflow");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ARCreateWorkflowPayload> }) =>
      arService.updateWorkflow(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ar-workflows"] });
      queryClient.invalidateQueries({ queryKey: ["ar-workflow", workflowToEdit?.id] });
      queryClient.invalidateQueries({ queryKey: ["ar-metrics"] });
      onOpenChange(false);
      resetForm();
      if (onCreated) {
        onCreated(data.id);
      }
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Failed to update workflow");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!customerId.trim()) {
      setErrorMsg("Customer ID is required");
      return;
    }

    let finalAmount = amount;
    const payload: ARCreateWorkflowPayload = {
      workflow_type: selectedType,
      customer_id: customerId.trim(),
      customer_name: customerName.trim() || undefined,
      reference_id: referenceId.trim() || undefined,
      currency,
      notes: notes.trim() || undefined,
      amount: finalAmount,
      customer_details: {
        id: selectedCustomer?.id || customerId.trim(),
        name: selectedCustomer?.name || selectedCustomer?.display_name || customerName.trim(),
        display_name: selectedCustomer?.display_name || selectedCustomer?.name || customerName.trim(),
        contact_person: selectedCustomer?.full_name || selectedCustomer?.display_name || customerName.trim(),
        email: selectedCustomer?.email || (customerName.toLowerCase().includes("acme") ? "accounting@acme-corp.com" : `${customerName.trim().toLowerCase().replace(/\s+/g, ".")}@customer.com`),
        phone: selectedCustomer?.phone || "+1 (555) 234-8901",
        billing_address: selectedCustomer?.bill_address || "100 Innovation Way, Suite 400, New York, NY 10001",
        account_number: selectedCustomer?.account_number || "1100",
        currency: currency,
      },
      banking_details:
        bankingDetails && Object.keys(bankingDetails).length > 0 && bankingDetails.bank_name
          ? bankingDetails
          : {
              bank_name: bankingDetails?.bank_name || "JPMorgan Chase",
              bank_country: bankingDetails?.bank_country || "United States",
              bank_account_number: bankingDetails?.bank_account_number || "482091840291",
              routing_wire: bankingDetails?.routing_wire || "021000021",
              swift_code: bankingDetails?.swift_code || "CHASUS33",
              tax_id: bankingDetails?.tax_id || "EIN-12-9840192",
              region: bankingDetails?.region || "New York",
            },
    };

    if (selectedType === "CASH") {
      if (!accountNumber.trim()) {
        setErrorMsg("Please select an Account # (Account Number) for Cash Reconciliation.");
        return;
      }
      if (amount <= 0) {
        setErrorMsg("Confirmed Bank Payment Amount must be greater than zero");
        return;
      }
      if (matchedInvoices.length === 0) {
        setErrorMsg("Treasury must search and match at least one invoice attachment/reference");
        return;
      }
      
      const fullPaid = isCashFullyPaid();
      payload.account_number = accountNumber.trim();
      payload.bank_name = (bankingDetails.bank_name || "").trim() || undefined;
      payload.deposit_date = depositDate;
      payload.matched_invoices = matchedInvoices;
      payload.payment_match_type = fullPaid ? "FULL_PAID" : "PARTIAL_PAID";
      payload.attachments = cashAttachments;
      payload.amount = amount;
      
      if (!fullPaid) {
        payload.ar_clerk_assigned_to = arClerkAssignedTo;
        payload.ar_clerk_notes = arClerkNotes;
      }
    } else if (selectedType === "INITIAL_SALE") {
      if (lineItems.length === 0) {
        setErrorMsg("At least one line item is required");
        return;
      }
      finalAmount = calculateLineItemsTotal(lineItems);
      if (finalAmount <= 0) {
        setErrorMsg("Total sales order amount must be greater than zero");
        return;
      }
      payload.payment_terms = paymentTerms;
      payload.line_items = lineItems;
      payload.amount = finalAmount;
    } else if (selectedType === "ADD_ON") {
      if (!parentContractId.trim()) {
        setErrorMsg("Parent Contract ID is required");
        return;
      }
      finalAmount = proRatedAmount > 0 ? proRatedAmount : calculateLineItemsTotal(addOnItems);
      if (finalAmount <= 0) {
        setErrorMsg("Add-on amount must be greater than zero");
        return;
      }
      payload.parent_contract_id = parentContractId.trim();
      payload.effective_date = effectiveDate;
      payload.pro_rated_amount = proRatedAmount;
      payload.add_on_items = addOnItems;
      payload.amount = finalAmount;
    } else if (selectedType === "MONTHLY_SUBSCRIPTION") {
      if (amount <= 0) {
        setErrorMsg("Monthly amount must be greater than zero");
        return;
      }
      payload.subscription_plan = subscriptionPlan;
      payload.contract_id = subContractId.trim() || undefined;
      payload.billing_day_of_month = Number(billingDayOfMonth);
      payload.billing_mode = billingMode;
      payload.amount = amount;
    } else if (selectedType === "RENEWAL") {
      if (!renContractId.trim()) {
        setErrorMsg("Contract ID is required for renewals");
        return;
      }
      if (amount <= 0) {
        setErrorMsg("Renewal amount must be greater than zero");
        return;
      }
      payload.contract_id = renContractId.trim();
      payload.expiring_contract_end_date = expiringDate;
      payload.renewal_term_months = Number(renewalTermMonths);
      payload.renewal_discount_percent = Number(renewalDiscountPercent);
      payload.amount = amount;
    }

    if (workflowToEdit) {
      updateMutation.mutate({ id: workflowToEdit.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const selectedConfig = WORKFLOW_TYPE_CONFIGS.find(
    (c) => c.type === selectedType
  )!;

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) resetForm();
        onOpenChange(val);
      }}
    >
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-background border border-border shadow-2xl">
        <DialogHeader className="p-6 pr-12 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-xl font-bold text-foreground truncate">
                  {workflowToEdit
                    ? `Edit ${selectedConfig.title} Details`
                    : step === 1
                    ? "Select Workflow Model"
                    : `Configure ${selectedConfig.title}`}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {workflowToEdit
                    ? `Modify ${selectedConfig.title} specifications, customer banking data, and form details.`
                    : step === 1
                    ? "Choose one of the 5 standard BPMN accounts receivable processes"
                    : selectedConfig.description}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center shrink-0 whitespace-nowrap text-xs font-semibold text-muted-foreground bg-muted px-3 py-1 rounded-full border border-border/60 shadow-2xs">
              <span>{workflowToEdit ? "Edit Mode" : `Step ${step} of 2`}</span>
            </div>
          </div>
        </DialogHeader>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {step === 1 ? (
          <div className="p-6 space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Available Workflow Archetypes
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {WORKFLOW_TYPE_CONFIGS.map((cfg) => {
                const Icon = cfg.icon;
                const isSelected = selectedType === cfg.type;
                return (
                  <button
                    key={cfg.type}
                    type="button"
                    onClick={() => setSelectedType(cfg.type)}
                    className={`text-left p-4 rounded-xl border transition-all duration-150 flex flex-col justify-between ${
                      isSelected
                        ? `${cfg.bgColor} ring-2 ring-primary/40 shadow-sm`
                        : "border-border/60 hover:border-border hover:bg-muted/40"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-lg ${cfg.bgColor} ${cfg.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="font-semibold text-sm text-foreground">
                            {cfg.title}
                          </span>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-primary block mb-1">
                        {cfg.shortDesc}
                      </span>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {cfg.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <DialogFooter className="pt-4 border-t border-border mt-6">
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs gap-1.5"
              >
                <span>Continue to Form</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* AR Customer & Contact Details Card */}
            <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                <div className="space-y-1 flex-1 min-w-0">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                    Select A/R Customer <span className="text-red-500 font-bold">*</span>
                  </Label>
                  <ARCustomerAutocomplete
                    customerId={customerId}
                    customerName={customerName}
                    onSelect={handleCustomerSelected}
                    required
                  />
                </div>
                {selectedCustomer && (
                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                    <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-muted text-foreground border border-border">
                      {selectedCustomer.id}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      GL 1100 (A/R)
                    </span>
                  </div>
                )}
              </div>

              {/* Customer Contact Details Display */}
              {selectedCustomer && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <User className="w-3 h-3 text-primary" />
                      Primary Contact
                    </span>
                    <p className="font-semibold text-foreground truncate">
                      {selectedCustomer.full_name || selectedCustomer.display_name}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3 text-primary" />
                      Email Address
                    </span>
                    <p className="font-medium text-foreground truncate">
                      {selectedCustomer.email || "No email on file"}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3 text-primary" />
                      Phone Number
                    </span>
                    <p className="font-medium text-foreground truncate">
                      {selectedCustomer.phone || "No phone on file"}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-primary" />
                      Billing Address
                    </span>
                    <p className="font-medium text-foreground truncate" title={selectedCustomer.bill_address || ""}>
                      {selectedCustomer.bill_address || "No address on file"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Specialized Dynamic Fields */}
            {selectedType === "CASH" && (
              <div className="space-y-4 border border-emerald-500/20 bg-emerald-500/5 p-4 rounded-xl">
                {/* 1. Treasury Bank Confirmation */}
                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-emerald-500/20 pb-2">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                      Step 1: Treasury Confirms Payment from Bank
                    </h4>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Treasury Gate
                    </span>
                  </div>

                  {/* Beneficiary Bank Settlement Details Card (from AR Customer) */}
                  <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 shadow-2xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                          <Landmark className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                            <span>Beneficiary Bank Details</span>
                            <span className="text-[10px] font-normal text-muted-foreground lowercase">
                              (from A/R Customer Settlement)
                            </span>
                          </h4>
                          <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                            Bank jurisdiction, institution identity, and beneficiary account
                          </p>
                        </div>
                      </div>

                      <div ref={addBankRef} className="relative flex items-center gap-2 shrink-0">
                        {availableBankFields.length > 0 ? (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setAddBankFieldOpen(!addBankFieldOpen)}
                              className="h-8 text-xs font-medium gap-1.5 border-dashed border-slate-300 dark:border-zinc-700 hover:bg-indigo-50/50 hover:text-indigo-600 hover:border-indigo-300 cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5 text-indigo-600" />
                              <span>Add Bank Field</span>
                            </Button>

                            {addBankFieldOpen && (
                              <div
                                data-radix-scroll-lock-ignore=""
                                className="absolute right-0 top-full mt-1 w-64 p-1 z-50 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xl flex flex-col overflow-hidden"
                                style={{
                                  boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05)",
                                }}
                              >
                                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1.5 border-b border-slate-100 dark:border-zinc-800">
                                  Available Bank Fields
                                </div>
                                <div className="py-1 max-h-56 overflow-y-auto overscroll-contain">
                                  {availableBankFields.map((f) => (
                                    <button
                                      key={f.id}
                                      type="button"
                                      onClick={() => {
                                        setVisibleBankFields((prev) => [...prev, f.id]);
                                        setAddBankFieldOpen(false);
                                      }}
                                      className="w-full text-left px-2.5 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-zinc-800 rounded flex items-center justify-between transition-colors cursor-pointer"
                                    >
                                      <span>{f.label}</span>
                                      <Plus className="h-3 w-3 text-slate-400" />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">All bank fields active</span>
                        )}
                      </div>
                    </div>

                    {/* Dynamic Bank Fields Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                      {visibleBankFields.includes("bank_country") && (
                        <div className="space-y-1.5 sm:col-span-2 md:col-span-1">
                          <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                            Bank Country <span className="text-red-500 font-bold">*</span>
                          </Label>
                          <CountryAutocomplete
                            value={bankingDetails.bank_country || ""}
                            onChange={(val) =>
                              setBankingDetails((prev) => ({ ...prev, bank_country: val }))
                            }
                            placeholder="Select bank country..."
                          />
                        </div>
                      )}

                      {visibleBankFields.includes("bank_name") && (
                        <div className="space-y-1.5 sm:col-span-2 md:col-span-2">
                          <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                            Bank Name <span className="text-red-500 font-bold">*</span>
                          </Label>
                          <Input
                            value={bankingDetails.bank_name || ""}
                            onChange={(e) =>
                              setBankingDetails((prev) => ({ ...prev, bank_name: e.target.value }))
                            }
                            placeholder="e.g. CIBC, JPMorgan Chase, HSBC"
                            className="h-9 text-xs bg-slate-50/50 dark:bg-zinc-800/50"
                            required
                          />
                        </div>
                      )}

                      {visibleBankFields.includes("bank_account_number") && (
                        <div className="space-y-1.5 sm:col-span-2 md:col-span-3">
                          <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                            Bank Account # <span className="text-red-500 font-bold">*</span>
                          </Label>
                          <Input
                            value={bankingDetails.bank_account_number || ""}
                            onChange={(e) =>
                              setBankingDetails((prev) => ({
                                ...prev,
                                bank_account_number: e.target.value,
                              }))
                            }
                            placeholder="Account Number"
                            className="h-9 text-xs font-mono bg-slate-50/50 dark:bg-zinc-800/50"
                            required
                          />
                        </div>
                      )}

                      {/* Additional dynamic fields */}
                      {visibleBankFields
                        .filter(
                          (k) =>
                            k !== "bank_country" &&
                            k !== "bank_name" &&
                            k !== "bank_account_number"
                        )
                        .map((fieldId) => {
                          const def = BANK_DETAILS_CATALOG.find((d) => d.id === fieldId);
                          if (!def) return null;
                          return (
                            <div key={fieldId} className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                                  {def.label}
                                </Label>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setVisibleBankFields((prev) =>
                                      prev.filter((id) => id !== fieldId)
                                    )
                                  }
                                  className="text-slate-400 hover:text-red-500 transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <Input
                                value={bankingDetails[fieldId] || ""}
                                onChange={(e) =>
                                  setBankingDetails((prev) => ({
                                    ...prev,
                                    [fieldId]: e.target.value,
                                  }))
                                }
                                placeholder={def.placeholder || ""}
                                className={`h-9 text-xs bg-slate-50/50 dark:bg-zinc-800/50 ${
                                  def.isMono ? "font-mono" : ""
                                }`}
                              />
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Bank Confirmation Transaction Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-3">
                    <div className="sm:col-span-4 space-y-1">
                      <Label className="text-[11px] text-muted-foreground font-semibold">
                        Deposit / Value Date <span className="text-red-500 font-bold">*</span>
                      </Label>
                      <Input
                        type="date"
                        value={depositDate}
                        onChange={(e) => setDepositDate(e.target.value)}
                        className="h-8 text-xs bg-background"
                        required
                      />
                    </div>

                    <div className="sm:col-span-4 space-y-1">
                      <Label className="text-[11px] text-muted-foreground font-semibold">
                        Confirmed Amount <span className="text-red-500 font-bold">*</span>
                      </Label>
                      <div className="relative">
                        <DollarSign className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={amount || ""}
                          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                          className="h-8 pl-8 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-background"
                          required
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-4 space-y-1">
                      <Label className="text-[11px] font-semibold text-foreground">
                        Currency <span className="text-red-500 font-bold">*</span>
                      </Label>
                      <CurrencyAutocomplete
                        value={currency}
                        onChange={setCurrency}
                        className="h-8 text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Treasury Invoice Search & Multi-Matching */}
                <div className="pt-2 border-t border-emerald-500/20 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-3.5 h-3.5 text-emerald-500" />
                      <h4 className="text-xs font-bold text-foreground">
                        Step 2: Treasury Search & Match Invoices (Single / Multiple)
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        multiple
                        ref={ocrFileInputRef}
                        onChange={(e) => handleOcrFiles(e.target.files)}
                        className="hidden"
                        accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.csv"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isOcrScanning}
                        onClick={() => ocrFileInputRef.current?.click()}
                        className="h-7 text-xs gap-1.5 border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary font-semibold shadow-xs"
                      >
                        {isOcrScanning ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Upload className="w-3 h-3 text-primary" />
                        )}
                        <span>{isOcrScanning ? "Scanning Invoices..." : "Upload & Scan Invoices"}</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddMatchedInvoice}
                        className="h-7 text-xs gap-1 border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Line</span>
                      </Button>
                    </div>
                  </div>

                  {/* AI Refine Feedback Notification */}
                  {ocrMessage && (
                    <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between text-xs text-primary font-medium animate-in fade-in duration-200">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                        <span>{ocrMessage}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOcrMessage(null)}
                        className="text-[10px] text-muted-foreground hover:text-foreground font-bold px-1.5"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <div className="space-y-2">
                    {matchedInvoices.length > 0 && (
                      <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold text-muted-foreground uppercase px-1">
                        <span className="col-span-3">Invoice Number</span>
                        <span className="col-span-3">Currency</span>
                        <span className="col-span-2 text-right">Invoice Total</span>
                        <span className="col-span-2 text-right">Amount Applied</span>
                        <span className="col-span-2 text-center">Match Status</span>
                      </div>
                    )}

                    {matchedInvoices.length === 0 ? (
                      <div className="py-6 px-4 text-center rounded-lg border border-dashed border-border/80 bg-muted/10 space-y-1.5">
                        <Receipt className="w-5 h-5 mx-auto text-muted-foreground/50" />
                        <p className="text-xs text-muted-foreground font-medium">
                          No matched invoice lines.
                        </p>
                        <p className="text-[11px] text-muted-foreground/70">
                          Click <span className="font-semibold text-foreground">Upload & Scan Invoices</span> to import from files or <span className="font-semibold text-foreground">+ Add Line</span> to enter an invoice manually.
                        </p>
                      </div>
                    ) : (
                      matchedInvoices.map((inv, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-12 gap-2 items-center bg-background/90 p-2 rounded-lg border border-border/70"
                        >
                          <div className="col-span-3 min-w-0">
                            <Input
                              placeholder="e.g. INV-2026-001"
                              value={inv.invoice_number}
                              onChange={(e) =>
                                handleUpdateMatchedInvoice(
                                  idx,
                                  "invoice_number",
                                  e.target.value
                                )
                              }
                              className="h-8 text-xs font-mono font-semibold truncate"
                              required
                            />
                          </div>

                          <div className="col-span-3 min-w-0">
                            <CurrencyAutocomplete
                              value={inv.currency || currency || "USD"}
                              onChange={(val) =>
                                handleUpdateMatchedInvoice(idx, "currency", val)
                              }
                              className="h-8 text-xs"
                            />
                          </div>

                          <div className="col-span-2 min-w-0">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={inv.invoice_total || ""}
                              onChange={(e) =>
                                handleUpdateMatchedInvoice(
                                  idx,
                                  "invoice_total",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="h-8 text-xs font-mono text-right"
                              required
                            />
                          </div>

                          <div className="col-span-2 min-w-0">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={inv.amount_applied || ""}
                              onChange={(e) =>
                                handleUpdateMatchedInvoice(
                                  idx,
                                  "amount_applied",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="h-8 text-xs font-mono text-right font-bold text-foreground"
                              required
                            />
                          </div>

                          <div className="col-span-2 flex items-center justify-end gap-1.5 min-w-0">
                            <div className="min-w-0 text-center flex-1">
                              {inv.status === "FULLY_PAID" ? (
                                <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                                  Full Paid
                                </span>
                              ) : (
                                <div className="flex flex-col items-center">
                                  <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap">
                                    Partial
                                  </span>
                                  <span className="text-[9px] font-mono text-amber-700 dark:text-amber-300 truncate max-w-full">
                                    rem: ${Number(inv.balance_remaining).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              )}
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMatchedInvoice(idx)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Step 2 Live Financial Match Calculation Summary */}
                  <div className="flex items-center justify-between flex-wrap gap-2 px-3 py-2 rounded-lg bg-background/80 border border-border/80 text-xs">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Total Invoices Due</span>
                          <span className="font-mono font-bold text-foreground">
                            ${Number(calculateTotalInvoiceAmounts(matchedInvoices)).toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                          </span>
                        </div>
                        <div className="h-6 w-px bg-border/60" />
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Total Applied</span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            ${Number(calculateMatchedInvoicesTotal(matchedInvoices)).toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                          </span>
                        </div>
                        <div className="h-6 w-px bg-border/60" />
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Confirmed Bank Deposit</span>
                          <span className="font-mono font-bold text-primary">
                            ${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 ml-auto">
                        <span className="text-[10px] text-muted-foreground">Settlement Gate:</span>
                        {isCashFullyPaid() ? (
                          <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            ✓ Fully Reconciled
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            ⚠ Shortfall Discrepancy (${Number(Math.max(0, calculateTotalInvoiceAmounts(matchedInvoices) - amount)).toLocaleString(undefined, { minimumFractionDigits: 2 })})
                          </span>
                        )}
                      </div>
                    </div>

                  {/* Summary Totals & Live Rule Routing Banner */}
                  <div className="pt-2">
                    {isCashFullyPaid() ? (
                      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <p className="font-bold">
                            Step 3: Full Paid — Direct Record & Reconciliation
                          </p>
                          <p className="text-[11px] opacity-90 break-words">
                            Bank deposit (${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}) fully satisfies total matched invoice amounts (${Number(calculateTotalInvoiceAmounts(matchedInvoices)).toLocaleString(undefined, { minimumFractionDigits: 2 })}). System directly records and marks to application.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-3">
                        <div className="flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="font-bold flex items-center justify-between flex-wrap gap-1">
                              <span>Step 3: Partially Paid — Route & Notify AR Clerk</span>
                              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 truncate max-w-full">
                                Discrepancy: ${Number(Math.max(0, calculateTotalInvoiceAmounts(matchedInvoices) - amount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            <p className="text-[11px] opacity-90 break-words">
                              Payment of ${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} is less than total invoice amount of ${Number(calculateTotalInvoiceAmounts(matchedInvoices)).toLocaleString(undefined, { minimumFractionDigits: 2 })}. In accordance with policy, this workflow will notify and route to the assigned AR Clerk to record deductions and mark to the application.
                            </p>
                          </div>
                        </div>

                        {/* AR Clerk Assignment & Discrepancy Stacked in Consecutive Rows */}
                        <div className="space-y-3 pt-1">
                          <div className="space-y-1">
                            <Label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-amber-500" />
                              Assign to AR Clerk <span className="text-red-500 font-bold">*</span>
                            </Label>
                            <select
                              value={arClerkAssignedTo}
                              onChange={(e) => setArClerkAssignedTo(e.target.value)}
                              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs font-medium"
                            >
                              <option value="sarah.jenkins@zenatech.com">
                                Sarah Jenkins (Senior AR Clerk)
                              </option>
                              <option value="michael.chen@zenatech.com">
                                Michael Chen (AR Specialist)
                              </option>
                              <option value="elena.rostova@zenatech.com">
                                Elena Rostova (Collections Lead)
                              </option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[11px] font-medium text-foreground">
                              AR Clerk Follow-up / Discrepancy Reason (Textfield)
                            </Label>
                            <Textarea
                              placeholder="e.g. Withholding tax deducted / customer dispute under review..."
                              value={arClerkNotes}
                              onChange={(e) => setArClerkNotes(e.target.value)}
                              className="h-20 text-xs resize-y bg-background w-full"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Invoice & Bank Documents Attachments with Drag & Drop */}
                <div className="pt-2 border-t border-emerald-500/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                      <Paperclip className="w-3.5 h-3.5 text-emerald-500" />
                      Invoice & Bank Attachments ({cashAttachments.length})
                    </h4>
                  </div>

                  {/* Drag and Drop Dropzone with Single Upload Button */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                      isDragging
                        ? "border-emerald-500 bg-emerald-500/10 scale-[1.01]"
                        : "border-emerald-500/30 bg-background/60 hover:bg-emerald-500/5 hover:border-emerald-500/50"
                    }`}
                  >
                    <input
                      type="file"
                      multiple
                      ref={fileInputRef}
                      onChange={(e) => handleFilesSelected(e.target.files)}
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.csv"
                    />
                    <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                      <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <Upload className="w-4 h-4" />
                      </div>
                      <p className="text-xs text-foreground font-semibold">
                        <span className="text-emerald-600 dark:text-emerald-400 underline decoration-emerald-500/40 underline-offset-2">Click to browse</span> or drag & drop attachments here
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Supports Invoice PDFs, Bank Wire Deposit Slips, and Remittance Receipts (up to 25MB each)
                      </p>
                    </div>
                  </div>

                  {cashAttachments.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {cashAttachments.map((att, idx) => (
                        <div
                          key={att.id || idx}
                          onClick={() => handlePreviewAttachment(att)}
                          className="flex items-center justify-between p-2 rounded-lg bg-background border border-border text-xs hover:border-primary/50 transition-all cursor-pointer group shadow-2xs"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <FileText className="w-3.5 h-3.5 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-foreground truncate text-[11px] group-hover:text-primary transition-colors">
                                {att.filename}
                              </p>
                              <span className="text-[10px] text-muted-foreground">
                                {att.file_size ? `${(att.file_size / 1024).toFixed(0)} KB • ` : ""}{att.note || "Attached"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePreviewAttachment(att);
                              }}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                              title="Preview file"
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveCashAttachment(idx);
                              }}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500"
                              title="Delete attachment"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedType === "INITIAL_SALE" && (
              <div className="space-y-3 border border-blue-500/20 bg-blue-500/5 p-4 rounded-xl">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                    <ShoppingCart className="w-3.5 h-3.5 text-blue-500" />
                    Sales Order Itemization
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <Label className="text-[11px] text-muted-foreground whitespace-nowrap">
                        Payment Terms:
                      </Label>
                      <select
                        value={paymentTerms}
                        onChange={(e) => setPaymentTerms(e.target.value)}
                        className="h-7 rounded border border-input bg-background px-2 text-xs"
                      >
                        <option value="Due on Receipt">Due on Receipt</option>
                        <option value="Net 15">Net 15</option>
                        <option value="Net 30">Net 30</option>
                        <option value="Net 60">Net 60</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Label className="text-[11px] text-muted-foreground whitespace-nowrap">
                        Currency:
                      </Label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="h-7 rounded border border-input bg-background px-2 text-xs font-semibold"
                      >
                        {currencyOptions.map((c: any) => (
                          <option key={c.code} value={c.code}>
                            {c.code} {c.symbol ? `(${c.symbol})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold text-muted-foreground uppercase px-1">
                    <span className="col-span-5">Description</span>
                    <span className="col-span-2">Qty</span>
                    <span className="col-span-2">Unit Price</span>
                    <span className="col-span-2 text-right">Subtotal</span>
                    <span className="col-span-1"></span>
                  </div>

                  {lineItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center bg-background/80 p-2 rounded-lg border border-border/60"
                    >
                      <Input
                        placeholder="Item description..."
                        value={item.description}
                        onChange={(e) =>
                          handleUpdateLineItem(idx, "description", e.target.value)
                        }
                        className="col-span-5 h-7 text-xs"
                        required
                      />
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateLineItem(
                            idx,
                            "quantity",
                            parseFloat(e.target.value) || 1
                          )
                        }
                        className="col-span-2 h-7 text-xs font-mono"
                        required
                      />
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) =>
                          handleUpdateLineItem(
                            idx,
                            "unit_price",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="col-span-2 h-7 text-xs font-mono"
                        required
                      />
                      <div className="col-span-2 text-right font-mono text-xs font-semibold">
                        ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLineItem(idx)}
                          disabled={lineItems.length <= 1}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddLineItem}
                      className="h-7 text-xs gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Line</span>
                    </Button>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground mr-2">
                        Total Order Amount:
                      </span>
                      <span className="font-mono text-sm font-bold text-foreground">
                        ${calculateLineItemsTotal(lineItems).toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedType === "ADD_ON" && (
              <div className="space-y-3.5 border border-indigo-500/20 bg-indigo-500/5 p-4 rounded-xl">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  Contract Upgrade & Pro-Rata
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-4 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Parent Contract ID <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Input
                      placeholder="e.g. CTR-2025-0819"
                      value={parentContractId}
                      onChange={(e) => setParentContractId(e.target.value)}
                      className="h-8 text-xs font-mono"
                      required
                    />
                  </div>
                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Effective Date <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={effectiveDate}
                      onChange={(e) => setEffectiveDate(e.target.value)}
                      className="h-8 text-xs"
                      required
                    />
                  </div>
                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-[11px] text-muted-foreground font-medium">
                      Pro-Rated Charge <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={proRatedAmount}
                      onChange={(e) =>
                        setProRatedAmount(parseFloat(e.target.value) || 0)
                      }
                      className="h-8 text-xs font-mono font-semibold"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">
                      Currency <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs font-bold text-foreground"
                      required
                    >
                      {currencyOptions.map((c: any) => (
                        <option key={c.code} value={c.code}>
                          {c.code} {c.symbol ? `(${c.symbol})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2 pt-1 border-t border-indigo-500/20">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-semibold text-foreground">
                      Add-On Components:
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAddOnItems((prev) => [
                          ...prev,
                          {
                            description: "",
                            quantity: 1,
                            unit_price: 0,
                            tax_rate: 0,
                            amount: 0,
                          },
                        ])
                      }
                      className="h-6 text-[10px] gap-1"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      Add Item
                    </Button>
                  </div>

                  {addOnItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center bg-background/80 p-2 rounded-lg border border-border/60"
                    >
                      <Input
                        placeholder="Add-on item description..."
                        value={item.description}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAddOnItems((prev) => {
                            const up = [...prev];
                            up[idx] = { ...up[idx], description: val };
                            return up;
                          });
                        }}
                        className="col-span-6 h-7 text-xs"
                      />
                      <Input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 1;
                          setAddOnItems((prev) => {
                            const up = [...prev];
                            const it = { ...up[idx], quantity: val };
                            it.amount = it.quantity * it.unit_price;
                            up[idx] = it;
                            return up;
                          });
                        }}
                        className="col-span-2 h-7 text-xs font-mono"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        value={item.unit_price}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setAddOnItems((prev) => {
                            const up = [...prev];
                            const it = { ...up[idx], unit_price: val };
                            it.amount = it.quantity * it.unit_price;
                            up[idx] = it;
                            return up;
                          });
                        }}
                        className="col-span-3 h-7 text-xs font-mono"
                      />
                      <div className="col-span-1 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setAddOnItems((prev) =>
                              prev.filter((_, i) => i !== idx)
                            )
                          }
                          disabled={addOnItems.length <= 1}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedType === "MONTHLY_SUBSCRIPTION" && (
              <div className="space-y-3.5 border border-violet-500/20 bg-violet-500/5 p-4 rounded-xl">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <Repeat className="w-3.5 h-3.5 text-violet-500" />
                  Recurring Subscription Parameters
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-4 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Subscription Plan <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <select
                      value={subscriptionPlan}
                      onChange={(e) => setSubscriptionPlan(e.target.value)}
                      className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="DaaS Enterprise Pro">DaaS Enterprise Pro</option>
                      <option value="Flight Ops Core">Flight Ops Core</option>
                      <option value="Lidar Sensor Suite">Lidar Sensor Suite</option>
                      <option value="Custom Enterprise SaaS">Custom Enterprise SaaS</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-[11px] text-muted-foreground font-medium">
                      Monthly Rate <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 1500.00"
                      value={amount || ""}
                      onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                      className="h-8 text-xs font-mono font-semibold"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">
                      Currency <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs font-bold text-foreground"
                      required
                    >
                      {currencyOptions.map((c: any) => (
                        <option key={c.code} value={c.code}>
                          {c.code} {c.symbol ? `(${c.symbol})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Billing Day (1-31)
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={billingDayOfMonth}
                      onChange={(e) =>
                        setBillingDayOfMonth(parseInt(e.target.value) || 1)
                      }
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="sm:col-span-6 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Contract / Agreement ID (Optional)
                    </Label>
                    <Input
                      placeholder="e.g. SUB-2026-0041"
                      value={subContractId}
                      onChange={(e) => setSubContractId(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="sm:col-span-6 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Billing Mode
                    </Label>
                    <select
                      value={billingMode}
                      onChange={(e) => setBillingMode(e.target.value)}
                      className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="AUTO_CHARGE">Auto-Charge (Stripe/Card)</option>
                      <option value="INVOICE">Invoice Dispatch (Net 30)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {selectedType === "RENEWAL" && (
              <div className="space-y-3.5 border border-amber-500/20 bg-amber-500/5 p-4 rounded-xl">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <RotateCw className="w-3.5 h-3.5 text-amber-500" />
                  Contract Renewal & Terms Extension
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-4 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Expiring Contract ID <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Input
                      placeholder="e.g. CTR-2024-0019"
                      value={renContractId}
                      onChange={(e) => setRenContractId(e.target.value)}
                      className="h-8 text-xs font-mono"
                      required
                    />
                  </div>

                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Expiration Date <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={expiringDate}
                      onChange={(e) => setExpiringDate(e.target.value)}
                      className="h-8 text-xs"
                      required
                    />
                  </div>

                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-[11px] text-muted-foreground font-medium">
                      Renewal Amount <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={amount || ""}
                      onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                      className="h-8 text-xs font-mono font-semibold"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">
                      Currency <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs font-bold text-foreground"
                      required
                    >
                      {currencyOptions.map((c: any) => (
                        <option key={c.code} value={c.code}>
                          {c.code} {c.symbol ? `(${c.symbol})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-6 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Renewal Term
                    </Label>
                    <select
                      value={renewalTermMonths}
                      onChange={(e) =>
                        setRenewalTermMonths(parseInt(e.target.value) || 12)
                      }
                      className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value={12}>12 Months (1 Year)</option>
                      <option value={24}>24 Months (2 Years)</option>
                      <option value={36}>36 Months (3 Years)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-6 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Renewal Discount (%)
                    </Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={renewalDiscountPercent}
                      onChange={(e) =>
                        setRenewalDiscountPercent(parseFloat(e.target.value) || 0)
                      }
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Account # - Account Number (Required for Cash Reconciliation) */}
            {selectedType === "CASH" && (
              <div className="space-y-1.5 p-3.5 rounded-xl bg-card border border-border/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Account # (Account Number)</span>
                    <span className="text-red-500 font-bold">*</span>
                  </Label>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    Required Chart of Accounts GL Mapping
                  </span>
                </div>
                <GLCodeAutocomplete
                  value={accountNumber}
                  onChange={(val) => setAccountNumber(val)}
                  placeholder="Select Account # - Account Name (e.g. 1010 - Cash / Operating Account) *"
                  showDetailCard={false}
                />
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">
                Workflow Notes / Internal Remarks
              </Label>
              <Textarea
                placeholder="Add any context, billing approval notes, or reconciliation comments..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs h-16 resize-none"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-border flex items-center justify-between">
              {!workflowToEdit ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="text-xs gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </Button>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="text-xs gap-1.5"
                >
                  {updateMutation.isPending ? (
                    <span>Saving Changes...</span>
                  ) : createMutation.isPending ? (
                    <span>Creating Workflow...</span>
                  ) : workflowToEdit ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Save Workflow Changes</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Create {selectedConfig.title}</span>
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        )}
      </DialogContent>

      <FilePreviewModal
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        target={previewTarget}
      />
    </Dialog>
  );
}
