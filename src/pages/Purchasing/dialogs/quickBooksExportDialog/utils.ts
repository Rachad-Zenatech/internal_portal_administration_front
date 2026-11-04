/**
 * Formats a Date object to "YYYY-MM-DDTHH:mm:ss" for datetime-local input fields.
 */
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

/**
 * Formats a timestamp into human-readable "YYYY/MM/DD HH:mm:ss"
 */
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

/**
 * Formats a Date object to "YYYY/MM/DD"
 */
export function formatDisplayDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())}`;
}
