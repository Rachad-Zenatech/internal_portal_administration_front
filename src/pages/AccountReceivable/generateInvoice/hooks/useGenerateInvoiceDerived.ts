import { useMemo } from "react";
import { isValid } from "date-fns";
import type { useGenerateInvoiceActions } from "./useGenerateInvoiceActions";
import type { useGenerateInvoiceActions2 } from "./useGenerateInvoiceActions2";

export function useGenerateInvoiceDerived(ctx: ReturnType<typeof useGenerateInvoiceActions> & ReturnType<typeof useGenerateInvoiceActions2>) {
  const { calculatedTotals, invoiceStatus, dueDate, parseFlexibleDate, currency, lineItems, invoiceDate, nextInvoiceEligibility } = ctx;
  // Compute Payment Due Date status badge & reminder indicators
  const dueDateInfo = useMemo(() => {
    if (!dueDate) return null;
    const due = parseFlexibleDate(dueDate);
    if (!isValid(due)) return null;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    const isPaid = (invoiceStatus || "").toUpperCase().startsWith("PAID") || calculatedTotals.effectiveBalanceDue === 0;

    if (isPaid) {
      return {
        label: "Settled & Paid",
        variant: "paid",
        diffDays,
        text: "Paid in full",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700",
      };
    }
    if (diffDays < 0) {
      const overdueDays = Math.abs(diffDays);
      return {
        label: `Overdue by ${overdueDays} ${overdueDays === 1 ? "day" : "days"}`,
        variant: "overdue",
        diffDays,
        text: `Past due date (${dueDate})`,
        badgeClass: "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-700 font-bold",
      };
    }
    if (diffDays === 0) {
      return {
        label: "Payment Due Today",
        variant: "due_today",
        diffDays,
        text: "Payment is due today",
        badgeClass: "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700 font-bold",
      };
    }
    if (diffDays <= 7) {
      return {
        label: `Due in ${diffDays} ${diffDays === 1 ? "day" : "days"} • Auto-Reminder Active`,
        variant: "due_soon",
        diffDays,
        text: `Payment due within 7 days (${dueDate})`,
        badgeClass: "bg-orange-50 text-orange-800 border-orange-300 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-700 font-bold",
      };
    }
    return {
      label: `Due in ${diffDays} days`,
      variant: "upcoming",
      diffDays,
      text: `Due on ${dueDate}`,
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    };
  }, [dueDate, invoiceStatus, calculatedTotals.effectiveBalanceDue]);
  // Dynamically compute Next Renewal Projection from live lineItems & sub-items
  const computedNextRenewal = useMemo(() => {
    if (!lineItems || lineItems.length === 0) return null;

    type RenewalComponent = {
      name: string;
      quantity: number;
      unit_price: number;
      total: number;
      frequency: string;
      isSeat?: boolean;
    };

    const components: RenewalComponent[] = [];
    let primaryFrequency = "Annually";
    let hasAnyRecurring = false;

    lineItems.forEach((item, idx) => {
      const bfRaw = (item.billing_frequency || "").trim();
      const isOneTime = bfRaw.toLowerCase() === "one-time" || bfRaw.toLowerCase() === "once" || bfRaw.toLowerCase() === "none";
      const isExplicitRecurring = bfRaw !== "" && !isOneTime;

      // Has recurring sub-items?
      const hasRecurringSubs = (item.sub_items || []).some(sub => {
        const sbf = (sub.billing_frequency || "").trim().toLowerCase();
        return sbf !== "one-time" && sbf !== "once" && sbf !== "none";
      });

      // Item is recurring if explicitly recurring, or if it has recurring sub-items, or if billing frequency is set
      const isItemRecurring = isExplicitRecurring || (bfRaw === "" && hasRecurringSubs);

      const qty = Number(item.quantity) || 0;
      const price = Number(item.unit_price) || 0;
      const discount = Number(item.unit_discount) || 0;
      const netUnitPrice = Math.max(0, price - discount);
      const itemTotal = qty * netUnitPrice;

      if (isItemRecurring && qty > 0) {
        hasAnyRecurring = true;
        const itemFreq = isExplicitRecurring ? bfRaw : "Annually";
        primaryFrequency = itemFreq;
        const itemName = item.activity || item.name || `Item ${idx + 1}`;
        const isSeat = itemName.toLowerCase().includes("seat");

        components.push({
          name: itemName,
          quantity: qty,
          unit_price: netUnitPrice,
          total: itemTotal,
          frequency: itemFreq,
          isSeat,
        });
      }

      // Check sub-items
      if (item.sub_items && item.sub_items.length > 0) {
        item.sub_items.forEach((sub, sIdx) => {
          const sbfRaw = (sub.billing_frequency || "").trim();
          const subIsOneTime = sbfRaw.toLowerCase() === "one-time" || sbfRaw.toLowerCase() === "once" || sbfRaw.toLowerCase() === "none";
          const subIsRecurring = !subIsOneTime && (sbfRaw !== "" || isItemRecurring);

          if (subIsRecurring) {
            hasAnyRecurring = true;
            const subQty = Number(sub.quantity) || 0;
            const subPrice = Number(sub.unit_price) || 0;
            const subDiscount = Number(sub.unit_discount) || 0;
            const subNetUnitPrice = Math.max(0, subPrice - subDiscount);
            const subTotal = subQty * subNetUnitPrice;
            const subFreq = sbfRaw || (isExplicitRecurring ? bfRaw : "Annually");
            const subName = sub.activity || sub.name || `Sub-item ${sIdx + 1}`;
            const isSeat = sub.badge === "SEATS" || subName.toLowerCase().includes("seat") || (sub as any).addition_type === "SEATS";

            components.push({
              name: subName,
              quantity: subQty,
              unit_price: subNetUnitPrice,
              total: subTotal,
              frequency: subFreq,
              isSeat,
            });
          }
        });
      }
    });

    if (!hasAnyRecurring || components.length === 0) {
      return null;
    }

    const totalRenewalAmount = components.reduce((sum, c) => sum + c.total, 0);
    if (totalRenewalAmount <= 0) {
      return null;
    }

    const freqClean = primaryFrequency.toLowerCase();
    let freqLabel = "per year";
    let freqShort = "/ yr";
    if (freqClean.includes("semi")) {
      freqLabel = "per 6 months";
      freqShort = "/ 6-mo";
    } else if (freqClean.includes("quarter")) {
      freqLabel = "per quarter";
      freqShort = "/ qtr";
    } else if (freqClean.includes("month")) {
      freqLabel = "per month";
      freqShort = "/ mo";
    }

    // Check if all components are seats with identical unit price
    const allSeats = components.every(c => c.isSeat);
    const samePrice = components.length > 0 && components.every(c => Math.abs(c.unit_price - components[0].unit_price) < 0.01);

    let summaryText = "";
    if (allSeats && samePrice && components.length > 0) {
      const totalSeats = components.reduce((sum, c) => sum + c.quantity, 0);
      const unitPrice = components[0].unit_price;
      summaryText = `${totalSeats} ${totalSeats === 1 ? "seat" : "seats"} × $${unitPrice.toFixed(2)} ${freqLabel} = $${totalRenewalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency} ${freqLabel}`;
    } else {
      // Build formula breakdown: e.g. "Item 1 (1 × $360.00) + Extra Storage (2 × $50.00) = $460.00 USD per year"
      const formulaParts = components.map(c => {
        return `${c.name} (${c.quantity} × $${c.unit_price.toFixed(2)})`;
      });
      summaryText = `${formulaParts.join(" + ")} = $${totalRenewalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency} ${freqLabel}`;
    }

    return {
      currency,
      billing_frequency: primaryFrequency,
      frequency_label: freqLabel,
      frequency_short: freqShort,
      total_renewal_amount: totalRenewalAmount,
      components,
      summary_text: summaryText,
    };
  }, [lineItems, currency]);
  // Check column visibility: hide any column that is empty/unfilled, null, undefined, or 0 across all items and sub-items
  const allInvoiceItems = useMemo(() => {
    const list: any[] = [];
    (lineItems || []).forEach((item) => {
      list.push(item);
      if (item.sub_items && Array.isArray(item.sub_items)) {
        item.sub_items.forEach((sub: any) => list.push(sub));
      }
    });
    return list;
  }, [lineItems]);
  const showDateCol = useMemo(() => {
    return allInvoiceItems.some(
      (i) => (i.date && String(i.date).trim() !== "") || (i.date_range && String(i.date_range).trim() !== "")
    ) || (!!invoiceDate && String(invoiceDate).trim() !== "");
  }, [allInvoiceItems, invoiceDate]);
  const showUnitPriceCol = useMemo(() => {
    return allInvoiceItems.some(
      (i) => i.unit_price !== undefined && i.unit_price !== null && String(i.unit_price).trim() !== "" && Number(i.unit_price) > 0
    );
  }, [allInvoiceItems]);
  const showCurrencyCol = useMemo(() => {
    return allInvoiceItems.some(
      (i) => i.currency && String(i.currency).trim() !== "" && String(i.currency).trim() !== "0"
    );
  }, [allInvoiceItems]);
  const showQtyCol = useMemo(() => {
    return allInvoiceItems.some(
      (i) => i.quantity !== undefined && i.quantity !== null && String(i.quantity).trim() !== "" && Number(i.quantity) > 0
    );
  }, [allInvoiceItems]);
  const showDiscountCol = useMemo(() => {
    return allInvoiceItems.some(
      (i) => i.unit_discount !== undefined && i.unit_discount !== null && String(i.unit_discount).trim() !== "" && Number(i.unit_discount) > 0
    );
  }, [allInvoiceItems]);
  const showTaxCol = useMemo(() => {
    return allInvoiceItems.some(
      (i) => i.tax_rate !== undefined && i.tax_rate !== null && String(i.tax_rate).trim() !== "" && Number(i.tax_rate) > 0
    );
  }, [allInvoiceItems]);
  const visibleColumnCount = useMemo(() => {
    return [
      showDateCol,
      true, // ACTIVITY / ITEM & DESCRIPTION
      showUnitPriceCol,
      showCurrencyCol,
      showQtyCol,
      showDiscountCol,
      showTaxCol,
      true, // NET PRICE
    ].filter(Boolean).length;
  }, [
    showDateCol,
    showUnitPriceCol,
    showCurrencyCol,
    showQtyCol,
    showDiscountCol,
    showTaxCol,
  ]);
  // Determine if this invoice represents a recurring service agreement
  const isRecurringInvoice = useMemo(() => {
    if (nextInvoiceEligibility?.is_recurring || nextInvoiceEligibility?.eligible || nextInvoiceEligibility?.already_generated) return true;
    if (computedNextRenewal !== null) return true;
    return lineItems.some((li: any) => {
      const freq = (li.billing_frequency || li.billing_type || "").toLowerCase();
      const badge = (li.badge || "").toLowerCase();
      const subHasRec = li.sub_items && li.sub_items.some((sub: any) => {
        const subFreq = (sub.billing_frequency || sub.billing_type || "").toLowerCase();
        const subBadge = (sub.badge || "").toLowerCase();
        return (
          subFreq.includes("month") ||
          subFreq.includes("annual") ||
          subFreq.includes("semi") ||
          subFreq.includes("quarter") ||
          subBadge.includes("recurring") ||
          subBadge.includes("prorated")
        );
      });
      return (
        freq.includes("month") ||
        freq.includes("annual") ||
        freq.includes("semi") ||
        freq.includes("quarter") ||
        badge.includes("recurring") ||
        badge.includes("prorated") ||
        li.is_prorated ||
        li.is_recurring ||
        subHasRec
      );
    });
  }, [nextInvoiceEligibility, computedNextRenewal, lineItems]);
  return { dueDateInfo, computedNextRenewal, showDateCol, showUnitPriceCol, showCurrencyCol, showQtyCol, showDiscountCol, showTaxCol, visibleColumnCount, isRecurringInvoice };
}
