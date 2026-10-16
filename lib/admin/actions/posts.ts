"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { adminApi } from "@/lib/admin/session";
import { errorState, failure, number, optional, success, text, type FormState } from "@/lib/admin/forms";
import { fromLocalInput } from "@/lib/admin/time";
import type { Post } from "@/lib/admin/types";

/** Creates or updates a blog post. A new post opens in the editor once saved. */
export async function savePost(_previous: FormState, form: FormData): Promise<FormState> {
  const id = number(form, "id");
  const publishedAt = text(form, "published_at");
  const body = {
    title: text(form, "title"),
    slug: optional(form, "slug"),
    excerpt: optional(form, "excerpt"),
    body_html: text(form, "body_html"),
    cover_image_path: optional(form, "cover_image_path"),
    cover_image_alt: optional(form, "cover_image_alt"),
    author_name: optional(form, "author_name"),
    status: text(form, "status"),
    published_at: publishedAt ? fromLocalInput(publishedAt) : null,
    seo_title: optional(form, "seo_title"),
    seo_description: optional(form, "seo_description"),
  };
  if (publishedAt && body.published_at === null) {
    return failure("Please check the highlighted fields.", { published_at: "Enter a valid date and time." });
  }

  let post: Post;
  try {
    post = await adminApi<Post>(id ? `/v1/admin/posts/${id}` : "/v1/admin/posts", { method: id ? "PUT" : "POST", body });
  } catch (error) {
    return errorState(error);
  }

  updateTag("posts");
  updateTag(`post:${post.slug}`);
  const previousSlug = text(form, "original_slug");
  if (previousSlug && previousSlug !== post.slug) updateTag(`post:${previousSlug}`);

  const message = post.status === "published" ? "Post saved and published." : "Draft saved.";
  // A new post continues in its own editor; the form on the "new post" page starts empty again.
  return id ? success(message) : { ...success(message), redirectTo: `/admin/blog/${post.id}` };
}

export async function deletePost(id: number, slug: string): Promise<FormState> {
  if (!Number.isInteger(id) || id <= 0) return failure("This post does not exist.");
  try {
    await adminApi(`/v1/admin/posts/${id}`, { method: "DELETE" });
  } catch (error) {
    return errorState(error);
  }
  updateTag("posts");
  updateTag(`post:${slug}`);
  redirect("/admin/blog");
}
