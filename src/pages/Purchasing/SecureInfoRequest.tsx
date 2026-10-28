// Secure info requests: an admin asks the requester for account details (e.g. a subscription login).
// Values never appear in the thread. They're typed into a dedicated form, encrypted by the backend,
// and only the requesting admin can reveal them (after a recent sign-in), for a few seconds at a time.
import React, { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Plus,
  X,
  Clock,
  KeyRound,
  Ban,
  MessageSquare,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import {
  createSecureInfoRequest,
  deleteSecureInfo,
  revealSecureInfo,
  submitSecureInfo,
} from "@/services/purchasingService";
import { getApiErrorCode, POST_LOGIN_REDIRECT_KEY } from "@/services/helper";
import type { SecureInfoRequestSummary, SecureInfoReveal } from "@/types/purchasing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const REVEAL_PENDING_KEY = "secureRevealPending";
const DEFAULT_FIELDS = ["Username", "Password"];
const TTL_OPTIONS = [
  { hours: 24, label: "24 hours" },
  { hours: 48, label: "48 hours" },
  { hours: 72, label: "3 days" },
  { hours: 168, label: "7 days" },
];
// Mirrors the backend rule: don't collect one-time codes or recovery codes.
const FORBIDDEN_FIELD_RE =
  /\b(otp|one[\s-]?time|recovery|backup\s*codes?|2fa|mfa|verification\s*code|security\s*code|authenticator|sms\s*code)\b/i;
const SECRET_FIELD_RE = /pass|secret|pin|token|key/i;

/** Teams deep links (open the Teams app or web client). Only an email address goes in the link. */
function teamsChatUrl(email: string, message: string): string {
  return `https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(email)}&message=${encodeURIComponent(message)}`;
}

/** True when a regular message looks like it contains a password, so we can suggest the secure form. */
export function looksLikeCredential(text: string): boolean {
  return /\b(pass(word|wd)?|pwd|login|credentials?)\s*[:=]\s*\S+/i.test(text);
}

function errorMessage(err: unknown, fallback: string): string {
  return (err as Error)?.message || fallback;
}

/** Send the admin through a fresh Microsoft sign-in, then back to this request's messages. */
function startReauth(secureId: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("tab", "messages");
  sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, url.pathname + url.search);
  sessionStorage.setItem(REVEAL_PENDING_KEY, secureId);
  const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
  const baseUrl = rawBaseUrl.endsWith("/") ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
  window.location.href = `${baseUrl}/api/auth/microsoft/login?reauth=1`;
}

// ─── Admin: ask for account details ──────────────────────────────────────────

interface RequestAccountDetailsDialogProps {
  requestId: string;
  requesterLabel?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => Promise<unknown>;
}

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
  const [mayNeed2fa, setMayNeed2fa] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setPurpose("");
      setFields(DEFAULT_FIELDS);
      setNewField("");
      setTtlHours(48);
      setNotifyEmail(true);
      setMayNeed2fa(false);
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
        may_need_2fa: mayNeed2fa,
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

          <div className="flex items-start gap-2 rounded-md border border-slate-200 dark:border-zinc-700 p-2.5">
            <Checkbox
              id="secure-2fa"
              checked={mayNeed2fa}
              onCheckedChange={(c) => setMayNeed2fa(Boolean(c))}
              className="mt-0.5"
            />
            <label htmlFor="secure-2fa" className="text-xs cursor-pointer">
              <span className="font-medium text-slate-700 dark:text-zinc-300">
                This account may ask for a verification code (2FA)
              </span>
              <span className="block text-[11px] text-slate-400">
                The requester is told you'll contact them on Teams when you sign in, so they can approve the sign-in or
                complete that step. Codes are never collected in the portal.
              </span>
            </label>
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

// ─── Requester: submit the details ───────────────────────────────────────────

interface SubmitSecureInfoDialogProps {
  requestId: string;
  summary: SecureInfoRequestSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted: () => Promise<unknown>;
}

const SubmitSecureInfoDialog: React.FC<SubmitSecureInfoDialogProps> = ({
  requestId,
  summary,
  open,
  onOpenChange,
  onSubmitted,
}) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  // Never keep typed values around once the dialog closes.
  useEffect(() => {
    if (!open) {
      setValues({});
      setShown({});
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
      await submitSecureInfo(requestId, summary.id, values);
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

          <p className="text-[11px] text-slate-400">
            {summary.may_need_2fa
              ? `This account may ask for a verification code. ${summary.requested_by_name || "The admin"} will contact you on Teams when they sign in. Don't enter codes here.`
              : "If the service sends a verification code, don't share it here. Complete that step yourself when the admin signs in."}
          </p>

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

// ─── The card shown in the thread ────────────────────────────────────────────

interface SecureInfoRequestCardProps {
  requestId: string;
  summary: SecureInfoRequestSummary;
  refetch: () => Promise<unknown>;
}

export const SecureInfoRequestCard: React.FC<SecureInfoRequestCardProps> = ({ requestId, summary, refetch }) => {
  const { user } = useAuth();
  const [submitOpen, setSubmitOpen] = useState(false);
  const [revealed, setRevealed] = useState<SecureInfoReveal | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [busy, setBusy] = useState<"reveal" | "delete" | null>(null);
  const [justReauthed, setJustReauthed] = useState(false);
  const timerRef = useRef<number | null>(null);

  const hide = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    setRevealed(null);
    setSecondsLeft(0);
  };

  // Clear revealed values on unmount, and when the tab is hidden.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) hide();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      hide();
    };
  }, []);

  // Back from the re-sign-in for this card: prompt to reveal (doesn't auto-reveal, which would use a view).
  useEffect(() => {
    if (sessionStorage.getItem(REVEAL_PENDING_KEY) === summary.id) {
      sessionStorage.removeItem(REVEAL_PENDING_KEY);
      if (summary.can_reveal) setJustReauthed(true);
    }
  }, [summary.id, summary.can_reveal]);

  const handleReveal = async () => {
    setBusy("reveal");
    setJustReauthed(false);
    try {
      const data = await revealSecureInfo(requestId, summary.id);
      setRevealed(data);
      setSecondsLeft(data.hide_after_seconds);
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            hide();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
      // Refresh the card's status (views left / deleted) without touching the revealed values.
      void refetch();
    } catch (err) {
      if (getApiErrorCode(err) === "REAUTH_REQUIRED") {
        toast.info("Please sign in again to view these details.");
        startReauth(summary.id);
        return;
      }
      toast.error(errorMessage(err, "Could not load the details."));
      void refetch();
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    const pending = summary.status === "PENDING";
    const ok = window.confirm(
      pending
        ? "Cancel this request? The requester won't be able to submit details."
        : "Delete these account details now? This can't be undone.",
    );
    if (!ok) return;
    setBusy("delete");
    try {
      await deleteSecureInfo(requestId, summary.id);
      hide();
      toast.success(pending ? "Request cancelled." : "Account details deleted.");
      await refetch();
    } catch (err) {
      toast.error(errorMessage(err, "Could not delete."));
    } finally {
      setBusy(null);
    }
  };

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Couldn't copy. Please select and copy it manually.");
    }
  };

  const expiresIn = formatDistanceToNow(new Date(summary.expires_at), { addSuffix: true });
  const requestedBy = summary.requested_by_name || "Assigned admin";

  const statusLine = (() => {
    switch (summary.status) {
      case "PENDING":
        return { icon: <Clock className="h-3.5 w-3.5" />, text: `Waiting for the requester · expires ${expiresIn}`, tone: "text-amber-700 dark:text-amber-300" };
      case "SUBMITTED":
        return {
          icon: <ShieldCheck className="h-3.5 w-3.5" />,
          text: `Available to ${requestedBy} · deleted automatically ${expiresIn}`,
          tone: "text-emerald-700 dark:text-emerald-300",
        };
      case "EXPIRED":
        return { icon: <Clock className="h-3.5 w-3.5" />, text: "Request expired. Any submitted details were deleted.", tone: "text-slate-500" };
      case "CANCELLED":
        return { icon: <Ban className="h-3.5 w-3.5" />, text: "Request cancelled.", tone: "text-slate-500" };
      default:
        return { icon: <Trash2 className="h-3.5 w-3.5" />, text: "Account details deleted.", tone: "text-slate-500" };
    }
  })();

  const title = summary.status === "SUBMITTED" ? "Account details submitted" : "Account access requested";

  // 2FA: the code is handled live on Teams between the admin who asked and the requester.
  const isOpen = summary.status === "PENDING" || summary.status === "SUBMITTED";
  const viewerIsAdmin = Boolean(user?.id && user.id === summary.requested_by_id);
  const viewerIsRequester = Boolean(user?.id && user.id === summary.requested_from_id);
  const requesterName = summary.requested_from_name || "the requester";
  const otherEmail = viewerIsAdmin ? summary.requested_from_email : viewerIsRequester ? summary.requested_by_email : null;
  const teamsMessage = viewerIsAdmin
    ? `Hi, I'm signing in to the account for Request #${requestId} (${summary.purpose}). It may ask for a verification code. Let me know when you're free to approve it.`
    : `Hi, about Request #${requestId} (${summary.purpose}): I'm ready for the verification step whenever you sign in.`;
  const twoFaNote = viewerIsAdmin
    ? `This account may ask for a verification code. Contact ${requesterName} on Teams when you sign in so they can approve it or complete that step live.`
    : viewerIsRequester
    ? `This account may ask for a verification code. When ${requestedBy} signs in, they'll contact you on Teams so you can approve the sign-in or complete that step. Don't enter codes in the portal, and don't send them by email or chat.`
    : "This account may ask for a verification code. It's handled on Teams between the admin and the requester.";

  return (
    <div className="mt-2 ml-12 rounded-lg border border-violet-200 dark:border-violet-900/50 bg-violet-50/50 dark:bg-violet-950/20 p-3.5 space-y-2.5">
      <div className="flex items-start gap-2.5">
        <div className="p-1.5 rounded-md bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 shrink-0">
          <Lock className="h-4 w-4" />
        </div>
        <div className="min-w-0 text-xs space-y-0.5">
          <div className="text-sm font-semibold text-slate-900 dark:text-zinc-100">{title}</div>
          <div className="text-slate-600 dark:text-zinc-400">
            <span className="font-medium">Purpose:</span> {summary.purpose}
          </div>
          <div className="text-slate-600 dark:text-zinc-400">
            <span className="font-medium">Requested by:</span> {requestedBy}
            <span className="mx-1">·</span>
            <span className="font-medium">Details:</span> {summary.fields.join(", ")}
          </div>
          <div className={`flex items-center gap-1 pt-0.5 ${statusLine.tone}`}>
            {statusLine.icon}
            <span>{statusLine.text}</span>
          </div>
        </div>
      </div>

      {revealed && (
        <div className="rounded-md border border-violet-200 dark:border-violet-900/60 bg-white dark:bg-zinc-900 p-3 space-y-2">
          {revealed.fields.map((f) => (
            <div key={f.label} className="flex items-center gap-2 text-sm">
              <span className="w-28 shrink-0 text-xs text-slate-500">{f.label}</span>
              <code className="flex-1 min-w-0 break-all rounded bg-slate-100 dark:bg-zinc-800 px-2 py-1 text-xs">
                {f.value}
              </code>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Copy ${f.label}`}
                onClick={() => copy(f.label, f.value)}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>
              Hiding in {secondsLeft}s ·{" "}
              {revealed.reveals_remaining > 0
                ? `${revealed.reveals_remaining} view${revealed.reveals_remaining === 1 ? "" : "s"} left`
                : "That was the last view; the details have been deleted"}
            </span>
            <Button type="button" variant="ghost" size="sm" className="h-6 text-[11px] gap-1" onClick={hide}>
              <EyeOff className="h-3 w-3" /> Hide now
            </Button>
          </div>
        </div>
      )}

      {summary.may_need_2fa && isOpen && (
        <div className="rounded-md border border-sky-200 dark:border-sky-900/60 bg-sky-50/70 dark:bg-sky-950/30 p-2.5 space-y-2">
          <div className="flex items-start gap-2 text-xs text-sky-900 dark:text-sky-200">
            <Smartphone className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>{twoFaNote}</span>
          </div>
          {otherEmail && (
            <div className="flex flex-wrap gap-2 pl-5">
              <Button asChild size="sm" variant="outline" className="h-7 text-xs gap-1.5">
                <a href={teamsChatUrl(otherEmail, teamsMessage)} target="_blank" rel="noopener noreferrer">
                  <MessageSquare className="h-3 w-3" /> Message {viewerIsAdmin ? requesterName : requestedBy} on Teams
                </a>
              </Button>
            </div>
          )}
        </div>
      )}

      {justReauthed && !revealed && (
        <div className="text-[11px] text-violet-700 dark:text-violet-300">
          You're signed in again. Click Reveal credentials to view the details.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {summary.can_submit && (
          <Button
            size="sm"
            onClick={() => setSubmitOpen(true)}
            className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <ShieldCheck className="h-3.5 w-3.5" /> Submit account details securely
          </Button>
        )}
        {summary.can_reveal && !revealed && (
          <Button
            size="sm"
            onClick={handleReveal}
            disabled={busy !== null}
            className="h-8 text-xs gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
          >
            <KeyRound className="h-3.5 w-3.5" />
            {busy === "reveal" ? "Loading..." : "Reveal credentials"}
            <span className="opacity-80">
              ({summary.reveals_remaining} view{summary.reveals_remaining === 1 ? "" : "s"} left)
            </span>
          </Button>
        )}
        {summary.can_delete && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleDelete}
            disabled={busy !== null}
            className="h-8 text-xs gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {summary.status === "PENDING" ? "Cancel request" : "Done – delete details"}
          </Button>
        )}
      </div>

      {summary.can_submit && (
        <SubmitSecureInfoDialog
          requestId={requestId}
          summary={summary}
          open={submitOpen}
          onOpenChange={setSubmitOpen}
          onSubmitted={refetch}
        />
      )}
    </div>
  );
};
