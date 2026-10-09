import { useState, useEffect, useRef, useMemo, Fragment } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parse, isValid, addDays, addMonths } from "date-fns";
import {
  ArrowLeft,
  ArrowUp,
  Bookmark,
  BookmarkCheck,
  Building2,
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  CreditCard,
  Edit3,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  Layers,
  Loader2,
  Mail,
  MoreHorizontal,
  Palette,
  Pencil,
  Plus,
  Printer,
  Receipt,
  RotateCcw,
  Save,
  Send,
  Sparkles,
  Trash2,
  User,
  UserCheck,
} from "lucide-react";
import { InvoiceStepper } from "./InvoiceStepper";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import { Calendar } from "../../components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  arInvoiceService,
} from "../../services/arInvoiceService";
import { arQuoteService } from "../../services/arQuoteService";
import type {
  ARCustomer,
  CustomerInvoiceTemplate,
  AddonHierarchyChildRow,
  InvoicePaymentRecord,
} from "../../services/arInvoiceService";
import { ARCustomerAutocomplete } from "./ARCustomerAutocomplete";
import type { ARCustomerOption } from "./ARCustomerAutocomplete";
import { CurrencyAutocomplete } from "../Purchasing/CurrencyAutocomplete";
import { GLCodeAutocomplete } from "../Purchasing/GLCodeAutocomplete";
import { ClassAutocomplete } from "../Purchasing/ClassAutocomplete";
import { OverridePriceModal } from "./OverridePriceModal";
import { BillingStartDatePicker } from "./BillingStartDatePicker";
import { calculateRowPricing, normalizeBillingFrequencyForSelect } from "./lineItemPricingUtils";
import { useNotificationStream } from "@/hooks/useNotifications";

export interface InvoiceSubItem {
  id?: string;
  date?: string;
  activity?: string;
  name?: string;
  title?: string;
  product_name?: string;
  description: string;
  currency?: string;
  quantity: string | number;
  unit_price: string | number;
  unit_discount?: string | number;
  discount_type?: "%" | "$";
  billing_frequency?: string;
  billing_type?: string;
  term?: string | number;
  billing_start_date?: string;
  service_period?: string;
  service_period_start?: string;
  service_period_end?: string;
  next_billing_date?: string;
  end_date?: string;
  tax_rate?: string | number;
  total: string | number;
  charge?: number;
  badge?: string;
  is_prorated?: boolean;
  is_reference_only?: boolean;
  reference_amount?: number;
  calculation?: string;
  date_range?: string;
  full_recurring_label?: string;
  is_manual_override?: boolean;
  is_manual_total?: boolean;
  override_reason?: string;
  status?: string;
  service_status?: string;
}

export interface LineItemFormRow {
  id?: string;
  date?: string;
  activity?: string;
  name?: string;
  description: string;
  currency?: string;
  quantity: string | number;
  unit_price: string | number;
  unit_discount?: string | number;
  discount_type?: "%" | "$";
  billing_frequency?: string;
  billing_type?: string;
  term?: string | number;
  billing_start_date?: string;
  service_period?: string;
  service_period_start?: string;
  service_period_end?: string;
  next_billing_date?: string;
  end_date?: string;
  tax_rate?: string | number;
  total: string | number;
  badge?: string;
  is_prorated?: boolean;
  is_manual_total?: boolean;
  calculation?: string;
  status?: string;
  service_status?: string;
  sub_items?: InvoiceSubItem[];
}

export type InvoiceLayoutStyle = 'pace_plus' | 'interlinkone' | 'modern' | 'classic';

export default function GenerateInvoicePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const pdfPreviewRef = useRef<HTMLDivElement>(null);
  const formTopRef = useRef<HTMLDivElement>(null);

  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<ARCustomer | null>(null);
  const [currentInvoiceId, setCurrentInvoiceId] = useState<string | null>(searchParams.get("invoiceId"));

  // Supplemental Seats & Services Override Modal State
  const [selectedOverrideAddon, setSelectedOverrideAddon] = useState<AddonHierarchyChildRow | null>(null);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);

  // Real-time WebSocket notifications & live cache updates
  useNotificationStream({
    onNotification: (raw: any) => {
      if (!raw) return;
      queryClient.invalidateQueries({ queryKey: ["ar-customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer-templates"] });
      queryClient.invalidateQueries({ queryKey: ["ar-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["next-invoice-eligibility"] });
      if (currentInvoiceId && raw.entity_id && (raw.entity_id === currentInvoiceId || String(raw.entity_id) === String(currentInvoiceId))) {
        arInvoiceService.getInvoice(currentInvoiceId).then((inv: any) => {
          if (inv) {
            if (inv.status) setInvoiceStatus(inv.status);
            if (inv.amount_paid !== undefined) setInvoiceAmountPaid(Number(inv.amount_paid) || 0);
            if (inv.payments) setInvoicePayments(inv.payments);
          }
        });
      }
    },
  });

  // Next Invoice Eligibility Query
  const {
    data: nextInvoiceEligibility,
    isLoading: isNextInvoiceEligibilityLoading,
  } = useQuery({
    queryKey: ["next-invoice-eligibility", currentInvoiceId],
    queryFn: () =>
      currentInvoiceId
        ? arInvoiceService.getNextInvoiceEligibility(currentInvoiceId)
        : Promise.resolve(null),
    enabled: !!currentInvoiceId,
  });

  // Generate Renewal Quote Mutation
  const generateRenewalQuoteMutation = useMutation({
    mutationFn: async () => {
      if (!currentInvoiceId) throw new Error("No invoice selected");
      return arInvoiceService.generateRenewalQuote(currentInvoiceId);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["ar-quotes"] });
      queryClient.invalidateQueries({ queryKey: ["ar-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["ar-quote-summary"] });
      setSaveSuccessMsg(`Generated Renewal Quote #${result.quote_number}! Redirecting to quotation...`);
      setTimeout(() => {
        navigate(`/account-receivable/quotes/${encodeURIComponent(result.quote_id)}`);
      }, 700);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.detail || err?.message || "Failed to generate renewal quote");
    },
  });



  // Template Preset & Layout Styling State (Default to Pace+)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState<string>("Standard Template");
  const [layoutStyle, setLayoutStyle] = useState<InvoiceLayoutStyle>("pace_plus");
  const [isApplyTemplateModalOpen, setIsApplyTemplateModalOpen] = useState(false);
  const [applyTemplateMode, setApplyTemplateMode] = useState<"existing" | "new">("existing");
  const [targetTemplateIdToOverwrite, setTargetTemplateIdToOverwrite] = useState<string>("");
  const [applyNewPresetName, setApplyNewPresetName] = useState<string>("");
  const [applySetAsDefault, setApplySetAsDefault] = useState<boolean>(false);
  const [isSavePresetDialogOpen, setIsSavePresetDialogOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [newPresetIsDefault, setNewPresetIsDefault] = useState(false);
  const [isRenamePresetDialogOpen, setIsRenamePresetDialogOpen] = useState(false);
  const [renamePresetValue, setRenamePresetValue] = useState("");

  // Field Visibility Toggle State (user can show/hide any field in the PDF template)
  const [hiddenFields, setHiddenFields] = useState<Record<string, boolean>>({});

  const isFieldVisible = (key: string) => !hiddenFields[key];

  const toggleFieldVisibility = (key: string) => {
    setHiddenFields((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const renderFieldHeader = (label: string, fieldKey: string, required: boolean = false) => {
    const visible = isFieldVisible(fieldKey);
    return (
      <div className="flex items-center justify-between gap-1 w-full">
        <Label htmlFor={fieldKey} className={`text-xs font-medium transition-colors cursor-pointer ${visible ? "text-foreground" : "text-muted-foreground line-through opacity-70"}`}>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFieldVisibility(fieldKey);
          }}
          className={`p-0.5 px-1.5 rounded transition-colors cursor-pointer flex items-center gap-1 text-[11px] ${
            visible
              ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40"
              : "text-muted-foreground hover:text-foreground bg-muted/70"
          }`}
          title={visible ? `Visible in PDF template (Click to hide ${label})` : `Hidden in PDF template (Click to show ${label})`}
        >
          {visible ? (
            <Eye className="w-3.5 h-3.5" />
          ) : (
            <span className="flex items-center gap-1">
              <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-normal">Hidden</span>
            </span>
          )}
        </button>
      </div>
    );
  };

  const [isTemplateLoading, setIsTemplateLoading] = useState(false);
  const [templateLoadedToast, setTemplateLoadedToast] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [lastPreviewedAt, setLastPreviewedAt] = useState<Date | null>(null);

  // Send Email State (SendGrid with Role-Based Email)
  const [isSendEmailDialogOpen, setIsSendEmailDialogOpen] = useState(false);
  const [emailSender, setEmailSender] = useState("test-invoices@zenatech.com");
  const [emailRecipient, setEmailRecipient] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailCustomMessage, setEmailCustomMessage] = useState("");

  // Quick Edit Modal State for A/R Customer
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);
  const [editCustDisplayName, setEditCustDisplayName] = useState("");
  const [editCustContact, setEditCustContact] = useState("");
  const [editCustPhone, setEditCustPhone] = useState("");
  const [editCustEmail, setEditCustEmail] = useState("");
  const [editCustAddress, setEditCustAddress] = useState("");

  // Invoice State & Due Date
  const [invoiceStatus, setInvoiceStatus] = useState("Draft");
  const [invoiceAmountPaid, setInvoiceAmountPaid] = useState(0);
  const [invoicePayments, setInvoicePayments] = useState<InvoicePaymentRecord[]>([]);

  // Record Payment Dialog State
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [paymentAmountInput, setPaymentAmountInput] = useState<number | string>("");
  const [paymentMethodInput, setPaymentMethodInput] = useState("WIRE");
  const [paymentDateInput, setPaymentDateInput] = useState<string>(new Date().toISOString().split("T")[0]);
  const [paymentRefInput, setPaymentRefInput] = useState("");
  const [paymentGLCodeInput, setPaymentGLCodeInput] = useState("");
  const [paymentClassInput, setPaymentClassInput] = useState("");
  const [paymentNotesInput, setPaymentNotesInput] = useState("");
  const [isPaymentSubmitting, setIsPaymentSubmitting] = useState(false);

  const [invoiceNumber, setInvoiceNumber] = useState("18067");
  const [currency, setCurrency] = useState("USD");
  const [invoiceDate, setInvoiceDate] = useState(
    format(new Date(), "MM/dd/yyyy")
  );
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);

  const [dueDate, setDueDate] = useState(
    format(addDays(new Date(), 29), "MM/dd/yyyy")
  );
  const [isDueDatePopoverOpen, setIsDueDatePopoverOpen] = useState(false);
  const [terms, setTerms] = useState("30 days");
  const [poNumber, setPoNumber] = useState("");

  // From Details (Default: Pace Plus Inc. / 602B W 5th Ave)
  const [fromCompany, setFromCompany] = useState("Pace Plus Inc.");
  const [fromContact, setFromContact] = useState("");
  const [fromPhone, setFromPhone] = useState("(312) 614-1288 | ext 1098");
  const [fromAddress, setFromAddress] = useState("602B W 5th Ave\nNaperville, IL 60563 USA");
  const [fromEmail, setFromEmail] = useState("Accounting@paceplus.com");

  // Bill To Details
  const [billToName, setBillToName] = useState("");
  const [billToPhone, setBillToPhone] = useState("");
  const [billToAddress, setBillToAddress] = useState("");
  const [billToEmail, setBillToEmail] = useState("");

  // Line Items Form Rows (allows typing empty strings without snapping back)
  const [lineItems, setLineItems] = useState<LineItemFormRow[]>([
    {
      date: "",
      activity: "",
      description: "",
      quantity: 1,
      unit_price: 0,
      total: 0,
    },
  ]);

  // Notes & Payment Information (Matching Pace+ / interlinkONE banking layout)
  const [notes, setNotes] = useState("We appreciate your business!");
  const [bankName, setBankName] = useState("Bank of America");
  const [bankAccount, setBankAccount] = useState("2910 2819 7458");
  const [bankAddress, setBankAddress] = useState("896 N Route 59, Aurora, IL 60504");
  const [achRouting, setAchRouting] = useState("026009593");
  const [wireRouting, setWireRouting] = useState("026009593");
  const [bankEmail, setBankEmail] = useState("Accounting@paceplus.com");

  // Fetch all A/R Customers
  const { data: customers = [] } = useQuery({
    queryKey: ["ar-customers"],
    queryFn: () => arInvoiceService.getCustomers(),
  });

  // Fetch Customer Template Presets for selected customer
  const { data: customerTemplates = [], refetch: refetchCustomerTemplates } = useQuery({
    queryKey: ["customer-templates", selectedCustomer?.id],
    queryFn: () => (selectedCustomer?.id ? arInvoiceService.getCustomerTemplates(selectedCustomer.id) : Promise.resolve([])),
    enabled: !!selectedCustomer?.id,
  });

  // Ensure Standard / Original Preset is always at the top, followed by subsequent new presets below it
  const sortedCustomerTemplates = [...customerTemplates].sort((a, b) => {
    const aIsStandard = (a.template_name || "").toLowerCase() === "standard template" || a.is_default;
    const bIsStandard = (b.template_name || "").toLowerCase() === "standard template" || b.is_default;
    if (aIsStandard && !bIsStandard) return -1;
    if (!aIsStandard && bIsStandard) return 1;
    return 0;
  });

  // Handle switching preset from dropdown
  const handleSelectPreset = async (tmplId: string) => {
    if (!selectedCustomer) return;
    setIsTemplateLoading(true);
    try {
      const template = await arInvoiceService.getCustomerTemplate(selectedCustomer.id, tmplId);
      if (template) {
        setSelectedTemplateId(template.id || tmplId);
        setTemplateName(template.template_name || "Standard Template");
        if (template.layout_style) setLayoutStyle(template.layout_style as InvoiceLayoutStyle);
        if (template.invoice_number) setInvoiceNumber(template.invoice_number);
        if (template.currency) setCurrency(template.currency);
        if (template.from_company) setFromCompany(template.from_company);
        if (template.from_contact) setFromContact(template.from_contact);
        if (template.from_phone) setFromPhone(template.from_phone);
        if (template.from_address) setFromAddress(template.from_address);
        if (template.from_email) setFromEmail(template.from_email);
        if (template.bill_to_name) setBillToName(template.bill_to_name);
        if (template.bill_to_phone) setBillToPhone(template.bill_to_phone);
        if (template.bill_to_address) setBillToAddress(template.bill_to_address);
        if (template.bill_to_email) setBillToEmail(template.bill_to_email);
        if (template.po_number) setPoNumber(template.po_number);
        if (template.date) setInvoiceDate(template.date);
        if (template.due_date) setDueDate(template.due_date);
        if (template.terms) setTerms(template.terms);
        if (template.notes !== undefined) setNotes(template.notes);
        if (template.bank_name) setBankName(template.bank_name);
        if (template.bank_account) setBankAccount(template.bank_account);
        if (template.bank_address) setBankAddress(template.bank_address);
        if (template.ach_routing) setAchRouting(template.ach_routing);
        if (template.wire_routing) setWireRouting(template.wire_routing);
        if (template.bank_email) setBankEmail(template.bank_email);
        if (template.line_items && template.line_items.length > 0) {
          setLineItems(
            template.line_items.map((li) => {
              const qty = li.quantity ?? 1;
              const price = li.unit_price ?? 0;
              return {
                id: li.id,
                date: li.date || "",
                activity: li.activity || "",
                description: li.description || "",
                quantity: qty,
                unit_price: price || "",
                total: (Number(qty) || 0) * (Number(price) || 0),
              };
            })
          );
        }
        setTemplateLoadedToast(`Loaded preset "${template.template_name || 'Standard Template'}"`);
      }
    } catch (err) {
      console.error("Error loading preset:", err);
    } finally {
      setIsTemplateLoading(false);
    }
  };

  // Handle customer selection from A/R customer table autocomplete
  const handleSelectCustomerOption = async (custOption: ARCustomerOption) => {
    const cust: ARCustomer = {
      id: custOption.id,
      name: custOption.display_name || custOption.full_name || custOption.name || "",
      display_name: custOption.display_name,
      contact_person: custOption.full_name || undefined,
      email: custOption.email || undefined,
      phone: custOption.phone || undefined,
      billing_address: custOption.bill_address || undefined,
    };
    setSelectedCustomer(cust);
    setCustomerSearch(cust.name);
    setIsTemplateLoading(true);
    setTemplateLoadedToast(null);

    // Auto populate corresponding information into the invoice template
    setBillToName(custOption.full_name || custOption.display_name || "");
    if (custOption.phone) setBillToPhone(custOption.phone);
    if (custOption.bill_address) setBillToAddress(custOption.bill_address);
    if (custOption.email) setBillToEmail(custOption.email);

    try {
      const template = await arInvoiceService.getCustomerTemplate(custOption.id);
      if (template) {
        setSelectedTemplateId(template.id || null);
        setTemplateName(template.template_name || "Standard Template");
        if (template.layout_style) setLayoutStyle(template.layout_style as InvoiceLayoutStyle);
        if (template.invoice_number) setInvoiceNumber(template.invoice_number);
        if (template.currency) setCurrency(template.currency);
        if (template.from_company) setFromCompany(template.from_company);
        if (template.from_contact) setFromContact(template.from_contact);
        if (template.from_phone) setFromPhone(template.from_phone);
        if (template.from_address) setFromAddress(template.from_address);
        if (template.from_email) setFromEmail(template.from_email);

        if (template.bill_to_name) setBillToName(template.bill_to_name);
        if (template.bill_to_phone) setBillToPhone(template.bill_to_phone);
        if (template.bill_to_address) setBillToAddress(template.bill_to_address);
        if (template.bill_to_email) setBillToEmail(template.bill_to_email);

        if (template.po_number) setPoNumber(template.po_number);
        if (template.date) setInvoiceDate(template.date);
        if (template.due_date) setDueDate(template.due_date);
        if (template.terms) setTerms(template.terms);
        if (template.notes !== undefined) setNotes(template.notes);
        if (template.bank_name) setBankName(template.bank_name);
        if (template.bank_account) setBankAccount(template.bank_account);
        if (template.bank_address) setBankAddress(template.bank_address);
        if (template.ach_routing) setAchRouting(template.ach_routing);
        if (template.wire_routing) setWireRouting(template.wire_routing);
        if (template.bank_email) setBankEmail(template.bank_email);

        if (template.line_items && template.line_items.length > 0) {
          setLineItems(
            template.line_items.map((li) => {
              const qty = li.quantity ?? 1;
              const price = li.unit_price ?? 0;
              return {
                id: li.id,
                date: li.date || "",
                activity: li.activity || "",
                description: li.description || "",
                quantity: qty,
                unit_price: price || "",
                total: (Number(qty) || 0) * (Number(price) || 0),
              };
            })
          );
        }

        setTemplateLoadedToast(
          template.has_saved_template
            ? `Loaded saved template for ${cust.name}`
            : `Loaded default profile for ${cust.name}`
        );
      }
    } catch (err) {
      console.error("Error customer template load:", err);
    } finally {
      setIsTemplateLoading(false);
    }
  };

  const handleSelectCustomer = async (cust: ARCustomer) => {
    handleSelectCustomerOption({
      id: cust.id,
      display_name: cust.display_name || cust.name,
      full_name: cust.contact_person,
      email: cust.email,
      phone: cust.phone,
      bill_address: cust.billing_address,
    });
  };

  // Open Quick Edit Modal
  const handleOpenQuickEdit = () => {
    setEditCustDisplayName(selectedCustomer?.display_name || selectedCustomer?.name || billToName || "");
    setEditCustContact(selectedCustomer?.contact_person || billToName || "");
    setEditCustPhone(selectedCustomer?.phone || billToPhone || "");
    setEditCustEmail(selectedCustomer?.email || billToEmail || "");
    setEditCustAddress(selectedCustomer?.billing_address || billToAddress || "");
    setIsQuickEditOpen(true);
  };

  // Quick Edit Mutation
  const updateCustomerMutation = useMutation({
    mutationFn: async () => {
      const custId = selectedCustomer?.id || "CUST-CUSTOM";
      const payload: Partial<ARCustomer> = {
        name: editCustDisplayName || editCustContact || "",
        display_name: editCustDisplayName,
        contact_person: editCustContact,
        phone: editCustPhone,
        email: editCustEmail,
        billing_address: editCustAddress,
      };
      return arInvoiceService.updateCustomer(custId, payload);
    },
    onSuccess: (updatedCust) => {
      queryClient.invalidateQueries({ queryKey: ["ar-customers"] });

      setSelectedCustomer((prev) => ({
        ...(prev || { id: updatedCust.id }),
        ...updatedCust,
      }));

      const targetName = updatedCust.contact_person || updatedCust.display_name || updatedCust.name || "";
      setBillToName(targetName);
      setBillToPhone(updatedCust.phone || "");
      setBillToEmail(updatedCust.email || "");
      setBillToAddress(updatedCust.billing_address || "");

      setTemplateLoadedToast(`Refreshed and updated profile for ${updatedCust.display_name || updatedCust.name}`);
      setIsQuickEditOpen(false);
    },
  });

  // Open Record Payment Modal
  const handleOpenRecordPayment = () => {
    const rem = calculatedTotals.effectiveBalanceDue > 0 ? calculatedTotals.effectiveBalanceDue : (Number(subTotal) || 0);
    setPaymentAmountInput(rem > 0 ? rem : 0);
    setPaymentMethodInput("WIRE");
    setPaymentDateInput(new Date().toISOString().split("T")[0]);
    setPaymentRefInput("");
    setPaymentGLCodeInput("");
    setPaymentClassInput("");
    setPaymentNotesInput("");
    setIsRecordPaymentOpen(true);
  };

  const handleConfirmRecordPayment = async () => {
    if (!currentInvoiceId) return;
    const numAmt = Number(paymentAmountInput);
    if (isNaN(numAmt) || numAmt <= 0) {
      alert("Please enter a valid payment amount greater than $0.00.");
      return;
    }
    setIsPaymentSubmitting(true);
    try {
      await arInvoiceService.recordPayment(currentInvoiceId, {
        amount: numAmt,
        payment_method: paymentMethodInput || "WIRE",
        payment_date: paymentDateInput || new Date().toISOString().split("T")[0],
        reference_number: paymentRefInput.trim() || undefined,
        gl_code: paymentGLCodeInput || undefined,
        class_name: paymentClassInput || undefined,
        notes: paymentNotesInput.trim() || undefined,
      });

      queryClient.invalidateQueries({ queryKey: ["ar-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["next-invoice-eligibility", currentInvoiceId] });

      // Refresh invoice data
      const updated = await arInvoiceService.getInvoice(currentInvoiceId);
      if (updated) {
        const upData = updated as any;
        if (upData.status) setInvoiceStatus(upData.status);
        if (upData.amount_paid !== undefined) setInvoiceAmountPaid(Number(upData.amount_paid) || 0);
        if (upData.payments) setInvoicePayments(upData.payments);
      }

      setIsRecordPaymentOpen(false);
      setSaveSuccessMsg(`Payment of $${numAmt.toFixed(2)} ${currency} recorded successfully!`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err?.response?.data?.detail || err?.message || "Failed to record payment.");
    } finally {
      setIsPaymentSubmitting(false);
    }
  };

  const lastProcessedUrlSignatureRef = useRef<string | null>(null);

  // Initial load from URL query params (either specific invoiceId, quoteId or customerId)
  useEffect(() => {
    const invId = searchParams.get("invoiceId");
    const custId = searchParams.get("customerId");
    const qId = searchParams.get("quoteId") || searchParams.get("quote_id") || searchParams.get("fromQuote");
    const signature = `inv:${invId || ""}|cust:${custId || ""}|q:${qId || ""}`;

    if (lastProcessedUrlSignatureRef.current === signature) return;
    lastProcessedUrlSignatureRef.current = signature;

    if (invId) {
      setCurrentInvoiceId(invId);
      setIsTemplateLoading(true);
      arInvoiceService.getInvoice(invId)
        .then((inv) => {
          if (inv) {
            const invData = inv as any;
            if (invData.status) setInvoiceStatus(invData.status);
            if (invData.amount_paid !== undefined) setInvoiceAmountPaid(Number(invData.amount_paid) || 0);
            if (invData.payments) setInvoicePayments(invData.payments);
            if (invData.invoice_number) setInvoiceNumber(invData.invoice_number);
            if (invData.currency) setCurrency(invData.currency);
            if (inv.layout_style) setLayoutStyle(inv.layout_style as InvoiceLayoutStyle);
            if (inv.template_id) setSelectedTemplateId(inv.template_id);
            if (inv.date) setInvoiceDate(inv.date);
            if (inv.due_date) setDueDate(inv.due_date);
            if (inv.terms) setTerms(inv.terms);
            if (inv.po_number) setPoNumber(inv.po_number);

            if (inv.from_company) setFromCompany(inv.from_company);
            if (inv.from_contact) setFromContact(inv.from_contact);
            if (inv.from_phone) setFromPhone(inv.from_phone);
            if (inv.from_address) setFromAddress(inv.from_address);
            if (inv.from_email) setFromEmail(inv.from_email);

            if (inv.bill_to_name) setBillToName(inv.bill_to_name);
            if (inv.bill_to_phone) setBillToPhone(inv.bill_to_phone);
            if (inv.bill_to_address) setBillToAddress(inv.bill_to_address);
            if (inv.bill_to_email) setBillToEmail(inv.bill_to_email);

            if (inv.notes !== undefined) setNotes(inv.notes);
            if (inv.bank_name) setBankName(inv.bank_name);
            if (inv.bank_account) setBankAccount(inv.bank_account);
            if (inv.bank_address) setBankAddress(inv.bank_address);
            if (inv.ach_routing) setAchRouting(inv.ach_routing);
            if (inv.wire_routing) setWireRouting(inv.wire_routing);
            if (inv.bank_email) setBankEmail(inv.bank_email);

            if (inv.line_items && inv.line_items.length > 0) {
              const recordedPaid = Number(invData.amount_paid) || (invData.payments ? invData.payments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0) : 0);
              const recordedTotal = Number(invData.total_amount) || 0;
              const isInvFullyPaid = recordedPaid >= recordedTotal && recordedTotal > 0;
              let remainingPaidPool = recordedPaid;
              setLineItems(
                inv.line_items.map((li: any) => {
                  const isProrated = !!li.is_prorated || li.badge === "Prorated";
                  const rawFreqForSelect = normalizeBillingFrequencyForSelect(li.billing_frequency || li.billing_type);
                  const rawFreq = rawFreqForSelect === "none" ? "" : rawFreqForSelect;

                  const testProration = computeItemProration(
                    li.quantity !== undefined ? li.quantity : 1,
                    li.unit_price !== undefined ? li.unit_price : "",
                    li.unit_discount ?? "",
                    li.discount_type || "%",
                    rawFreq,
                    li.billing_start_date || "",
                    li.tax_rate ?? "",
                    li.term ?? 1,
                    false
                  );
                  const liAmount = Number(li.total) || testProration.amount || 0;

                  // An item is Paid if explicitly marked Paid, or if it's covered by recorded payments
                  let itemIsPaid = (isInvFullyPaid && li.status !== "Unpaid") || (li.status === "Paid" || li.service_status === "Paid");
                  if (!itemIsPaid && remainingPaidPool >= (liAmount - 0.01) && liAmount > 0) {
                    itemIsPaid = true;
                  }
                  if (itemIsPaid) {
                    remainingPaidPool = Math.max(0, remainingPaidPool - liAmount);
                  }

                  const proration = computeItemProration(
                    li.quantity !== undefined ? li.quantity : 1,
                    li.unit_price !== undefined ? li.unit_price : "",
                    li.unit_discount ?? "",
                    li.discount_type || "%",
                    rawFreq,
                    li.billing_start_date || "",
                    li.tax_rate ?? "",
                    li.term ?? 1,
                    itemIsPaid
                  );

                  const itemDate = li.date || inv.date || invoiceDate;
                  let derivedPeriod = li.service_period || li.date_range || "";
                  let derivedNextBilling = li.next_billing_date || "";
                  if (rawFreq && rawFreq.toLowerCase().includes("month") && (derivedPeriod.includes("2027") || !derivedPeriod) && (itemDate.includes("2026") || (inv.date && inv.date.includes("2026")))) {
                    const p = calculateServicePeriodAndNextBilling(itemDate, rawFreq, li.term ?? 1);
                    if (p.service_period) derivedPeriod = p.service_period;
                    if (p.next_billing_date) derivedNextBilling = p.next_billing_date;
                  }

                  const effectiveTotal = (li.is_manual_total && li.total !== undefined && li.total !== null && li.total !== "")
                    ? (Number(li.total) || 0)
                    : ((li.total !== undefined && li.total !== null && li.total !== "")
                      ? Number(li.total)
                      : proration.amount);

                  return {
                      id: li.id,
                      date: itemDate,
                      activity: li.activity || li.name || "",
                      name: li.name || li.activity || "",
                      description: li.description || "",
                      quantity: li.quantity !== undefined ? li.quantity : 1,
                      unit_price: li.unit_price !== undefined ? li.unit_price : "",
                      unit_discount: li.unit_discount ?? "",
                      discount_type: li.discount_type || "%",
                      billing_frequency: rawFreq,
                      term: li.term ?? 1,
                      billing_start_date: li.billing_start_date || itemDate,
                      service_period: derivedPeriod,
                      service_period_start: li.service_period_start || "",
                      service_period_end: li.service_period_end || "",
                      next_billing_date: derivedNextBilling,
                      end_date: li.end_date || "",
                      tax_rate: li.tax_rate ?? "",
                      total: effectiveTotal,
                      is_manual_total: !!li.is_manual_total,
                      badge: itemIsPaid ? "Paid" : (li.badge || proration.badge),
                      is_prorated: isProrated || proration.isProrated,
                      calculation: li.calculation || proration.formulaString,
                      status: itemIsPaid ? "Paid" : (li.status || "Unpaid"),
                      service_status: itemIsPaid ? "Paid" : (li.service_status || "Unpaid"),
                      sub_items: Array.isArray(li.sub_items) ? li.sub_items.map((sub: any, sIdx: number) => {
                        const subIsProrated = sub.is_prorated !== undefined ? !!sub.is_prorated : (sub.badge === "Prorated" || false);
                        const subDate = sub.date || itemDate;
                        const rawSubFreqForSelect = normalizeBillingFrequencyForSelect(sub.billing_frequency || sub.billing_type || rawFreq);
                        const subFreq = rawSubFreqForSelect === "none" ? rawFreq || "Monthly" : rawSubFreqForSelect;

                        const testSubProration = computeItemProration(
                          sub.quantity !== undefined ? sub.quantity : 1,
                          sub.unit_price !== undefined ? sub.unit_price : "",
                          sub.unit_discount ?? "",
                          sub.discount_type || "%",
                          subFreq,
                          sub.billing_start_date || subDate,
                          sub.tax_rate ?? "",
                          sub.term ?? 1,
                          false
                        );
                        const subAmount = Number(sub.total) || testSubProration.amount || 0;

                        let subIsPaid = (isInvFullyPaid && sub.status !== "Unpaid" && sub.service_status !== "Unpaid") || ((sub.status === "Paid" || sub.service_status === "Paid") && sub.status !== "Unpaid" && sub.service_status !== "Unpaid");
                        if (!subIsPaid && remainingPaidPool >= (subAmount - 0.01) && subAmount > 0) {
                          subIsPaid = true;
                        }
                        if (subIsPaid) {
                          remainingPaidPool = Math.max(0, remainingPaidPool - subAmount);
                        }

                        let subDerivedPeriod = sub.service_period || sub.date_range || "";
                        let subDerivedNextBilling = sub.next_billing_date || "";
                        if (subFreq && subFreq.toLowerCase().includes("month") && (subDerivedPeriod.includes("2027") || !subDerivedPeriod) && (subDate.includes("2026") || (inv.date && inv.date.includes("2026")))) {
                          const sp = calculateServicePeriodAndNextBilling(subDate, subFreq, sub.term ?? 1);
                          subDerivedPeriod = sp.service_period || derivedPeriod;
                          subDerivedNextBilling = sp.next_billing_date || derivedNextBilling;
                        }

                        const subProration = computeItemProration(
                          sub.quantity !== undefined ? sub.quantity : 1,
                          sub.unit_price !== undefined ? sub.unit_price : "",
                          sub.unit_discount ?? "",
                          sub.discount_type || "%",
                          subFreq,
                          sub.billing_start_date || subDate,
                          sub.tax_rate ?? "",
                          sub.term ?? 1,
                          subIsPaid
                        );

                        const subTitle = sub.title || sub.activity || sub.name || `Additional Service #${sIdx + 1}`;
                        const effectiveSubTotal = (sub.is_manual_total && sub.total !== undefined && sub.total !== null && sub.total !== "")
                          ? (Number(sub.total) || 0)
                          : ((sub.total !== undefined && sub.total !== null && sub.total !== "")
                            ? Number(sub.total)
                            : subProration.amount);

                        return {
                          id: sub.id || `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                          date: subDate,
                          activity: subTitle,
                          name: subTitle,
                          title: subTitle,
                          description: sub.description || "",
                          quantity: sub.quantity !== undefined ? sub.quantity : 1,
                          unit_price: sub.unit_price !== undefined ? sub.unit_price : "",
                          unit_discount: sub.unit_discount ?? "",
                          discount_type: sub.discount_type || "%",
                          billing_frequency: subFreq,
                          term: sub.term ?? 1,
                          billing_start_date: sub.billing_start_date || subDate,
                          service_period: subDerivedPeriod,
                          service_period_start: sub.service_period_start || "",
                          service_period_end: sub.service_period_end || "",
                          next_billing_date: subDerivedNextBilling,
                          end_date: sub.end_date || "",
                          tax_rate: sub.tax_rate ?? "",
                          total: effectiveSubTotal,
                          is_manual_total: !!sub.is_manual_total,
                          badge: subIsPaid ? "Paid" : (sub.badge || subProration.badge),
                          is_prorated: subIsProrated || subProration.isProrated,
                          is_reference_only: !!sub.is_reference_only,
                          reference_amount: sub.reference_amount,
                          calculation: sub.calculation || subProration.formulaString,
                          date_range: sub.date_range,
                          full_recurring_label: sub.full_recurring_label,
                          status: subIsPaid ? "Paid" : (sub.status || "Unpaid"),
                          service_status: subIsPaid ? "Paid" : (sub.service_status || "Unpaid"),
                        };
                      }) : [],
                    };
                  })
              );
            }

            // Populate customer profile immediately
            const custName = inv.customer_name || inv.bill_to_name || "A/R Customer";
            const rawCustId = inv.customer_id || (inv.customer_name ? `CUST-${inv.customer_name.replace(/\s+/g, '_')}` : "CUST-CUSTOM");
            const matched = customers && customers.length > 0
              ? customers.find((c) => c.id === rawCustId || c.id === `CUST-${rawCustId}` || c.name === custName || c.display_name === custName)
              : null;

            if (matched) {
              setSelectedCustomer(matched);
              setCustomerSearch(matched.display_name || matched.name);
            } else {
              const fallbackCust: ARCustomer = {
                id: rawCustId,
                name: custName,
                display_name: custName,
                contact_person: inv.bill_to_name || undefined,
                phone: inv.bill_to_phone || undefined,
                email: inv.bill_to_email || undefined,
                billing_address: inv.bill_to_address || undefined,
              };
              setSelectedCustomer(fallbackCust);
              setCustomerSearch(custName);
            }

            setTemplateLoadedToast(`Viewing Generated Invoice: ${inv.invoice_number}`);
          }
        })
        .catch((err) => {
          console.error("Error loading invoice:", err);
        })
        .finally(() => {
          setIsTemplateLoading(false);
        });
    } else if (searchParams.get("quoteId") || searchParams.get("quote_id") || searchParams.get("fromQuote")) {
      const qId = searchParams.get("quoteId") || searchParams.get("quote_id") || searchParams.get("fromQuote");
      if (qId) {
        setCurrentInvoiceId(null);
        setIsTemplateLoading(true);
        arQuoteService.getQuote(qId)
          .then((quote) => {
            if (quote) {
              if (quote.quote_number) setPoNumber(quote.quote_number);
              if (quote.currency) setCurrency(quote.currency);
              if (quote.quote_date) setInvoiceDate(quote.quote_date);
              if (quote.valid_until) setDueDate(quote.valid_until);
              if (quote.terms) setTerms(quote.terms);

              if (quote.company_name) setFromCompany(quote.company_name);
              if (quote.prepared_by_name) setFromContact(quote.prepared_by_name);
              if (quote.prepared_by_email) setFromEmail(quote.prepared_by_email);

              if (quote.customer_id && customers.length > 0) {
                const matched = customers.find(
                  (c) => c.id === quote.customer_id || c.id === `CUST-${quote.customer_id}`
                );
                if (matched) {
                  setSelectedCustomer(matched);
                  setCustomerSearch(matched.name);
                  setBillToName(matched.name);
                } else if (quote.customer_name) {
                  setBillToName(quote.customer_name);
                  setCustomerSearch(quote.customer_name);
                }
              } else if (quote.customer_name) {
                setBillToName(quote.customer_name);
                setCustomerSearch(quote.customer_name);
              }

              if (quote.customer_phone) setBillToPhone(quote.customer_phone);
              if (quote.customer_billing_address) setBillToAddress(quote.customer_billing_address);
              if (quote.customer_email) setBillToEmail(quote.customer_email);

              if (quote.notes) {
                setNotes(quote.notes);
              } else if (quote.quote_number) {
                setNotes(`Generated from Quotation ${quote.quote_number}`);
              }

              if (quote.line_items && quote.line_items.length > 0) {
                setLineItems(
                  quote.line_items.map((li: any) => {
                    const qty = li.quantity !== undefined && li.quantity !== "" ? li.quantity : 1;
                    const price = li.price !== undefined && li.price !== "" ? li.price : (li.unit_price !== undefined ? li.unit_price : "");
                    const disc = li.unit_discount ?? "";
                    const discType = li.discount_type || "%";
                    const tax = li.tax_rate ?? "";
                    const term = li.term ?? 1;
                    const rawFreqForSelect = normalizeBillingFrequencyForSelect(li.billing_frequency || li.billing_type);
                    const freq = rawFreqForSelect === "none" ? "One-Time" : rawFreqForSelect;
                    const bStart = li.billing_start_date || "";

                    const proration = computeItemProration(qty, price, disc, discType, freq, bStart, tax, term);

                    const quoteLineTotal = (li.is_manual_total && li.total !== undefined && li.total !== "")
                      ? (Number(li.total) || 0)
                      : (li.total !== undefined && li.total !== "" ? Number(li.total) : (li.subtotal !== undefined && li.subtotal !== "" ? Number(li.subtotal) : proration.amount));

                    return {
                      id: li.id || `line-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                      date: li.date || quote.quote_date || invoiceDate,
                      activity: li.name || li.activity || "Item",
                      name: li.name || li.activity || "Item",
                      description: li.description || "",
                      quantity: qty,
                      unit_price: price,
                      unit_discount: disc,
                      discount_type: discType,
                      billing_frequency: freq,
                      term: term,
                      billing_start_date: bStart,
                      tax_rate: tax,
                      total: quoteLineTotal,
                      is_manual_total: !!li.is_manual_total,
                      calculation: li.calculation || proration.formulaString,
                      badge: proration.badge,
                      is_prorated: proration.isProrated,
                      sub_items: Array.isArray(li.sub_items) ? li.sub_items.map((sub: any) => {
                        const sQty = sub.quantity !== undefined ? sub.quantity : 1;
                        const sPrice = sub.unit_price !== undefined ? sub.unit_price : (sub.price !== undefined ? sub.price : "");
                        const sDisc = sub.unit_discount ?? "";
                        const sDiscType = sub.discount_type || "%";
                        const rawSubFreqForSelect = normalizeBillingFrequencyForSelect(sub.billing_frequency || sub.billing_type || freq);
                        const sFreq = rawSubFreqForSelect === "none" ? freq || "One-Time" : rawSubFreqForSelect;
                        const sTerm = sub.term ?? 1;
                        const sBStart = sub.billing_start_date || "";
                        const sTax = sub.tax_rate ?? "";
                        const sProration = computeItemProration(sQty, sPrice, sDisc, sDiscType, sFreq, sBStart, sTax, sTerm);
                        const quoteSubTotal = (sub.is_manual_total && sub.total !== undefined && sub.total !== "")
                          ? (Number(sub.total) || 0)
                          : (sub.total !== undefined && sub.total !== "" ? Number(sub.total) : (sub.subtotal !== undefined && sub.subtotal !== "" ? Number(sub.subtotal) : sProration.amount));

                        return {
                          id: sub.id || `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                          date: sub.date || quote.quote_date || invoiceDate,
                          activity: sub.activity || sub.name || sub.title || "Additional Service",
                          name: sub.name || sub.activity || sub.title || "Additional Service",
                          title: sub.title || sub.activity || sub.name || "Additional Service",
                          product_name: sub.product_name || sub.name || "",
                          description: sub.description || "",
                          quantity: sQty,
                          unit_price: sPrice,
                          unit_discount: sDisc,
                          discount_type: sDiscType,
                          billing_frequency: sFreq,
                          term: sTerm,
                          billing_start_date: sBStart,
                          tax_rate: sTax,
                          total: quoteSubTotal,
                          is_manual_total: !!sub.is_manual_total,
                          calculation: sub.calculation || sProration.formulaString,
                          badge: sub.badge || sProration.badge,
                          is_prorated: sProration.isProrated,
                          is_reference_only: !!sub.is_reference_only,
                          reference_amount: sub.reference_amount,
                          date_range: sub.date_range,
                          full_recurring_label: sub.full_recurring_label,
                        };
                      }) : [],
                    };
                  })
                );
              }

              setTemplateLoadedToast(`Mapped fields from Quote: ${quote.quote_number}`);
            }
          })
          .catch((err) => {
            console.error("Error loading quote into invoice:", err);
          })
          .finally(() => {
            setIsTemplateLoading(false);
          });
      }
    } else if (custId && customers.length > 0) {
      setCurrentInvoiceId(null);
      const match = customers.find((c) => c.id === custId);
      if (match) {
        handleSelectCustomer(match);
      }
    }

    // Auto-fetch next available invoice number for new invoices
    if (!invId && !qId) {
      arInvoiceService.getNextInvoiceNumber().then((res) => {
        if (res?.next_invoice_number) {
          setInvoiceNumber(res.next_invoice_number);
        }
      });
    }
  }, [searchParams, customers]);

  // Synchronize selectedCustomer with live customers list once loaded
  useEffect(() => {
    if (customers.length > 0 && selectedCustomer) {
      const match = customers.find(
        (c) =>
          c.id === selectedCustomer.id ||
          c.id === `CUST-${selectedCustomer.id}` ||
          (selectedCustomer.name && c.name?.toLowerCase() === selectedCustomer.name.toLowerCase()) ||
          (selectedCustomer.display_name && c.display_name?.toLowerCase() === selectedCustomer.display_name.toLowerCase())
      );
      if (match && (match.id !== selectedCustomer.id || match.display_name !== selectedCustomer.display_name)) {
        setSelectedCustomer(match);
      }
    }
  }, [customers, selectedCustomer]);

  // Dynamic Breadcrumb Trail
  useEffect(() => {
    const pageTitle = currentInvoiceId
      ? `Invoice ${invoiceNumber || "Detail"}`
      : "Invoice Generator";

    document.dispatchEvent(
      new CustomEvent("set-breadcrumb-trail", {
        detail: {
          path: window.location.pathname,
          items: [
            { title: "Account Receivable", path: "/account-receivable" },
            { title: pageTitle },
          ],
        },
      })
    );
  }, [currentInvoiceId, invoiceNumber, location.pathname]);

  // Date Parsing Helpers (Strict Local Date Parsing to prevent UTC timezone day shifts)
  const parseFlexibleDate = (dStr: string): Date => {
    if (!dStr) return new Date();
    try {
      const clean = String(dStr).trim();
      // 1. yyyy-MM-dd or yyyy/MM/dd
      if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(clean)) {
        const parts = clean.split(/[-/]/);
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        return new Date(y, m, d);
      }
      // 2. MM/dd/yyyy or MM-dd-yyyy
      if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}/.test(clean)) {
        const parts = clean.split(/[-/]/);
        const m = parseInt(parts[0], 10) - 1;
        const d = parseInt(parts[1], 10);
        const y = parseInt(parts[2], 10);
        return new Date(y, m, d);
      }
      const p1 = parse(clean, "yyyy-MM-dd", new Date());
      if (isValid(p1)) return p1;
      const p2 = parse(clean, "MM/dd/yyyy", new Date());
      if (isValid(p2)) return p2;
      const p3 = parse(clean, "d MMMM yyyy", new Date());
      if (isValid(p3)) return p3;
      const p4 = parse(clean, "MMM dd, yyyy", new Date());
      if (isValid(p4)) return p4;
      const p5 = new Date(clean.replace(/-/g, "/"));
      if (isValid(p5)) return p5;
    } catch {
      // ignore
    }
    return new Date();
  };

  const getSelectedCalendarDate = (): Date => parseFlexibleDate(invoiceDate);
  const getSelectedDueDate = (): Date => parseFlexibleDate(dueDate);

  const handleTermsChange = (newTerm: string) => {
    setTerms(newTerm);
    try {
      const baseDate = parseFlexibleDate(invoiceDate);
      if (newTerm === "15 days" || newTerm === "Net 15") {
        setDueDate(format(addDays(baseDate, 15), "MM/dd/yyyy"));
      } else if (newTerm === "30 days" || newTerm === "Net 30") {
        setDueDate(format(addDays(baseDate, 30), "MM/dd/yyyy"));
      } else if (newTerm === "3 days") {
        setDueDate(format(addDays(baseDate, 3), "MM/dd/yyyy"));
      } else if (newTerm === "7 days") {
        setDueDate(format(addDays(baseDate, 7), "MM/dd/yyyy"));
      } else if (newTerm === "14 days") {
        setDueDate(format(addDays(baseDate, 14), "MM/dd/yyyy"));
      } else if (newTerm === "Net 60") {
        setDueDate(format(addDays(baseDate, 60), "MM/dd/yyyy"));
      } else if (newTerm === "Due on receipt") {
        setDueDate(format(baseDate, "MM/dd/yyyy"));
      }
    } catch {
      // ignore
    }
  };

  const getChargeablePeriodLabel = (term?: number | string, frequency?: string): string => {
    const t = Number(term) || 1;
    const freq = (frequency || "").toLowerCase();
    if (freq.includes("annual") || freq.includes("year")) {
      return `${t} ${t === 1 ? "year" : "years"}`;
    }
    if (freq.includes("month")) {
      return `${t} ${t === 1 ? "month" : "months"}`;
    }
    if (freq.includes("quarter")) {
      return `${t} ${t === 1 ? "quarter" : "quarters"}`;
    }
    if (freq.includes("semi")) {
      return `${t} ${t === 1 ? "semi-annual period" : "semi-annual periods"}`;
    }
    return `${t} ${t === 1 ? "month" : "months"}`;
  };

  const calculateServicePeriodAndNextBilling = (
    startDateStr: string | undefined,
    frequency: string | undefined,
    term: number | string | undefined = 1
  ): { service_period?: string; next_billing_date?: string } => {
    if (!startDateStr || !frequency) return {};
    const freq = frequency.toLowerCase().trim();
    if (freq === "one-time" || freq === "once" || freq === "none" || freq === "") {
      return { service_period: undefined, next_billing_date: undefined };
    }
    try {
      const startDate = parseFlexibleDate(startDateStr);
      if (!isValid(startDate)) return {};
      const t = Math.max(1, Number(term) || 1);
      let monthsToAdd = 1;
      if (freq.includes("annual") || freq.includes("year")) {
        monthsToAdd = 12 * t;
      } else if (freq.includes("semi")) {
        monthsToAdd = 6 * t;
      } else if (freq.includes("quarter")) {
        monthsToAdd = 3 * t;
      } else if (freq.includes("month")) {
        monthsToAdd = 1 * t;
      }

      const endDate = addMonths(startDate, monthsToAdd);
      endDate.setDate(endDate.getDate() - 1);
      const nextDate = addMonths(startDate, monthsToAdd);

      return {
        service_period: `${format(startDate, "MMM dd, yyyy")} – ${format(endDate, "MMM dd, yyyy")}`,
        next_billing_date: format(nextDate, "yyyy-MM-dd"),
      };
    } catch {
      return {};
    }
  };

  // Proration & Full Pricing Calculation Helper based on All 7 Fields
  const computeItemProration = (
    quantity: string | number,
    unit_price: string | number,
    unit_discount?: string | number,
    discount_type: "%" | "$" = "%",
    billing_frequency: string = "",
    billing_start_date: string = "",
    tax_rate?: string | number,
    term?: string | number,
    is_paid?: boolean
  ) => {
    const res = calculateRowPricing({
      quantity,
      unit_price,
      unit_discount,
      discount_type,
      billing_frequency,
      term,
      billing_start_date,
      tax_rate,
      is_paid,
    });

    return {
      amount: res.amount,
      baseAmount: res.subtotalBeforeTax,
      discountAmount: res.discountAmount,
      taxAmount: res.taxAmount,
      formulaString: res.formulaString,
      isProrated: res.isProrated,
      badge: res.badge,
      remainingMonths: res.remainingMonths,
      totalMonths: res.totalMonths,
      proratedNote: res.proratedNote,
    };
  };

  const calculateTotals = () => {
    let newCharges = 0;
    let referenceCharges = 0;
    let totalDiscounts = 0;
    let totalTaxes = 0;
    let totalPaidAmount = 0;
    let totalUnpaidAmount = 0;

    lineItems.forEach((item) => {
      const isItemPaid = (item.status === "Paid" || item.service_status === "Paid") && item.status !== "Unpaid" && item.service_status !== "Unpaid";
      const parentRes = computeItemProration(
        item.quantity,
        item.unit_price,
        item.unit_discount,
        item.discount_type,
        item.billing_frequency,
        item.billing_start_date,
        item.tax_rate,
        item.term,
        isItemPaid
      );

      const itemTotal = (item.total !== undefined && item.total !== "") ? (Number(item.total) || 0) : parentRes.amount;
      newCharges += itemTotal;
      totalDiscounts += parentRes.discountAmount;
      totalTaxes += parentRes.taxAmount;

      if (isItemPaid) {
        totalPaidAmount += itemTotal;
      } else {
        totalUnpaidAmount += itemTotal;
      }

      if (item.sub_items && item.sub_items.length > 0) {
        item.sub_items.forEach((sub) => {
          const isSubPaid = (sub.status === "Paid" || sub.service_status === "Paid") && sub.status !== "Unpaid" && sub.service_status !== "Unpaid";
          const subRes = computeItemProration(
            sub.quantity,
            sub.unit_price,
            sub.unit_discount,
            sub.discount_type,
            sub.billing_frequency,
            sub.billing_start_date,
            sub.tax_rate,
            sub.term,
            isSubPaid
          );

          const subTotal = (sub.total !== undefined && sub.total !== "") ? (Number(sub.total) || 0) : subRes.amount;
          if (sub.is_reference_only) {
            referenceCharges += Number(sub.reference_amount) || subTotal || 0;
          } else {
            newCharges += subTotal;
            totalDiscounts += subRes.discountAmount;
            totalTaxes += subRes.taxAmount;

            if (isSubPaid) {
              totalPaidAmount += subTotal;
            } else {
              totalUnpaidAmount += subTotal;
            }
          }
        });
      }
    });

    const finalPaidAmount = Number(invoiceAmountPaid) || 0;
    const balanceDue = Math.max(0, newCharges - finalPaidAmount);

    return {
      newChargesSubtotal: newCharges,
      referenceChargesSubtotal: referenceCharges,
      totalDiscounts,
      totalTaxes,
      totalPaidAmount: finalPaidAmount,
      totalUnpaidAmount: balanceDue,
      amountDue: newCharges,
      effectiveBalanceDue: balanceDue,
    };
  };

  const calculatedTotals = calculateTotals();
  const subTotal = calculatedTotals.amountDue;

  // Compute Payment Due Date status badge & reminder indicators
  const dueDateInfo = useMemo(() => {
    if (!dueDate) return null;
    const due = parseFlexibleDate(dueDate);
    if (!isValid(due)) return null;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    const isPaid = (invoiceStatus || "").toUpperCase().startsWith("PAID") || calculatedTotals.effectiveBalanceDue === 0;

    if (isPaid) {
      return {
        label: "Settled & Paid",
        variant: "paid",
        diffDays,
        text: "Paid in full",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700",
      };
    }
    if (diffDays < 0) {
      const overdueDays = Math.abs(diffDays);
      return {
        label: `Overdue by ${overdueDays} ${overdueDays === 1 ? "day" : "days"}`,
        variant: "overdue",
        diffDays,
        text: `Past due date (${dueDate})`,
        badgeClass: "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-700 font-bold",
      };
    }
    if (diffDays === 0) {
      return {
        label: "Payment Due Today",
        variant: "due_today",
        diffDays,
        text: "Payment is due today",
        badgeClass: "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700 font-bold",
      };
    }
    if (diffDays <= 7) {
      return {
        label: `Due in ${diffDays} ${diffDays === 1 ? "day" : "days"} • Auto-Reminder Active`,
        variant: "due_soon",
        diffDays,
        text: `Payment due within 7 days (${dueDate})`,
        badgeClass: "bg-orange-50 text-orange-800 border-orange-300 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-700 font-bold",
      };
    }
    return {
      label: `Due in ${diffDays} days`,
      variant: "upcoming",
      diffDays,
      text: `Due on ${dueDate}`,
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    };
  }, [dueDate, invoiceStatus, calculatedTotals.effectiveBalanceDue]);

  // Dynamically compute Next Renewal Projection from live lineItems & sub-items
  const computedNextRenewal = useMemo(() => {
    if (!lineItems || lineItems.length === 0) return null;

    type RenewalComponent = {
      name: string;
      quantity: number;
      unit_price: number;
      total: number;
      frequency: string;
      isSeat?: boolean;
    };

    const components: RenewalComponent[] = [];
    let primaryFrequency = "Annually";
    let hasAnyRecurring = false;

    lineItems.forEach((item, idx) => {
      const bfRaw = (item.billing_frequency || "").trim();
      const isOneTime = bfRaw.toLowerCase() === "one-time" || bfRaw.toLowerCase() === "once" || bfRaw.toLowerCase() === "none";
      const isExplicitRecurring = bfRaw !== "" && !isOneTime;

      // Has recurring sub-items?
      const hasRecurringSubs = (item.sub_items || []).some(sub => {
        const sbf = (sub.billing_frequency || "").trim().toLowerCase();
        return sbf !== "one-time" && sbf !== "once" && sbf !== "none";
      });

      // Item is recurring if explicitly recurring, or if it has recurring sub-items, or if billing frequency is set
      const isItemRecurring = isExplicitRecurring || (bfRaw === "" && hasRecurringSubs);

      const qty = Number(item.quantity) || 0;
      const price = Number(item.unit_price) || 0;
      const discount = Number(item.unit_discount) || 0;
      const netUnitPrice = Math.max(0, price - discount);
      const itemTotal = qty * netUnitPrice;

      if (isItemRecurring && qty > 0) {
        hasAnyRecurring = true;
        const itemFreq = isExplicitRecurring ? bfRaw : "Annually";
        primaryFrequency = itemFreq;
        const itemName = item.activity || item.name || `Item ${idx + 1}`;
        const isSeat = itemName.toLowerCase().includes("seat");

        components.push({
          name: itemName,
          quantity: qty,
          unit_price: netUnitPrice,
          total: itemTotal,
          frequency: itemFreq,
          isSeat,
        });
      }

      // Check sub-items
      if (item.sub_items && item.sub_items.length > 0) {
        item.sub_items.forEach((sub, sIdx) => {
          const sbfRaw = (sub.billing_frequency || "").trim();
          const subIsOneTime = sbfRaw.toLowerCase() === "one-time" || sbfRaw.toLowerCase() === "once" || sbfRaw.toLowerCase() === "none";
          const subIsRecurring = !subIsOneTime && (sbfRaw !== "" || isItemRecurring);

          if (subIsRecurring) {
            hasAnyRecurring = true;
            const subQty = Number(sub.quantity) || 0;
            const subPrice = Number(sub.unit_price) || 0;
            const subDiscount = Number(sub.unit_discount) || 0;
            const subNetUnitPrice = Math.max(0, subPrice - subDiscount);
            const subTotal = subQty * subNetUnitPrice;
            const subFreq = sbfRaw || (isExplicitRecurring ? bfRaw : "Annually");
            const subName = sub.activity || sub.name || `Sub-item ${sIdx + 1}`;
            const isSeat = sub.badge === "SEATS" || subName.toLowerCase().includes("seat") || (sub as any).addition_type === "SEATS";

            components.push({
              name: subName,
              quantity: subQty,
              unit_price: subNetUnitPrice,
              total: subTotal,
              frequency: subFreq,
              isSeat,
            });
          }
        });
      }
    });

    if (!hasAnyRecurring || components.length === 0) {
      return null;
    }

    const totalRenewalAmount = components.reduce((sum, c) => sum + c.total, 0);
    if (totalRenewalAmount <= 0) {
      return null;
    }

    const freqClean = primaryFrequency.toLowerCase();
    let freqLabel = "per year";
    let freqShort = "/ yr";
    if (freqClean.includes("semi")) {
      freqLabel = "per 6 months";
      freqShort = "/ 6-mo";
    } else if (freqClean.includes("quarter")) {
      freqLabel = "per quarter";
      freqShort = "/ qtr";
    } else if (freqClean.includes("month")) {
      freqLabel = "per month";
      freqShort = "/ mo";
    }

    // Check if all components are seats with identical unit price
    const allSeats = components.every(c => c.isSeat);
    const samePrice = components.length > 0 && components.every(c => Math.abs(c.unit_price - components[0].unit_price) < 0.01);

    let summaryText = "";
    if (allSeats && samePrice && components.length > 0) {
      const totalSeats = components.reduce((sum, c) => sum + c.quantity, 0);
      const unitPrice = components[0].unit_price;
      summaryText = `${totalSeats} ${totalSeats === 1 ? "seat" : "seats"} × $${unitPrice.toFixed(2)} ${freqLabel} = $${totalRenewalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency} ${freqLabel}`;
    } else {
      // Build formula breakdown: e.g. "Item 1 (1 × $360.00) + Extra Storage (2 × $50.00) = $460.00 USD per year"
      const formulaParts = components.map(c => {
        return `${c.name} (${c.quantity} × $${c.unit_price.toFixed(2)})`;
      });
      summaryText = `${formulaParts.join(" + ")} = $${totalRenewalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency} ${freqLabel}`;
    }

    return {
      currency,
      billing_frequency: primaryFrequency,
      frequency_label: freqLabel,
      frequency_short: freqShort,
      total_renewal_amount: totalRenewalAmount,
      components,
      summary_text: summaryText,
    };
  }, [lineItems, currency]);

  // Check column visibility: hide any column that is empty/unfilled, null, undefined, or 0 across all items and sub-items
  const allInvoiceItems = useMemo(() => {
    const list: any[] = [];
    (lineItems || []).forEach((item) => {
      list.push(item);
      if (item.sub_items && Array.isArray(item.sub_items)) {
        item.sub_items.forEach((sub: any) => list.push(sub));
      }
    });
    return list;
  }, [lineItems]);

  const showDateCol = useMemo(() => {
    return allInvoiceItems.some(
      (i) => (i.date && String(i.date).trim() !== "") || (i.date_range && String(i.date_range).trim() !== "")
    ) || (!!invoiceDate && String(invoiceDate).trim() !== "");
  }, [allInvoiceItems, invoiceDate]);

  const showUnitPriceCol = useMemo(() => {
    return allInvoiceItems.some(
      (i) => i.unit_price !== undefined && i.unit_price !== null && String(i.unit_price).trim() !== "" && Number(i.unit_price) > 0
    );
  }, [allInvoiceItems]);

  const showCurrencyCol = useMemo(() => {
    return allInvoiceItems.some(
      (i) => i.currency && String(i.currency).trim() !== "" && String(i.currency).trim() !== "0"
    );
  }, [allInvoiceItems]);

  const showQtyCol = useMemo(() => {
    return allInvoiceItems.some(
      (i) => i.quantity !== undefined && i.quantity !== null && String(i.quantity).trim() !== "" && Number(i.quantity) > 0
    );
  }, [allInvoiceItems]);

  const showDiscountCol = useMemo(() => {
    return allInvoiceItems.some(
      (i) => i.unit_discount !== undefined && i.unit_discount !== null && String(i.unit_discount).trim() !== "" && Number(i.unit_discount) > 0
    );
  }, [allInvoiceItems]);

  const showTaxCol = useMemo(() => {
    return allInvoiceItems.some(
      (i) => i.tax_rate !== undefined && i.tax_rate !== null && String(i.tax_rate).trim() !== "" && Number(i.tax_rate) > 0
    );
  }, [allInvoiceItems]);

  const visibleColumnCount = useMemo(() => {
    return [
      showDateCol,
      true, // ACTIVITY / ITEM & DESCRIPTION
      showUnitPriceCol,
      showCurrencyCol,
      showQtyCol,
      showDiscountCol,
      showTaxCol,
      true, // NET PRICE
    ].filter(Boolean).length;
  }, [
    showDateCol,
    showUnitPriceCol,
    showCurrencyCol,
    showQtyCol,
    showDiscountCol,
    showTaxCol,
  ]);

  // Determine if this invoice represents a recurring service agreement
  const isRecurringInvoice = useMemo(() => {
    if (nextInvoiceEligibility?.is_recurring || nextInvoiceEligibility?.eligible || nextInvoiceEligibility?.already_generated) return true;
    if (computedNextRenewal !== null) return true;
    return lineItems.some((li: any) => {
      const freq = (li.billing_frequency || li.billing_type || "").toLowerCase();
      const badge = (li.badge || "").toLowerCase();
      const subHasRec = li.sub_items && li.sub_items.some((sub: any) => {
        const subFreq = (sub.billing_frequency || sub.billing_type || "").toLowerCase();
        const subBadge = (sub.badge || "").toLowerCase();
        return (
          subFreq.includes("month") ||
          subFreq.includes("annual") ||
          subFreq.includes("semi") ||
          subFreq.includes("quarter") ||
          subBadge.includes("recurring") ||
          subBadge.includes("prorated")
        );
      });
      return (
        freq.includes("month") ||
        freq.includes("annual") ||
        freq.includes("semi") ||
        freq.includes("quarter") ||
        badge.includes("recurring") ||
        badge.includes("prorated") ||
        li.is_prorated ||
        li.is_recurring ||
        subHasRec
      );
    });
  }, [nextInvoiceEligibility, computedNextRenewal, lineItems]);

  const handleUpdateLine = (
    index: number,
    field: keyof LineItemFormRow | "total",
    val: any
  ) => {
    setLineItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[index], [field]: val };

      if (field === "billing_frequency" || field === "date" || field === "term" || field === "billing_start_date") {
        const itemDate = item.billing_start_date || item.date || invoiceDate;
        const periods = calculateServicePeriodAndNextBilling(itemDate, item.billing_frequency, item.term);
        item.service_period = periods.service_period;
        item.next_billing_date = periods.next_billing_date;
      }

      if (field === "total") {
        const manualVal = val === "" ? "" : parseFloat(val);
        item.total = manualVal === "" ? "" : (isNaN(manualVal) ? 0 : manualVal);
        item.is_manual_total = val !== "";
        if (val !== "") {
          item.calculation = `Manual Override: $${(Number(item.total) || 0).toFixed(2)}`;
        }
      } else {
        item.is_manual_total = false;
        const isItemPaid = (item.status === "Paid" || item.service_status === "Paid") && item.status !== "Unpaid" && item.service_status !== "Unpaid";
        const proration = computeItemProration(
          item.quantity,
          item.unit_price,
          item.unit_discount,
          item.discount_type,
          item.billing_frequency,
          item.billing_start_date,
          item.tax_rate,
          item.term,
          isItemPaid
        );
        item.total = proration.amount;
        item.calculation = proration.formulaString;
        item.badge = proration.badge;
        item.is_prorated = proration.isProrated;
      }
      copy[index] = item;
      return copy;
    });
  };

  const handleAddLine = () => {
    const isBaselinePaid = !!(
      (invoiceStatus && invoiceStatus.toUpperCase().includes("PAID")) ||
      (Number(invoiceAmountPaid) || 0) > 0 ||
      !!currentInvoiceId
    );
    setLineItems((prev) => [
      ...prev,
      {
        date: invoiceDate,
        activity: `Item ${prev.length + 1}`,
        description: "",
        currency: currency || "USD",
        quantity: 1,
        unit_price: "",
        unit_discount: "",
        discount_type: "%",
        billing_frequency: "One-Time",
        term: 1,
        billing_start_date: "",
        tax_rate: "",
        total: 0,
        badge: isBaselinePaid ? "Prorated" : "",
        is_prorated: isBaselinePaid,
        status: "Unpaid",
        service_status: "Unpaid",
        sub_items: [],
      },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddSubItem = (parentIndex: number) => {
    setLineItems((prev) => {
      const copy = [...prev];
      const parent = { ...copy[parentIndex] };
      const subs = parent.sub_items ? [...parent.sub_items] : [];
      const parentStartDate = parent.billing_start_date || parent.date || invoiceDate;
      const subFreq = parent.billing_frequency || "Monthly";

      const periods = calculateServicePeriodAndNextBilling(parentStartDate, subFreq, 1);
      const subIndex = subs.length + 1;
      const defaultTitle = `Additional Service #${subIndex}`;

      subs.push({
        id: `sub-${Date.now()}`,
        date: parent.date || parentStartDate,
        activity: defaultTitle,
        name: defaultTitle,
        title: defaultTitle,
        description: "",
        currency: parent.currency || currency || "USD",
        quantity: 1,
        unit_price: "",
        unit_discount: "",
        discount_type: "%",
        billing_frequency: subFreq,
        term: 1,
        billing_start_date: parentStartDate,
        service_period: periods.service_period || parent.service_period,
        next_billing_date: periods.next_billing_date || parent.next_billing_date,
        tax_rate: "",
        total: 0,
        badge: "Recurring",
        is_prorated: false,
        status: "Unpaid",
        service_status: "Unpaid",
      });
      parent.sub_items = subs;
      copy[parentIndex] = parent;
      return copy;
    });
  };

  const handleRemoveSubItem = (parentIndex: number, subIndex: number) => {
    setLineItems((prev) => {
      const copy = [...prev];
      const parent = { ...copy[parentIndex] };
      if (parent.sub_items) {
        parent.sub_items = parent.sub_items.filter((_, s) => s !== subIndex);
      }
      copy[parentIndex] = parent;
      return copy;
    });
  };

  const handleUpdateSubItem = (
    parentIndex: number,
    subIndex: number,
    field: keyof InvoiceSubItem | "total",
    val: any
  ) => {
    setLineItems((prev) => {
      const copy = [...prev];
      const parent = { ...copy[parentIndex] };
      if (!parent.sub_items) return prev;
      const subs = [...parent.sub_items];
      const sub = { ...subs[subIndex], [field]: val };

      if (field === "billing_frequency" || field === "date" || field === "term" || field === "billing_start_date") {
        const subDate = sub.billing_start_date || sub.date || parent.billing_start_date || parent.date || invoiceDate;
        const periods = calculateServicePeriodAndNextBilling(subDate, sub.billing_frequency, sub.term);
        sub.service_period = periods.service_period;
        sub.next_billing_date = periods.next_billing_date;
      }

      if (field === "total") {
        const manualVal = val === "" ? "" : parseFloat(val);
        sub.total = manualVal === "" ? "" : (isNaN(manualVal) ? 0 : manualVal);
        sub.is_manual_total = val !== "";
        if (val !== "") {
          sub.calculation = `Manual Override: $${(Number(sub.total) || 0).toFixed(2)}`;
        }
      } else {
        sub.is_manual_total = false;
        const isSubPaid = (sub.status === "Paid" || sub.service_status === "Paid") && sub.status !== "Unpaid" && sub.service_status !== "Unpaid";
        const subProration = computeItemProration(
          sub.quantity,
          sub.unit_price,
          sub.unit_discount,
          sub.discount_type,
          sub.billing_frequency,
          sub.billing_start_date,
          sub.tax_rate,
          sub.term,
          isSubPaid
        );
        sub.total = subProration.amount;
        sub.calculation = subProration.formulaString;
        sub.badge = subProration.badge;
        sub.is_prorated = subProration.isProrated;
      }
      subs[subIndex] = sub;
      parent.sub_items = subs;
      copy[parentIndex] = parent;
      return copy;
    });
  };


  // Handle switching invoice layout template (Pace+ vs interlinkONE)
  const handleSelectInvoiceTemplate = (style: InvoiceLayoutStyle) => {
    setLayoutStyle(style);
    if (style === "pace_plus" || style === "modern") {
      setFromCompany("Pace Plus Inc.");
      setFromPhone("(312) 614-1288 | ext 1098");
      setFromEmail("Accounting@paceplus.com");
      setFromAddress("602B W 5th Ave\nNaperville, IL 60563 USA");
      setBankName("Bank of America");
      setBankAccount("2910 2819 7458");
      setAchRouting("026009593");
      setWireRouting("026009593");
    } else if (style === "interlinkone" || style === "classic") {
      setFromCompany("interlinkONE");
      setFromPhone("(312) 614-1288 | ext 1098");
      setFromEmail("Accounting@paceplus.com");
      setFromAddress("602B W 5th Ave\nNaperville, IL 60563 USA");
      setBankName("Bank of America");
      setBankAddress("896 N Route 59, Aurora, IL 60504");
      setBankAccount("2910 3381 9572");
      setAchRouting("081904808");
      setWireRouting("026009593");
    }
  };

  // Reset form to defaults
  const handleResetForm = () => {
    setCurrentInvoiceId(null);
    setSelectedTemplateId(null);
    setTemplateName("Standard Template");
    setLayoutStyle("pace_plus");
    setInvoiceNumber("18067");
    setCurrency("USD");
    setInvoiceDate(format(new Date(), "MM/dd/yyyy"));
    setDueDate(format(addDays(new Date(), 29), "MM/dd/yyyy"));
    setTerms("Due on receipt");
    setPoNumber("");
    setFromCompany("Pace Plus Inc.");
    setFromContact("");
    setFromPhone("(312) 614-1288 | ext 1098");
    setFromAddress("602B W 5th Ave\nNaperville, IL 60563 USA");
    setFromEmail("Accounting@paceplus.com");
    setBillToName("");
    setBillToPhone("");
    setBillToAddress("");
    setBillToEmail("");
    setLineItems([
      {
        date: format(new Date(), "MM/dd/yyyy"),
        activity: "Item 1",
        description: "service 1",
        quantity: 1,
        unit_price: 50.00,
        unit_discount: "",
        discount_type: "%",
        billing_frequency: "Monthly",
        term: 1,
        billing_start_date: "",
        tax_rate: "",
        total: 50.00,
        sub_items: [],
      },
    ]);
    setNotes("We appreciate your business!");
    setBankName("Bank of America");
    setBankAccount("2910 2819 7458");
    setBankAddress("896 N Route 59, Aurora, IL 60504");
    setAchRouting("026009593");
    setWireRouting("026009593");
    setBankEmail("Accounting@paceplus.com");
  };

  // Build current template payload with sanitized numbers and sub_items
  const currentPayload: CustomerInvoiceTemplate & {
    id?: string;
    status?: string;
    amount_paid?: number;
    balance_due?: number;
    subtotal?: number;
    total_amount?: number;
  } = {
    id: currentInvoiceId || undefined,
    status: calculatedTotals.effectiveBalanceDue === 0 && calculatedTotals.totalPaidAmount > 0
      ? "PAID"
      : (calculatedTotals.totalPaidAmount > 0 ? "PARTIALLY_PAID" : invoiceStatus || "OPEN / UNPAID"),
    amount_paid: calculatedTotals.totalPaidAmount,
    balance_due: calculatedTotals.effectiveBalanceDue,
    template_id: selectedTemplateId || undefined,
    template_name: templateName,
    layout_style: layoutStyle,
    customer_id: selectedCustomer?.id || "CUST-CUSTOM",
    invoice_number: invoiceNumber,
    currency,
    from_company: fromCompany,
    from_contact: fromContact,
    from_phone: fromPhone,
    from_address: fromAddress,
    from_email: fromEmail,
    bill_to_name: billToName,
    bill_to_phone: billToPhone,
    bill_to_address: billToAddress,
    bill_to_email: billToEmail,
    po_number: poNumber,
    date: invoiceDate,
    due_date: dueDate,
    terms,
    notes,
    bank_name: bankName,
    bank_account: bankAccount,
    bank_address: bankAddress,
    ach_routing: achRouting,
    wire_routing: wireRouting,
    bank_email: bankEmail,
    subtotal: calculatedTotals.newChargesSubtotal,
    total_amount: calculatedTotals.newChargesSubtotal,
    line_items: lineItems.map((li) => {
      const liPricing = computeItemProration(
        li.quantity === "" ? 1 : li.quantity,
        li.unit_price,
        li.unit_discount,
        li.discount_type,
        li.billing_frequency,
        li.billing_start_date,
        li.tax_rate,
        li.term === "" ? 1 : li.term
      );

      return {
        id: li.id,
        date: li.date,
        activity: li.activity || li.name || "",
        name: li.name || li.activity || "",
        description: li.description,
        quantity: li.quantity === "" ? 1 : Math.max(1, parseFloat(String(li.quantity)) || 1),
        unit_price: li.unit_price === "" ? 0 : (parseFloat(String(li.unit_price)) || 0),
        unit_discount: li.unit_discount === "" ? 0 : (parseFloat(String(li.unit_discount)) || 0),
        discount_type: li.discount_type || "%",
        billing_frequency: li.billing_frequency || "",
        term: li.term === "" ? 1 : Math.max(1, parseFloat(String(li.term)) || 1),
        billing_start_date: li.billing_start_date || "",
        service_period: li.service_period || "",
        service_period_start: li.service_period_start || "",
        service_period_end: li.service_period_end || "",
        next_billing_date: li.next_billing_date || "",
        end_date: li.end_date || "",
        tax_rate: li.tax_rate === "" ? 0 : (parseFloat(String(li.tax_rate)) || 0),
        total: (li.is_manual_total && li.total !== undefined && li.total !== "") ? (Number(li.total) || 0) : liPricing.amount,
        calculation: (li.is_manual_total && li.calculation) ? li.calculation : liPricing.formulaString,
        badge: li.badge || liPricing.badge,
        is_prorated: !!li.is_prorated || liPricing.isProrated,
        is_manual_total: !!li.is_manual_total,
        status: li.status || (calculatedTotals.totalPaidAmount > 0 && !li.is_prorated ? "Paid" : "Unpaid"),
        service_status: li.service_status || li.status || (calculatedTotals.totalPaidAmount > 0 && !li.is_prorated ? "Paid" : "Unpaid"),
        sub_items: li.sub_items ? li.sub_items.map((sub) => {
          const subPricing = computeItemProration(
            sub.quantity === "" ? 1 : sub.quantity,
            sub.unit_price,
            sub.unit_discount,
            sub.discount_type,
            sub.billing_frequency,
            sub.billing_start_date,
            sub.tax_rate,
            sub.term === "" ? 1 : sub.term
          );

          return {
            id: sub.id,
            date: sub.date,
            activity: sub.activity || sub.name || "",
            name: sub.name || sub.activity || "",
            description: sub.description,
            quantity: sub.quantity === "" ? 1 : Math.max(1, parseFloat(String(sub.quantity)) || 1),
            unit_price: sub.unit_price === "" ? 0 : (parseFloat(String(sub.unit_price)) || 0),
            unit_discount: sub.unit_discount === "" ? 0 : (parseFloat(String(sub.unit_discount)) || 0),
            discount_type: sub.discount_type || "%",
            billing_frequency: sub.billing_frequency || "",
            term: sub.term === "" ? 1 : Math.max(1, parseFloat(String(sub.term)) || 1),
            billing_start_date: sub.billing_start_date || "",
            service_period: sub.service_period || "",
            service_period_start: sub.service_period_start || "",
            service_period_end: sub.service_period_end || "",
            next_billing_date: sub.next_billing_date || "",
            end_date: sub.end_date || "",
            tax_rate: sub.tax_rate === "" ? 0 : (parseFloat(String(sub.tax_rate)) || 0),
            total: (sub.is_manual_total && sub.total !== undefined && sub.total !== "") ? (Number(sub.total) || 0) : subPricing.amount,
            calculation: (sub.is_manual_total && sub.calculation) ? sub.calculation : subPricing.formulaString,
            badge: sub.badge || subPricing.badge,
            is_prorated: !!sub.is_prorated || subPricing.isProrated,
            is_manual_total: !!sub.is_manual_total,
            status: sub.status || (sub.is_prorated ? "Unpaid" : "Paid"),
            service_status: sub.service_status || sub.status || (sub.is_prorated ? "Unpaid" : "Paid"),
            is_reference_only: !!sub.is_reference_only,
            reference_amount: sub.reference_amount,
            date_range: sub.date_range,
            full_recurring_label: sub.full_recurring_label,
          };
        }) : [],
      };
    }),
  };

  // Preview & Scroll Action
  const handlePreviewAndScroll = () => {
    setLastPreviewedAt(new Date());
    setTimeout(() => {
      pdfPreviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const handleScrollToForm = () => {
    formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Open dialog for choosing whether to update existing template or create a new preset
  const handleOpenApplyTemplateDialog = () => {
    if (!layoutStyle) {
      alert("Please select an Invoice Template (Pace+ or interlinkONE) before saving.");
      return;
    }
    if (sortedCustomerTemplates.length > 0) {
      setApplyTemplateMode("existing");
      const currentOrFirst = selectedTemplateId || sortedCustomerTemplates[0]?.id || "";
      setTargetTemplateIdToOverwrite(currentOrFirst);
      const currTmpl = sortedCustomerTemplates.find((t) => t.id === currentOrFirst);
      setApplySetAsDefault(currTmpl ? !!currTmpl.is_default : false);
    } else {
      setApplyTemplateMode("new");
      setTargetTemplateIdToOverwrite("");
      setApplySetAsDefault(true);
    }
    setApplyNewPresetName("");
    setIsApplyTemplateModalOpen(true);
  };

  // Apply to Customer Template Mutation (Supports updating existing preset or creating new preset, plus updating invoice snapshot)
  const saveTemplateMutation = useMutation({
    mutationFn: async ({
      mode,
      templateId,
      newPresetName: customPresetName,
      isDefault,
    }: {
      mode: "existing" | "new";
      templateId?: string;
      newPresetName?: string;
      isDefault: boolean;
    }) => {
      const custId = selectedCustomer?.id || "CUST-CUSTOM";
      let targetPayload: CustomerInvoiceTemplate;

      if (mode === "existing") {
        const targetTmpl = sortedCustomerTemplates.find((t) => t.id === templateId);
        targetPayload = {
          ...currentPayload,
          template_id: templateId || selectedTemplateId || undefined,
          template_name: targetTmpl?.template_name || templateName || "Standard Template",
          is_default: isDefault,
          is_new_preset: false,
          layout_style: layoutStyle,
        };
      } else {
        targetPayload = {
          ...currentPayload,
          template_name: customPresetName?.trim() || "Custom Preset",
          is_default: isDefault,
          is_new_preset: true,
          layout_style: layoutStyle,
        };
      }

      const tmplRes = await arInvoiceService.saveCustomerTemplate(custId, targetPayload);
      let invRes: any = null;
      if (currentInvoiceId) {
        invRes = await arInvoiceService.generateInvoice({
          ...currentPayload,
          template_id: tmplRes.template_id || templateId || selectedTemplateId || undefined,
        });
      }
      return {
        tmpl: tmplRes,
        inv: invRes,
        mode,
        name: targetPayload.template_name,
        id: tmplRes.template_id || templateId || selectedTemplateId,
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ar-customers"] });
      if (currentInvoiceId) {
        queryClient.invalidateQueries({ queryKey: ["ar-invoices"] });
      }
      refetchCustomerTemplates();
      if (data.id) {
        setSelectedTemplateId(data.id);
      }
      if (data.name) {
        setTemplateName(data.name);
      }
      setIsApplyTemplateModalOpen(false);
      setApplyNewPresetName("");

      if (currentInvoiceId && data.inv) {
        setSaveSuccessMsg(
          data.mode === "new"
            ? `Created new preset "${data.name}" and updated invoice ${data.inv.invoice_number}!`
            : `Updated template preset "${data.name}" and updated invoice ${data.inv.invoice_number}!`
        );
      } else {
        setSaveSuccessMsg(
          data.mode === "new"
            ? `Created new preset "${data.name}" successfully!`
            : `Saved changes to template preset "${data.name}" successfully!`
        );
      }
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    },
    onError: (err: any) => {
      console.error("Failed to apply template changes:", err);
      alert(err?.response?.data?.detail || err?.message || "Failed to save template preset.");
    },
  });

  // Save as New Preset Mutation
  const saveNewPresetMutation = useMutation({
    mutationFn: async () => {
      const custId = selectedCustomer?.id || "CUST-CUSTOM";
      const payload: CustomerInvoiceTemplate = {
        ...currentPayload,
        template_name: newPresetName.trim() || "Custom Preset",
        is_default: newPresetIsDefault,
        is_new_preset: true,
        layout_style: layoutStyle,
      };
      return arInvoiceService.saveCustomerTemplate(custId, payload);
    },
    onSuccess: (data) => {
      refetchCustomerTemplates();
      queryClient.invalidateQueries({ queryKey: ["ar-customers"] });
      if (data.template_id) {
        setSelectedTemplateId(data.template_id);
      }
      setTemplateName(newPresetName.trim() || "Custom Preset");
      setIsSavePresetDialogOpen(false);
      setNewPresetName("");
      setSaveSuccessMsg(`Saved new preset "${data.template_name || newPresetName}" successfully!`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    },
  });

  // Delete Template Preset Mutation
  const deletePresetMutation = useMutation({
    mutationFn: async (tmplId: string) => {
      return arInvoiceService.deleteTemplate(tmplId);
    },
    onSuccess: () => {
      refetchCustomerTemplates();
      queryClient.invalidateQueries({ queryKey: ["ar-customers"] });
      setSelectedTemplateId(null);
      setTemplateName("Standard Template");
      if (selectedCustomer) {
        handleSelectCustomerOption({
          id: selectedCustomer.id,
          display_name: selectedCustomer.display_name || selectedCustomer.name,
          full_name: selectedCustomer.contact_person,
          email: selectedCustomer.email,
          phone: selectedCustomer.phone,
          bill_address: selectedCustomer.billing_address,
        });
      }
      setSaveSuccessMsg("Preset deleted successfully.");
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    },
  });

  // Rename Template Preset Mutation
  const renamePresetMutation = useMutation({
    mutationFn: async ({ templateId, newName }: { templateId: string; newName: string }) => {
      return arInvoiceService.renameTemplate(templateId, newName);
    },
    onSuccess: (data) => {
      refetchCustomerTemplates();
      queryClient.invalidateQueries({ queryKey: ["ar-customers"] });
      setTemplateName(data.template_name);
      setIsRenamePresetDialogOpen(false);
      setSaveSuccessMsg(`Preset renamed to "${data.template_name}" successfully!`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    },
  });

  // Generate & Save (or Update) Invoice Snapshot Mutation (Does NOT touch customer template)
  const generateInvoiceMutation = useMutation({
    mutationFn: () => arInvoiceService.generateInvoice(currentPayload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ar-invoices"] });
      if (data.invoice_id) {
        queryClient.invalidateQueries({ queryKey: ["next-invoice-eligibility", data.invoice_id] });
        setCurrentInvoiceId(data.invoice_id);
        navigate(`/account-receivable/generate?invoiceId=${encodeURIComponent(data.invoice_id)}`, { replace: true });
      }
      setSaveSuccessMsg(`Invoice ${data.invoice_number} saved successfully!`);
      setTimeout(() => {
        setSaveSuccessMsg(null);
      }, 4000);
    },
  });

  // Delete Invoice Mutation
  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invId: string) => {
      return arInvoiceService.deleteInvoice(invId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ar-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["ar-quote-summary"] });
      navigate("/account-receivable?tab=invoices");
    },
    onError: (err: any) => {
      alert("Failed to delete invoice: " + (err?.response?.data?.detail || err.message));
    },
  });

  const handleDeleteInvoice = () => {
    if (!currentInvoiceId) return;
    if (window.confirm(`Are you sure you want to delete invoice ${invoiceNumber}? This action cannot be undone.`)) {
      deleteInvoiceMutation.mutate(currentInvoiceId);
    }
  };

  // Generate & Save Invoice Handler with Validation
  const handleGenerateInvoice = () => {
    if (!layoutStyle) {
      alert("Please select an Invoice Template (Pace+ or interlinkONE) before generating the invoice.");
      return;
    }
    if (!selectedCustomer && !billToName.trim()) {
      alert("Please select an A/R Customer or provide a Bill-To Name before generating the invoice.");
      return;
    }
    generateInvoiceMutation.mutate();
  };

  // Send Email Modal Trigger
  const handleOpenSendEmail = () => {
    setEmailRecipient(billToEmail || selectedCustomer?.email || "");
    setEmailSubject(`Invoice ${invoiceNumber} from ${fromCompany || "ZenaTech Inc."}`);
    setEmailCustomMessage("");
    setIsSendEmailDialogOpen(true);
  };

  // Send Invoice Statement via SendGrid Mutation
  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      if (currentInvoiceId) {
        return arInvoiceService.sendInvoiceEmail(currentInvoiceId, {
          from_email: emailSender.trim() || "test-invoices@zenatech.com",
          to_email: emailRecipient.trim(),
          subject: emailSubject.trim() || undefined,
          custom_message: emailCustomMessage.trim() || undefined,
        });
      } else {
        return arInvoiceService.sendCustomInvoiceEmail({
          invoice_data: currentPayload,
          from_email: emailSender.trim() || "test-invoices@zenatech.com",
          to_email: emailRecipient.trim(),
          subject: emailSubject.trim() || undefined,
          custom_message: emailCustomMessage.trim() || undefined,
        });
      }
    },
    onSuccess: (data) => {
      setIsSendEmailDialogOpen(false);
      setSaveSuccessMsg(
        data.simulated
          ? `[SIMULATED] Email logged to console for ${data.to_email} from sender ${data.from_email}.`
          : `Email sent successfully to ${data.to_email}!`
      );
      setTimeout(() => setSaveSuccessMsg(null), 6000);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.detail || "Failed to send email. Please check your SendGrid configuration.");
    },
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full space-y-6 print:min-h-0 print:p-0 print:m-0 print:max-w-none print:space-y-0 print:bg-white print:w-full">
      {/* ── Top Header Actions (Clean Single-Line Toolbar) ── */}
      <div
        ref={formTopRef}
        className="bg-card border border-border/80 px-4 py-3 rounded-2xl shadow-xs flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 print:hidden w-full"
      >
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/account-receivable")}
            className="text-xs gap-1.5 h-8 px-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </Button>

          <div className="h-4 w-px bg-border shrink-0" />

          {currentInvoiceId ? (
            <Badge
              variant="outline"
              className="text-xs px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 gap-1.5 font-medium"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Editing {invoiceNumber} {invoiceStatus ? `(${invoiceStatus})` : ""}</span>
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-xs px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 gap-1.5 font-medium"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Invoice Generator</span>
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Quick Template Switcher in Header */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-muted/60 border border-border/80">
            <Palette className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-[11px] font-medium text-muted-foreground shrink-0 hidden sm:inline">Template:</span>
            <Select
              value={layoutStyle === "modern" ? "pace_plus" : layoutStyle === "classic" ? "interlinkone" : layoutStyle}
              onValueChange={(val) => {
                handleSelectInvoiceTemplate(val as InvoiceLayoutStyle);
              }}
            >
              <SelectTrigger className="h-6 text-xs min-w-[125px] border-0 bg-transparent focus:ring-0 shadow-none px-1 font-semibold cursor-pointer text-foreground">
                <SelectValue placeholder="Select Template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pace_plus" className="text-xs font-medium cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#1B365D] inline-block" />
                    <span>Pace+</span>
                  </div>
                </SelectItem>
                <SelectItem value="interlinkone" className="text-xs font-medium cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#008080] inline-block" />
                    <span>interlinkONE</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preview PDF */}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviewAndScroll}
            className="text-xs gap-1.5 h-8 px-3 bg-card hover:bg-muted text-foreground cursor-pointer shadow-2xs"
            title="Preview PDF layout"
          >
            <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Preview PDF</span>
          </Button>

          {/* More Actions Dropdown (Print, Apply to Template, Delete) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1 h-8 px-2.5 bg-card hover:bg-muted text-foreground cursor-pointer shadow-2xs"
                title="More actions & options"
              >
                <MoreHorizontal className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                <span className="hidden sm:inline">More</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={handlePrint}
                className="text-xs gap-2 py-2 cursor-pointer font-medium"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                <span>Print / Save as PDF</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleOpenApplyTemplateDialog}
                disabled={saveTemplateMutation.isPending || (!selectedCustomer && !billToName)}
                className="text-xs gap-2 py-2 cursor-pointer font-medium text-blue-700 dark:text-blue-400"
              >
                {saveTemplateMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-blue-600" />
                )}
                <span>{currentInvoiceId ? "Apply Changes to Template" : "Save Changes as Template"}</span>
              </DropdownMenuItem>

              {currentInvoiceId && calculatedTotals.effectiveBalanceDue > 0 && (
                <DropdownMenuItem
                  onClick={handleOpenRecordPayment}
                  className="text-xs gap-2 py-2 cursor-pointer font-medium text-emerald-700 dark:text-emerald-400"
                >
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Record Payment</span>
                </DropdownMenuItem>
              )}

              {currentInvoiceId && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDeleteInvoice}
                    disabled={deleteInvoiceMutation.isPending}
                    className="text-xs gap-2 py-2 cursor-pointer font-medium text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40"
                  >
                    {deleteInvoiceMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    )}
                    <span>Delete Invoice</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Primary Action: Save / Generate Invoice */}
          <Button
            size="sm"
            onClick={handleGenerateInvoice}
            disabled={generateInvoiceMutation.isPending}
            className="text-xs gap-1.5 h-8 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs cursor-pointer"
          >
            {generateInvoiceMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            <span>{currentInvoiceId ? "Save Invoice Changes" : "Generate Invoice"}</span>
          </Button>

          {/* Contextual Action: Generate Next Quotes (Renewal Quote) - only shown when invoice is settled/paid */}
          {currentInvoiceId && calculatedTotals.effectiveBalanceDue === 0 && Number(invoiceAmountPaid) > 0 && (
            <Button
              size="sm"
              onClick={() => generateRenewalQuoteMutation.mutate()}
              disabled={generateRenewalQuoteMutation.isPending}
              className="text-xs gap-1.5 h-8 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs cursor-pointer"
              title="Generate full-term renewal quote combining base products and accepted add-ons"
            >
              {generateRenewalQuoteMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>Generate Next Quotes</span>
            </Button>
          )}

          {/* Send Email */}
          {currentInvoiceId && (
            <Button
              size="sm"
              onClick={handleOpenSendEmail}
              className="text-xs gap-1.5 h-8 px-3.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold shadow-xs cursor-pointer"
              title="Send invoice statement to client via SendGrid"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Send Email</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── Prominent Invoice Workflow & Stepper Card (Matching Quote Detail Layout) ── */}
      {currentInvoiceId && (
        <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 print:hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground font-mono">
                  {invoiceNumber || "Invoice"}
                </h1>
                <Badge
                  className={
                    (invoiceStatus || "").toUpperCase().startsWith("PAID") || (invoiceStatus || "").toUpperCase().includes("COMPLETED") || calculatedTotals.effectiveBalanceDue === 0
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700 text-xs font-semibold gap-1"
                      : (invoiceStatus || "").toUpperCase() === "OVERDUE"
                      ? "bg-rose-50 text-rose-700 border-rose-300 text-xs font-semibold gap-1"
                      : "bg-blue-50 text-blue-700 border-blue-300 text-xs font-semibold gap-1"
                  }
                >
                  {(invoiceStatus || "").toUpperCase().startsWith("PAID") || (invoiceStatus || "").toUpperCase().includes("COMPLETED") || calculatedTotals.effectiveBalanceDue === 0 ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{invoiceStatus || "Completed & Paid"}</span>
                    </>
                  ) : (
                    <span>{invoiceStatus || "Open / Unpaid"}</span>
                  )}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap pt-0.5">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <strong>{selectedCustomer?.name || billToName || "Direct Client"}</strong>
                </span>
                {invoiceDate && (
                  <span className="flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>Issued: {invoiceDate}</span>
                  </span>
                )}
                {dueDate && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Due: {dueDate}</span>
                  </span>
                )}
                {dueDateInfo && (
                  <Badge variant="outline" className={`text-xs px-2.5 py-0.5 gap-1.5 font-semibold ${dueDateInfo.badgeClass}`}>
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>{dueDateInfo.label}</span>
                  </Badge>
                )}
              </div>
            </div>

            {/* Quick Balance & Paid Snapshot with Add-on Adjustment Breakdown */}
            <div className="flex items-center gap-4 bg-muted/40 p-3 rounded-xl border border-border/60 flex-wrap sm:flex-nowrap">
              <div>
                <div className="text-[11px] text-muted-foreground">Total Invoiced</div>
                <div className="font-mono font-bold text-sm text-foreground">
                  ${(Number(subTotal) || 0).toFixed(2)} {currency}
                </div>
              </div>
              {calculatedTotals.totalPaidAmount > 0 && (
                <>
                  <div className="h-6 w-px bg-border hidden sm:block" />
                  <div>
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>Original Paid Subscription</span>
                    </div>
                    <div className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                      -${calculatedTotals.totalPaidAmount.toFixed(2)} {currency}
                    </div>
                  </div>
                </>
              )}
              <div className="h-6 w-px bg-border" />
              <div>
                <div className="text-[11px] text-muted-foreground font-semibold">
                  {calculatedTotals.totalPaidAmount > 0 ? "New Add-on Balance Due" : "Balance Due"}
                </div>
                <div className={`font-mono font-bold text-sm ${((invoiceStatus || "").toUpperCase().startsWith("PAID") || (invoiceStatus || "").toUpperCase().includes("COMPLETED") || calculatedTotals.effectiveBalanceDue === 0) ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                  ${calculatedTotals.effectiveBalanceDue.toFixed(2)} {currency}
                </div>
              </div>
            </div>
          </div>

          {/* Stepper Pipeline */}
          <div className="pt-3 border-t border-border space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Workflow Status</span>
              </span>
              <span className="text-xs">
                {(invoiceStatus || "").toUpperCase().startsWith("PAID") || (invoiceStatus || "").toUpperCase().includes("COMPLETED") || calculatedTotals.effectiveBalanceDue === 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Invoice Fully Paid &amp; Settled</span>
                  </span>
                ) : calculatedTotals.totalPaidAmount > 0 ? (
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    Partially Paid • ${calculatedTotals.totalPaidAmount.toFixed(2)} recorded • Remaining: ${calculatedTotals.effectiveBalanceDue.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    Invoice Issued • Awaiting Customer Payment Settlement
                  </span>
                )}
              </span>
            </div>

            <div className="py-1">
              <InvoiceStepper
                invoice={{
                  invoice_number: invoiceNumber,
                  status: invoiceStatus,
                  total_amount: Number(subTotal) || 0,
                  amount_paid: calculatedTotals.totalPaidAmount,
                  balance_due: calculatedTotals.effectiveBalanceDue,
                  due_date: dueDate,
                  is_sent: true,
                }}
              />
            </div>
          </div>

          {/* ── Recorded Payments & Settlement Ledger Section ── */}
          {currentInvoiceId && (
            <div className="pt-3.5 border-t border-border space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Payment Records &amp; Settlement Ledger</span>
                  </span>
                  <Badge variant="outline" className="text-[10px] font-semibold bg-muted/50">
                    {invoicePayments.length} {invoicePayments.length === 1 ? "record" : "records"}
                  </Badge>
                </div>

                {calculatedTotals.effectiveBalanceDue > 0 ? (
                  <Button
                    size="sm"
                    onClick={handleOpenRecordPayment}
                    className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-semibold px-2.5 shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Record Payment</span>
                  </Button>
                ) : (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 text-[10px] font-bold gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Settled in Full</span>
                  </Badge>
                )}
              </div>

              {invoicePayments.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-border text-center bg-muted/20">
                  <p className="text-xs text-muted-foreground">
                    No payments have been recorded for this invoice yet.
                  </p>
                  {calculatedTotals.effectiveBalanceDue > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenRecordPayment}
                      className="mt-2.5 text-xs h-7 gap-1.5 border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 font-semibold cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Record Initial Payment</span>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border bg-card">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/50 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Method</th>
                        <th className="py-2 px-3">Reference / Tx ID</th>
                        <th className="py-2 px-3">Category (GL Code)</th>
                        <th className="py-2 px-3">Class</th>
                        <th className="py-2 px-3">Notes</th>
                        <th className="py-2 px-3 text-right">Amount Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {invoicePayments.map((p, idx) => (
                        <tr key={p.id || idx} className="hover:bg-muted/30 transition-colors font-medium">
                          <td className="py-2 px-3 font-mono text-foreground whitespace-nowrap">
                            {p.payment_date || "—"}
                          </td>
                          <td className="py-2 px-3">
                            <Badge variant="outline" className="text-[10px] font-bold bg-indigo-50/60 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800">
                              {p.payment_method || "WIRE"}
                            </Badge>
                          </td>
                          <td className="py-2 px-3 font-mono text-muted-foreground">
                            {p.reference_number || "—"}
                          </td>
                          <td className="py-2 px-3 text-muted-foreground font-mono text-[11px]">
                            {p.gl_code || "—"}
                          </td>
                          <td className="py-2 px-3 text-muted-foreground">
                            {p.class_name || "—"}
                          </td>
                          <td className="py-2 px-3 text-muted-foreground truncate max-w-[200px]" title={p.notes}>
                            {p.notes || "—"}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            +${Number(p.amount).toFixed(2)} {currency}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border bg-muted/40 font-semibold text-xs">
                        <td colSpan={6} className="py-2 px-3 text-right text-muted-foreground">
                          Total Payments Recorded:
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          ${invoicePayments.reduce((s, p) => s + (Number(p.amount) || 0), 0).toFixed(2)} {currency}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Recurring Billing Schedule & Next Invoice Generation Panel (Only for Recurring Invoices) */}
          {currentInvoiceId && isRecurringInvoice && (
            <div className="pt-3.5 border-t border-border space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Recurring Billing Schedule &amp; Next Invoice</span>
                </span>
                {nextInvoiceEligibility?.eligible && (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 text-[10px] font-bold gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Eligible for Next Invoice</span>
                  </Badge>
                )}
                {nextInvoiceEligibility?.already_generated && (
                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950/50 dark:text-indigo-300 text-[10px] font-bold gap-1">
                    <Check className="w-3 h-3 text-indigo-600" />
                    <span>Next Period Invoiced</span>
                  </Badge>
                )}
              </div>

              {isNextInvoiceEligibilityLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Checking recurring billing schedule and payment eligibility...</span>
                </div>
              ) : nextInvoiceEligibility?.already_generated ? (
                <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>Next Invoice Already Generated: Draft #{nextInvoiceEligibility.next_invoice_number}</span>
                    </div>
                    <p className="text-[11px] text-indigo-900/70 dark:text-indigo-300/70">
                      The subsequent billing cycle draft has been prepared and linked. Review and send it via the standard workflow when ready.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/account-receivable/generate?invoiceId=${encodeURIComponent(nextInvoiceEligibility.next_invoice_id!)}`)}
                    className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-1.5 shrink-0 cursor-pointer shadow-xs"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Open Draft #{nextInvoiceEligibility.next_invoice_number}</span>
                  </Button>
                </div>
              ) : (calculatedTotals.effectiveBalanceDue === 0 && Number(invoiceAmountPaid) > 0) ? (
                <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Ready for Renewal: Generate Next Quote</span>
                    </div>
                    <p className="text-[11px] text-emerald-900/70 dark:text-emerald-300/70">
                      This invoice is fully settled. Generates a full-term renewal quote consolidating base subscriptions and active add-ons.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => generateRenewalQuoteMutation.mutate()}
                    disabled={generateRenewalQuoteMutation.isPending}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 shrink-0 cursor-pointer shadow-xs"
                  >
                    {generateRenewalQuoteMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>Generate Next Quotes</span>
                  </Button>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Recurring Service Schedule Active</span>
                    </div>
                    <p className="text-[11px] text-amber-900/70 dark:text-amber-300/70">
                      Next renewal quote will become eligible for generation once all invoice payments are settled in full.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-amber-100/80 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border-amber-300 shrink-0 self-start sm:self-center">
                    Awaiting Payment Settlement
                  </Badge>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Loading Overlay Screen while fetching invoice & customer details ── */}
      {isTemplateLoading && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border shadow-2xl rounded-2xl p-8 max-w-md w-full text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-foreground">
                {currentInvoiceId ? `Loading Invoice ${invoiceNumber || "Details"}` : "Loading Customer & Invoice Data"}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Populating customer profile, line items, and pricing configurations...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Status Notifications ── */}
      {saveSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 print:hidden animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── 1. INVOICE INPUT FORM SECTION (Dedicated Form Fields) ────── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-6 print:hidden">
        {/* Customer Selection Card with Quick Edit */}
        <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span>Select Accounts Receivable (A/R) Customer</span>
                  {selectedCustomer && (
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                      Active
                    </Badge>
                  )}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Select an existing customer to automatically populate their profile, PO#, and default billing information.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Quick Edit Customer Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenQuickEdit}
                disabled={!selectedCustomer && !customerSearch && !billToName}
                className="text-xs gap-1.5 h-8 border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Quick Edit Customer</span>
              </Button>

              {isTemplateLoading ? (
                <Badge
                  variant="outline"
                  className="text-[11px] bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-300 flex items-center gap-1.5"
                >
                  <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                  <span>Loading template...</span>
                </Badge>
              ) : templateLoadedToast ? (
                <Badge
                  variant="outline"
                  className="text-[11px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                  <span>{templateLoadedToast}</span>
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="pt-1">
            <ARCustomerAutocomplete
              customerId={selectedCustomer?.id || ""}
              customerName={selectedCustomer?.name || customerSearch}
              onSelect={handleSelectCustomerOption}
              className="w-full"
            />
          </div>
        </div>

        {/* ── Template Preset Selector & Visual Theme Selector Card (Only shown for New Invoices, Hidden for Generated Invoices) ── */}
        {!currentInvoiceId && (
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3.5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              {/* Left: Template Preset Selection */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Bookmark className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      Template Preset <span className="text-red-500">*</span>
                    </span>
                    <span className="text-[11px] text-muted-foreground">Saved item & layout preset for customer</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Select
                    value={selectedTemplateId || "default"}
                    onValueChange={(val) => {
                      if (val === "__new__") {
                        setIsSavePresetDialogOpen(true);
                      } else if (val === "default") {
                        if (sortedCustomerTemplates.length > 0) {
                          const def = sortedCustomerTemplates.find((t) => t.is_default) || sortedCustomerTemplates[0];
                          if (def && def.id) handleSelectPreset(def.id);
                        }
                      } else {
                        handleSelectPreset(val);
                      }
                    }}
                    disabled={!selectedCustomer}
                  >
                    <SelectTrigger className="h-8 text-xs min-w-[210px] bg-background">
                      <SelectValue placeholder={selectedCustomer ? "Select Template Preset" : "Select customer first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedCustomerTemplates.length === 0 ? (
                        <SelectItem value="default" className="text-xs">
                          Standard Template (Default)
                        </SelectItem>
                      ) : (
                        sortedCustomerTemplates.map((t) => (
                          <SelectItem key={t.id || 'default'} value={t.id || 'default'} className="text-xs">
                            <div className="flex items-center gap-2">
                              <span>{t.template_name || "Standard Template"}</span>
                              {t.is_default && (
                                <Badge variant="secondary" className="text-[9px] px-1 py-0 font-normal">
                                  Default
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                      <SelectItem value="__new__" className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <Plus className="w-3 h-3" />
                          <span>Save As New Preset...</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSavePresetDialogOpen(true)}
                    disabled={!selectedCustomer}
                    className="text-xs gap-1 h-8 px-2.5 bg-background hover:bg-muted text-foreground cursor-pointer"
                    title="Save current layout & items as a new named preset"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span className="hidden sm:inline">New Preset</span>
                  </Button>

                  {selectedTemplateId && (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRenamePresetValue(templateName);
                          setIsRenamePresetDialogOpen(true);
                        }}
                        className="text-xs h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                        title="Rename this template preset"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete the template preset "${templateName}"?`)) {
                            deletePresetMutation.mutate(selectedTemplateId);
                          }
                        }}
                        disabled={deletePresetMutation.isPending}
                        className="text-xs h-8 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        title="Delete this template preset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Right: Invoice Template Options (Pace+ and interlinkONE) - Required Dropdown */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      Invoice Template <span className="text-red-500">*</span>
                    </span>
                    <span className="text-[11px] text-muted-foreground">Select Pace+ or interlinkONE</span>
                  </div>
                </div>

                <Select
                  value={layoutStyle === "modern" ? "pace_plus" : layoutStyle === "classic" ? "interlinkone" : layoutStyle}
                  onValueChange={(val) => {
                    handleSelectInvoiceTemplate(val as InvoiceLayoutStyle);
                  }}
                >
                  <SelectTrigger className="h-8 text-xs min-w-[170px] bg-background">
                    <SelectValue placeholder="Select Invoice Template *" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pace_plus" className="text-xs font-medium">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#1B365D] inline-block shadow-2xs" />
                        <span className="font-semibold text-foreground">Pace+</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="interlinkone" className="text-xs font-medium">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#008b94] inline-block shadow-2xs" />
                        <span className="font-semibold text-foreground">interlinkONE</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Main Form Fields Container */}
        <div className="p-5 sm:p-7 rounded-2xl bg-card border border-border shadow-sm space-y-7">
          {/* Header & Reset Button */}
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Invoice Details & Line Items
              </h2>
              <p className="text-xs text-muted-foreground">
                Enter invoice metadata, billing addresses, due date, terms, and line items. Click &quot;Preview PDF&quot; below to generate and view the populated document.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetForm}
              className="text-xs text-muted-foreground hover:text-foreground gap-1 h-8 px-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Form</span>
            </Button>
          </div>

          {/* 1. General Invoice Metadata with Due Date & Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Invoice Number */}
            <div className="space-y-1.5">
              {renderFieldHeader("Invoice Number", "invoice_number", true)}
              <Input
                id="invoice_number"
                name="invoice_number"
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="e.g. 18067"
                className={`font-mono text-xs ${!isFieldVisible("invoice_number") ? "opacity-60 bg-muted/40" : ""}`}
              />
            </div>

            {/* Invoice Date Calendar Picker */}
            <div className="space-y-1.5">
              {renderFieldHeader("Invoice Date", "invoice_date", true)}
              <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={`w-full h-8 justify-start text-left font-normal text-xs px-2.5 bg-card hover:bg-muted border-input cursor-pointer ${
                      !isFieldVisible("invoice_date") ? "opacity-60 bg-muted/40" : ""
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="font-semibold text-foreground truncate">
                      {invoiceDate || "Select Date"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="start">
                  <div className="space-y-3">
                    <Calendar
                      mode="single"
                      selected={getSelectedCalendarDate()}
                      onSelect={(date) => {
                        if (date) {
                          setInvoiceDate(format(date, "MM/dd/yyyy"));
                          setIsDatePopoverOpen(false);
                        }
                      }}
                    />
                    {/* Quick Preset Buttons */}
                    <div className="flex items-center justify-between border-t border-border pt-2 gap-1 text-[11px]">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setInvoiceDate(format(new Date(), "MM/dd/yyyy"));
                          setIsDatePopoverOpen(false);
                        }}
                        className="h-6 text-[11px] px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                      >
                        Today
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setInvoiceDate(format(addDays(new Date(), 15), "MM/dd/yyyy"));
                          setIsDatePopoverOpen(false);
                        }}
                        className="h-6 text-[11px] px-2 cursor-pointer"
                      >
                        +15 Days
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setInvoiceDate(format(addDays(new Date(), 30), "MM/dd/yyyy"));
                          setIsDatePopoverOpen(false);
                        }}
                        className="h-6 text-[11px] px-2 cursor-pointer"
                      >
                        +30 Days
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Due Date Calendar Picker */}
            <div className="space-y-1.5">
              {renderFieldHeader("Due Date", "due_date", true)}
              <Popover open={isDueDatePopoverOpen} onOpenChange={setIsDueDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={`w-full h-8 justify-start text-left font-normal text-xs px-2.5 bg-card hover:bg-muted border-input cursor-pointer ${
                      !isFieldVisible("due_date") ? "opacity-60 bg-muted/40" : ""
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="font-semibold text-foreground truncate">
                      {dueDate || "Select Due Date"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="start">
                  <div className="space-y-3">
                    <Calendar
                      mode="single"
                      selected={getSelectedDueDate()}
                      onSelect={(date) => {
                        if (date) {
                          setDueDate(format(date, "MM/dd/yyyy"));
                          setIsDueDatePopoverOpen(false);
                        }
                      }}
                    />
                    {/* Quick Presets for Due Date */}
                    <div className="flex items-center justify-between border-t border-border pt-2 gap-1 text-[11px]">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDueDate(invoiceDate || format(new Date(), "MM/dd/yyyy"));
                          setIsDueDatePopoverOpen(false);
                        }}
                        className="h-6 text-[11px] px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 cursor-pointer"
                      >
                        Same Date
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const base = parseFlexibleDate(invoiceDate);
                          setDueDate(format(addDays(base, 15), "MM/dd/yyyy"));
                          setIsDueDatePopoverOpen(false);
                        }}
                        className="h-6 text-[11px] px-2 cursor-pointer"
                      >
                        +15 Days
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const base = parseFlexibleDate(invoiceDate);
                          setDueDate(format(addDays(base, 30), "MM/dd/yyyy"));
                          setIsDueDatePopoverOpen(false);
                        }}
                        className="h-6 text-[11px] px-2 cursor-pointer"
                      >
                        +30 Days
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Terms Field */}
            <div className="space-y-1.5">
              {renderFieldHeader("Terms", "terms")}
              <Select value={terms} onValueChange={handleTermsChange}>
                <SelectTrigger
                  id="terms"
                  className={`h-9 text-xs border-slate-200 dark:border-slate-800 ${
                    !isFieldVisible("terms") ? "opacity-60 bg-muted/40" : ""
                  }`}
                >
                  <SelectValue placeholder="Select terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15 days">15 days</SelectItem>
                  <SelectItem value="30 days">30 days</SelectItem>
                  {terms && !["15 days", "30 days"].includes(terms) && (
                    <SelectItem value={terms}>{terms}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* P/O Number */}
            <div className="space-y-1.5">
              {renderFieldHeader("P/O Number", "po_number")}
              <Input
                id="po_number"
                name="po_number"
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="e.g. PO-89214"
                className={`font-mono text-xs ${!isFieldVisible("po_number") ? "opacity-60 bg-muted/40" : ""}`}
              />
            </div>
          </div>

          {/* 2. Bill To & From Fields (2 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Left: Bill To (Customer Details) */}
            <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-border/80 space-y-3.5">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <Receipt className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Bill To (Customer Information)
                </h4>
              </div>

              <div className="space-y-1.5">
                {renderFieldHeader("Customer / Recipient Name", "bill_to_name")}
                <Input
                  id="bill_to_name"
                  name="bill_to_name"
                  type="text"
                  value={billToName}
                  onChange={(e) => setBillToName(e.target.value)}
                  placeholder="e.g. 4 Directions / ST Jay Associates, Inc."
                  className={`text-xs bg-card ${!isFieldVisible("bill_to_name") ? "opacity-60 bg-muted/40" : ""}`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  {renderFieldHeader("Phone Number", "bill_to_phone")}
                  <Input
                    id="bill_to_phone"
                    name="bill_to_phone"
                    type="text"
                    value={billToPhone}
                    onChange={(e) => setBillToPhone(e.target.value)}
                    placeholder="e.g. +1 (555) 019-2834"
                    className={`text-xs bg-card ${!isFieldVisible("bill_to_phone") ? "opacity-60 bg-muted/40" : ""}`}
                  />
                </div>
                <div className="space-y-1.5">
                  {renderFieldHeader("Email Address", "bill_to_email")}
                  <Input
                    id="bill_to_email"
                    name="bill_to_email"
                    type="email"
                    value={billToEmail}
                    onChange={(e) => setBillToEmail(e.target.value)}
                    placeholder="e.g. billing@client.com"
                    className={`text-xs bg-card ${!isFieldVisible("bill_to_email") ? "opacity-60 bg-muted/40" : ""}`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                {renderFieldHeader("Billing Address", "bill_to_address")}
                <Textarea
                  id="bill_to_address"
                  name="bill_to_address"
                  rows={2}
                  value={billToAddress}
                  onChange={(e) => setBillToAddress(e.target.value)}
                  placeholder="e.g. Four Directions&#10;PO Box 10908&#10;Scottsdale, AZ 85271"
                  className={`text-xs bg-card resize-none ${!isFieldVisible("bill_to_address") ? "opacity-60 bg-muted/40" : ""}`}
                />
              </div>
            </div>

            {/* Right: From (Issuer Details) */}
            <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-border/80 space-y-3.5">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <Building2 className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  From (Issuer Information)
                </h4>
              </div>

              <div className="space-y-1.5">
                {renderFieldHeader("Company Name", "from_company")}
                <Input
                  id="from_company"
                  name="from_company"
                  type="text"
                  value={fromCompany}
                  onChange={(e) => setFromCompany(e.target.value)}
                  placeholder="e.g. Pace Plus Inc. / interlinkONE"
                  className={`text-xs bg-card font-semibold ${!isFieldVisible("from_company") ? "opacity-60 bg-muted/40" : ""}`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  {renderFieldHeader("Company Phone", "from_phone")}
                  <Input
                    id="from_phone"
                    name="from_phone"
                    type="text"
                    value={fromPhone}
                    onChange={(e) => setFromPhone(e.target.value)}
                    placeholder="e.g. (312) 614-1288 | ext 1098"
                    className={`text-xs bg-card ${!isFieldVisible("from_phone") ? "opacity-60 bg-muted/40" : ""}`}
                  />
                </div>
                <div className="space-y-1.5">
                  {renderFieldHeader("Company Email", "from_email")}
                  <Input
                    id="from_email"
                    name="from_email"
                    type="email"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    placeholder="e.g. Accounting@paceplus.com"
                    className={`text-xs bg-card ${!isFieldVisible("from_email") ? "opacity-60 bg-muted/40" : ""}`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                {renderFieldHeader("Company Address", "from_address")}
                <Input
                  id="from_address"
                  name="from_address"
                  type="text"
                  value={fromAddress}
                  onChange={(e) => setFromAddress(e.target.value)}
                  placeholder="e.g. 602B W 5th Ave, Naperville, IL 60563 USA"
                  className={`text-xs bg-card ${!isFieldVisible("from_address") ? "opacity-60 bg-muted/40" : ""}`}
                />
              </div>
            </div>
          </div>

          {/* 3. Line Items Editor with Activity & Description */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Invoice Line Items</span>
                </h4>
                <p className="text-xs text-muted-foreground">
                  Specify activity items and attach add-on services directly under each item as sub-items.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground font-semibold">Currency:</span>
                  <div className="w-44">
                    <CurrencyAutocomplete
                      value={currency}
                      onChange={(newCurr) => setCurrency(newCurr || "USD")}
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddLine}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 border-blue-200 dark:border-blue-900/50 flex items-center gap-1.5 cursor-pointer font-semibold shadow-2xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Line Item
                </Button>
              </div>
            </div>

            {/* Line Items Table with Quotes Columns & Indented Sub-items */}
            <div className="overflow-x-auto border border-border rounded-xl shadow-2xs bg-card">
              <table className="w-full text-xs text-left border-collapse min-w-[1100px]">
                <thead>
                  <tr className="bg-muted/80 text-muted-foreground font-bold uppercase tracking-wider text-[11px] border-b border-border">
                    <th className="py-2.5 px-2.5 w-[130px] min-w-[130px] text-left">Start Date</th>
                    <th className="py-2.5 px-3 min-w-[320px] text-left">Activity / Item &amp; Description</th>
                    <th className="py-2.5 px-2 w-[95px] min-w-[95px] text-left">Unit price</th>
                    <th className="py-2.5 px-2 w-[110px] min-w-[110px] text-left">Currency</th>
                    <th className="py-2.5 px-2 w-[75px] min-w-[75px] text-left">Quantity</th>
                    <th className="py-2.5 px-2 w-[110px] min-w-[110px] text-left">Unit discount</th>
                    <th className="py-2.5 px-2 w-[130px] min-w-[130px] text-left">Billing frequency</th>
                    <th className="py-2.5 px-2 w-[95px] min-w-[95px] text-left">Chargeable months</th>
                    <th className="py-2.5 px-2 w-[145px] min-w-[145px] text-left">Service start date</th>
                    <th className="py-2.5 px-2 w-[80px] min-w-[80px] text-left">Tax rate</th>
                    <th className="py-2.5 px-3 w-[100px] min-w-[100px] text-right">Net price</th>
                    <th className="py-2.5 px-2 w-[70px] min-w-[70px] text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-[12px]">
                  {lineItems.map((item, idx) => {
                    const isItemPaid = (item.status === "Paid" || item.service_status === "Paid") && item.status !== "Unpaid" && item.service_status !== "Unpaid";
                    const parentProration = computeItemProration(
                      item.quantity,
                      item.unit_price,
                      item.unit_discount,
                      item.discount_type,
                      item.billing_frequency,
                      item.billing_start_date,
                      item.tax_rate,
                      item.term,
                      isItemPaid
                    );

                    return (
                      <Fragment key={item.id || idx}>
                        {/* Parent Line Item Row */}
                        <tr className="hover:bg-muted/30 transition-colors group">
                          {/* Date Picker */}
                          <td className="py-2 px-2.5 align-top">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="w-full h-7 justify-start text-left font-normal text-xs px-2 bg-card hover:bg-muted border-input cursor-pointer"
                                >
                                  <CalendarIcon className="mr-1 h-3 w-3 text-muted-foreground shrink-0" />
                                  <span className="truncate font-medium text-foreground">
                                    {item.date || "Select"}
                                  </span>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-3" align="start">
                                <div className="space-y-2">
                                  <Calendar
                                    mode="single"
                                    selected={item.date ? parseFlexibleDate(item.date) : undefined}
                                    onSelect={(date) => {
                                      handleUpdateLine(
                                        idx,
                                        "date",
                                        date ? format(date, "MM/dd/yyyy") : ""
                                      );
                                    }}
                                  />
                                  <div className="flex items-center justify-between border-t border-border pt-2 gap-1 text-[11px]">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleUpdateLine(
                                          idx,
                                          "date",
                                          format(new Date(), "MM/dd/yyyy")
                                        )
                                      }
                                      className="h-6 text-[11px] px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                                    >
                                      Today
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleUpdateLine(idx, "date", "")}
                                      className="h-6 text-[11px] px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                                    >
                                      Clear Date
                                    </Button>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </td>

                          {/* Activity Name & Description */}
                          <td className="py-2 px-3 space-y-1 align-top">
                            <div className="flex items-center gap-1.5">
                              <Input
                                type="text"
                                value={item.activity || item.name || ""}
                                onChange={(e) => {
                                  handleUpdateLine(idx, "activity", e.target.value);
                                  handleUpdateLine(idx, "name", e.target.value);
                                }}
                                placeholder="Activity / Item name..."
                                className="text-xs h-7 font-medium flex-1"
                              />
                              {isItemPaid ? (
                                <Badge className="text-[9.5px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700 font-bold shrink-0">
                                  Paid
                                </Badge>
                              ) : (
                                <Badge className="text-[9.5px] px-1.5 py-0.5 bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-700 font-bold shrink-0">
                                  Unpaid
                                </Badge>
                              )}
                              {item.billing_frequency && item.billing_frequency !== "One-Time" && item.billing_frequency !== "none" ? (
                                parentProration.isProrated ? (
                                  <Badge className="text-[9px] px-1.5 py-0 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 shrink-0">
                                    Prorated
                                  </Badge>
                                ) : (
                                  <Badge className="text-[9px] px-1.5 py-0 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 shrink-0">
                                    Recurring
                                  </Badge>
                                )
                              ) : (
                                <Badge className="text-[9px] px-1.5 py-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 shrink-0">
                                  One-Time
                                </Badge>
                              )}
                            </div>
                            <textarea
                              value={item.description}
                              onChange={(e) =>
                                handleUpdateLine(idx, "description", e.target.value)
                              }
                              placeholder="Description..."
                              rows={1}
                              className="w-full text-[11px] text-muted-foreground border border-input rounded-md bg-transparent px-2 py-1 resize-y min-h-[28px] focus:outline-none focus:border-blue-500 leading-relaxed"
                            />
                            {parentProration.isProrated && parentProration.proratedNote && (
                              <div className="text-[10.5px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded font-medium inline-flex items-center gap-1 mt-0.5">
                                <span>ℹ️ {parentProration.proratedNote}</span>
                              </div>
                            )}
                            {item.service_period && (
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium pt-0.5 leading-snug">
                                <span className="inline-flex items-center gap-1 shrink-0">
                                  <CalendarIcon className="w-3 h-3 shrink-0" />
                                  <span>Service Period: {item.service_period}</span>
                                </span>
                                {item.next_billing_date && (
                                  <span className="text-muted-foreground whitespace-nowrap">• Next Billing Date: {item.next_billing_date}</span>
                                )}
                              </div>
                            )}
                            {parentProration.isProrated && parentProration.formulaString && (
                              <div className="text-[11px] text-blue-600 dark:text-blue-400 italic font-mono mt-0.5 tracking-tight break-words">
                                Formula: {parentProration.formulaString}
                              </div>
                            )}
                          </td>

                          {/* Unit Price */}
                          <td className="py-2 px-2 align-top">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unit_price ?? ""}
                              onChange={(e) => handleUpdateLine(idx, "unit_price", e.target.value)}
                              placeholder="0.00"
                              className="text-xs h-7 font-mono text-left px-2"
                            />
                          </td>

                          {/* Currency */}
                          <td className="py-2 px-2 align-top">
                            <CurrencyAutocomplete
                              value={item.currency || currency || "USD"}
                              onChange={(val) => handleUpdateLine(idx, "currency", val)}
                              className="h-7 text-xs px-2"
                            />
                          </td>

                          {/* Quantity */}
                          <td className="py-2 px-2 align-top">
                            <Input
                              type="number"
                              step="1"
                              min="1"
                              value={item.quantity ?? ""}
                              onChange={(e) => handleUpdateLine(idx, "quantity", e.target.value)}
                              placeholder="1"
                              className="text-xs h-7 font-mono text-left px-2"
                            />
                          </td>

                          {/* Unit Discount */}
                          <td className="py-2 px-2 align-top">
                            <div className="flex items-center rounded-md border border-input bg-card focus-within:border-blue-500 overflow-hidden h-7">
                              <select
                                value={item.discount_type || "%"}
                                onChange={(e) => handleUpdateLine(idx, "discount_type", e.target.value as "%" | "$")}
                                className="h-full bg-muted/60 text-[11px] text-foreground px-1 border-r border-border focus:outline-none cursor-pointer"
                              >
                                <option value="%">%</option>
                                <option value="$">$</option>
                              </select>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.unit_discount ?? ""}
                                onChange={(e) => handleUpdateLine(idx, "unit_discount", e.target.value)}
                                placeholder="0"
                                className="w-full h-full text-xs text-left px-1.5 bg-transparent focus:outline-none font-mono"
                              />
                            </div>
                          </td>

                          {/* Billing Frequency */}
                          <td className="py-2 px-2 align-top">
                            <Select
                              value={normalizeBillingFrequencyForSelect(item.billing_frequency || item.billing_type)}
                              onValueChange={(val) => handleUpdateLine(idx, "billing_frequency", val === "none" ? "" : val)}
                            >
                              <SelectTrigger className="h-7 text-xs border-input bg-card px-2">
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent className="bg-popover border-border z-50">
                                <SelectItem value="none">Select...</SelectItem>
                                <SelectItem value="One-Time">One-Time</SelectItem>
                                <SelectItem value="Monthly">Monthly</SelectItem>
                                <SelectItem value="Annually">Annually</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>

                          {/* Term */}
                          <td className="py-2 px-2 align-top">
                            <Input
                              type="number"
                              step="1"
                              min="1"
                              value={item.term ?? ""}
                              onChange={(e) => handleUpdateLine(idx, "term", e.target.value)}
                              placeholder="1"
                              className="h-7 text-xs text-left font-normal border-input bg-card px-2"
                            />
                          </td>

                          {/* Billing Start Date */}
                          <td className="py-2 px-2 align-top">
                            <BillingStartDatePicker
                              value={item.billing_start_date || ""}
                              onChange={(val) => handleUpdateLine(idx, "billing_start_date", val)}
                              size="xs"
                            />
                          </td>

                          {/* Tax Rate */}
                          <td className="py-2 px-2 align-top">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.tax_rate ?? ""}
                              onChange={(e) => handleUpdateLine(idx, "tax_rate", e.target.value)}
                              placeholder="0%"
                              className="h-7 text-xs text-left font-mono border-input bg-card px-2"
                            />
                          </td>

                          {/* Net Price / Amount */}
                          <td className="py-2 px-2 align-top">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.total !== undefined && item.total !== "" ? item.total : parentProration.amount}
                              onChange={(e) => handleUpdateLine(idx, "total", e.target.value)}
                              placeholder="0.00"
                              className="h-7 text-xs text-right font-mono font-bold border-input bg-card px-2"
                            />
                          </td>

                          {/* Actions: Add Sub-item & Delete */}
                          <td className="py-2 px-2 text-center align-top pt-1.5">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleAddSubItem(idx)}
                                className="h-7 w-7 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg cursor-pointer"
                                title="Add prorated charge or sub-service under this item"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveLine(idx)}
                                disabled={lineItems.length <= 1}
                                className="h-7 w-7 text-muted-foreground hover:text-red-600 disabled:opacity-30 cursor-pointer"
                                title="Delete line item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>

                        {/* Indented Sub-items / Prorated Charges under this parent activity */}
                        {item.sub_items && item.sub_items.map((sub, sIdx) => {
                          const isSubPaid = (sub.status === "Paid" || sub.service_status === "Paid") && sub.status !== "Unpaid" && sub.service_status !== "Unpaid";
                          const subProration = computeItemProration(
                            sub.quantity,
                            sub.unit_price,
                            sub.unit_discount,
                            sub.discount_type,
                            sub.billing_frequency,
                            sub.billing_start_date,
                            sub.tax_rate,
                            sub.term,
                            isSubPaid
                          );
                          const activeFormula = subProration.formulaString || sub.calculation;

                          return (
                            <tr key={sub.id || sIdx} className="bg-blue-50/20 dark:bg-blue-950/10 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors border-l-2 border-l-blue-500">
                              {/* Sub-item Date Picker */}
                              <td className="py-1.5 px-2.5 align-top">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className="w-full h-6 justify-start text-left font-normal text-[11px] px-1.5 bg-card hover:bg-muted border-input cursor-pointer"
                                    >
                                      <CalendarIcon className="mr-1 h-3 w-3 text-muted-foreground shrink-0" />
                                      <span className="truncate font-medium text-foreground">
                                        {sub.date || "Select"}
                                      </span>
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-3" align="start">
                                    <div className="space-y-2">
                                      <Calendar
                                        mode="single"
                                        selected={sub.date ? parseFlexibleDate(sub.date) : undefined}
                                        onSelect={(date) => {
                                          handleUpdateSubItem(
                                            idx,
                                            sIdx,
                                            "date",
                                            date ? format(date, "MM/dd/yyyy") : ""
                                          );
                                        }}
                                      />
                                      <div className="flex items-center justify-between border-t border-border pt-2 gap-1 text-[11px]">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            handleUpdateSubItem(
                                              idx,
                                              sIdx,
                                              "date",
                                              format(new Date(), "MM/dd/yyyy")
                                            )
                                          }
                                          className="h-6 text-[11px] px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                                        >
                                          Today
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleUpdateSubItem(idx, sIdx, "date", "")}
                                          className="h-6 text-[11px] px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                                        >
                                          Clear Date
                                        </Button>
                                      </div>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </td>

                              {/* Sub-item Activity Name & Description with Tree Indicator */}
                              <td className="py-1.5 px-3 align-top space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-blue-500 font-mono text-xs leading-none shrink-0">└──</span>
                                  <Input
                                    type="text"
                                    value={sub.activity || sub.name || ""}
                                    onChange={(e) => {
                                      handleUpdateSubItem(idx, sIdx, "activity", e.target.value);
                                      handleUpdateSubItem(idx, sIdx, "name", e.target.value);
                                    }}
                                    placeholder="Prorated charge / sub-item name..."
                                    className="text-xs h-6 font-medium bg-card flex-1"
                                  />
                                  {isSubPaid ? (
                                    <Badge className="text-[9px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700 font-bold shrink-0">
                                      Paid
                                    </Badge>
                                  ) : (
                                    <Badge className="text-[9px] px-1.5 py-0 bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-700 font-bold shrink-0">
                                      Unpaid
                                    </Badge>
                                  )}
                                  {sub.billing_frequency && sub.billing_frequency !== "One-Time" && sub.billing_frequency !== "none" ? (
                                    subProration.isProrated ? (
                                      <Badge className="text-[9px] px-1.5 py-0 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 shrink-0">
                                        Prorated
                                      </Badge>
                                    ) : (
                                      <Badge className="text-[9px] px-1.5 py-0 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 shrink-0">
                                        Recurring
                                      </Badge>
                                    )
                                  ) : (
                                    <Badge className="text-[9px] px-1.5 py-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 shrink-0">
                                      One-Time
                                    </Badge>
                                  )}
                                  {sub.is_reference_only && (
                                    <Badge className="text-[9px] px-1.5 py-0 bg-amber-100 text-amber-800 border-amber-200 shrink-0">
                                      Ref Only
                                    </Badge>
                                  )}
                                </div>
                                <div className="pl-4 space-y-0.5">
                                  <textarea
                                    value={sub.description}
                                    onChange={(e) => handleUpdateSubItem(idx, sIdx, "description", e.target.value)}
                                    placeholder="Description..."
                                    rows={1}
                                    className="w-full text-[11px] text-muted-foreground border border-input rounded bg-card px-2 py-0.5 resize-y min-h-[24px] focus:outline-none focus:border-blue-500 leading-relaxed"
                                  />
                                  {subProration.isProrated && subProration.proratedNote && (
                                    <div className="text-[10.5px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded font-medium inline-flex items-center gap-1 mt-0.5">
                                      <span>ℹ️ {subProration.proratedNote}</span>
                                    </div>
                                  )}
                                  {sub.service_period && (
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium pt-0.5 leading-snug">
                                      <span className="inline-flex items-center gap-1 shrink-0">
                                        <CalendarIcon className="w-3 h-3 shrink-0" />
                                        <span>Service Period: {sub.service_period}</span>
                                      </span>
                                      {sub.next_billing_date && (
                                        <span className="text-muted-foreground whitespace-nowrap">• Next Billing Date: {sub.next_billing_date}</span>
                                      )}
                                    </div>
                                  )}
                                  {subProration.isProrated && activeFormula && (
                                    <div className="text-[11px] text-blue-600 dark:text-blue-400 italic font-mono tracking-tight break-words">
                                      Formula: {activeFormula}
                                    </div>
                                  )}
                                </div>
                              </td>

                          {/* Sub-item Unit Price */}
                          <td className="py-1.5 px-2 align-top">
                            <Input
                              type="number"
                              step="0.01"
                              value={sub.unit_price ?? ""}
                              onChange={(e) => handleUpdateSubItem(idx, sIdx, "unit_price", e.target.value)}
                              placeholder="0.00"
                              className="text-xs h-6 font-mono text-left px-1.5 bg-card"
                            />
                          </td>

                          {/* Sub-item Currency */}
                          <td className="py-1.5 px-2 align-top">
                            <CurrencyAutocomplete
                              value={sub.currency || item.currency || currency || "USD"}
                              onChange={(val) => handleUpdateSubItem(idx, sIdx, "currency", val)}
                              className="h-6 text-[11px] px-1.5"
                            />
                          </td>

                          {/* Sub-item Quantity */}
                          <td className="py-1.5 px-2 align-top">
                            <Input
                              type="number"
                              step="1"
                              min="1"
                              value={sub.quantity ?? ""}
                              onChange={(e) => handleUpdateSubItem(idx, sIdx, "quantity", e.target.value)}
                              placeholder="1"
                              className="text-xs h-6 font-mono text-left px-1.5 bg-card"
                            />
                          </td>

                          {/* Sub-item Unit Discount */}
                          <td className="py-1.5 px-2 align-top">
                            <div className="flex items-center rounded-md border border-input bg-card focus-within:border-blue-500 overflow-hidden h-6">
                              <select
                                value={sub.discount_type || "%"}
                                onChange={(e) => handleUpdateSubItem(idx, sIdx, "discount_type", e.target.value as "%" | "$")}
                                className="h-full bg-muted/60 text-[10px] text-foreground px-1 border-r border-border focus:outline-none cursor-pointer"
                              >
                                <option value="%">%</option>
                                <option value="$">$</option>
                              </select>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={sub.unit_discount ?? ""}
                                onChange={(e) => handleUpdateSubItem(idx, sIdx, "unit_discount", e.target.value)}
                                placeholder="0"
                                className="w-full h-full text-[11px] text-left px-1 bg-transparent focus:outline-none font-mono"
                              />
                            </div>
                          </td>

                          {/* Sub-item Billing Frequency */}
                          <td className="py-1.5 px-2 align-top">
                            <Select
                              value={normalizeBillingFrequencyForSelect(sub.billing_frequency || sub.billing_type)}
                              onValueChange={(val) => handleUpdateSubItem(idx, sIdx, "billing_frequency", val === "none" ? "" : val)}
                            >
                              <SelectTrigger className="h-6 text-[11px] border-input bg-card px-1.5">
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent className="bg-popover border-border z-50">
                                <SelectItem value="none">Select...</SelectItem>
                                <SelectItem value="One-Time">One-Time</SelectItem>
                                <SelectItem value="Monthly">Monthly</SelectItem>
                                <SelectItem value="Annually">Annually</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>

                          {/* Sub-item Term */}
                          <td className="py-1.5 px-2 align-top">
                            <Input
                              type="number"
                              step="1"
                              min="1"
                              value={sub.term ?? ""}
                              onChange={(e) => handleUpdateSubItem(idx, sIdx, "term", e.target.value)}
                              placeholder="1"
                              className="h-6 text-[11px] text-left font-normal border-input bg-card px-1.5"
                            />
                          </td>

                          {/* Sub-item Billing Start Date */}
                          <td className="py-1.5 px-2 align-top">
                            <BillingStartDatePicker
                              value={sub.billing_start_date || ""}
                              onChange={(val) => handleUpdateSubItem(idx, sIdx, "billing_start_date", val)}
                              size="xs"
                            />
                          </td>

                          {/* Sub-item Tax Rate */}
                          <td className="py-1.5 px-2 align-top">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={sub.tax_rate ?? ""}
                              onChange={(e) => handleUpdateSubItem(idx, sIdx, "tax_rate", e.target.value)}
                              placeholder="0%"
                              className="h-6 text-[11px] text-left font-mono border-input bg-card px-1.5"
                            />
                          </td>

                          {/* Sub-item Total */}
                          <td className="py-1.5 px-2 align-top">
                            {sub.is_reference_only ? (
                              <div className="text-[10px] text-muted-foreground italic font-normal text-right pt-1 px-1.5">
                                Ref: ${(Number(sub.reference_amount) || (sub.total !== undefined && sub.total !== "" ? Number(sub.total) : subProration.amount)).toFixed(2)}
                              </div>
                            ) : (
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={sub.total !== undefined && sub.total !== "" ? sub.total : subProration.amount}
                                onChange={(e) => handleUpdateSubItem(idx, sIdx, "total", e.target.value)}
                                placeholder="0.00"
                                className="h-6 text-[11px] text-right font-mono font-bold border-input bg-card px-1.5"
                              />
                            )}
                          </td>

                          {/* Sub-item Delete Action */}
                          <td className="py-1.5 px-2 text-center align-top pt-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveSubItem(idx, sIdx)}
                              className="h-6 w-6 text-muted-foreground hover:text-red-600 cursor-pointer"
                              title="Delete sub-item"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </td>
                        </tr>
                          );
                        })}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Subtotal Summary Banner displaying Selected Currency */}
            <div className="flex justify-end pt-1">
              <div className="flex items-center gap-3 bg-muted/60 px-5 py-2.5 rounded-xl border border-border flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    Status:
                  </span>
                  <Badge
                    className={`text-xs px-2.5 py-0.5 font-bold ${
                      calculatedTotals.effectiveBalanceDue === 0 && calculatedTotals.totalPaidAmount > 0
                        ? (invoiceStatus.toUpperCase() === "PAID (PRORATED)"
                            ? "bg-teal-50 text-teal-800 border-teal-300 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-700"
                            : "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700")
                        : (calculatedTotals.totalPaidAmount > 0
                            ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300"
                            : (invoiceStatus && invoiceStatus.toUpperCase() !== "DRAFT" ? "bg-blue-50 text-blue-700 border-blue-300" : "bg-slate-100 text-slate-700 border-slate-300"))
                    }`}
                  >
                    {calculatedTotals.effectiveBalanceDue === 0 && calculatedTotals.totalPaidAmount > 0
                      ? (invoiceStatus.toUpperCase().startsWith("PAID") ? invoiceStatus : "PAID")
                      : (calculatedTotals.totalPaidAmount > 0 ? "Open / Unpaid" : (invoiceStatus || "Open / Unpaid"))}
                  </Badge>
                </div>
                <div className="h-4 w-px bg-border shrink-0" />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    Total Invoiced:
                  </span>
                  <span className="font-mono text-sm font-semibold text-foreground">
                    {currency} ${(Number(subTotal) || 0).toFixed(2)}
                  </span>
                </div>
                {calculatedTotals.totalPaidAmount > 0 && (
                  <>
                    <div className="h-4 w-px bg-border shrink-0" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">
                        Amount Paid:
                      </span>
                      <span className="font-mono text-sm font-semibold text-emerald-600">
                        -{currency} ${calculatedTotals.totalPaidAmount.toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
                <div className="h-4 w-px bg-border shrink-0" />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    Calculated Balance Due:
                  </span>
                  <span className={`font-mono text-base font-black ${calculatedTotals.effectiveBalanceDue === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-indigo-600 dark:text-indigo-400"}`}>
                    {currency} ${calculatedTotals.effectiveBalanceDue.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Payable Charges Separation Block (Directly Under Calculated Balance Due) ── */}
            <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                {/* Left: Explanation */}
                <div className="space-y-1.5 max-w-md text-xs text-slate-500 dark:text-slate-400">
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Payable Charges Separation</span>
                  </div>
                  <p className="leading-relaxed text-[11.5px]">
                    Only charges belonging directly to this invoice (
                    <strong className="text-slate-700 dark:text-slate-300">{invoiceNumber}</strong>) are included in the balance due.
                    Previously invoiced subscription baselines and reference add-ons remain for audit reference only.
                  </p>
                </div>

                {/* Right: Calculated Breakdown */}
                <div className="w-full md:w-[420px] max-w-md space-y-2 text-xs shrink-0">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>New Charges Subtotal:</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      ${calculatedTotals.newChargesSubtotal.toFixed(2)} {currency}
                    </span>
                  </div>

                  {calculatedTotals.referenceChargesSubtotal > 0 && (
                    <div className="flex justify-between text-slate-400 italic">
                      <span>Previously Invoiced (Reference):</span>
                      <span className="font-mono whitespace-nowrap">
                        ${calculatedTotals.referenceChargesSubtotal.toFixed(2)} {currency}
                      </span>
                    </div>
                  )}

                  {calculatedTotals.totalDiscounts > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Applicable Discounts:</span>
                      <span className="font-mono font-semibold whitespace-nowrap">
                        -${calculatedTotals.totalDiscounts.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {calculatedTotals.totalTaxes > 0 && (
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Estimated Tax:</span>
                      <span className="font-mono font-semibold whitespace-nowrap">
                        +${calculatedTotals.totalTaxes.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {calculatedTotals.totalPaidAmount > 0 ? (
                    <>
                      <div className="flex justify-between text-emerald-600 font-semibold">
                        <span>Amount Paid:</span>
                        <span className="font-mono whitespace-nowrap">
                          -${calculatedTotals.totalPaidAmount.toFixed(2)} {currency}
                        </span>
                      </div>
                      <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <span className="text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            Balance Due on this Invoice:
                          </span>
                          {calculatedTotals.effectiveBalanceDue === 0 && (
                            <Badge className="text-[10px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 font-bold whitespace-nowrap shrink-0">
                              {invoiceStatus || "PAID"}
                            </Badge>
                          )}
                        </div>
                        <div className={`text-lg font-extrabold font-mono whitespace-nowrap shrink-0 ${calculatedTotals.effectiveBalanceDue === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-indigo-600 dark:text-indigo-400"}`}>
                          ${calculatedTotals.effectiveBalanceDue.toFixed(2)} {currency}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                      <span className="text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        Amount Due on this Invoice:
                      </span>
                      <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 font-mono whitespace-nowrap shrink-0">
                        ${calculatedTotals.amountDue.toFixed(2)} {currency}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Next Renewal Projection if applicable */}
              {computedNextRenewal && (
                <div className="mt-2 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-semibold text-slate-900 dark:text-white">Next Renewal — Not Due Now:</span>
                    <span className="text-slate-500">{computedNextRenewal.summary_text}</span>
                  </div>
                  <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    ${Number(computedNextRenewal.total_renewal_amount).toFixed(2)} {computedNextRenewal.currency} ({computedNextRenewal.frequency_label})
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. Notes & Remittance / Payment Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Notes */}
            <div className="space-y-2">
              {renderFieldHeader("Invoice Notes / Greeting", "notes")}
              <Textarea
                id="notes"
                name="notes"
                rows={5}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. We appreciate your business!"
                className={`text-xs resize-none ${!isFieldVisible("notes") ? "opacity-60 bg-muted/40" : ""}`}
              />
            </div>

            {/* Banking Details */}
            <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-border/80 space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Payment / Remittance Information
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  {renderFieldHeader("Bank Name", "bank_name")}
                  <Input
                    id="bank_name"
                    name="bank_name"
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. Bank of America"
                    className={`text-xs bg-card ${!isFieldVisible("bank_name") ? "opacity-60 bg-muted/40" : ""}`}
                  />
                </div>

                <div className="space-y-1.5">
                  {renderFieldHeader("Account Number", "bank_account")}
                  <Input
                    id="bank_account"
                    name="bank_account"
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="e.g. 2910 2819 7458"
                    className={`text-xs font-mono bg-card ${!isFieldVisible("bank_account") ? "opacity-60 bg-muted/40" : ""}`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                {renderFieldHeader("Bank Address / Branch", "bank_address")}
                <Input
                  id="bank_address"
                  name="bank_address"
                  type="text"
                  value={bankAddress}
                  onChange={(e) => setBankAddress(e.target.value)}
                  placeholder="e.g. 896 N Route 59, Aurora, IL 60504"
                  className={`text-xs bg-card ${!isFieldVisible("bank_address") ? "opacity-60 bg-muted/40" : ""}`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  {renderFieldHeader("ACH Routing Number", "ach_routing")}
                  <Input
                    id="ach_routing"
                    name="ach_routing"
                    type="text"
                    value={achRouting}
                    onChange={(e) => setAchRouting(e.target.value)}
                    placeholder="e.g. 026009593"
                    className={`text-xs font-mono bg-card ${!isFieldVisible("ach_routing") ? "opacity-60 bg-muted/40" : ""}`}
                  />
                </div>
                <div className="space-y-1.5">
                  {renderFieldHeader("Wire Routing Number", "wire_routing")}
                  <Input
                    id="wire_routing"
                    name="wire_routing"
                    type="text"
                    value={wireRouting}
                    onChange={(e) => setWireRouting(e.target.value)}
                    placeholder="e.g. 026009593"
                    className={`text-xs font-mono bg-card ${!isFieldVisible("wire_routing") ? "opacity-60 bg-muted/40" : ""}`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Action Controls */}
          <div className="flex items-center justify-between flex-wrap gap-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span>Click &quot;Preview PDF & Populate&quot; to generate and view the populated document below.</span>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                size="default"
                onClick={handlePreviewAndScroll}
                className="text-xs sm:text-sm font-bold gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all px-5 cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Preview PDF & Populate</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── 2. PDF DOCUMENT PREVIEW SECTION (Populated View & Canvas) ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div ref={pdfPreviewRef} className="space-y-4 pt-2 print:space-y-0 print:pt-0 print:m-0 print:w-full">
        {/* Preview Control Bar (Hidden when printing) */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between flex-wrap gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">
                  PDF Document Preview
                </h3>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                  {currency}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {lastPreviewedAt
                  ? `Populated with current form data (${lastPreviewedAt.toLocaleTimeString()})`
                  : "Live representation of the exported PDF document"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleScrollToForm}
              className="text-xs gap-1.5 bg-card hover:bg-muted cursor-pointer"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>Back to Form</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs gap-1.5 bg-card hover:bg-muted cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Export PDF</span>
            </Button>
          </div>
        </div>

        {/* ── INVOICE TEMPLATE CANVAS (Pure PDF Layout with Populated Data) ── */}
        <div
          id="invoice-document-canvas"
          className="bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-200 overflow-hidden print:border-none print:shadow-none print:rounded-none print:m-0 print:p-0 print:w-full transition-all duration-300"
          style={{ fontFamily: "'Inter', Arial, sans-serif" }}
        >
          {/* ══════════════════════════════════════════════════════════════ */}
          {/* TEMPLATE 1: PACE+ (SLATE BLUE) ═══════════════════════════════ */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {(layoutStyle === "pace_plus" || layoutStyle === "modern") && (
            <div className="p-6 sm:p-10 print:p-4 space-y-6 print:space-y-3 bg-white text-slate-900 print:text-[11px]">
              {/* Header: Logo (Left), Address (Middle), Invoice Title (Right) */}
              <div className="grid grid-cols-12 gap-4 items-center pb-2">
                {/* Logo PACE+ (Original image from attachments) */}
                <div className="col-span-12 sm:col-span-5 flex items-center">
                  <img
                    src="/pace_plus_logo.png"
                    alt="PACE+"
                    className="h-14 sm:h-16 lg:h-18 w-auto max-w-[280px] object-contain select-none"
                  />
                </div>

                {/* Company Address (Middle) */}
                <div className="col-span-12 sm:col-span-4 text-xs text-slate-800 leading-relaxed pt-1 whitespace-pre-line">
                  {isFieldVisible("from_address") && fromAddress ? fromAddress : ""}
                </div>

                {/* Invoice Title (Right) */}
                <div className="col-span-12 sm:col-span-3 text-right">
                  <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
                    Invoice
                  </h1>
                </div>
              </div>

              {/* Bill To Box */}
              {(isFieldVisible("bill_to_name") || isFieldVisible("bill_to_phone") || isFieldVisible("bill_to_email") || isFieldVisible("bill_to_address")) && (
                <div className="w-full sm:w-80 border border-[#dce6f1] rounded-xs overflow-hidden">
                  <div
                    className="py-1 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-800"
                    style={{ backgroundColor: "#dce6f1" }}
                  >
                    BILL TO
                  </div>
                  <div className="p-3 text-xs text-slate-800 space-y-0.5 leading-relaxed bg-white">
                    {isFieldVisible("bill_to_name") && billToName && (
                      <div className="font-semibold text-slate-900">
                        {billToName}
                      </div>
                    )}
                    {isFieldVisible("bill_to_phone") && billToPhone && <div>{billToPhone}</div>}
                    {isFieldVisible("bill_to_email") && billToEmail && <div>{billToEmail}</div>}
                    {isFieldVisible("bill_to_address") && billToAddress && (
                      <div className="whitespace-pre-line pt-0.5 text-slate-700">
                        {billToAddress}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Invoice Summary Table (6 Columns: INVOICE #, DATE, TOTAL DUE, DUE DATE, TERMS, ENCLOSED) */}
              <div className="overflow-hidden border border-[#dce6f1] rounded-xs">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr
                      className="text-[11px] font-bold uppercase tracking-wider text-slate-800 border-b border-[#cbd5e1]"
                      style={{ backgroundColor: "#dce6f1" }}
                    >
                      <th className="py-1.5 px-3 border-r border-[#cbd5e1] w-[16%]">INVOICE #</th>
                      <th className="py-1.5 px-3 border-r border-[#cbd5e1] w-[16%]">DATE</th>
                      <th className="py-1.5 px-3 border-r border-[#cbd5e1] w-[18%]">TOTAL DUE</th>
                      <th className="py-1.5 px-3 border-r border-[#cbd5e1] w-[18%]">DUE DATE</th>
                      <th className="py-1.5 px-3 border-r border-[#cbd5e1] w-[18%]">TERMS</th>
                      <th className="py-1.5 px-3 w-[14%]">ENCLOSED</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white text-slate-900 font-medium">
                      <td className="py-2 px-3 border-r border-[#dce6f1] font-mono">
                        {isFieldVisible("invoice_number") ? invoiceNumber || "18067" : "—"}
                      </td>
                      <td className="py-2 px-3 border-r border-[#dce6f1]">
                        {isFieldVisible("invoice_date") ? invoiceDate : "—"}
                      </td>
                      <td className="py-2 px-3 border-r border-[#dce6f1] font-semibold">
                        {currency} ${calculatedTotals.effectiveBalanceDue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 border-r border-[#dce6f1]">
                        {isFieldVisible("due_date") ? dueDate : "—"}
                      </td>
                      <td className="py-2 px-3 border-r border-[#dce6f1]">
                        {isFieldVisible("terms") ? terms || "Due on receipt" : "—"}
                      </td>
                      <td className="py-2 px-3 bg-slate-50/40"></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Line Items Table (Dynamic Columns - hides non-filled / 0 / null columns) */}
              <div className="overflow-x-auto border border-[#dce6f1] rounded-xs w-full">
                <table
                  className="w-full text-xs text-left border-collapse"
                  style={{ minWidth: visibleColumnCount >= 8 ? "850px" : "100%", tableLayout: "auto" }}
                >
                  <thead>
                    <tr
                      className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-800 border-b border-[#cbd5e1]"
                      style={{ backgroundColor: "#dce6f1" }}
                    >
                      {showDateCol && (
                        <th className="py-2 px-2 border-r border-[#cbd5e1] text-left w-[85px] min-w-[85px]">DATE</th>
                      )}
                      <th className="py-2 px-3 border-r border-[#cbd5e1] text-left min-w-[200px]">ACTIVITY / ITEM &amp; DESCRIPTION</th>
                      {showUnitPriceCol && (
                        <th className="py-2 px-2 border-r border-[#cbd5e1] text-right w-[80px] min-w-[80px]">UNIT PRICE</th>
                      )}
                      {showCurrencyCol && (
                        <th className="py-2 px-1 border-r border-[#cbd5e1] text-center w-[55px] min-w-[55px]">CURRENCY</th>
                      )}
                      {showQtyCol && (
                        <th className="py-2 px-1 border-r border-[#cbd5e1] text-center w-[40px] min-w-[40px]">QTY</th>
                      )}
                      {showDiscountCol && (
                        <th className="py-2 px-1.5 border-r border-[#cbd5e1] text-center w-[75px] min-w-[75px]">UNIT DISC</th>
                      )}
                      {showTaxCol && (
                        <th className="py-2 px-1 border-r border-[#cbd5e1] text-center w-[45px] min-w-[45px]">TAX</th>
                      )}
                      <th className="py-2 px-2.5 text-right w-[90px] min-w-[90px]">NET PRICE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dce6f1]">
                    {lineItems.map((item, idx) => {
                      const isItemPaid = (item.status === "Paid" || item.service_status === "Paid") && item.status !== "Unpaid" && item.service_status !== "Unpaid";
                      const parentProration = computeItemProration(
                        item.quantity,
                        item.unit_price,
                        item.unit_discount,
                        item.discount_type,
                        item.billing_frequency,
                        item.billing_start_date,
                        item.tax_rate,
                        item.term,
                        isItemPaid
                      );

                      return (
                        <Fragment key={idx}>
                          {/* Parent Activity / Item Row */}
                          <tr className="bg-white hover:bg-slate-50/30">
                            {showDateCol && (
                              <td className="py-2.5 px-2 border-r border-[#dce6f1] text-slate-700 align-top text-[11px] whitespace-nowrap">
                                {item.date || invoiceDate}
                              </td>
                            )}
                            <td className="py-2.5 px-3 border-r border-[#dce6f1] text-slate-900 align-top">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-slate-900 text-xs">{item.activity || item.name || `Item ${idx + 1}`}</span>
                                  {isItemPaid ? (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold">
                                      Paid
                                    </span>
                                  ) : (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-300 font-bold">
                                      Unpaid
                                    </span>
                                  )}
                                  {item.billing_frequency && item.billing_frequency !== "One-Time" && item.billing_frequency !== "none" ? (
                                    parentProration.isProrated ? (
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                                        Prorated
                                      </span>
                                    ) : (
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                                        Recurring
                                      </span>
                                    )
                                  ) : (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-300 font-medium">
                                      One-Time
                                    </span>
                                  )}
                                </div>
                                {item.description && (
                                  <div className="text-slate-700 text-[11px] whitespace-pre-line leading-relaxed">{item.description}</div>
                                )}
                                {/* Frequency, Chargeable period, Start Billing note */}
                                {(item.billing_frequency || (item.term !== undefined && item.term !== null && String(item.term).trim() !== "") || item.billing_start_date) && (
                                  <div className="text-[10.5px] text-slate-600 flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-0.5">
                                    {item.billing_frequency && item.billing_frequency !== "—" && (
                                      <span>
                                        <strong className="font-semibold text-slate-800">Frequency:</strong> {item.billing_frequency}
                                      </span>
                                    )}
                                    {item.term !== undefined && item.term !== null && String(item.term).trim() !== "" && (
                                      <>
                                        {item.billing_frequency && item.billing_frequency !== "—" && <span className="text-slate-400">•</span>}
                                        <span>
                                          <strong className="font-semibold text-slate-800">Chargeable period:</strong> {getChargeablePeriodLabel(item.term, item.billing_frequency)}
                                        </span>
                                      </>
                                    )}
                                    {item.billing_start_date && item.billing_start_date !== "—" && (
                                      <>
                                        {((item.billing_frequency && item.billing_frequency !== "—") || (item.term !== undefined && item.term !== null && String(item.term).trim() !== "")) && (
                                          <span className="text-slate-400">•</span>
                                        )}
                                        <span>
                                          <strong className="font-semibold text-slate-800">Start Billing:</strong> {item.billing_start_date}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                )}
                                {parentProration.isProrated && parentProration.proratedNote && (
                                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-[10px] text-amber-800 font-medium mt-0.5">
                                    <span>ℹ️ {parentProration.proratedNote}</span>
                                  </div>
                                )}
                                {item.service_period && (
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px] text-indigo-600 font-medium pt-0.5 leading-snug">
                                    <span className="inline-flex items-center gap-1 shrink-0">
                                      <CalendarIcon className="w-3 h-3 shrink-0" />
                                      <span>Service Period: {item.service_period}</span>
                                    </span>
                                    {item.next_billing_date && (
                                      <span className="text-muted-foreground whitespace-nowrap">• Next Billing Date: {item.next_billing_date}</span>
                                    )}
                                  </div>
                                )}
                                {parentProration.isProrated && parentProration.formulaString && (
                                  <div className="text-[10px] text-blue-600 italic font-mono mt-0.5 tracking-tight break-words">
                                    Formula: {parentProration.formulaString}
                                  </div>
                                )}
                              </div>
                            </td>
                            {showUnitPriceCol && (
                              <td className="py-2.5 px-2 text-right border-r border-[#dce6f1] font-mono text-slate-800 align-top text-xs whitespace-nowrap">
                                ${(Number(item.unit_price) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            )}
                            {showCurrencyCol && (
                              <td className="py-2.5 px-1 text-center border-r border-[#dce6f1] text-slate-700 align-top text-xs whitespace-nowrap">
                                {item.currency || currency || "USD"}
                              </td>
                            )}
                            {showQtyCol && (
                              <td className="py-2.5 px-1 text-center border-r border-[#dce6f1] font-mono text-slate-800 align-top text-xs whitespace-nowrap">
                                {item.quantity !== "" && item.quantity !== undefined ? item.quantity : 1}
                              </td>
                            )}
                            {showDiscountCol && (
                              <td className="py-2.5 px-1.5 text-center border-r border-[#dce6f1] font-mono text-slate-700 align-top text-xs whitespace-nowrap">
                                {item.unit_discount ? `${item.unit_discount}${item.discount_type || "%"}` : "0%"}
                              </td>
                            )}
                            {showTaxCol && (
                              <td className="py-2.5 px-1 text-center border-r border-[#dce6f1] font-mono text-slate-700 align-top text-xs whitespace-nowrap">
                                {item.tax_rate !== "" && item.tax_rate !== undefined && Number(item.tax_rate) > 0 ? `${item.tax_rate}%` : "0%"}
                              </td>
                            )}
                            <td className="py-2.5 px-2.5 text-right font-mono text-slate-900 font-bold align-top text-xs whitespace-nowrap">
                              ${((item.total !== undefined && item.total !== "") ? (Number(item.total) || 0) : parentProration.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>

                          {/* Indented Child Sub-items / Prorated Charges under this parent */}
                          {item.sub_items && item.sub_items.map((sub, sIdx) => {
                            const isSubPaid = (sub.status === "Paid" || sub.service_status === "Paid") && sub.status !== "Unpaid" && sub.service_status !== "Unpaid";
                            const subProration = computeItemProration(
                              sub.quantity,
                              sub.unit_price,
                              sub.unit_discount,
                              sub.discount_type,
                              sub.billing_frequency,
                              sub.billing_start_date,
                              sub.tax_rate,
                              sub.term,
                              isSubPaid
                            );
                            const activeFormula = subProration.formulaString || sub.calculation;

                            return (
                              <tr key={sub.id || sIdx} className="bg-slate-50/60 hover:bg-slate-50/90 border-l-2 border-l-blue-400">
                                {showDateCol && (
                                  <td className="py-2.5 px-2 border-r border-[#dce6f1] text-slate-600 align-top text-[11px] whitespace-nowrap">
                                    {sub.date_range || sub.date || item.date || invoiceDate}
                                  </td>
                                )}
                                <td className="py-2.5 px-3 border-r border-[#dce6f1] text-slate-900 align-top">
                                  <div className="pl-2 space-y-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-blue-500 font-mono text-xs leading-none shrink-0">└──</span>
                                      <span className="font-bold text-slate-900 text-xs">{sub.title || sub.activity || sub.name || "Additional Service"}</span>
                                      {isSubPaid ? (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold">
                                          Paid
                                        </span>
                                      ) : (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-300 font-bold">
                                          Unpaid
                                        </span>
                                      )}
                                          {sub.billing_frequency && sub.billing_frequency !== "One-Time" && sub.billing_frequency !== "none" ? (
                                            subProration.isProrated ? (
                                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                                Prorated
                                              </span>
                                            ) : (
                                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                Recurring
                                              </span>
                                            )
                                          ) : (
                                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-300">
                                              One-Time
                                            </span>
                                          )}

                                      {sub.is_reference_only && (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                          Ref Only
                                        </span>
                                      )}
                                    </div>
                                    {sub.description && (
                                      <div className="pl-4 text-slate-700 text-[11px] whitespace-pre-line leading-relaxed">{sub.description}</div>
                                    )}
                                    {/* Frequency, Chargeable period, Start Billing note */}
                                    {((sub.billing_frequency || item.billing_frequency) || (sub.term !== undefined || item.term !== undefined) || (sub.billing_start_date || item.billing_start_date)) && (
                                      <div className="pl-4 text-[10.5px] text-slate-600 flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-0.5">
                                        {(sub.billing_frequency || item.billing_frequency) && (sub.billing_frequency || item.billing_frequency) !== "—" && (
                                          <span>
                                            <strong className="font-semibold text-slate-800">Frequency:</strong> {sub.billing_frequency || item.billing_frequency}
                                          </span>
                                        )}
                                        {((sub.term !== undefined && sub.term !== null && String(sub.term).trim() !== "") || (item.term !== undefined && item.term !== null && String(item.term).trim() !== "")) && (
                                          <>
                                            {(sub.billing_frequency || item.billing_frequency) && (sub.billing_frequency || item.billing_frequency) !== "—" && <span className="text-slate-400">•</span>}
                                            <span>
                                              <strong className="font-semibold text-slate-800">Chargeable period:</strong> {getChargeablePeriodLabel(sub.term ?? item.term, sub.billing_frequency || item.billing_frequency)}
                                            </span>
                                          </>
                                        )}
                                        {(sub.billing_start_date || item.billing_start_date) && (sub.billing_start_date || item.billing_start_date) !== "—" && (
                                          <>
                                            <span className="text-slate-400">•</span>
                                            <span>
                                              <strong className="font-semibold text-slate-800">Start Billing:</strong> {sub.billing_start_date || item.billing_start_date}
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    )}
                                    {subProration.isProrated && subProration.proratedNote && (
                                      <div className="pl-4 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-[10px] text-amber-800 font-medium mt-0.5">
                                        <span>ℹ️ {subProration.proratedNote}</span>
                                      </div>
                                    )}
                                    {sub.service_period && (
                                      <div className="pl-4 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px] text-indigo-600 font-medium pt-0.5 leading-snug">
                                        <span className="inline-flex items-center gap-1 shrink-0">
                                          <CalendarIcon className="w-3 h-3 shrink-0" />
                                          <span>Service Period: {sub.service_period}</span>
                                        </span>
                                        {sub.next_billing_date && (
                                          <span className="text-muted-foreground whitespace-nowrap">• Next Billing Date: {sub.next_billing_date}</span>
                                        )}
                                      </div>
                                    )}
                                    {subProration.isProrated && activeFormula && (
                                      <div className="pl-4 text-[10px] text-blue-600 italic font-mono mt-0.5 tracking-tight break-words">
                                        Formula: {activeFormula}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                {showUnitPriceCol && (
                                  <td className="py-2.5 px-2 text-right border-r border-[#dce6f1] font-mono text-slate-800 align-top text-xs whitespace-nowrap">
                                    ${(Number(sub.unit_price) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                )}
                                {showCurrencyCol && (
                                  <td className="py-2.5 px-1 text-center border-r border-[#dce6f1] text-slate-700 align-top text-xs whitespace-nowrap">
                                    {sub.currency || item.currency || currency || "USD"}
                                  </td>
                                )}
                                {showQtyCol && (
                                  <td className="py-2.5 px-1 text-center border-r border-[#dce6f1] font-mono text-slate-800 align-top text-xs whitespace-nowrap">
                                    {sub.quantity !== "" && sub.quantity !== undefined ? sub.quantity : 1}
                                  </td>
                                )}
                                {showDiscountCol && (
                                  <td className="py-2.5 px-1.5 text-center border-r border-[#dce6f1] font-mono text-slate-700 align-top text-xs whitespace-nowrap">
                                    {sub.unit_discount ? `${sub.unit_discount}${sub.discount_type || "%"}` : "0%"}
                                  </td>
                                )}
                                {showTaxCol && (
                                  <td className="py-2.5 px-1 text-center border-r border-[#dce6f1] font-mono text-slate-700 align-top text-xs whitespace-nowrap">
                                    {sub.tax_rate !== "" && sub.tax_rate !== undefined && Number(sub.tax_rate) > 0 ? `${sub.tax_rate}%` : "0%"}
                                  </td>
                                )}
                                <td className="py-2.5 px-2.5 text-right font-mono text-slate-900 font-bold align-top text-xs whitespace-nowrap">
                                  {sub.is_reference_only ? (
                                    <span className="text-[10px] text-slate-500 font-normal italic">
                                      Ref: ${(Number(sub.reference_amount ?? sub.charge ?? sub.total ?? 0)).toFixed(2)}
                                    </span>
                                  ) : (
                                    `$${((sub.total !== undefined && sub.total !== "") ? (Number(sub.total) || 0) : subProration.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Next Renewal Projection in Pace+ PDF */}
              {computedNextRenewal && (
                <div className="mt-3 p-3 rounded-lg border border-indigo-200 bg-indigo-50/50 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-indigo-950 uppercase tracking-wide text-[11px]">
                        Next renewal — not due now
                      </div>
                      <div className="text-slate-600 text-[11px] mt-0.5">
                        {computedNextRenewal.summary_text}
                      </div>
                    </div>
                    <div className="text-right font-mono font-bold text-sm text-indigo-950">
                      ${(Number(computedNextRenewal.total_renewal_amount) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {computedNextRenewal.frequency_short || "/ yr"}
                    </div>
                  </div>
                </div>
              )}

              {/* Balance Due & Payment Breakdown (Right Aligned) */}
              <div className="flex justify-end pt-2">
                <div className="space-y-1 text-right">
                  {calculatedTotals.totalPaidAmount > 0 ? (
                    <>
                      <div className="flex justify-end items-center gap-4 text-xs text-slate-600">
                        <span className="font-medium">Total Invoiced:</span>
                        <span className="font-mono">{currency} ${(Number(subTotal) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-end items-center gap-4 text-xs text-emerald-600 font-medium">
                        <span>Amount Paid:</span>
                        <span className="font-mono">-{currency} ${calculatedTotals.totalPaidAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-end items-baseline gap-4 pt-1.5 border-t border-slate-200">
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                          BALANCE DUE
                        </span>
                        <span className="text-2xl font-bold font-sans text-slate-900">
                          {currency} ${calculatedTotals.effectiveBalanceDue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-end items-baseline gap-6">
                      <span className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
                        BALANCE DUE
                      </span>
                      <span className="text-2xl font-bold font-sans text-slate-900">
                        {currency} ${(Number(subTotal) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Remittance / Payment Footer */}
              <div className="pt-4 print:pt-2 text-xs print:text-[11px] text-slate-800 space-y-2 print:space-y-1 leading-relaxed border-t border-transparent">
                {isFieldVisible("notes") && notes && (
                  <p className="text-slate-900 font-medium whitespace-pre-line">{notes}</p>
                )}

                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-900">Pay to:</div>
                  {isFieldVisible("from_company") && fromCompany && <div>Title on account: {fromCompany}</div>}
                  {isFieldVisible("bank_name") && bankName && <div>Bank name: {bankName}</div>}
                  {isFieldVisible("bank_account") && bankAccount && <div>Account number: {bankAccount}</div>}
                  {isFieldVisible("ach_routing") && achRouting && <div>ACH routing number: {achRouting}</div>}
                  {isFieldVisible("wire_routing") && wireRouting && <div>Wire routing number: {wireRouting}</div>}
                  {isFieldVisible("bank_address") && bankAddress && <div>Bank address: {bankAddress}</div>}
                  {isFieldVisible("from_address") && fromAddress && (
                    <div className="whitespace-pre-line">Business address: {fromAddress}</div>
                  )}
                  {isFieldVisible("from_email") && fromEmail && <div>{fromEmail}</div>}
                  {isFieldVisible("from_phone") && fromPhone && <div>{fromPhone}</div>}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* TEMPLATE 2: INTERLINKONE (MINT TEAL) ═════════════════════════ */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {(layoutStyle === "interlinkone" || layoutStyle === "classic") && (
            <div className="p-6 sm:p-10 print:p-4 space-y-6 print:space-y-3 bg-white text-slate-900 print:text-[11px]">
              {/* Header: Logo (Left with HIPAA badge), Address (Middle), Invoice Title (Right) */}
              <div className="grid grid-cols-12 gap-4 items-center pb-2">
                {/* Logo interlinkONE (Original image from attachments) */}
                <div className="col-span-12 sm:col-span-5 flex items-center">
                  <img
                    src="/interlinkone_logo.png"
                    alt="interlinkONE"
                    className="h-14 sm:h-16 lg:h-18 w-auto max-w-[280px] object-contain select-none"
                  />
                </div>

                {/* Company Address (Middle) */}
                <div className="col-span-12 sm:col-span-4 text-xs text-slate-800 leading-relaxed pt-1 whitespace-pre-line">
                  {isFieldVisible("from_address") && fromAddress ? fromAddress : ""}
                </div>

                {/* Invoice Title (Right) */}
                <div className="col-span-12 sm:col-span-3 text-right">
                  <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
                    Invoice
                  </h1>
                </div>
              </div>

              {/* Bill To Box */}
              {(isFieldVisible("bill_to_name") || isFieldVisible("bill_to_phone") || isFieldVisible("bill_to_email") || isFieldVisible("bill_to_address")) && (
                <div className="w-full sm:w-80 border border-[#d4f1ee] rounded-xs overflow-hidden">
                  <div
                    className="py-1 px-3 text-[11px] font-bold uppercase tracking-wider text-[#006666]"
                    style={{ backgroundColor: "#d4f1ee" }}
                  >
                    BILL TO
                  </div>
                  <div className="p-3 text-xs text-slate-800 space-y-0.5 leading-relaxed bg-white">
                    {isFieldVisible("bill_to_name") && billToName && (
                      <div className="font-semibold text-slate-900">
                        {billToName}
                      </div>
                    )}
                    {isFieldVisible("bill_to_phone") && billToPhone && <div>{billToPhone}</div>}
                    {isFieldVisible("bill_to_email") && billToEmail && <div>{billToEmail}</div>}
                    {isFieldVisible("bill_to_address") && billToAddress && (
                      <div className="whitespace-pre-line pt-0.5 text-slate-700">
                        {billToAddress}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Invoice Summary Table (6 Columns: INVOICE #, DATE, TOTAL DUE, DUE DATE, TERMS, ENCLOSED) */}
              <div className="overflow-hidden border border-[#d4f1ee] rounded-xs">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr
                      className="text-[11px] font-bold uppercase tracking-wider text-slate-800 border-b border-[#b2e8e2]"
                      style={{ backgroundColor: "#d4f1ee" }}
                    >
                      <th className="py-1.5 px-3 border-r border-[#b2e8e2] w-[16%]">INVOICE #</th>
                      <th className="py-1.5 px-3 border-r border-[#b2e8e2] w-[16%]">DATE</th>
                      <th className="py-1.5 px-3 border-r border-[#b2e8e2] w-[18%]">TOTAL DUE</th>
                      <th className="py-1.5 px-3 border-r border-[#b2e8e2] w-[18%]">DUE DATE</th>
                      <th className="py-1.5 px-3 border-r border-[#b2e8e2] w-[18%]">TERMS</th>
                      <th className="py-1.5 px-3 w-[14%]">ENCLOSED</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white text-slate-900 font-medium">
                      <td className="py-2 px-3 border-r border-[#d4f1ee] font-mono">
                        {isFieldVisible("invoice_number") ? invoiceNumber || "18063" : "—"}
                      </td>
                      <td className="py-2 px-3 border-r border-[#d4f1ee]">
                        {isFieldVisible("invoice_date") ? invoiceDate : "—"}
                      </td>
                      <td className="py-2 px-3 border-r border-[#d4f1ee] font-semibold">
                        {currency} ${calculatedTotals.effectiveBalanceDue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 border-r border-[#d4f1ee]">
                        {isFieldVisible("due_date") ? dueDate : "—"}
                      </td>
                      <td className="py-2 px-3 border-r border-[#d4f1ee]">
                        {isFieldVisible("terms") ? terms || "Due on receipt" : "—"}
                      </td>
                      <td className="py-2 px-3 bg-teal-50/20"></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Line Items Table (Dynamic Columns - hides non-filled / 0 / null columns) */}
              <div className="overflow-x-auto border border-[#d4f1ee] rounded-xs w-full">
                <table
                  className="w-full text-xs text-left border-collapse"
                  style={{ minWidth: visibleColumnCount >= 8 ? "850px" : "100%", tableLayout: "auto" }}
                >
                  <thead>
                    <tr
                      className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-[#006666] border-b border-[#b2e8e2]"
                      style={{ backgroundColor: "#d4f1ee" }}
                    >
                      {showDateCol && (
                        <th className="py-2 px-2 border-r border-[#b2e8e2] text-left w-[85px] min-w-[85px]">DATE</th>
                      )}
                      <th className="py-2 px-3 border-r border-[#b2e8e2] text-left min-w-[200px]">ACTIVITY / ITEM &amp; DESCRIPTION</th>
                      {showUnitPriceCol && (
                        <th className="py-2 px-2 border-r border-[#b2e8e2] text-right w-[80px] min-w-[80px]">UNIT PRICE</th>
                      )}
                      {showCurrencyCol && (
                        <th className="py-2 px-1 border-r border-[#b2e8e2] text-center w-[55px] min-w-[55px]">CURRENCY</th>
                      )}
                      {showQtyCol && (
                        <th className="py-2 px-1 border-r border-[#b2e8e2] text-center w-[40px] min-w-[40px]">QTY</th>
                      )}
                      {showDiscountCol && (
                        <th className="py-2 px-1.5 border-r border-[#b2e8e2] text-center w-[75px] min-w-[75px]">UNIT DISC</th>
                      )}
                      {showTaxCol && (
                        <th className="py-2 px-1 border-r border-[#b2e8e2] text-center w-[45px] min-w-[45px]">TAX</th>
                      )}
                      <th className="py-2 px-2.5 text-right w-[90px] min-w-[90px]">NET PRICE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d4f1ee]">
                    {lineItems.map((item, idx) => {
                      const isItemPaid = (item.status === "Paid" || item.service_status === "Paid") && item.status !== "Unpaid" && item.service_status !== "Unpaid";
                      const parentProration = computeItemProration(
                        item.quantity,
                        item.unit_price,
                        item.unit_discount,
                        item.discount_type,
                        item.billing_frequency,
                        item.billing_start_date,
                        item.tax_rate,
                        item.term,
                        isItemPaid
                      );

                      return (
                        <Fragment key={idx}>
                          {/* Parent Activity / Item Row */}
                          <tr className="bg-white hover:bg-teal-50/20">
                            {showDateCol && (
                              <td className="py-2.5 px-2 border-r border-[#d4f1ee] text-slate-700 align-top text-[11px] whitespace-nowrap">
                                {item.date || invoiceDate}
                              </td>
                            )}
                            <td className="py-2.5 px-3 border-r border-[#d4f1ee] text-slate-900 align-top">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-slate-900 text-xs">{item.activity || item.name || `Item ${idx + 1}`}</span>
                                  {isItemPaid ? (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold">
                                      Paid
                                    </span>
                                  ) : (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border-rose-300 font-bold">
                                      Unpaid
                                    </span>
                                  )}
                                  {item.billing_frequency && item.billing_frequency !== "One-Time" && item.billing_frequency !== "none" ? (
                                    parentProration.isProrated || item.is_prorated || item.badge === "Prorated" ? (
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                                        Prorated
                                      </span>
                                    ) : (
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                                        Recurring
                                      </span>
                                    )
                                  ) : (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-300 font-medium">
                                      One-Time
                                    </span>
                                  )}
                                </div>
                                {item.description && (
                                  <div className="text-slate-700 text-[11px] whitespace-pre-line leading-relaxed">{item.description}</div>
                                )}
                                {/* Frequency, Chargeable period, Start Billing note */}
                                {(item.billing_frequency || (item.term !== undefined && item.term !== null && String(item.term).trim() !== "") || item.billing_start_date) && (
                                  <div className="text-[10.5px] text-slate-600 flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-0.5">
                                    {item.billing_frequency && item.billing_frequency !== "—" && (
                                      <span>
                                        <strong className="font-semibold text-teal-900">Frequency:</strong> {item.billing_frequency}
                                      </span>
                                    )}
                                    {item.term !== undefined && item.term !== null && String(item.term).trim() !== "" && (
                                      <>
                                        {item.billing_frequency && item.billing_frequency !== "—" && <span className="text-teal-400">•</span>}
                                        <span>
                                          <strong className="font-semibold text-teal-900">Chargeable period:</strong> {getChargeablePeriodLabel(item.term, item.billing_frequency)}
                                        </span>
                                      </>
                                    )}
                                    {item.billing_start_date && item.billing_start_date !== "—" && (
                                      <>
                                        {((item.billing_frequency && item.billing_frequency !== "—") || (item.term !== undefined && item.term !== null && String(item.term).trim() !== "")) && (
                                          <span className="text-teal-400">•</span>
                                        )}
                                        <span>
                                          <strong className="font-semibold text-teal-900">Start Billing:</strong> {item.billing_start_date}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                )}
                                {parentProration.isProrated && parentProration.proratedNote && (
                                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-[10px] text-teal-900 font-medium mt-0.5">
                                    <span>ℹ️ {parentProration.proratedNote}</span>
                                  </div>
                                )}
                                {item.service_period && (
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px] text-teal-700 font-medium pt-0.5 leading-snug">
                                    <span className="inline-flex items-center gap-1 shrink-0">
                                      <CalendarIcon className="w-3 h-3 shrink-0" />
                                      <span>Service Period: {item.service_period}</span>
                                    </span>
                                    {item.next_billing_date && (
                                      <span className="text-muted-foreground whitespace-nowrap">• Next Billing Date: {item.next_billing_date}</span>
                                    )}
                                  </div>
                                )}
                                {parentProration.isProrated && parentProration.formulaString && (
                                  <div className="text-[10px] text-teal-800 italic font-mono mt-0.5 tracking-tight break-words">
                                    Formula: {parentProration.formulaString}
                                  </div>
                                )}
                              </div>
                            </td>
                            {showUnitPriceCol && (
                              <td className="py-2.5 px-2 text-right border-r border-[#d4f1ee] font-mono text-slate-800 align-top text-xs whitespace-nowrap">
                                ${(Number(item.unit_price) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            )}
                            {showCurrencyCol && (
                              <td className="py-2.5 px-1 text-center border-r border-[#d4f1ee] text-slate-700 align-top text-xs whitespace-nowrap">
                                {item.currency || currency || "USD"}
                              </td>
                            )}
                            {showQtyCol && (
                              <td className="py-2.5 px-1 text-center border-r border-[#d4f1ee] font-mono text-slate-800 align-top text-xs whitespace-nowrap">
                                {item.quantity !== "" && item.quantity !== undefined ? item.quantity : 1}
                              </td>
                            )}
                            {showDiscountCol && (
                              <td className="py-2.5 px-1.5 text-center border-r border-[#d4f1ee] font-mono text-slate-700 align-top text-xs whitespace-nowrap">
                                {item.unit_discount ? `${item.unit_discount}${item.discount_type || "%"}` : "0%"}
                              </td>
                            )}
                            {showTaxCol && (
                              <td className="py-2.5 px-1 text-center border-r border-[#d4f1ee] font-mono text-slate-700 align-top text-xs whitespace-nowrap">
                                {item.tax_rate !== "" && item.tax_rate !== undefined && Number(item.tax_rate) > 0 ? `${item.tax_rate}%` : "0%"}
                              </td>
                            )}
                            <td className="py-2.5 px-2.5 text-right font-mono text-slate-900 font-bold align-top text-xs whitespace-nowrap">
                              ${((item.total !== undefined && item.total !== "") ? (Number(item.total) || 0) : parentProration.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>

                          {/* Indented Child Sub-items / Prorated Charges under this parent */}
                          {item.sub_items && item.sub_items.map((sub, sIdx) => {
                            const isSubPaid = (sub.status === "Paid" || sub.service_status === "Paid") && sub.status !== "Unpaid" && sub.service_status !== "Unpaid";
                            const subProration = computeItemProration(
                              sub.quantity,
                              sub.unit_price,
                              sub.unit_discount,
                              sub.discount_type,
                              sub.billing_frequency,
                              sub.billing_start_date,
                              sub.tax_rate,
                              sub.term,
                              isSubPaid
                            );
                            const activeFormula = subProration.formulaString || sub.calculation;

                            return (
                              <tr key={sub.id || sIdx} className="bg-teal-50/30 hover:bg-teal-50/60 border-l-2 border-l-[#008080]">
                                {showDateCol && (
                                  <td className="py-2.5 px-2 border-r border-[#d4f1ee] text-slate-600 align-top text-[11px] whitespace-nowrap">
                                    {sub.date_range || sub.date || item.date || invoiceDate}
                                  </td>
                                )}
                                <td className="py-2.5 px-3 border-r border-[#d4f1ee] text-slate-900 align-top">
                                  <div className="pl-2 space-y-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-teal-600 font-mono text-xs leading-none shrink-0">└──</span>
                                      <span className="font-bold text-slate-900 text-xs">{sub.title || sub.activity || sub.name || "Additional Service"}</span>
                                      {isSubPaid ? (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold">
                                          Paid
                                        </span>
                                      ) : (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-300 font-bold">
                                          Unpaid
                                        </span>
                                      )}
                                          {sub.billing_frequency && sub.billing_frequency !== "One-Time" && sub.billing_frequency !== "none" ? (
                                            subProration.isProrated ? (
                                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                                Prorated
                                              </span>
                                            ) : (
                                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                Recurring
                                              </span>
                                            )
                                          ) : (
                                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-300">
                                              One-Time
                                            </span>
                                          )}

                                      {sub.is_reference_only && (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                          Ref Only
                                        </span>
                                      )}
                                    </div>
                                    {sub.description && (
                                      <div className="pl-4 text-slate-700 text-[11px] whitespace-pre-line leading-relaxed">{sub.description}</div>
                                    )}
                                    {/* Frequency, Chargeable period, Start Billing note */}
                                    {((sub.billing_frequency || item.billing_frequency) || (sub.term !== undefined || item.term !== undefined) || (sub.billing_start_date || item.billing_start_date)) && (
                                      <div className="pl-4 text-[10.5px] text-slate-600 flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-0.5">
                                        {(sub.billing_frequency || item.billing_frequency) && (sub.billing_frequency || item.billing_frequency) !== "—" && (
                                          <span>
                                            <strong className="font-semibold text-teal-900">Frequency:</strong> {sub.billing_frequency || item.billing_frequency}
                                          </span>
                                        )}
                                        {((sub.term !== undefined && sub.term !== null && String(sub.term).trim() !== "") || (item.term !== undefined && item.term !== null && String(item.term).trim() !== "")) && (
                                          <>
                                            {(sub.billing_frequency || item.billing_frequency) && (sub.billing_frequency || item.billing_frequency) !== "—" && <span className="text-teal-400">•</span>}
                                            <span>
                                              <strong className="font-semibold text-teal-900">Chargeable period:</strong> {getChargeablePeriodLabel(sub.term ?? item.term, sub.billing_frequency || item.billing_frequency)}
                                            </span>
                                          </>
                                        )}
                                        {(sub.billing_start_date || item.billing_start_date) && (sub.billing_start_date || item.billing_start_date) !== "—" && (
                                          <>
                                            <span className="text-teal-400">•</span>
                                            <span>
                                              <strong className="font-semibold text-teal-900">Start Billing:</strong> {sub.billing_start_date || item.billing_start_date}
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    )}
                                    {subProration.isProrated && subProration.proratedNote && (
                                      <div className="pl-4 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-[10px] text-teal-900 font-medium mt-0.5">
                                        <span>ℹ️ {subProration.proratedNote}</span>
                                      </div>
                                    )}
                                    {sub.service_period && (
                                      <div className="pl-4 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px] text-teal-700 font-medium pt-0.5 leading-snug">
                                        <span className="inline-flex items-center gap-1 shrink-0">
                                          <CalendarIcon className="w-3 h-3 shrink-0" />
                                          <span>Service Period: {sub.service_period}</span>
                                        </span>
                                        {sub.next_billing_date && (
                                          <span className="text-muted-foreground whitespace-nowrap">• Next Billing Date: {sub.next_billing_date}</span>
                                        )}
                                      </div>
                                    )}
                                    {subProration.isProrated && activeFormula && (
                                      <div className="pl-4 text-[10px] text-teal-800 italic font-mono mt-0.5 tracking-tight break-words">
                                        Formula: {activeFormula}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                {showUnitPriceCol && (
                                  <td className="py-2.5 px-2 text-right border-r border-[#d4f1ee] font-mono text-slate-800 align-top text-xs whitespace-nowrap">
                                    ${(Number(sub.unit_price) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                )}
                                {showCurrencyCol && (
                                  <td className="py-2.5 px-1 text-center border-r border-[#d4f1ee] text-slate-700 align-top text-xs whitespace-nowrap">
                                    {sub.currency || item.currency || currency || "USD"}
                                  </td>
                                )}
                                {showQtyCol && (
                                  <td className="py-2.5 px-1 text-center border-r border-[#d4f1ee] font-mono text-slate-800 align-top text-xs whitespace-nowrap">
                                    {sub.quantity !== "" && sub.quantity !== undefined ? sub.quantity : 1}
                                  </td>
                                )}
                                {showDiscountCol && (
                                  <td className="py-2.5 px-1.5 text-center border-r border-[#d4f1ee] font-mono text-slate-700 align-top text-xs whitespace-nowrap">
                                    {sub.unit_discount ? `${sub.unit_discount}${sub.discount_type || "%"}` : "0%"}
                                  </td>
                                )}
                                {showTaxCol && (
                                  <td className="py-2.5 px-1 text-center border-r border-[#d4f1ee] font-mono text-slate-700 align-top text-xs whitespace-nowrap">
                                    {sub.tax_rate !== "" && sub.tax_rate !== undefined && Number(sub.tax_rate) > 0 ? `${sub.tax_rate}%` : "0%"}
                                  </td>
                                )}
                                <td className="py-2.5 px-2.5 text-right font-mono text-slate-900 font-bold align-top text-xs whitespace-nowrap">
                                  {sub.is_reference_only ? (
                                    <span className="text-[10px] text-slate-500 font-normal italic">
                                      Ref: ${(Number(sub.reference_amount ?? sub.charge ?? sub.total ?? 0)).toFixed(2)}
                                    </span>
                                  ) : (
                                    `$${((sub.total !== undefined && sub.total !== "") ? (Number(sub.total) || 0) : subProration.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Next Renewal Projection in interlinkONE PDF */}
              {computedNextRenewal && (
                <div className="mt-3 p-3 rounded-lg border border-teal-200 bg-teal-50/50 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-teal-950 uppercase tracking-wide text-[11px]">
                        Next renewal — not due now
                      </div>
                      <div className="text-slate-600 text-[11px] mt-0.5">
                        {computedNextRenewal.summary_text}
                      </div>
                    </div>
                    <div className="text-right font-mono font-bold text-sm text-teal-950">
                      ${(Number(computedNextRenewal.total_renewal_amount) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {computedNextRenewal.frequency_short || "/ yr"}
                    </div>
                  </div>
                </div>
              )}

              {/* Balance Due & Payment Breakdown (Right Aligned) */}
              <div className="flex justify-end pt-2">
                <div className="space-y-1 text-right">
                  {calculatedTotals.totalPaidAmount > 0 ? (
                    <>
                      <div className="flex justify-end items-center gap-4 text-xs text-slate-600">
                        <span className="font-medium">Total Invoiced:</span>
                        <span className="font-mono">{currency} ${(Number(subTotal) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-end items-center gap-4 text-xs text-emerald-600 font-medium">
                        <span>Amount Paid:</span>
                        <span className="font-mono">-{currency} ${calculatedTotals.totalPaidAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-end items-baseline gap-4 pt-1.5 border-t border-slate-200">
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                          BALANCE DUE
                        </span>
                        <span className="text-2xl font-bold font-sans text-slate-900">
                          {currency} ${calculatedTotals.effectiveBalanceDue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-end items-baseline gap-6">
                      <span className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
                        BALANCE DUE
                      </span>
                      <span className="text-2xl font-bold font-sans text-slate-900">
                        {currency} ${(Number(subTotal) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Remittance / Payment Footer */}
              <div className="pt-4 print:pt-2 text-xs print:text-[11px] text-slate-800 space-y-2 print:space-y-1 leading-relaxed border-t border-transparent">
                {isFieldVisible("notes") && notes && (
                  <p className="text-slate-900 font-medium whitespace-pre-line">{notes}</p>
                )}

                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-900">Bank Info: Payments/Credits</div>
                  {isFieldVisible("from_company") && fromCompany && <div>Company: {fromCompany}</div>}
                  {isFieldVisible("bank_name") && bankName && <div>Bank Name: {bankName}</div>}
                  {isFieldVisible("bank_address") && bankAddress && <div>Bank Address: {bankAddress}</div>}
                  {isFieldVisible("bank_account") && bankAccount && <div>Account #: {bankAccount}</div>}
                  {isFieldVisible("ach_routing") && achRouting && <div>Routing #: {achRouting}</div>}
                  {isFieldVisible("wire_routing") && wireRouting && <div>Wire#: {wireRouting}</div>}
                  {isFieldVisible("from_address") && fromAddress && (
                    <div className="whitespace-pre-line">Business Address: {fromAddress}</div>
                  )}
                  {isFieldVisible("from_email") && fromEmail && <div>{fromEmail}</div>}
                  {isFieldVisible("from_phone") && fromPhone && <div>{fromPhone}</div>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── 3. QUICK EDIT A/R CUSTOMER DIALOG ─────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Dialog open={isQuickEditOpen} onOpenChange={setIsQuickEditOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <UserCheck className="w-5 h-5 text-blue-600" />
              <span>Quick Edit A/R Customer Profile</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update this customer&apos;s contact details and billing address. Saving will immediately refresh the populated invoice data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Company / Display Name <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                value={editCustDisplayName}
                onChange={(e) => setEditCustDisplayName(e.target.value)}
                placeholder="e.g. Acme Corporation"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Contact Person / Attention
              </Label>
              <Input
                type="text"
                value={editCustContact}
                onChange={(e) => setEditCustContact(e.target.value)}
                placeholder="e.g. Jane Smith"
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Phone Number
                </Label>
                <Input
                  type="text"
                  value={editCustPhone}
                  onChange={(e) => setEditCustPhone(e.target.value)}
                  placeholder="e.g. +1 (555) 234-5678"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Email Address
                </Label>
                <Input
                  type="email"
                  value={editCustEmail}
                  onChange={(e) => setEditCustEmail(e.target.value)}
                  placeholder="e.g. billing@acme.com"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Billing Address
              </Label>
              <Textarea
                rows={3}
                value={editCustAddress}
                onChange={(e) => setEditCustAddress(e.target.value)}
                placeholder="e.g. 100 Main Street, Suite 500&#10;San Francisco, CA 94105"
                className="text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsQuickEditOpen(false)}
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => updateCustomerMutation.mutate()}
              disabled={updateCustomerMutation.isPending || !editCustDisplayName.trim()}
              className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
            >
              {updateCustomerMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>Save & Refresh Invoice</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── 3.5 APPLY CHANGES TO TEMPLATE / PRESET SELECTION DIALOG ──────── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Dialog open={isApplyTemplateModalOpen} onOpenChange={setIsApplyTemplateModalOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <Save className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Apply Changes to Template</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Choose whether to update an existing template preset or create a new preset for{" "}
              <strong>{selectedCustomer?.name || billToName || "this customer"}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Mode Segmented Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted/60 rounded-xl border border-border/60">
              <button
                type="button"
                onClick={() => setApplyTemplateMode("existing")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  applyTemplateMode === "existing"
                    ? "bg-background text-foreground shadow-xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                <Bookmark className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Update Existing Preset</span>
              </button>
              <button
                type="button"
                onClick={() => setApplyTemplateMode("new")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  applyTemplateMode === "new"
                    ? "bg-background text-foreground shadow-xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Create New Preset</span>
              </button>
            </div>

            {applyTemplateMode === "existing" ? (
              <div className="space-y-3.5">
                {sortedCustomerTemplates.length === 0 ? (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs space-y-2">
                    <p className="font-semibold">No existing saved presets found for this customer.</p>
                    <p className="text-[11px] opacity-90">
                      You can create a new preset to store these line items, notes, terms, and chosen layout styling for future invoices.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setApplyTemplateMode("new")}
                      className="text-xs h-7 gap-1 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 mt-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Switch to Create New Preset</span>
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">
                        Select Existing Preset to Overwrite <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={targetTemplateIdToOverwrite || sortedCustomerTemplates[0]?.id || ""}
                        onValueChange={(val) => {
                          setTargetTemplateIdToOverwrite(val);
                          const found = sortedCustomerTemplates.find((t) => t.id === val);
                          if (found) {
                            setApplySetAsDefault(!!found.is_default);
                          }
                        }}
                      >
                        <SelectTrigger className="h-9 text-xs bg-background">
                          <SelectValue placeholder="Choose preset to overwrite" />
                        </SelectTrigger>
                        <SelectContent>
                          {sortedCustomerTemplates.map((t) => (
                            <SelectItem key={t.id || 'default'} value={t.id || 'default'} className="text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{t.template_name || "Standard Template"}</span>
                                {t.layout_style && (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 uppercase">
                                    {t.layout_style === 'interlinkone' ? 'interlinkONE' : 'Pace+'}
                                  </Badge>
                                )}
                                {t.is_default && (
                                  <Badge variant="secondary" className="text-[9px] px-1 py-0 font-normal">
                                    Default
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Summary Info */}
                    <div className="p-3 bg-muted/40 rounded-xl border border-border/60 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Active Layout Style:</span>
                        <span className="font-semibold text-foreground">
                          {layoutStyle === "interlinkone" ? "interlinkONE (Theme 2)" : "Pace+ (Theme 1)"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Line Items in Preset:</span>
                        <span className="font-semibold text-foreground">{lineItems.length} item(s)</span>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Currency & Subtotal:</span>
                        <span className="font-semibold text-foreground">
                          {currency} ${calculatedTotals.newChargesSubtotal.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="apply-template-is-default-existing"
                        checked={applySetAsDefault}
                        onChange={(e) => setApplySetAsDefault(e.target.checked)}
                        className="rounded border-input text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                      />
                      <Label htmlFor="apply-template-is-default-existing" className="text-xs text-foreground cursor-pointer">
                        Set as default template preset for this customer
                      </Label>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    New Preset Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={applyNewPresetName}
                    onChange={(e) => setApplyNewPresetName(e.target.value)}
                    placeholder="e.g. Monthly Retainer, Hardware Delivery, Software Support..."
                    className="text-xs h-9"
                    autoFocus
                  />
                </div>

                {/* Summary Info */}
                <div className="p-3 bg-muted/40 rounded-xl border border-border/60 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Active Layout Style:</span>
                    <span className="font-semibold text-foreground">
                      {layoutStyle === "interlinkone" ? "interlinkONE (Theme 2)" : "Pace+ (Theme 1)"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Line Items to Save:</span>
                    <span className="font-semibold text-foreground">{lineItems.length} item(s)</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Currency & Subtotal:</span>
                    <span className="font-semibold text-foreground">
                      {currency} ${calculatedTotals.newChargesSubtotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="apply-template-is-default-new"
                    checked={applySetAsDefault}
                    onChange={(e) => setApplySetAsDefault(e.target.checked)}
                    className="rounded border-input text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                  />
                  <Label htmlFor="apply-template-is-default-new" className="text-xs text-foreground cursor-pointer">
                    Set as default template preset for this customer
                  </Label>
                </div>
              </div>
            )}

            {currentInvoiceId && (
              <div className="text-[11px] text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-2.5 flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>
                  Applying changes will also update the saved snapshot for invoice <strong>{invoiceNumber || "snapshot"}</strong>.
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsApplyTemplateModalOpen(false)}
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                saveTemplateMutation.mutate({
                  mode: applyTemplateMode,
                  templateId: targetTemplateIdToOverwrite,
                  newPresetName: applyNewPresetName,
                  isDefault: applySetAsDefault,
                });
              }}
              disabled={
                saveTemplateMutation.isPending ||
                (applyTemplateMode === "new" && !applyNewPresetName.trim()) ||
                (applyTemplateMode === "existing" && sortedCustomerTemplates.length === 0)
              }
              className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
            >
              {saveTemplateMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>
                {applyTemplateMode === "new" ? "Save as New Preset" : "Apply & Overwrite Preset"}
              </span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── 4. SAVE AS NEW TEMPLATE PRESET DIALOG ───────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Dialog open={isSavePresetDialogOpen} onOpenChange={setIsSavePresetDialogOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <Bookmark className="w-5 h-5 text-indigo-600" />
              <span>Save as New Template Preset</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Save the current line items, notes, terms, and chosen layout theme as a reusable preset for {selectedCustomer?.name || "this customer"}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Preset Name <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="e.g. Monthly Retainer, Hardware Delivery, etc."
                className="text-xs"
                autoFocus
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="preset-is-default"
                checked={newPresetIsDefault}
                onChange={(e) => setNewPresetIsDefault(e.target.checked)}
                className="rounded border-input text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
              />
              <Label htmlFor="preset-is-default" className="text-xs text-foreground cursor-pointer">
                Set as default template for this customer
              </Label>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsSavePresetDialogOpen(false);
                setNewPresetName("");
              }}
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => saveNewPresetMutation.mutate()}
              disabled={saveNewPresetMutation.isPending || !newPresetName.trim()}
              className="text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer"
            >
              {saveNewPresetMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <BookmarkCheck className="w-3.5 h-3.5" />
              )}
              <span>Save Preset</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── 5. RENAME TEMPLATE PRESET DIALOG ───────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Dialog open={isRenamePresetDialogOpen} onOpenChange={setIsRenamePresetDialogOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <Pencil className="w-5 h-5 text-blue-600" />
              <span>Rename Template Preset</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update the name of preset &quot;{templateName}&quot; for {selectedCustomer?.name || "this customer"}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Preset Name <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                value={renamePresetValue}
                onChange={(e) => setRenamePresetValue(e.target.value)}
                placeholder="e.g. Standard Retainer, Project Billing..."
                className="text-xs"
                autoFocus
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsRenamePresetDialogOpen(false)}
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                if (selectedTemplateId && renamePresetValue.trim()) {
                  renamePresetMutation.mutate({
                    templateId: selectedTemplateId,
                    newName: renamePresetValue.trim(),
                  });
                }
              }}
              disabled={renamePresetMutation.isPending || !renamePresetValue.trim()}
              className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
            >
              {renamePresetMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>Save Name</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Send Invoice Statement Email Modal ── */}
      <Dialog open={isSendEmailDialogOpen} onOpenChange={setIsSendEmailDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-600" />
              <span>Send Invoice Statement via SendGrid</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Send this invoice statement directly to your customer using a configured role-based email address.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Sender Role-Based Email <span className="text-red-500">*</span></span>
                <span className="text-[10px] text-muted-foreground font-normal">Role Mailer Address</span>
              </Label>
              <Input
                type="email"
                value={emailSender}
                onChange={(e) => setEmailSender(e.target.value)}
                placeholder="test-invoices@zenatech.com"
                className="text-xs font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                Default: <code className="bg-muted px-1 py-0.5 rounded text-foreground">test-invoices@zenatech.com</code>
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Recipient Email (To) <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
                placeholder="customer-billing@client.com"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Subject Line
              </Label>
              <Input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Invoice Statement from ZenaTech Inc."
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Optional Message / Notes
              </Label>
              <Textarea
                rows={3}
                value={emailCustomMessage}
                onChange={(e) => setEmailCustomMessage(e.target.value)}
                placeholder="Add a custom note or payment instructions to include in the email body..."
                className="text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsSendEmailDialogOpen(false)}
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => sendEmailMutation.mutate()}
              disabled={sendEmailMutation.isPending || !emailRecipient.trim() || !emailSender.trim()}
              className="text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer"
            >
              {sendEmailMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Send Email</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* ── Record Payment Modal ── */}
      <Dialog open={isRecordPaymentOpen} onOpenChange={setIsRecordPaymentOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Record Payment for {invoiceNumber}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Record an incoming customer payment. The balance due, workflow status, and immutable audit logs will update immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Payment Amount ({currency}) <span className="text-red-500">*</span></span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Due: ${calculatedTotals.effectiveBalanceDue.toFixed(2)}
                  </span>
                </Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    $
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={paymentAmountInput}
                    onChange={(e) => setPaymentAmountInput(e.target.value)}
                    placeholder="0.00"
                    className="text-xs font-mono pl-6 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Payment Method <span className="text-red-500">*</span>
                </Label>
                <Select value={paymentMethodInput} onValueChange={setPaymentMethodInput}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue placeholder="Select Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WIRE" className="text-xs font-medium">Bank Wire Transfer</SelectItem>
                    <SelectItem value="ACH" className="text-xs font-medium">ACH / Direct Debit</SelectItem>
                    <SelectItem value="CHECK" className="text-xs font-medium">Paper Check</SelectItem>
                    <SelectItem value="CARD" className="text-xs font-medium">Credit / Debit Card</SelectItem>
                    <SelectItem value="OTHER" className="text-xs font-medium">Other / Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Payment Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={paymentDateInput}
                  onChange={(e) => setPaymentDateInput(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Reference / Check #
                </Label>
                <Input
                  type="text"
                  value={paymentRefInput}
                  onChange={(e) => setPaymentRefInput(e.target.value)}
                  placeholder="e.g. WIRE-884920 or CHK #4021"
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Category (GL Code / Account)
              </Label>
              <GLCodeAutocomplete
                value={paymentGLCodeInput}
                onChange={setPaymentGLCodeInput}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Class / Cost Center
              </Label>
              <ClassAutocomplete
                value={paymentClassInput}
                onChange={setPaymentClassInput}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Internal Settlement Notes
              </Label>
              <Textarea
                rows={2}
                value={paymentNotesInput}
                onChange={(e) => setPaymentNotesInput(e.target.value)}
                placeholder="Add optional notes, receipt breakdown, bank memo..."
                className="text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsRecordPaymentOpen(false)}
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmRecordPayment}
              disabled={isPaymentSubmitting || !paymentAmountInput || Number(paymentAmountInput) <= 0}
              className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
            >
              {isPaymentSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>Record Payment</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 5. MANUAL OVERRIDE MODAL ─────────────────────────────────── */}
      <OverridePriceModal
        isOpen={isOverrideModalOpen}
        onClose={() => {
          setIsOverrideModalOpen(false);
          setSelectedOverrideAddon(null);
        }}
        addon={selectedOverrideAddon}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["ar-invoices"] });
        }}
      />
    </div>
  );
}
