export interface RowPricingResult {
  amount: number;             // Final net price (including term, proration, discounts, tax)
  subtotalBeforeTax: number;  // Subtotal before tax
  grossBase: number;          // quantity * unit_price
  discountAmount: number;     // total discount amount
  taxAmount: number;          // total tax amount
  formulaString: string;      // detailed human-readable formula
  isProrated: boolean;        // true if proration factor < 0.999
  badge: string;              // "Prorated" | "Recurring" | "One-Time"
  prorationRatio: number;     // e.g. 0.85
  termCount: number;          // term multiplier used (>= 1)
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
}): RowPricingResult {
  const qty = params.quantity === "" || params.quantity === undefined ? 1 : Math.max(0, Number(params.quantity) || 0);
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

  const rawTerm = params.term === "" || params.term === undefined ? 0 : Number(params.term) || 0;
  const termCount = rawTerm > 0 ? rawTerm : 1;

  const freq = (params.billing_frequency || "").trim().toLowerCase();
  const rawStartDate = (params.billing_start_date || "").trim();
  const taxRate = params.tax_rate === "" || params.tax_rate === undefined ? 0 : Number(params.tax_rate) || 0;

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
      badge: "One-Time",
      prorationRatio: 1.0,
      termCount,
    };
  }

  // Recurring frequency (Monthly, Quarterly, Semi-annually, Annually)
  const now = new Date();
  let start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let isFullPeriod = false;

  const startLower = rawStartDate.toLowerCase();
  if (startLower === "first of next month") {
    start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    isFullPeriod = true;
  } else if (startLower === "upon signing" || startLower === "immediate" || startLower === "at payment" || !rawStartDate) {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else {
    // Check if it's a valid date string YYYY-MM-DD
    const parsed = new Date(rawStartDate);
    if (!isNaN(parsed.getTime())) {
      start = parsed;
    }
  }

  let totalDaysInPeriod = 365;
  let remainingDays = 365;
  let freqLabel = "/yr";

  if (freq.includes("semi")) {
    totalDaysInPeriod = 182;
    freqLabel = "/6-mo";
    const endOfHalf = new Date(start.getFullYear(), start.getMonth() < 6 ? 5 : 11, start.getMonth() < 6 ? 30 : 31);
    remainingDays = Math.max(1, Math.round((endOfHalf.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    if (remainingDays > totalDaysInPeriod) remainingDays = totalDaysInPeriod;
  } else if (freq.includes("annual") || freq.includes("year")) {
    totalDaysInPeriod = 365;
    freqLabel = "/yr";
    const endOfYear = new Date(start.getFullYear(), 11, 31);
    remainingDays = Math.max(1, Math.round((endOfYear.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    if (remainingDays > totalDaysInPeriod) remainingDays = totalDaysInPeriod;
  } else if (freq.includes("quarter")) {
    totalDaysInPeriod = 91;
    freqLabel = "/qtr";
    const currentQ = Math.floor(start.getMonth() / 3);
    const endOfQ = new Date(start.getFullYear(), (currentQ + 1) * 3, 0);
    remainingDays = Math.max(1, Math.round((endOfQ.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    if (remainingDays > totalDaysInPeriod) remainingDays = totalDaysInPeriod;
  } else if (freq.includes("month")) {
    const daysInCurrentMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    totalDaysInPeriod = daysInCurrentMonth;
    freqLabel = "/mo";
    if (isFullPeriod) {
      remainingDays = totalDaysInPeriod;
    } else {
      remainingDays = Math.max(1, daysInCurrentMonth - start.getDate() + 1);
    }
  }

  const ratio = isFullPeriod ? 1.0 : Math.min(1.0, Math.max(0.01, remainingDays / totalDaysInPeriod));

  // Multi-term support: first period may be prorated, remaining (termCount - 1) periods are full
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
  if (ratio < 0.999) {
    formulaParts.push(`× (${remainingDays}/${totalDaysInPeriod}d prorated)`);
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

  return {
    amount: finalAmt,
    subtotalBeforeTax,
    grossBase,
    discountAmount: discAmt * termCount,
    taxAmount: taxAmt,
    formulaString,
    isProrated: ratio < 0.999,
    badge: ratio < 0.999 ? "Prorated" : "Recurring",
    prorationRatio: ratio,
    termCount,
  };
}
