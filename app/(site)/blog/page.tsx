import { Container } from "@/components/layout/container";
import { CtaPanel } from "@/components/site/cta-panel";
import { PageHero } from "@/components/site/page-hero";
import { PostCard } from "@/components/site/post-card";
import { getPosts } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Apparel sourcing blog",
  description:
    "Guides for buyers sourcing jeans and apparel: manufacturing costs, choosing a wholesale supplier, private label and buying in bulk from Pakistan.",
  path: "/blog",
});

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <>
      <PageHero
        eyebrow="Blog"
        title={
          <>
            Guides for apparel <span className="stitch-underline">buyers.</span>
          </>
        }
        intro="Practical articles about sourcing jeans and apparel wholesale: costs, suppliers, private label and buying in bulk."
        crumbs={[{ label: "Blog", href: "/blog" }]}
      />

      <section className="py-20 lg:py-28">
        <Container>
          {posts.length === 0 ? (
            <p className="text-muted-foreground">New articles are coming soon.</p>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <li key={post.slug}>
                  <PostCard post={post} />
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>

      <CtaPanel
        title="Sourcing apparel right now?"
        body="Browse our styles and order online, or send us your design for a quote."
      />
    </>
  );
}
