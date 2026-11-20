import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ACTION_META } from "../../utils/purchasingMeta";
import { MultiplePartsInteractiveEditable } from "./MultiplePartsInteractiveEditable";
import { ActionFormFields } from "./ActionFormFields";
import { CurrentReferenceInfo } from "./CurrentReferenceInfo";
import { ApprovalActionForm } from "./ApprovalActionForm";
import type { RequestDetailViewState } from "../hooks/useRequestDetailTail";

export function RequestDetailActionDialog({ v }: { v: RequestDetailViewState }) {
  const { activeForm, setActiveForm, submitForm, transition, tracking, setTracking, confirmGoods, setConfirmGoods, hold, setHold } = v;

  if (!activeForm) return null;

  return (
    <Dialog open={!!activeForm} onOpenChange={(open) => !open && setActiveForm(null)}>
      <DialogContent
        aria-describedby={undefined}
        className={
          activeForm.kind === "invoice" || activeForm.kind === "po"
            ? "w-[95vw] md:w-[80vw] max-w-[95vw] md:max-w-[80vw] max-h-[90vh] overflow-y-auto"
            : "sm:max-w-xl max-h-[90vh] overflow-y-auto"
        }
        style={
          activeForm.kind === "invoice" || activeForm.kind === "po"
            ? { width: "80vw", maxWidth: "80vw" }
            : undefined
        }
      >
        <DialogHeader>
          <DialogTitle>{ACTION_META[activeForm.action].label}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <MultiplePartsInteractiveEditable v={v} />
          <ActionFormFields v={v} />
          <ApprovalActionForm v={v} />

          {activeForm.kind === "tracking" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Shipping Note</label>
              <Textarea
                placeholder="Add optional shipping details..."
                value={tracking.note}
                onChange={(e) => setTracking({ ...tracking, note: e.target.value })}
              />
            </div>
          )}

          {activeForm.kind === "confirmGoods" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Are you sure you want to confirm goods received or services completed?</p>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Confirmation Notes <span className="text-muted-foreground text-xs font-normal">(Optional)</span>
                </label>
                <Textarea
                  rows={3}
                  placeholder="Add optional notes (e.g. services verified, deliverables approved, packages received)..."
                  value={confirmGoods.description}
                  onChange={(e) => setConfirmGoods({ description: e.target.value })}
                />
              </div>
            </div>
          )}

          {activeForm.kind === "hold" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Hold Reason <span className="text-red-500">*</span></label>
              <Textarea
                rows={3}
                placeholder="Why is this being put on hold?"
                value={hold.reason}
                onChange={(e) => setHold({ reason: e.target.value })}
              />
            </div>
          )}

          <CurrentReferenceInfo v={v} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setActiveForm(null)}>Cancel</Button>
          <Button
            onClick={submitForm}
            disabled={transition.isPending}
            variant={activeForm.action === "REJECT" ? "destructive" : "default"}
            className={activeForm.action === "REJECT" ? "bg-rose-600 hover:bg-rose-700 text-white font-semibold" : ""}
          >
            {activeForm.action === "REJECT" ? "Confirm Rejection" : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
