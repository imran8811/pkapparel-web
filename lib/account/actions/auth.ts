"use server";

import { api, ApiError } from "@/lib/api";
import {
  clientIp,
  customerApi,
  endSession,
  guestCartToken,
  sessionToken,
  setUiState,
  startSession,
} from "@/lib/account/session";
import type { Cart, Customer } from "@/lib/account/types";
import { checked, errorState, failure, success, text, type FormState } from "@/lib/forms";

type Session = { token: string; expires_at: string; customer: Customer };

const MIN_FILL_TIME_MS = 3000;

/** Pages a buyer may be sent to after logging in (no outside links). */
function safeNext(next: string, fallback = "/account"): string {
  return /^\/(?:account|checkout|cart|wholesale-shop)(?:[/?][A-Za-z0-9\-/?=&%_.]*)?$/.test(next) ? next : fallback;
}

/** Stores the session and refreshes the header's display cookie (the guest cart was merged into the account). */
async function begin(session: Session): Promise<void> {
  await startSession(session.token, session.expires_at);
  const cart = await api<Cart>("/v1/cart", { token: session.token }).catch(() => null);
  await setUiState({ signedIn: true, cartCount: cart?.line_count ?? 0 });
}

export async function login(_previous: FormState, form: FormData): Promise<FormState> {
  const email = text(form, "email");
  const password = form.get("password");
  if (!email || typeof password !== "string" || password === "") {
    return failure("Enter your email and password.");
  }

  try {
    const session = await api<Session>("/v1/account/login", {
      method: "POST",
      body: { email, password, cart_token: await guestCartToken() },
      clientIp: await clientIp(),
    });
    await begin(session);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return failure("The email or password is not correct.");
    if (error instanceof ApiError && error.status === 422) return failure("Enter a valid email address and your password.");
    if (error instanceof ApiError && error.status === 429) return failure("Too many attempts. Please wait a few minutes and try again.");
    return errorState(error);
  }

  return { status: "success", redirectTo: safeNext(text(form, "next")) };
}

export async function signup(_previous: FormState, form: FormData): Promise<FormState> {
  // Spam traps: a hidden field only bots fill in, and forms sent faster than a person can type.
  const startedAt = Number(text(form, "started_at"));
  if (!startedAt || Date.now() - startedAt < MIN_FILL_TIME_MS) {
    return failure("Please take a moment to complete the form, then send it again.");
  }
  const password = text(form, "password");
  if (password !== text(form, "password_confirmation")) {
    return failure("Please check the highlighted fields.", { password_confirmation: "The two passwords do not match." });
  }

  try {
    const session = await api<Session>("/v1/account/signup", {
      method: "POST",
      clientIp: await clientIp(),
      body: {
        email: text(form, "email"),
        password,
        company_name: text(form, "company_name"),
        contact_name: text(form, "contact_name"),
        business_type: text(form, "business_type"),
        country_code: text(form, "country_code"),
        phone: text(form, "phone"),
        website: text(form, "website") || null,
        accept_terms: checked(form, "accept_terms"),
        fax_number: text(form, "fax_number"),
        cart_token: await guestCartToken(),
      },
    });
    await begin(session);
  } catch (error) {
    if (error instanceof ApiError && error.status === 429) {
      return failure("Several accounts were opened from your network in a short time. Please try again later, or contact us on WhatsApp.");
    }
    return errorState(error);
  }

  return { status: "success", redirectTo: safeNext(text(form, "next"), "/account?welcome=1") };
}

/** Ends the session on the server and removes the cookies. The button then reloads the page. */
export async function logout(): Promise<void> {
  const token = await sessionToken();
  if (token) {
    await api("/v1/account/logout", { method: "POST", token }).catch(() => undefined);
  }
  await endSession();
}

export async function forgotPassword(_previous: FormState, form: FormData): Promise<FormState> {
  try {
    await api("/v1/account/forgot-password", { method: "POST", body: { email: text(form, "email") }, clientIp: await clientIp() });
  } catch (error) {
    if (error instanceof ApiError && error.status === 429) return failure("Too many requests. Please wait an hour and try again, or contact us.");
    return errorState(error);
  }
  return success("If an account uses this address, we have emailed it a link to choose a new password. The link expires in 1 hour.");
}

export async function resetPassword(_previous: FormState, form: FormData): Promise<FormState> {
  const password = text(form, "password");
  if (password !== text(form, "password_confirmation")) {
    return failure("Please check the highlighted fields.", { password_confirmation: "The two passwords do not match." });
  }

  try {
    const session = await api<Session>("/v1/account/reset-password", {
      method: "POST",
      clientIp: await clientIp(),
      body: { token: text(form, "token"), password, cart_token: await guestCartToken() },
    });
    await begin(session);
  } catch (error) {
    if (error instanceof ApiError && error.status === 400) return failure(error.message);
    return errorState(error);
  }

  return { status: "success", redirectTo: "/account?password=reset" };
}

/** Sends a new email confirmation link. */
export async function resendVerification(): Promise<FormState> {
  try {
    await customerApi("/v1/account/verify-email/resend", { method: "POST" });
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) return success("Your email address is already confirmed.");
    if (error instanceof ApiError && error.status === 429) return failure("We already sent you several links. Please check your inbox and spam folder, or try again in an hour.");
    return errorState(error);
  }
  return success("We sent you a new link. Please check your inbox (and the spam folder).");
}
