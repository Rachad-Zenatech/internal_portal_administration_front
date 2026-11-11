import { TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VendorAutocomplete } from "../../../fields/VendorAutocomplete";
import { ClassAutocomplete } from "../../../fields/ClassAutocomplete";
import LocationAutocomplete from "../../../fields/LocationAutocomplete";
import { GLCodeAutocomplete } from "../../../fields/GLCodeAutocomplete";
import * as purchasingService from "@/services/purchasingService";
import { formatMoney } from "../../../utils/purchasingMeta";
import { FileText, Layers, Calendar, AlertCircle, Trash2, Eye, Download, ReceiptText, Upload } from "lucide-react";
import type { EditCombinedRequestState } from "../hooks/useEditCombinedRequest";

export function Tab3InvoiceReceipts({ s }: { s: EditCombinedRequestState }) {
  const { refetch, deleteAttachment, request, isLoadingPreview, handlePreviewAttachment, data, uploadAttachments, invoiceReceiptInputRef, setInvDescription, invDescription, setInvItems, invItems, invGlCode, poCurrency, setInvFromLocation, invFromLocation, setInvDepartment, invDepartment, setInvGlCode, setInvDueDate, invDueDate, setInvDate, invDate, setInvAmount, invAmount, setInvVendor, invVendor, poAmount, priceVariance, hasVariance, hasInvoice } = s;
  return (
    <>
      {hasInvoice && (
            <TabsContent
              value="invoice"
              className="flex-1 overflow-y-auto px-8 py-6 space-y-6 m-0 focus-visible:outline-hidden"
            >
              {/* Variance Banner */}
              {hasVariance && (
                <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-4 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold block">
                      Price Variance Detected: {formatMoney(priceVariance, poCurrency)}
                    </span>
                    <p className="text-amber-800 dark:text-amber-300/90 leading-relaxed">
                      Purchase Order amount is <strong>{formatMoney(poAmount, poCurrency)}</strong> while Invoice billed is <strong>{formatMoney(invAmount, poCurrency)}</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Invoice Main Information */}
              <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200/80 dark:border-zinc-800/80">
                  <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 tracking-tight uppercase text-[11px]">
                    Invoice Header &amp; Billing
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Billed Vendor <span className="text-rose-500">*</span>
                    </label>
                    <VendorAutocomplete
                      value={invVendor}
                      onChange={setInvVendor}
                      placeholder="Vendor billed on invoice..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Invoice Billed Amount ({poCurrency}) <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={String(invAmount)}
                      onChange={(e) => setInvAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="h-10 text-sm font-mono font-bold bg-white dark:bg-zinc-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>Invoice / Bill Date</span>
                    </label>
                    <Input
                      type="date"
                      value={invDate}
                      onChange={(e) => setInvDate(e.target.value)}
                      className="h-10 text-sm bg-white dark:bg-zinc-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>Payment Due Date</span>
                    </label>
                    <Input
                      type="date"
                      value={invDueDate}
                      onChange={(e) => setInvDueDate(e.target.value)}
                      className="h-10 text-sm bg-white dark:bg-zinc-900"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                      <span>GL Code / Account Allocation <span className="text-rose-500">*</span></span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        Primary account code for QuickBooks / AP
                      </span>
                    </label>
                    <GLCodeAutocomplete
                      value={invGlCode}
                      onChange={setInvGlCode}
                      placeholder="Search or enter GL code for invoice..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Class <span className="text-rose-500">*</span>
                    </label>
                    <ClassAutocomplete
                      value={invDepartment}
                      onChange={setInvDepartment}
                      placeholder="Class *"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Region / Location <span className="text-rose-500">*</span>
                    </label>
                    <LocationAutocomplete
                      value={invFromLocation}
                      onChange={setInvFromLocation}
                      placeholder="Select or enter region / location *"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Itemized Line Items for Invoice (if multi-items exist) */}
              {invItems.length > 0 && (
                <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 p-5 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-zinc-800/80">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 tracking-tight uppercase text-[11px]">
                        Invoice Itemized Allocations ({invItems.length} lines)
                      </h3>
                    </div>
                  </div>

                  <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-xs">
                    <div className="bg-slate-100/90 dark:bg-zinc-800/90 px-4 py-3 grid grid-cols-12 gap-3 text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                      <div className="col-span-5">Item Description</div>
                      <div className="col-span-2 text-right">Line Amount</div>
                      <div className="col-span-5 pl-2">Line GL Code Allocation</div>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                      {invItems.map((itm, idx) => (
                        <div
                          key={itm.id || idx}
                          className="px-4 py-3 grid grid-cols-12 gap-3 items-center text-xs hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                        >
                          <div className="col-span-5 font-medium text-slate-800 dark:text-zinc-200">
                            {itm.description || `Item #${idx + 1}`}
                          </div>
                          <div className="col-span-2 text-right font-mono font-semibold">
                            {formatMoney(itm.amount || 0, poCurrency)}
                          </div>
                          <div className="col-span-5 pl-2">
                            <GLCodeAutocomplete
                              value={itm.gl_code || invGlCode}
                              onChange={(val) => {
                                const updated = [...invItems];
                                updated[idx].gl_code = val;
                                setInvItems(updated);
                              }}
                              placeholder="Select GL code for this line *"
                              showDetailCard={false}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Card 3: Invoice Stage-Specific Description */}
              <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 p-5 space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  <span>Invoice Notes &amp; Payment Remarks (Stage-Specific)</span>
                </label>
                <Textarea
                  rows={3}
                  value={invDescription}
                  onChange={(e) => setInvDescription(e.target.value)}
                  placeholder="Notes, check numbers, or specific AP remarks for this Invoice..."
                  className="text-xs resize-none bg-white dark:bg-zinc-900"
                />
              </div>

              {/* Card 4: Attached Receipts & Invoices */}
              <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <ReceiptText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 tracking-tight uppercase text-[11px]">
                      Attached Receipts &amp; Invoice Files
                    </h3>
                    {data?.attachments && data.attachments.length > 0 && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300">
                        {data.attachments.length} {data.attachments.length === 1 ? "file" : "files"}
                      </Badge>
                    )}
                  </div>

                  <div>
                    <input
                      type="file"
                      ref={invoiceReceiptInputRef}
                      className="hidden"
                      multiple
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          uploadAttachments.mutate(Array.from(e.target.files), {
                            onSuccess: () => {
                              refetch?.();
                            },
                          });
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
                </div>

                {(!data?.attachments || data.attachments.length === 0) ? (
                  <div className="rounded-lg border border-dashed border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 text-center">
                    <div className="inline-flex p-2 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 mb-1.5">
                      <ReceiptText className="h-4 w-4" />
                    </div>
                    <p className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                      No receipts or invoice documents attached yet.
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Upload your paid receipt or vendor invoice to save it directly with this bill record.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {data.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors gap-3"
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
                                deleteAttachment.mutate(att.id, {
                                  onSuccess: () => refetch?.(),
                                });
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
            </TabsContent>
          )}
    </>
  );
}
