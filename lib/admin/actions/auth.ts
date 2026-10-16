"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { ADMIN_COOKIE, adminApi } from "@/lib/admin/session";
import { errorState, failure, success, text, type FormState } from "@/lib/admin/forms";

/** Only paths inside the admin are allowed as the page to return to after logging in. */
function safeNext(next: string): string {
  return /^\/admin(?:\/[A-Za-z0-9\-/]*)?(?:\?[A-Za-z0-9=&%_\-.]*)?$/.test(next) && !next.startsWith("/admin/login")
    ? next
    : "/admin";
}

export async function login(_previous: FormState, form: FormData): Promise<FormState> {
  const email = text(form, "email");
  const password = form.get("password");
  if (!email || typeof password !== "string" || password === "") {
    return failure("Enter your email and password.");
  }

  const requestHeaders = await headers();
  const clientIp =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip") || undefined;

  let session: { token: string; expires_at: string };
  try {
    session = await api("/v1/admin/auth/login", { method: "POST", body: { email, password }, clientIp });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return failure("The email or password is not correct.");
    if (error instanceof ApiError && error.status === 422) return failure("Enter a valid email address and your password.");
    return errorState(error);
  }

  (await cookies()).set(ADMIN_COOKIE, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    expires: new Date(session.expires_at),
  });
  redirect(safeNext(text(form, "next")));
}

/** Ends the session on the server and removes the cookie. The button then reloads the page (see LogoutButton). */
export async function logout(): Promise<void> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (token) {
    // Ends the session on the server too; the cookie is removed either way.
    await api("/v1/admin/auth/logout", { method: "POST", token }).catch(() => undefined);
  }
  store.delete({ name: ADMIN_COOKIE, path: "/admin" });
}

export async function changePassword(_previous: FormState, form: FormData): Promise<FormState> {
  const current = form.get("current_password");
  const password = form.get("password");
  if (typeof current !== "string" || typeof password !== "string") return failure("Fill in all fields.");
  if (password !== form.get("password_confirmation")) {
    return failure("Please check the highlighted fields.", { password_confirmation: "The two new passwords do not match." });
  }

  try {
    await adminApi("/v1/admin/auth/password", { method: "PUT", body: { current_password: current, password } });
  } catch (error) {
    return errorState(error);
  }
  return success("Password changed. You were logged out on other devices.");
}
