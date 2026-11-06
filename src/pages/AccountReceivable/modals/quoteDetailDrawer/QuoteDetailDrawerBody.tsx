import { CreditCard } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../components/ui/dialog";
import { SendQuoteModal } from "../SendQuoteModal";
import type { QuoteDetailDrawerGuardedState } from "./hooks/useQuoteDetailDrawer";
import { useQuoteDetailDrawerTail } from "./hooks/useQuoteDetailDrawerTail";
import { DrawerHeader } from "./sections/DrawerHeader";

export function QuoteDetailDrawerBody({ s }: { s: QuoteDetailDrawerGuardedState }) {
  const v = { ...s, ...useQuoteDetailDrawerTail(s) };
  const { paymentSubmitting, paymentAmount, handleRecordPayment, setIsPaymentModalOpen, setPaymentNotes, paymentNotes, setPaymentRef, paymentRef, setPaymentMethod, paymentMethod, setPaymentAmount, quote, isPaymentModalOpen, setIsSendModalOpen, isSendModalOpen } = v;
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <DrawerHeader v={v} />

      {/* Send to Customer Modal */}
      <SendQuoteModal
        quote={quote}
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        onSentSuccess={(msg) => alert(msg)}
      />

      {/* Record Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <span>Record Payment Received</span>
            </DialogTitle>
            <DialogDescription>
              Record an incoming payment against quote <strong>{quote.quote_number}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold">Payment Amount ({quote.currency}) *</Label>
              <Input
                type="number"
                step="any"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">Payment Method</Label>
                <Input
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  placeholder="e.g. WIRE, ACH, CHECK"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">Reference / Tx ID</Label>
                <Input
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. WIRE-88491"
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-semibold">Internal Notes</Label>
              <Textarea
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
    </div>
  );
}
