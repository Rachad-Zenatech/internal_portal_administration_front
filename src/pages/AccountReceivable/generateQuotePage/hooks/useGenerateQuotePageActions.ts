import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { arInvoiceService, type ARCustomer } from "../../../../services/arInvoiceService";
import { financeService } from "../../../../services/financeService";
import { arQuoteService } from "../../../../services/arQuoteService";
import type { PublicationState } from "../../../../services/arQuoteService";
import { useAuth } from "../../../../lib/AuthContext";
import type { ARCustomerOption } from "../../fields/ARCustomerAutocomplete";
import { calculateRowPricing, formatDateOnly } from "../../utils/lineItemPricingUtils";
import { oauthService } from "@/services/oauthService";
import type { QuoteLineItem } from "../types";
import { createEmptyQuoteLineItem } from "../utils";

export function useGenerateQuotePageActions() {
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
  const [quoteType, setQuoteType] = useState<string>("STANDARD");
  const [sourceInvoiceNumber, setSourceInvoiceNumber] = useState<string>("");
  const [sourceInvoiceId, setSourceInvoiceId] = useState<string>("");
  const [servicePeriodLabel, setServicePeriodLabel] = useState<string>("");
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
          if (q.quote_type) setQuoteType(q.quote_type);
          if (q.source_invoice_number) setSourceInvoiceNumber(q.source_invoice_number);
          if (q.source_invoice_id) setSourceInvoiceId(q.source_invoice_id);
          if (q.service_period_label) setServicePeriodLabel(q.service_period_label);

          if (q.quote_date) {
            setQuoteDate(formatDateOnly(q.quote_date, "MM / dd / yyyy"));
          }

          if (q.line_items && q.line_items.length > 0) {
            const isRenewalQuote = (q.quote_type || "").toUpperCase() === "RENEWAL";
            setLineItems(
              q.line_items.map((li: any) => {
                const isLineRenewal = isRenewalQuote || !!li.is_renewal || li.badge === "Renewal";
                const isLineProrated = isLineRenewal ? false : li.is_prorated;
                const pricing = calculateRowPricing({
                  quantity: li.quantity !== undefined && li.quantity !== null && li.quantity !== "" ? li.quantity : 1,
                  unit_price: li.price !== undefined && li.price !== null && li.price !== "" ? li.price : (li.unit_price || 0),
                  unit_discount: li.unit_discount !== undefined && li.unit_discount !== null ? li.unit_discount : 0,
                  discount_type: li.discount_type || "%",
                  billing_frequency: li.billing_frequency || li.billing_type || "",
                  term: li.term !== undefined && li.term !== null && li.term !== "" ? li.term : 1,
                  billing_start_date: li.billing_start_date || li.service_period_start || "",
                  tax_rate: li.tax_rate !== undefined && li.tax_rate !== null ? li.tax_rate : 0,
                  is_renewal: isLineRenewal,
                  is_prorated: isLineProrated,
                  quote_type: q.quote_type || "STANDARD",
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
                  billing_start_date: li.billing_start_date || li.service_period_start || "",
                  tax_rate: li.tax_rate !== undefined && li.tax_rate !== null ? li.tax_rate : "",
                  subtotal: li.subtotal !== undefined ? Number(li.subtotal) : pricing.amount,
                  calculation: li.calculation || pricing.formulaString,
                  is_renewal: isLineRenewal,
                  is_prorated: isLineProrated,
                  badge: pricing.badge,
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
    const hsCompId = searchParams.get("hubspotCompanyId") || searchParams.get("companyId");
    const currentSignature = `${custId || ""}_${custNameParam || ""}_${hsCompId || ""}`;

    if (!custId && !custNameParam && !hsCompId) {
      lastProcessedUrlSignatureRef.current = "";
      return;
    }

    if (lastProcessedUrlSignatureRef.current === currentSignature) {
      return;
    }

    lastProcessedUrlSignatureRef.current = currentSignature;

    if (hsCompId) {
      setCustomerId(hsCompId);
      oauthService.getHubSpotCompanies().then((res) => {
        const comp = (res?.items || []).find(
          (c) => c.hubspot_id.toLowerCase() === hsCompId.toLowerCase() || String(c.id) === hsCompId
        );
        if (comp) {
          setCustomerSearch(comp.name);
          setClientCompanyName(comp.name);
          if (comp.phone || comp.contact_phone) setClientPhone(comp.phone || comp.contact_phone);
          if (comp.contact_name) setContactPerson(comp.contact_name);
          if (comp.billing_email || comp.contact_email) setClientEmail(comp.billing_email || comp.contact_email);
          if (comp.address) setBillingAddress(comp.address);
          if (comp.currency) setCurrency(comp.currency);
          setClosingMessage(
            companyName
              ? `${companyName} is thankful for the opportunity to partner with ${comp.name} to help optimize your operations. If you have any final questions, please email me directly at ${preparedByEmail}. We're ready to hit the ground running!`
              : `We are thankful for the opportunity to partner with ${comp.name} to help optimize your operations. If you have any final questions, please email me directly at ${preparedByEmail}. We're ready to hit the ground running!`
          );
        }
      }).catch((e) => console.debug("Error loading HubSpot company for quote:", e));
    }

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

    if (custOption.currency) {
      setCurrency(custOption.currency);
    }

    setClosingMessage(
      `${companyName} is thankful for the opportunity to partner with ${compName} to help optimize your operations. If you have any final questions, please email me directly at ${preparedByEmail}. We're ready to hit the ground running!`
    );
  };
  const handleAddLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        ...createEmptyQuoteLineItem(),
        currency: currency || "USD",
      },
    ]);
  };
  return { navigate, queryClient, fileInputRef, formTopRef, quoteId, setQuoteId, customerId, setCustomerId, customerSearch, setCustomerSearch, setSelectedCustomer, saveSuccessMsg, setSaveSuccessMsg, isSaving, setIsSaving, isSendModalOpen, setIsSendModalOpen, logoUrl, publicationState, setPublicationState, currentVersion, customerResponseState, quoteNumber, setQuoteNumber, quoteDate, setQuoteDate, isDateOpen, setIsDateOpen, quoteValidity, setQuoteValidity, currency, setCurrency, quoteType, sourceInvoiceNumber, sourceInvoiceId, servicePeriodLabel, preparedByName, setPreparedByName, preparedByEmail, setPreparedByEmail, companyName, setCompanyName, clientCompanyName, setClientCompanyName, clientPhone, setClientPhone, contactPerson, setContactPerson, contactTitle, setContactTitle, clientEmail, setClientEmail, billingAddress, setBillingAddress, lineItems, setLineItems, discount, setDiscount, tax, setTax, closingMessage, setClosingMessage, notes, setNotes, handleLogoUpload, handleRemoveLogo, handleClientNameChange, handleSelectCustomerOption, handleAddLineItem };
}
