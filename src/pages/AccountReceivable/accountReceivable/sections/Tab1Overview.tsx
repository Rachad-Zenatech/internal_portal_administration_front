import { Building2, DollarSign, FileCheck2, FileText, PenTool, Receipt } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import type { AccountReceivableState } from "../hooks/useAccountReceivable";

export function Tab1Overview({ s }: { s: AccountReceivableState }) {
  const { navigate, customers, setActiveTab, summaryStats, toInvoiceQuotes, invoices, quotes, activeTab } = s;
  return (
    <>
      {activeTab === "overview" && (
          <div className="space-y-6">
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-semibold">Total Quotes</span>
                  <FileText className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {summaryStats?.total_quotes || quotes.length}
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span>{summaryStats?.published_quotes || 0} Published</span>
                  <span>•</span>
                  <span>{summaryStats?.draft_quotes || 0} Drafts</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-semibold">Signed / To Invoice</span>
                  <FileCheck2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {summaryStats?.to_invoice_count || toInvoiceQuotes.length}
                </div>
                <div className="text-[11px] text-slate-400">
                  Quotes signed and awaiting invoice generation
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-semibold">Total Invoices</span>
                  <Receipt className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                  {invoices.length}
                </div>
                <div className="text-[11px] text-slate-400">
                  Archived formal invoice snapshots
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-semibold">Total Outstanding (USD)</span>
                  <DollarSign className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                  ${(summaryStats?.total_outstanding || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-slate-400">
                  Across all active proposals &amp; invoices
                </div>
              </div>
            </div>

            {/* Quick Attention Tasks Bar */}
            {toInvoiceQuotes.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <PenTool className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <h3 className="text-xs font-bold">
                      {toInvoiceQuotes.length} Signed Quote{toInvoiceQuotes.length > 1 ? "s" : ""} Ready for Invoice Generation
                    </h3>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      Customer acceptance has been verified with handwritten signatures.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => setActiveTab("to_invoice")}
                  className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs"
                >
                  View To Invoice Queue
                </Button>
              </div>
            )}

            {/* Outstanding Balances By Currency */}
            {summaryStats?.outstanding_by_currency && Object.keys(summaryStats.outstanding_by_currency).length > 0 && (
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Outstanding Receivables by Currency</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(summaryStats.outstanding_by_currency).map(([curr, amt]) => (
                    <div key={curr} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">{curr}</span>
                      <div className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                        ${amt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Profiles & Template Shortcuts */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>Customer Profiles &amp; Quick Generator</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Fast generation of custom quotes or invoices for active clients.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("hubspot_companies")}
                  className="text-xs rounded-xl cursor-pointer"
                >
                  <span>View All Customers ({customers.length})</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {customers.slice(0, 3).map((cust) => (
                  <div
                    key={cust.id}
                    className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">{cust.name}</span>
                        {cust.has_template && (
                          <Badge className="bg-blue-50 text-blue-600 text-[9px] px-1.5 py-0">Template</Badge>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 block truncate">{cust.email || cust.contact_person || "No email"}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/account-receivable/generate-quote?customerId=${encodeURIComponent(cust.id)}&customerName=${encodeURIComponent(cust.display_name || cust.name || "")}`)}
                        className="h-7 text-[11px] flex-1 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 border-amber-200 cursor-pointer"
                      >
                        <FileText className="w-3 h-3 mr-1 text-amber-600" />
                        <span>Quote</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/account-receivable/generate?customerId=${encodeURIComponent(cust.id)}`)}
                        className="h-7 text-[11px] flex-1 text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border-indigo-200 cursor-pointer"
                      >
                        <Receipt className="w-3 h-3 mr-1 text-indigo-600" />
                        <span>Invoice</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
    </>
  );
}
