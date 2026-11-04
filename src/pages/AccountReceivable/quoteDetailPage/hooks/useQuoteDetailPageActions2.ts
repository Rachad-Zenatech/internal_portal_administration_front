import { calculateRowPricing } from "../../utils/lineItemPricingUtils";
import type { QuoteDetailPageGuardedState } from "./useQuoteDetailPage";

export function useQuoteDetailPageActions2(ctx: QuoteDetailPageGuardedState) {
  const { quote } = ctx;
  const isSigned = quote.customer_response_state === "SIGNED";
  const isChanges = quote.customer_response_state === "CHANGES_REQUESTED";
  const isSuperseded = quote.publication_state === "DISABLED" || quote.customer_response_state === "SUPERSEDED" || !!quote.superseded_by_id;
  const isPublished = quote.publication_state === "PUBLISHED" && !isSuperseded;
  const isDraft = quote.publication_state === "DRAFT" && !isSuperseded;
  const hasInvoice = !!quote.invoice_id;
  const isPaid = quote.payment_status === "PAID";
  const isRenewalQuote = quote.quote_type === "RENEWAL" || !!quote.source_invoice_id || !!quote.source_invoice_number || quote.line_items?.some((li: any) => li.is_renewal || li.badge === "Renewal");
  const effectiveSubtotal = (() => {
    if (!quote.line_items || quote.line_items.length === 0) {
      return Number(quote.subtotal || 0);
    }
    const sum = quote.line_items.reduce((acc: number, item: any) => {
      const isLineRenewal = isRenewalQuote || !!item.is_renewal || item.badge === "Renewal";
      const pricing = calculateRowPricing({
        quantity: item.quantity !== undefined && item.quantity !== null && item.quantity !== "" ? item.quantity : 1,
        unit_price: item.price !== undefined && item.price !== null && item.price !== "" ? item.price : (item.unit_price || 0),
        unit_discount: item.unit_discount ?? 0,
        discount_type: item.discount_type || "%",
        billing_frequency: item.billing_frequency || item.billing_type || "",
        term: item.term ?? 1,
        billing_start_date: item.billing_start_date || item.service_period_start || "",
        tax_rate: item.tax_rate ?? 0,
        is_renewal: isLineRenewal,
        is_prorated: isLineRenewal ? false : item.is_prorated,
        quote_type: quote.quote_type || (isRenewalQuote ? "RENEWAL" : "STANDARD"),
      });
      const lineSub = isLineRenewal ? pricing.amount : (Number(item.subtotal) || pricing.amount);
      return acc + lineSub;
    }, 0);
    return sum > 0 ? sum : Number(quote.subtotal || 0);
  })();
  const effectiveTax = (() => {
    if (!quote.line_items || quote.line_items.length === 0) {
      return Number(quote.tax || 0);
    }
    const sumTax = quote.line_items.reduce((acc: number, item: any) => {
      const isLineRenewal = isRenewalQuote || !!item.is_renewal || item.badge === "Renewal";
      const pricing = calculateRowPricing({
        quantity: item.quantity !== undefined && item.quantity !== null && item.quantity !== "" ? item.quantity : 1,
        unit_price: item.price !== undefined && item.price !== null && item.price !== "" ? item.price : (item.unit_price || 0),
        unit_discount: item.unit_discount ?? 0,
        discount_type: item.discount_type || "%",
        billing_frequency: item.billing_frequency || item.billing_type || "",
        term: item.term ?? 1,
        billing_start_date: item.billing_start_date || item.service_period_start || "",
        tax_rate: item.tax_rate ?? 0,
        is_renewal: isLineRenewal,
        is_prorated: isLineRenewal ? false : item.is_prorated,
        quote_type: quote.quote_type || (isRenewalQuote ? "RENEWAL" : "STANDARD"),
      });
      const rate = Number(item.tax_rate || 0);
      return acc + (rate > 0 ? (pricing.amount * rate) / 100 : 0);
    }, 0);
    return sumTax > 0 ? Math.round(sumTax * 100) / 100 : Number(quote.tax || 0);
  })();
  const effectiveDiscount = Number(quote.discount || 0);
  const effectiveTotal = Math.max(0, Math.round((effectiveSubtotal - effectiveDiscount + effectiveTax) * 100) / 100);
  return { isSigned, isChanges, isSuperseded, isPublished, isDraft, hasInvoice, isPaid, isRenewalQuote, effectiveSubtotal, effectiveTax, effectiveDiscount, effectiveTotal };
}
