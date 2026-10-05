import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parse, isValid, addDays } from "date-fns";
import {
  ArrowLeft,
  ArrowUp,
  Bookmark,
  BookmarkCheck,
  Building2,
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  CreditCard,
  Edit3,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  Loader2,
  Mail,
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
  arInvoiceService,
} from "../../services/arInvoiceService";
import type {
  ARCustomer,
  CustomerInvoiceTemplate,
} from "../../services/arInvoiceService";
import { ARCustomerAutocomplete } from "./ARCustomerAutocomplete";
import type { ARCustomerOption } from "./ARCustomerAutocomplete";
import { CurrencyAutocomplete } from "../Purchasing/CurrencyAutocomplete";

export interface LineItemFormRow {
  id?: string;
  date?: string;
  activity?: string;
  description: string;
  quantity: string | number;
  unit_price: string | number;
  total: number;
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

  // Template Preset & Layout Styling State (Default to Pace+)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState<string>("Standard Template");
  const [layoutStyle, setLayoutStyle] = useState<InvoiceLayoutStyle>("pace_plus");
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
        <Label className={`text-xs font-medium transition-colors ${visible ? "text-foreground" : "text-muted-foreground line-through opacity-70"}`}>
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
  const [terms, setTerms] = useState("Due on receipt");
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

  const initialUrlProcessedRef = useRef(false);

  // Initial load from URL query params (either specific invoiceId or customerId)
  useEffect(() => {
    if (initialUrlProcessedRef.current) return;
    const invId = searchParams.get("invoiceId");
    const custId = searchParams.get("customerId");

    if (invId) {
      initialUrlProcessedRef.current = true;
      setCurrentInvoiceId(invId);
      setIsTemplateLoading(true);
      arInvoiceService.getInvoice(invId)
        .then((inv) => {
          if (inv) {
            if (inv.invoice_number) setInvoiceNumber(inv.invoice_number);
            if (inv.currency) setCurrency(inv.currency);
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
              setLineItems(
                inv.line_items.map((li) => ({
                  id: li.id,
                  date: li.date || "",
                  activity: li.activity || "",
                  description: li.description || "",
                  quantity: li.quantity ?? 1,
                  unit_price: li.unit_price ?? "",
                  total: (Number(li.quantity) || 0) * (Number(li.unit_price) || 0),
                }))
              );
            }

            if (inv.customer_id && customers.length > 0) {
              const matched = customers.find((c) => c.id === inv.customer_id || c.id === `CUST-${inv.customer_id}`);
              if (matched) {
                setSelectedCustomer(matched);
                setCustomerSearch(matched.name);
              } else if (inv.customer_name) {
                setCustomerSearch(inv.customer_name);
              }
            } else if (inv.customer_name) {
              setCustomerSearch(inv.customer_name);
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
    } else if (custId && customers.length > 0) {
      initialUrlProcessedRef.current = true;
      setCurrentInvoiceId(null);
      const match = customers.find((c) => c.id === custId);
      if (match) {
        handleSelectCustomer(match);
      }
    }

    // Auto-fetch next available invoice number for new invoices
    if (!invId) {
      arInvoiceService.getNextInvoiceNumber().then((res) => {
        if (res?.next_invoice_number) {
          setInvoiceNumber(res.next_invoice_number);
        }
      });
    }
  }, [searchParams, customers]);

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

  // Date Parsing Helpers
  const parseFlexibleDate = (dStr: string): Date => {
    try {
      const p1 = parse(dStr, "MM/dd/yyyy", new Date());
      if (isValid(p1)) return p1;
      const p2 = parse(dStr, "d MMMM yyyy", new Date());
      if (isValid(p2)) return p2;
      const p3 = new Date(dStr);
      if (isValid(p3)) return p3;
    } catch {
      // ignore
    }
    return new Date();
  };

  const getSelectedCalendarDate = (): Date => parseFlexibleDate(invoiceDate);
  const getSelectedDueDate = (): Date => parseFlexibleDate(dueDate);

  // Calculations
  const calculateSubTotal = () => {
    return lineItems.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
  };

  const handleUpdateLine = (
    index: number,
    field: keyof LineItemFormRow,
    val: any
  ) => {
    setLineItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[index], [field]: val };
      
      const rawQty = item.quantity === "" ? 0 : parseFloat(String(item.quantity));
      const rawPrice = item.unit_price === "" ? 0 : parseFloat(String(item.unit_price));
      const qty = isNaN(rawQty) ? 0 : rawQty;
      const price = isNaN(rawPrice) ? 0 : rawPrice;
      
      item.total = Math.round(qty * price * 100) / 100;
      copy[index] = item;
      return copy;
    });
  };

  const handleAddLine = () => {
    setLineItems((prev) => [
      ...prev,
      { date: "", activity: "", description: "", quantity: 1, unit_price: "", total: 0 },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== index));
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
        date: "",
        activity: "Monthly Subscription Pace+",
        description: "Monthly Subscription Pace+\nCoverage Period: October 2026",
        quantity: 1,
        unit_price: 1050.00,
        total: 1050.00,
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

  // Build current template payload with sanitized numbers
  const currentPayload: CustomerInvoiceTemplate & { id?: string } = {
    id: currentInvoiceId || undefined,
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
    line_items: lineItems.map((li) => ({
      id: li.id,
      date: li.date,
      activity: li.activity,
      description: li.description,
      quantity: li.quantity === "" ? 0 : (parseFloat(String(li.quantity)) || 0),
      unit_price: li.unit_price === "" ? 0 : (parseFloat(String(li.unit_price)) || 0),
      total: Number(li.total) || 0,
    })),
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

  // Apply to Customer Template Mutation (Saves current changes to active Preset; only updates invoice snapshot when editing an existing invoice)
  const saveTemplateMutation = useMutation({
    mutationFn: async () => {
      const custId = selectedCustomer?.id || "CUST-CUSTOM";
      const tmplRes = await arInvoiceService.saveCustomerTemplate(
        custId,
        currentPayload
      );
      let invRes: any = null;
      if (currentInvoiceId) {
        invRes = await arInvoiceService.generateInvoice(currentPayload);
      }
      return { tmpl: tmplRes, inv: invRes };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ar-customers"] });
      if (currentInvoiceId) {
        queryClient.invalidateQueries({ queryKey: ["ar-invoices"] });
      }
      refetchCustomerTemplates();
      if (currentInvoiceId && data.inv) {
        setSaveSuccessMsg(`Applied changes to template preset "${templateName}" and updated invoice ${data.inv.invoice_number}!`);
      } else {
        setSaveSuccessMsg(`Saved changes to template preset "${templateName}" successfully!`);
      }
      setTimeout(() => setSaveSuccessMsg(null), 4000);
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
      setSaveSuccessMsg(`Invoice ${data.invoice_number} saved successfully without modifying template!`);
      setTimeout(() => {
        navigate("/account-receivable");
      }, 1200);
    },
  });

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

  const subTotal = calculateSubTotal();

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-zinc-950 p-4 sm:p-8 space-y-8 max-w-6xl mx-auto print:min-h-0 print:p-0 print:m-0 print:max-w-none print:space-y-0 print:bg-white print:w-full">
      {/* ── Top Header Actions (Clean Single-Line Toolbar) ── */}
      <div
        ref={formTopRef}
        className="bg-card border border-border/80 px-4 py-3 rounded-2xl shadow-xs flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 print:hidden"
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
              <span>Editing {invoiceNumber}</span>
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
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviewAndScroll}
            className="text-xs gap-1.5 h-8 px-3 bg-card hover:bg-muted text-foreground cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Preview PDF</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="text-xs gap-1.5 h-8 px-3 bg-card hover:bg-muted text-foreground cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => saveTemplateMutation.mutate()}
            disabled={saveTemplateMutation.isPending || (!selectedCustomer && !billToName)}
            title="Save changes to template and update invoice"
            className="text-xs gap-1.5 h-8 px-3 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer"
          >
            {saveTemplateMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{currentInvoiceId ? "Apply Changes to Template" : "Save Changes"}</span>
          </Button>

          <Button
            size="sm"
            onClick={() => generateInvoiceMutation.mutate()}
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

          {currentInvoiceId && (
            <Button
              size="sm"
              onClick={handleOpenSendEmail}
              className="text-xs gap-1.5 h-8 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs cursor-pointer"
              title="Send invoice statement to client via SendGrid"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Send Email</span>
            </Button>
          )}
        </div>
      </div>

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
                    <span className="text-xs font-bold text-foreground block">Template Preset</span>
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

              {/* Right: 2 Invoice Template Options (Pace+ and interlinkONE) */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 mr-1">
                  <Palette className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground">Invoice Template:</span>
                </div>

                <div className="inline-flex rounded-xl bg-muted p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setLayoutStyle("pace_plus");
                      setFromCompany("Pace Plus Inc.");
                      setFromPhone("(312) 614-1288 | ext 1098");
                      setFromEmail("Accounting@paceplus.com");
                      setFromAddress("602B W 5th Ave\nNaperville, IL 60563 USA");
                      setBankName("Bank of America");
                      setBankAccount("2910 2819 7458");
                      setAchRouting("026009593");
                      setWireRouting("026009593");
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-2 ${
                      layoutStyle === "pace_plus" || layoutStyle === "modern"
                        ? "bg-card text-blue-900 dark:text-blue-200 shadow-xs font-bold border border-blue-200/60 dark:border-blue-800/60"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1B365D] inline-block shadow-2xs" />
                    <span>Pace+</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLayoutStyle("interlinkone");
                      setFromCompany("interlinkONE");
                      setFromPhone("(312) 614-1288 | ext 1098");
                      setFromEmail("Accounting@paceplus.com");
                      setFromAddress("602B W 5th Ave\nNaperville, IL 60563 USA");
                      setBankName("Bank of America");
                      setBankAddress("896 N Route 59, Aurora, IL 60504");
                      setBankAccount("2910 3381 9572");
                      setAchRouting("081904808");
                      setWireRouting("026009593");
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-2 ${
                      layoutStyle === "interlinkone"
                        ? "bg-card text-teal-800 dark:text-teal-200 shadow-xs font-bold border border-teal-200/60 dark:border-teal-800/60"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#008b94] inline-block shadow-2xs" />
                    <span>interlinkONE</span>
                  </button>
                </div>
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
              <Input
                type="text"
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="e.g. Due on receipt / Net 30"
                className={`text-xs ${!isFieldVisible("terms") ? "opacity-60 bg-muted/40" : ""}`}
              />
            </div>

            {/* P/O Number */}
            <div className="space-y-1.5">
              {renderFieldHeader("P/O Number", "po_number")}
              <Input
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
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Invoice Line Items
                </h4>
                <p className="text-xs text-muted-foreground">
                  Specify activity, detailed description, quantity, unit rates, and currency.
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

            <div className="border border-border rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-muted/80 text-muted-foreground font-semibold uppercase tracking-wider text-[11px] border-b border-border">
                    <th className="py-2.5 px-3 w-[14%]">Date</th>
                    <th className="py-2.5 px-3 w-[22%]">Activity</th>
                    <th className="py-2.5 px-3 w-[30%]">Description</th>
                    <th className="py-2.5 px-2 text-center w-[8%]">Qty</th>
                    <th className="py-2.5 px-3 text-center w-[11%]">
                      Rate ({currency})
                    </th>
                    <th className="py-2.5 px-3 text-right w-[11%]">
                      Amount ({currency})
                    </th>
                    <th className="py-2.5 px-2 text-center w-[4%]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {lineItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                      {/* Line Item Date Picker (Defaults to null/empty) */}
                      <td className="py-2 px-3 align-top">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full h-8 justify-start text-left font-normal text-xs px-2 bg-card hover:bg-muted border-input cursor-pointer"
                            >
                              <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground shrink-0" />
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

                      <td className="py-2 px-3 align-top">
                        <Input
                          type="text"
                          value={item.activity || ""}
                          onChange={(e) =>
                            handleUpdateLine(idx, "activity", e.target.value)
                          }
                          placeholder="e.g. Monthly Subscription Pace+ / Monthly Hosting"
                          className="text-xs h-8 font-medium"
                        />
                      </td>
                      <td className="py-2 px-3 align-top">
                        <Textarea
                          rows={2}
                          value={item.description}
                          onChange={(e) =>
                            handleUpdateLine(idx, "description", e.target.value)
                          }
                          placeholder="e.g. Monthly Subscription Pace+ Coverage Period: October 2026"
                          className="text-xs resize-none min-h-[32px] py-1.5"
                        />
                      </td>
                      <td className="py-2 px-2 text-center align-top">
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={item.quantity ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "" || /^[0-9]*\.?[0-9]*$/.test(val)) {
                              handleUpdateLine(idx, "quantity", val);
                            }
                          }}
                          placeholder="1"
                          className="text-xs font-mono text-center h-8 px-1"
                        />
                      </td>
                      <td className="py-2 px-3 text-center align-top">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-mono">
                            $
                          </span>
                          <Input
                            type="text"
                            value={item.unit_price ?? ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "" || /^-?[0-9]*\.?[0-9]*$/.test(val)) {
                                handleUpdateLine(idx, "unit_price", val);
                              }
                            }}
                            placeholder="0.00"
                            className="text-xs font-mono text-right pl-5 h-8 px-2"
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-xs font-bold text-foreground align-top pt-3.5">
                        ${(Number(item.total) || 0).toFixed(2)}
                      </td>
                      <td className="py-2 px-2 text-center align-top pt-2.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveLine(idx)}
                          disabled={lineItems.length <= 1}
                          className="h-7 w-7 text-muted-foreground hover:text-red-600 disabled:opacity-30 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Subtotal Summary Banner displaying Selected Currency */}
            <div className="flex justify-end pt-1">
              <div className="flex items-center gap-4 bg-muted/60 px-5 py-2.5 rounded-xl border border-border">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Calculated Balance Due ({currency}):
                </span>
                <span className="font-mono text-base font-black text-foreground">
                  {currency} ${(Number(subTotal) || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Notes & Remittance / Payment Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Notes */}
            <div className="space-y-2">
              {renderFieldHeader("Invoice Notes / Greeting", "notes")}
              <Textarea
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
                variant="outline"
                size="sm"
                onClick={() => saveTemplateMutation.mutate()}
                disabled={saveTemplateMutation.isPending}
                className="text-xs gap-1.5 cursor-pointer"
              >
                {saveTemplateMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Save as Template</span>
              </Button>

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

            <Button
              size="sm"
              onClick={() => generateInvoiceMutation.mutate()}
              disabled={generateInvoiceMutation.isPending}
              className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-semibold cursor-pointer"
            >
              {generateInvoiceMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>Generate & Save Invoice</span>
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
            <div className="p-8 sm:p-12 space-y-7 bg-white text-slate-900">
              {/* Header: Logo (Left), Address (Middle), Invoice Title (Right) */}
              <div className="grid grid-cols-12 gap-4 items-start pb-2">
                {/* Logo PACE+ (Original image from attachments) */}
                <div className="col-span-12 sm:col-span-4 flex items-center">
                  <img
                    src="/pace_plus_logo.png"
                    alt="PACE+"
                    className="h-10 sm:h-12 w-auto object-contain select-none"
                  />
                </div>

                {/* Company Address (Middle) */}
                <div className="col-span-12 sm:col-span-5 text-xs text-slate-800 leading-relaxed pt-1 whitespace-pre-line">
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
                        {currency} ${(Number(subTotal) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

              {/* Line Items Table (6 Columns: DATE, ACTIVITY, DESCRIPTION, QTY, RATE, AMOUNT) */}
              <div className="overflow-hidden border border-[#dce6f1] rounded-xs">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr
                      className="text-[11px] font-bold uppercase tracking-wider text-slate-800 border-b border-[#cbd5e1]"
                      style={{ backgroundColor: "#dce6f1" }}
                    >
                      <th className="py-1.5 px-3 border-r border-[#cbd5e1] w-[14%]">DATE</th>
                      <th className="py-1.5 px-3 border-r border-[#cbd5e1] w-[22%]">ACTIVITY</th>
                      <th className="py-1.5 px-3 border-r border-[#cbd5e1] w-[32%]">DESCRIPTION</th>
                      <th className="py-1.5 px-3 text-center border-r border-[#cbd5e1] w-[8%]">QTY</th>
                      <th className="py-1.5 px-3 text-right border-r border-[#cbd5e1] w-[12%]">RATE</th>
                      <th className="py-1.5 px-3 text-right w-[12%]">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dce6f1]">
                    {lineItems.map((item, idx) => (
                      <tr key={idx} className="bg-white hover:bg-slate-50/30">
                        <td className="py-2.5 px-3 border-r border-[#dce6f1] text-slate-700 align-top">
                          {item.date || ""}
                        </td>
                        <td className="py-2.5 px-3 border-r border-[#dce6f1] font-bold text-slate-900 align-top">
                          {item.activity || ""}
                        </td>
                        <td className="py-2.5 px-3 border-r border-[#dce6f1] text-slate-800 whitespace-pre-line align-top leading-relaxed">
                          {item.description || "—"}
                        </td>
                        <td className="py-2.5 px-3 text-center border-r border-[#dce6f1] font-mono text-slate-800 align-top">
                          {item.quantity !== "" && item.quantity !== undefined ? item.quantity : 1}
                        </td>
                        <td className="py-2.5 px-3 text-right border-r border-[#dce6f1] font-mono text-slate-800 align-top">
                          {(Number(item.unit_price) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-900 font-semibold align-top">
                          {(Number(item.total) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Balance Due (Right Aligned) */}
              <div className="flex justify-end items-baseline gap-6 pt-1">
                <span className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
                  BALANCE DUE
                </span>
                <span className="text-2xl font-bold font-sans text-slate-900">
                  {currency} ${(Number(subTotal) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Remittance / Payment Footer */}
              <div className="pt-12 text-xs text-slate-800 space-y-3 leading-relaxed border-t border-transparent">
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
            <div className="p-8 sm:p-12 space-y-7 bg-white text-slate-900">
              {/* Header: Logo (Left with HIPAA badge), Address (Middle), Invoice Title (Right) */}
              <div className="grid grid-cols-12 gap-4 items-start pb-2">
                {/* Logo interlinkONE (Original image from attachments) */}
                <div className="col-span-12 sm:col-span-5 flex items-center">
                  <img
                    src="/interlinkone_logo.png"
                    alt="interlinkONE"
                    className="h-10 sm:h-12 w-auto object-contain select-none"
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
                        {currency} ${(Number(subTotal) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

              {/* Line Items Table (6 Columns: DATE, ACTIVITY, DESCRIPTION, QTY, RATE, AMOUNT) */}
              <div className="overflow-hidden border border-[#d4f1ee] rounded-xs">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr
                      className="text-[11px] font-bold uppercase tracking-wider text-slate-800 border-b border-[#b2e8e2]"
                      style={{ backgroundColor: "#d4f1ee" }}
                    >
                      <th className="py-1.5 px-3 border-r border-[#b2e8e2] w-[14%]">DATE</th>
                      <th className="py-1.5 px-3 border-r border-[#b2e8e2] w-[22%]">ACTIVITY</th>
                      <th className="py-1.5 px-3 border-r border-[#b2e8e2] w-[32%]">DESCRIPTION</th>
                      <th className="py-1.5 px-3 text-center border-r border-[#b2e8e2] w-[8%]">QTY</th>
                      <th className="py-1.5 px-3 text-right border-r border-[#b2e8e2] w-[12%]">RATE</th>
                      <th className="py-1.5 px-3 text-right w-[12%]">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d4f1ee]">
                    {lineItems.map((item, idx) => (
                      <tr key={idx} className="bg-white hover:bg-teal-50/20">
                        <td className="py-2.5 px-3 border-r border-[#d4f1ee] text-slate-700 align-top">
                          {item.date || ""}
                        </td>
                        <td className="py-2.5 px-3 border-r border-[#d4f1ee] font-bold text-slate-900 align-top">
                          {item.activity || ""}
                        </td>
                        <td className="py-2.5 px-3 border-r border-[#d4f1ee] text-slate-800 whitespace-pre-line align-top leading-relaxed">
                          {item.description || "—"}
                        </td>
                        <td className="py-2.5 px-3 text-center border-r border-[#d4f1ee] font-mono text-slate-800 align-top">
                          {item.quantity !== "" && item.quantity !== undefined ? item.quantity : 1}
                        </td>
                        <td className="py-2.5 px-3 text-right border-r border-[#d4f1ee] font-mono text-slate-800 align-top">
                          {(Number(item.unit_price) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-900 font-semibold align-top">
                          {(Number(item.total) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Balance Due (Right Aligned) */}
              <div className="flex justify-end items-baseline gap-6 pt-1">
                <span className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
                  BALANCE DUE
                </span>
                <span className="text-2xl font-bold font-sans text-slate-900">
                  {currency} ${(Number(subTotal) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Remittance / Payment Footer */}
              <div className="pt-12 text-xs text-slate-800 space-y-3 leading-relaxed border-t border-transparent">
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
    </div>
  );
}
