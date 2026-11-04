import React, { useEffect, useState } from "react";
import { Lock, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { createSecureInfoRequest } from "@/services/purchasingService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DEFAULT_FIELDS, TTL_OPTIONS, FORBIDDEN_FIELD_RE } from "../constants";
import { errorMessage } from "../utils";
import type { RequestAccountDetailsDialogProps } from "../types";

export const RequestAccountDetailsDialog: React.FC<RequestAccountDetailsDialogProps> = ({
  requestId,
  requesterLabel,
  open,
  onOpenChange,
  onCreated,
}) => {
  const [purpose, setPurpose] = useState("");
  const [fields, setFields] = useState<string[]>(DEFAULT_FIELDS);
  const [newField, setNewField] = useState("");
  const [ttlHours, setTtlHours] = useState(48);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setPurpose("");
      setFields(DEFAULT_FIELDS);
      setNewField("");
      setTtlHours(48);
      setNotifyEmail(true);
    }
  }, [open]);

  const addField = () => {
    const label = newField.trim().replace(/\s+/g, " ");
    if (!label) return;
    if (FORBIDDEN_FIELD_RE.test(label)) {
      toast.error("Don't request one-time codes or recovery codes. Ask the requester to complete verification directly.");
      return;
    }
    if (fields.some((f) => f.toLowerCase() === label.toLowerCase())) {
      setNewField("");
      return;
    }
    if (fields.length >= 10) {
      toast.error("You can request up to 10 fields.");
      return;
    }
    setFields([...fields, label.slice(0, 60)]);
    setNewField("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (purpose.trim().length < 3) {
      toast.error("Please describe what the account details are for.");
      return;
    }
    if (fields.length === 0) {
      toast.error("Add at least one field to request.");
      return;
    }
    setSaving(true);
    try {
      await createSecureInfoRequest(requestId, {
        purpose: purpose.trim(),
        fields,
        ttl_hours: ttlHours,
        notify_email: notifyEmail,
      });
      toast.success("Account details requested. The requester has been notified.");
      onOpenChange(false);
      await onCreated();
    } catch (err) {
      toast.error(errorMessage(err, "Could not send the request."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-violet-600" />
              Request account details
            </DialogTitle>
            <DialogDescription className="text-xs">
              The requester{requesterLabel ? ` (${requesterLabel})` : ""} gets a secure form. Their answers are
              encrypted and only you can view them, for a limited time.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <label htmlFor="secure-purpose" className="text-xs font-medium text-slate-700 dark:text-zinc-300">
              Purpose
            </label>
            <Input
              id="secure-purpose"
              value={purpose}
              maxLength={200}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Purchase your subscription"
              className="text-sm"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <div className="text-xs font-medium text-slate-700 dark:text-zinc-300">Details to collect</div>
            <div className="flex flex-wrap gap-1.5">
              {fields.map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-2 py-1 text-xs"
                >
                  {f}
                  <button
                    type="button"
                    aria-label={`Remove ${f}`}
                    onClick={() => setFields(fields.filter((x) => x !== f))}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newField}
                onChange={(e) => setNewField(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addField();
                  }
                }}
                placeholder="Add a field, e.g. Login URL"
                className="text-xs h-8"
              />
              <Button type="button" variant="outline" size="sm" onClick={addField} className="h-8 gap-1 text-xs">
                <Plus className="h-3 w-3" /> Add
              </Button>
            </div>
            <p className="text-[11px] text-slate-400">
              Don't ask for one-time or recovery codes. The requester should complete verification directly.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="secure-ttl" className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                Request stays open for
              </label>
              <select
                id="secure-ttl"
                value={ttlHours}
                onChange={(e) => setTtlHours(Number(e.target.value))}
                className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
              >
                {TTL_OPTIONS.map((o) => (
                  <option key={o.hours} value={o.hours}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2 pb-1.5">
              <Checkbox
                id="secure-notify"
                checked={notifyEmail}
                onCheckedChange={(c) => setNotifyEmail(Boolean(c))}
              />
              <label htmlFor="secure-notify" className="text-xs text-slate-600 dark:text-zinc-400 cursor-pointer">
                Email the requester
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white">
              <Lock className="h-3.5 w-3.5" />
              {saving ? "Sending..." : "Send secure request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
