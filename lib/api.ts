import "server-only";

const API_URL = (process.env.API_URL ?? "http://127.0.0.1:8080").replace(/\/+$/, "");
const CLIENT_KEY = process.env.API_CLIENT_KEY ?? "";

/** An error returned by the PHP API, with its HTTP status and machine-readable code. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields: Record<string, string> = {},
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "ApiError";
  }
}

type ApiRequest = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** A JSON-serialisable value, or FormData for file uploads (sent as multipart/form-data). */
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  /** The logged-in user's API token (from the HttpOnly cookie). */
  token?: string;
  /** The visitor's IP address, so the API can rate-limit per visitor. */
  clientIp?: string;
  timeoutMs?: number;
};

type ErrorPayload = {
  error?: { code?: string; message?: string; fields?: Record<string, string> };
};

/**
 * Call the PHP API from the server (never from the browser).
 * Returns the full `{ data, meta }` payload or throws an ApiError.
 */
export async function apiWithMeta<T, M = Record<string, unknown>>(
  path: string,
  { method = "GET", body, query, token, clientIp, timeoutMs = 10_000 }: ApiRequest = {},
): Promise<{ data: T; meta: M }> {
  const headers = new Headers({ Accept: "application/json", "X-Client-Key": CLIENT_KEY });
  const multipart = body instanceof FormData;
  if (body !== undefined && !multipart) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (clientIp) headers.set("X-Client-IP", clientIp);

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) search.set(key, String(value));
  }
  const url = `${API_URL}${path}${search.size > 0 ? `?${search}` : ""}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : multipart ? body : JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (cause) {
    throw new ApiError(503, "api_unreachable", `The PK Apparel API (${API_URL}) could not be reached.`, {}, { cause });
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = (payload as ErrorPayload | null)?.error;
    throw new ApiError(
      response.status,
      error?.code ?? "api_error",
      error?.message ?? `The API answered with status ${response.status}.`,
      error?.fields,
    );
  }

  const { data, meta } = (payload ?? {}) as { data: T; meta?: M };
  return { data, meta: meta ?? ({} as M) };
}

/** Like apiWithMeta, but returns only the `data` part. */
export async function api<T>(path: string, request: ApiRequest = {}): Promise<T> {
  return (await apiWithMeta<T>(path, request)).data;
}
