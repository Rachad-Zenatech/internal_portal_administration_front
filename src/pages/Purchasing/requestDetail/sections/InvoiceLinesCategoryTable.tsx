import type { Dispatch, SetStateAction } from "react";
import { CategoryAutocomplete } from "../../fields/CategoryAutocomplete";
import HelpIcon from "@/components/ui/HelpIcon";
import { formatMoney } from "../../utils/purchasingMeta";
import type { InvoiceItemInput } from "@/types/purchasing";

interface InvoiceLinesCategoryTableProps {
  invoiceItems: InvoiceItemInput[];
  setInvoiceItems: Dispatch<SetStateAction<InvoiceItemInput[]>>;
  invoiceAmount: number;
}

export function InvoiceLinesCategoryTable({
  invoiceItems,
  setInvoiceItems,
  invoiceAmount,
}: InvoiceLinesCategoryTableProps) {
  const linesTotal = invoiceItems.reduce((s, it) => s + (Number(it.amount) || 0), 0);

  return (
    <div className="border border-slate-200 dark:border-zinc-800 rounded-lg divide-y divide-slate-200 dark:divide-zinc-800 text-xs shadow-xs bg-white dark:bg-zinc-900">
      <div className="bg-slate-100/80 dark:bg-zinc-800/70 px-3 py-2.5 grid grid-cols-12 gap-3 font-semibold text-slate-700 dark:text-zinc-300">
        <div className="col-span-5">Item / Description</div>
        <div className="col-span-2 text-right pr-6">Amount</div>
        <div className="col-span-4 pl-4 border-l border-slate-200 dark:border-zinc-700">Category *</div>
        <div className="col-span-1 flex items-center justify-center gap-0.5">
          <span>Asset</span>
          <HelpIcon text="Mark as Capitalized Fixed Asset (CapEx)" iconClassName="h-3 w-3" />
        </div>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-zinc-800/50">
        {invoiceItems.map((itm, idx) => (
          <div key={idx} className="px-3 py-2.5 grid grid-cols-12 gap-3 items-center hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
            <div className="col-span-5 pr-1">
              <div className="font-medium text-slate-900 dark:text-zinc-100 break-words whitespace-normal leading-snug" title={itm.description}>
                {itm.sku ? <span className="font-mono text-indigo-600 dark:text-indigo-400 mr-1">[{itm.sku}]</span> : null}
                {itm.description}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Qty: {itm.quantity}</div>
            </div>
            <div className="col-span-2 text-right pr-6 font-mono font-semibold text-slate-800 dark:text-zinc-200">
              {formatMoney(itm.amount)}
            </div>
            <div className="col-span-4 pl-4 border-l border-slate-100 dark:border-zinc-800">
              <CategoryAutocomplete
                value={itm.gl_code || ""}
                onChange={(v) => {
                  setInvoiceItems((prev) => {
                    const updated = [...prev];
                    updated[idx] = { ...updated[idx], gl_code: v };
                    return updated;
                  });
                }}
                placeholder="Select category *"
              />
            </div>
            <div className="col-span-1 flex justify-center">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                checked={itm.asset_flag || false}
                onChange={(e) => {
                  setInvoiceItems((prev) => {
                    const updated = [...prev];
                    updated[idx] = { ...updated[idx], asset_flag: e.target.checked };
                    return updated;
                  });
                }}
                title="Mark as Asset"
              />
            </div>
          </div>
        ))}
      </div>
      <div className="bg-slate-50/80 dark:bg-zinc-900/90 px-3 py-2.5 flex items-center justify-between text-xs">
        <span className="text-slate-600 dark:text-zinc-400">
          Lines Total: <strong className="font-mono text-slate-900 dark:text-zinc-100 text-sm ml-1">{formatMoney(linesTotal)}</strong>
        </span>
        <span className="text-slate-600 dark:text-zinc-400">
          Invoice Amount: <strong className="font-mono text-slate-900 dark:text-zinc-100 text-sm ml-1">{formatMoney(invoiceAmount)}</strong>
        </span>
      </div>
    </div>
  );
}
