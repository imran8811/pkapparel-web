import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { mediaSrc, type PostSummary } from "@/lib/content";
import { formatDate } from "@/lib/format";

export function PostCard({ post }: { post: PostSummary }) {
  return (
    <Link href={`/post/${post.slug}`} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card transition-colors hover:border-denim-300">
      <div className="relative aspect-[16/10] overflow-hidden bg-cotton-100">
        {post.cover ? (
          <Image
            src={mediaSrc(post.cover.path)}
            alt={post.cover.alt}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 ease-out-soft group-hover:scale-[1.04]"
          />
        ) : (
          <div aria-hidden className="absolute inset-0 bg-denim-900 twill-texture" />
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        {post.published_at && (
          <time dateTime={post.published_at} className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            {formatDate(post.published_at)}
          </time>
        )}
        <h2 className="mt-3 text-xl leading-snug font-semibold tracking-tight">{post.title}</h2>
        <p className="mt-2 line-clamp-3 flex-1 text-[15px] leading-relaxed text-muted-foreground">{post.excerpt}</p>
        <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-denim-600">
          Read article <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
