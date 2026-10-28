export class ApiError extends Error {
  status: number;
  /** Machine-readable code when the backend sends detail as {code, message}, e.g. "REAUTH_REQUIRED". */
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export function getApiErrorCode(error: unknown): string | undefined {
  return error instanceof ApiError ? error.code : undefined;
}

export function getApiErrorStatus(error: unknown): number | undefined {
  return error instanceof ApiError ? error.status : undefined;
}

export const POST_LOGIN_REDIRECT_KEY = "postLoginRedirect";
export const SESSION_EXPIRED_REASON = "session_expired";

let sessionExpiryHandled = false;

export function handleUnauthorized(res: Response): void {
  if (res.status !== 401 || sessionExpiryHandled) return;
  if (/\/api\/auth\//.test(res.url)) return;
  if (window.location.pathname.startsWith("/login")) return;

  sessionExpiryHandled = true;
  sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, window.location.pathname + window.location.search);
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
  sessionStorage.removeItem("ms_id_token");
  window.location.assign(`/login?reason=${SESSION_EXPIRED_REASON}`);
}

export async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    handleUnauthorized(res);
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const detail = (err as { detail?: unknown }).detail;
    if (detail && typeof detail === "object" && !Array.isArray(detail)) {
      const { code, message } = detail as { code?: string; message?: string };
      throw new ApiError(message || "Request failed", res.status, code);
    }
    throw new ApiError((detail as string) || "Request failed", res.status);
  }
  if (res.status === 204) return null as unknown as T;
  return res.json() as Promise<T>;
}
