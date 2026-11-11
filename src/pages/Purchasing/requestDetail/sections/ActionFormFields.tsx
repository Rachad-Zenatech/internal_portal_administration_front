import { BankAccountAutocomplete } from "../../fields/BankAccountAutocomplete";
import { CategoryAutocomplete } from "../../fields/CategoryAutocomplete";
import { ClassAutocomplete } from "../../fields/ClassAutocomplete";
import LocationAutocomplete from "../../fields/LocationAutocomplete";
import { VendorAutocomplete } from "../../fields/VendorAutocomplete";
import HelpIcon from "@/components/ui/HelpIcon";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "../../utils/purchasingMeta";
import { TwoUp } from "../components/TwoUp";
import { AttachmentDropzone } from "../components/AttachmentDropzone";
import { FieldInput } from "../components/FieldInput";
import type { RequestDetailViewState } from "../hooks/useRequestDetailTail";

export function ActionFormFields({ v }: { v: RequestDetailViewState }) {
  const { deleteAttachment, handlePreviewAttachment, data, handlePreviewFile, setPendingFiles, pendingFiles, invoice, setInvoice, request, invoiceItems, setInvoiceItems, setInvoicePoNumber, invoicePoNumber, activeForm } = v;
  return (
    <>
      {activeForm?.kind === "invoice" && (
              <>
                <TwoUp>
                  <FieldInput
                    label={
                      <span>
                        PO # <span className="text-red-500">*</span>
                      </span>
                    }
                    placeholder="e.g. PO-2026-00452 or QT-88910"
                    value={invoicePoNumber}
                    onChange={(v) => setInvoicePoNumber(v)}
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Vendor <span className="text-red-500">*</span>
                    </label>
                    <VendorAutocomplete
                      value={invoice.vendor}
                      onChange={(v) => setInvoice({ ...invoice, vendor: v })}
                      placeholder="Search or enter vendor name..."
                    />
                  </div>
                </TwoUp>

                <TwoUp>
                  <FieldInput
                    label={
                      <span>
                        Bill Date <span className="text-red-500">*</span>
                      </span>
                    }
                    type="date"
                    value={invoice.invoice_date}
                    onChange={(v) => setInvoice({ ...invoice, invoice_date: v })}
                  />
                  {request.request_type !== "RECURRING" ? (
                    <FieldInput label="Date Arrived" type="date" value={invoice.due_date ?? ""} onChange={(v) => setInvoice({ ...invoice, due_date: v })} />
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <label className="text-sm font-medium">Asset Flag</label>
                        <HelpIcon text="Asset Flag designates whether this invoice represents a Capitalized Fixed Asset (CapEx) — such as equipment, hardware, lease/financing agreements, or software licenses — rather than an immediate operational expense (OpEx). When checked, the cost is capitalized on the balance sheet and depreciated/amortized over time instead of expensed in full in the current period. It automatically defaults to active for Scheduled Payments, Recurring obligations, and Accounts Payable." />
                      </div>
                      <div className="flex items-center h-10">
                        <input type="checkbox" className="h-4 w-4" checked={invoice.asset_flag || false} onChange={(e) => setInvoice({ ...invoice, asset_flag: e.target.checked })} />
                        <span className="ml-2 text-sm text-slate-700">Mark as Asset</span>
                      </div>
                    </div>
                  )}
                </TwoUp>

                <TwoUp>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Class <span className="text-red-500">*</span>
                    </label>
                    <ClassAutocomplete
                      value={invoice.department || ""}
                      onChange={(v) => setInvoice({ ...invoice, department: v })}
                      placeholder="Select class *"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Region / Location <span className="text-red-500">*</span>
                    </label>
                    <LocationAutocomplete
                      value={invoice.from_location || ""}
                      onChange={(v) => setInvoice({ ...invoice, from_location: v })}
                      placeholder="Select or enter region / location *"
                      required
                    />
                  </div>
                </TwoUp>

                {invoiceItems.length > 1 ? (
                  <div className="space-y-3 pt-1">
                    <TwoUp>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Bank Account <span className="text-rose-500">*</span>
                        </label>
                        <BankAccountAutocomplete
                          value={invoice.bank_account || ""}
                          onChange={(v) => setInvoice({ ...invoice, bank_account: v })}
                          placeholder="Select Bank Account *"
                        />
                      </div>
                      {request.request_type !== "RECURRING" ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5">
                            <label className="text-sm font-medium">Asset Flag</label>
                            <HelpIcon text="Asset Flag designates whether this invoice represents a Capitalized Fixed Asset (CapEx) — such as equipment, hardware, lease/financing agreements, or software licenses — rather than an immediate operational expense (OpEx). When checked, the cost is capitalized on the balance sheet and depreciated/amortized over time instead of expensed in full in the current period. It automatically defaults to active for Scheduled Payments, Recurring obligations, and Accounts Payable." />
                          </div>
                          <div className="flex items-center h-10">
                            <input type="checkbox" className="h-4 w-4" checked={invoice.asset_flag || false} onChange={(e) => setInvoice({ ...invoice, asset_flag: e.target.checked })} />
                            <span className="ml-2 text-sm text-slate-700">Mark as Asset</span>
                          </div>
                        </div>
                      ) : <div />}
                    </TwoUp>

                    <div className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/50 p-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                          Default Category
                        </label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs px-2.5 font-medium border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800"
                          onClick={() => {
                            if (invoice.gl_code?.trim()) {
                              setInvoiceItems(prev => prev.map(item => ({ ...item, gl_code: invoice.gl_code || "" })));
                              toast.success("Applied Category to all line items");
                            } else {
                              toast.error("Select a category above first");
                            }
                          }}
                        >
                          Apply to All Lines
                        </Button>
                      </div>
                      <CategoryAutocomplete
                        value={invoice.gl_code || ""}
                        onChange={(v) => {
                          setInvoice(prev => ({ ...prev, gl_code: v }));
                        }}
                        placeholder="Select category to apply to lines..."
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                          Line Items Category Allocation ({invoiceItems.length} items) <span className="text-rose-500">*</span>
                        </span>
                        <span className="text-xs text-slate-500">Category is required for all items</span>
                      </div>
                      <div className="border border-slate-200 dark:border-zinc-800 rounded-lg divide-y divide-slate-200 dark:divide-zinc-800 text-xs shadow-xs bg-white dark:bg-zinc-900">
                        <div className="bg-slate-100/80 dark:bg-zinc-800/70 px-3 py-2.5 grid grid-cols-12 gap-3 font-semibold text-slate-700 dark:text-zinc-300">
                          <div className="col-span-5">Item / Description</div>
                          <div className="col-span-2 text-right pr-6">Amount</div>
                          <div className="col-span-4 pl-4 border-l border-slate-200 dark:border-zinc-700">Category *</div>
                          <div className="col-span-1 flex items-center justify-center gap-0.5"><span>Asset</span><HelpIcon text="Mark as Capitalized Fixed Asset (CapEx)" iconClassName="h-3 w-3" /></div>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                          {invoiceItems.map((itm, idx) => (
                            <div key={idx} className="px-3 py-2.5 grid grid-cols-12 gap-3 items-center hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                              <div className="col-span-5 pr-1">
                                <div className="font-medium text-slate-900 dark:text-zinc-100 break-words whitespace-normal leading-snug" title={itm.description}>
                                  {itm.sku ? <span className="font-mono text-indigo-600 dark:text-indigo-400 mr-1">[{itm.sku}]</span> : null}{itm.description}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5">Qty: {itm.quantity}</div>
                              </div>
                              <div className="col-span-2 text-right pr-6 font-mono font-semibold text-slate-800 dark:text-zinc-200">
                                {formatMoney(itm.amount)}
                              </div>
                              <div className="col-span-4 pl-4 border-l border-slate-100 dark:border-zinc-800">
                                <CategoryAutocomplete
                                  value={itm.gl_code || ""}
                                  onChange={(v) => {
                                    setInvoiceItems(prev => {
                                      const updated = [...prev];
                                      updated[idx] = { ...updated[idx], gl_code: v };
                                      return updated;
                                    });
                                  }}
                                  placeholder="Select category *"
                                />
                              </div>
                              <div className="col-span-1 flex justify-center">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                  checked={itm.asset_flag || false}
                                  onChange={(e) => {
                                    setInvoiceItems(prev => {
                                      const updated = [...prev];
                                      updated[idx] = { ...updated[idx], asset_flag: e.target.checked };
                                      return updated;
                                    });
                                  }}
                                  title="Mark as Asset"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="bg-slate-50/80 dark:bg-zinc-900/90 px-3 py-2.5 flex items-center justify-between text-xs">
                          <span className="text-slate-600 dark:text-zinc-400">
                            Lines Total: <strong className="font-mono text-slate-900 dark:text-zinc-100 text-sm ml-1">{formatMoney(invoiceItems.reduce((s, it) => s + (Number(it.amount) || 0), 0))}</strong>
                          </span>
                          <span className="text-slate-600 dark:text-zinc-400">
                            Invoice Amount: <strong className="font-mono text-slate-900 dark:text-zinc-100 text-sm ml-1">{formatMoney(invoice.amount)}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <TwoUp>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Bank Account <span className="text-rose-500">*</span>
                        </label>
                        <BankAccountAutocomplete
                          value={invoice.bank_account || ""}
                          onChange={(v) => setInvoice({ ...invoice, bank_account: v })}
                          placeholder="Select Bank Account *"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Category <span className="text-rose-500">*</span>
                        </label>
                        <CategoryAutocomplete
                          value={invoice.gl_code || ""}
                          onChange={(v) => setInvoice({ ...invoice, gl_code: v })}
                          placeholder="Select Category *"
                        />
                      </div>
                    </TwoUp>
                    {request.request_type !== "RECURRING" && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <label className="text-sm font-medium">Asset Flag</label>
                          <HelpIcon text="Asset Flag designates whether this invoice represents a Capitalized Fixed Asset (CapEx) — such as equipment, hardware, lease/financing agreements, or software licenses — rather than an immediate operational expense (OpEx). When checked, the cost is capitalized on the balance sheet and depreciated/amortized over time instead of expensed in full in the current period. It automatically defaults to active for Scheduled Payments, Recurring obligations, and Accounts Payable." />
                        </div>
                        <div className="flex items-center h-10">
                          <input type="checkbox" className="h-4 w-4" checked={invoice.asset_flag || false} onChange={(e) => setInvoice({ ...invoice, asset_flag: e.target.checked })} />
                          <span className="ml-2 text-sm text-slate-700">Mark as Asset</span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    rows={2}
                    placeholder="Additional details..."
                    value={invoice.description ?? ""}
                    onChange={(e) => setInvoice({ ...invoice, description: e.target.value })}
                  />
                </div>
                <AttachmentDropzone
                  files={pendingFiles}
                  onFilesSelected={(files) => setPendingFiles((prev) => [...prev, ...files])}
                  onRemove={(index) => setPendingFiles((prev) => prev.filter((_, i) => i !== index))}
                  onPreviewFile={handlePreviewFile}
                  existingAttachments={data?.attachments || []}
                  onPreviewAttachment={handlePreviewAttachment}
                  onRemoveAttachment={(attId) => {
                    if (window.confirm("Are you sure you want to remove this attachment?")) {
                      deleteAttachment.mutate(attId);
                    }
                  }}
                />
              </>
            )}
    </>
  );
}
