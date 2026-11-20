import { Clock, Calendar } from "lucide-react";
import { formatDate } from "../../utils/purchasingMeta";

interface Props {
  task: any;
  isOverdue: (date: string | null | undefined, status: string) => boolean;
  isDueToday: (date: string | null | undefined, status: string) => boolean;
}

export function InvoiceDueDateCell({ task, isOverdue, isDueToday }: Props) {
  const overdue = isOverdue(task.due_date, task.status);
  const dueToday = isDueToday(task.due_date, task.status);

  return (
    <div className="flex flex-col gap-1 text-xs">
      <span className={overdue ? "font-bold text-red-600 dark:text-red-400" : dueToday ? "font-bold text-amber-600 dark:text-amber-400" : "text-slate-700 dark:text-zinc-300"}>
        {formatDate(task.due_date || task.goods_received_at) || "—"}
      </span>
      {dueToday && (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800 w-fit">
          <Calendar className="h-2.5 w-2.5" /> Due Today
        </span>
      )}
      {overdue && (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800 w-fit">
          <Clock className="h-2.5 w-2.5" /> Overdue
        </span>
      )}
    </div>
  );
}
