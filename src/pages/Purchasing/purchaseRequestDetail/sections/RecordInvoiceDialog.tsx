import { FileText, Receipt, X, UploadCloud, Trash2, Eye } from "lucide-react";
import { BankAccountAutocomplete } from "../../fields/BankAccountAutocomplete";
import { CategoryAutocomplete } from "../../fields/CategoryAutocomplete";
import LocationAutocomplete from "../../fields/LocationAutocomplete";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import type { PurchaseRequestDetailViewState } from "../hooks/usePurchaseRequestDetailTail";

export function RecordInvoiceDialog({ v }: { v: PurchaseRequestDetailViewState }) {
  const { uploadMutation, recordInvoiceMutation, setIsRecordInvoiceOpen, deleteAttachmentMutation, isLoadingPreview, handlePreviewAttachment, attachments, setInvoiceFiles, handlePreviewFile, invoiceFiles, isDraggingPdf, setIsDraggingPdf, invoiceForm, setInvoiceForm, request, handleRecordInvoiceSubmit, selectedInstallment, isRecordInvoiceOpen } = v;
  return (
    <>
      {isRecordInvoiceOpen && (
        <Dialog open={isRecordInvoiceOpen} onOpenChange={setIsRecordInvoiceOpen}>
          <DialogContent className="sm:max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Receipt className="w-5 h-5 text-indigo-600" />
                <span>Record Payment for #{request.id}</span>
                {selectedInstallment && (
                  <Badge variant="outline" className="text-xs font-mono bg-indigo-50 text-indigo-700 border-indigo-200">
                    Cycle #{selectedInstallment.installmentNumber}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                Record payment details, bank account, and category for billing processing.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleRecordInvoiceSubmit} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Vendor Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={invoiceForm.vendor}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, vendor: e.target.value })}
                  placeholder="e.g. Netflix, AWS"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Amount ({request?.currency || "USD"}) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={invoiceForm.amount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Bill Date</label>
                  <Input
                    type="date"
                    value={invoiceForm.invoice_date}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Actual Cost After Tax ({request?.currency || "USD"})
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={invoiceForm.actual_cost_after_tax}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, actual_cost_after_tax: e.target.value })}
                  placeholder="Total actually paid, including tax"
                  className="font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Bank Account <span className="text-red-500">*</span>
                </label>
                <BankAccountAutocomplete
                  value={invoiceForm.bank_account}
                  onChange={(val) => setInvoiceForm({ ...invoiceForm, bank_account: val })}
                  placeholder="Select Bank Account *"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Category <span className="text-red-500">*</span>
                </label>
                <CategoryAutocomplete
                  value={invoiceForm.gl_code}
                  onChange={(val) => setInvoiceForm({ ...invoiceForm, gl_code: val })}
                  placeholder="Select Category *"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Region / Location
                </label>
                <LocationAutocomplete
                  value={invoiceForm.from_location}
                  onChange={(val) => setInvoiceForm({ ...invoiceForm, from_location: val })}
                  placeholder="Select or enter region / location..."
                />
              </div>

              {/* Financial Breakdown (Interest, Principal Paid, Remaining Balance) */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 space-y-2">
                <div className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Financial Breakdown (Schedule Details)
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400">Interest</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="—"
                        value={invoiceForm.interest}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, interest: e.target.value })}
                        className="pl-6 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400">Principal Paid</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="—"
                        value={invoiceForm.principal_paid}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, principal_paid: e.target.value })}
                        className="pl-6 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400">Remaining Balance</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="—"
                        value={invoiceForm.balance}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, balance: e.target.value })}
                        className="pl-6 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Notes / Description</label>
                <Input
                  value={invoiceForm.description}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                  placeholder="Optional billing note..."
                />
              </div>

              {/* Receipt & Invoice Attachment Dropzone */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                  <span>Attach Invoice / Receipt (.PDF, .PNG, .JPG)</span>
                  <span className="text-[11px] text-muted-foreground font-normal">Accepted: .pdf, images</span>
                </label>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingPdf(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDraggingPdf(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingPdf(false);
                    const droppedFiles = Array.from(e.dataTransfer.files).filter((f) => {
                      const ext = f.name.split(".").pop()?.toLowerCase() || "";
                      return (
                        ["pdf", "png", "jpg", "jpeg", "webp"].includes(ext) ||
                        f.type.startsWith("image/") ||
                        f.type === "application/pdf"
                      );
                    });
                    if (droppedFiles.length === 0) {
                      toast.error("Please upload PDF or image (.png, .jpg, .jpeg) receipt files");
                      return;
                    }
                    setInvoiceFiles((prev) => [...prev, ...droppedFiles]);
                  }}
                  className={`border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer ${
                    isDraggingPdf
                      ? "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40"
                      : "border-slate-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/30"
                  }`}
                  onClick={() => document.getElementById("invoice-pdf-upload-input")?.click()}
                >
                  <input
                    id="invoice-pdf-upload-input"
                    type="file"
                    accept=".pdf,image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        const selectedFiles = Array.from(e.target.files).filter((f) => {
                          const ext = f.name.split(".").pop()?.toLowerCase() || "";
                          return (
                            ["pdf", "png", "jpg", "jpeg", "webp"].includes(ext) ||
                            f.type.startsWith("image/") ||
                            f.type === "application/pdf"
                          );
                        });
                        if (selectedFiles.length === 0) {
                          toast.error("Please upload PDF or image (.png, .jpg, .jpeg) receipt files");
                          return;
                        }
                        setInvoiceFiles((prev) => [...prev, ...selectedFiles]);
                      }
                    }}
                  />
                  <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                    <div className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                      <UploadCloud className="h-5 w-5" />
                    </div>
                    <div className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Click to upload</span> or drag and drop
                    </div>
                    <p className="text-[11px] text-muted-foreground">PDF invoice copies or payment receipts (max 25MB each)</p>
                  </div>
                </div>

                {/* Staged files for current record */}
                {invoiceFiles.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                      <span>Selected Receipts to Upload ({invoiceFiles.length})</span>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-normal">Will save with this bill</span>
                    </div>
                    {invoiceFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg border bg-white dark:bg-zinc-900 text-xs shadow-2xs"
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <FileText className="h-4 w-4 text-rose-500 shrink-0" />
                          <span className="font-medium text-slate-800 dark:text-zinc-200 truncate">{file.name}</span>
                          <span className="text-[11px] text-muted-foreground shrink-0">
                            ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 gap-1 cursor-pointer"
                            onClick={() => handlePreviewFile(file)}
                          >
                            <Eye className="h-3 w-3" />
                            <span>Preview</span>
                          </Button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setInvoiceFiles((prev) => prev.filter((_, i) => i !== idx));
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                            title="Remove file"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Previously saved attachments on this recurring request */}
                {attachments && attachments.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
                    <div className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                      <span>Saved Receipts &amp; Documents ({attachments.length})</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">Saved in this spot</span>
                    </div>
                    <ul className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {attachments.map((att) => (
                        <li
                          key={att.id}
                          className="flex items-center justify-between gap-2 text-xs bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg px-3 py-1.5 border border-emerald-100 dark:border-emerald-900/30"
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <Receipt className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <span className="truncate text-slate-800 dark:text-zinc-200" title={att.filename}>{att.filename}</span>
                            {att.size ? <span className="text-[10px] text-slate-400 shrink-0">({(att.size / 1024).toFixed(1)} KB)</span> : null}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-[11px] text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 gap-1 cursor-pointer"
                              onClick={() => handlePreviewAttachment(att)}
                              disabled={isLoadingPreview}
                            >
                              <Eye className="h-3 w-3" />
                              <span>Preview</span>
                            </Button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to remove receipt "${att.filename}"?`)) {
                                  deleteAttachmentMutation.mutate(att.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-red-500 rounded cursor-pointer transition-colors"
                              title="Remove saved attachment"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <DialogFooter className="pt-3 border-t">
                <Button type="button" variant="outline" onClick={() => setIsRecordInvoiceOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={recordInvoiceMutation.isPending || uploadMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                >
                  {recordInvoiceMutation.isPending || uploadMutation.isPending ? "Recording..." : "Save Payment"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
