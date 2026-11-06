import { Plus, Trash2, CheckCircle2, Upload, AlertTriangle, Receipt, UserCheck, Sparkles, Loader2 } from "lucide-react";
import { Button } from "../../../../../components/ui/button";
import { Input } from "../../../../../components/ui/input";
import { Label } from "../../../../../components/ui/label";
import { Textarea } from "../../../../../components/ui/textarea";
import { CurrencyAutocomplete } from "../../../../Purchasing/fields/CurrencyAutocomplete";
import type { NewWorkflowState } from "../hooks/useNewWorkflow";

export function AiRefineFeedbackNotification({ s }: { s: NewWorkflowState }) {
  const { setArClerkNotes, arClerkNotes, setArClerkAssignedTo, arClerkAssignedTo, matchedInvoices, calculateTotalInvoiceAmounts, amount, isCashFullyPaid, currency, calculateMatchedInvoicesTotal, handleRemoveMatchedInvoice, handleUpdateMatchedInvoice, setOcrMessage, ocrMessage, handleAddMatchedInvoice, isOcrScanning, ocrFileInputRef, handleOcrFiles } = s;
  return (
    <div className="pt-2 border-t border-emerald-500/20 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-3.5 h-3.5 text-emerald-500" />
                      <h4 className="text-xs font-bold text-foreground">
                        Step 2: Treasury Search & Match Invoices (Single / Multiple)
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        multiple
                        ref={ocrFileInputRef}
                        onChange={(e) => handleOcrFiles(e.target.files)}
                        className="hidden"
                        accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.csv"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isOcrScanning}
                        onClick={() => ocrFileInputRef.current?.click()}
                        className="h-7 text-xs gap-1.5 border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary font-semibold shadow-xs"
                      >
                        {isOcrScanning ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Upload className="w-3 h-3 text-primary" />
                        )}
                        <span>{isOcrScanning ? "Scanning Invoices..." : "Upload & Scan Invoices"}</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddMatchedInvoice}
                        className="h-7 text-xs gap-1 border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Line</span>
                      </Button>
                    </div>
                  </div>

                  {/* AI Refine Feedback Notification */}
                  {ocrMessage && (
                    <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between text-xs text-primary font-medium animate-in fade-in duration-200">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                        <span>{ocrMessage}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOcrMessage(null)}
                        className="text-[10px] text-muted-foreground hover:text-foreground font-bold px-1.5"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <div className="space-y-2">
                    {matchedInvoices.length > 0 && (
                      <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold text-muted-foreground uppercase px-1">
                        <span className="col-span-3">Invoice Number</span>
                        <span className="col-span-3">Currency</span>
                        <span className="col-span-2 text-right">Invoice Total</span>
                        <span className="col-span-2 text-right">Amount Applied</span>
                        <span className="col-span-2 text-center">Match Status</span>
                      </div>
                    )}

                    {matchedInvoices.length === 0 ? (
                      <div className="py-6 px-4 text-center rounded-lg border border-dashed border-border/80 bg-muted/10 space-y-1.5">
                        <Receipt className="w-5 h-5 mx-auto text-muted-foreground/50" />
                        <p className="text-xs text-muted-foreground font-medium">
                          No matched invoice lines.
                        </p>
                        <p className="text-[11px] text-muted-foreground/70">
                          Click <span className="font-semibold text-foreground">Upload & Scan Invoices</span> to import from files or <span className="font-semibold text-foreground">+ Add Line</span> to enter an invoice manually.
                        </p>
                      </div>
                    ) : (
                      matchedInvoices.map((inv, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-12 gap-2 items-center bg-background/90 p-2 rounded-lg border border-border/70"
                        >
                          <div className="col-span-3 min-w-0">
                            <Input
                              placeholder="e.g. INV-2026-001"
                              value={inv.invoice_number}
                              onChange={(e) =>
                                handleUpdateMatchedInvoice(
                                  idx,
                                  "invoice_number",
                                  e.target.value
                                )
                              }
                              className="h-8 text-xs font-mono font-semibold truncate"
                              required
                            />
                          </div>

                          <div className="col-span-3 min-w-0">
                            <CurrencyAutocomplete
                              value={inv.currency || currency || "USD"}
                              onChange={(val) =>
                                handleUpdateMatchedInvoice(idx, "currency", val)
                              }
                              className="h-8 text-xs"
                            />
                          </div>

                          <div className="col-span-2 min-w-0">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={inv.invoice_total || ""}
                              onChange={(e) =>
                                handleUpdateMatchedInvoice(
                                  idx,
                                  "invoice_total",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="h-8 text-xs font-mono text-right"
                              required
                            />
                          </div>

                          <div className="col-span-2 min-w-0">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={inv.amount_applied || ""}
                              onChange={(e) =>
                                handleUpdateMatchedInvoice(
                                  idx,
                                  "amount_applied",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="h-8 text-xs font-mono text-right font-bold text-foreground"
                              required
                            />
                          </div>

                          <div className="col-span-2 flex items-center justify-end gap-1.5 min-w-0">
                            <div className="min-w-0 text-center flex-1">
                              {inv.status === "FULLY_PAID" ? (
                                <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                                  Full Paid
                                </span>
                              ) : (
                                <div className="flex flex-col items-center">
                                  <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap">
                                    Partial
                                  </span>
                                  <span className="text-[9px] font-mono text-amber-700 dark:text-amber-300 truncate max-w-full">
                                    rem: ${Number(inv.balance_remaining).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              )}
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMatchedInvoice(idx)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Step 2 Live Financial Match Calculation Summary */}
                  <div className="flex items-center justify-between flex-wrap gap-2 px-3 py-2 rounded-lg bg-background/80 border border-border/80 text-xs">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Total Invoices Due</span>
                          <span className="font-mono font-bold text-foreground">
                            ${Number(calculateTotalInvoiceAmounts(matchedInvoices)).toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                          </span>
                        </div>
                        <div className="h-6 w-px bg-border/60" />
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Total Applied</span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            ${Number(calculateMatchedInvoicesTotal(matchedInvoices)).toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                          </span>
                        </div>
                        <div className="h-6 w-px bg-border/60" />
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Confirmed Bank Deposit</span>
                          <span className="font-mono font-bold text-primary">
                            ${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 ml-auto">
                        <span className="text-[10px] text-muted-foreground">Settlement Gate:</span>
                        {isCashFullyPaid() ? (
                          <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            ✓ Fully Reconciled
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            ⚠ Shortfall Discrepancy (${Number(Math.max(0, calculateTotalInvoiceAmounts(matchedInvoices) - amount)).toLocaleString(undefined, { minimumFractionDigits: 2 })})
                          </span>
                        )}
                      </div>
                    </div>

                  {/* Summary Totals & Live Rule Routing Banner */}
                  <div className="pt-2">
                    {isCashFullyPaid() ? (
                      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <p className="font-bold">
                            Step 3: Full Paid — Direct Record & Reconciliation
                          </p>
                          <p className="text-[11px] opacity-90 break-words">
                            Bank deposit (${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}) fully satisfies total matched invoice amounts (${Number(calculateTotalInvoiceAmounts(matchedInvoices)).toLocaleString(undefined, { minimumFractionDigits: 2 })}). System directly records and marks to application.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-3">
                        <div className="flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="font-bold flex items-center justify-between flex-wrap gap-1">
                              <span>Step 3: Partially Paid — Route & Notify AR Clerk</span>
                              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 truncate max-w-full">
                                Discrepancy: ${Number(Math.max(0, calculateTotalInvoiceAmounts(matchedInvoices) - amount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            <p className="text-[11px] opacity-90 break-words">
                              Payment of ${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} is less than total invoice amount of ${Number(calculateTotalInvoiceAmounts(matchedInvoices)).toLocaleString(undefined, { minimumFractionDigits: 2 })}. In accordance with policy, this workflow will notify and route to the assigned AR Clerk to record deductions and mark to the application.
                            </p>
                          </div>
                        </div>

                        {/* AR Clerk Assignment & Discrepancy Stacked in Consecutive Rows */}
                        <div className="space-y-3 pt-1">
                          <div className="space-y-1">
                            <Label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-amber-500" />
                              Assign to AR Clerk <span className="text-red-500 font-bold">*</span>
                            </Label>
                            <select
                              value={arClerkAssignedTo}
                              onChange={(e) => setArClerkAssignedTo(e.target.value)}
                              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs font-medium"
                            >
                              <option value="sarah.jenkins@zenatech.com">
                                Sarah Jenkins (Senior AR Clerk)
                              </option>
                              <option value="michael.chen@zenatech.com">
                                Michael Chen (AR Specialist)
                              </option>
                              <option value="elena.rostova@zenatech.com">
                                Elena Rostova (Collections Lead)
                              </option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[11px] font-medium text-foreground">
                              AR Clerk Follow-up / Discrepancy Reason (Textfield)
                            </Label>
                            <Textarea
                              placeholder="e.g. Withholding tax deducted / customer dispute under review..."
                              value={arClerkNotes}
                              onChange={(e) => setArClerkNotes(e.target.value)}
                              className="h-20 text-xs resize-y bg-background w-full"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
  );
}
