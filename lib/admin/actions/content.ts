"use server";

import { updateTag } from "next/cache";
import { adminApi } from "@/lib/admin/session";
import { checked, errorState, failure, number, optional, success, text, type FormState } from "@/lib/admin/forms";

/*
 * FAQs, buyer reviews and certificates: simple lists edited in dialogs.
 * Each save refreshes the website's cached copy right away (updateTag).
 */

type ListKind = "faqs" | "testimonials" | "certifications";

const LABELS: Record<ListKind, string> = { faqs: "FAQ", testimonials: "Review", certifications: "Certificate" };

async function saveItem(kind: ListKind, form: FormData, fields: Record<string, unknown>): Promise<FormState> {
  const id = number(form, "id");
  const body = { ...fields, sort_order: number(form, "sort_order"), is_published: checked(form, "is_published") };

  try {
    await adminApi(id ? `/v1/admin/${kind}/${id}` : `/v1/admin/${kind}`, { method: id ? "PUT" : "POST", body });
  } catch (error) {
    return errorState(error);
  }
  updateTag(kind);
  return success(`${LABELS[kind]} ${id ? "updated" : "added"}.`);
}

async function deleteItem(kind: ListKind, id: number): Promise<FormState> {
  if (!Number.isInteger(id) || id <= 0) return failure("Not found.");
  try {
    await adminApi(`/v1/admin/${kind}/${id}`, { method: "DELETE" });
  } catch (error) {
    return errorState(error);
  }
  updateTag(kind);
  return success(`${LABELS[kind]} deleted.`);
}

export async function saveFaq(_previous: FormState, form: FormData): Promise<FormState> {
  return saveItem("faqs", form, {
    category: text(form, "category"),
    question: text(form, "question"),
    answer: text(form, "answer"),
  });
}

export async function deleteFaq(id: number): Promise<FormState> {
  return deleteItem("faqs", id);
}

export async function saveTestimonial(_previous: FormState, form: FormData): Promise<FormState> {
  return saveItem("testimonials", form, {
    author_name: optional(form, "author_name"),
    author_role: text(form, "author_role"),
    company: optional(form, "company"),
    country_code: optional(form, "country_code"),
    quote: text(form, "quote"),
    rating: number(form, "rating"),
  });
}

export async function deleteTestimonial(id: number): Promise<FormState> {
  return deleteItem("testimonials", id);
}

export async function saveCertification(_previous: FormState, form: FormData): Promise<FormState> {
  return saveItem("certifications", form, {
    name: text(form, "name"),
    issuer: optional(form, "issuer"),
    certificate_no: optional(form, "certificate_no"),
    member_since: optional(form, "member_since"),
    valid_until: optional(form, "valid_until"),
    description: optional(form, "description"),
    image_path: optional(form, "image_path"),
  });
}

export async function deleteCertification(id: number): Promise<FormState> {
  return deleteItem("certifications", id);
}
