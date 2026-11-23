import { BankAccountAutocomplete } from "../../fields/BankAccountAutocomplete";
import { CategoryAutocomplete } from "../../fields/CategoryAutocomplete";
import { ClassAutocomplete } from "../../fields/ClassAutocomplete";
import RegionAutocomplete from "../../fields/RegionAutocomplete";
import { InvoiceLinesCategoryTable } from "./InvoiceLinesCategoryTable";
import { InvoiceLocationAmountFields } from "./InvoiceLocationAmountFields";
import { VendorAutocomplete } from "../../fields/VendorAutocomplete";
import HelpIcon from "@/components/ui/HelpIcon";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
                        Invoice Due Date <span className="text-red-500">*</span>
                      </span>
                    }
                    type="date"
                    value={invoice.due_date ?? ""}
                    onChange={(v) => setInvoice({ ...invoice, due_date: v })}
                  />
                  {request.request_type !== "RECURRING" ? (
                    <FieldInput label="Paid Date" type="date" value={invoice.paid_date ?? ""} onChange={(v) => setInvoice({ ...invoice, paid_date: v })} />
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
                      Region <span className="text-red-500">*</span>
                    </label>
                    <RegionAutocomplete
                      value={invoice.region || ""}
                      onChange={(v) => setInvoice({ ...invoice, region: v })}
                      placeholder="Select or enter region *"
                      required
                    />
                  </div>
                </TwoUp>

                <InvoiceLocationAmountFields invoice={invoice} setInvoice={setInvoice} currency={request.currency || "USD"} />

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
                      <InvoiceLinesCategoryTable
                        invoiceItems={invoiceItems}
                        setInvoiceItems={setInvoiceItems}
                        invoiceAmount={Number(invoice.amount) || 0}
                      />
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
