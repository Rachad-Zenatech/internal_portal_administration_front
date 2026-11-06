import { POST_LOGIN_REDIRECT_KEY } from "@/services/helper";
import { REVEAL_PENDING_KEY } from "./constants";

/** True when a regular message looks like it contains a password, so we can suggest the secure form. */
export function looksLikeCredential(text: string): boolean {
  return /\b(pass(word|wd)?|pwd|login|credentials?)\s*[:=]\s*\S+/i.test(text);
}

export function errorMessage(err: unknown, fallback: string): string {
  return (err as Error)?.message || fallback;
}

/** Send the admin through a fresh Microsoft sign-in, then back to this request's messages. */
export function startReauth(secureId: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("tab", "messages");
  sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, url.pathname + url.search);
  sessionStorage.setItem(REVEAL_PENDING_KEY, secureId);
  const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
  const baseUrl = rawBaseUrl.endsWith("/") ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
  window.location.href = `${baseUrl}/api/auth/microsoft/login?reauth=1`;
}
