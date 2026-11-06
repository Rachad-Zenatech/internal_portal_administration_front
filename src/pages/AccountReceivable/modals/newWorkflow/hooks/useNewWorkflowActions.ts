import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { arService } from "../../../../../services/arService";
import type { ARAttachment, ARLineItem, ARWorkflowType, MatchedInvoiceItem } from "../../../../../types/ar";
import { type ARCustomerOption } from "../../../fields/ARCustomerAutocomplete";
import { BANK_DETAILS_CATALOG } from "../constants";
import type { NewWorkflowModalProps } from "../types";

export function useNewWorkflowActions(props: NewWorkflowModalProps) {
  const { open, workflowToEdit } = props;
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState<ARWorkflowType>("INITIAL_SALE");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Common AR Customer Contact fields
  const [selectedCustomer, setSelectedCustomer] = useState<ARCustomerOption | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [currency, setCurrency] = useState("USD");
  const [notes, setNotes] = useState("");
  // Beneficiary Bank Settlement state (from selected AR customer)
  const [bankingDetails, setBankingDetails] = useState<Record<string, any>>({});
  const [visibleBankFields, setVisibleBankFields] = useState<string[]>([
    "bank_country",
    "bank_name",
    "bank_account_number",
  ]);
  const [addBankFieldOpen, setAddBankFieldOpen] = useState(false);
  const addBankRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open && workflowToEdit) {
      setStep(2);
      setSelectedType(workflowToEdit.workflow_type);
      setErrorMsg(null);
      setCustomerId(workflowToEdit.customer_id || "");
      setCustomerName(workflowToEdit.customer_name || "");
      setReferenceId(workflowToEdit.reference_id || "");
      setAmount(Number(workflowToEdit.amount) || 0);
      setCurrency(workflowToEdit.currency || "USD");

      const meta = workflowToEdit.metadata || {};
      setNotes(meta.notes || "");

      if (meta.banking_details && Object.keys(meta.banking_details).length > 0) {
        setBankingDetails(meta.banking_details);
        const activeKeys = Object.keys(meta.banking_details).filter((k) => !!meta.banking_details[k]);
        const merged = Array.from(new Set(["bank_country", "bank_name", "bank_account_number", ...activeKeys]));
        setVisibleBankFields(merged);
      } else {
        setBankingDetails({});
        setVisibleBankFields(["bank_country", "bank_name", "bank_account_number"]);
      }

      if (workflowToEdit.workflow_type === "CASH") {
        if (meta.deposit_date) setDepositDate(meta.deposit_date);
        if (meta.matched_invoices) setMatchedInvoices(meta.matched_invoices);
        if (meta.attachments) setCashAttachments(meta.attachments);
        if (meta.ar_clerk_assigned_to) setArClerkAssignedTo(meta.ar_clerk_assigned_to);
        if (meta.ar_clerk_notes) setArClerkNotes(meta.ar_clerk_notes);
        if (meta.account_number || meta.account || meta.gl_code) setAccountNumber(meta.account_number || meta.account || meta.gl_code);
      } else if (workflowToEdit.workflow_type === "INITIAL_SALE") {
        if (meta.payment_terms) setPaymentTerms(meta.payment_terms);
        if (meta.sales_rep) setSalesRep(meta.sales_rep);
        if (meta.quote_number) setQuoteNumber(meta.quote_number);
        if (meta.po_required != null) setPoRequired(Boolean(meta.po_required));
        if (meta.po_number) setPoNumber(meta.po_number);
        if (meta.account_number || meta.account || meta.gl_code) setAccountNumber(meta.account_number || meta.account || meta.gl_code);
        if (meta.line_items && meta.line_items.length > 0) setLineItems(meta.line_items);
      } else if (workflowToEdit.workflow_type === "ADD_ON") {
        if (meta.sales_rep) setSalesRep(meta.sales_rep);
        if (meta.parent_contract_id || meta.parent_workflow_id) setParentContractId(meta.parent_contract_id || meta.parent_workflow_id);
        if (meta.renewal_date) setRenewalDate(meta.renewal_date);
        if (meta.effective_date) setEffectiveDate(meta.effective_date);
        if (meta.extra_quantity_requested != null) setExtraQuantityRequested(Number(meta.extra_quantity_requested));
        if (meta.pro_rated_amount != null) setProRatedAmount(Number(meta.pro_rated_amount));
        if (meta.consolidated_renewal_amount != null) setConsolidatedRenewalAmount(Number(meta.consolidated_renewal_amount));
        if (meta.account_number || meta.account || meta.gl_code) setAccountNumber(meta.account_number || meta.account || meta.gl_code);
        if (meta.add_on_items && meta.add_on_items.length > 0) setAddOnItems(meta.add_on_items);
        else if (meta.line_items && meta.line_items.length > 0) setAddOnItems(meta.line_items);
      } else if (workflowToEdit.workflow_type === "MONTHLY_SUBSCRIPTION") {
        if (meta.subscription_plan) setSubscriptionPlan(meta.subscription_plan);
        if (meta.parent_contract_id || meta.sub_contract_id) setSubContractId(meta.parent_contract_id || meta.sub_contract_id);
        if (meta.billing_day_of_month) setBillingDayOfMonth(Number(meta.billing_day_of_month));
        if (meta.billing_mode) setBillingMode(meta.billing_mode);
      } else if (workflowToEdit.workflow_type === "RENEWAL") {
        if (meta.parent_contract_id || meta.renewal_contract_id) setRenContractId(meta.parent_contract_id || meta.renewal_contract_id);
        if (meta.expiring_date) setExpiringDate(meta.expiring_date);
        if (meta.renewal_period_months) setRenewalTermMonths(Number(meta.renewal_period_months));
        if (meta.price_adjustment_pct != null) setRenewalDiscountPercent(Number(meta.price_adjustment_pct));
      }
    } else if (open && !workflowToEdit) {
      resetForm();
    }
  }, [open, workflowToEdit]);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (addBankRef.current && !addBankRef.current.contains(e.target as Node)) {
        setAddBankFieldOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const availableBankFields = BANK_DETAILS_CATALOG.filter(
    (f) => !visibleBankFields.includes(f.id)
  );
  const [isTemplateLoading, setIsTemplateLoading] = useState(false);
  const [templateLoadedMsg, setTemplateLoadedMsg] = useState<string | null>(null);
  const handleCustomerSelected = async (cust: ARCustomerOption) => {
    if (cust && (cust.id || cust.display_name || cust.name)) {
      setSelectedCustomer(cust);
      const cId = cust.id || "";
      setCustomerId(cId);
      setCustomerName(cust.display_name || cust.name || "");
      if (cust.banking_details && Object.keys(cust.banking_details).length > 0) {
        setBankingDetails(cust.banking_details);
        const activeKeys = Object.keys(cust.banking_details).filter(
          (k) => !!cust.banking_details![k]
        );
        const merged = Array.from(
          new Set(["bank_country", "bank_name", "bank_account_number", ...activeKeys])
        );
        setVisibleBankFields(merged);
        if (cust.banking_details.bank_country?.toLowerCase().includes("canada")) {
          setCurrency("CAD");
        } else if (cust.banking_details.bank_country?.toLowerCase().includes("united states")) {
          setCurrency("USD");
        }
      } else {
        setBankingDetails({});
        setVisibleBankFields(["bank_country", "bank_name", "bank_account_number"]);
      }

      // If in INITIAL_SALE mode, pull linked customer profile & recurring sale template
      if (selectedType === "INITIAL_SALE" && cId) {
        setIsTemplateLoading(true);
        setTemplateLoadedMsg(null);
        try {
          const res = await arService.getCustomerInitialSaleTemplate(cId);
          if (res) {
            if (res.customer?.payment_terms) {
              setPaymentTerms(res.customer.payment_terms);
            }
            if (res.customer?.currency) {
              setCurrency(res.customer.currency);
            }
            if (res.has_template && res.line_items && res.line_items.length > 0) {
              const mappedLines: ARLineItem[] = res.line_items.map((li: any) => ({
                account_id: li.account_id,
                account_number: li.account_number || "4000",
                account_name: li.account_name || "Operating Revenue",
                account_label: li.account_label || `${li.account_number} - ${li.account_name}`,
                item_description: li.item_description || li.description || "",
                description: li.item_description || li.description || "",
                quantity: Number(li.default_quantity || li.quantity) || 1,
                unit_price: Number(li.unit_price) || 0,
                tax_rate: Number(li.tax_rate) || 0,
                amount: (Number(li.default_quantity || li.quantity) || 1) * (Number(li.unit_price) || 0),
              }));
              setLineItems(mappedLines);

              if (res.template?.payment_terms) {
                setPaymentTerms(res.template.payment_terms);
              }
              if (res.template?.sales_rep) {
                setSalesRep(res.template.sales_rep);
              }
              if (res.template?.quote_number) {
                setQuoteNumber(res.template.quote_number);
              }
              if (res.template?.po_required !== undefined) {
                setPoRequired(Boolean(res.template.po_required));
              }
              if (res.template?.notes) {
                setNotes(res.template.notes);
              }
              if (res.template?.currency) {
                setCurrency(res.template.currency);
              }
              setTemplateLoadedMsg(`Loaded recurring template with ${res.line_items.length} line item(s) for ${cust.display_name || cust.name || cId}`);
            } else {
              setTemplateLoadedMsg(null);
            }
          }
        } catch (e) {
          console.error("Failed to load customer initial sale template:", e);
        } finally {
          setIsTemplateLoading(false);
        }
      }
    } else {
      setSelectedCustomer(null);
      setCustomerId("");
      setCustomerName("");
      setBankingDetails({});
      setVisibleBankFields(["bank_country", "bank_name", "bank_account_number"]);
      setTemplateLoadedMsg(null);
    }
  };
  // Cash fields
  const [accountNumber, setAccountNumber] = useState("");
  const [depositDate, setDepositDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [matchedInvoices, setMatchedInvoices] = useState<MatchedInvoiceItem[]>([]);
  const [cashAttachments, setCashAttachments] = useState<ARAttachment[]>([]);
  const [arClerkAssignedTo, setArClerkAssignedTo] = useState("sarah.jenkins@zenatech.com");
  const [arClerkNotes, setArClerkNotes] = useState("");
  // Initial Sale fields (Sales Representative -> Account Receivable Assigned User -> Treasury Assigned User)
  const [salesRep, setSalesRep] = useState("");
  const [quoteNumber, setQuoteNumber] = useState("");
  const [poRequired, setPoRequired] = useState(false);
  const [poNumber, setPoNumber] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [lineItems, setLineItems] = useState<ARLineItem[]>([
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
  // Add-on fields (Sales Representative -> Account Receivable Assigned User -> Treasury Assigned User -> System Renewal Consolidation)
  const [parentContractId, setParentContractId] = useState("");
  const [renewalDate, setRenewalDate] = useState(
    new Date(Date.now() + 180 * 86400000).toISOString().split("T")[0]
  );
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [extraQuantityRequested, setExtraQuantityRequested] = useState<number>(1);
  const [proRatedAmount, setProRatedAmount] = useState<number>(0);
  const [consolidatedRenewalAmount, setConsolidatedRenewalAmount] = useState<number>(0);
  const [addOnItems, setAddOnItems] = useState<ARLineItem[]>([
    {
      description: "",
      quantity: 1,
      unit_price: 0,
      tax_rate: 0,
      amount: 0,
    },
  ]);
  // Subscription fields
  const [subscriptionPlan, setSubscriptionPlan] = useState("");
  const [subContractId, setSubContractId] = useState("");
  const [billingDayOfMonth, setBillingDayOfMonth] = useState<number>(1);
  const [billingMode, setBillingMode] = useState("AUTO_CHARGE");
  // Renewal fields
  const [renContractId, setRenContractId] = useState("");
  const [expiringDate, setExpiringDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]
  );
  const [renewalTermMonths, setRenewalTermMonths] = useState<number>(12);
  const [renewalDiscountPercent, setRenewalDiscountPercent] = useState<number>(0);
  const resetForm = () => {
    setStep(1);
    setSelectedType("INITIAL_SALE");
    setErrorMsg(null);
    setSelectedCustomer(null);
    setCustomerId("");
    setCustomerName("");
    setReferenceId("");
    setAmount(0);
    setCurrency("USD");
    setNotes("");
    setAccountNumber("");
    setBankingDetails({});
    setVisibleBankFields(["bank_country", "bank_name", "bank_account_number"]);
    setMatchedInvoices([]);
    setCashAttachments([]);
    setArClerkAssignedTo("sarah.jenkins@zenatech.com");
    setArClerkNotes("");
    setSalesRep("Steve (Sales)");
    setQuoteNumber("");
    setPoRequired(false);
    setPoNumber("");
    setRenewalDate(new Date(Date.now() + 180 * 86400000).toISOString().split("T")[0]);
    setEffectiveDate(new Date().toISOString().split("T")[0]);
    setExtraQuantityRequested(1);
    setConsolidatedRenewalAmount(0);
    setTemplateLoadedMsg(null);
    setIsTemplateLoading(false);
    setLineItems([
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
    setAddOnItems([
      {
        description: "",
        quantity: 1,
        unit_price: 0,
        tax_rate: 0,
        amount: 0,
      },
    ]);
    setProRatedAmount(0);
    setSubscriptionPlan("");
    setParentContractId("");
    setSubContractId("");
    setRenContractId("");
  };
  const calculateLineItemsTotal = (items: ARLineItem[]) => {
    return items.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  };
  const calculateMatchedInvoicesTotal = (items: MatchedInvoiceItem[]) => {
    return items.reduce((acc, curr) => acc + (Number(curr.amount_applied) || 0), 0);
  };
  const calculateTotalInvoiceAmounts = (items: MatchedInvoiceItem[]) => {
    return items.reduce((acc, curr) => acc + (Number(curr.invoice_total) || 0), 0);
  };
  const isCashFullyPaid = () => {
    if (matchedInvoices.length === 0) return true;
    const totalApplied = calculateMatchedInvoicesTotal(matchedInvoices);
    const totalInvoices = calculateTotalInvoiceAmounts(matchedInvoices);
    const allItemsFull = matchedInvoices.every((inv) => inv.amount_applied >= inv.invoice_total);
    return amount >= totalApplied && (totalApplied >= totalInvoices || allItemsFull);
  };
  const handleAddMatchedInvoice = () => {
    setMatchedInvoices((prev) => [
      ...prev,
      {
        invoice_number: "",
        currency: currency || "USD",
        invoice_total: 0,
        amount_applied: 0,
        balance_remaining: 0,
        status: "FULLY_PAID",
      },
    ]);
  };
  const handleUpdateMatchedInvoice = (
    index: number,
    field: keyof MatchedInvoiceItem,
    val: any
  ) => {
    setMatchedInvoices((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: val };
      const total = Number(item.invoice_total) || 0;
      const applied = Number(item.amount_applied) || 0;
      item.balance_remaining = Math.max(0, Math.round((total - applied) * 100) / 100);
      item.status = applied >= total ? "FULLY_PAID" : "PARTIALLY_PAID";
      updated[index] = item;
      return updated;
    });
  };
  return { queryClient, step, setStep, selectedType, setSelectedType, errorMsg, setErrorMsg, selectedCustomer, customerId, customerName, setCustomerName, referenceId, amount, setAmount, currency, setCurrency, notes, setNotes, bankingDetails, setBankingDetails, visibleBankFields, setVisibleBankFields, addBankFieldOpen, setAddBankFieldOpen, addBankRef, availableBankFields, isTemplateLoading, templateLoadedMsg, handleCustomerSelected, accountNumber, setAccountNumber, depositDate, setDepositDate, matchedInvoices, setMatchedInvoices, cashAttachments, setCashAttachments, arClerkAssignedTo, setArClerkAssignedTo, arClerkNotes, setArClerkNotes, salesRep, setSalesRep, quoteNumber, setQuoteNumber, poRequired, setPoRequired, poNumber, setPoNumber, paymentTerms, setPaymentTerms, lineItems, setLineItems, parentContractId, setParentContractId, renewalDate, setRenewalDate, effectiveDate, setEffectiveDate, extraQuantityRequested, setExtraQuantityRequested, proRatedAmount, setProRatedAmount, consolidatedRenewalAmount, setConsolidatedRenewalAmount, addOnItems, setAddOnItems, subscriptionPlan, setSubscriptionPlan, subContractId, setSubContractId, billingDayOfMonth, setBillingDayOfMonth, billingMode, setBillingMode, renContractId, setRenContractId, expiringDate, setExpiringDate, renewalTermMonths, setRenewalTermMonths, renewalDiscountPercent, setRenewalDiscountPercent, resetForm, calculateLineItemsTotal, calculateMatchedInvoicesTotal, calculateTotalInvoiceAmounts, isCashFullyPaid, handleAddMatchedInvoice, handleUpdateMatchedInvoice };
}
