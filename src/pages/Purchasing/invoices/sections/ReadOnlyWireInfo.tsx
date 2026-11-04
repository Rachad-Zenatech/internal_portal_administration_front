import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Landmark, Copy, Check, ArrowUpRight, FileText } from "lucide-react";
import { formatDate, formatMoney } from "../../utils/purchasingMeta";
import type { InvoicesState } from "../hooks/useInvoices";

export function ReadOnlyWireInfo({ s }: { s: InvoicesState }) {
  const { setSelectedWireTask, navigate, selectedWireTask, copiedKey, handleCopy, handleCopyAllBankingDetails } = s;
  return (
    <>
      {selectedWireTask && selectedWireTask.wire_transfer && (
        <Dialog open={!!selectedWireTask} onOpenChange={(open) => !open && setSelectedWireTask(null)}>
          <DialogContent className="w-[95vw] sm:max-w-2xl lg:max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl">
            {/* Modal Header */}
            <DialogHeader className="p-5 pb-3 border-b bg-slate-50/80 dark:bg-zinc-900/60">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300">
                    <Landmark className="h-6 w-6" />
                  </div>
                  <div>
                    <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                      <span>Wire Transfer Information</span>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                      >
                        Read-Only
                      </Badge>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                      Request #{selectedWireTask.id} &bull; {selectedWireTask.product_name}
                    </DialogDescription>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyAllBankingDetails(selectedWireTask)}
                  className="h-8 gap-1.5 text-xs font-semibold bg-white dark:bg-zinc-800 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 shadow-2xs"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy All Details</span>
                </Button>
              </div>
            </DialogHeader>

            {/* Modal Content */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
              {/* Payment & Vendor Details */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Payment &amp; Vendor Overview</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 p-4 rounded-xl bg-slate-50/70 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-zinc-800">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Vendor Name</span>
                    <span className="font-semibold text-slate-900 dark:text-zinc-100 text-sm">
                      {selectedWireTask.wire_transfer.vendor || selectedWireTask.vendor || "—"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-muted-foreground block">Transfer Amount</span>
                    <span className="font-bold text-slate-900 dark:text-zinc-100 text-sm font-mono">
                      {formatMoney(
                        Number(selectedWireTask.wire_transfer.amount || selectedWireTask.amount || 0),
                        selectedWireTask.wire_transfer.currency || selectedWireTask.currency || "USD"
                      )}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-muted-foreground block">Payment Category</span>
                    <Badge variant="secondary" className="text-[11px] px-1.5 py-0 mt-0.5 font-medium">
                      {selectedWireTask.wire_transfer.category ||
                        selectedWireTask.wire_transfer.payment_type ||
                        selectedWireTask.category ||
                        "Others"}
                    </Badge>
                  </div>

                  <div>
                    <span className="text-[11px] text-muted-foreground block">Paying Entity (Pay From)</span>
                    <span className="font-medium text-slate-800 dark:text-zinc-200">
                      {selectedWireTask.wire_transfer.pay_from || "—"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-muted-foreground block">Invoice Number</span>
                    <span className="font-mono text-slate-800 dark:text-zinc-200">
                      {selectedWireTask.wire_transfer.invoice_number || "—"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-muted-foreground block">Due Date / Payment Date</span>
                    <span className="font-medium text-slate-800 dark:text-zinc-200">
                      {formatDate(selectedWireTask.wire_transfer.due_date || selectedWireTask.due_date) || "—"}
                      {selectedWireTask.wire_transfer.payment_date &&
                        ` (Paid: ${formatDate(selectedWireTask.wire_transfer.payment_date)})`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Beneficiary Banking Information */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5 flex items-center gap-1.5">
                  <Landmark className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Beneficiary Bank &amp; Routing Information</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 rounded-xl bg-slate-50/70 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-zinc-800">
                  {/* Bank Name */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60">
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Bank Name</span>
                      <span className="font-semibold text-slate-900 dark:text-zinc-100">
                        {selectedWireTask.wire_transfer.bank_name || "—"}
                      </span>
                    </div>
                    {selectedWireTask.wire_transfer.bank_name && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleCopy(
                            selectedWireTask.wire_transfer.bank_name,
                            "modal-bank-name",
                            "Bank Name"
                          )
                        }
                        className="h-7 w-7 p-0"
                      >
                        {copiedKey === "modal-bank-name" ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-slate-400" />
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Bank Country */}
                  <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60">
                    <span className="text-[11px] text-muted-foreground block">Bank Jurisdiction / Country</span>
                    <span className="font-semibold text-slate-900 dark:text-zinc-100">
                      {selectedWireTask.wire_transfer.bank_country || "—"}
                    </span>
                  </div>

                  {/* Account Number */}
                  <div className="sm:col-span-2 flex items-center justify-between p-2.5 rounded-lg bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/60">
                    <div>
                      <span className="text-[11px] font-semibold text-indigo-900 dark:text-indigo-300 block">
                        Bank Account Number / IBAN
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-sm">
                        {selectedWireTask.wire_transfer.bank_account_number ||
                          selectedWireTask.wire_transfer.iban ||
                          "—"}
                      </span>
                    </div>
                    {(selectedWireTask.wire_transfer.bank_account_number ||
                      selectedWireTask.wire_transfer.iban) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleCopy(
                            selectedWireTask.wire_transfer.bank_account_number ||
                              selectedWireTask.wire_transfer.iban,
                            "modal-acct-num",
                            "Account Number"
                          )
                        }
                        className="h-7 px-2.5 text-xs gap-1 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300"
                      >
                        {copiedKey === "modal-acct-num" ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        <span>Copy</span>
                      </Button>
                    )}
                  </div>

                  {/* Wire Routing */}
                  {selectedWireTask.wire_transfer.routing_wire && (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60">
                      <div>
                        <span className="text-[11px] text-muted-foreground block">Wire Routing Number / ABA</span>
                        <span className="font-mono font-semibold text-slate-900 dark:text-zinc-100">
                          {selectedWireTask.wire_transfer.routing_wire}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleCopy(
                            selectedWireTask.wire_transfer.routing_wire,
                            "modal-routing-wire",
                            "Wire Routing"
                          )
                        }
                        className="h-7 w-7 p-0"
                      >
                        {copiedKey === "modal-routing-wire" ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-slate-400" />
                        )}
                      </Button>
                    </div>
                  )}

                  {/* ACH Routing */}
                  {selectedWireTask.wire_transfer.routing_ach && (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60">
                      <div>
                        <span className="text-[11px] text-muted-foreground block">ACH Routing Number</span>
                        <span className="font-mono font-semibold text-slate-900 dark:text-zinc-100">
                          {selectedWireTask.wire_transfer.routing_ach}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleCopy(
                            selectedWireTask.wire_transfer.routing_ach,
                            "modal-routing-ach",
                            "ACH Routing"
                          )
                        }
                        className="h-7 w-7 p-0"
                      >
                        {copiedKey === "modal-routing-ach" ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-slate-400" />
                        )}
                      </Button>
                    </div>
                  )}

                  {/* SWIFT / BIC */}
                  {selectedWireTask.wire_transfer.swift_code && (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60">
                      <div>
                        <span className="text-[11px] text-muted-foreground block">SWIFT / BIC Code</span>
                        <span className="font-mono font-semibold text-slate-900 dark:text-zinc-100">
                          {selectedWireTask.wire_transfer.swift_code}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleCopy(
                            selectedWireTask.wire_transfer.swift_code,
                            "modal-swift",
                            "SWIFT Code"
                          )
                        }
                        className="h-7 w-7 p-0"
                      >
                        {copiedKey === "modal-swift" ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-slate-400" />
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Comments / Notes */}
                  {selectedWireTask.wire_transfer.comments && (
                    <div className="sm:col-span-2 p-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60">
                      <span className="text-[11px] text-muted-foreground block">Comments &amp; Instructions</span>
                      <p className="text-slate-800 dark:text-zinc-200 whitespace-pre-wrap mt-0.5">
                        {selectedWireTask.wire_transfer.comments}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <DialogFooter className="p-4 border-t bg-slate-50/80 dark:bg-zinc-900/80 flex items-center justify-between sm:justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const id = selectedWireTask.id;
                  setSelectedWireTask(null);
                  navigate(`/purchasing/requests/${id}`);
                }}
                className="gap-1.5 text-xs font-semibold"
              >
                <span>Open Request Details</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>

              <Button
                size="sm"
                onClick={() => setSelectedWireTask(null)}
                className="text-xs h-8 px-4 font-semibold"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
