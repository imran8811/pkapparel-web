import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";

const TAG_PATTERN = /^[a-z0-9][a-z0-9:_.-]{0,99}$/i;

function secretMatches(given: string | null): boolean {
  const expected = process.env.REVALIDATE_SECRET ?? "";
  if (!expected || !given) return false;

  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Called by the PHP API after content changes, e.g. when an admin saves a product:
 *   POST /api/revalidate   X-Revalidate-Secret: …   { "tags": ["products", "product:pk-1058"] }
 * The tagged data expires at once ({ expire: 0 }): the next visitor gets fresh content, never the old
 * version, so staff see their change as soon as they open the page. ("max" would serve the old version once more.)
 */
export async function POST(request: Request) {
  if (!secretMatches(request.headers.get("x-revalidate-secret"))) {
    return Response.json({ error: { code: "unauthorized", message: "Invalid revalidation secret." } }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const tags = (body as { tags?: unknown } | null)?.tags;
  const valid =
    Array.isArray(tags) &&
    tags.length > 0 &&
    tags.length <= 50 &&
    tags.every((tag): tag is string => typeof tag === "string" && TAG_PATTERN.test(tag));

  if (!valid) {
    return Response.json(
      { error: { code: "invalid_tags", message: 'Send { "tags": [...] } with 1 to 50 valid tag names.' } },
      { status: 400 },
    );
  }

  for (const tag of tags) {
    revalidateTag(tag, { expire: 0 });
  }

  return Response.json({ data: { revalidated: tags } });
}
