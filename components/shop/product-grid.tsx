import Link from "next/link";
import { ArrowRight, Scissors } from "lucide-react";
import { ProductCard } from "@/components/shop/product-card";
import { Button } from "@/components/ui/button";
import type { ProductCard as Card } from "@/lib/shop";
import { cn } from "@/lib/utils";

export function ProductGrid({ products, className }: { products: Card[]; className?: string }) {
  return (
    <ul className={cn("grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 xl:grid-cols-4", className)}>
      {products.map((product, index) => (
        <li key={product.slug}>
          <ProductCard product={product} preload={index === 0} />
        </li>
      ))}
    </ul>
  );
}

/** Shown where a category has no styles online yet: everything is made to order anyway. */
export function MadeToOrderPanel({ title, body, className }: { title: string; body: string; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-[2rem] bg-denim-900 p-8 text-cotton-50 sm:p-12", className)}>
      <div aria-hidden className="absolute inset-0 twill-texture" />
      <div className="relative max-w-2xl">
        <Scissors aria-hidden className="size-8 text-stitch-400" />
        <h2 className="mt-5 text-3xl leading-tight font-bold tracking-[-0.02em] sm:text-4xl">{title}</h2>
        <p className="mt-4 text-lg leading-relaxed text-cotton-50/75">{body}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild variant="accent" size="lg">
            <Link href="/request-quote">
              Request a quote <ArrowRight />
            </Link>
          </Button>
          <Button asChild variant="outline-inverse" size="lg">
            <Link href="/private-label">How private label works</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
