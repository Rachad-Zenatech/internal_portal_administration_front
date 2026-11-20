import { ExternalLink } from "lucide-react";
import { formatMoney } from "../../utils/purchasingMeta";

interface PayablesDueRowProps {
  item: any;
  isOverdue: (date: string | null | undefined, status: string) => boolean;
}

export function PayablesDueRow({ item, isOverdue }: PayablesDueRowProps) {
  const overdue = isOverdue(item.due_date, item.status);
  const vendor = item.vendor || item.wire_transfer?.vendor || item.product_name || "—";
  const category = item.wire_transfer?.category || item.category || "Payable";

  return (
    <div className="py-2 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 px-2 rounded-lg transition-colors">
      <div className="min-w-0 flex items-center gap-2.5">
        <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono text-[11px]">
          #{item.id}
        </span>
        <div className="min-w-0">
          <div className="font-semibold text-slate-800 dark:text-zinc-200 truncate">
            {vendor}
            <span className="text-[10px] font-normal text-muted-foreground ml-1.5">
              ({category})
            </span>
          </div>
          <div className="text-[10.5px] text-muted-foreground truncate">
            {item.product_name || `Payment for ${vendor}`}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span
          className={`text-[10.5px] font-bold px-1.5 py-0.5 rounded ${
            overdue
              ? "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300"
              : "bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
          }`}
        >
          {overdue ? "Overdue" : "Due Today"}
        </span>
        <span className="font-mono font-bold text-slate-900 dark:text-zinc-100">
          {formatMoney(item.amount, item.currency)}
        </span>
        <a
          href={`/purchasing/requests/${item.id}`}
          className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          title="Open request details"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
