import { Input } from "@/components/ui/input";

interface RecordInvoiceFinancialSectionProps {
  invoiceForm: any;
  setInvoiceForm: (form: any) => void;
}

export function RecordInvoiceFinancialSection({
  invoiceForm,
  setInvoiceForm,
}: RecordInvoiceFinancialSectionProps) {
  return (
    <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 space-y-2">
      <div className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
        Financial Breakdown (Schedule Details)
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400">Interest</label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">$</span>
            <Input
              type="number"
              step="0.01"
              placeholder="—"
              value={invoiceForm.interest}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, interest: e.target.value })}
              className="pl-6 text-xs font-mono"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400">Principal Paid</label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">$</span>
            <Input
              type="number"
              step="0.01"
              placeholder="—"
              value={invoiceForm.principal_paid}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, principal_paid: e.target.value })}
              className="pl-6 text-xs font-mono"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400">Remaining Balance</label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">$</span>
            <Input
              type="number"
              step="0.01"
              placeholder="—"
              value={invoiceForm.balance}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, balance: e.target.value })}
              className="pl-6 text-xs font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
