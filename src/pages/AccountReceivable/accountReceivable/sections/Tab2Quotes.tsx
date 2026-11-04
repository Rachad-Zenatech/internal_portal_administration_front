import { Fragment } from "react";
import { CheckCircle2, ChevronRight, CornerDownRight, RefreshCw, Search, Send, Trash2 } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Badge } from "../../../../components/ui/badge";
import { calculateRowPricing } from "../../utils/lineItemPricingUtils";
import type { AccountReceivableState } from "../hooks/useAccountReceivable";

export function Tab2Quotes({ s }: { s: AccountReceivableState }) {
  const { navigate, setQuoteToSend, deleteQuoteMutation, toggleQuoteExpanded, expandedQuoteIds, filteredQuoteGroups, setStatusFilter, statusFilter, setSearchTerm, searchTerm, activeTab } = s;
  return (
    <>
      {activeTab === "quotes" && (
          <div className="space-y-4">
            {/* Filter and Search */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  id="ar-quotes-search"
                  name="quotesSearch"
                  aria-label="Search quotations by number, customer, or email"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search quote #, customer name, email..."
                  className="pl-9 h-8 text-xs bg-slate-50 dark:bg-slate-800/60"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  id="ar-quotes-status-filter"
                  name="quotesStatusFilter"
                  aria-label="Filter quotations by status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-8 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">Drafts</option>
                  <option value="published">Published</option>
                  <option value="signed">Signed</option>
                  <option value="changes">Changes Requested</option>
                </select>
              </div>
            </div>

            {/* Quotes Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Quote #</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4">Publication</th>
                      <th className="py-3 px-4">Customer Response</th>
                      <th className="py-3 px-4">Last Viewed</th>
                      <th className="py-3 px-4">Link Expiry</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredQuoteGroups.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          No quotations found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredQuoteGroups.map((group) => {
                        const q = group.head;
                        const isSigned = q.customer_response_state === "SIGNED";
                        const isChanges = q.customer_response_state === "CHANGES_REQUESTED";
                        const isSuperseded = q.publication_state === "DISABLED" || q.customer_response_state === "SUPERSEDED" || !!q.superseded_by_id;
                        const hasRevisions = group.revisions.length > 0;
                        const isExpanded = expandedQuoteIds.has(q.id);
                        const isRenewal = (q as any).quote_type === "RENEWAL" || !!(q as any).source_invoice_id || !!(q as any).source_invoice_number || (q as any).line_items?.some((li: any) => li.is_renewal || li.badge === "Renewal");

                        const getEffectiveQuoteTotal = (quoteItem: any) => {
                          const isRen = quoteItem.quote_type === "RENEWAL" || !!quoteItem.source_invoice_id || !!quoteItem.source_invoice_number || quoteItem.line_items?.some((li: any) => li.is_renewal || li.badge === "Renewal");
                          if (isRen && quoteItem.line_items && quoteItem.line_items.length > 0) {
                            const sumLines = quoteItem.line_items.reduce((acc: number, li: any) => {
                              const p = calculateRowPricing({
                                quantity: li.quantity ?? 1,
                                unit_price: li.price ?? li.unit_price ?? 0,
                                unit_discount: li.unit_discount ?? 0,
                                discount_type: li.discount_type || "%",
                                billing_frequency: li.billing_frequency || li.billing_type || "",
                                term: li.term ?? 1,
                                billing_start_date: li.billing_start_date || li.service_period_start || "",
                                tax_rate: li.tax_rate ?? 0,
                                is_renewal: true,
                                is_prorated: false,
                                quote_type: "RENEWAL",
                              });
                              return acc + (li.is_renewal ? p.amount : (Number(li.subtotal) || p.amount));
                            }, 0);
                            if (sumLines > 0) {
                              const disc = Number(quoteItem.discount || 0);
                              return Math.max(0, sumLines - disc);
                            }
                          }
                          return Number(quoteItem.total_amount || 0);
                        };

                        return (
                          <Fragment key={q.id}>
                            <tr
                              onClick={() => navigate(`/account-receivable/quotes/${q.id}`)}
                              className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer transition-colors ${
                                isSuperseded ? "opacity-70 bg-slate-50/40 dark:bg-slate-900/30" : ""
                              } ${isExpanded ? "bg-slate-50/50 dark:bg-slate-800/30" : ""}`}
                            >
                              <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {hasRevisions ? (
                                    <button
                                      type="button"
                                      onClick={(e) => toggleQuoteExpanded(q.id, e)}
                                      className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                                      title={isExpanded ? "Collapse revisions" : "Show previous versions"}
                                    >
                                      <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-90 text-amber-600" : ""}`} />
                                    </button>
                                  ) : (
                                    <div className="w-5" />
                                  )}
                                  <span>{q.quote_number}</span>
                                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800/60">
                                    v{q.current_version}
                                  </span>
                                  {isRenewal && (
                                    <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800 text-[10px] font-semibold px-1.5 py-0.5 gap-1 shrink-0">
                                      <RefreshCw className="w-2.5 h-2.5 text-indigo-600 dark:text-indigo-400" />
                                      <span>Renewal</span>
                                    </Badge>
                                  )}
                                  {hasRevisions && (
                                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-slate-500 bg-white dark:bg-slate-800 border-slate-200">
                                      +{group.revisions.length} rev{group.revisions.length > 1 ? "s" : ""}
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <strong className="block text-slate-800 dark:text-zinc-200">{q.customer_name || "Direct Client"}</strong>
                                <span className="text-[10px] text-slate-400">{q.customer_email || "No email"}</span>
                              </td>
                              <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900 dark:text-white">
                                ${getEffectiveQuoteTotal(q).toFixed(2)} {q.currency}
                              </td>
                              <td className="py-3.5 px-4">
                                {isSuperseded ? (
                                  <Badge className="bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[10px]">
                                    Disabled
                                  </Badge>
                                ) : q.publication_state === "PUBLISHED" ? (
                                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px]">
                                    Published
                                  </Badge>
                                ) : (
                                  <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 text-[10px]">
                                    Draft
                                  </Badge>
                                )}
                              </td>
                              <td className="py-3.5 px-4">
                                {isSuperseded ? (
                                  <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-300">
                                    Moved to v{q.superseded_by_version || q.current_version + 1}
                                  </Badge>
                                ) : isSigned ? (
                                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px] gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Signed</span>
                                  </Badge>
                                ) : isChanges ? (
                                  <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-semibold">
                                    Changes Requested
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] text-slate-500">
                                    Awaiting Response
                                  </Badge>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                                {q.last_viewed_at ? new Date(q.last_viewed_at).toLocaleDateString() : "Not viewed"}
                              </td>
                              <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                                {q.active_link_expires_at ? new Date(q.active_link_expires_at).toLocaleDateString() : "—"}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                  {q.publication_state === "DRAFT" && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm(`Are you sure you want to delete draft quote ${q.quote_number}? This action cannot be undone.`)) {
                                          deleteQuoteMutation.mutate(q.id);
                                        }
                                      }}
                                      disabled={deleteQuoteMutation.isPending}
                                      className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                                      title="Delete draft quote"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  )}
                                  {!isSuperseded && q.publication_state === "PUBLISHED" && !isSigned && (
                                    <Button
                                      size="sm"
                                      onClick={() => setQuoteToSend(q)}
                                      className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-lg gap-1"
                                    >
                                      <Send className="w-3 h-3" />
                                      <span>Send</span>
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate(`/account-receivable/quotes/${q.id}`)}
                                    className="h-7 text-xs rounded-lg cursor-pointer"
                                  >
                                    Details
                                  </Button>
                                </div>
                              </td>
                            </tr>

                            {/* Expandable Sub-items for Previous Revisions */}
                            {isExpanded &&
                              group.revisions.map((rev) => {
                                const isRevRenewal = (rev as any).quote_type === "RENEWAL" || !!(rev as any).source_invoice_id || (rev as any).line_items?.some((li: any) => li.is_renewal || li.badge === "Renewal");
                                return (
                                <tr
                                  key={rev.id}
                                  onClick={() => navigate(`/account-receivable/quotes/${rev.id}`)}
                                  className="bg-amber-50/20 dark:bg-amber-950/10 hover:bg-amber-100/30 dark:hover:bg-amber-900/20 cursor-pointer transition-colors text-slate-600 dark:text-slate-400 border-l-4 border-l-amber-500"
                                >
                                  <td className="py-2.5 px-4 font-mono">
                                    <div className="flex items-center gap-2 pl-7 flex-wrap">
                                      <CornerDownRight className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                      <span className="text-slate-700 dark:text-slate-300 font-medium">{rev.quote_number}</span>
                                      <Badge className="bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[9px] px-1.5 py-0">
                                        v{rev.current_version}
                                      </Badge>
                                      {isRevRenewal && (
                                        <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800 text-[9px] px-1 py-0 font-semibold gap-1">
                                          <RefreshCw className="w-2 h-2 text-indigo-600" />
                                          <span>Renewal</span>
                                        </Badge>
                                      )}
                                      <span className="text-[10px] text-slate-400 font-sans italic">Previous Version</span>
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-4 text-xs">
                                    <span className="text-slate-700 dark:text-slate-300">{rev.customer_name || "Direct Client"}</span>
                                  </td>
                                  <td className="py-2.5 px-4 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                                    ${getEffectiveQuoteTotal(rev).toFixed(2)} {rev.currency}
                                  </td>
                                  <td className="py-2.5 px-4">
                                    <Badge className="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 text-[10px] border border-slate-200 dark:border-slate-700">
                                      Disabled
                                    </Badge>
                                  </td>
                                  <td className="py-2.5 px-4">
                                    <Badge variant="outline" className="text-[10px] text-amber-700 dark:text-amber-400 border-amber-300/80 bg-amber-50/50 dark:bg-amber-950/30">
                                      {rev.superseded_by_quote_number && rev.superseded_by_quote_number !== rev.quote_number
                                        ? `Superseded by ${rev.superseded_by_quote_number}`
                                        : `Superseded by v${rev.superseded_by_version || q.current_version}`}
                                    </Badge>
                                  </td>
                                  <td className="py-2.5 px-4 font-mono text-[10px] text-slate-400">
                                    {rev.last_viewed_at ? new Date(rev.last_viewed_at).toLocaleDateString() : "—"}
                                  </td>
                                  <td className="py-2.5 px-4 font-mono text-[10px] text-slate-400">
                                    {rev.active_link_expires_at ? new Date(rev.active_link_expires_at).toLocaleDateString() : "—"}
                                  </td>
                                  <td className="py-2.5 px-4 text-right">
                                    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => navigate(`/account-receivable/quotes/${rev.id}`)}
                                        className="h-6 px-2 text-[11px] text-amber-700 dark:text-amber-400 hover:text-amber-800 hover:bg-amber-100/50 rounded-md cursor-pointer"
                                      >
                                        View Revision
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                                );
                              })}
                          </Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
    </>
  );
}
