export interface RowPricingResult {
  amount: number;             // Final net price (including term, proration, discounts, tax)
  subtotalBeforeTax: number;  // Subtotal before tax
  grossBase: number;          // quantity * unit_price
  discountAmount: number;     // total discount amount
  taxAmount: number;          // total tax amount
  formulaString: string;      // detailed human-readable formula
  isProrated: boolean;        // true if proration factor < 0.999
  badge: string;              // "Prorated" | "Recurring" | "One-Time"
  prorationRatio: number;     // e.g. 0.25
  termCount: number;          // term multiplier used (>= 1)
  remainingMonths?: number;   // e.g. 3
  totalMonths?: number;       // e.g. 12
  proratedNote?: string;      // e.g. "Prorated (3 months left): $300.00"
}

export function calculateRowPricing(params: {
  quantity: string | number;
  unit_price: string | number;
  unit_discount?: string | number;
  discount_type?: "%" | "$";
  billing_frequency?: string;
  term?: string | number;
  billing_start_date?: string;
  tax_rate?: string | number;
  is_paid?: boolean;
}): RowPricingResult {
  const qty = params.quantity === "" || params.quantity === undefined ? 1 : Math.max(1, Number(params.quantity) || 1);
  const price = params.unit_price === "" || params.unit_price === undefined ? 0 : Math.max(0, Number(params.unit_price) || 0);
  const grossBase = qty * price;

  const discVal = params.unit_discount === "" || params.unit_discount === undefined ? 0 : Number(params.unit_discount) || 0;
  let discAmt = 0;
  if (params.discount_type === "$") {
    discAmt = discVal * (qty > 0 ? qty : 1);
  } else {
    discAmt = grossBase * (discVal / 100);
  }
  discAmt = Math.min(grossBase, Math.max(0, discAmt));
  const afterDisc = Math.max(0, grossBase - discAmt);

  const rawTerm = params.term === "" || params.term === undefined ? 1 : Math.max(1, Number(params.term) || 1);
  const termCount = rawTerm;

  const freq = (params.billing_frequency || "").trim().toLowerCase();
  const taxRate = params.tax_rate === "" || params.tax_rate === undefined ? 0 : Number(params.tax_rate) || 0;
  const isPaid = !!params.is_paid;

  // If frequency is empty or One-Time
  if (!freq || freq === "none" || freq === "one-time" || freq === "one time") {
    const periodBase = afterDisc * termCount;
    const taxAmt = taxRate > 0 ? (periodBase * taxRate) / 100 : 0;
    const finalAmt = Math.round((periodBase + taxAmt) * 100) / 100;

    const formulaParts: string[] = [];
    formulaParts.push(`${qty} × $${price.toFixed(2)}`);
    if (termCount > 1) formulaParts.push(`× ${termCount} terms`);
    if (discAmt > 0) formulaParts.push(`(-$${(discAmt * termCount).toFixed(2)} disc)`);
    if (taxRate > 0) formulaParts.push(`(+${taxRate}% tax)`);
    const formulaString = `${formulaParts.join(" ")} = $${finalAmt.toFixed(2)}`;

    return {
      amount: finalAmt,
      subtotalBeforeTax: periodBase,
      grossBase,
      discountAmount: discAmt * termCount,
      taxAmount: taxAmt,
      formulaString,
      isProrated: false,
      badge: isPaid ? "Paid" : "One-Time",
      prorationRatio: 1.0,
      termCount,
    };
  }

  // Recurring frequency: Month-based proration
  const now = new Date();
  let totalMonths = 12;
  let remainingMonths = 12;
  let freqLabel = "/yr";
  let isProrated = false;

  if (freq.includes("annual") || freq.includes("year")) {
    totalMonths = 12;
    freqLabel = "/yr";
    // Remaining months in current year (inclusive of current month)
    // e.g. January (0) -> 12 months, October (9) -> 3 months (Oct, Nov, Dec)
    remainingMonths = Math.max(1, 12 - now.getMonth());
    if (remainingMonths < 12) {
      isProrated = true;
    }
  } else if (freq.includes("month")) {
    totalMonths = 1;
    remainingMonths = 1;
    freqLabel = "/mo";
    isProrated = false;
  }

  const ratio = isProrated ? Math.min(1.0, Math.max(0.01, remainingMonths / totalMonths)) : 1.0;

  // Multi-term support: first period may be prorated by month, remaining (termCount - 1) periods are full
  let subtotalBeforeTax = 0;
  if (termCount > 1) {
    const firstPeriodBase = afterDisc * ratio;
    const remainingPeriodsBase = afterDisc * (termCount - 1);
    subtotalBeforeTax = firstPeriodBase + remainingPeriodsBase;
  } else {
    subtotalBeforeTax = afterDisc * ratio;
  }

  const taxAmt = taxRate > 0 ? (subtotalBeforeTax * taxRate) / 100 : 0;
  const finalAmt = Math.round((subtotalBeforeTax + taxAmt) * 100) / 100;

  const formulaParts: string[] = [];
  formulaParts.push(`${qty} × $${price.toFixed(2)}${freqLabel}`);
  if (isProrated) {
    formulaParts.push(`× (${remainingMonths}/${totalMonths} mo prorated)`);
  }
  if (termCount > 1) {
    formulaParts.push(`for ${termCount} terms`);
  }
  if (discAmt > 0) {
    formulaParts.push(`(-$${(discAmt * termCount).toFixed(2)} disc)`);
  }
  if (taxRate > 0) {
    formulaParts.push(`(+${taxRate}% tax)`);
  }
  const formulaString = `${formulaParts.join(" ")} = $${finalAmt.toFixed(2)}`;

  const proratedNote = isProrated
    ? `Prorated (${remainingMonths} ${remainingMonths === 1 ? "month" : "months"} left): $${finalAmt.toFixed(2)}`
    : undefined;

  return {
    amount: finalAmt,
    subtotalBeforeTax,
    grossBase,
    discountAmount: discAmt * termCount,
    taxAmount: taxAmt,
    formulaString,
    isProrated,
    badge: isPaid ? "Paid" : isProrated ? "Prorated" : "Recurring",
    prorationRatio: ratio,
    termCount,
    remainingMonths,
    totalMonths,
    proratedNote,
  };
}

/**
 * Parses a date string (YYYY-MM-DD, MM/DD/YYYY, MM / DD / YYYY) safely in local calendar time
 * avoiding UTC off-by-one shifts.
 */
export function parseDateOnly(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  const clean = String(dateStr).split("T")[0].replace(/\s+/g, "");
  const parts = clean.includes("-") ? clean.split("-") : clean.split("/");
  if (parts.length === 3) {
    let y: number, m: number, d: number;
    if (parts[0].length === 4) {
      // YYYY-MM-DD or YYYY/MM/DD
      y = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10) - 1;
      d = parseInt(parts[2], 10);
    } else {
      // MM/DD/YYYY or MM-DD-YYYY
      m = parseInt(parts[0], 10) - 1;
      d = parseInt(parts[1], 10);
      y = parseInt(parts[2], 10);
    }
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m, d);
    }
  }
  const fallback = new Date(dateStr);
  return isNaN(fallback.getTime()) ? null : fallback;
}

/**
 * Formats a date string safely in local calendar time with the given format pattern.
 */
export function formatDateOnly(dateStr?: string | null, formatStr: string = "MM / dd / yyyy"): string {
  const d = parseDateOnly(dateStr);
  if (!d) return dateStr || "—";
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());

  if (formatStr === "MM / dd / yyyy") return `${m} / ${day} / ${y}`;
  if (formatStr === "MM/dd/yyyy") return `${m}/${day}/${y}`;
  if (formatStr === "yyyy-MM-dd") return `${y}-${m}-${day}`;
  if (formatStr === "MMM d, yyyy") {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${monthNames[d.getMonth()]} ${d.getDate()}, ${y}`;
  }
  if (formatStr === "MMMM d, yyyy") {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${monthNames[d.getMonth()]} ${d.getDate()}, ${y}`;
  }
  return `${m}/${day}/${y}`;
}

/**
 * Normalizes arbitrary billing frequency string into standard values: "One-Time", "Monthly", "Annually"
 */
export function normalizeBillingFrequencyForSelect(freq?: string | null): string {
  if (!freq) return "none";
  const f = String(freq).trim().toLowerCase().replace("-", " ").replace("_", " ");
  if (f === "none" || f === "") return "none";
  if (f.includes("annu") || f.includes("year") || f.includes("12 month")) return "Annually";
  if (f.includes("month") || f === "mo" || f.includes("semi") || f.includes("quarter")) return "Monthly";
  if (f.includes("one time") || f.includes("onetime") || f.includes("once")) return "One-Time";
  return "One-Time";
}

export function normalizeBillingFrequency(freq?: string | null): string {
  if (!freq) return "One-Time";
  const norm = normalizeBillingFrequencyForSelect(freq);
  return norm === "none" ? "One-Time" : norm;
}
