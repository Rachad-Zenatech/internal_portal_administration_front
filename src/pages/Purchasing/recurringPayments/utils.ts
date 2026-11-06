export function getDueStatus(dateStr?: string | null, status?: string) {
  if (!dateStr || status === "COMPLETED" || status === "REJECTED") return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return { label: `Overdue (${Math.abs(diffDays)}d)`, variant: "destructive" as const, className: "", isUrgent: true };
  } else if (diffDays === 0) {
    return { label: "Due Today", variant: "default" as const, className: "bg-rose-600 hover:bg-rose-700 text-white font-bold", isUrgent: true };
  } else if (diffDays === 1) {
    return { label: "Due Tomorrow", variant: "default" as const, className: "bg-amber-600 hover:bg-amber-700 text-white font-semibold", isUrgent: true };
  } else if (diffDays <= 7) {
    return { label: `Due in ${diffDays}d`, variant: "outline" as const, className: "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 font-medium", isUrgent: true };
  }
  return null;
}
