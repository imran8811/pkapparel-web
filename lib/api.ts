import "server-only";

// The live API unless API_URL says otherwise (locally: http://127.0.0.1:8080 in .env.local).
const API_URL = (process.env.API_URL || "https://api.pkapparel.com").replace(/\/+$/, "");
const CLIENT_KEY = secret(process.env.API_CLIENT_KEY);

/**
 * A secret from the environment, without the spaces or quotes a copy-paste can add (the API reads its .env the same
 * way), so the two sides compare equal.
 */
export function secret(value: string | undefined): string {
  const trimmed = (value ?? "").trim();
  return /^(["']).*\1$/.test(trimmed) && trimmed.length >= 2 ? trimmed.slice(1, -1) : trimmed;
}

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
  /** Extra headers, e.g. X-Cart-Token for a guest's cart. */
  headers?: Record<string, string>;
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
  request: ApiRequest = {},
): Promise<{ data: T; meta: M }> {
  const response = await send(path, request);

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) throw toApiError(response, payload);

  const { data, meta } = (payload ?? {}) as { data: T; meta?: M };
  return { data, meta: meta ?? ({} as M) };
}

/** Downloads a file from the API (e.g. a proforma invoice PDF). Errors are thrown like api(). */
export async function apiFile(path: string, request: ApiRequest = {}): Promise<{ body: ArrayBuffer; contentType: string; filename: string }> {
  const response = await send(path, { timeoutMs: 30_000, ...request });
  if (!response.ok) throw toApiError(response, await response.json().catch(() => null));

  const disposition = response.headers.get("content-disposition") ?? "";
  return {
    body: await response.arrayBuffer(),
    contentType: response.headers.get("content-type") ?? "application/octet-stream",
    filename: /filename="([^"]+)"/.exec(disposition)?.[1] ?? "download",
  };
}

async function send(path: string, { method = "GET", body, query, token, clientIp, headers: extra, timeoutMs = 10_000 }: ApiRequest): Promise<Response> {
  const headers = new Headers({ Accept: "application/json", "X-Client-Key": CLIENT_KEY, ...extra });
  const multipart = body instanceof FormData;
  if (body !== undefined && !multipart) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (clientIp) headers.set("X-Client-IP", clientIp);

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) search.set(key, String(value));
  }
  const url = `${API_URL}${path}${search.size > 0 ? `?${search}` : ""}`;

  try {
    return await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : multipart ? body : JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (cause) {
    throw new ApiError(503, "api_unreachable", `The PK Apparel API (${API_URL}) could not be reached.`, {}, { cause });
  }
}

function toApiError(response: Response, payload: unknown): ApiError {
  const error = (payload as ErrorPayload | null)?.error;
  return new ApiError(
    response.status,
    error?.code ?? "api_error",
    error?.message ?? `The API answered with status ${response.status}.`,
    error?.fields,
  );
}

/** Like apiWithMeta, but returns only the `data` part. */
export async function api<T>(path: string, request: ApiRequest = {}): Promise<T> {
  return (await apiWithMeta<T>(path, request)).data;
}
