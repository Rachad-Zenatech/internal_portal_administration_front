import { useMemo, useState } from "react";
import { Link2, RefreshCw } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../../components/ui/dialog";
import { arEmailPaymentService, type EmailPaymentMatch } from "../../../../services/arEmailPaymentService";
import type { GeneratedInvoiceSummary } from "../../../../services/arInvoiceService";
import { UnmatchedEmailPreviewPane } from "./UnmatchedEmailPreviewPane";
import { UnmatchedInvoicePickerPane } from "./UnmatchedInvoicePickerPane";

interface UnmatchedPaymentsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unmatched: EmailPaymentMatch[];
  openInvoices: GeneratedInvoiceSummary[];
  isScanning: boolean;
  onScan: () => Promise<any>;
  onMappedOrRecorded: () => Promise<void>;
}

export function UnmatchedPaymentsDrawer({
  open,
  onOpenChange,
  unmatched,
  openInvoices,
  isScanning,
  onScan,
  onMappedOrRecorded,
}: UnmatchedPaymentsDrawerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [invSearch, setInvSearch] = useState("");
  const [selectedAllocations, setSelectedAllocations] = useState<Record<string, number>>({});
  const [rememberPayer, setRememberPayer] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selected = useMemo(
    () => unmatched.find((m) => m.id === selectedId) || unmatched[0] || null,
    [unmatched, selectedId]
  );

  const filteredInvoices = useMemo(() => {
    const q = invSearch.trim().toLowerCase();
    return openInvoices.filter((inv) => {
      if (!q) return true;
      return (
        (inv.invoice_number || "").toLowerCase().includes(q) ||
        (inv.customer_name || "").toLowerCase().includes(q) ||
        String(inv.balance_due ?? inv.total_amount ?? "").includes(q)
      );
    });
  }, [openInvoices, invSearch]);

  const toggleInvoice = (inv: GeneratedInvoiceSummary) => {
    setSelectedAllocations((prev) => {
      const next = { ...prev };
      if (next[inv.id] !== undefined) {
        delete next[inv.id];
      } else {
        const bal = Number(inv.balance_due !== undefined ? inv.balance_due : inv.total_amount || 0);
        const extractedAmt = Number(selected?.extracted_data?.total_amount || 0);
        next[inv.id] = Object.keys(prev).length === 0 && extractedAmt > 0 && extractedAmt < bal ? extractedAmt : bal;
      }
      return next;
    });
  };

  const handleSubmit = async (recordNow: boolean) => {
    if (!selected) return;
    const allocs = Object.entries(selectedAllocations)
      .filter(([, amt]) => Number(amt) > 0)
      .map(([invoice_id, amount]) => ({ invoice_id, amount: Number(amount) }));
    if (allocs.length === 0) return;
    setIsSubmitting(true);
    try {
      await arEmailPaymentService.manualMap(selected.email_id, {
        allocations: allocs,
        record_now: recordNow,
        remember_payer: rememberPayer,
        match_id: selected.id,
      });
      setSelectedAllocations({});
      await onMappedOrRecorded();
    } catch (err: any) {
      alert(err?.response?.data?.detail || err?.message || "Failed to map email payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismiss = async (emailId: string, matchId?: string) => {
    setIsSubmitting(true);
    try {
      await arEmailPaymentService.dismissMatch(emailId, false, matchId);
      setSelectedAllocations({});
      await onMappedOrRecorded();
    } finally {
      setIsSubmitting(false);
    }
  };

  const allocatedTotal = Object.values(selectedAllocations).reduce((s, v) => s + (Number(v) || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[94vw] lg:max-w-[1360px] w-[95vw] h-[90vh] p-5 sm:p-6 flex flex-col gap-3 overflow-hidden">
        <DialogHeader className="flex flex-row items-start justify-between gap-4 pr-10 space-y-0 shrink-0">
          <div className="space-y-0.5">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Link2 className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Unmatched &amp; Review A/R Payments ({unmatched.length})</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Inspect check scans or remittance emails and manually map them to one or more open invoices.
            </DialogDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => onScan()} disabled={isScanning} className="h-8 px-3 text-xs gap-1.5 rounded-xl shrink-0 cursor-pointer">
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
            <span>{isScanning ? "Scanning..." : "Scan New Emails"}</span>
          </Button>
        </DialogHeader>

        {unmatched.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            All detected payment emails are matched or recorded. Click <strong>Scan New Emails</strong> to check for new remittances or checks.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 overflow-hidden">
            <UnmatchedEmailPreviewPane
              unmatched={unmatched}
              selected={selected}
              isSubmitting={isSubmitting}
              onSelect={(id) => { setSelectedId(id); setSelectedAllocations({}); }}
              onDismiss={handleDismiss}
            />
            <UnmatchedInvoicePickerPane
              invSearch={invSearch}
              onInvSearchChange={setInvSearch}
              filteredInvoices={filteredInvoices}
              selectedAllocations={selectedAllocations}
              onToggleInvoice={toggleInvoice}
              onAllocationChange={(id, amt) => setSelectedAllocations((p) => ({ ...p, [id]: amt }))}
              rememberPayer={rememberPayer}
              onRememberPayerChange={setRememberPayer}
              allocatedTotal={allocatedTotal}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
