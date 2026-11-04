import { arQuoteService } from "../../../../services/arQuoteService";
import type { ARQuote } from "../../../../services/arQuoteService";
import { calculateRowPricing, normalizeBillingFrequencyForSelect } from "../../utils/lineItemPricingUtils";
import type { MasterProductItem } from "@/services/masterTablesService";
import type { QuoteLineItem } from "../types";
import { createEmptyQuoteLineItem } from "../utils";
import type { useGenerateQuotePageActions } from "./useGenerateQuotePageActions";

export function useGenerateQuotePageActions2(ctx: ReturnType<typeof useGenerateQuotePageActions>) {
  const { setLineItems, quoteType, setCurrency, currency, lineItems, discount, tax, setIsSaving, setSaveSuccessMsg, quoteNumber, navigate, quoteId, queryClient, setPublicationState, setQuoteId, servicePeriodLabel, sourceInvoiceNumber, sourceInvoiceId, quoteValidity, notes, closingMessage, logoUrl, companyName, preparedByEmail, preparedByName, quoteDate, billingAddress, contactTitle, contactPerson, clientPhone, clientEmail, clientCompanyName, customerId, setClosingMessage, setNotes, setTax, setDiscount, setSelectedCustomer, setCustomerSearch, setCustomerId, setBillingAddress, setClientEmail, setContactTitle, setContactPerson, setClientPhone, setClientCompanyName, customerResponseState, publicationState, currentVersion } = ctx;
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
    if (field === "currency" && value) {
      if (index === 0 || !currency || currency === "USD") {
        setCurrency(value);
      }
    }

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
        const isLineRenewal = quoteType === "RENEWAL" || !!item.is_renewal;
        const isFreqChange = field === "billing_frequency";
        const explicitProrated = isFreqChange ? undefined : (isLineRenewal ? false : item.is_prorated);
        const pricing = calculateRowPricing({
          quantity: item.quantity,
          unit_price: item.price,
          unit_discount: item.unit_discount,
          discount_type: item.discount_type,
          billing_frequency: item.billing_frequency,
          term: item.term,
          billing_start_date: item.billing_start_date,
          tax_rate: item.tax_rate,
          is_renewal: isLineRenewal,
          is_prorated: explicitProrated,
          quote_type: quoteType,
        });

        item.subtotal = pricing.amount;
        item.calculation = pricing.formulaString;
        item.is_renewal = isLineRenewal;
        item.is_prorated = pricing.isProrated;
        item.badge = pricing.badge;
      }

      next[index] = item;
      return next;
    });
  };
  const handleClearLineItem = (index: number) => {
    setLineItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...createEmptyQuoteLineItem(),
        currency: next[index]?.currency || currency || "USD",
      };
      return next;
    });
  };
  const handleSelectProduct = (index: number, product: MasterProductItem) => {
    const prodCurrency = (product.currency || "").trim();
    if (prodCurrency) {
      if (index === 0 || !currency || currency === "USD") {
        setCurrency(prodCurrency);
      }
    }

    setLineItems((prev) => {
      const next = [...prev];
      const isLineRenewal = quoteType === "RENEWAL" || !!next[index]?.is_renewal;

      const normFreq = product.billing_frequency ? normalizeBillingFrequencyForSelect(product.billing_frequency) : "";
      const mappedFreq = normFreq && normFreq !== "none" ? normFreq : (product.billing_frequency || "");

      const updated = {
        ...next[index],
        name: product.name,
        description: product.description || next[index]?.description || "",
        price: product.price !== undefined && product.price !== null ? product.price : 0,
        currency: prodCurrency || next[index]?.currency || currency || "USD",
        billing_frequency: mappedFreq,
        term: product.term || next[index]?.term || 1,
        tax_rate: product.tax_rate !== undefined && product.tax_rate !== null ? product.tax_rate : (next[index]?.tax_rate || ""),
      };
      const pricing = calculateRowPricing({
        quantity: updated.quantity,
        unit_price: updated.price,
        unit_discount: updated.unit_discount,
        discount_type: updated.discount_type,
        billing_frequency: updated.billing_frequency,
        term: updated.term,
        billing_start_date: updated.billing_start_date,
        tax_rate: updated.tax_rate,
        is_renewal: isLineRenewal,
        quote_type: quoteType,
      });
      updated.subtotal = pricing.amount;
      updated.calculation = pricing.formulaString;
      updated.is_renewal = isLineRenewal;
      updated.is_prorated = pricing.isProrated;
      updated.badge = pricing.badge;
      next[index] = updated;
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
        quote_type: quoteType,
        source_invoice_id: sourceInvoiceId || undefined,
        source_invoice_number: sourceInvoiceNumber || undefined,
        service_period_label: servicePeriodLabel || undefined,
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
        quote_type: quoteType,
        source_invoice_id: sourceInvoiceId || undefined,
        source_invoice_number: sourceInvoiceNumber || undefined,
        service_period_label: servicePeriodLabel || undefined,
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
  const handleClearQuoteForm = () => {
    if (lineItems.some((it) => it.name) || clientCompanyName) {
      if (!window.confirm("Are you sure you want to clear all quote form fields?")) {
        return;
      }
    }
    setClientCompanyName("");
    setClientPhone("");
    setContactPerson("");
    setContactTitle("");
    setClientEmail("");
    setBillingAddress("");
    setCustomerId("");
    setCustomerSearch("");
    setSelectedCustomer(null);
    setLineItems([createEmptyQuoteLineItem()]);
    setDiscount(0);
    setTax(0);
    setNotes("");
    setClosingMessage("");
    setSaveSuccessMsg(null);
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
  return { handleRemoveLineItem, handleLineItemChange, handleClearLineItem, handleSelectProduct, subtotal, discountAmount, taxAmount, totalAmount, formatCurrency, handlePrintPdf, handleSaveDraft, handlePublishQuote, handleDeleteDraft, handleClearQuoteForm, currentQuoteObj };
}
