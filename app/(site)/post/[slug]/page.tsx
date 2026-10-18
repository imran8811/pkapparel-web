import type { Metadata } from "next";
import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { CtaPanel } from "@/components/site/cta-panel";
import { JsonLd } from "@/components/site/json-ld";
import { PageHero } from "@/components/site/page-hero";
import { PostCard } from "@/components/site/post-card";
import { Prose } from "@/components/site/prose";
import { getPost, getPosts, mediaSrc } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { findRedirect } from "@/lib/redirects";
import { absoluteUrl, pageMetadata } from "@/lib/seo";

/**
 * Always served as a complete static page. After staff change the content, the next visitor waits
 * for the fresh page instead of getting the generic fallback shell with the old content.
 */
export const ensureStatic = "navigation";
// The address is read before anything streams, so a redirect or a 404 keeps its HTTP status. Every article is
// prerendered (generateStaticParams), so navigating to one still uses static output.
export const instant = false;

/** Prerender every published article. New articles render on their first visit, then stay cached. */
export async function generateStaticParams() {
  const posts = await getPosts(100);
  // Cache Components needs at least one value; an unknown slug simply shows a 404.
  return posts.length > 0 ? posts.map((post) => ({ slug: post.slug })) : [{ slug: "__none__" }];
}

export async function generateMetadata({ params }: PageProps<"/post/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Article not found" };

  return pageMetadata({
    title: post.seo_title ?? post.title,
    description: post.seo_description ?? post.excerpt,
    path: `/post/${post.slug}`,
    image: post.cover ? mediaSrc(post.cover.path) : undefined,
    type: "article",
  });
}

/**
 * The whole article is static and rendered in place (no <Suspense>): the cover is the largest element on the page,
 * and content behind a fallback only appears once the page's scripts run.
 */
export default async function PostPage({ params }: PageProps<"/post/[slug]">) {
  // Decided before anything streams, so a redirect or a 404 keeps its real HTTP status.
  const { slug } = await params;
  const [post, all] = await Promise.all([getPost(slug), getPosts()]);
  if (!post) {
    // A redirect from the admin (e.g. the post's address changed).
    const moved = await findRedirect(`/post/${slug}`);
    if (moved) permanentRedirect(moved);
    notFound();
  }

  const related = all.filter((other) => other.slug !== post.slug).slice(0, 3);

  return (
    <>
      <PageHero
        eyebrow={post.published_at ? formatDate(post.published_at) : "Article"}
        title={post.title}
        crumbs={[
          { label: "Blog", href: "/blog" },
          { label: post.title, href: `/post/${post.slug}` },
        ]}
      />

      <article className="py-16 lg:py-20">
        <Container className="max-w-3xl">
          {post.cover && (
            <div className="relative mb-12 aspect-[16/9] overflow-hidden rounded-[2rem] bg-cotton-100 ring-1 ring-border">
              <Image
                src={mediaSrc(post.cover.path)}
                alt={post.cover.alt}
                fill
                loading="eager"
                fetchPriority="high"
                sizes="(min-width: 768px) 768px, 100vw"
                className="object-cover"
              />
            </div>
          )}
          <Prose html={post.body_html} />
        </Container>
      </article>

      <CtaPanel
        title="Looking for a denim manufacturer?"
        body="PK Apparel makes jeans, jackets, shorts, cargo and chino pants to order in Lahore, from 100 pieces per color."
      />

      {related.length > 0 && (
        <section className="pb-20 lg:pb-28">
          <Container>
            <h2 className="text-3xl font-bold tracking-[-0.03em]">More articles</h2>
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((other) => (
                <li key={other.slug}>
                  <PostCard post={other} />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.excerpt,
          datePublished: post.published_at,
          dateModified: post.updated_at,
          author: { "@type": "Organization", name: post.author_name },
          publisher: { "@type": "Organization", name: "PK Apparel", logo: { "@type": "ImageObject", url: absoluteUrl("/apple-icon.png") } },
          mainEntityOfPage: absoluteUrl(`/post/${post.slug}`),
          ...(post.cover ? { image: absoluteUrl(mediaSrc(post.cover.path)) } : {}),
        }}
      />
    </>
  );
}
