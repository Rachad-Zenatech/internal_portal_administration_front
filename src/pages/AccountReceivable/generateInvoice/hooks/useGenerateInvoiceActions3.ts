import type { MasterProductItem } from "@/services/masterTablesService";
import { normalizeBillingFrequencyForSelect } from "../../utils/lineItemPricingUtils";
import type { InvoiceSubItem, LineItemFormRow } from "../types";
import type { useGenerateInvoiceActions } from "./useGenerateInvoiceActions";
import type { useGenerateInvoiceActions2 } from "./useGenerateInvoiceActions2";
import type { useGenerateInvoiceDerived } from "./useGenerateInvoiceDerived";

export function useGenerateInvoiceActions3(ctx: ReturnType<typeof useGenerateInvoiceActions> & ReturnType<typeof useGenerateInvoiceActions2> & ReturnType<typeof useGenerateInvoiceDerived>) {
  const { computeItemProration, invoiceDate, calculateServicePeriodAndNextBilling, setCurrency, currency, setLineItems, currentInvoiceId, invoiceAmountPaid, invoiceStatus, lineItems } = ctx;
  const handleUpdateLine = (
    index: number,
    field: keyof LineItemFormRow | "total",
    val: any
  ) => {
    setLineItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[index], [field]: val };
      if (field === "currency" && val) {
        if (index === 0 || !currency || currency === "USD") {
          setCurrency(val);
        }
      }

      if (field === "billing_frequency") {
        item.billing_type = val;
      }

      if (field === "billing_frequency" || field === "date" || field === "term" || field === "billing_start_date") {
        const itemDate = item.billing_start_date || item.date || invoiceDate;
        const periods = calculateServicePeriodAndNextBilling(itemDate, item.billing_frequency, item.term);
        item.service_period = periods.service_period;
        item.next_billing_date = periods.next_billing_date;
      }

      if (field === "total") {
        const manualVal = val === "" ? "" : parseFloat(val);
        item.total = manualVal === "" ? "" : (isNaN(manualVal) ? 0 : manualVal);
        item.is_manual_total = val !== "";
        if (val !== "") {
          item.calculation = `Manual Override: $${(Number(item.total) || 0).toFixed(2)}`;
        }
      } else {
        item.is_manual_total = false;
        const isItemPaid = (item.status === "Paid" || item.service_status === "Paid") && item.status !== "Unpaid" && item.service_status !== "Unpaid";
        const effectiveStartDate = item.billing_start_date || item.date || invoiceDate;
        const proration = computeItemProration(
          item.quantity,
          item.unit_price,
          item.unit_discount,
          item.discount_type,
          item.billing_frequency,
          effectiveStartDate,
          item.tax_rate,
          item.term,
          isItemPaid
        );
        item.total = proration.amount;
        item.calculation = proration.formulaString;
        item.badge = proration.badge;
        item.is_prorated = proration.isProrated;
      }
      copy[index] = item;
      return copy;
    });
  };
  const handleAddLine = () => {
    const isBaselinePaid = !!(
      (invoiceStatus && invoiceStatus.toUpperCase().includes("PAID")) ||
      (Number(invoiceAmountPaid) || 0) > 0 ||
      !!currentInvoiceId
    );
    setLineItems((prev) => [
      ...prev,
      {
        date: invoiceDate,
        activity: "",
        description: "",
        currency: currency || "USD",
        quantity: 1,
        unit_price: "",
        unit_discount: "",
        discount_type: "%",
        billing_frequency: "One-Time",
        term: 1,
        billing_start_date: "",
        tax_rate: "",
        total: 0,
        badge: isBaselinePaid ? "Prorated" : "",
        is_prorated: isBaselinePaid,
        status: "Unpaid",
        service_status: "Unpaid",
        sub_items: [],
      },
    ]);
  };
  const handleRemoveLine = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };
  const handleAddSubItem = (parentIndex: number) => {
    setLineItems((prev) => {
      const copy = [...prev];
      const parent = { ...copy[parentIndex] };
      const subs = parent.sub_items ? [...parent.sub_items] : [];
      const parentStartDate = parent.billing_start_date || parent.date || invoiceDate;
      const subFreq = parent.billing_frequency || "Monthly";

      const periods = calculateServicePeriodAndNextBilling(parentStartDate, subFreq, 1);
      subs.push({
        id: `sub-${Date.now()}`,
        date: parent.date || parentStartDate,
        activity: "",
        name: "",
        title: "",
        description: "",
        currency: parent.currency || currency || "USD",
        quantity: 1,
        unit_price: "",
        unit_discount: "",
        discount_type: "%",
        billing_frequency: subFreq,
        term: 1,
        billing_start_date: parentStartDate,
        service_period: periods.service_period || parent.service_period,
        next_billing_date: periods.next_billing_date || parent.next_billing_date,
        tax_rate: "",
        total: 0,
        badge: "Recurring",
        is_prorated: false,
        status: "Unpaid",
        service_status: "Unpaid",
      });
      parent.sub_items = subs;
      copy[parentIndex] = parent;
      return copy;
    });
  };
  const handleRemoveSubItem = (parentIndex: number, subIndex: number) => {
    setLineItems((prev) => {
      const copy = [...prev];
      const parent = { ...copy[parentIndex] };
      if (parent.sub_items) {
        parent.sub_items = parent.sub_items.filter((_, s) => s !== subIndex);
      }
      copy[parentIndex] = parent;
      return copy;
    });
  };
  const handleUpdateSubItem = (
    parentIndex: number,
    subIndex: number,
    field: keyof InvoiceSubItem | "total",
    val: any
  ) => {
    setLineItems((prev) => {
      const copy = [...prev];
      const parent = { ...copy[parentIndex] };
      if (!parent.sub_items) return prev;
      const subs = [...parent.sub_items];
      const sub = { ...subs[subIndex], [field]: val };
      if (field === "currency" && val) {
        if (!currency || currency === "USD") {
          setCurrency(val);
        }
      }

      if (field === "billing_frequency") {
        sub.billing_type = val;
      }

      if (field === "billing_frequency" || field === "date" || field === "term" || field === "billing_start_date") {
        const subDate = sub.billing_start_date || sub.date || parent.billing_start_date || parent.date || invoiceDate;
        const periods = calculateServicePeriodAndNextBilling(subDate, sub.billing_frequency, sub.term);
        sub.service_period = periods.service_period;
        sub.next_billing_date = periods.next_billing_date;
      }

      if (field === "total") {
        const manualVal = val === "" ? "" : parseFloat(val);
        sub.total = manualVal === "" ? "" : (isNaN(manualVal) ? 0 : manualVal);
        sub.is_manual_total = val !== "";
        if (val !== "") {
          sub.calculation = `Manual Override: $${(Number(sub.total) || 0).toFixed(2)}`;
        }
      } else {
        sub.is_manual_total = false;
        const isSubPaid = (sub.status === "Paid" || sub.service_status === "Paid") && sub.status !== "Unpaid" && sub.service_status !== "Unpaid";
        const effectiveSubDate = sub.billing_start_date || sub.date || parent.billing_start_date || parent.date || invoiceDate;
        const subProration = computeItemProration(
          sub.quantity,
          sub.unit_price,
          sub.unit_discount,
          sub.discount_type,
          sub.billing_frequency,
          effectiveSubDate,
          sub.tax_rate,
          sub.term,
          isSubPaid
        );
        sub.total = subProration.amount;
        sub.calculation = subProration.formulaString;
        sub.badge = subProration.badge;
        sub.is_prorated = subProration.isProrated;
      }
      subs[subIndex] = sub;
      parent.sub_items = subs;
      copy[parentIndex] = parent;
      return copy;
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
      const copy = [...prev];
      const prevItem = copy[index] || {};
      const itemDate = prevItem.billing_start_date || prevItem.date || invoiceDate;
      const normFreq = product.billing_frequency ? normalizeBillingFrequencyForSelect(product.billing_frequency) : "";
      const freq = normFreq && normFreq !== "none" ? normFreq : (product.billing_frequency || prevItem.billing_frequency || "One-Time");
      const term = product.term || prevItem.term || 1;
      const periods = calculateServicePeriodAndNextBilling(itemDate, freq, term);

      const isItemPaid = (prevItem.status === "Paid" || prevItem.service_status === "Paid") && prevItem.status !== "Unpaid" && prevItem.service_status !== "Unpaid";
      const proration = computeItemProration(
        prevItem.quantity || 1,
        product.price !== undefined && product.price !== null ? product.price : 0,
        prevItem.unit_discount || "",
        prevItem.discount_type || "%",
        freq,
        prevItem.billing_start_date,
        product.tax_rate || prevItem.tax_rate || "",
        term,
        isItemPaid
      );

      copy[index] = {
        ...prevItem,
        activity: product.name,
        name: product.name,
        description: product.description || prevItem.description || "",
        unit_price: product.price !== undefined && product.price !== null ? product.price : 0,
        currency: prodCurrency || prevItem.currency || currency || "USD",
        billing_frequency: freq,
        billing_type: freq,
        term: term,
        tax_rate: product.tax_rate || prevItem.tax_rate || "",
        service_period: periods.service_period,
        next_billing_date: periods.next_billing_date,
        total: proration.amount,
        calculation: proration.formulaString,
        badge: proration.badge,
        is_prorated: proration.isProrated,
      };
      return copy;
    });
  };
  return { handleUpdateLine, handleAddLine, handleRemoveLine, handleAddSubItem, handleRemoveSubItem, handleUpdateSubItem, handleSelectProduct };
}
