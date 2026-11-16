import { getStoredToken } from "./auth";
import type { ApiErrorBody } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export class ApiError extends Error {
  status: number;
  body?: ApiErrorBody;
  validationErrors?: Record<string, string>;
  constructor(status: number, message: string, body?: ApiErrorBody) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    this.validationErrors = body?.validationErrors;
  }
}

type Options = RequestInit & { auth?: boolean };

export async function apiFetch<T>(path: string, options: Options = {}): Promise<T> {
  const { auth = true, headers, ...rest } = options;
  const token = getStoredToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token && auth ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  let data: any = undefined;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const body = (data && typeof data === "object" ? data : undefined) as ApiErrorBody | undefined;
    const message = body?.message || res.statusText || "Request failed";
    throw new ApiError(res.status, message, body);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, auth = true) => apiFetch<T>(path, { method: "GET", auth }),
  post: <T>(path: string, body?: unknown, auth = true) => apiFetch<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body), auth }),
  patch: <T>(path: string, body?: unknown, auth = true) => apiFetch<T>(path, { method: "PATCH", body: body === undefined ? undefined : JSON.stringify(body), auth }),
  del: <T>(path: string, auth = true) => apiFetch<T>(path, { method: "DELETE", auth }),
};
