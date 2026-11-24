import { Sparkles } from "lucide-react";
import type { EmailPaymentMatch } from "../../../../services/arEmailPaymentService";

interface PaymentFoundBadgeProps {
  match: EmailPaymentMatch;
  onClick: () => void;
}

export function PaymentFoundBadge({ match, onClick }: PaymentFoundBadgeProps) {
  const amt = match.allocated_amount ?? match.extracted_data?.total_amount;
  const title = `Email payment found (${match.confidence}% match)${amt != null ? ` · $${Number(amt).toFixed(2)}` : ""} — click to auto-fill`;

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="h-7 px-2 rounded-lg text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700 inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
    >
      <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
      <span>Matched Payment</span>
    </button>
  );
}
