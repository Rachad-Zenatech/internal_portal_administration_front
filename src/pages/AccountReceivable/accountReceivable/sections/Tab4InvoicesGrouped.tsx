import { Fragment } from "react";
import { Building2, ChevronRight, CornerDownRight, Mail, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Badge } from "../../../../components/ui/badge";
import type { AccountReceivableState } from "../hooks/useAccountReceivable";

export function Tab4InvoicesGrouped({ s }: { s: AccountReceivableState }) {
  const { deleteInvoiceMutation, handleOpenSendInvoiceEmail, navigate, toggleCustomerInvoiceExpanded, expandedCustomerInvoiceKeys, filteredCustomerInvoiceGroups, handleCollapseAllInvoiceCustomers, handleExpandAllInvoiceCustomers, setStatusFilter, statusFilter, setSearchTerm, searchTerm, activeTab } = s;
  return (
    <>
      {activeTab === "invoices" && (
          <div className="space-y-4">
            {/* Filter, Search & Bulk Accordion Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  id="ar-invoices-search"
                  name="invoicesSearch"
                  aria-label="Search invoices by customer, number, or due date"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search customer, invoice #, due date..."
                  className="pl-9 h-8 text-xs bg-slate-50 dark:bg-slate-800/60"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap justify-between sm:justify-end">
                <select
                  id="ar-invoices-status-filter"
                  name="invoicesStatusFilter"
                  aria-label="Filter invoices by status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-8 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="unpaid">Open / Unpaid</option>
                  <option value="paid">Paid in Full</option>
                  <option value="overdue">Overdue</option>
                  <option value="draft">Drafts</option>
                </select>

                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleExpandAllInvoiceCustomers(filteredCustomerInvoiceGroups.map((g) => g.customerKey))}
                    className="h-7 text-[11px] px-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer"
                    title="Expand all customer invoice accordions"
                  >
                    Expand All
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCollapseAllInvoiceCustomers}
                    className="h-7 text-[11px] px-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer"
                    title="Collapse all customer invoice accordions"
                  >
                    Collapse All
                  </Button>
                </div>

                <Button
                  onClick={() => navigate("/account-receivable/generate")}
                  size="sm"
                  className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs cursor-pointer h-8"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Invoice</span>
                </Button>
              </div>
            </div>

            {/* Invoices Grouped Accordion Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200/80 dark:border-slate-800 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4 w-[240px] min-w-[220px]">A/R Customer &amp; Invoice #</th>
                      <th className="py-3 px-4 w-[110px]">Issued Date</th>
                      <th className="py-3 px-4 w-[140px]">Due Date</th>
                      <th className="py-3 px-4 text-right w-[120px]">Total Amount</th>
                      <th className="py-3 px-4 text-right w-[120px]">Balance Due</th>
                      <th className="py-3 px-4 w-[110px]">Status</th>
                      <th className="py-3 px-4 text-right w-[140px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[12px]">
                    {filteredCustomerInvoiceGroups.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <p className="mb-3">No generated invoices found matching your criteria.</p>
                          <Button
                            onClick={() => navigate("/account-receivable/generate")}
                            size="sm"
                            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            <span>Create Your First Invoice</span>
                          </Button>
                        </td>
                      </tr>
                    ) : (
                      filteredCustomerInvoiceGroups.map((group) => {
                        const isExpanded = expandedCustomerInvoiceKeys.has(group.customerKey);

                        return (
                          <Fragment key={group.customerKey}>
                            {/* ── Parent Accordion Header Row: A/R Customer ── */}
                            <tr
                              onClick={(e) => toggleCustomerInvoiceExpanded(group.customerKey, e)}
                              className={`transition-colors cursor-pointer select-none border-t border-slate-200/70 dark:border-slate-800 ${
                                isExpanded
                                  ? "bg-indigo-50/60 dark:bg-indigo-950/30 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                                  : "bg-slate-50/70 dark:bg-slate-800/30 hover:bg-slate-100/70 dark:hover:bg-slate-800/60"
                              }`}
                            >
                              <td colSpan={3} className="py-3 px-4 font-bold text-slate-900 dark:text-zinc-100">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={(e) => toggleCustomerInvoiceExpanded(group.customerKey, e)}
                                    className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                                    title={isExpanded ? "Collapse invoices" : "Expand invoices"}
                                  >
                                    <ChevronRight
                                      className={`w-4 h-4 transition-transform duration-200 ${
                                        isExpanded ? "rotate-90 text-indigo-600 dark:text-indigo-400" : "text-slate-400"
                                      }`}
                                    />
                                  </button>

                                  <div className="flex items-center gap-1.5">
                                    <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                                      {group.customerName}
                                    </span>
                                  </div>

                                  <Badge
                                    variant="secondary"
                                    className="text-[10.5px] px-2 py-0.5 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 font-semibold shadow-2xs"
                                  >
                                    {group.invoices.length} {group.invoices.length === 1 ? "Invoice" : "Invoices"}
                                  </Badge>

                                  {group.hasOverdue && (
                                    <Badge className="text-[10px] px-2 py-0.5 bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 font-bold">
                                      Overdue Notice
                                    </Badge>
                                  )}
                                </div>
                              </td>

                              <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                                <span className="text-xs">${group.totalInvoiced.toFixed(2)}</span>
                              </td>

                              <td className="py-3 px-4 text-right font-mono font-bold">
                                <span
                                  className={
                                    group.totalBalanceDue === 0
                                      ? "text-emerald-600 dark:text-emerald-400 text-xs"
                                      : "text-amber-600 dark:text-amber-400 text-xs"
                                  }
                                >
                                  ${group.totalBalanceDue.toFixed(2)}
                                </span>
                              </td>

                              <td colSpan={2} className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {group.earliestDueDate && (
                                    <span className="text-[11px] text-muted-foreground font-mono hidden md:inline">
                                      Earliest Due: <strong>{group.earliestDueDate}</strong>
                                    </span>
                                  )}
                                  <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                                    {isExpanded ? "Hide Invoices ▴" : "View Invoices ▾"}
                                  </span>
                                </div>
                              </td>
                            </tr>

                            {/* ── Collapsible Child Rows: Invoices Sorted by Due Date ── */}
                            {isExpanded &&
                              group.invoices.map((inv) => (
                                <tr
                                  key={inv.id}
                                  onClick={() =>
                                    navigate(`/account-receivable/generate?invoiceId=${encodeURIComponent(inv.id)}`)
                                  }
                                  className="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 cursor-pointer transition-colors bg-white dark:bg-slate-900"
                                >
                                  <td className="py-3 px-4 pl-10 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                    <div className="flex items-center gap-2">
                                      <CornerDownRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      <span className="hover:underline">{inv.invoice_number}</span>
                                    </div>
                                  </td>

                                  <td className="py-3 px-4 text-slate-500 font-mono">{inv.invoice_date}</td>

                                  <td className="py-3 px-4 font-mono font-semibold">
                                    <span
                                      className={
                                        (inv.status || "").toUpperCase() === "OVERDUE"
                                          ? "text-rose-600 dark:text-rose-400 font-bold"
                                          : "text-slate-700 dark:text-slate-300"
                                      }
                                    >
                                      {inv.due_date || "—"}
                                    </span>
                                  </td>

                                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                                    ${Number(inv.total_amount).toFixed(2)} {inv.currency || "USD"}
                                  </td>

                                  <td className="py-3 px-4 text-right font-mono font-bold">
                                    <span
                                      className={
                                        Number(
                                          inv.balance_due !== undefined
                                            ? inv.balance_due
                                            : inv.status?.toUpperCase().startsWith("PAID")
                                            ? 0
                                            : inv.total_amount
                                        ) === 0
                                          ? "text-emerald-600 dark:text-emerald-400"
                                          : "text-amber-600 dark:text-amber-400"
                                      }
                                    >
                                      $
                                      {Number(
                                        inv.balance_due !== undefined
                                          ? inv.balance_due
                                          : inv.status?.toUpperCase().startsWith("PAID")
                                          ? 0
                                          : inv.total_amount
                                      ).toFixed(2)}{" "}
                                      {inv.currency || "USD"}
                                    </span>
                                  </td>

                                  <td className="py-3 px-4">
                                    <Badge
                                      className={
                                        (inv.status || "").toUpperCase() === "PAID (PRORATED)"
                                          ? "bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 border-teal-300 dark:border-teal-700 text-[10px] font-semibold"
                                          : (inv.status || "").toUpperCase() === "PAID"
                                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[10px]"
                                          : (inv.status || "").toUpperCase() === "DRAFT"
                                          ? "bg-slate-100 text-slate-700 border-slate-300 text-[10px]"
                                          : (inv.status || "").toUpperCase() === "OVERDUE"
                                          ? "bg-rose-50 text-rose-700 border-rose-200 text-[10px]"
                                          : (inv.status || "").toUpperCase() === "VOID" ||
                                            (inv.status || "").toUpperCase() === "CANCELLED"
                                          ? "bg-zinc-100 text-zinc-500 border-zinc-200 text-[10px]"
                                          : "bg-blue-50 text-blue-700 border-blue-200 text-[10px]"
                                      }
                                    >
                                      {inv.status || "ISSUED"}
                                    </Badge>
                                  </td>

                                  <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-end gap-1.5">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleOpenSendInvoiceEmail(inv)}
                                        className="h-7 text-xs rounded-lg gap-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border-indigo-200 cursor-pointer"
                                      >
                                        <Mail className="w-3 h-3" />
                                        <span>Send Email</span>
                                      </Button>

                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (
                                            window.confirm(
                                              `Are you sure you want to delete invoice ${inv.invoice_number}? This action cannot be undone.`
                                            )
                                          ) {
                                            deleteInvoiceMutation.mutate(inv.id);
                                          }
                                        }}
                                        disabled={deleteInvoiceMutation.isPending}
                                        className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                                        title="Delete invoice"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
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
