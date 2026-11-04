import HelpIcon from "@/components/ui/HelpIcon";
import { ReceiptText, Upload, Trash2, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as purchasingService from "@/services/purchasingService";
import { PAYMENT_BADGE, PAYMENT_LABEL, STATUS_BADGE, formatDate, formatMoney } from "../../utils/purchasingMeta";
import { Field } from "../components/Field";
import { ATTACHMENT_ACCEPT } from "../constants";
import type { RequestDetailViewState } from "../hooks/useRequestDetailTail";

export function Tab4InvoiceBill({ v }: { v: RequestDetailViewState }) {
  const { deleteAttachment, request, isLoadingPreview, handlePreviewAttachment, data, uploadAttachments, invoiceReceiptInputRef, canAttachFiles, renderCategory, inv, renderBankAccount, hasInvoiceTab } = v;
  return (
    <>
      {hasInvoiceTab && inv && (
              <TabsContent value="invoice" className="m-0 focus-visible:outline-none space-y-6">
                <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm">
                  <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/30">
                    <CardTitle className="text-base font-semibold flex items-center justify-between text-slate-900 dark:text-zinc-100">
                      <div className="flex items-center gap-2">
                        <ReceiptText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <span>Invoice &amp; Bill · {inv.id}</span>
                      </div>
                      <Badge variant="outline" className={inv.paid_date ? STATUS_BADGE.COMPLETED : PAYMENT_BADGE[inv.payment_status]}>
                        {inv.paid_date ? `Settled · ${formatDate(inv.paid_date)}` : (PAYMENT_LABEL[inv.payment_status] || inv.payment_status)}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-sm">
                      <Field label="Vendor" value={inv.vendor} />
                      <Field label="Amount" value={formatMoney(inv.amount)} />
                      <Field label="Bill Date" value={formatDate(inv.paid_date || inv.invoice_date)} />
                      <Field label="Due Date / Date Arrived" value={formatDate(inv.due_date)} />
                      <Field
                        label="Bank Account"
                        value={renderBankAccount(inv.bank_account)}
                      />
                      <Field
                        label="Category"
                        value={
                          inv.items && inv.items.length > 1 ? (
                            <Badge variant="outline" className="bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-300 dark:border-zinc-700 text-xs font-normal">
                              Split ({inv.items.length} lines)
                            </Badge>
                          ) : (
                            renderCategory(inv.gl_code)
                          )
                        }
                      />
                      <Field label="Class (Department)" value={inv.department || "—"} />
                      <Field label="From Location" value={inv.from_location || "—"} />
                      <Field label={<span className="flex items-center gap-1"><span>Asset Flag</span><HelpIcon text="Asset Flag designates whether this invoice represents a Capitalized Fixed Asset (CapEx) — such as equipment, hardware, lease/financing agreements, or software licenses — rather than an immediate operational expense (OpEx). When checked, the cost is capitalized on the balance sheet and depreciated/amortized over time instead of expensed in full in the current period. It automatically defaults to active for Scheduled Payments, Recurring obligations, and Accounts Payable." /></span>} value={inv.asset_flag ? "Yes" : "No"} />
                    </div>

                    {inv.description && (
                      <div className="pt-3 border-t border-slate-100 dark:border-zinc-800">
                        <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Description</div>
                        <div className="text-sm text-slate-800 dark:text-zinc-200 whitespace-pre-wrap">{inv.description}</div>
                      </div>
                    )}

                    {inv.items && inv.items.length > 0 && (
                      <div className="mt-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                        <div className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-2 flex items-center justify-between">
                          <span>Itemized Category Allocations ({inv.items.length} items)</span>
                        </div>
                        <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800 text-xs">
                          <div className="bg-slate-50 dark:bg-zinc-800/50 px-3 py-1.5 grid grid-cols-12 gap-2 font-medium text-slate-500">
                            <div className="col-span-5">Item</div>
                            <div className="col-span-2 text-right pr-6">Amount</div>
                            <div className="col-span-4 pl-4 border-l border-slate-200 dark:border-zinc-700">Category</div>
                            <div className="col-span-1 flex items-center justify-center gap-0.5"><span>Asset</span><HelpIcon text="Mark as Capitalized Fixed Asset (CapEx)" iconClassName="h-3 w-3" /></div>
                          </div>
                          {inv.items.map((it, idx) => (
                            <div key={idx} className="px-3 py-2 grid grid-cols-12 gap-2 items-center bg-white dark:bg-zinc-900">
                              <div className="col-span-5 break-words whitespace-normal leading-snug font-medium text-slate-800 dark:text-zinc-200" title={it.description}>
                                {it.sku ? <span className="font-mono text-indigo-600 dark:text-indigo-400 mr-1">[{it.sku}]</span> : null}{it.description}
                              </div>
                              <div className="col-span-2 text-right pr-6 font-mono font-medium text-slate-700 dark:text-zinc-300">
                                {formatMoney(it.amount)}
                              </div>
                              <div className="col-span-4 pl-4 border-l border-slate-100 dark:border-zinc-800">
                                {renderCategory(it.gl_code)}
                              </div>
                              <div className="col-span-1 text-center">
                                {it.asset_flag ? <span className="inline-flex items-center gap-1"><Badge variant="outline" className="text-[10px] px-1 py-0 bg-emerald-50 text-emerald-700 border-emerald-200">Asset</Badge><HelpIcon text="Capitalized Fixed Asset (CapEx)" iconClassName="h-3 w-3" /></span> : "—"}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Attached Receipts & Invoices */}
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ReceiptText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
                            Attached Receipts &amp; Invoice Files
                          </span>
                          {data.attachments && data.attachments.length > 0 && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300">
                              {data.attachments.length} {data.attachments.length === 1 ? "file" : "files"}
                            </Badge>
                          )}
                        </div>
                        {canAttachFiles && (
                          <div>
                            <input
                              type="file"
                              ref={invoiceReceiptInputRef}
                              className="hidden"
                              multiple
                              accept={ATTACHMENT_ACCEPT}
                              onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                  uploadAttachments.mutate(Array.from(e.target.files));
                                  e.target.value = "";
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={uploadAttachments.isPending}
                              onClick={() => invoiceReceiptInputRef.current?.click()}
                              className="h-7 text-xs px-2.5 gap-1.5 border-dashed border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 cursor-pointer"
                            >
                              <Upload className="h-3 w-3" />
                              <span>{uploadAttachments.isPending ? "Uploading..." : "Upload Receipt"}</span>
                            </Button>
                          </div>
                        )}
                      </div>

                      {(!data.attachments || data.attachments.length === 0) ? (
                        <div className="rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/20 p-4 text-center">
                          <div className="inline-flex p-2 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 mb-1.5">
                            <ReceiptText className="h-4 w-4" />
                          </div>
                          <p className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                            No receipts or invoice documents attached yet.
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Upload your paid receipt or vendor invoice PDF to save it directly with this bill record.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {data.attachments.map((att) => (
                            <div
                              key={att.id}
                              className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40 hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors gap-3"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0 border border-emerald-100 dark:border-emerald-900/30">
                                  <ReceiptText className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate" title={att.filename}>
                                    {att.filename}
                                  </p>
                                  <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400 dark:text-zinc-500 flex-wrap">
                                    {att.size ? <span>{(att.size / 1024).toFixed(1)} KB</span> : null}
                                    {att.uploaded_at ? (
                                      <>
                                        <span>•</span>
                                        <span>{formatDate(att.uploaded_at)}</span>
                                      </>
                                    ) : null}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 gap-1 cursor-pointer"
                                  onClick={() => handlePreviewAttachment(att)}
                                  disabled={isLoadingPreview}
                                  title="Preview Receipt"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">Preview</span>
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 cursor-pointer"
                                  onClick={() => purchasingService.downloadAttachment(request.id, att.id, att.filename)}
                                  title="Download Receipt"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to remove receipt "${att.filename}"?`)) {
                                      deleteAttachment.mutate(att.id);
                                    }
                                  }}
                                  title="Remove Receipt"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
    </>
  );
}
