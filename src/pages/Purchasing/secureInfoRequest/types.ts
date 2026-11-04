import type { SecureInfoRequestSummary } from "@/types/purchasing";

// ─── Admin: ask for account details ──────────────────────────────────────────

export interface RequestAccountDetailsDialogProps {
  requestId: string;
  requesterLabel?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => Promise<unknown>;
}

// ─── Requester: submit the details ───────────────────────────────────────────

export interface SubmitSecureInfoDialogProps {
  requestId: string;
  summary: SecureInfoRequestSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted: () => Promise<unknown>;
}

// ─── Requester: send the 2FA code ────────────────────────────────────────────

export interface SendCodeDialogProps {
  requestId: string;
  summary: SecureInfoRequestSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSent: () => Promise<unknown>;
}

// ─── The card shown in the thread ────────────────────────────────────────────

export interface SecureInfoRequestCardProps {
  requestId: string;
  summary: SecureInfoRequestSummary;
  refetch: () => Promise<unknown>;
}
