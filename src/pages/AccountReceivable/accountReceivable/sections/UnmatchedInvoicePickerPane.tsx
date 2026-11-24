import { CheckCircle2, Link2, Search } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import type { GeneratedInvoiceSummary } from "../../../../services/arInvoiceService";

interface Props {
  invSearch: string;
  onInvSearchChange: (v: string) => void;
  filteredInvoices: GeneratedInvoiceSummary[];
  selectedAllocations: Record<string, number>;
  onToggleInvoice: (inv: GeneratedInvoiceSummary) => void;
  onAllocationChange: (invoiceId: string, amount: number) => void;
  rememberPayer: boolean;
  onRememberPayerChange: (v: boolean) => void;
  allocatedTotal: number;
  isSubmitting: boolean;
  onSubmit: (recordNow: boolean) => void;
}

export function UnmatchedInvoicePickerPane({
  invSearch,
  onInvSearchChange,
  filteredInvoices,
  selectedAllocations,
  onToggleInvoice,
  onAllocationChange,
  rememberPayer,
  onRememberPayerChange,
  allocatedTotal,
  isSubmitting,
  onSubmit,
}: Props) {
  return (
    <div className="lg:col-span-4 flex flex-col gap-3 min-h-0">
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={invSearch}
          onChange={(e) => onInvSearchChange(e.target.value)}
          placeholder="Search open invoices by #, customer, or balance..."
          className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none focus:border-indigo-400"
        />
      </div>

      <div className="flex-1 min-h-[260px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        {filteredInvoices.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">No open invoices match your search.</div>
        ) : (
          filteredInvoices.map((inv) => {
            const checked = selectedAllocations[inv.id] !== undefined;
            const bal = Number(inv.balance_due !== undefined ? inv.balance_due : inv.total_amount || 0);
            return (
              <div
                key={inv.id}
                className={`px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs transition-colors ${
                  checked ? "bg-emerald-50/50 dark:bg-emerald-950/20" : "hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                }`}
              >
                <label className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1">
                  <input type="checkbox" checked={checked} onChange={() => onToggleInvoice(inv)} className="rounded shrink-0" />
                  <div className="min-w-0">
                    <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                      {inv.invoice_number}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {inv.customer_name} · Due: <span className="font-mono font-semibold text-amber-600">${bal.toFixed(2)}</span>
                    </div>
                  </div>
                </label>
                {checked && (
                  <div className="relative shrink-0">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-mono">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={selectedAllocations[inv.id]}
                      onChange={(e) => onAllocationChange(inv.id, Number(e.target.value))}
                      className="w-28 h-8 pl-6 pr-2.5 rounded-lg border border-emerald-400 bg-white dark:bg-slate-950 font-mono text-xs text-right font-semibold"
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-[11.5px] text-slate-600 dark:text-slate-300 cursor-pointer">
            <input type="checkbox" checked={rememberPayer} onChange={(e) => onRememberPayerChange(e.target.checked)} className="rounded" />
            <span>Remember payer for future checks</span>
          </label>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
            Allocated: ${allocatedTotal.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={isSubmitting || allocatedTotal <= 0} onClick={() => onSubmit(false)} className="h-8 px-3 text-xs rounded-xl gap-1.5 cursor-pointer">
            <Link2 className="w-3.5 h-3.5" /> Link to Invoice
          </Button>
          <Button size="sm" disabled={isSubmitting || allocatedTotal <= 0} onClick={() => onSubmit(true)} className="h-8 px-3.5 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer">
            <CheckCircle2 className="w-3.5 h-3.5" /> Map &amp; Record Payment
          </Button>
        </div>
      </div>
    </div>
  );
}
