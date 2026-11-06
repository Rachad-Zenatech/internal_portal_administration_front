import React, { useEffect, useState } from "react";
import { Lock, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { submitSecureInfo } from "@/services/purchasingService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SECRET_FIELD_RE } from "../constants";
import { errorMessage } from "../utils";
import type { SubmitSecureInfoDialogProps } from "../types";

export const SubmitSecureInfoDialog: React.FC<SubmitSecureInfoDialogProps> = ({
  requestId,
  summary,
  open,
  onOpenChange,
  onSubmitted,
}) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const [uses2fa, setUses2fa] = useState(false);
  const [saving, setSaving] = useState(false);

  // Never keep typed values around once the dialog closes.
  useEffect(() => {
    if (!open) {
      setValues({});
      setShown({});
      setUses2fa(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing = summary.fields.find((f) => !(values[f] || "").trim());
    if (missing) {
      toast.error(`Please fill in '${missing}'.`);
      return;
    }
    setSaving(true);
    try {
      await submitSecureInfo(requestId, summary.id, values, uses2fa);
      setValues({});
      toast.success("Account details submitted securely.");
      onOpenChange(false);
      await onSubmitted();
    } catch (err) {
      toast.error(errorMessage(err, "Could not submit the details."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Submit account details securely
            </DialogTitle>
            <DialogDescription className="text-xs">
              For: <span className="font-medium">{summary.purpose}</span>. These are encrypted and only{" "}
              {summary.requested_by_name || "the assigned admin"} can view them. They're deleted automatically after
              use or within 3 days.
            </DialogDescription>
          </DialogHeader>

          {summary.fields.map((label, i) => {
            const isSecret = SECRET_FIELD_RE.test(label);
            const visible = shown[label];
            return (
              <div key={label} className="space-y-1.5">
                <label htmlFor={`secure-field-${i}`} className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                  {label}
                </label>
                <div className="flex gap-1.5">
                  <Input
                    id={`secure-field-${i}`}
                    type={isSecret && !visible ? "password" : "text"}
                    autoComplete={isSecret ? "new-password" : "off"}
                    spellCheck={false}
                    maxLength={2000}
                    value={values[label] || ""}
                    onChange={(e) => setValues({ ...values, [label]: e.target.value })}
                    className="text-sm"
                    autoFocus={i === 0}
                  />
                  {isSecret && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label={visible ? `Hide ${label}` : `Show ${label}`}
                      onClick={() => setShown({ ...shown, [label]: !visible })}
                    >
                      {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          <div className="flex items-start gap-2 rounded-md border border-slate-200 dark:border-zinc-700 p-2.5">
            <Checkbox
              id="secure-uses-2fa"
              checked={uses2fa}
              onCheckedChange={(c) => setUses2fa(Boolean(c))}
              className="mt-0.5"
            />
            <label htmlFor="secure-uses-2fa" className="text-xs cursor-pointer">
              <span className="font-medium text-slate-700 dark:text-zinc-300">
                This account asks for a verification code (2FA) when signing in
              </span>
              <span className="block text-[11px] text-slate-400">
                When {summary.requested_by_name || "the admin"} signs in, you'll get an email asking for the code, and
                you'll send it from this request. Don't put codes in the fields above.
              </span>
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Lock className="h-3.5 w-3.5" />
              {saving ? "Submitting..." : "Submit securely"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
