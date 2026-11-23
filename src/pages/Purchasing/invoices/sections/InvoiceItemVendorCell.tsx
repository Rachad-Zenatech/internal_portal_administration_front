import { AlertTriangle, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  task: any;
  isScheduledPayment: (t: any) => boolean;
  isWireTransfer: (t: any) => boolean;
}

function parseQuoteData(raw: any): Record<string, any> | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return typeof raw === "object" ? raw : null;
}

export function InvoiceItemVendorCell({ task, isScheduledPayment, isWireTransfer }: Props) {
  const wt = task.wire_transfer;
  const quoteData = parseQuoteData(task.quote_data);
  const isUrgentPayable = Boolean(quoteData?.is_urgent_override);
  const urgentReason = quoteData?.urgent_override_reason ? String(quoteData.urgent_override_reason) : null;

  return (
    <div className="flex flex-col gap-1 max-w-[280px]">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="font-semibold text-slate-900 dark:text-zinc-100 text-sm truncate" title={task.product_name || "Untitled Request"}>
          {task.product_name || "Untitled Request"}
        </span>
      </div>
      {isUrgentPayable && urgentReason && (
        <span
          className="text-[11px] font-medium text-red-600 dark:text-red-400 truncate"
          title={`Urgent Reason: ${urgentReason}`}
        >
          Reason: {urgentReason}
        </span>
      )}
      <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-500 dark:text-zinc-400">
        {(wt?.vendor || task.vendor) && (
          <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-zinc-300">
            <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
            <span className="truncate max-w-[160px]">{wt?.vendor || task.vendor}</span>
          </span>
        )}
        {isUrgentPayable && (
          <Badge
            variant="outline"
            title={urgentReason ? `Urgent Payable Override: ${urgentReason}` : "Urgent Account Payable"}
            className="text-[10px] px-1.5 py-0 font-semibold gap-1 bg-red-50 text-red-700 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800"
          >
            <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
            Urgent Payable
          </Badge>
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
        {wt?.payment_series?.label && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300 border-teal-200 dark:border-teal-800">
            {wt.payment_series.label}
          </Badge>
        )}
      </div>
    </div>
  );
}
