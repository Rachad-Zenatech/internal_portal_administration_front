import { CreditCard } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import type { EmailPaymentMatch } from "../../../../services/arEmailPaymentService";
import type { GeneratedInvoiceSummary } from "../../../../services/arInvoiceService";
import { PaymentFoundBadge } from "./PaymentFoundBadge";

interface AwaitingPaymentRowProps {
  inv: GeneratedInvoiceSummary;
  match?: EmailPaymentMatch;
  onRecord: (inv: GeneratedInvoiceSummary, match?: EmailPaymentMatch) => void;
}

export function AwaitingPaymentRow({ inv, match, onRecord }: AwaitingPaymentRowProps) {
  const bal = Number(inv.balance_due !== undefined ? inv.balance_due : inv.total_amount - (inv.amount_paid || 0));

  return (
    <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
      <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{inv.invoice_number}</td>
      <td className="py-3 px-4 font-semibold">{inv.customer_name}</td>
      <td className="py-3 px-4 text-slate-500 font-mono">{inv.invoice_date}</td>
      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
        ${Number(inv.total_amount).toFixed(2)} {inv.currency || "USD"}
      </td>
      <td className="py-3 px-4 text-right font-mono font-bold">
        <span className={bal === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
          ${bal.toFixed(2)} {inv.currency || "USD"}
        </span>
      </td>
      <td className="py-3 px-4 text-right">
        <div className="inline-flex items-center justify-end gap-1.5">
          {match && <PaymentFoundBadge match={match} onClick={() => onRecord(inv, match)} />}
          <Button
            size="sm"
            onClick={() => onRecord(inv, match)}
            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs cursor-pointer gap-1"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Record Payment</span>
          </Button>
        </div>
      </td>
    </tr>
  );
}
