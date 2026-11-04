import React, { useEffect, useState } from "react";
import { Lock, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { sendSecureCode } from "@/services/purchasingService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { errorMessage } from "../utils";
import type { SendCodeDialogProps } from "../types";

export const SendCodeDialog: React.FC<SendCodeDialogProps> = ({ requestId, summary, open, onOpenChange, onSent }) => {
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) setCode("");
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error("Please enter the verification code.");
      return;
    }
    setSaving(true);
    try {
      await sendSecureCode(requestId, summary.id, code);
      setCode("");
      toast.success("Code sent securely.");
      onOpenChange(false);
      await onSent();
    } catch (err) {
      toast.error(errorMessage(err, "Could not send the code."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-violet-600" />
              Send verification code securely
            </DialogTitle>
            <DialogDescription className="text-xs">
              Enter the code the service just sent you. Only {summary.requested_by_name || "the admin"} can view it,
              once, and it's deleted after 10 minutes.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="one-time-code"
            spellCheck={false}
            maxLength={64}
            placeholder="e.g. 482915"
            className="text-center text-lg tracking-widest font-mono"
            autoFocus
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white">
              <Lock className="h-3.5 w-3.5" />
              {saving ? "Sending..." : "Send securely"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
