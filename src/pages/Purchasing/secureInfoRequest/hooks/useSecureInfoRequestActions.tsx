import { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ShieldCheck, Trash2, Clock, Ban } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { deleteSecureInfo, requestSecureCode, revealSecureCode, revealSecureInfo } from "@/services/purchasingService";
import { getApiErrorCode } from "@/services/helper";
import type { SecureCodeReveal, SecureInfoReveal } from "@/types/purchasing";
import { REVEAL_PENDING_KEY, CODE_REFRESH_MS } from "../constants";
import { errorMessage, startReauth } from "../utils";

export function useSecureInfoRequestActions(props) {
  const { requestId, summary, refetch } = props;
  const { user } = useAuth();
  const [submitOpen, setSubmitOpen] = useState(false);
  const [revealed, setRevealed] = useState<SecureInfoReveal | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [busy, setBusy] = useState<"reveal" | "delete" | "code" | null>(null);
  const [justReauthed, setJustReauthed] = useState(false);
  const [sendCodeOpen, setSendCodeOpen] = useState(false);
  const [revealedCode, setRevealedCode] = useState<SecureCodeReveal | null>(null);
  const [codeSecondsLeft, setCodeSecondsLeft] = useState(0);
  const timerRef = useRef<number | null>(null);
  const codeTimerRef = useRef<number | null>(null);
  const hide = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    setRevealed(null);
    setSecondsLeft(0);
  };
  const hideCode = () => {
    if (codeTimerRef.current) window.clearInterval(codeTimerRef.current);
    codeTimerRef.current = null;
    setRevealedCode(null);
    setCodeSecondsLeft(0);
  };
  // Clear revealed values on unmount, and when the tab is hidden.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        hide();
        hideCode();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      hide();
      hideCode();
    };
  }, []);
  // While a code is on its way (or waiting to be viewed), keep the card current for the two people involved,
  // so the admin sees "Reveal code" and the requester sees "Send code" without reloading. Stops on its own.
  const viewerIsAdmin = Boolean(user?.id && user.id === summary.requested_by_id);
  const viewerIsRequester = Boolean(user?.id && user.id === summary.requested_from_id);
  const codeInFlight = summary.code_state === "REQUESTED" || summary.code_state === "SENT";
  useEffect(() => {
    if (!codeInFlight || !(viewerIsAdmin || viewerIsRequester)) return;
    const id = window.setInterval(() => {
      if (!document.hidden) void refetch();
    }, CODE_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [codeInFlight, viewerIsAdmin, viewerIsRequester, refetch]);
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
  const handleRequestCode = async () => {
    setBusy("code");
    try {
      await requestSecureCode(requestId, summary.id);
      toast.success(`${summary.requested_from_name || "The requester"} has been emailed to send the code.`);
      await refetch();
    } catch (err) {
      toast.error(errorMessage(err, "Could not ask for the code."));
    } finally {
      setBusy(null);
    }
  };
  const handleRevealCode = async () => {
    setBusy("code");
    try {
      const data = await revealSecureCode(requestId, summary.id);
      setRevealedCode(data);
      setCodeSecondsLeft(data.hide_after_seconds);
      if (codeTimerRef.current) window.clearInterval(codeTimerRef.current);
      codeTimerRef.current = window.setInterval(() => {
        setCodeSecondsLeft((s) => {
          if (s <= 1) {
            hideCode();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
      void refetch();
    } catch (err) {
      if (getApiErrorCode(err) === "REAUTH_REQUIRED") {
        toast.info("Please sign in again to view the code.");
        startReauth(summary.id);
        return;
      }
      toast.error(errorMessage(err, "Could not load the code."));
      void refetch();
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
  // 2FA verification code: admin asks while signing in, requester sends it through the vault.
  const requesterName = summary.requested_from_name || "the requester";
  const codeState = summary.code_state || "NONE";
  const codeExpiresIn = summary.code_expires_at
    ? formatDistanceToNow(new Date(summary.code_expires_at), { addSuffix: true })
    : null;
  const codeNote = (() => {
    if (summary.status === "PENDING") {
      return summary.may_need_2fa && viewerIsRequester
        ? `This account may need a verification code. When ${requestedBy} signs in, you'll get an email asking for it.`
        : null;
    }
    if (summary.status !== "SUBMITTED") return null;
    if (viewerIsAdmin) {
      if (codeState === "REQUESTED") return `Waiting for ${requesterName} to send the code. They've been emailed.`;
      if (codeState === "SENT") return `${requesterName} sent the code. You can view it once; it's deleted ${codeExpiresIn}.`;
      return summary.may_need_2fa
        ? `This account may ask for a verification code. When you sign in, ask ${requesterName} for it here.`
        : null;
    }
    if (viewerIsRequester) {
      if (codeState === "REQUESTED") return `${requestedBy} is signing in now and needs the verification code. Send it here when it arrives.`;
      if (codeState === "SENT") return `Code sent. ${requestedBy} can view it once.`;
      return summary.may_need_2fa
        ? `When ${requestedBy} signs in, you'll get an email asking for the verification code. Only ever send it from this request.`
        : null;
    }
    return summary.may_need_2fa ? "This account may need a verification code; it's sent through the vault." : null;
  })();
  const codeNoteUrgent = (viewerIsRequester && codeState === "REQUESTED") || (viewerIsAdmin && codeState === "SENT");
  return { submitOpen, setSubmitOpen, revealed, secondsLeft, busy, justReauthed, sendCodeOpen, setSendCodeOpen, revealedCode, codeSecondsLeft, hide, hideCode, handleReveal, handleDelete, handleRequestCode, handleRevealCode, copy, requestedBy, statusLine, title, codeState, codeNote, codeNoteUrgent };
}
