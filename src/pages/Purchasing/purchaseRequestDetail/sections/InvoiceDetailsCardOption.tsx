import React from "react";
import { Receipt, Plus, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { renderBankAccountBadge, renderCategoryBadge } from "@/utils/glAccountUtils";
import { formatDate, formatMoney } from "../../utils/purchasingMeta";
import { Button } from "@/components/ui/button";
import HelpIcon from "@/components/ui/HelpIcon";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PurchaseRequestDetailViewState } from "../hooks/usePurchaseRequestDetailTail";

export function InvoiceDetailsCardOption({ v }: { v: PurchaseRequestDetailViewState }) {
  const { allInstallments, handleOpenRecordPayment, request, setExpandedInvoices, glCodes, allInvoices, invoiceSortOrder, expandedInvoices, totalCycles, totalCommitment, setInvoiceSortOrder } = v;
  return (
    <Card className="shadow-xs border-slate-200 dark:border-zinc-800">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-indigo-600" />
                    <span>Invoice & Billing Records</span>
                  </CardTitle>
                  {allInvoices.length > 0 && (
                    <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800">
                      {allInvoices.length} {allInvoices.length === 1 ? 'Record' : 'Records'}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {allInvoices.length > 1 && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setInvoiceSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
                        className="text-xs h-7 px-2 gap-1 text-muted-foreground hover:text-foreground"
                        title={invoiceSortOrder === "desc" ? "Showing newest first" : "Showing oldest first"}
                      >
                        <ArrowUpDown className="h-3 w-3" />
                        <span>{invoiceSortOrder === "desc" ? "Newest First" : "Oldest First"}</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const isAll = allInvoices.every((inv, idx) => expandedInvoices[inv.id || idx]);
                          const next: Record<string | number, boolean> = {};
                          allInvoices.forEach((inv, idx) => {
                            next[inv.id || idx] = !isAll;
                          });
                          setExpandedInvoices(next);
                        }}
                        className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
                      >
                        {allInvoices.every((inv, idx) => expandedInvoices[inv.id || idx]) ? "Collapse All" : "Expand All"}
                      </Button>
                    </>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenRecordPayment(allInstallments.find(i => i.status === "CURRENT") || allInstallments[0])}
                    className="text-xs h-7 gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Record Invoice
                  </Button>
                </div>
              </div>

              {/* Summary KPI Roll-Up Banner for Multiple Records */}
              {allInvoices.length > 0 && (() => {
                const totalInvoiced = allInvoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
                const schedTotal = totalCommitment;
                const progressPct = schedTotal && schedTotal > 0 ? Math.min(100, Math.round((totalInvoiced / schedTotal) * 100)) : null;

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800/80">
                    <div className="p-2.5 rounded-lg bg-slate-50/80 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
                      <div className="text-[11px] font-medium text-muted-foreground">Total Settled</div>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          {formatMoney(totalInvoiced)}
                        </span>
                        {schedTotal != null && schedTotal > 0 && (
                          <span className="text-[11px] font-mono text-muted-foreground">
                            / {formatMoney(schedTotal)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50/80 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
                      <div className="text-[11px] font-medium text-muted-foreground">Settled Cycles</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                          {totalCycles
                            ? `${allInvoices.length} of ${totalCycles} Cycles`
                            : `${allInvoices.length} ${allInvoices.length === 1 ? 'Cycle Settled (Ongoing)' : 'Cycles Settled (Ongoing)'}`}
                        </span>
                        {progressPct !== null && (
                          <Badge variant="secondary" className="text-[10px] font-mono py-0 px-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            {progressPct}%
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="col-span-2 sm:col-span-1 p-2.5 rounded-lg bg-slate-50/80 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
                      <div className="text-[11px] font-medium text-muted-foreground">Avg per Billing</div>
                      <div className="text-sm font-bold font-mono text-slate-800 dark:text-zinc-200 mt-0.5">
                        {formatMoney(totalInvoiced / (allInvoices.length || 1))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardHeader>

            <CardContent className="p-0 text-xs">
              {allInvoices.length > 0 ? (() => {
                const sortedInvoices = [...allInvoices].sort((a, b) => {
                  const dateA = new Date(a.invoice_date || a.created_at || 0).getTime();
                  const dateB = new Date(b.invoice_date || b.created_at || 0).getTime();
                  return invoiceSortOrder === "desc" ? dateB - dateA : dateA - dateB;
                });

                return (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/80 dark:bg-zinc-900/80 border-b border-slate-200/80 dark:border-zinc-800">
                        <TableHead className="w-[100px] text-xs font-semibold">Record</TableHead>
                        <TableHead className="text-xs font-semibold">Bill Date</TableHead>
                        <TableHead className="text-xs font-semibold">Vendor</TableHead>
                        <TableHead className="text-xs font-semibold">Bank Account</TableHead>
                        <TableHead className="text-xs font-semibold">Category (GL)</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Amount</TableHead>
                        <TableHead className="w-[140px] text-xs font-semibold text-center">Status</TableHead>
                        <TableHead className="w-[45px] text-center"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedInvoices.map((inv, idx) => {
                        const key = inv.id || idx;
                        const isExpanded = !!expandedInvoices[key];
                        const recordNum = invoiceSortOrder === "desc" ? allInvoices.length - idx : idx + 1;

                        return (
                          <React.Fragment key={key}>
                            <TableRow
                              className={cn(
                                "cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-zinc-800/50",
                                isExpanded && "bg-slate-50/60 dark:bg-zinc-800/40"
                              )}
                              onClick={() => setExpandedInvoices(prev => ({ ...prev, [key]: !prev[key] }))}
                            >
                              <TableCell className="font-semibold py-2.5">
                                <div className="flex items-center gap-1.5">
                                  <Badge variant="outline" className="text-[10px] font-mono py-0 px-1.5 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300">
                                    #{inv.id || recordNum}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="font-medium text-slate-900 dark:text-zinc-100 whitespace-nowrap py-2.5">
                                {formatDate(inv.invoice_date || inv.created_at)}
                              </TableCell>
                              <TableCell className="text-slate-700 dark:text-zinc-300 font-medium max-w-[160px] truncate py-2.5">
                                {inv.vendor || request.title}
                              </TableCell>
                              <TableCell className="py-2.5">
                                {renderBankAccountBadge(inv.bank_account || (request as any)?.bank_account, glCodes)}
                              </TableCell>
                              <TableCell className="py-2.5">
                                {renderCategoryBadge(inv.gl_code || (inv as any)?.category || request.gl_code, glCodes)}
                              </TableCell>
                              <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap py-2.5">
                                {formatMoney(inv.amount, inv.currency || request.currency || "USD")}
                                {inv.actual_cost_after_tax != null && (
                                  <div className="text-[10px] font-normal text-slate-500 dark:text-zinc-400">
                                    After tax: {formatMoney(inv.actual_cost_after_tax, inv.currency || request.currency || "USD")}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-center py-2.5">
                                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 font-semibold py-0 whitespace-nowrap">
                                  {inv.paid_date ? `Settled · ${formatDate(inv.paid_date)}` : "Settled · " + formatDate(inv.invoice_date)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center p-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedInvoices(prev => ({ ...prev, [key]: !prev[key] }));
                                  }}
                                >
                                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                </Button>
                              </TableCell>
                            </TableRow>

                            {/* Collapsible Row Drawer */}
                            {isExpanded && (
                              <TableRow className="bg-slate-50/60 dark:bg-zinc-800/30 hover:bg-slate-50/60 border-b border-slate-200 dark:border-zinc-800">
                                <TableCell colSpan={8} className="p-0">
                                  <div className="p-3.5 sm:p-4 bg-slate-50/80 dark:bg-zinc-800/50 border-t border-b border-slate-200/60 dark:border-zinc-700/60 space-y-3">
                                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/50 dark:border-zinc-700/50">
                                      <div className="font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                                        <span>Billing Record #{recordNum} Details</span>
                                        <span className="font-mono text-slate-400 font-normal">ID #{inv.id}</span>
                                      </div>
                                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                                        {formatMoney(inv.amount, inv.currency || request.currency || "USD")}
                                        {inv.actual_cost_after_tax != null && (
                                          <span className="ml-2 text-xs font-normal text-slate-500 dark:text-zinc-400">
                                            (after tax {formatMoney(inv.actual_cost_after_tax, inv.currency || request.currency || "USD")})
                                          </span>
                                        )}
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                      <div className="p-2.5 rounded-md bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800">
                                        <div className="text-muted-foreground font-medium flex items-center gap-1 mb-1">
                                          <span>Asset Flag</span>
                                          <HelpIcon text="Asset Flag designates whether this invoice represents a Capitalized Fixed Asset (CapEx) — such as equipment, hardware, lease/financing agreements, or software licenses — rather than an immediate operational expense (OpEx). When checked, the cost is capitalized on the balance sheet and depreciated/amortized over time instead of expensed in full in the current period. It automatically defaults to active for Scheduled Payments, Recurring obligations, and Accounts Payable." />
                                        </div>
                                        <span className="font-semibold text-slate-900 dark:text-zinc-100">
                                          {inv.asset_flag ? "Yes (Capitalized Asset)" : "No (OpEx)"}
                                        </span>
                                      </div>

                                      <div className="p-2.5 rounded-md bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800">
                                        <div className="text-muted-foreground font-medium mb-1">Date Arrived</div>
                                        <span className="font-semibold text-slate-900 dark:text-zinc-100">
                                          {formatDate(inv.created_at)}
                                        </span>
                                      </div>

                                      <div className="p-2.5 rounded-md bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800">
                                        <div className="text-muted-foreground font-medium mb-1">Department / Location</div>
                                        <span className="font-semibold text-slate-900 dark:text-zinc-100">
                                          {inv.department || request.department || "General"} {inv.from_location ? `· ${inv.from_location}` : ""}
                                        </span>
                                      </div>

                                      <div className="p-2.5 rounded-md bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800">
                                        <div className="text-muted-foreground font-medium mb-1">Payment Settlement</div>
                                        <span className="font-semibold text-slate-900 dark:text-zinc-100">
                                          {inv.paid_date ? formatDate(inv.paid_date) : formatDate(inv.invoice_date)}
                                        </span>
                                      </div>
                                    </div>

                                    {(inv.interest != null || inv.principal_paid != null || inv.balance != null) && (
                                      <div className="grid grid-cols-3 gap-3 text-xs">
                                        <div className="p-2.5 rounded-md bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800">
                                          <div className="text-muted-foreground font-medium mb-1">Interest</div>
                                          <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100">
                                            {inv.interest != null ? formatMoney(inv.interest) : "—"}
                                          </span>
                                        </div>
                                        <div className="p-2.5 rounded-md bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800">
                                          <div className="text-muted-foreground font-medium mb-1">Principal Paid</div>
                                          <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100">
                                            {inv.principal_paid != null ? formatMoney(inv.principal_paid) : "—"}
                                          </span>
                                        </div>
                                        <div className="p-2.5 rounded-md bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800">
                                          <div className="text-muted-foreground font-medium mb-1">Remaining Balance</div>
                                          <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100">
                                            {inv.balance != null ? formatMoney(inv.balance) : "—"}
                                          </span>
                                        </div>
                                      </div>
                                    )}

                                    {inv.description && (
                                      <div className="p-2.5 rounded-md bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 text-xs">
                                        <span className="text-muted-foreground font-medium block mb-0.5">Description / Memo</span>
                                        <span className="text-slate-800 dark:text-zinc-200 italic">
                                          {inv.description}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                );
              })() : (
                <div className="p-6 text-center text-muted-foreground space-y-2">
                  <Receipt className="h-8 w-8 mx-auto text-slate-300 dark:text-zinc-700" />
                  <p className="text-xs">No invoice recorded for this recurring schedule item yet.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenRecordPayment(allInstallments[0])}
                    className="text-xs mt-2"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Record First Invoice
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
  );
}
