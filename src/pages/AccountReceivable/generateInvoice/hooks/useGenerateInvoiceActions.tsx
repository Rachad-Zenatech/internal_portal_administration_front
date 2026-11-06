import { useState, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, addDays } from "date-fns";
import { Eye, EyeOff } from "lucide-react";
import { Label } from "../../../../components/ui/label";
import { arInvoiceService } from "../../../../services/arInvoiceService";
import type { ARCustomer, AddonHierarchyChildRow, InvoicePaymentRecord } from "../../../../services/arInvoiceService";
import type { ARCustomerOption } from "../../fields/ARCustomerAutocomplete";
import { useNotificationStream } from "@/hooks/useNotifications";
import type { LineItemFormRow, InvoiceLayoutStyle } from "../types";

export function useGenerateInvoiceActions() {
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
      hubspot_id: custOption.hubspot_id || undefined,
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
    if (custOption.currency) setCurrency(custOption.currency);

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
  return { navigate, location, queryClient, searchParams, pdfPreviewRef, formTopRef, customerSearch, setCustomerSearch, selectedCustomer, setSelectedCustomer, currentInvoiceId, setCurrentInvoiceId, selectedOverrideAddon, setSelectedOverrideAddon, isOverrideModalOpen, setIsOverrideModalOpen, nextInvoiceEligibility, isNextInvoiceEligibilityLoading, generateRenewalQuoteMutation, selectedTemplateId, setSelectedTemplateId, templateName, setTemplateName, layoutStyle, setLayoutStyle, isApplyTemplateModalOpen, setIsApplyTemplateModalOpen, applyTemplateMode, setApplyTemplateMode, targetTemplateIdToOverwrite, setTargetTemplateIdToOverwrite, applyNewPresetName, setApplyNewPresetName, applySetAsDefault, setApplySetAsDefault, isSavePresetDialogOpen, setIsSavePresetDialogOpen, newPresetName, setNewPresetName, newPresetIsDefault, setNewPresetIsDefault, isRenamePresetDialogOpen, setIsRenamePresetDialogOpen, renamePresetValue, setRenamePresetValue, isFieldVisible, renderFieldHeader, isTemplateLoading, setIsTemplateLoading, templateLoadedToast, setTemplateLoadedToast, saveSuccessMsg, setSaveSuccessMsg, lastPreviewedAt, setLastPreviewedAt, isSendEmailDialogOpen, setIsSendEmailDialogOpen, emailSender, setEmailSender, emailRecipient, setEmailRecipient, emailSubject, setEmailSubject, emailCustomMessage, setEmailCustomMessage, isQuickEditOpen, setIsQuickEditOpen, editCustDisplayName, setEditCustDisplayName, editCustContact, setEditCustContact, editCustPhone, setEditCustPhone, editCustEmail, setEditCustEmail, editCustAddress, setEditCustAddress, invoiceStatus, setInvoiceStatus, invoiceAmountPaid, setInvoiceAmountPaid, invoicePayments, setInvoicePayments, isRecordPaymentOpen, setIsRecordPaymentOpen, paymentAmountInput, setPaymentAmountInput, paymentMethodInput, setPaymentMethodInput, paymentDateInput, setPaymentDateInput, paymentRefInput, setPaymentRefInput, paymentGLCodeInput, setPaymentGLCodeInput, paymentClassInput, setPaymentClassInput, paymentNotesInput, setPaymentNotesInput, isPaymentSubmitting, setIsPaymentSubmitting, invoiceNumber, setInvoiceNumber, currency, setCurrency, invoiceDate, setInvoiceDate, isDatePopoverOpen, setIsDatePopoverOpen, dueDate, setDueDate, isDueDatePopoverOpen, setIsDueDatePopoverOpen, terms, setTerms, poNumber, setPoNumber, fromCompany, setFromCompany, fromContact, setFromContact, fromPhone, setFromPhone, fromAddress, setFromAddress, fromEmail, setFromEmail, billToName, setBillToName, billToPhone, setBillToPhone, billToAddress, setBillToAddress, billToEmail, setBillToEmail, lineItems, setLineItems, notes, setNotes, bankName, setBankName, bankAccount, setBankAccount, bankAddress, setBankAddress, achRouting, setAchRouting, wireRouting, setWireRouting, bankEmail, setBankEmail, customers, refetchCustomerTemplates, sortedCustomerTemplates, handleSelectPreset, handleSelectCustomerOption };
}
