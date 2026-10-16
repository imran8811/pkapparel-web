"use client";

import { useState } from "react";
import { AdminForm, FormError, SelectField, SubmitButton, TextAreaField, TextField } from "@/components/admin/form";
import { DeleteButton } from "@/components/admin/delete-button";
import { ImageField } from "@/components/admin/image-field";
import { Panel } from "@/components/admin/page-parts";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { deletePost, savePost } from "@/lib/admin/actions/posts";
import { toLocalInput } from "@/lib/admin/time";
import type { Post } from "@/lib/admin/types";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft (not on the website)" },
  { value: "published", label: "Published" },
];

export function PostForm({ post }: { post: Post | null }) {
  // A new post opens in its own editor once saved; the "new post" form then starts empty again
  // (Next.js keeps the page alive in the background, so it would otherwise still show the old text).
  const [version, setVersion] = useState(0);
  return <PostEditor key={version} post={post} onSaved={post ? undefined : () => setVersion((current) => current + 1)} />;
}

function PostEditor({ post, onSaved }: { post: Post | null; onSaved?: () => void }) {
  const [status, setStatus] = useState(post?.status ?? "draft");

  return (
    <AdminForm action={savePost} onSuccess={onSaved} className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      {post ? (
        <>
          <input type="hidden" name="id" value={post.id} />
          <input type="hidden" name="original_slug" value={post.slug} />
        </>
      ) : null}

      <div className="grid min-w-0 gap-6">
        <Panel>
          <div className="grid gap-5">
            <TextField label="Title" name="title" defaultValue={post?.title} required className="h-12 text-lg font-medium" />
            <RichTextEditor name="body_html" label="Article" defaultValue={post?.body_html ?? ""} folder="blog" />
            <TextAreaField
              label="Short summary"
              name="excerpt"
              defaultValue={post?.excerpt}
              rows={3}
              maxLength={500}
              hint="Shown on the blog page and in search results. Leave empty to use the first paragraph."
            />
          </div>
        </Panel>

        <Panel title="Search engines" description="Optional. Without these, the title and summary are used.">
          <div className="grid gap-4">
            <TextField label="SEO title" name="seo_title" defaultValue={post?.seo_title ?? ""} maxLength={200} hint="About 50–60 characters." />
            <TextAreaField
              label="SEO description"
              name="seo_description"
              defaultValue={post?.seo_description ?? ""}
              rows={3}
              maxLength={320}
              hint="About 150–160 characters."
            />
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:sticky lg:top-6">
        <Panel>
          <div className="grid gap-4">
            <SelectField
              label="Status"
              name="status"
              value={status}
              onChange={(event) => setStatus(event.target.value as Post["status"])}
              options={STATUS_OPTIONS}
            />
            {status === "published" ? (
              <TextField
                label="Publish date (Pakistan time)"
                name="published_at"
                type="datetime-local"
                defaultValue={toLocalInput(post?.published_at)}
                hint="Leave empty to publish now. A future date schedules the post."
              />
            ) : null}
            <FormError />
            <SubmitButton className="w-full">{post ? "Save changes" : status === "published" ? "Publish" : "Save draft"}</SubmitButton>
          </div>
        </Panel>

        <Panel>
          <div className="grid gap-4">
            <ImageField name="cover_image_path" folder="blog" label="Cover image" defaultValue={post?.cover_image_path} previewClassName="aspect-[16/10] w-full" />
            <TextField label="Cover description" name="cover_image_alt" defaultValue={post?.cover_image_alt ?? ""} maxLength={200} hint="What the photo shows." />
            <TextField
              label="Web address"
              name="slug"
              defaultValue={post?.slug}
              placeholder="made-from-the-title"
              hint={post ? `pkapparel.com/post/${post.slug}. Changing it breaks links people saved.` : "Leave empty to make it from the title."}
            />
            <TextField label="Author" name="author_name" defaultValue={post?.author_name ?? "PK Apparel"} maxLength={120} />
          </div>
        </Panel>

        {post ? (
          <DeleteButton
            label="Delete post"
            title={`Delete “${post.title}”?`}
            description="The article is removed from the website. This cannot be undone."
            onConfirm={() => deletePost(post.id, post.slug)}
          />
        ) : null}
      </div>
    </AdminForm>
  );
}
