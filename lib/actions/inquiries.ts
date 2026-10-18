"use server";

import { headers } from "next/headers";
import { api, ApiError, apiWithMeta } from "@/lib/api";

export type InquiryType = "contact" | "quote" | "sample";

export type InquiryState = {
  status: "idle" | "success" | "error";
  message?: string;
  reference?: string;
  fields?: Record<string, string>;
  /** What the visitor typed, so the form can be shown again after an error. */
  values?: Record<string, string>;
  /** Increments on every submission (used to re-mount the form with the returned values). */
  attempt: number;
};

const MIN_FILL_TIME_MS = 3000;
const FIELDS = ["type", "name", "company", "email", "phone", "country", "message", "link"] as const;

/** The website accepts at most 4.5 MB per request, so each file is sent on its own, up to 4 MB. */
const MAX_FILE_BYTES = 4 * 1024 * 1024;

export type UploadResult = { ok: true; token: string; name: string; size_bytes: number; mime: string } | { ok: false; message: string };

/** Uploads one file for a quote request or sample order (a tech pack, spec sheet or photo); the form then sends its token. */
export async function uploadInquiryFile(form: FormData): Promise<UploadResult> {
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Choose a file." };
  if (file.size > MAX_FILE_BYTES) return { ok: false, message: `${file.name} is larger than 4 MB. Please send big files as a link.` };
  const body = new FormData();
  body.set("file", file, file.name);
  const requestHeaders = await headers();
  try {
    const data = await api<{ token: string; name: string; size_bytes: number; mime: string }>("/v1/inquiry-files", {
      method: "POST",
      body,
      clientIp: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip") || undefined,
      timeoutMs: 60_000,
    });
    return { ok: true, ...data };
  } catch (error) {
    if (error instanceof ApiError && error.status === 422) return { ok: false, message: Object.values(error.fields ?? {})[0] ?? error.message };
    if (error instanceof ApiError && error.status === 429) return { ok: false, message: "You have uploaded many files in a short time. Please try again later." };
    console.error("Upload failed", error);
    return { ok: false, message: `${file.name} could not be uploaded. Please try again.` };
  }
}

/** Sends a contact message, quote request or sample request to the API. */
export async function submitInquiry(previous: InquiryState, formData: FormData): Promise<InquiryState> {
  const attempt = previous.attempt + 1;
  const text = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
  };

  const values: Record<string, string> = {};
  const details: Record<string, string> = {};
  const extras: string[] = [];
  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string") continue;
    if (key === "details.extras") {
      // Tick boxes: several values under one name.
      extras.push(value);
    } else if (key.startsWith("details.")) {
      values[key] = value;
      if (value.trim()) details[key.slice("details.".length)] = value.trim();
    }
  }
  if (extras.length > 0) details.extras = extras.join(", ");
  for (const key of FIELDS) values[key] = text(key);
  // Kept for showing the form again after an error.
  values["details.extras"] = extras.join("|");
  values.files_meta = text("files_meta");
  const files = formData.getAll("files").filter((token): token is string => typeof token === "string" && token !== "");

  // Spam traps: a hidden field only bots fill in, and forms sent faster than a human can type.
  if (text("website") !== "") {
    return { status: "success", reference: "INQ-00000", attempt };
  }
  const startedAt = Number(text("started_at"));
  if (!startedAt || Date.now() - startedAt < MIN_FILL_TIME_MS) {
    return { status: "error", message: "Please take a moment to complete the form, then send it again.", values, attempt };
  }

  const requestHeaders = await headers();
  const clientIp =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip") || undefined;

  try {
    const { data } = await apiWithMeta<{ reference: string }>("/v1/inquiries", {
      method: "POST",
      clientIp,
      body: {
        type: values.type,
        name: values.name,
        company: values.company,
        email: values.email,
        phone: values.phone,
        country: values.country,
        message: values.message,
        details,
        link: values.link || undefined,
        files: files.length > 0 ? files : undefined,
        source_url: requestHeaders.get("referer") ?? undefined,
      },
    });

    return { status: "success", reference: data.reference, attempt };
  } catch (error) {
    if (error instanceof ApiError && error.status === 422) {
      return { status: "error", message: "Please check the highlighted fields.", fields: error.fields, values, attempt };
    }
    if (error instanceof ApiError && error.status === 429) {
      return {
        status: "error",
        message: "You have sent several messages in a short time. Please try again later, or message us on WhatsApp.",
        values,
        attempt,
      };
    }
    console.error("Inquiry could not be sent", error);
    return {
      status: "error",
      message: "Sorry, your message could not be sent. Please try again, or contact us on WhatsApp.",
      values,
      attempt,
    };
  }
}
