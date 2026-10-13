import { useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** FastAPI sends a string, or a list of {msg, loc} for validation (422) errors. */
function errorMessage(detail: unknown, status: number): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    return detail.map((d) => String(d?.msg ?? d).replace(/^Value error, /, "")).join("; ");
  }
  return `Request failed (${status})`;
}

/**
 * fetch() against the backend with the admin token. A 401 signs you out, which
 * makes AdminGuard send you to the login page (and back here afterwards).
 */
export function useAdminApi() {
  const { getToken, signOut } = useAuth();

  return useCallback(
    async <T>(path: string, init: RequestInit = {}): Promise<T> => {
      const token = await getToken();
      const res = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(init.headers as Record<string, string>),
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401) {
        signOut();
        throw new ApiError(401, "Your session expired. Please sign in again.");
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new ApiError(res.status, errorMessage(data.detail, res.status));
      }
      return (res.status === 204 ? undefined : await res.json()) as T;
    },
    [getToken, signOut],
  );
}
