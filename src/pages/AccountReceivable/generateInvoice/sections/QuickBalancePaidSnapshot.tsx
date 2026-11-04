import { Building2, Calendar as CalendarIcon, Check, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "../../../../components/ui/badge";
import type { GenerateInvoiceState } from "../hooks/useGenerateInvoice";

export function QuickBalancePaidSnapshot({ s }: { s: GenerateInvoiceState }) {
  const { currency, calculatedTotals, invoiceStatus, subTotal, dueDateInfo, dueDate, invoiceDate, billToName, selectedCustomer, invoiceNumber } = s;
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground font-mono">
                  {invoiceNumber || "Invoice"}
                </h1>
                <Badge
                  className={
                    (invoiceStatus || "").toUpperCase().startsWith("PAID") || (invoiceStatus || "").toUpperCase().includes("COMPLETED") || calculatedTotals.effectiveBalanceDue === 0
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700 text-xs font-semibold gap-1"
                      : (invoiceStatus || "").toUpperCase() === "OVERDUE"
                      ? "bg-rose-50 text-rose-700 border-rose-300 text-xs font-semibold gap-1"
                      : "bg-blue-50 text-blue-700 border-blue-300 text-xs font-semibold gap-1"
                  }
                >
                  {(invoiceStatus || "").toUpperCase().startsWith("PAID") || (invoiceStatus || "").toUpperCase().includes("COMPLETED") || calculatedTotals.effectiveBalanceDue === 0 ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{invoiceStatus || "Completed & Paid"}</span>
                    </>
                  ) : (
                    <span>{invoiceStatus || "Open / Unpaid"}</span>
                  )}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap pt-0.5">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <strong>{selectedCustomer?.name || billToName || "Direct Client"}</strong>
                </span>
                {invoiceDate && (
                  <span className="flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>Issued: {invoiceDate}</span>
                  </span>
                )}
                {dueDate && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Due: {dueDate}</span>
                  </span>
                )}
                {dueDateInfo && (
                  <Badge variant="outline" className={`text-xs px-2.5 py-0.5 gap-1.5 font-semibold ${dueDateInfo.badgeClass}`}>
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>{dueDateInfo.label}</span>
                  </Badge>
                )}
              </div>
            </div>

            {/* Quick Balance & Paid Snapshot with Add-on Adjustment Breakdown */}
            <div className="flex items-center gap-4 bg-muted/40 p-3 rounded-xl border border-border/60 flex-wrap sm:flex-nowrap">
              <div>
                <div className="text-[11px] text-muted-foreground">Total Invoiced</div>
                <div className="font-mono font-bold text-sm text-foreground">
                  ${(Number(subTotal) || 0).toFixed(2)} {currency}
                </div>
              </div>
              {calculatedTotals.totalPaidAmount > 0 && (
                <>
                  <div className="h-6 w-px bg-border hidden sm:block" />
                  <div>
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>Original Paid Subscription</span>
                    </div>
                    <div className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                      -${calculatedTotals.totalPaidAmount.toFixed(2)} {currency}
                    </div>
                  </div>
                </>
              )}
              <div className="h-6 w-px bg-border" />
              <div>
                <div className="text-[11px] text-muted-foreground font-semibold">
                  {calculatedTotals.totalPaidAmount > 0 ? "New Add-on Balance Due" : "Balance Due"}
                </div>
                <div className={`font-mono font-bold text-sm ${((invoiceStatus || "").toUpperCase().startsWith("PAID") || (invoiceStatus || "").toUpperCase().includes("COMPLETED") || calculatedTotals.effectiveBalanceDue === 0) ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                  ${calculatedTotals.effectiveBalanceDue.toFixed(2)} {currency}
                </div>
              </div>
            </div>
          </div>
  );
}
