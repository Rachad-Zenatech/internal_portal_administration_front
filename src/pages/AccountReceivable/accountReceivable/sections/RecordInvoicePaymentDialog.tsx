import { CreditCard } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../components/ui/dialog";
import { GLCodeAutocomplete } from "../../../Purchasing/fields/GLCodeAutocomplete";
import { ClassAutocomplete } from "../../../Purchasing/fields/ClassAutocomplete";
import type { AccountReceivableState } from "../hooks/useAccountReceivable";

export function RecordInvoicePaymentDialog({ s }: { s: AccountReceivableState }) {
  const { isSubmittingInvoicePayment, invoicePaymentAmount, handleConfirmInvoicePayment, setIsInvoicePaymentModalOpen, setInvoicePaymentNotes, invoicePaymentNotes, setInvoicePaymentClass, invoicePaymentClass, setInvoicePaymentGLCode, invoicePaymentGLCode, setInvoicePaymentRef, invoicePaymentRef, setInvoicePaymentDate, invoicePaymentDate, setInvoicePaymentMethod, invoicePaymentMethod, selectedInvoiceForPayment, setInvoicePaymentAmount, isInvoicePaymentModalOpen } = s;
  return (
    <Dialog open={isInvoicePaymentModalOpen} onOpenChange={setIsInvoicePaymentModalOpen}>
        <DialogContent className="max-w-xl w-full">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Record Invoice Payment</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Record a payment settlement against Invoice <strong>{selectedInvoiceForPayment?.invoice_number}</strong> for <strong>{selectedInvoiceForPayment?.customer_name}</strong>.
            </DialogDescription>
          </DialogHeader>

          {selectedInvoiceForPayment && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white font-mono">{selectedInvoiceForPayment.invoice_number}</div>
                  <div className="text-[11px] text-slate-500">{selectedInvoiceForPayment.customer_name}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-500">Balance Due</div>
                  <div className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    ${Number(selectedInvoiceForPayment.balance_due !== undefined ? selectedInvoiceForPayment.balance_due : selectedInvoiceForPayment.total_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} {selectedInvoiceForPayment.currency || "USD"}
                  </div>
                  <div className="text-[10px] text-slate-400">Total: ${Number(selectedInvoiceForPayment.total_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="record-invoice-payment-amount" className="text-[11px] font-semibold">
                  Payment Amount ({selectedInvoiceForPayment.currency || "USD"}) *
                </Label>
                <Input
                  id="record-invoice-payment-amount"
                  name="invoicePaymentAmount"
                  type="number"
                  step="any"
                  value={invoicePaymentAmount}
                  onChange={(e) => setInvoicePaymentAmount(e.target.value)}
                  placeholder={String(selectedInvoiceForPayment.total_amount || 0)}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="record-invoice-payment-method" className="text-[11px] font-semibold">Payment Method</Label>
                  <Input
                    id="record-invoice-payment-method"
                    name="invoicePaymentMethod"
                    value={invoicePaymentMethod}
                    onChange={(e) => setInvoicePaymentMethod(e.target.value)}
                    placeholder="WIRE, ACH, CHECK, CARD"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="record-invoice-payment-date" className="text-[11px] font-semibold">Payment Date</Label>
                  <Input
                    id="record-invoice-payment-date"
                    name="invoicePaymentDate"
                    type="date"
                    value={invoicePaymentDate}
                    onChange={(e) => setInvoicePaymentDate(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="record-invoice-payment-ref" className="text-[11px] font-semibold">Reference / Tx ID (Optional)</Label>
                <Input
                  id="record-invoice-payment-ref"
                  name="invoicePaymentRef"
                  value={invoicePaymentRef}
                  onChange={(e) => setInvoicePaymentRef(e.target.value)}
                  placeholder="e.g. WIRE-88491 / CHK-1002"
                  className="h-8 text-xs font-mono"
                />
              </div>

              {/* 2 Auto-completed Fields: Category (GL Codes) & Class (Classes Table) */}
              <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold flex items-center justify-between">
                    <span>Category (GL Code)</span>
                    <span className="text-[10px] text-slate-400 font-normal font-sans">Chart of Accounts</span>
                  </Label>
                  <GLCodeAutocomplete
                    value={invoicePaymentGLCode}
                    onChange={setInvoicePaymentGLCode}
                    placeholder="GL Code & Account..."
                    showDetailCard={false}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold flex items-center justify-between">
                    <span>Class</span>
                    <span className="text-[10px] text-slate-400 font-normal font-sans">Classes Table</span>
                  </Label>
                  <ClassAutocomplete
                    value={invoicePaymentClass}
                    onChange={setInvoicePaymentClass}
                    placeholder="Select Class..."
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="record-invoice-payment-notes" className="text-[11px] font-semibold">Internal Notes (Optional)</Label>
                <Textarea
                  id="record-invoice-payment-notes"
                  name="invoicePaymentNotes"
                  value={invoicePaymentNotes}
                  onChange={(e) => setInvoicePaymentNotes(e.target.value)}
                  rows={2}
                  placeholder="Any settlement details or notes..."
                  className="text-xs resize-none"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsInvoicePaymentModalOpen(false)}
              className="text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmInvoicePayment}
              disabled={isSubmittingInvoicePayment || !invoicePaymentAmount || Number(invoicePaymentAmount) <= 0}
              className="text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer shadow-xs"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{isSubmittingInvoicePayment ? "Recording Payment..." : "Confirm Payment"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}
