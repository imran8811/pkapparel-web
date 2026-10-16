import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { apiWithMeta, ApiError } from "@/lib/api";
import type { Staff } from "@/lib/admin/types";

/*
 * Admin data access layer. The API token lives in an HttpOnly cookie that is only
 * sent to /admin pages. Every admin page and server action goes through adminApi(),
 * which adds the token; the API checks it (and the staff member's role) on every call.
 */

export const ADMIN_COOKIE = "pk_admin";

/** Where a stale cookie is cleared before going back to the login page. */
const SESSION_ENDED = "/admin/session-ended";

type AdminRequest = Omit<NonNullable<Parameters<typeof apiWithMeta>[1]>, "token">;

export async function adminToken(): Promise<string> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) redirect("/admin/login");
  return token;
}

/** Calls the admin API as the logged-in staff member. A rejected login sends them to the login page. */
export async function adminApiWithMeta<T, M = Record<string, unknown>>(
  path: string,
  request: AdminRequest = {},
): Promise<{ data: T; meta: M }> {
  const token = await adminToken();
  try {
    return await apiWithMeta<T, M>(path, { ...request, token });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect(SESSION_ENDED);
    throw error;
  }
}

export async function adminApi<T>(path: string, request: AdminRequest = {}): Promise<T> {
  return (await adminApiWithMeta<T>(path, request)).data;
}

/** The logged-in staff member (looked up once per request). */
export const getStaff = cache(async (): Promise<Staff> => adminApi<Staff>("/v1/admin/auth/me"));
