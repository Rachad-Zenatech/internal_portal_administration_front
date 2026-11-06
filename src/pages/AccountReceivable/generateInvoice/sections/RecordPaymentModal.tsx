import { Check, CreditCard, Loader2 } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { GLCodeAutocomplete } from "../../../Purchasing/fields/GLCodeAutocomplete";
import { ClassAutocomplete } from "../../../Purchasing/fields/ClassAutocomplete";
import type { GenerateInvoiceState } from "../hooks/useGenerateInvoice";

export function RecordPaymentModal({ s }: { s: GenerateInvoiceState }) {
  const { isPaymentSubmitting, paymentAmountInput, handleConfirmRecordPayment, setIsRecordPaymentOpen, setPaymentNotesInput, paymentNotesInput, setPaymentClassInput, paymentClassInput, setPaymentGLCodeInput, paymentGLCodeInput, setPaymentRefInput, paymentRefInput, setPaymentDateInput, paymentDateInput, setPaymentMethodInput, paymentMethodInput, setPaymentAmountInput, calculatedTotals, currency, invoiceNumber, isRecordPaymentOpen } = s;
  return (
    <Dialog open={isRecordPaymentOpen} onOpenChange={setIsRecordPaymentOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Record Payment for {invoiceNumber}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Record an incoming customer payment. The balance due, workflow status, and immutable audit logs will update immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Payment Amount ({currency}) <span className="text-red-500">*</span></span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Due: ${calculatedTotals.effectiveBalanceDue.toFixed(2)}
                  </span>
                </Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    $
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={paymentAmountInput}
                    onChange={(e) => setPaymentAmountInput(e.target.value)}
                    placeholder="0.00"
                    className="text-xs font-mono pl-6 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Payment Method <span className="text-red-500">*</span>
                </Label>
                <Select value={paymentMethodInput} onValueChange={setPaymentMethodInput}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue placeholder="Select Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WIRE" className="text-xs font-medium">Bank Wire Transfer</SelectItem>
                    <SelectItem value="ACH" className="text-xs font-medium">ACH / Direct Debit</SelectItem>
                    <SelectItem value="CHECK" className="text-xs font-medium">Paper Check</SelectItem>
                    <SelectItem value="CARD" className="text-xs font-medium">Credit / Debit Card</SelectItem>
                    <SelectItem value="OTHER" className="text-xs font-medium">Other / Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Payment Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={paymentDateInput}
                  onChange={(e) => setPaymentDateInput(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Reference / Check #
                </Label>
                <Input
                  type="text"
                  value={paymentRefInput}
                  onChange={(e) => setPaymentRefInput(e.target.value)}
                  placeholder="e.g. WIRE-884920 or CHK #4021"
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Category (GL Code / Account)
              </Label>
              <GLCodeAutocomplete
                value={paymentGLCodeInput}
                onChange={setPaymentGLCodeInput}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Class / Cost Center
              </Label>
              <ClassAutocomplete
                value={paymentClassInput}
                onChange={setPaymentClassInput}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Internal Settlement Notes
              </Label>
              <Textarea
                rows={2}
                value={paymentNotesInput}
                onChange={(e) => setPaymentNotesInput(e.target.value)}
                placeholder="Add optional notes, receipt breakdown, bank memo..."
                className="text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsRecordPaymentOpen(false)}
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmRecordPayment}
              disabled={isPaymentSubmitting || !paymentAmountInput || Number(paymentAmountInput) <= 0}
              className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
            >
              {isPaymentSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>Record Payment</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}
