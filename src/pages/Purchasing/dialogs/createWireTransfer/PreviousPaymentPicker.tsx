import { History, Loader2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PreviousWirePayment } from "@/types/purchasing";
import { formatMoney } from "../../utils/purchasingMeta";

interface Props {
  category: string;
  items: PreviousWirePayment[];
  isLoading: boolean;
  selected: PreviousWirePayment | null;
  onPick: (p: PreviousWirePayment) => void;
  onClear: () => void;
}

/** Rent / Note are paid again and again: pick the last payment and the bank details come with it. */
export function PreviousPaymentPicker({ category, items, isLoading, selected, onPick, onClear }: Props) {
  return (
    <div className="rounded-xl border border-teal-200 dark:border-teal-900/60 bg-teal-50/50 dark:bg-teal-950/20 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-teal-900 dark:text-teal-200">
          <History className="h-4 w-4" />
          <span>Pay again from a previous {category} payment</span>
        </div>
        {selected && (
          <Button type="button" variant="ghost" size="sm" onClick={onClear} className="h-6 px-2 text-[11px] text-slate-500 hover:text-red-600 gap-1">
            <X className="h-3 w-3" />
            Start blank
          </Button>
        )}
      </div>

      {selected ? (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700 dark:text-zinc-300">
          <span className="font-semibold">{selected.vendor}</span>
          <Badge variant="outline" className="bg-teal-100 text-teal-900 dark:bg-teal-900/40 dark:text-teal-200 border-teal-300 dark:border-teal-800 text-[10px]">
            This will be the {selected.next_label}
          </Badge>
          <span className="text-slate-500 dark:text-zinc-400">Bank details copied from request #{selected.request_id}. Update the amount, due date and invoice #.</span>
        </div>
      ) : isLoading ? (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading previous payments...
        </div>
      ) : items.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-zinc-400">No previous {category} payments yet. Fill in the details below; the next payment can reuse them.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-0.5">
          {items.map((p) => (
            <button
              key={p.request_id}
              type="button"
              onClick={() => onPick(p)}
              className="text-left rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-teal-400 hover:bg-teal-50/60 dark:hover:bg-teal-950/30 px-3 py-2 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate">{p.vendor}</span>
                {p.amount != null && <span className="text-xs font-mono text-slate-600 dark:text-zinc-300 shrink-0">{formatMoney(p.amount)}</span>}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">Next: {p.next_label}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
