import { notFound, permanentRedirect } from "next/navigation";
import { findRedirect } from "@/lib/redirects";

/*
 * Every address that has no page of its own. Old addresses that staff redirect in the admin (Admin → Redirects)
 * go to their new page with a permanent redirect; the rest show "page not found".
 * Like the shop and blog pages, the result is generated in full before it is served, so the redirect and the
 * 404 keep their real HTTP status.
 */
export const ensureStatic = "navigation";
// This page only ever redirects or shows "not found", decided from the address before anything streams, so it has
// no static shell to validate.
export const instant = false;

export function generateStaticParams() {
  // Cache Components needs one value to prerender; any other address renders on its first visit.
  return [{ path: ["__none__"] }];
}

export default async function MissingPage({ params }: PageProps<"/[...path]">) {
  const { path } = await params;
  const target = await findRedirect(`/${path.join("/")}`);
  if (target) permanentRedirect(target);
  notFound();
}
