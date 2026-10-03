import config from "@/lib/config";

export interface ApiFetchOptions extends RequestInit {
  skipAuth?: boolean;
}

/**
 * Check if a JWT token string has expired based on its 'exp' claim.
 */
export function isJwtExpired(token: string): boolean {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false; // If non-standard token, defer to server validation
    const payload = JSON.parse(atob(parts[1]!));
    if (payload && typeof payload.exp === "number") {
      // Buffer of 10 seconds to handle clock drift
      return Date.now() >= (payload.exp - 10) * 1000;
    }
  } catch {
    // If parsing fails, don't fail client-side; let server validate
  }
  return false;
}

/**
 * Clear local authentication session
 */
export function clearAuthSession(): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("archivum_token");
      localStorage.removeItem("archivum_user");
    } catch {
      // ignore
    }
  }
}

/**
 * Centralized API Fetch Client with Automatic Bearer Token Authorization,
 * JWT Expiration Checking, and 401/403 Interception.
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { skipAuth = false, headers: customHeaders, ...customConfig } = options;

  let url = endpoint;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    const base = config.apiUrl.endsWith("/") ? config.apiUrl.slice(0, -1) : config.apiUrl;
    const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    url = `${base}${path}`;
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(customConfig.body && !(customConfig.body instanceof FormData)
      ? { "Content-Type": "application/json" }
      : {}),
    ...(customHeaders as Record<string, string>),
  };

  if (!skipAuth && typeof window !== "undefined") {
    const token = localStorage.getItem("archivum_token");
    if (token) {
      if (isJwtExpired(token)) {
        clearAuthSession();
        const currentPath = window.location.pathname + window.location.search;
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
        }
        throw new Error("Session expired. Please sign in again.");
      }
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(url, {
      ...customConfig,
      headers,
    });

    // 401 Unauthorized or 403 Forbidden interceptor
    if (response.status === 401 || response.status === 403) {
      clearAuthSession();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        const currentPath = window.location.pathname + window.location.search;
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      }
      throw new Error(`Authentication required (${response.status})`);
    }

    if (!response.ok) {
      let errorDetail = `Request failed with status ${response.status}`;
      try {
        const errorJson = await response.json();
        if (typeof errorJson.detail === "string") {
          errorDetail = errorJson.detail;
        } else if (Array.isArray(errorJson.detail)) {
          errorDetail = errorJson.detail
            .map((item: any) => (typeof item === "string" ? item : item.msg || item.message))
            .filter(Boolean)
            .join("; ");
        } else if (errorJson.message) {
          errorDetail = errorJson.message;
        }
      } catch {
        // use status text fallback
      }
      throw new Error(errorDetail);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }
    return (await response.text()) as unknown as T;
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error("Unable to connect to backend server.");
  }
}
