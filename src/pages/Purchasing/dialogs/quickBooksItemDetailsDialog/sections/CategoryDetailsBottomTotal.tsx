import { ChevronDown, ChevronUp, GripVertical, Copy } from "lucide-react";
import type { QuickBooksItemDetailsDialogViewState } from "../hooks/useQuickBooksItemDetailsDialogTail";

export function CategoryDetailsBottomTotal({ v }: { v: QuickBooksItemDetailsDialogViewState }) {
  const { formattedAmountNumber, isMultiPart, displayLines, item, categoryDetailsOpen, setCategoryDetailsOpen } = v;
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-md border border-slate-200 dark:border-zinc-800 shadow-2xs overflow-hidden">
                <div className="px-4 py-2 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900">
                  <button
                    type="button"
                    onClick={() => setCategoryDetailsOpen(!categoryDetailsOpen)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white hover:text-slate-700"
                  >
                    {categoryDetailsOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                    ) : (
                      <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
                    )}
                    <span>Category details {isMultiPart && `(${displayLines.length} Itemized Split Lines)`}</span>
                  </button>

                  <div className="flex items-center gap-2 text-slate-400">
                    <button type="button" className="hover:text-slate-700 dark:hover:text-zinc-200 p-0.5" title="Copy Table Lines">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {categoryDetailsOpen && (
                  <div className="overflow-x-auto">
                    <table className="w-full table-fixed text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/60 text-[10px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                          <th className="w-9 py-1.5 px-2 text-center shrink-0">#</th>
                          <th className="py-1.5 px-2.5 w-[22%]">CATEGORY</th>
                          <th className="py-1.5 px-2.5 w-[32%]">DESCRIPTION</th>
                          <th className="py-1.5 px-2.5 w-24 text-right">AMOUNT</th>
                          <th className="py-1.5 px-2.5 w-14 text-center">BILLABLE</th>
                          <th className="py-1.5 px-2.5 w-32">CLASS</th>
                          <th className="py-1.5 px-2.5 w-28">CUSTOMER / DEPT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">
                        {displayLines.map((line, idx) => {
                          const lineAmountStr = (line.amount !== undefined)
                            ? line.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : formattedAmountNumber;
                          const lineCatName = line.account_name || line.category || item.expense_account_resolution?.name || item.category || "Expense";
                          const lineAcctNum = line.acct_num || item.expense_account_resolution?.acct_num;
                          const lineClass = line.class || item.class || "";

                          return (
                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                              <td className="py-2 px-2 text-center text-slate-400">
                                <div className="flex items-center justify-center gap-0.5">
                                  <GripVertical className="h-3 w-3 text-slate-300 dark:text-zinc-600" />
                                  <span className="font-semibold text-slate-600 dark:text-zinc-400 text-[11px]">
                                    {line.line_num || idx + 1}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2 px-2.5 min-w-0">
                                <div
                                  title={`${lineCatName} ${lineAcctNum ? `(${lineAcctNum})` : ''}`}
                                  className="flex items-center justify-between px-2.5 py-1 rounded border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xs h-7 min-w-0"
                                >
                                  <div className="truncate text-xs min-w-0">
                                    <span className="font-semibold text-slate-900 dark:text-white">
                                      {lineCatName}
                                    </span>
                                    {lineAcctNum && (
                                      <span className="text-[10px] text-muted-foreground ml-1 font-mono">
                                        ({lineAcctNum})
                                      </span>
                                    )}
                                  </div>
                                  <ChevronDown className="h-3 w-3 text-slate-400 ml-1 shrink-0" />
                                </div>
                              </td>
                              <td className="py-2 px-2.5 min-w-0">
                                <div
                                  title={line.description || item.product_name}
                                  className="px-2.5 py-1 rounded border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 truncate shadow-2xs text-xs h-7 flex items-center min-w-0 cursor-default"
                                >
                                  <span className="truncate">{line.description || item.product_name}</span>
                                </div>
                              </td>
                              <td className="py-2 px-2.5 text-right">
                                <div className="px-2.5 py-1 rounded border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white font-mono font-semibold text-right shadow-2xs text-xs h-7 flex items-center justify-end">
                                  {lineAmountStr}
                                </div>
                              </td>
                              <td className="py-2 px-2.5 text-center">
                                <input
                                  type="checkbox"
                                  readOnly
                                  className="rounded border-slate-300 text-[#2ca01c] focus:ring-[#2ca01c] h-3.5 w-3.5"
                                />
                              </td>
                              <td className="py-2 px-2.5 min-w-0">
                                <div
                                  title={lineClass}
                                  className="flex items-center justify-between px-2.5 py-1 rounded border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 shadow-2xs text-xs h-7 min-w-0"
                                >
                                  <span className="truncate font-medium">{lineClass || <span className="text-slate-400 dark:text-zinc-500">—</span>}</span>
                                  <ChevronDown className="h-3 w-3 text-slate-400 ml-1 shrink-0" />
                                </div>
                              </td>
                              <td className="py-2 px-2.5 min-w-0">
                                <div
                                  title={line.customer || item.department || "Internal"}
                                  className="flex items-center justify-between px-2.5 py-1 rounded border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 shadow-2xs text-xs h-7 min-w-0"
                                >
                                  <span className="truncate">{line.customer || item.department || "Internal"}</span>
                                  <ChevronDown className="h-3 w-3 text-slate-400 ml-1 shrink-0" />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Category Details Bottom Total */}
                    <div className="p-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/40 dark:bg-zinc-900/60">
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium flex items-center gap-2">
                        <span>{displayLines.length} category {displayLines.length === 1 ? 'line' : 'lines'}</span>
                        {isMultiPart && (
                          <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                            Split Parts Preserved
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline gap-2 text-right">
                        <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Total</span>
                        <span className="text-xl font-bold text-slate-900 dark:text-white font-sans">
                          ${formattedAmountNumber}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
  );
}
