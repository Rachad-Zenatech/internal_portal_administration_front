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
} from "../../services/arInvoiceService";
import type {
  ARCustomer,
} from "../../services/arInvoiceService";
import { financeService } from "../../services/financeService";
import {
  arQuoteService,
} from "../../services/arQuoteService";
import type {
  ARQuote,
  PublicationState,
} from "../../services/arQuoteService";
import { ARCustomerAutocomplete } from "./ARCustomerAutocomplete";
import type { ARCustomerOption } from "./ARCustomerAutocomplete";
import { SendQuoteModal } from "./SendQuoteModal";

export interface QuoteLineItem {
  name: string;
  description: string;
  price: number | string;
  quantity: number | string;
  unit_discount: number | string;
  discount_type: "%" | "$";
  billing_frequency: string;
  term: number | string;
  billing_start_date: string;
  tax_rate: number | string;
  subtotal: number;
}

export const createEmptyQuoteLineItem = (): QuoteLineItem => ({
  name: "",
  description: "",
  price: "",
  quantity: "",
  unit_discount: "",
  discount_type: "%",
  billing_frequency: "",
  term: "",
  billing_start_date: "",
  tax_rate: "",
  subtotal: 0,
});

export default function GenerateQuotePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
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
  const [quoteValidity, setQuoteValidity] = useState("30 days");
  const [currency] = useState("USD");

  // Prepared By / Issuer Details
  const [preparedByName, setPreparedByName] = useState("Steve Rhode");
  const [preparedByEmail, setPreparedByEmail] = useState("steve@zenatech.com");
  const [companyName, setCompanyName] = useState("Workaware");

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

  // Closing / Thank you message & Sign off
  const [closingMessage, setClosingMessage] = useState("");

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
          setQuoteNumber(q.quote_number);
          setPublicationState(q.publication_state);
          setCurrentVersion(q.current_version);
          setCustomerResponseState(q.customer_response_state);
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
          setCompanyName(q.company_name || "Workaware");
          setLogoUrl(q.logo_url || null);
          setDiscount(q.discount || 0);
          setTax(q.tax || 0);
          if (q.quote_date) {
            try {
              const parsed = new Date(q.quote_date);
              if (!isNaN(parsed.getTime())) {
                setQuoteDate(format(parsed, "MM / dd / yyyy"));
              } else {
                setQuoteDate(q.quote_date);
              }
            } catch {
              setQuoteDate(q.quote_date);
            }
          }
          if (q.line_items && q.line_items.length > 0) {
            setLineItems(
              q.line_items.map((li: any) => ({
                name: li.name || "",
                description: li.description || "",
                price: li.price !== undefined && li.price !== null ? li.price : "",
                quantity: li.quantity !== undefined && li.quantity !== null ? li.quantity : "",
                unit_discount: li.unit_discount !== undefined && li.unit_discount !== null ? li.unit_discount : "",
                discount_type: li.discount_type || "%",
                billing_frequency: li.billing_frequency || "",
                term: li.term !== undefined && li.term !== null ? li.term : "",
                billing_start_date: li.billing_start_date || "",
                tax_rate: li.tax_rate !== undefined && li.tax_rate !== null ? li.tax_rate : "",
                subtotal: Number(li.subtotal) || 0,
              }))
            );
          }
          if (q.closing_message) {
            setClosingMessage(q.closing_message);
          } else {
            setClosingMessage(
              `${q.company_name || "Workaware"} is thankful for the opportunity to partner with ${q.customer_name || "your team"} to help optimize your operations. If you have any final questions, please email me directly at ${q.prepared_by_email || "steve@zenatech.com"}. We're ready to hit the ground running!`
            );
          }
          if (q.terms && ["3 days", "7 days", "14 days", "30 days"].includes(q.terms)) {
            setQuoteValidity(q.terms);
          } else if (q.validity_days) {
            setQuoteValidity(`${q.validity_days} days`);
          } else if (q.terms) {
            setQuoteValidity(q.terms);
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
  const initialUrlProcessedRef = useRef(false);

  useEffect(() => {
    if (initialUrlProcessedRef.current) return;
    const custId = searchParams.get("customerId") || searchParams.get("customer_id") || searchParams.get("customer");
    const custNameParam = searchParams.get("customerName") || searchParams.get("name");
    if (custId || custNameParam) {
      initialUrlProcessedRef.current = true;
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
            `${companyName} is thankful for the opportunity to partner with ${compName} to help optimize your operations. If you have any final questions, please email me directly at ${preparedByEmail}. We're ready to hit the ground running!`
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
            `${companyName} is thankful for the opportunity to partner with ${compName} to help optimize your operations. If you have any final questions, please email me directly at ${preparedByEmail}. We're ready to hit the ground running!`
          );
        } else if (custNameParam) {
          setCustomerSearch(custNameParam);
          setClientCompanyName(custNameParam);
        }
      });
    }
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
      `${companyName} is thankful for the opportunity to partner with ${val || "your team"} to help optimize your operations. If you have any final questions, please email me directly at ${preparedByEmail}. We're ready to hit the ground running!`
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
    field: keyof QuoteLineItem,
    value: any
  ) => {
    setLineItems((prev) => {
      const next = [...prev];
      const item = { ...next[index], [field]: value };

      const q = item.quantity === "" ? 0 : Number(item.quantity) || 0;
      const p = item.price === "" ? 0 : Number(item.price) || 0;
      const gross = q * p;

      const discVal = item.unit_discount === "" ? 0 : Number(item.unit_discount) || 0;
      let discAmount = 0;
      if (item.discount_type === "$") {
        discAmount = discVal * (q > 0 ? q : 1);
      } else {
        discAmount = gross * (discVal / 100);
      }

      const net = Math.max(0, gross - discAmount);
      item.subtotal = Math.round(net * 100) / 100;

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
        terms: quoteValidity,
        validity_days: parseInt(quoteValidity) || 30,
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
        terms: quoteValidity,
        validity_days: parseInt(quoteValidity) || 30,
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
        currency,
        quote_date: quoteDate,
        validity_days: parseInt(quoteValidity) || 30,
        terms: quoteValidity,
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
        {/* Top Brand Logo & Upload */}
        <div className="flex items-center justify-between">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
            id="quote-paper-logo"
          />

          {logoUrl ? (
            <div className="flex items-center gap-2 group">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="h-12 sm:h-14 max-w-[220px] flex items-center cursor-pointer hover:opacity-85 transition-opacity"
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
                className="p-1 text-slate-400 hover:text-rose-600 print:hidden cursor-pointer"
                title="Remove Logo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 border border-dashed border-slate-300 rounded-lg text-xs text-slate-500 hover:text-amber-600 hover:border-amber-400 cursor-pointer flex items-center gap-2 print:hidden"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Company Logo</span>
            </div>
          )}
        </div>

        {/* 2-Column Header Section: Quotation for vs Date / Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-start pt-1">
          {/* Left Column: Quotation for: */}
          <div className="space-y-1.5 text-slate-900">
            <div className="font-bold text-[15px] mb-1 text-slate-900 flex items-center justify-between">
              <span>Quotation for:</span>
            </div>

            {/* Quick Customer Autocomplete Picker */}
            <div className="print:hidden pb-1">
              <ARCustomerAutocomplete
                customerId={customerId}
                customerName={customerSearch || clientCompanyName}
                onSelect={handleSelectCustomerOption}
                className="w-full"
              />
            </div>

            <Input
              value={clientCompanyName}
              onChange={(e) => handleClientNameChange(e.target.value)}
              placeholder="Client Company Name (e.g. JP Furniture)"
              className="h-7 text-[14px] font-medium border-slate-200 focus:border-amber-500 bg-transparent px-2"
            />

            <Input
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="Client Phone (e.g. [Client.Phone])"
              className="h-7 text-[14px] text-slate-700 border-slate-200 focus:border-amber-500 bg-transparent px-2"
            />

            <Input
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="Contact Person (e.g. Jasper O. I)"
              className="h-7 text-[14px] border-slate-200 focus:border-amber-500 bg-transparent px-2"
            />

            <Input
              value={contactTitle}
              onChange={(e) => setContactTitle(e.target.value)}
              placeholder="Job Title (e.g. Senior Project Manager)"
              className="h-7 text-[14px] border-slate-200 focus:border-amber-500 bg-transparent px-2"
            />

            <Input
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="Contact Email (e.g. jpchrisfurniture@gmail.com)"
              className="h-7 text-[14px] text-slate-700 border-slate-200 focus:border-amber-500 bg-transparent px-2"
            />
          </div>

          {/* Right Column: Date, Quotation No., Quote Validity, Prepared By */}
          <div className="space-y-2 text-slate-900 sm:pl-4">
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
                    selected={(() => {
                      try {
                        if (!quoteDate) return new Date();
                        const clean = quoteDate.replace(/\s+/g, "");
                        const d = new Date(clean);
                        if (!isNaN(d.getTime())) return d;
                        const fallback = new Date(quoteDate);
                        return isNaN(fallback.getTime()) ? new Date() : fallback;
                      } catch {
                        return new Date();
                      }
                    })()}
                    onSelect={(d) => {
                      if (d) {
                        setQuoteDate(format(d, "MM / dd / yyyy"));
                        setIsDateOpen(false);
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2 text-[14px]">
              <span className="font-bold w-32 shrink-0">Quotation No.:</span>
              <Input
                value={quoteNumber}
                onChange={(e) => setQuoteNumber(e.target.value)}
                placeholder="Quote# 29771"
                className="h-7 text-[14px] font-mono border-slate-200 focus:border-amber-500 bg-transparent px-2 flex-1"
              />
            </div>

            <div className="flex items-center gap-2 text-[14px]">
              <span className="font-bold w-32 shrink-0">Quote Validity:</span>
              <Select value={quoteValidity} onValueChange={setQuoteValidity}>
                <SelectTrigger className="h-7 text-[14px] italic text-slate-700 border-slate-200 focus:border-amber-500 bg-transparent px-2 flex-1">
                  <SelectValue placeholder="30 days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3 days">3 days</SelectItem>
                  <SelectItem value="7 days">7 days</SelectItem>
                  <SelectItem value="14 days">14 days</SelectItem>
                  <SelectItem value="30 days">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-3 space-y-1.5 border-t border-slate-100 mt-2">
              <div className="flex items-center gap-2 text-[14px]">
                <span className="font-bold w-32 shrink-0">Prepared By:</span>
                <Input
                  value={preparedByName}
                  onChange={(e) => setPreparedByName(e.target.value)}
                  placeholder="Steve Rhode"
                  className="h-7 text-[14px] border-slate-200 focus:border-amber-500 bg-transparent px-2 flex-1"
                />
              </div>

              <div className="flex items-center gap-2 text-[14px]">
                <span className="w-32 shrink-0 text-slate-400"></span>
                <Input
                  value={preparedByEmail}
                  onChange={(e) => setPreparedByEmail(e.target.value)}
                  placeholder="steve@zenatech.com"
                  className="h-7 text-[14px] text-slate-700 border-slate-200 focus:border-amber-500 bg-transparent px-2 flex-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Table (Matches exact responsive format with all requested fields) */}
        <div className="pt-2">
          <div className="overflow-x-auto border border-slate-200/90 rounded-xl bg-white shadow-2xs">
            <table className="w-full text-left border-collapse min-w-[960px]">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-900 text-[12px] font-bold">
                  <th className="py-2.5 px-3 font-bold min-w-[220px] text-left">Item &amp; Description</th>
                  <th className="py-2.5 px-2 font-bold w-24 text-left">Unit price</th>
                  <th className="py-2.5 px-2 font-bold w-20 text-left">Quantity</th>
                  <th className="py-2.5 px-2 font-bold w-28 text-left">Unit discount</th>
                  <th className="py-2.5 px-2 font-bold w-36 text-left">Billing frequency</th>
                  <th className="py-2.5 px-2 font-bold w-20 text-left">Term</th>
                  <th className="py-2.5 px-2 font-bold w-36 text-left">
                    <span className="inline-flex items-center gap-1">
                      <span>Billing start date</span>
                      <Info className="w-3 h-3 text-slate-400" />
                    </span>
                  </th>
                  <th className="py-2.5 px-2 font-bold w-24 text-left">
                    <span className="inline-flex items-center gap-1">
                      <span>Tax rate</span>
                      <Info className="w-3 h-3 text-slate-400" />
                    </span>
                  </th>
                  <th className="py-2.5 px-3 font-bold w-28 text-left">Net price</th>
                  <th className="py-2.5 px-1 w-8 print:hidden"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[12.5px]">
                {lineItems.map((itm, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 group">
                    <td className="py-2 px-3 space-y-1 align-top">
                      <Input
                        value={itm.name}
                        onChange={(e) => handleLineItemChange(i, "name", e.target.value)}
                        placeholder="Item name..."
                        className="h-7 text-xs font-medium border-slate-200 focus:border-amber-500 bg-transparent px-2"
                      />
                      <Input
                        value={itm.description}
                        onChange={(e) => handleLineItemChange(i, "description", e.target.value)}
                        placeholder="Description (optional)..."
                        className="h-6 text-[11px] font-light text-slate-500 border-slate-200 focus:border-amber-500 bg-transparent px-2"
                      />
                    </td>
                    <td className="py-2 px-2 align-top">
                      <Input
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
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        value={itm.quantity}
                        onChange={(e) => handleLineItemChange(i, "quantity", e.target.value)}
                        placeholder="0"
                        className="h-7 text-xs text-left font-normal border-slate-200 focus:border-amber-500 bg-transparent px-2"
                      />
                    </td>
                    <td className="py-2 px-2 align-top">
                      <div className="flex items-center rounded-md border border-slate-200 bg-white dark:bg-slate-900 focus-within:border-amber-500 overflow-hidden h-7">
                        <select
                          value={itm.discount_type || "%"}
                          onChange={(e) => handleLineItemChange(i, "discount_type", e.target.value as "%" | "$")}
                          className="h-full bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-zinc-300 px-1 border-r border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer"
                        >
                          <option value="%">%</option>
                          <option value="$">$</option>
                        </select>
                        <input
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
                          <SelectItem value="Quarterly">Quarterly</SelectItem>
                          <SelectItem value="Semi-annually">Semi-annually</SelectItem>
                          <SelectItem value="Annually">Annually</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-2 px-2 align-top">
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        value={itm.term}
                        onChange={(e) => handleLineItemChange(i, "term", e.target.value)}
                        placeholder="0"
                        className="h-7 text-xs text-left font-normal border-slate-200 focus:border-amber-500 bg-transparent px-2"
                      />
                    </td>
                    <td className="py-2 px-2 align-top">
                      <Select
                        value={itm.billing_start_date || "none"}
                        onValueChange={(val) => handleLineItemChange(i, "billing_start_date", val === "none" ? "" : val)}
                      >
                        <SelectTrigger className="h-7 text-xs border-slate-200 focus:border-amber-500 bg-transparent px-2">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 z-50">
                          <SelectItem value="none">Select...</SelectItem>
                          <SelectItem value="At payment">At payment</SelectItem>
                          <SelectItem value="Upon signing">Upon signing</SelectItem>
                          <SelectItem value="First of next month">First of next month</SelectItem>
                          <SelectItem value="Immediate">Immediate</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-2 px-2 align-top">
                      <div className="flex items-center rounded-md border border-slate-200 bg-white dark:bg-slate-900 focus-within:border-amber-500 overflow-hidden h-7">
                        <input
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
                    <td className="py-2 px-3 text-left font-mono font-medium text-slate-900 align-top pt-2.5">
                      {formatCurrency(itm.subtotal || 0)}
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
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-2 print:hidden">
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

        {/* Totals Section (Right-aligned under table) */}
        <div className="flex justify-end pt-1">
          <div className="w-72 space-y-2 text-[14px]">
            <div className="flex justify-between items-center text-slate-800">
              <span>Subtotal</span>
              <span className="font-normal">{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex justify-between items-center text-slate-800">
              <span>Discount</span>
              <div className="w-28">
                <Input
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
              <span>Tax</span>
              <div className="w-28">
                <Input
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
        </div>

        {/* Closing Statement & Sign-off (Left-aligned bottom) */}
        <div className="pt-6 space-y-6 text-[13.5px] leading-relaxed text-slate-900">
          <Textarea
            value={closingMessage}
            onChange={(e) => setClosingMessage(e.target.value)}
            placeholder="Workaware is thankful for the opportunity to partner with your team..."
            rows={3}
            className="text-[13.5px] leading-relaxed text-slate-800 border-slate-200 focus:border-amber-500 bg-transparent resize-none p-2 w-full"
          />

          <div className="space-y-2 pt-2">
            <div>Thank you,</div>
            <div className="pt-1 font-medium text-slate-900">{preparedByName || "Steve Rhode"}</div>
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
