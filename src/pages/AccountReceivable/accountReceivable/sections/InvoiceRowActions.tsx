import { CreditCard, Mail, Trash2 } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import type { EmailPaymentMatch } from "../../../../services/arEmailPaymentService";
import type { GeneratedInvoiceSummary } from "../../../../services/arInvoiceService";
import { PaymentFoundBadge } from "./PaymentFoundBadge";

interface InvoiceRowActionsProps {
  inv: GeneratedInvoiceSummary;
  match?: EmailPaymentMatch;
  isDeleting: boolean;
  onRecordPayment: (inv: GeneratedInvoiceSummary, match?: EmailPaymentMatch) => void;
  onSendEmail: (inv: GeneratedInvoiceSummary) => void;
  onDelete: (id: string) => void;
}

export function InvoiceRowActions({
  inv,
  match,
  isDeleting,
  onRecordPayment,
  onSendEmail,
  onDelete,
}: InvoiceRowActionsProps) {
  const isPaid = (inv.status || "").toUpperCase().startsWith("PAID");

  return (
    <div className="flex items-center justify-end gap-1.5">
      {match && !isPaid && (
        <>
          <PaymentFoundBadge match={match} onClick={() => onRecordPayment(inv, match)} />
          <Button
            size="sm"
            onClick={() => onRecordPayment(inv, match)}
            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg gap-1 cursor-pointer"
          >
            <CreditCard className="w-3 h-3" />
            <span>Record Payment</span>
          </Button>
        </>
      )}
      <Button
        size="sm"
        variant="outline"
        onClick={() => onSendEmail(inv)}
        className="h-7 text-xs rounded-lg gap-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border-indigo-200 cursor-pointer"
      >
        <Mail className="w-3 h-3" />
        <span>Send Email</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          if (window.confirm(`Are you sure you want to delete invoice ${inv.invoice_number}? This action cannot be undone.`)) {
            onDelete(inv.id);
          }
        }}
        disabled={isDeleting}
        className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
        title="Delete invoice"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
