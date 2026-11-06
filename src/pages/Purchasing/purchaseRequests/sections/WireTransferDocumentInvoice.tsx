import { Eye, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WireGeneralPaymentFields } from "../../fields/WireGeneralPaymentFields";
import { WireBankingFields } from "../../fields/WireBankingFields";
import type { PurchaseRequestsState } from "../hooks/usePurchaseRequestsPage";

export function WireTransferDocumentInvoice({ s }: { s: PurchaseRequestsState }) {
  const { quoteFile, handlePreviewFile, setQuoteFile, quoteFileInputRef, setApWireForm, apWireForm, setForm, form } = s;
  return (
    <>
      {form.request_type === "ACCOUNTS_PAYABLE" && (
              <div className="pt-1 space-y-4">
                <WireGeneralPaymentFields
                  form={apWireForm}
                  setForm={setApWireForm}
                  onAmountChange={(amt) => setForm((p) => ({ ...p, amount: amt, unit_price: amt }))}
                  onCurrencyChange={(curr) => setForm((p) => ({ ...p, currency: curr }))}
                  onDueDateChange={(dd) => setForm((p) => ({ ...p, due_date: dd }))}
                  onVendorChange={(v) => {
                    if (!form.title || form.title.startsWith("Payment for")) {
                      setForm((p) => ({ ...p, title: `Payment for ${v}` }));
                    }
                  }}
                />
                <WireBankingFields
                  form={apWireForm}
                  setForm={setApWireForm}
                />

                {/* Wire Transfer Document & Invoice Upload */}
                <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <label className="text-xs font-semibold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
                        Attach Wire Invoice / Payment Receipt
                      </label>
                    </div>
                    {quoteFile && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setQuoteFile(null);
                          if (quoteFileInputRef.current) quoteFileInputRef.current.value = "";
                        }}
                        className="h-6 text-[11px] text-slate-500 hover:text-red-600 px-2 cursor-pointer"
                      >
                        Clear File
                      </Button>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <Input
                      ref={quoteFileInputRef}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setQuoteFile(file);
                      }}
                      className="cursor-pointer file:cursor-pointer text-xs bg-white dark:bg-zinc-900"
                    />
                    {quoteFile && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 px-3 text-xs gap-1.5 text-indigo-600 dark:text-indigo-400 border-indigo-200 hover:bg-indigo-50 shrink-0 cursor-pointer"
                        onClick={() => handlePreviewFile(quoteFile)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Preview Upload</span>
                      </Button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                    Upload vendor invoice PDF, bank wire slip, or payment confirmation. Saved directly with this wire transfer record.
                  </p>
                </div>
              </div>
            )}
    </>
  );
}
