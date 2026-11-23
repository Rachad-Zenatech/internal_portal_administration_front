/** Compute a YYYY-MM-DD due date from an invoice date and vendor payment terms (e.g. "Net 30", "Same Day", "Due on Receipt"). */
export function computeDueDateFromTerms(
  invoiceDateIso: string | undefined | null,
  terms: string | undefined | null,
): string | null {
  if (!invoiceDateIso || !/^\d{4}-\d{2}-\d{2}$/.test(invoiceDateIso)) return null;
  const t = (terms || "").trim();
  if (!t) return null;

  let daysToAdd: number | null = null;
  const netMatch = t.match(/\bnet\s*(\d+)\b/i);
  if (netMatch) {
    daysToAdd = Number(netMatch[1]);
  } else if (/\b(same\s*day|due\s*on\s*receipt|cod|immediate)\b/i.test(t)) {
    daysToAdd = 0;
  }

  if (daysToAdd === null || Number.isNaN(daysToAdd)) return null;
  const [y, m, d] = invoiceDateIso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + daysToAdd));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}
