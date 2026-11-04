import { ReceiptText, Upload, Trash2, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import * as purchasingService from "@/services/purchasingService";
import { formatDate } from "../../utils/purchasingMeta";
import { InvoiceRecordsList } from "../components/InvoiceRecordsList";
import { ATTACHMENT_ACCEPT } from "../constants";
import type { RequestDetailViewState } from "../hooks/useRequestDetailTail";

export function Tab4InvoiceBill({ v }: { v: RequestDetailViewState }) {
  const { deleteAttachment, request, isLoadingPreview, handlePreviewAttachment, data, uploadAttachments, invoiceReceiptInputRef, canAttachFiles, renderCategory, inv, renderBankAccount, hasInvoiceTab } = v;
  // newest first; a wire transfer keeps every payment that was recorded for it
  const invoiceRecords = data?.invoices?.length ? data.invoices : inv ? [inv] : [];
  const isWire = request.request_type === "ACCOUNTS_PAYABLE" && Boolean(data?.wire_transfer);
  return (
    <>
      {hasInvoiceTab && inv && (
              <TabsContent value="invoice" className="m-0 focus-visible:outline-none space-y-6">
                <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm">
                  {/* every payment recorded against this request: summary + one row per record */}
                  <InvoiceRecordsList
                    invoices={invoiceRecords}
                    amountDue={isWire ? (data?.wire_transfer?.amount ?? request.amount) : null}
                    amountDueCurrency={isWire ? (data?.wire_transfer?.currency ?? request.currency) : null}
                    renderBankAccount={renderBankAccount}
                    renderCategory={renderCategory}
                  />
                  <CardContent className="px-5 pb-5 pt-0">
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
