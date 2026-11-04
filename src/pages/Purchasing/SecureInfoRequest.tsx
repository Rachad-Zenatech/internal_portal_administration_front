// Secure info requests: an admin asks the requester for account details (e.g. a subscription login).
// Values never appear in the thread. They're typed into a dedicated form, encrypted by the backend,
// and only the requesting admin can reveal them (after a recent sign-in), for a few seconds at a time.
import { Lock, ShieldCheck, EyeOff, Copy, Trash2, KeyRound, Send, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubmitSecureInfoDialog } from "./secureInfoRequest/components/SubmitSecureInfoDialog";
import { SendCodeDialog } from "./secureInfoRequest/components/SendCodeDialog";
import type { SecureInfoRequestCardProps } from "./secureInfoRequest/types";
import { useSecureInfoRequest } from "./secureInfoRequest/hooks/useSecureInfoRequest";

export const SecureInfoRequestCard: React.FC<SecureInfoRequestCardProps> = (props) => {
  const s = useSecureInfoRequest(props);
  const { refetch, setSendCodeOpen, sendCodeOpen, summary, requestId, setSubmitOpen, submitOpen, busy, handleDelete, codeState, handleRequestCode, handleRevealCode, revealedCode, handleReveal, revealed, justReauthed, codeNote, codeNoteUrgent, hideCode, codeSecondsLeft, copy, hide, secondsLeft, statusLine, requestedBy, title } = s;
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

      {revealedCode && (
        <div className="rounded-md border border-violet-200 dark:border-violet-900/60 bg-white dark:bg-zinc-900 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 w-28 shrink-0">Verification code</span>
            <code className="flex-1 rounded bg-slate-100 dark:bg-zinc-800 px-3 py-1.5 text-lg font-mono tracking-widest text-center">
              {revealedCode.code}
            </code>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Copy code"
              onClick={() => copy("Code", revealedCode.code)}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Hiding in {codeSecondsLeft}s · this code has been deleted from the portal</span>
            <Button type="button" variant="ghost" size="sm" className="h-6 text-[11px] gap-1" onClick={hideCode}>
              <EyeOff className="h-3 w-3" /> Hide now
            </Button>
          </div>
        </div>
      )}

      {codeNote && !revealedCode && (
        <div
          className={`flex items-start gap-2 rounded-md border p-2.5 text-xs ${
            codeNoteUrgent
              ? "border-violet-300 bg-violet-100/70 text-violet-900 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-200"
              : "border-sky-200 bg-sky-50/70 text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-200"
          }`}
        >
          <Smartphone className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>{codeNote}</span>
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
        {summary.can_send_code && (
          <Button
            size="sm"
            onClick={() => setSendCodeOpen(true)}
            className="h-8 text-xs gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
          >
            <Smartphone className="h-3.5 w-3.5" /> Send verification code securely
          </Button>
        )}
        {summary.can_reveal_code && !revealedCode && (
          <Button
            size="sm"
            onClick={handleRevealCode}
            disabled={busy !== null}
            className="h-8 text-xs gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
          >
            <KeyRound className="h-3.5 w-3.5" />
            {busy === "code" ? "Loading..." : "Reveal code"}
            <span className="opacity-80">(1 view)</span>
          </Button>
        )}
        {summary.can_request_code && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleRequestCode}
            disabled={busy !== null}
            className="h-8 text-xs gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            {busy === "code"
              ? "Sending..."
              : codeState === "REQUESTED"
              ? "Ask for the code again"
              : "I'm signing in – send me the code"}
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
      {summary.can_send_code && (
        <SendCodeDialog
          requestId={requestId}
          summary={summary}
          open={sendCodeOpen}
          onOpenChange={setSendCodeOpen}
          onSent={refetch}
        />
      )}
    </div>
  );
};

export { looksLikeCredential } from "./secureInfoRequest/utils";
export { RequestAccountDetailsDialog } from "./secureInfoRequest/components/RequestAccountDetailsDialog";
