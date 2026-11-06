import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GLCodeAutocomplete } from "@/pages/Purchasing/fields/GLCodeAutocomplete";
import { ClassAutocomplete } from "@/pages/Purchasing/fields/ClassAutocomplete";
import type { QuoteDetailPageViewState } from "../hooks/useQuoteDetailPageTail";

export function RecordPaymentModal({ v }: { v: QuoteDetailPageViewState }) {
  const { paymentSubmitting, paymentAmount, handleRecordPayment, setIsPaymentModalOpen, setPaymentNotes, paymentNotes, setPaymentClass, paymentClass, setPaymentGLCode, paymentGLCode, setPaymentRef, paymentRef, setPaymentMethod, paymentMethod, quote, setPaymentAmount, isPaymentModalOpen } = v;
  return (
    <>
      {quote && (
        <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
          <DialogContent className="max-w-xl w-full">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Record Invoice Payment</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Record a payment settlement against Quote {quote.quote_number} (Total: ${Number(quote.total_amount).toLocaleString("en-US", { minimumFractionDigits: 2 })} {quote.currency}).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="space-y-1">
                <Label htmlFor="payment-modal-amount" className="text-[11px] font-semibold">Payment Amount ({quote.currency}) *</Label>
                <Input
                  id="payment-modal-amount"
                  name="paymentAmount"
                  type="number"
                  step="any"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={quote.total_amount.toString()}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="payment-modal-method" className="text-[11px] font-semibold">Payment Method</Label>
                  <Input
                    id="payment-modal-method"
                    name="paymentMethod"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    placeholder="e.g. WIRE, ACH, CHECK"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="payment-modal-ref" className="text-[11px] font-semibold">Reference / Tx ID</Label>
                  <Input
                    id="payment-modal-ref"
                    name="paymentRef"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="e.g. WIRE-88491"
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              {/* 2 Auto-completed Fields: Category (GL Codes) & Class (Classes Table) */}
              <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold flex items-center justify-between">
                    <span>Category (GL Code)</span>
                    <span className="text-[10px] text-slate-400 font-normal font-sans">Chart of Accounts</span>
                  </Label>
                  <GLCodeAutocomplete
                    value={paymentGLCode}
                    onChange={setPaymentGLCode}
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
                    value={paymentClass}
                    onChange={setPaymentClass}
                    placeholder="Select Class..."
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="payment-modal-notes" className="text-[11px] font-semibold">Internal Notes</Label>
                <Textarea
                  id="payment-modal-notes"
                  name="paymentNotes"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows={2}
                  className="text-xs resize-none"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleRecordPayment}
                disabled={paymentSubmitting || Number(paymentAmount) <= 0}
                className="text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {paymentSubmitting ? "Recording..." : "Confirm Payment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
