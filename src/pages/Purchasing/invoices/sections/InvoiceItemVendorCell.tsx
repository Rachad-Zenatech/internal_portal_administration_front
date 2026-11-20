import { Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  task: any;
  isScheduledPayment: (t: any) => boolean;
  isWireTransfer: (t: any) => boolean;
}

export function InvoiceItemVendorCell({ task, isScheduledPayment, isWireTransfer }: Props) {
  const wt = task.wire_transfer;
  const s = String(task.status || "").toUpperCase();
  const hasPo = Boolean(task.po_number || wt?.po_number || task.purchase_order || task.level_1_approved_at || s === "APPROVED" || s === "GOODS_RECEIVED" || s === "INVOICE_RECEIVED" || s === "WAITING_PAYMENT" || s === "COMPLETED");
  const hasReceipt = Boolean(task.goods_received || s === "GOODS_RECEIVED" || s === "INVOICE_RECEIVED" || s === "WAITING_PAYMENT" || s === "COMPLETED");
  const hasInvoice = Boolean(wt?.invoice_number || task.invoice_number || s === "INVOICE_RECEIVED" || s === "WAITING_PAYMENT" || s === "COMPLETED");
  const matchCount = (hasPo ? 1 : 0) + (hasReceipt ? 1 : 0) + (hasInvoice ? 1 : 0);

  return (
    <div className="flex flex-col gap-1 max-w-[280px]">
      <span className="font-semibold text-slate-900 dark:text-zinc-100 text-sm truncate">
        {task.product_name || "Untitled Request"}
      </span>
      <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-500 dark:text-zinc-400">
        {(wt?.vendor || task.vendor) && (
          <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-zinc-300">
            <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
            <span className="truncate max-w-[160px]">{wt?.vendor || task.vendor}</span>
          </span>
        )}
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 font-medium ${
            isScheduledPayment(task) && !isWireTransfer(task)
              ? "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800"
              : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
          }`}
        >
          {isScheduledPayment(task) && !isWireTransfer(task)
            ? "Scheduled Payment"
            : "Wire Transfer"}
        </Badge>
        {wt?.category && wt.category !== "Others" && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800">
            {wt.category}
          </Badge>
        )}
        {(!wt?.category || wt.category === "Others") && (
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 font-medium ${
              matchCount === 3
                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                : matchCount === 2
                ? "bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                : "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800"
            }`}
          >
            {matchCount === 3 ? "3-Way: 3/3 Matched" : `3-Way: ${matchCount}/3 Ready`}
          </Badge>
        )}
        {wt?.payment_series?.label && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300 border-teal-200 dark:border-teal-800">
            {wt.payment_series.label}
          </Badge>
        )}
      </div>
    </div>
  );
}
