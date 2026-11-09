import { Landmark, Loader2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WireGeneralPaymentFields } from "../fields/WireGeneralPaymentFields";
import { WireBankingFields } from "../fields/WireBankingFields";
import { PreviousPaymentPicker } from "./createWireTransfer/PreviousPaymentPicker";
import { useCreateWireTransfer, type WirePrefill } from "./createWireTransfer/useCreateWireTransfer";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** called after a wire transfer was created (so the wire page can reload its list) */
  onCreated?: () => void;
  /** start from an earlier Rent/Note payment instead of a blank form */
  prefill?: WirePrefill | null;
  /** Dialog title override, e.g. "Create a payable" */
  dialogTitle?: string;
}

/** Creates a wire transfer or accounts payable request; captures general payment & full banking clearing fields. */
export function CreateWireTransferDialog({ open, onOpenChange, onCreated, prefill, dialogTitle }: Props) {
  const s = useCreateWireTransfer(open, onOpenChange, onCreated, prefill);
  const { wire, setWire, title, setTitle, requester, setRequester, department, setDepartment, setFile, fileInputRef, category, isRecurring, isSubmitting } = s;

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      {/* sm:max-w-* is needed: the shared DialogContent sets sm:max-w-sm, which would otherwise win */}
      <DialogContent className="sm:max-w-6xl w-[95vw] max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl">
        <DialogHeader className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40 shrink-0">
          <DialogTitle className="flex items-center gap-2.5 text-lg">
            <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-sm">
              <Landmark className="h-5 w-5" />
            </span>
            {dialogTitle || "Create Wire Transfer"}
          </DialogTitle>
          <DialogDescription className="sr-only">{dialogTitle || "Create a new wire transfer request"}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5">
          {isRecurring && (
            <PreviousPaymentPicker
              category={category}
              items={s.previousPayments}
              isLoading={s.isLoadingPrevious}
              selected={s.selectedPrevious}
              onPick={s.applyPrevious}
              onClear={s.clearPrevious}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="space-y-1.5 md:col-span-6">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={wire.vendor ? `Payment for ${wire.vendor}` : 'Leave blank to use "Payment for <vendor>"'}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5 md:col-span-3">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Requester <span className="text-red-500">*</span>
              </label>
              <Input value={requester} onChange={(e) => setRequester(e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5 md:col-span-3">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Department <span className="text-red-500">*</span>
              </label>
              <Input value={department} onChange={(e) => setDepartment(e.target.value)} className="h-9 text-sm" />
            </div>
          </div>

          <WireGeneralPaymentFields form={wire} setForm={setWire} isSubmitting={isSubmitting} />
          <WireBankingFields form={wire} setForm={setWire} />

          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 space-y-2">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <label className="text-xs font-semibold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">Attach Wire Invoice / Payment Receipt</label>
            </div>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="cursor-pointer file:cursor-pointer text-xs bg-white dark:bg-zinc-900"
            />
          </div>
        </div>

        <DialogFooter className="mx-0 mb-0 rounded-none px-6 py-3.5 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40 gap-2 sm:gap-2 shrink-0">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="cursor-pointer">
            Cancel
          </Button>
          <Button type="button" variant="outline" onClick={() => s.submit("draft")} disabled={isSubmitting} className="cursor-pointer">
            Save as Draft
          </Button>
          <Button type="button" onClick={() => s.submit("submit")} disabled={isSubmitting} className="gap-2 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 cursor-pointer">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Create &amp; Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
