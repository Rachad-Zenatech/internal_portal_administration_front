import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  Info,
  Loader2,
  Plus,
  Printer,
  Save,
  Send,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import { Calendar } from "../../components/ui/calendar";
import {
  arInvoiceService,
  type ARCustomer,
} from "../../services/arInvoiceService";
import { financeService } from "../../services/financeService";
import { arQuoteService } from "../../services/arQuoteService";
import type {
  ARQuote,
  PublicationState,
} from "../../services/arQuoteService";
import { useAuth } from "../../lib/AuthContext";
import { ARCustomerAutocomplete } from "./ARCustomerAutocomplete";
import type { ARCustomerOption } from "./ARCustomerAutocomplete";
import { UserAutocomplete } from "./UserAutocomplete";
import { SendQuoteModal } from "./SendQuoteModal";
import { calculateRowPricing, parseDateOnly, formatDateOnly } from "./lineItemPricingUtils";
import { CurrencyAutocomplete } from "../Purchasing/CurrencyAutocomplete";

export interface QuoteLineItem {
  name: string;
  description: string;
  currency?: string;
  price: number | string;
  quantity: number | string;
  unit_discount: number | string;
  discount_type: "%" | "$";
  billing_frequency: string;
  term: number | string;
  billing_start_date?: string;
  tax_rate: number | string;
  subtotal: number;
  calculation?: string;
}

export const createEmptyQuoteLineItem = (): QuoteLineItem => ({
  name: "",
  description: "",
  currency: "USD",
  price: "",
  quantity: 1,
  unit_discount: "",
  discount_type: "%",
  billing_frequency: "",
  term: 1,
  tax_rate: "",
  subtotal: 0,
  calculation: "",
});

export default function GenerateQuotePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const { user: currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formTopRef = useRef<HTMLDivElement>(null);

  const [quoteId, setQuoteId] = useState<string | null>(searchParams.get("id"));
  const [customerId, setCustomerId] = useState<string>("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [, setSelectedCustomer] = useState<ARCustomer | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);

  // Logo State
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Publication State
  const [publicationState, setPublicationState] = useState<PublicationState>("DRAFT");
  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const [customerResponseState, setCustomerResponseState] = useState<string>("AWAITING_RESPONSE");

  // Quote Metadata
  const [quoteNumber, setQuoteNumber] = useState("");
  const [quoteDate, setQuoteDate] = useState(
    format(new Date(), "MM / dd / yyyy")
  );
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [quoteValidity, setQuoteValidity] = useState<number | string>(30);
  const [currency, setCurrency] = useState("USD");

  // Prepared By / Issuer Details
  const [preparedByName, setPreparedByName] = useState(currentUser?.full_name || "Steve Rhode");
  const [preparedByEmail, setPreparedByEmail] = useState(currentUser?.email || "steve@zenatech.com");
  const [companyName, setCompanyName] = useState("");

  // Quotation For (Client Details)
  const [clientCompanyName, setClientCompanyName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactTitle, setContactTitle] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [billingAddress, setBillingAddress] = useState("");

  // Line Items Form Rows - default to empty line item without any default values
  const [lineItems, setLineItems] = useState<QuoteLineItem[]>([
    createEmptyQuoteLineItem(),
  ]);

  // Pricing Modifiers
  const [discount, setDiscount] = useState<number | string>(0);
  const [tax, setTax] = useState<number | string>(0);

  // Closing / Thank you message & Notes
  const [closingMessage, setClosingMessage] = useState("");
  const [notes, setNotes] = useState("");

  // Dynamic Breadcrumbs
  useEffect(() => {
    const pageTitle = quoteId ? `Edit ${quoteNumber || "Quote"}` : "Quote Generator";
    document.dispatchEvent(
      new CustomEvent("set-breadcrumb-trail", {
        detail: {
          path: quoteId ? `/account-receivable/generate-quote?id=${quoteId}` : "/account-receivable/generate-quote",
          items: [
            { title: "Account Receivable", label: "Account Receivable", path: "/account-receivable" },
            { title: "Quotes", label: "Quotes", path: "/account-receivable?tab=quotes" },
            { title: pageTitle, label: pageTitle, path: "/account-receivable/generate-quote" },
          ],
        },
      })
    );
  }, [quoteId, quoteNumber]);

  // Load existing quote if quote ID is present in URL
  useEffect(() => {
    const qId = searchParams.get("id");
    if (qId) {
      setQuoteId(qId);
      arQuoteService.getQuote(qId).then((q) => {
        if (q) {
          setQuoteNumber(q.quote_number || "");
          setPublicationState(q.publication_state || "DRAFT");
          setCurrentVersion(q.current_version || 1);
          setCustomerResponseState(q.customer_response_state || "AWAITING_RESPONSE");
          setCustomerId(q.customer_id || "");
          setCustomerSearch(q.customer_name || "");
          setClientCompanyName(q.customer_name || "");
          setClientEmail(q.customer_email || "");
          setClientPhone(q.customer_phone || "");
          setContactPerson(q.customer_contact_person || "");
          setContactTitle(q.customer_contact_title || "");
          setBillingAddress(q.customer_billing_address || "");
          setPreparedByName(q.prepared_by_name || "Steve Rhode");
          setPreparedByEmail(q.prepared_by_email || "steve@zenatech.com");
          setCompanyName(q.company_name || "");
          setLogoUrl(q.logo_url || null);
          setDiscount(q.discount !== undefined && q.discount !== null ? q.discount : 0);
          setTax(q.tax !== undefined && q.tax !== null ? q.tax : 0);
          if (q.currency) setCurrency(q.currency);
          if (q.notes) setNotes(q.notes);

          if (q.quote_date) {
            setQuoteDate(formatDateOnly(q.quote_date, "MM / dd / yyyy"));
          }

          if (q.line_items && q.line_items.length > 0) {
            setLineItems(
              q.line_items.map((li: any) => {
                const pricing = calculateRowPricing({
                  quantity: li.quantity !== undefined && li.quantity !== null && li.quantity !== "" ? li.quantity : 1,
                  unit_price: li.price !== undefined && li.price !== null && li.price !== "" ? li.price : (li.unit_price || 0),
                  unit_discount: li.unit_discount !== undefined && li.unit_discount !== null ? li.unit_discount : 0,
                  discount_type: li.discount_type || "%",
                  billing_frequency: li.billing_frequency || li.billing_type || "",
                  term: li.term !== undefined && li.term !== null && li.term !== "" ? li.term : 1,
                  billing_start_date: li.billing_start_date || "",
                  tax_rate: li.tax_rate !== undefined && li.tax_rate !== null ? li.tax_rate : 0,
                });
                return {
                  name: li.name || li.activity || "",
                  description: li.description || "",
                  currency: li.currency || q.currency || "USD",
                  price: li.price !== undefined && li.price !== null ? li.price : (li.unit_price !== undefined ? li.unit_price : ""),
                  quantity: li.quantity !== undefined && li.quantity !== null && li.quantity !== "" ? li.quantity : 1,
                  unit_discount: li.unit_discount !== undefined && li.unit_discount !== null ? li.unit_discount : "",
                  discount_type: li.discount_type || "%",
                  billing_frequency: li.billing_frequency || li.billing_type || "",
                  term: li.term !== undefined && li.term !== null && li.term !== "" ? li.term : 1,
                  billing_start_date: li.billing_start_date || "",
                  tax_rate: li.tax_rate !== undefined && li.tax_rate !== null ? li.tax_rate : "",
                  subtotal: li.subtotal !== undefined ? Number(li.subtotal) : pricing.amount,
                  calculation: li.calculation || pricing.formulaString,
                };
              })
            );
          }
          if (q.closing_message) {
            setClosingMessage(q.closing_message);
          } else {
            setClosingMessage(
              q.company_name
                ? `${q.company_name} is thankful for the opportunity to partner with ${q.customer_name || "your team"} to help optimize your operations. If you have any final questions, please email me directly at ${q.prepared_by_email || "steve@zenatech.com"}. We're ready to hit the ground running!`
                : `We are thankful for the opportunity to partner with ${q.customer_name || "your team"} to help optimize your operations. If you have any final questions, please email me directly at ${q.prepared_by_email || "steve@zenatech.com"}. We're ready to hit the ground running!`
            );
          }
          if (q.validity_days) {
            setQuoteValidity(q.validity_days);
          } else if (q.terms) {
            const match = String(q.terms).match(/\d+/);
            setQuoteValidity(match ? parseInt(match[0], 10) : 30);
          } else {
            setQuoteValidity(30);
          }
        }
      });
    } else {
      // Auto-fetch next quote number
      arQuoteService.getNextQuoteNumber().then((res) => {
        if (res?.next_quote_number) {
          setQuoteNumber(res.next_quote_number);
        }
      });
    }
  }, [searchParams]);

  // Handle URL customerId / customerName params
  const lastProcessedUrlSignatureRef = useRef<string>("");

  useEffect(() => {
    const custId = searchParams.get("customerId") || searchParams.get("customer_id") || searchParams.get("customer");
    const custNameParam = searchParams.get("customerName") || searchParams.get("name");
    const currentSignature = `${custId || ""}_${custNameParam || ""}`;

    if (!custId && !custNameParam) {
      lastProcessedUrlSignatureRef.current = "";
      return;
    }

    if (lastProcessedUrlSignatureRef.current === currentSignature) {
      return;
    }

    lastProcessedUrlSignatureRef.current = currentSignature;
    Promise.all([
      financeService.getPayableContacts({ limit: 500 }).catch(() => ({ items: [] })),
      arInvoiceService.getCustomers().catch(() => []),
    ]).then(([contactsRes, arCusts]) => {
      const contacts = contactsRes?.items || [];
      const matchContact = contacts.find(
        (c: any) =>
          (custId && (
            String(c.id).toLowerCase() === String(custId).toLowerCase() ||
            `CUST-${c.id}`.toLowerCase() === String(custId).toLowerCase() ||
            String(c.id).toLowerCase().endsWith(String(custId).toLowerCase())
          )) ||
          (custNameParam && (
            c.display_name?.toLowerCase() === custNameParam.toLowerCase() ||
            c.full_name?.toLowerCase() === custNameParam.toLowerCase()
          ))
      );

      const matchAr = arCusts.find(
        (c: any) =>
          (custId && (
            String(c.id).toLowerCase() === String(custId).toLowerCase() ||
            String(c.id).toLowerCase().endsWith(String(custId).toLowerCase())
          )) ||
          (custNameParam && (
            c.display_name?.toLowerCase() === custNameParam.toLowerCase() ||
            c.name?.toLowerCase() === custNameParam.toLowerCase()
          ))
      );

      if (matchContact) {
        const compName = matchContact.display_name || matchContact.full_name || "";
        setCustomerId(String(matchContact.id));
        setCustomerSearch(compName);
        setClientCompanyName(compName);
        if (matchContact.phone_numbers) setClientPhone(matchContact.phone_numbers);
        if (matchContact.full_name) setContactPerson(matchContact.full_name);
        if (matchContact.email) setClientEmail(matchContact.email);
        if (matchContact.bill_address) setBillingAddress(matchContact.bill_address);
        setClosingMessage(
          companyName
            ? `${companyName} is thankful for the opportunity to partner with ${compName} to help optimize your operations. If you have any final questions, please email me directly at ${preparedByEmail}. We're ready to hit the ground running!`
            : `We are thankful for the opportunity to partner with ${compName} to help optimize your operations. If you have any final questions, please email me directly at ${preparedByEmail}. We're ready to hit the ground running!`
        );
      } else if (matchAr) {
        const compName = matchAr.display_name || matchAr.name || "";
        setCustomerId(String(matchAr.id));
        setCustomerSearch(compName);
        setClientCompanyName(compName);
        if (matchAr.contact_person) setContactPerson(matchAr.contact_person);
        if (matchAr.phone) setClientPhone(matchAr.phone);
        if (matchAr.email) setClientEmail(matchAr.email);
        if (matchAr.billing_address) setBillingAddress(matchAr.billing_address);
        setClosingMessage(
          companyName
            ? `${companyName} is thankful for the opportunity to partner with ${compName} to help optimize your operations. If you have any final questions, please email me directly at ${preparedByEmail}. We're ready to hit the ground running!`
            : `We are thankful for the opportunity to partner with ${compName} to help optimize your operations. If you have any final questions, please email me directly at ${preparedByEmail}. We're ready to hit the ground running!`
        );
      } else if (custNameParam) {
        setCustomerSearch(custNameParam);
        setClientCompanyName(custNameParam);
      }
    });
  }, [searchParams, companyName, preparedByEmail]);

  // Logo file upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClientNameChange = (val: string) => {
    setClientCompanyName(val);
    setCustomerSearch(val);
    setClosingMessage(
      companyName
        ? `${companyName} is thankful for the opportunity to partner with ${val || "your team"} to help optimize your operations. If you have any final questions, please email me directly at ${preparedByEmail}. We're ready to hit the ground running!`
        : `We are thankful for the opportunity to partner with ${val || "your team"} to help optimize your operations. If you have any final questions, please email me directly at ${preparedByEmail}. We're ready to hit the ground running!`
    );
  };

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
    setCustomerId(custOption.id);
    const compName = custOption.display_name || custOption.name || custOption.full_name || "";
    setCustomerSearch(compName);
    setClientCompanyName(compName);
    if (custOption.phone) setClientPhone(custOption.phone);
    if (custOption.full_name) setContactPerson(custOption.full_name);
    if (custOption.email) setClientEmail(custOption.email);
    if (custOption.bill_address) setBillingAddress(custOption.bill_address);

    setClosingMessage(
      `${companyName} is thankful for the opportunity to partner with ${compName} to help optimize your operations. If you have any final questions, please email me directly at ${preparedByEmail}. We're ready to hit the ground running!`
    );
  };

  const handleAddLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      createEmptyQuoteLineItem(),
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.length > 0 ? filtered : [createEmptyQuoteLineItem()];
    });
  };

  const handleLineItemChange = (
    index: number,
    field: keyof QuoteLineItem | "subtotal",
    value: any
  ) => {
    setLineItems((prev) => {
      const next = [...prev];
      const item = { ...next[index], [field]: value };

      if (field === "subtotal") {
        const manualSubtotal = value === "" ? "" : Number(value);
        item.subtotal = manualSubtotal === "" ? 0 : manualSubtotal;
        const qty = Number(item.quantity) || 1;
        if (qty > 0 && manualSubtotal !== "") {
          item.price = Math.round((Number(manualSubtotal) / qty) * 100) / 100;
        }
        item.calculation = `Manual Override: $${(Number(item.subtotal) || 0).toFixed(2)}`;
      } else {
        const pricing = calculateRowPricing({
          quantity: item.quantity,
          unit_price: item.price,
          unit_discount: item.unit_discount,
          discount_type: item.discount_type,
          billing_frequency: item.billing_frequency,
          term: item.term,
          tax_rate: item.tax_rate,
        });

        item.subtotal = pricing.amount;
        item.calculation = pricing.formulaString;
      }

      next[index] = item;
      return next;
    });
  };

  const subtotal = lineItems.reduce((acc, itm) => acc + (Number(itm.subtotal) || 0), 0);
  const discountAmount = Number(discount) || 0;
  const taxAmount = Number(tax) || 0;
  const totalAmount = Math.max(0, subtotal - discountAmount + taxAmount);

  const formatCurrency = (val: number) => {
    return `$${val.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handlePrintPdf = () => {
    window.print();
  };

  // Save as Draft
  const handleSaveDraft = async () => {
    try {
      setIsSaving(true);
      const res = await arQuoteService.saveQuote({
        id: quoteId || undefined,
        quote_number: quoteNumber,
        publication_state: "DRAFT",
        customer_id: customerId || undefined,
        customer_name: clientCompanyName,
        customer_email: clientEmail,
        customer_phone: clientPhone,
        customer_contact_person: contactPerson,
        customer_contact_title: contactTitle,
        customer_billing_address: billingAddress,
        currency,
        quote_date: quoteDate,
        prepared_by_name: preparedByName,
        prepared_by_email: preparedByEmail,
        company_name: companyName,
        logo_url: logoUrl || undefined,
        line_items: lineItems,
        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        total_amount: totalAmount,
        closing_message: closingMessage,
        notes: notes || undefined,
        terms: `${Number(quoteValidity) || 30} days`,
        validity_days: Number(quoteValidity) || 30,
      });

      setQuoteId(res.id);
      setPublicationState("DRAFT");
      queryClient.invalidateQueries({ queryKey: ["ar-quotes"] });
      queryClient.invalidateQueries({ queryKey: ["ar-quote-detail", res.id] });
      queryClient.invalidateQueries({ queryKey: ["ar-quote-audit", res.id] });
      if (quoteId) {
        queryClient.invalidateQueries({ queryKey: ["ar-quote-detail", quoteId] });
      }
      navigate(`/account-receivable/generate-quote?id=${res.id}`, { replace: true });
      setSaveSuccessMsg(`Draft Quote ${quoteNumber} saved successfully.`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      alert("Failed to save draft: " + (err?.response?.data?.detail || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  // Publish Quote
  const handlePublishQuote = async () => {
    try {
      setIsSaving(true);
      const res = await arQuoteService.saveQuote({
        id: quoteId || undefined,
        quote_number: quoteNumber,
        publication_state: "PUBLISHED",
        customer_id: customerId || undefined,
        customer_name: clientCompanyName,
        customer_email: clientEmail,
        customer_phone: clientPhone,
        customer_contact_person: contactPerson,
        customer_contact_title: contactTitle,
        customer_billing_address: billingAddress,
        currency,
        quote_date: quoteDate,
        prepared_by_name: preparedByName,
        prepared_by_email: preparedByEmail,
        company_name: companyName,
        logo_url: logoUrl || undefined,
        line_items: lineItems,
        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        total_amount: totalAmount,
        closing_message: closingMessage,
        notes: notes || undefined,
        terms: `${Number(quoteValidity) || 30} days`,
        validity_days: Number(quoteValidity) || 30,
      });

      setQuoteId(res.id);
      setPublicationState("PUBLISHED");
      queryClient.invalidateQueries({ queryKey: ["ar-quotes"] });
      queryClient.invalidateQueries({ queryKey: ["ar-quote-detail", res.id] });
      queryClient.invalidateQueries({ queryKey: ["ar-quote-audit", res.id] });
      if (quoteId) {
        queryClient.invalidateQueries({ queryKey: ["ar-quote-detail", quoteId] });
      }
      navigate(`/account-receivable/generate-quote?id=${res.id}`, { replace: true });
      setSaveSuccessMsg(`Quotation ${quoteNumber} has been PUBLISHED! Ready to send to customer.`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      alert("Failed to publish quote: " + (err?.response?.data?.detail || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (!quoteId) return;
    if (!window.confirm(`Are you sure you want to delete draft quote ${quoteNumber}? This action cannot be undone.`)) {
      return;
    }
    try {
      setIsSaving(true);
      await arQuoteService.deleteQuote(quoteId);
      queryClient.invalidateQueries({ queryKey: ["ar-quotes"] });
      queryClient.invalidateQueries({ queryKey: ["ar-quote-summary"] });
      navigate("/account-receivable?tab=quotes");
    } catch (err: any) {
      alert("Failed to delete draft quote: " + (err?.response?.data?.detail || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  const currentQuoteObj: ARQuote | null = quoteId
    ? {
        id: quoteId,
        quote_number: quoteNumber,
        current_version: currentVersion,
        publication_state: publicationState,
        customer_name: clientCompanyName,
        customer_email: clientEmail,
        customer_phone: clientPhone,
        customer_contact_person: contactPerson,
        customer_contact_title: contactTitle,
        customer_billing_address: billingAddress,
        currency,
        quote_date: quoteDate,
        validity_days: Number(quoteValidity) || 30,
        terms: `${Number(quoteValidity) || 30} days`,
        notes: notes || undefined,
        closing_message: closingMessage,
        prepared_by_name: preparedByName,
        prepared_by_email: preparedByEmail,
        company_name: companyName,
        logo_url: logoUrl || undefined,
        line_items: lineItems,
        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        total_amount: totalAmount,
        customer_response_state: customerResponseState as any,
        payment_status: "UNPAID",
        paid_amount: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    : null;

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
            onClick={() => {
              if (quoteId) {
                navigate(`/account-receivable/quotes/${quoteId}`);
              } else {
                navigate("/account-receivable?tab=quotes");
              }
            }}
            className="text-xs gap-1.5 h-8 px-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{quoteId ? "Back to Details" : "Back to Quotes"}</span>
          </Button>

          <div className="h-4 w-px bg-border shrink-0" />

          {quoteId ? (
            <Badge
              variant="outline"
              className="text-xs px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 gap-1.5 font-medium font-mono"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Editing {quoteNumber}</span>
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-xs px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 gap-1.5 font-medium"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Quote Generator</span>
            </Badge>
          )}

          {publicationState === "PUBLISHED" ? (
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px] h-6">
              Published
            </Badge>
          ) : (
            <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 text-[10px] h-6">
              Draft
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          {quoteId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/account-receivable/quotes/${quoteId}`)}
              className="text-xs gap-1.5 h-8 px-3 bg-card hover:bg-muted text-foreground cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>View Details</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintPdf}
            className="text-xs gap-1.5 h-8 px-3 bg-card hover:bg-muted text-foreground cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="text-xs gap-1.5 h-8 px-3 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 cursor-pointer"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Save Draft</span>
          </Button>

          {quoteId && publicationState === "DRAFT" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteDraft}
              disabled={isSaving}
              className="text-xs gap-1.5 h-8 px-3 border-rose-200 text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:border-rose-800 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Delete Draft</span>
            </Button>
          )}

          <Button
            size="sm"
            onClick={handlePublishQuote}
            disabled={isSaving}
            className="text-xs gap-1.5 h-8 px-3.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs cursor-pointer"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>Publish Quote</span>
          </Button>

          {publicationState === "PUBLISHED" && quoteId && (
            <Button
              size="sm"
              onClick={() => setIsSendModalOpen(true)}
              className="text-xs gap-1.5 h-8 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send to Customer</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── Status Notifications ── */}
      {saveSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-xs print:hidden animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          {quoteId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/account-receivable/quotes/${quoteId}`)}
              className="h-6 text-[11px] text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 gap-1 cursor-pointer"
            >
              <span>View Details</span>
              <ExternalLink className="w-3 h-3" />
            </Button>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── EXACT VISUAL QUOTATION DOCUMENT FORMAT (DIRECT EDITABLE) ─── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="p-6 sm:p-8 lg:p-10 bg-white text-slate-900 border border-slate-200/90 rounded-2xl shadow-sm font-sans text-sm space-y-8 min-h-[750px] w-full print:shadow-none print:border-none print:p-0">
        {/* Top Brand Logo & Company Name */}
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
            id="quote-paper-logo"
          />

          <div className="flex items-center justify-between">
            {logoUrl ? (
              <div className="flex items-center gap-2 group">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="h-20 sm:h-24 max-w-[340px] flex items-center cursor-pointer hover:opacity-85 transition-opacity"
                  title="Click to change logo"
                >
                  <img
                    src={logoUrl}
                    alt="Company Logo"
                    className="max-h-full max-w-full h-auto w-auto object-contain object-left"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="p-1.5 text-slate-400 hover:text-rose-600 print:hidden cursor-pointer rounded-md hover:bg-rose-50"
                  title="Remove Logo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-3 border border-dashed border-slate-300 rounded-xl text-xs text-slate-500 hover:text-amber-600 hover:border-amber-400 cursor-pointer flex items-center gap-2 print:hidden"
              >
                <Upload className="w-4 h-4" />
                <span className="font-medium">Upload Company Logo</span>
              </div>
            )}
          </div>

          {/* Company Name under Logo */}
          <div className="print:hidden max-w-sm pt-1">
            <div className="flex items-center gap-2 text-[14px]">
              <Label htmlFor="quote-company-name" className="font-bold shrink-0 text-[14px]">Company Name:</Label>
              <Input
                id="quote-company-name"
                name="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company name..."
                className="h-8 text-[14px] font-semibold text-slate-900 border-slate-200 focus:border-amber-500 bg-transparent px-2.5 flex-1 font-sans"
              />
            </div>
          </div>
          {companyName && (
            <div className="hidden print:block text-base font-bold text-slate-900 pt-0.5">
              {companyName}
            </div>
          )}
        </div>

        {/* 2-Column Header Section: Quotation for vs Date / Meta */}
        {/* 2-Column Header Section: Quotation for vs Date / Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-start pt-1">
          {/* Left Column: Quotation for: */}
          <div className="space-y-1.5 text-slate-900">
            {/* Screen Interactive Mode */}
            <div className="print:hidden space-y-1.5">
              <div className="font-bold text-[15px] mb-1 text-slate-900 flex items-center justify-between">
                <span>Quotation for:</span>
              </div>

              {/* Quick Customer Autocomplete Picker */}
              <div className="pb-1">
                <ARCustomerAutocomplete
                  customerId={customerId}
                  customerName={customerSearch || clientCompanyName}
                  onSelect={handleSelectCustomerOption}
                  className="w-full"
                />
              </div>

              <Input
                id="quote-client-company-name"
                name="clientCompanyName"
                value={clientCompanyName}
                onChange={(e) => handleClientNameChange(e.target.value)}
                placeholder="Client Company Name (e.g. JP Furniture)"
                className="h-7 text-[14px] font-medium border-slate-200 focus:border-amber-500 bg-transparent px-2"
              />

              <Input
                id="quote-client-phone"
                name="clientPhone"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="Client Phone (e.g. [Client.Phone])"
                className="h-7 text-[14px] text-slate-700 border-slate-200 focus:border-amber-500 bg-transparent px-2"
              />

              <Input
                id="quote-contact-person"
                name="contactPerson"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Contact Person (e.g. Jasper O. I)"
                className="h-7 text-[14px] border-slate-200 focus:border-amber-500 bg-transparent px-2"
              />

              <Input
                id="quote-contact-title"
                name="contactTitle"
                value={contactTitle}
                onChange={(e) => setContactTitle(e.target.value)}
                placeholder="Job Title (e.g. Senior Project Manager)"
                className="h-7 text-[14px] border-slate-200 focus:border-amber-500 bg-transparent px-2"
              />

              <Input
                id="quote-client-email"
                name="clientEmail"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="Contact Email (e.g. jpchrisfurniture@gmail.com)"
                className="h-7 text-[14px] text-slate-700 border-slate-200 focus:border-amber-500 bg-transparent px-2"
              />
            </div>

            {/* Print Mode: Clean Document Typography */}
            <div className="hidden print:block space-y-1 text-slate-900">
              <div className="font-bold text-base mb-1.5">Quotation for:</div>
              {clientCompanyName && <div className="text-[14px] leading-snug font-semibold text-slate-900">{clientCompanyName}</div>}
              {clientPhone && <div className="text-[14px] leading-snug text-slate-700">{clientPhone}</div>}
              {contactPerson && <div className="text-[14px] leading-snug text-slate-800">{contactPerson}</div>}
              {contactTitle && <div className="text-[14px] leading-snug text-slate-700">{contactTitle}</div>}
              {clientEmail && <div className="text-[14px] leading-snug text-slate-700">{clientEmail}</div>}
              {!clientCompanyName && !contactPerson && !clientEmail && (
                <div className="text-[14px] text-slate-400 italic font-light">—</div>
              )}
            </div>
          </div>

          {/* Right Column: Date, Quotation No., Quote Validity, Prepared By */}
          <div className="space-y-2 text-slate-900 sm:pl-4">
            {/* Screen Interactive Mode */}
            <div className="print:hidden space-y-2">
              <div className="flex items-center gap-2 text-[14px]">
                <span className="font-bold w-32 shrink-0">Date</span>
                <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="h-7 text-[14px] text-left border border-slate-200 hover:border-amber-500 focus:border-amber-500 rounded-md bg-transparent px-2 flex-1 flex items-center justify-between text-slate-900 cursor-pointer font-normal"
                    >
                      <span>{quoteDate || format(new Date(), "MM / dd / yyyy")}</span>
                      <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl" align="start">
                    <Calendar
                      mode="single"
                      selected={parseDateOnly(quoteDate) || new Date()}
                      onSelect={(d) => {
                        if (d) {
                          setQuoteDate(formatDateOnly(format(d, "yyyy-MM-dd"), "MM / dd / yyyy"));
                          setIsDateOpen(false);
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center gap-2 text-[14px]">
                <Label htmlFor="quote-number-field" className="font-bold w-32 shrink-0 text-[14px]">Quotation No.:</Label>
                <Input
                  id="quote-number-field"
                  name="quoteNumber"
                  value={quoteNumber}
                  onChange={(e) => setQuoteNumber(e.target.value)}
                  placeholder="Quote# 29771"
                  className="h-7 text-[14px] font-mono border-slate-200 focus:border-amber-500 bg-transparent px-2 flex-1"
                />
              </div>

              <div className="flex items-center gap-2 text-[14px]">
                <Label htmlFor="quote-validity-field" className="font-bold w-32 shrink-0 text-[14px]">Quote Validity:</Label>
                <div className="flex items-center gap-1.5 flex-1">
                  <Input
                    id="quote-validity-field"
                    name="quoteValidity"
                    type="number"
                    min={1}
                    value={quoteValidity}
                    onChange={(e) => {
                      const val = e.target.value;
                      setQuoteValidity(val === "" ? "" : Math.max(1, parseInt(val) || 0));
                    }}
                    placeholder="30"
                    className="h-7 text-[14px] border-slate-200 focus:border-amber-500 bg-transparent px-2 w-24"
                  />
                  <span className="text-slate-600 text-[14px]">days</span>
                </div>
              </div>

              <div className="pt-3 space-y-1.5 border-t border-slate-100 mt-2">
                <div className="flex items-center gap-2 text-[14px]">
                  <Label htmlFor="quote-prepared-by-name" className="font-bold w-32 shrink-0 text-[14px]">Prepared By:</Label>
                  <div className="flex-1">
                    <UserAutocomplete
                      value={preparedByName}
                      onChange={(val, selectedUser) => {
                        setPreparedByName(val);
                        if (selectedUser?.email) {
                          setPreparedByEmail(selectedUser.email);
                        }
                      }}
                      placeholder="Search & select user..."
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[14px]">
                  <span className="w-32 shrink-0 text-slate-400"></span>
                  <Input
                    id="quote-prepared-by-email"
                    name="preparedByEmail"
                    type="email"
                    value={preparedByEmail}
                    onChange={(e) => setPreparedByEmail(e.target.value)}
                    placeholder="User email address..."
                    className="h-7 text-[13px] text-slate-700 border-slate-200 focus:border-amber-500 bg-transparent px-2 flex-1 font-sans"
                  />
                </div>
              </div>
            </div>

            {/* Print Mode: Clean Document Typography */}
            <div className="hidden print:block space-y-1.5 text-slate-900 sm:pl-4">
              <div className="text-[14px] leading-snug">
                <span className="font-bold">Date</span>{" "}
                <span className="ml-2">{quoteDate || format(new Date(), "MM / dd / yyyy")}</span>
              </div>
              <div className="text-[14px] leading-snug">
                <span className="font-bold">Quotation No.:</span>{" "}
                <span className="ml-2 font-mono font-semibold">{quoteNumber || "Quote# 29771"}</span>
              </div>
              <div className="text-[14px] leading-snug">
                <span className="font-bold">Quote Validity:</span>{" "}
                <span className="ml-2 italic text-slate-700">{quoteValidity ? `${quoteValidity} days` : "30 days"}</span>
              </div>

              {(preparedByName || preparedByEmail) && (
                <div className="pt-3 space-y-1 border-t border-slate-200/60 mt-2">
                  {preparedByName && (
                    <div className="text-[14px] leading-snug">
                      <span className="font-bold">Prepared By:</span>{" "}
                      <span className="ml-2 font-medium">{preparedByName}</span>
                    </div>
                  )}
                  {preparedByEmail && (
                    <div className="text-[14px] leading-snug text-slate-700">
                      <span className="ml-2">{preparedByEmail}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="pt-2">
          {/* Screen Interactive Table */}
          <div className="print:hidden">
            <div className="overflow-x-auto border border-slate-200/90 rounded-xl bg-white shadow-2xs">
              <table className="w-full text-left border-collapse min-w-[980px]">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-900 text-[12px] font-bold">
                    <th className="py-2.5 px-3 font-bold min-w-[240px] text-left">Item &amp; Description</th>
                    <th className="py-2.5 px-2 font-bold w-24 min-w-[95px] text-left">Unit price</th>
                    <th className="py-2.5 px-2 font-bold w-28 min-w-[105px] text-left">Currency</th>
                    <th className="py-2.5 px-2 font-bold w-20 min-w-[75px] text-left">Quantity</th>
                    <th className="py-2.5 px-2 font-bold w-28 min-w-[110px] text-left">Unit discount</th>
                    <th className="py-2.5 px-2 font-bold w-36 min-w-[130px] text-left">Billing frequency</th>
                    <th className="py-2.5 px-2 font-bold w-20 min-w-[70px] text-left">Term</th>
                    <th className="py-2.5 px-2 font-bold w-24 min-w-[80px] text-left">
                      <span className="inline-flex items-center gap-1">
                        <span>Tax rate</span>
                        <Info className="w-3 h-3 text-slate-400" />
                      </span>
                    </th>
                    <th className="py-2.5 px-2 font-bold w-28 min-w-[110px] text-right">Net price</th>
                    <th className="py-2.5 px-1 w-8 print:hidden"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[12.5px]">
                  {lineItems.map((itm, i) => {
                    const rowPricing = calculateRowPricing({
                      quantity: itm.quantity,
                      unit_price: itm.price,
                      unit_discount: itm.unit_discount,
                      discount_type: itm.discount_type,
                      billing_frequency: itm.billing_frequency,
                      term: itm.term,
                      tax_rate: itm.tax_rate,
                    });

                    return (
                      <tr key={i} className="hover:bg-slate-50/50 group">
                        <td className="py-2 px-3 space-y-1.5 align-top">
                          <Input
                            id={`quote-line-name-${i}`}
                            name={`line_name_${i}`}
                            value={itm.name}
                            onChange={(e) => handleLineItemChange(i, "name", e.target.value)}
                            placeholder="Item name..."
                            className="h-7 text-xs font-medium border-slate-200 focus:border-amber-500 bg-transparent px-2"
                          />
                          <textarea
                            id={`quote-line-desc-${i}`}
                            name={`line_desc_${i}`}
                            value={itm.description}
                            onChange={(e) => handleLineItemChange(i, "description", e.target.value)}
                            placeholder="Description (optional)..."
                            rows={1}
                            className="w-full text-[11px] font-light text-slate-600 border border-slate-200 focus:border-amber-500 rounded-md bg-transparent px-2 py-1 resize-y min-h-[28px] focus:outline-none leading-relaxed"
                          />
                          {rowPricing.isProrated && rowPricing.proratedNote && (
                            <div className="text-[10.5px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded font-medium inline-flex items-center gap-1 mt-0.5">
                              <span>ℹ️ {rowPricing.proratedNote}</span>
                            </div>
                          )}
                          {itm.calculation && (
                            <div className="text-[10.5px] text-slate-500 dark:text-slate-400 italic font-mono tracking-tight pl-0.5">
                              Formula: {itm.calculation}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-2 align-top">
                          <Input
                            id={`quote-line-price-${i}`}
                            name={`line_price_${i}`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={itm.price}
                            onChange={(e) => handleLineItemChange(i, "price", e.target.value)}
                            placeholder="0.00"
                            className="h-7 text-xs text-left font-normal border-slate-200 focus:border-amber-500 bg-transparent px-2"
                          />
                        </td>
                        <td className="py-2 px-2 align-top">
                          <CurrencyAutocomplete
                            value={itm.currency || currency || "USD"}
                            onChange={(val) => handleLineItemChange(i, "currency", val)}
                            className="h-7 text-xs px-2"
                          />
                        </td>
                        <td className="py-2 px-2 align-top">
                          <Input
                            id={`quote-line-qty-${i}`}
                            name={`line_qty_${i}`}
                            type="number"
                            step="1"
                            min="1"
                            value={itm.quantity}
                            onChange={(e) => handleLineItemChange(i, "quantity", e.target.value)}
                            placeholder="1"
                            className="h-7 text-xs text-left font-normal border-slate-200 focus:border-amber-500 bg-transparent px-2"
                          />
                        </td>
                        <td className="py-2 px-2 align-top">
                          <div className="flex items-center rounded-md border border-slate-200 bg-white dark:bg-slate-900 focus-within:border-amber-500 overflow-hidden h-7">
                            <select
                              id={`quote-line-discount-type-${i}`}
                              name={`line_discount_type_${i}`}
                              value={itm.discount_type || "%"}
                              onChange={(e) => handleLineItemChange(i, "discount_type", e.target.value as "%" | "$")}
                              className="h-full bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-zinc-300 px-1 border-r border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer"
                            >
                              <option value="%">%</option>
                              <option value="$">$</option>
                            </select>
                            <input
                              id={`quote-line-discount-val-${i}`}
                              name={`line_discount_val_${i}`}
                              type="number"
                              step="0.01"
                              min="0"
                              value={itm.unit_discount}
                              onChange={(e) => handleLineItemChange(i, "unit_discount", e.target.value)}
                              placeholder="0"
                              className="w-full h-full text-xs text-left px-1.5 bg-transparent focus:outline-none"
                            />
                          </div>
                        </td>
                        <td className="py-2 px-2 align-top">
                          <Select
                            value={itm.billing_frequency || "none"}
                            onValueChange={(val) => handleLineItemChange(i, "billing_frequency", val === "none" ? "" : val)}
                          >
                            <SelectTrigger className="h-7 text-xs border-slate-200 focus:border-amber-500 bg-transparent px-2">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 z-50">
                              <SelectItem value="none">Select...</SelectItem>
                              <SelectItem value="One-Time">One-Time</SelectItem>
                              <SelectItem value="Monthly">Monthly</SelectItem>
                              <SelectItem value="Annually">Annually</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-2 px-2 align-top">
                          <Input
                            id={`quote-line-term-${i}`}
                            name={`line_term_${i}`}
                            type="number"
                            step="1"
                            min="1"
                            value={itm.term}
                            onChange={(e) => handleLineItemChange(i, "term", e.target.value)}
                            placeholder="1"
                            className="h-7 text-xs text-left font-normal border-slate-200 focus:border-amber-500 bg-transparent px-2"
                          />
                        </td>
                        <td className="py-2 px-2 align-top">
                          <div className="flex items-center rounded-md border border-slate-200 bg-white dark:bg-slate-900 focus-within:border-amber-500 overflow-hidden h-7">
                            <input
                              id={`quote-line-tax-rate-${i}`}
                              name={`line_tax_rate_${i}`}
                              type="number"
                              step="0.01"
                              min="0"
                              value={itm.tax_rate}
                              onChange={(e) => handleLineItemChange(i, "tax_rate", e.target.value)}
                              placeholder="0"
                              className="w-full h-full text-xs text-left px-1.5 bg-transparent focus:outline-none"
                            />
                            <span className="text-[10px] text-slate-400 px-1">%</span>
                          </div>
                        </td>
                        <td className="py-2 px-2 align-top">
                          <Input
                            id={`quote-line-subtotal-${i}`}
                            name={`line_subtotal_${i}`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={itm.subtotal !== undefined ? itm.subtotal : ""}
                            onChange={(e) => handleLineItemChange(i, "subtotal", e.target.value)}
                            placeholder="0.00"
                            className="h-7 text-xs text-right font-mono font-bold border-slate-200 focus:border-amber-500 bg-transparent px-2"
                          />
                        </td>
                        <td className="py-2 px-1 text-center align-top pt-2 print:hidden">
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(i)}
                            className="p-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddLineItem}
                className="text-xs text-amber-700 hover:bg-amber-50 gap-1.5 h-7 px-2 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Line Item</span>
              </Button>
            </div>
          </div>

          {/* Print Mode: Clean Document Table (Fits 100% of printable page width) */}
          <div className="hidden print:block overflow-hidden border-t border-b border-slate-300">
            <table className="w-full text-left border-collapse text-[11.5px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-300 text-slate-900 font-bold uppercase tracking-wider text-[10.5px]">
                  <th className="py-2.5 px-3 font-bold text-left w-[40%]">Item &amp; Description</th>
                  <th className="py-2.5 px-2.5 font-bold text-right w-[14%]">Unit Price</th>
                  <th className="py-2.5 px-2 font-bold text-center w-[10%]">Currency</th>
                  <th className="py-2.5 px-2 text-center font-bold w-[8%]">Qty</th>
                  <th className="py-2.5 px-2.5 text-center font-bold w-[10%]">Discount</th>
                  <th className="py-2.5 px-3 font-bold text-right w-[18%]">Net Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {lineItems.map((itm, i) => {
                  const printPricing = calculateRowPricing({
                    quantity: itm.quantity,
                    unit_price: itm.price,
                    unit_discount: itm.unit_discount,
                    discount_type: itm.discount_type,
                    billing_frequency: itm.billing_frequency,
                    term: itm.term,
                    tax_rate: itm.tax_rate,
                  });

                  return (
                    <tr key={i}>
                      <td className="py-2.5 px-3 align-top">
                        <div className="font-semibold text-slate-900 text-[12px]">{itm.name || `Item ${i + 1}`}</div>
                        {itm.description && (
                          <div className="text-[10.5px] text-slate-600 mt-0.5 whitespace-pre-line leading-relaxed">
                            {itm.description}
                          </div>
                        )}
                        {printPricing.isProrated && printPricing.proratedNote && (
                          <div className="text-[10px] text-amber-800 font-medium italic mt-0.5">
                            ℹ️ {printPricing.proratedNote}
                          </div>
                        )}
                        {(itm.billing_frequency || itm.term || (itm.tax_rate !== "" && itm.tax_rate !== undefined && Number(itm.tax_rate) > 0)) && (
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[10px] text-slate-600 print:text-slate-700">
                            {itm.billing_frequency && (
                              <span className="inline-flex items-center gap-1 font-medium">
                                <span className="text-slate-500 font-normal">Frequency:</span>
                                <span className="px-1.5 py-0.2 bg-slate-100 rounded text-slate-800 border border-slate-300 font-semibold text-[9.5px]">
                                  {itm.billing_frequency}
                                </span>
                              </span>
                            )}
                            {itm.term && (
                              <span className="inline-flex items-center gap-1">
                                <span className="text-slate-500 font-normal">Term:</span>
                                <span className="font-medium text-slate-800">
                                  {itm.term} {typeof itm.term === "number" || !isNaN(Number(itm.term)) ? (Number(itm.term) === 1 ? "month" : "months") : ""}
                                </span>
                              </span>
                            )}
                            {itm.tax_rate !== "" && itm.tax_rate !== undefined && Number(itm.tax_rate) > 0 && (
                              <span className="inline-flex items-center gap-1">
                                <span className="text-slate-500 font-normal">Tax Rate:</span>
                                <span className="font-medium text-slate-800">{itm.tax_rate}%</span>
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono align-top text-slate-800">
                        ${(Number(itm.price) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono align-top text-slate-800 font-semibold">
                        {itm.currency || currency || "USD"}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono align-top text-slate-800">
                        {itm.quantity !== "" && itm.quantity !== undefined ? itm.quantity : 1}
                      </td>
                      <td className="py-2.5 px-2.5 text-center align-top text-slate-800 font-mono">
                        {Number(itm.unit_discount) > 0 ? `${itm.unit_discount}${itm.discount_type || "%"}` : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold align-top text-slate-900">
                        {formatCurrency(itm.subtotal || 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Section (Right-aligned under table) */}
        <div className="flex justify-end pt-1">
          {/* Screen Interactive Mode */}
          <div className="print:hidden w-72 space-y-2 text-[14px]">
            <div className="flex justify-between items-center text-slate-800">
              <span>Subtotal</span>
              <span className="font-normal">{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex justify-between items-center text-slate-800">
              <Label htmlFor="quote-discount-input" className="text-[14px] font-normal text-slate-800">Discount</Label>
              <div className="w-28">
                <Input
                  id="quote-discount-input"
                  name="discount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0.00"
                  className="h-6 text-[14px] text-right border-slate-200 focus:border-amber-500 bg-transparent px-1"
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-slate-800">
              <Label htmlFor="quote-tax-input" className="text-[14px] font-normal text-slate-800">Tax</Label>
              <div className="w-28">
                <Input
                  id="quote-tax-input"
                  name="tax"
                  type="number"
                  step="0.01"
                  min="0"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                  placeholder="0.00"
                  className="h-6 text-[14px] text-right border-slate-200 focus:border-amber-500 bg-transparent px-1"
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-slate-900 font-bold pt-2 border-t border-slate-200 text-[15px]">
              <span>Total</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          {/* Print Mode: Clean Totals Breakdown */}
          <div className="hidden print:block w-72 space-y-1.5 text-xs text-right">
            <div className="flex justify-between items-center text-slate-700">
              <span className="font-medium">Subtotal:</span>
              <span className="font-mono">{formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-amber-700">
                <span className="font-medium">Discount:</span>
                <span className="font-mono">-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between items-center text-slate-700">
                <span className="font-medium">Tax:</span>
                <span className="font-mono">+{formatCurrency(taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-2 border-t border-slate-300 text-slate-900 font-bold">
              <span className="text-xs uppercase tracking-wider">TOTAL:</span>
              <span className="text-base font-bold font-mono">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Closing Statement & Sign-off (Left-aligned bottom) */}
        <div className="pt-6 space-y-6 text-[13.5px] leading-relaxed text-slate-900">
          {/* Screen Interactive Mode */}
          <div className="print:hidden">
            <Textarea
              id="quote-closing-message"
              name="closingMessage"
              value={closingMessage}
              onChange={(e) => setClosingMessage(e.target.value)}
              placeholder="We are thankful for the opportunity to partner with your team..."
              rows={3}
              className="text-[13.5px] leading-relaxed text-slate-800 border-slate-200 focus:border-amber-500 bg-transparent resize-none p-2 w-full"
            />
          </div>

          {/* Print Mode: Clean Paragraph */}
          {closingMessage && (
            <div className="hidden print:block">
              <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                {closingMessage}
              </p>
            </div>
          )}

          {/* Notes Section */}
          <div className="print:hidden space-y-1 pt-2">
            <Label htmlFor="quote-notes-field" className="text-xs font-semibold text-slate-700">
              Notes &amp; Terms (Optional):
            </Label>
            <Textarea
              id="quote-notes-field"
              name="quoteNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional internal or customer notes..."
              rows={2}
              className="text-xs leading-relaxed text-slate-800 border-slate-200 focus:border-amber-500 bg-transparent resize-none p-2 w-full"
            />
          </div>

          {notes && (
            <div className="hidden print:block pt-2">
              <div className="text-[11px] font-bold text-slate-900">Notes:</div>
              <p className="text-[10.5px] text-slate-700 whitespace-pre-line leading-relaxed">
                {notes}
              </p>
            </div>
          )}

          <div className="space-y-1 pt-2">
            <div className="text-xs text-slate-800">Thank you,</div>
            <div className="text-xs font-bold text-slate-900">{preparedByName || "Steve Rhode"}</div>
            {preparedByEmail && <div className="text-[11px] text-slate-600">{preparedByEmail}</div>}
          </div>
        </div>
      </div>

      {/* Send Quote Modal */}
      {currentQuoteObj && (
        <SendQuoteModal
          isOpen={isSendModalOpen}
          onClose={() => setIsSendModalOpen(false)}
          quote={currentQuoteObj}
          onSentSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["ar-quote-detail", currentQuoteObj.id] });
            queryClient.invalidateQueries({ queryKey: ["ar-quotes"] });
            queryClient.invalidateQueries({ queryKey: ["ar-quote-audit", currentQuoteObj.id] });
          }}
        />
      )}
    </div>
  );
}
