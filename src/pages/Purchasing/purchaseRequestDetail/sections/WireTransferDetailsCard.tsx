import { Plus, Landmark, Pencil } from "lucide-react";
import { formatDate, formatMoney } from "../../utils/purchasingMeta";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { PurchaseRequestDetailViewState } from "../hooks/usePurchaseRequestDetailTail";

export function WireTransferDetailsCard({ v }: { v: PurchaseRequestDetailViewState }) {
  const { setIsEditWireOpen, request, requestDetail } = v;
  return (
    <>
      {(requestDetail?.wire_transfer || (request as any)?.wire_transfer) ? (
            <Card className="shadow-xs border-slate-200 dark:border-zinc-800">
              <CardHeader className="bg-indigo-50/40 dark:bg-indigo-950/20 border-b border-slate-100 dark:border-zinc-800 px-6 py-3.5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-semibold text-base">
                  <Landmark className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Wire Transfer Details</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditWireOpen(true)}
                    className="h-7 text-xs px-2.5 bg-white dark:bg-zinc-900 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 dark:border-indigo-800 dark:text-indigo-300 gap-1.5 shadow-xs"
                  >
                    <Pencil className="h-3 w-3" />
                    <span>Edit Wire Info</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {(() => {
                  const wt = requestDetail?.wire_transfer || (request as any)?.wire_transfer;
                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Entered By</span>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.entered_by || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Entry Date</span>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">{formatDate(wt.entry_date)}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Payment Date</span>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">{formatDate(wt.payment_date)}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Due Date</span>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">{formatDate(wt.due_date)}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Pay Date (Terms)</span>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.pay_date || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Pay From</span>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.pay_from || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Payment Type</span>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200">
                            {wt.category || (wt as any).payment_type || "Others"}
                          </span>
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Vendor</span>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.vendor || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">New Vendor?</span>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.is_new_vendor ? "Yes" : "No"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Invoice #</span>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.invoice_number || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Amount</span>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">{formatMoney(wt.amount || 0, wt.currency || "USD")}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Conversion Rate</span>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">
                          {wt.conversion_rate
                            ? `${wt.conversion_rate}${
                                wt.currency &&
                                wt.currency.toUpperCase() !== "USD" &&
                                parseFloat(wt.conversion_rate) > 0
                                  ? ` (≈ $${(
                                      Number(wt.amount || 0) *
                                      parseFloat(wt.conversion_rate)
                                    ).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD)`
                                  : ""
                              }`
                            : (wt.currency || "USD").toUpperCase() === "USD"
                            ? "1.00"
                            : "—"}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Vendor Email</span>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.vendor_email || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Bank Name</span>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.bank_name || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Bank Country</span>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.bank_country || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Tax ID</span>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.tax_id || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Bank Account #</span>
                        <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100 text-xs block break-words">
                          {wt.bank_account_number
                            ? wt.bank_account_number.trim().length > 4
                              ? `•••• •••• ${wt.bank_account_number.trim().slice(-4)}`
                              : wt.bank_account_number
                            : "—"}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Routing (Wire)</span>
                        <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.routing_wire || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Routing (ACH)</span>
                        <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.routing_ach || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">SWIFT Code</span>
                        <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.swift_code || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">BIC</span>
                        <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.bic || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">IBAN</span>
                        <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.iban || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Sort Code</span>
                        <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.sort_code || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Transit Code (CA)</span>
                        <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.transit_code_ca || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Transit Number (CA)</span>
                        <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.transit_number_ca || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Institution Code</span>
                        <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.institution_code || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Branch Code</span>
                        <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.branch_code || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">BSB Australia</span>
                        <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.bsb_australia || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Clearing Code</span>
                        <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.clearing_code || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Bank Code</span>
                        <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.bank_code || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">ABA</span>
                        <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.aba || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Region</span>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.region || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium text-xs block">Contact Name (China)</span>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">{wt.contact_name_china || "—"}</span>
                      </div>
                      {wt.comments && (
                        <div className="col-span-2 sm:col-span-3">
                          <div className="text-xs text-slate-500 dark:text-zinc-400 mb-1 font-medium">Comments / Memo</div>
                          <div className="text-slate-800 dark:text-zinc-200 whitespace-pre-wrap">{wt.comments}</div>
                        </div>
                      )}
                      {wt.vendor_address && (
                        <div className="col-span-2 sm:col-span-3">
                          <div className="text-xs text-slate-500 dark:text-zinc-400 mb-1 font-medium">Vendor Address</div>
                          <div className="text-slate-800 dark:text-zinc-200 whitespace-pre-wrap">{wt.vendor_address}</div>
                        </div>
                      )}
                      {wt.bank_address && (
                        <div className="col-span-2 sm:col-span-3">
                          <div className="text-xs text-slate-500 dark:text-zinc-400 mb-1 font-medium">Bank Address</div>
                          <div className="text-slate-800 dark:text-zinc-200 whitespace-pre-wrap">{wt.bank_address}</div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-xs border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Landmark className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100 block">Wire Transfer Details</span>
                    <span className="text-[11px] text-muted-foreground block">No wire transfer banking instructions recorded yet for this schedule.</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditWireOpen(true)}
                  className="h-7 text-xs px-2.5 bg-white dark:bg-zinc-900 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 gap-1.5 shadow-xs"
                >
                  <Plus className="h-3 w-3" />
                  <span>Record Wire Info</span>
                </Button>
              </CardContent>
            </Card>
          )}
    </>
  );
}
