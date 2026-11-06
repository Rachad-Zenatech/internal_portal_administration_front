export function parseExtractedPrice(price: string | number | null | undefined): number | null {
  const numericPrice = Number(String(price ?? "").replace(/,/g, "").match(/-?\d+(?:\.\d+)?/)?.[0]);
  return Number.isFinite(numericPrice) && numericPrice > 0 ? numericPrice : null;
}
