import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PurchaseRequest } from "@/types/purchasing";
import { formatDateTime } from "../../utils/purchasingMeta";

export function PaymentMadeBadge({ request }: { request: PurchaseRequest }) {
  const qd = request?.quote_data as Record<string, any> | undefined;
  if (!qd?.payment_made || String(request?.status || "").toUpperCase() !== "WAITING_PAYMENT") {
    return null;
  }
  const by = qd.payment_made_by ? `by ${qd.payment_made_by}` : "by Treasury";
  const at = qd.payment_made_at ? ` on ${formatDateTime(qd.payment_made_at)}` : "";
  return (
    <Badge
      variant="outline"
      title={`Payment made ${by}${at}. Assigned to AP to record Invoice / Receipts before completion.`}
      className="font-semibold gap-1 shadow-xs shrink-0 py-0.5 px-2 bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
    >
      <CheckCircle2 className="h-3 w-3 shrink-0" />
      <span>Payment Made · Awaiting AP Invoice / Receipts</span>
    </Badge>
  );
}
