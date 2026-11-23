import { useState } from "react";
import { AlertTriangle, CheckSquare, Square, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface UrgentPayableToggleProps {
  checked: boolean;
  reason: string;
  onChange: (checked: boolean, reason: string) => void;
  disabled?: boolean;
}

/** Treasury-only toggle at the top of Create Payable to override approval straight to Waiting Payment. */
export function UrgentPayableToggle({ checked, reason, onChange, disabled }: UrgentPayableToggleProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleToggleClick = () => {
    if (disabled) return;
    if (checked) {
      onChange(false, "");
    } else {
      setDialogOpen(true);
    }
  };

  return (
    <>
      <div
        className={`flex items-start justify-between gap-3 rounded-lg border px-3.5 py-2.5 transition-colors ${
          checked
            ? "border-red-300 bg-red-50/70 dark:border-red-500/40 dark:bg-red-950/20"
            : "border-slate-200 bg-slate-50/60 dark:border-zinc-800 dark:bg-zinc-900/40"
        }`}
      >
        <button
          type="button"
          onClick={handleToggleClick}
          disabled={disabled}
          className="flex items-start gap-2.5 text-left cursor-pointer disabled:opacity-50"
        >
          {checked ? (
            <CheckSquare className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
          ) : (
            <Square className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
          )}
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-900 dark:text-zinc-100">
              <AlertTriangle className={`h-3.5 w-3.5 ${checked ? "text-red-600 dark:text-red-400" : "text-amber-500"}`} />
              <span>Urgent Account Payable</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {checked && reason
                ? `Override reason: ${reason}`
                : "Mark as urgent and override approval directly to Waiting Payment."}
            </p>
          </div>
        </button>
        {checked && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setDialogOpen(true)}
            disabled={disabled}
            className="h-7 px-2 text-xs text-red-700 hover:text-red-800 hover:bg-red-100/70 dark:text-red-300 dark:hover:bg-red-900/30 shrink-0 cursor-pointer"
          >
            <Pencil className="h-3 w-3 mr-1" />
            Edit note
          </Button>
        )}
      </div>

      <UrgentReasonDialog
        open={dialogOpen}
        initialReason={reason}
        onOpenChange={setDialogOpen}
        onConfirm={(note) => {
          onChange(true, note);
          setDialogOpen(false);
        }}
      />
    </>
  );
}

interface UrgentReasonDialogProps {
  open: boolean;
  initialReason: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
}

function UrgentReasonDialog({ open, initialReason, onOpenChange, onConfirm }: UrgentReasonDialogProps) {
  const [draft, setDraft] = useState(initialReason);
  const [error, setError] = useState("");

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setDraft(initialReason);
      setError("");
    }
    onOpenChange(next);
  };

  const handleSave = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      setError("A reason note is required for Urgent Account Payable.");
      return;
    }
    onConfirm(trimmed);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            Urgent Account Payable Reason
          </DialogTitle>
          <DialogDescription>
            Enter a required reason note for overriding approval straight to Waiting Payment. This note will appear in the Approvals tab and CEO dashboard.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="urgent-payable-reason">
            Reason Note <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="urgent-payable-reason"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (error) setError("");
            }}
            placeholder="Explain why this payable is urgent and requires approval override..."
            rows={4}
            autoFocus
          />
          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="cursor-pointer">
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} className="bg-red-600 text-white hover:bg-red-700 cursor-pointer">
            Confirm Urgent Override
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
