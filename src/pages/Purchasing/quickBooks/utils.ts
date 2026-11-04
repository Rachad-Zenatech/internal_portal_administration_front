import { type QuickBooksPreviewItem } from "@/services/purchasingService";

export function formatForDateTimeInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

export function formatDisplayDateTime(dateStrOrObj: string | Date | null): string {
  if (!dateStrOrObj) return "Never";
  try {
    const d = typeof dateStrOrObj === "string" ? new Date(dateStrOrObj) : dateStrOrObj;
    if (isNaN(d.getTime())) return String(dateStrOrObj);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch {
    return String(dateStrOrObj);
  }
}

export function isMaItem(item: QuickBooksPreviewItem | null | undefined): boolean {
  if (!item) return false;
  return Boolean(
    item.transaction_type === "MA_TRANSACTION" ||
    item.is_ma === true ||
    item.type === "m&a" ||
    ["m7a", "m&a", "ma"].includes(String(item.source_portal || "").toLowerCase().trim())
  );
}
