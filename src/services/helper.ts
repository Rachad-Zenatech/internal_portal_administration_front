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
  // Only say "your session has expired" if this tab was actually signed in. Someone opening
  // a link (e.g. from an email) while signed out just needs to sign in.
  const wasSignedIn = Boolean(sessionStorage.getItem("token"));
  sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, window.location.pathname + window.location.search);
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
  sessionStorage.removeItem("ms_id_token");
  window.location.assign(wasSignedIn ? `/login?reason=${SESSION_EXPIRED_REASON}` : "/login");
}

export async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    handleUnauthorized(res);
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    let detail = (err as { detail?: unknown }).detail;
    let code: string | undefined;
    if (detail && typeof detail === "object" && !Array.isArray(detail)) {
      const parsed = detail as { code?: string; message?: string };
      code = parsed.code;
      detail = parsed.message;
    } else if (Array.isArray(detail)) {
      detail = detail
        .map((d: any) => {
          if (typeof d === "string") return d;
          if (d && typeof d === "object") {
            const loc = Array.isArray(d.loc) ? d.loc.filter((part: any) => part !== "body").join(".") : "";
            return loc ? `${loc}: ${d.msg || JSON.stringify(d)}` : d.msg || JSON.stringify(d);
          }
          return String(d);
        })
        .join("; ");
    }
    let msg = typeof detail === "string" ? detail : "Request failed";

    // Clean up internal technical action error patterns into user-friendly messages without exposing internal structures
    if (msg.startsWith("Action ") && msg.includes(" not allowed")) {
      const actionName = msg.replace("Action ", "").replace(" not allowed", "").trim();
      const actionLabels: Record<string, string> = {
        RECORD_INVOICE: "record a payment or invoice",
        APPROVE: "approve",
        REJECT: "reject",
        START_REVIEW: "review",
        CREATE_PO: "create a purchase order",
        MARK_PURCHASED: "mark as purchased",
        ADD_TRACKING: "add tracking details",
        MARK_SHIPPED: "mark as shipped",
        CONFIRM_GOODS_RECEIVED: "confirm receipt of goods",
        COMPLETE: "complete",
        PUT_ON_HOLD: "place on hold",
        RESUME_WORKFLOW: "resume",
        SUBMIT_REQUEST: "submit",
        DELETE_REQUEST: "delete",
      };
      const friendlyAction = actionLabels[actionName] || "perform this action";
      msg = `You do not have permission to ${friendlyAction} for this request at this stage.`;
    }

    throw new ApiError(msg, res.status, code);
  }
  if (res.status === 204) return null as unknown as T;
  // CloudFront replaces API 403/404 responses with the SPA's index.html (as 200 OK).
  // The API never returns HTML, so treat it as "not found or no access" instead of a JSON parse error.
  if ((res.headers.get("content-type") || "").includes("text/html")) {
    throw new ApiError(
      "This item doesn't exist, was deleted, or you don't have access to it.",
      404,
      "NOT_FOUND_OR_NO_ACCESS",
    );
  }
  return res.json() as Promise<T>;
}
