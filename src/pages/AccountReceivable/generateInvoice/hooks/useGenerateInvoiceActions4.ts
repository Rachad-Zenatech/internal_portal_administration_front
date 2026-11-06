import { format, addDays } from "date-fns";
import type { CustomerInvoiceTemplate } from "../../../../services/arInvoiceService";
import type { MasterProductItem } from "@/services/masterTablesService";
import { normalizeBillingFrequencyForSelect } from "../../utils/lineItemPricingUtils";
import type { InvoiceLayoutStyle } from "../types";
import type { useGenerateInvoiceActions } from "./useGenerateInvoiceActions";
import type { useGenerateInvoiceActions2 } from "./useGenerateInvoiceActions2";
import type { useGenerateInvoiceDerived } from "./useGenerateInvoiceDerived";
import type { useGenerateInvoiceActions3 } from "./useGenerateInvoiceActions3";

export function useGenerateInvoiceActions4(ctx: ReturnType<typeof useGenerateInvoiceActions> & ReturnType<typeof useGenerateInvoiceActions2> & ReturnType<typeof useGenerateInvoiceDerived> & ReturnType<typeof useGenerateInvoiceActions3>) {
  const { currency, computeItemProration, calculateServicePeriodAndNextBilling, invoiceDate, setLineItems, setCurrency, setWireRouting, setAchRouting, setBankAccount, setBankAddress, setBankName, setFromAddress, setFromEmail, setFromPhone, setFromCompany, setLayoutStyle, setBankEmail, setNotes, setBillToEmail, setBillToAddress, setBillToPhone, setBillToName, setFromContact, setPoNumber, setTerms, setDueDate, setInvoiceDate, setInvoiceNumber, setTemplateName, setSelectedTemplateId, setCurrentInvoiceId, calculatedTotals, lineItems, bankEmail, wireRouting, achRouting, bankAddress, bankAccount, bankName, notes, terms, dueDate, poNumber, billToEmail, billToAddress, billToPhone, billToName, fromEmail, fromAddress, fromPhone, fromContact, fromCompany, invoiceNumber, selectedCustomer, layoutStyle, templateName, selectedTemplateId, invoiceStatus, currentInvoiceId } = ctx;
  const handleSelectSubProduct = (parentIndex: number, subIndex: number, product: MasterProductItem) => {
    const prodCurrency = (product.currency || "").trim();
    if (prodCurrency) {
      if (!currency || currency === "USD") {
        setCurrency(prodCurrency);
      }
    }

    setLineItems((prev) => {
      const copy = [...prev];
      const parent = { ...copy[parentIndex] };
      if (!parent.sub_items) return prev;
      const subs = [...parent.sub_items];
      const sub = { ...subs[subIndex] };
      const subDate = sub.billing_start_date || sub.date || parent.billing_start_date || parent.date || invoiceDate;
      const normFreq = product.billing_frequency ? normalizeBillingFrequencyForSelect(product.billing_frequency) : "";
      const freq = normFreq && normFreq !== "none" ? normFreq : (product.billing_frequency || sub.billing_frequency || parent.billing_frequency || "Monthly");
      const term = product.term || sub.term || 1;
      const periods = calculateServicePeriodAndNextBilling(subDate, freq, term);

      const isSubPaid = (sub.status === "Paid" || sub.service_status === "Paid") && sub.status !== "Unpaid" && sub.service_status !== "Unpaid";
      const subProration = computeItemProration(
        sub.quantity || 1,
        product.price !== undefined && product.price !== null ? product.price : 0,
        sub.unit_discount || "",
        sub.discount_type || "%",
        freq,
        sub.billing_start_date,
        product.tax_rate || sub.tax_rate || "",
        term,
        isSubPaid
      );

      subs[subIndex] = {
        ...sub,
        activity: product.name,
        name: product.name,
        title: product.name,
        description: product.description || sub.description || "",
        unit_price: product.price !== undefined && product.price !== null ? product.price : 0,
        currency: prodCurrency || sub.currency || parent.currency || currency || "USD",
        billing_frequency: freq,
        billing_type: freq,
        term: term,
        tax_rate: product.tax_rate || sub.tax_rate || "",
        service_period: periods.service_period,
        next_billing_date: periods.next_billing_date,
        total: subProration.amount,
        calculation: subProration.formulaString,
        badge: subProration.badge,
        is_prorated: subProration.isProrated,
      };
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
  return { handleSelectSubProduct, handleSelectInvoiceTemplate, handleResetForm, currentPayload };
}
