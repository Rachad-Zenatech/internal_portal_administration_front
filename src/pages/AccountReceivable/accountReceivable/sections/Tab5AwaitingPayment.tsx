import { Link2, RefreshCw } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import type { AccountReceivableState } from "../hooks/useAccountReceivable";
import { AwaitingPaymentRow } from "./AwaitingPaymentRow";

export function Tab5AwaitingPayment({ s }: { s: AccountReceivableState }) {
  const {
    activeTab,
    awaitingPaymentInvoices,
    handleOpenRecordInvoicePayment,
    emailMatchesByInvoice,
    unmatchedEmailCount,
    isScanningEmails,
    handleScanEmailPayments,
    setIsUnmatchedDrawerOpen,
  } = s;

  if (activeTab !== "awaiting_payment") return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
          {awaitingPaymentInvoices.length} invoice(s) awaiting payment
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleScanEmailPayments()} disabled={isScanningEmails} className="h-7 text-xs rounded-xl gap-1.5 cursor-pointer">
            <RefreshCw className={`w-3 h-3 ${isScanningEmails ? "animate-spin" : ""}`} />
            <span>{isScanningEmails ? "Scanning..." : "Scan A/R Emails"}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsUnmatchedDrawerOpen(true)} className="h-7 text-xs rounded-xl gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 cursor-pointer">
            <Link2 className="w-3 h-3" />
            <span>Unmatched Payments ({unmatchedEmailCount})</span>
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 font-bold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Invoice Date</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {awaitingPaymentInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No invoices currently awaiting payment.
                  </td>
                </tr>
              ) : (
                awaitingPaymentInvoices.map((inv) => (
                  <AwaitingPaymentRow key={inv.id} inv={inv} match={emailMatchesByInvoice[inv.id]} onRecord={handleOpenRecordInvoicePayment} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
