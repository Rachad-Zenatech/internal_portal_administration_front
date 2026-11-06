import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { format, parse, isValid, addDays, addMonths } from "date-fns";
import { arInvoiceService } from "../../../../services/arInvoiceService";
import { arQuoteService } from "../../../../services/arQuoteService";
import type { ARCustomer } from "../../../../services/arInvoiceService";
import { oauthService } from "@/services/oauthService";
import { calculateRowPricing, normalizeBillingFrequencyForSelect } from "../../utils/lineItemPricingUtils";
import type { InvoiceLayoutStyle } from "../types";
import type { useGenerateInvoiceActions } from "./useGenerateInvoiceActions";

export function useGenerateInvoiceActions2(ctx: ReturnType<typeof useGenerateInvoiceActions>) {
  const { handleSelectCustomerOption, setIsQuickEditOpen, billToAddress, selectedCustomer, setEditCustAddress, billToEmail, setEditCustEmail, billToPhone, setEditCustPhone, billToName, setEditCustContact, setEditCustDisplayName, setTemplateLoadedToast, setBillToAddress, setBillToEmail, setBillToPhone, setBillToName, setSelectedCustomer, queryClient, editCustAddress, editCustEmail, editCustPhone, editCustContact, editCustDisplayName, setIsRecordPaymentOpen, setPaymentNotesInput, setPaymentClassInput, setPaymentGLCodeInput, setPaymentRefInput, setPaymentDateInput, setPaymentMethodInput, setPaymentAmountInput, setIsPaymentSubmitting, setSaveSuccessMsg, currency, setInvoicePayments, setInvoiceAmountPaid, setInvoiceStatus, currentInvoiceId, paymentNotesInput, paymentClassInput, paymentGLCodeInput, paymentRefInput, paymentDateInput, paymentMethodInput, paymentAmountInput, customers, searchParams, setInvoiceNumber, setCurrentInvoiceId, setIsTemplateLoading, invoiceDate, setLineItems, setNotes, setCustomerSearch, setFromEmail, setFromContact, setFromCompany, setTerms, setDueDate, setInvoiceDate, setCurrency, setPoNumber, setBankEmail, setWireRouting, setAchRouting, setBankAddress, setBankAccount, setBankName, setFromAddress, setFromPhone, setSelectedTemplateId, setLayoutStyle, location, invoiceNumber, dueDate, invoiceAmountPaid, lineItems } = ctx;
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
  // Initial load from URL query params (either specific invoiceId, quoteId, customerId or hubspotCompanyId)
  useEffect(() => {
    const invId = searchParams.get("invoiceId");
    const custId = searchParams.get("customerId");
    const qId = searchParams.get("quoteId") || searchParams.get("quote_id") || searchParams.get("fromQuote");
    const hsCompId = searchParams.get("hubspotCompanyId") || searchParams.get("companyId");
    const signature = `inv:${invId || ""}|cust:${custId || ""}|q:${qId || ""}|hs:${hsCompId || ""}`;

    if (lastProcessedUrlSignatureRef.current === signature) return;
    lastProcessedUrlSignatureRef.current = signature;

    if (hsCompId) {
      setCurrentInvoiceId(null);
      oauthService.getHubSpotCompanies().then((res) => {
        const comp = (res?.items || []).find(
          (c) => c.hubspot_id.toLowerCase() === hsCompId.toLowerCase() || String(c.id) === hsCompId
        );
        if (comp) {
          const cust: ARCustomer = {
            id: comp.hubspot_id,
            name: comp.name,
            display_name: comp.name,
            contact_person: comp.contact_name || undefined,
            phone: comp.phone || comp.contact_phone || undefined,
            email: comp.billing_email || comp.contact_email || undefined,
            billing_address: comp.address || undefined,
            hubspot_id: comp.hubspot_id,
          };
          setSelectedCustomer(cust);
          setCustomerSearch(comp.name);
          setBillToName(comp.name);
          if (comp.phone || comp.contact_phone) setBillToPhone(comp.phone || comp.contact_phone);
          if (comp.address) setBillToAddress(comp.address);
          if (comp.billing_email || comp.contact_email) setBillToEmail(comp.billing_email || comp.contact_email);
          if (comp.currency) setCurrency(comp.currency);
          setTemplateLoadedToast(`Loaded A/R Company: ${comp.name}`);
        }
      }).catch((e) => console.debug("Error loading HubSpot company for invoice:", e));
    }

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
      // Matched by id but with a different name = the user is editing the name; don't snap it back.
      const isNameEdit =
        !!match &&
        match.id === selectedCustomer.id &&
        (match.display_name || "").toLowerCase() !== (selectedCustomer.display_name || "").toLowerCase();
      if (match && !isNameEdit && (match.id !== selectedCustomer.id || match.display_name !== selectedCustomer.display_name)) {
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
  return { handleOpenQuickEdit, updateCustomerMutation, handleOpenRecordPayment, handleConfirmRecordPayment, parseFlexibleDate, getSelectedCalendarDate, getSelectedDueDate, handleTermsChange, getChargeablePeriodLabel, calculateServicePeriodAndNextBilling, computeItemProration, calculatedTotals, subTotal };
}
