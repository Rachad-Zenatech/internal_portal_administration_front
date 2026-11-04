import React from "react";
import { useMutation } from "@tanstack/react-query";
import { arService } from "../../../../../services/arService";
import type { ARAttachment, ARCreateWorkflowPayload, ARLineItem } from "../../../../../types/ar";
import type { NewWorkflowModalProps } from "../types";
import { WORKFLOW_TYPE_CONFIGS } from "../constants";
import type { useNewWorkflowActions } from "./useNewWorkflowActions";
import type { useNewWorkflowActions2 } from "./useNewWorkflowActions2";

export function useNewWorkflowActions3(props: NewWorkflowModalProps, ctx: ReturnType<typeof useNewWorkflowActions> & ReturnType<typeof useNewWorkflowActions2>) {
  const { onOpenChange, onCreated, workflowToEdit } = props;
  const { setIsPreviewOpen, generateDigitalInvoiceHtml, setPreviewTarget, setCashAttachments, setIsDragging, setLineItems, setErrorMsg, resetForm, queryClient, customerId, lineItems, notes, currency, paymentTerms, poNumber, poRequired, quoteNumber, salesRep, customerName, selectedType, amount, renewalDiscountPercent, renewalTermMonths, expiringDate, renContractId, billingMode, billingDayOfMonth, subContractId, subscriptionPlan, addOnItems, accountNumber, consolidatedRenewalAmount, proRatedAmount, extraQuantityRequested, effectiveDate, renewalDate, parentContractId, calculateLineItemsTotal, referenceId, arClerkNotes, arClerkAssignedTo, cashAttachments, matchedInvoices, depositDate, bankingDetails, isCashFullyPaid, selectedCustomer } = ctx;
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
        account_number: "4000",
        account_name: "Operating Revenue",
        item_description: "",
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
      if (field === "item_description" && !item.description) {
        item.description = String(val);
      } else if (field === "description" && !item.item_description) {
        item.item_description = String(val);
      }
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
  const generateSaleMutation = useMutation({
    mutationFn: (payload: any) => arService.generateInvoiceFromSale(payload),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["ar-workflows"] });
      queryClient.invalidateQueries({ queryKey: ["ar-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["ar-customer-template", customerId] });
      onOpenChange(false);
      resetForm();
      if (onCreated) {
        onCreated(data.workflow_id || data.workflowId || data.invoice_id || data.invoiceId || data.id);
      }
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Failed to generate initial sale invoice & sync template");
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
      if (poRequired && !poNumber.trim()) {
        setErrorMsg("PO Reference Number is required when PO is marked as required");
        return;
      }
      finalAmount = calculateLineItemsTotal(lineItems);
      if (finalAmount <= 0) {
        setErrorMsg("Total sales order amount must be greater than zero");
        return;
      }
      payload.sales_rep = salesRep.trim() || "Sales Representative";
      payload.quote_number = quoteNumber.trim() || referenceId.trim() || undefined;
      payload.po_required = poRequired;
      payload.po_number = poNumber.trim() || undefined;
      payload.payment_terms = paymentTerms;
      payload.account_number = accountNumber.trim() || "1100 - Accounts Receivable";
      payload.line_items = lineItems;
      payload.amount = finalAmount;
    } else if (selectedType === "ADD_ON") {
      if (!parentContractId.trim()) {
        setErrorMsg("Parent Contract ID is required");
        return;
      }
      if (!effectiveDate) {
        setErrorMsg("Effective Date is required");
        return;
      }
      if (!renewalDate) {
        setErrorMsg("Existing Contract Renewal Date is required for pro-rata alignment");
        return;
      }
      finalAmount = proRatedAmount > 0 ? proRatedAmount : calculateLineItemsTotal(addOnItems);
      if (finalAmount <= 0) {
        setErrorMsg("Add-on pro-rated amount must be greater than zero");
        return;
      }
      payload.sales_rep = salesRep.trim() || "Sales Representative";
      payload.parent_contract_id = parentContractId.trim();
      payload.renewal_date = renewalDate;
      payload.effective_date = effectiveDate;
      payload.extra_quantity_requested = Number(extraQuantityRequested) || 1;
      payload.pro_rated_amount = proRatedAmount;
      payload.consolidated_renewal_amount = consolidatedRenewalAmount || undefined;
      payload.account_number = accountNumber.trim() || "1100 - Accounts Receivable";
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
    } else if (selectedType === "INITIAL_SALE") {
      generateSaleMutation.mutate({
        customerId: customerId.trim(),
        customerName: customerName.trim() || undefined,
        salesRep: salesRep.trim() || "Sales Representative",
        quoteNumber: quoteNumber.trim() || undefined,
        poRequired: poRequired,
        poNumber: poNumber.trim() || undefined,
        paymentTerms: paymentTerms,
        currency: currency,
        notes: notes.trim() || undefined,
        syncTemplate: true,
        lines: lineItems.map((li) => ({
          accountId: li.account_id,
          accountNumber: li.account_number || "4000",
          accountName: li.account_name || "Operating Revenue",
          itemDescription: li.description || li.item_description || "Sales Item",
          quantity: Number(li.quantity || li.default_quantity) || 1,
          unitPrice: Number(li.unit_price) || 0,
          taxRate: Number(li.tax_rate) || 0,
        })),
      });
    } else {
      createMutation.mutate(payload);
    }
  };
  const selectedConfig = WORKFLOW_TYPE_CONFIGS.find(
    (c) => c.type === selectedType
  )!;
  return { handlePreviewAttachment, handleFilesSelected, handleDragOver, handleDragLeave, handleDrop, handleRemoveCashAttachment, handleAddLineItem, handleUpdateLineItem, handleRemoveLineItem, createMutation, generateSaleMutation, updateMutation, handleSubmit, selectedConfig };
}
