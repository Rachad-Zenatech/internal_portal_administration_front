export const REVEAL_PENDING_KEY = "secureRevealPending";

export const DEFAULT_FIELDS = ["Username", "Password"];

export const TTL_OPTIONS = [
  { hours: 24, label: "24 hours" },
  { hours: 48, label: "48 hours" },
  { hours: 72, label: "3 days" },
  { hours: 168, label: "7 days" },
];

// Mirrors the backend rule: don't collect one-time codes or recovery codes.
export const FORBIDDEN_FIELD_RE =
  /\b(otp|one[\s-]?time|recovery|backup\s*codes?|2fa|mfa|verification\s*code|security\s*code|authenticator|sms\s*code)\b/i;

export const SECRET_FIELD_RE = /pass|secret|pin|token|key/i;

// While a code is being requested or waiting to be viewed, refresh the card this often.
export const CODE_REFRESH_MS = 10_000;
