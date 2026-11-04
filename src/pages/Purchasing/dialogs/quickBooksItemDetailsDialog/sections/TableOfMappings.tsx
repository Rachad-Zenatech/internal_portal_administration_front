import { Layers, Calendar, ArrowRight, CreditCard, Building2, Tag, ShieldCheck, Split, MapPin, Clock } from "lucide-react";
import type { QuickBooksItemDetailsDialogViewState } from "../hooks/useQuickBooksItemDetailsDialogTail";

export function TableOfMappings({ v }: { v: QuickBooksItemDetailsDialogViewState }) {
  const { item, isBill, displayLines, isMultiPart, viewMode } = v;
  return (
    <>
      {viewMode === "mapping" && (
            <div className="space-y-3 max-w-[1460px] mx-auto">
              <div className="rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 space-y-0.5 shadow-2xs">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-blue-600" />
                  <span>Local Portal to QuickBooks Online {isBill ? "Bill" : "Expense"} Data Pipeline</span>
                </h4>
                <p className="text-slate-500 dark:text-zinc-400 text-[11px] leading-relaxed">
                  Every field from purchase request #{item.request_id} is dynamically matched against live QuickBooks Chart of Accounts, active Vendors, Locations, and {isBill ? "Accounts Payable (A/P)" : "Bank/Credit Card payment methods"}.
                </p>
              </div>

              {/* Table of Mappings */}
              <div className="rounded border border-slate-200 dark:border-zinc-800 divide-y divide-slate-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs overflow-hidden text-xs">
                <div className="p-2.5 grid grid-cols-12 items-center gap-3 bg-slate-50 dark:bg-zinc-800/60 font-semibold text-[10px] text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
                  <div className="col-span-3">Target Field</div>
                  <div className="col-span-4">Source Value</div>
                  <div className="col-span-5">QuickBooks Target Ledger / ID</div>
                </div>

                {/* Payee / Vendor */}
                <div className="p-2.5 grid grid-cols-12 items-center gap-3">
                  <div className="col-span-3 font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    <span>Vendor / Payee</span>
                  </div>
                  <div className="col-span-4 text-slate-600 dark:text-zinc-300 truncate" title={item.raw_payee}>
                    {item.raw_payee}
                  </div>
                  <div className="col-span-5 flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-emerald-600 shrink-0" />
                    <div className="truncate">
                      <span className="font-semibold text-slate-900 dark:text-white">{item.vendor_resolution?.name || item.raw_payee}</span>
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400 block font-mono">
                        QBO ID: {item.vendor_resolution?.id || "Auto-Create"} ({item.vendor_resolution?.status})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expense Account (or Itemized Split Lines) */}
                {isMultiPart ? (
                  <div className="p-3 space-y-2 bg-slate-50/40 dark:bg-zinc-900/40">
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Split className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                      <span>Expense Accounts (Itemized {displayLines.length} Split Lines)</span>
                    </div>
                    <div className="rounded border border-slate-200 dark:border-zinc-800 overflow-hidden">
                      <div className="p-2 grid grid-cols-12 gap-2 bg-slate-100 dark:bg-zinc-800 font-semibold text-[10px] text-slate-600 dark:text-zinc-400 uppercase">
                        <div className="col-span-1">#</div>
                        <div className="col-span-4">Line Description</div>
                        <div className="col-span-2 text-right">Amount</div>
                        <div className="col-span-5">Target QBO Expense Account</div>
                      </div>
                      <div className="divide-y divide-slate-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                        {displayLines.map((line, lIdx) => (
                          <div key={lIdx} className="p-2 grid grid-cols-12 gap-2 items-center text-xs">
                            <div className="col-span-1 font-mono font-bold text-slate-500">{line.line_num || lIdx + 1}</div>
                            <div className="col-span-4 truncate font-medium text-slate-800 dark:text-zinc-200" title={line.description}>
                              {line.description}
                            </div>
                            <div className="col-span-2 text-right font-mono font-semibold text-slate-900 dark:text-white">
                              ${(line.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="col-span-5 flex items-center gap-1.5 truncate">
                              <ArrowRight className="h-3 w-3 text-emerald-600 shrink-0" />
                              <div className="truncate">
                                <span className="font-semibold text-slate-900 dark:text-white">
                                  {line.account_name || line.category || item.expense_account_resolution?.name || "Expense"}
                                </span>
                                <span className="text-[10px] text-slate-500 dark:text-zinc-400 block font-mono">
                                  QBO ID: {line.account_id || item.expense_account_resolution?.id || "Auto-Match"}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 grid grid-cols-12 items-center gap-3">
                    <div className="col-span-3 font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>Expense Account (GL)</span>
                    </div>
                    <div className="col-span-4 text-slate-600 dark:text-zinc-300 truncate" title={item.category}>
                      {item.category}
                    </div>
                    <div className="col-span-5 flex items-center gap-2">
                      <ArrowRight className="h-3 w-3 text-emerald-600 shrink-0" />
                      <div className="truncate">
                        <span className="font-semibold text-slate-900 dark:text-white">{item.expense_account_resolution?.name || "Expense"}</span>
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400 block font-mono">
                          QBO Account ID: {item.expense_account_resolution?.id || "Auto-Match"} ({item.expense_account_resolution?.account_type || "Expense"})
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Settlement / AP Account */}
                {isBill ? (
                  <div className="p-2.5 grid grid-cols-12 items-center gap-3">
                    <div className="col-span-3 font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span>Accounts Payable (A/P)</span>
                    </div>
                    <div className="col-span-4 text-slate-600 dark:text-zinc-300">
                      Standard Vendor Credit Terms
                    </div>
                    <div className="col-span-5 flex items-center gap-2">
                      <ArrowRight className="h-3 w-3 text-emerald-600 shrink-0" />
                      <div className="truncate">
                        <span className="font-semibold text-slate-900 dark:text-white">Accounts Payable (A/P)</span>
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400 block font-mono">
                          QBO Entity: Bill (AP Ledger)
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 grid grid-cols-12 items-center gap-3">
                    <div className="col-span-3 font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span>Payment Settlement</span>
                    </div>
                    <div className="col-span-4 text-slate-600 dark:text-zinc-300 truncate" title={item.payment_method}>
                      {item.payment_method}
                    </div>
                    <div className="col-span-5 flex items-center gap-2">
                      <ArrowRight className="h-3 w-3 text-emerald-600 shrink-0" />
                      <div className="truncate">
                        <span className="font-semibold text-slate-900 dark:text-white">{item.payment_account_resolution?.name || "Business Checking"}</span>
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400 block font-mono">
                          QBO Account ID: {item.payment_account_resolution?.id || "Auto"} ({item.payment_account_resolution?.payment_type})
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Location (DepartmentRef) */}
                <div className="p-2.5 grid grid-cols-12 items-center gap-3">
                  <div className="col-span-3 font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                    <span>Location (Department)</span>
                  </div>
                  <div className="col-span-4 text-slate-600 dark:text-zinc-300 truncate" title={item.location || item.from_location}>
                    {item.location || item.from_location || "HQ"}
                  </div>
                  <div className="col-span-5 flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-emerald-600 shrink-0" />
                    <div className="truncate">
                      <span className="font-semibold text-slate-900 dark:text-white">{item.location || item.from_location || "Default Location"}</span>
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400 block font-mono">
                        QBO DepartmentRef: {item.location_id || item.location_resolution?.id || "Auto-Matched"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Transaction Date */}
                <div className="p-2.5 grid grid-cols-12 items-center gap-3">
                  <div className="col-span-3 font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span>{isBill ? "Bill Date (TxnDate)" : "Payment Date (TxnDate)"}</span>
                  </div>
                  <div className="col-span-4 text-slate-600 dark:text-zinc-300">
                    {item.payment_date}
                  </div>
                  <div className="col-span-5 flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-emerald-600 shrink-0" />
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">{item.txn_date_api}</span>
                  </div>
                </div>

                {/* Due Date (If Bill) */}
                {isBill && (
                  <div className="p-2.5 grid grid-cols-12 items-center gap-3">
                    <div className="col-span-3 font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span>Due Date</span>
                    </div>
                    <div className="col-span-4 text-slate-600 dark:text-zinc-300">
                      {item.due_date || item.payment_date}
                    </div>
                    <div className="col-span-5 flex items-center gap-2">
                      <ArrowRight className="h-3 w-3 text-emerald-600 shrink-0" />
                      <span className="font-mono font-semibold text-slate-900 dark:text-white">{item.due_date || item.txn_date_api}</span>
                    </div>
                  </div>
                )}

                {/* DocNumber */}
                <div className="p-2.5 grid grid-cols-12 items-center gap-3">
                  <div className="col-span-3 font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span>DocNumber / Ref</span>
                  </div>
                  <div className="col-span-4 text-slate-600 dark:text-zinc-300">
                    {item.ref_no || (isBill ? `REC-${item.request_id}` : `REQ-${item.request_id}`)}
                  </div>
                  <div className="col-span-5 flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-emerald-600 shrink-0" />
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">{item.doc_number}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
    </>
  );
}
