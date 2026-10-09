export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
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
    throw new ApiError((err as { detail: string }).detail || "Request failed", res.status);
  }
  if (res.status === 204) return null as unknown as T;
  return res.json() as Promise<T>;
}
