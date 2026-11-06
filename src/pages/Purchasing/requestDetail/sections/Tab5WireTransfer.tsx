import { ReceiptText, Upload, Pencil, Trash2, Download, Landmark, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import * as purchasingService from "@/services/purchasingService";
import { RequestStatus } from "@/types/purchasing";
import { formatDate, formatMoney } from "../../utils/purchasingMeta";
import { Field } from "../components/Field";
import { ATTACHMENT_ACCEPT } from "../constants";
import type { RequestDetailViewState } from "../hooks/useRequestDetailTail";

export function Tab5WireTransfer({ v }: { v: RequestDetailViewState }) {
  const { deleteAttachment, request, isLoadingPreview, handlePreviewAttachment, data, uploadAttachments, wireReceiptInputRef, canAttachFiles, setIsEditWireOpen, hasWireTab } = v;
  return (
    <>
      {hasWireTab && data?.wire_transfer && (
              <TabsContent value="wire" className="m-0 focus-visible:outline-none space-y-6">
                <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm">
                  <CardHeader className="bg-indigo-50/40 dark:bg-indigo-950/20 border-b border-slate-100 dark:border-zinc-800 px-6 py-3.5 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-semibold text-base">
                      <Landmark className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>Wire Transfer Details</span>
                      {data.wire_transfer.payment_series?.label && (
                        <Badge variant="outline" className="ml-1 text-[11px] font-medium bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300 border-teal-200 dark:border-teal-800">
                          {data.wire_transfer.payment_series.label}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5">
                      {Boolean(
                        request.request_type === "ACCOUNTS_PAYABLE" ||
                        request.request_type === "SCHEDULED_PAYMENT" ||
                        request.request_type === "RECURRING" ||
                        request.status === RequestStatus.Purchased ||
                        (request.status as string) === "ORDERED" ||
                        request.status === RequestStatus.WaitingPayment ||
                        (request.status as string) === "SENT_TO_AP"
                      ) && (
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
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                      <Field label="Entered By" value={data.wire_transfer.entered_by || "—"} />
                      <Field label="Entry Date" value={formatDate(data.wire_transfer.entry_date)} />
                      <Field label="Payment Date" value={formatDate(data.wire_transfer.payment_date)} />
                      <Field label="Due Date" value={formatDate(data.wire_transfer.due_date)} />
                      <Field label="Pay Date (Terms)" value={data.wire_transfer.pay_date || "—"} />
                      <Field label="Pay From" value={data.wire_transfer.pay_from || "—"} />
                      <Field
                        label="Payment Type"
                        value={
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200">
                            {data.wire_transfer.category || (data.wire_transfer as any).payment_type || "Others"}
                          </span>
                        }
                      />
                      <Field label="Vendor" value={data.wire_transfer.vendor || "—"} />
                      <Field label="New Vendor?" value={data.wire_transfer.is_new_vendor ? "Yes" : "No"} />
                      <Field label="Invoice #" value={data.wire_transfer.invoice_number || "—"} />
                      <Field label="Amount" value={formatMoney(data.wire_transfer.amount || 0, data.wire_transfer.currency || "USD")} />
                      <Field
                        label="Conversion Rate"
                        value={
                          data.wire_transfer.conversion_rate
                            ? `${data.wire_transfer.conversion_rate}${
                                data.wire_transfer.currency &&
                                data.wire_transfer.currency.toUpperCase() !== "USD" &&
                                parseFloat(data.wire_transfer.conversion_rate) > 0
                                  ? ` (≈ $${(
                                      Number(data.wire_transfer.amount || 0) *
                                      parseFloat(data.wire_transfer.conversion_rate)
                                    ).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD)`
                                  : ""
                              }`
                            : (data.wire_transfer.currency || "USD").toUpperCase() === "USD"
                            ? "1.00 (USD)"
                            : "—"
                        }
                      />
                      <Field label="Vendor Email" value={data.wire_transfer.vendor_email || "—"} />
                      <Field label="Bank Name" value={data.wire_transfer.bank_name || "—"} />
                      <Field label="Bank Country" value={data.wire_transfer.bank_country || "—"} />
                      <Field label="Tax ID" value={data.wire_transfer.tax_id || "—"} />
                      <Field
                        label="Bank Account #"
                        value={
                          data.wire_transfer.bank_account_number
                            ? data.wire_transfer.bank_account_number.trim().length > 4
                              ? `•••• •••• ${data.wire_transfer.bank_account_number.trim().slice(-4)}`
                              : data.wire_transfer.bank_account_number
                            : "—"
                        }
                      />
                      <Field label="Routing (Wire)" value={data.wire_transfer.routing_wire || "—"} />
                      <Field label="Routing (ACH)" value={data.wire_transfer.routing_ach || "—"} />
                      <Field label="SWIFT Code" value={data.wire_transfer.swift_code || "—"} />
                      <Field label="BIC" value={data.wire_transfer.bic || "—"} />
                      <Field label="IBAN" value={data.wire_transfer.iban || "—"} />
                      <Field label="Sort Code" value={data.wire_transfer.sort_code || "—"} />
                      <Field label="Transit Code (CA)" value={data.wire_transfer.transit_code_ca || "—"} />
                      <Field label="Transit Number (CA)" value={data.wire_transfer.transit_number_ca || "—"} />
                      <Field label="Institution Code" value={data.wire_transfer.institution_code || "—"} />
                      <Field label="Branch Code" value={data.wire_transfer.branch_code || "—"} />
                      <Field label="BSB Australia" value={data.wire_transfer.bsb_australia || "—"} />
                      <Field label="Clearing Code" value={data.wire_transfer.clearing_code || "—"} />
                      <Field label="Bank Code" value={data.wire_transfer.bank_code || "—"} />
                      <Field label="ABA" value={data.wire_transfer.aba || "—"} />
                      <Field label="Region" value={data.wire_transfer.region || "—"} />
                      <Field label="Contact Name (China)" value={data.wire_transfer.contact_name_china || "—"} />
                      {data.wire_transfer.comments && (
                        <div className="col-span-2 sm:col-span-3">
                          <div className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Comments / Memo</div>
                          <div className="text-slate-800 dark:text-zinc-200 whitespace-pre-wrap">{data.wire_transfer.comments}</div>
                        </div>
                      )}
                      {data.wire_transfer.vendor_address && (
                        <div className="col-span-2 sm:col-span-3">
                          <div className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Vendor Address</div>
                          <div className="text-slate-800 dark:text-zinc-200 whitespace-pre-wrap">{data.wire_transfer.vendor_address}</div>
                        </div>
                      )}
                      {data.wire_transfer.bank_address && (
                        <div className="col-span-2 sm:col-span-3">
                          <div className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Bank Address</div>
                          <div className="text-slate-800 dark:text-zinc-200 whitespace-pre-wrap">{data.wire_transfer.bank_address}</div>
                        </div>
                      )}
                    </div>

                    {/* Attached Wire Invoices & Payment Documents */}
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ReceiptText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
                            Attached Wire Invoices &amp; Payment Receipts
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
                              ref={wireReceiptInputRef}
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
                              onClick={() => wireReceiptInputRef.current?.click()}
                              className="h-7 text-xs px-2.5 gap-1.5 border-dashed border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 cursor-pointer"
                            >
                              <Upload className="h-3 w-3" />
                              <span>{uploadAttachments.isPending ? "Uploading..." : "Upload Wire Receipt"}</span>
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
                            No wire transfer documents or receipts attached yet.
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Upload vendor invoice PDF or bank wire confirmation to save it directly with this wire record.
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
