import { ChevronDown, ChevronUp, Calendar, Clock } from "lucide-react";
import type { QuickBooksItemDetailsDialogViewState } from "../hooks/useQuickBooksItemDetailsDialogTail";

export function TopHeroFormFields({ v }: { v: QuickBooksItemDetailsDialogViewState }) {
  const { topFieldsCollapsed, setTopFieldsCollapsed, item, isBill, formattedAmountNumber } = v;
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-md p-4 border border-slate-200 dark:border-zinc-800 shadow-2xs space-y-3">
                {isBill ? (
                  /* BILL FORM HEADER */
                  <div className="flex flex-wrap lg:flex-nowrap items-start justify-between gap-4">
                    {/* Left inputs */}
                    <div className="flex flex-wrap items-start gap-4 flex-1 min-w-0">
                      {/* Vendor */}
                      <div className="w-full sm:w-[260px] space-y-1">
                        <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 block">
                          Vendor
                        </label>
                        <div className="flex items-center justify-between px-2.5 py-1.5 bg-white dark:bg-zinc-900 rounded border border-[#2ca01c] dark:border-emerald-600 text-xs font-medium text-slate-900 dark:text-white shadow-2xs h-8">
                          <span className="truncate">
                            {item.vendor_resolution?.name || item.raw_payee || "Choose a vendor"}
                          </span>
                          <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1.5" />
                        </div>
                        {item.vendor_resolution?.id && (
                          <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono truncate">
                            QBO Vendor ID: {item.vendor_resolution.id} {item.vendor_resolution.status ? `(${item.vendor_resolution.status})` : ""}
                          </div>
                        )}
                      </div>

                      {/* Terms */}
                      <div className="w-full sm:w-[160px] space-y-1">
                        <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 block">
                          Terms
                        </label>
                        <div className="flex items-center justify-between px-2.5 py-1.5 bg-white dark:bg-zinc-900 rounded border border-slate-300 dark:border-zinc-700 text-xs font-medium text-slate-900 dark:text-white shadow-2xs h-8">
                          <span className="truncate">Net 30</span>
                          <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1.5" />
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
                          Default Terms
                        </div>
                      </div>

                      {/* Bill Date */}
                      <div className="w-full sm:w-[160px] space-y-1">
                        <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 block">
                          Bill Date
                        </label>
                        <div className="flex items-center justify-between px-2.5 py-1.5 bg-white dark:bg-zinc-900 rounded border border-slate-300 dark:border-zinc-700 text-xs text-slate-900 dark:text-white shadow-2xs h-8">
                          <span>{item.payment_date || item.txn_date_api || "09/18/2026"}</span>
                          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1" />
                        </div>
                      </div>

                      {/* Due Date */}
                      <div className="w-full sm:w-[160px] space-y-1">
                        <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 block">
                          Due Date
                        </label>
                        <div className="flex items-center justify-between px-2.5 py-1.5 bg-white dark:bg-zinc-900 rounded border border-slate-300 dark:border-zinc-700 text-xs text-slate-900 dark:text-white shadow-2xs h-8">
                          <span>{item.due_date || item.payment_date || item.txn_date_api || "10/18/2026"}</span>
                          <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1" />
                        </div>
                      </div>
                    </div>

                    {/* Amount / Balance Due on Right */}
                    <div className="text-right shrink-0 min-w-[160px]">
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-zinc-400">
                        BALANCE DUE
                      </div>
                      <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight pt-0.5">
                        ${formattedAmountNumber}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* EXPENSE FORM HEADER */
                  <div className="flex flex-wrap lg:flex-nowrap items-start justify-between gap-4">
                    {/* Left inputs */}
                    <div className="flex flex-wrap items-start gap-4 flex-1 min-w-0">
                      {/* Payee */}
                      <div className="w-full sm:w-[260px] space-y-1">
                        <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 block">
                          Payee
                        </label>
                        <div className="flex items-center justify-between px-2.5 py-1.5 bg-white dark:bg-zinc-900 rounded border border-[#2ca01c] dark:border-emerald-600 text-xs font-medium text-slate-900 dark:text-white shadow-2xs h-8">
                          <span className="truncate">
                            {item.vendor_resolution?.name || item.raw_payee || "Who did you pay?"}
                          </span>
                          <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1.5" />
                        </div>
                        {item.vendor_resolution?.id && (
                          <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono truncate">
                            QBO Vendor ID: {item.vendor_resolution.id} {item.vendor_resolution.status ? `(${item.vendor_resolution.status})` : ""}
                          </div>
                        )}
                      </div>

                      {/* Payment account */}
                      <div className="w-full sm:w-[260px] space-y-1">
                        <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 block">
                          Payment account
                        </label>
                        <div className="flex items-center justify-between px-2.5 py-1.5 bg-white dark:bg-zinc-900 rounded border border-slate-300 dark:border-zinc-700 text-xs font-medium text-slate-900 dark:text-white shadow-2xs h-8">
                          <span className="truncate">
                            {item.payment_account_resolution?.name || "Business Credit Card"}
                          </span>
                          <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1.5" />
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
                          Balance <strong className="text-slate-800 dark:text-zinc-200">${formattedAmountNumber}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Amount on Right */}
                    <div className="text-right shrink-0 min-w-[160px]">
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-zinc-400">
                        AMOUNT
                      </div>
                      <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight pt-0.5">
                        ${formattedAmountNumber}
                      </div>
                    </div>
                  </div>
                )}

                {/* Row 2: Secondary Fields */}
                {!topFieldsCollapsed && (
                  <div className="flex flex-wrap items-start gap-4 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
                    {!isBill && (
                      <>
                        {/* Payment Date */}
                        <div className="w-full sm:w-[160px] space-y-1">
                          <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 block">
                            Payment Date
                          </label>
                          <div className="flex items-center justify-between px-2.5 py-1.5 bg-white dark:bg-zinc-900 rounded border border-slate-300 dark:border-zinc-700 text-xs text-slate-900 dark:text-white shadow-2xs h-8">
                            <span>{item.payment_date || item.txn_date_api || "09/18/2026"}</span>
                            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1" />
                          </div>
                        </div>

                        {/* Payment Method */}
                        <div className="w-full sm:w-[160px] space-y-1">
                          <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 block">
                            Payment Method
                          </label>
                          <div className="flex items-center justify-between px-2.5 py-1.5 bg-white dark:bg-zinc-900 rounded border border-slate-300 dark:border-zinc-700 text-xs text-slate-900 dark:text-white shadow-2xs h-8">
                            <span>{item.payment_method || "Credit Card"}</span>
                            <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1" />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Bill no. / Ref no. */}
                    <div className="w-full sm:w-[150px] space-y-1">
                      <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 block">
                        {isBill ? "Bill no." : "Ref no."}
                      </label>
                      <div className="px-2.5 py-1.5 bg-white dark:bg-zinc-900 rounded border border-slate-300 dark:border-zinc-700 text-xs text-slate-900 dark:text-white font-mono shadow-2xs h-8 flex items-center">
                        {item.doc_number || item.ref_no || (isBill ? `REC-${item.request_id}` : `REQ-${item.request_id}`)}
                      </div>
                    </div>

                    {/* Location */}
                    <div className="w-full sm:w-[180px] space-y-1">
                      <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 block">
                        Location
                      </label>
                      <div className="px-2.5 py-1.5 bg-white dark:bg-zinc-900 rounded border border-slate-300 dark:border-zinc-700 text-xs text-slate-900 dark:text-white truncate shadow-2xs h-8 flex items-center font-medium">
                        <span className="truncate">{item.location || item.from_location || ""}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Centered Chevron Toggle */}
                <div className="flex justify-center -mb-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setTopFieldsCollapsed(!topFieldsCollapsed)}
                    className="p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                    title={topFieldsCollapsed ? "Expand form fields" : "Collapse form fields"}
                  >
                    {topFieldsCollapsed ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronUp className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
  );
}
