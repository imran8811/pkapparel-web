import { Suspense } from "react";
import { CartView } from "@/components/account/cart-view";
import { Eyebrow } from "@/components/brand/eyebrow";
import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";
import { getCart, sessionToken } from "@/lib/account/session";
import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata("Your cart", "/cart");

export default function CartPage() {
  return (
    <section className="bg-cotton-100/60 py-10 sm:py-14">
      <Container>
        <Eyebrow>Wholesale order</Eyebrow>
        <h1 className="mt-4 text-4xl font-bold tracking-[-0.03em] sm:text-5xl">Your cart</h1>
        <div className="mt-8">
          <Suspense fallback={<CartSkeleton />}>
            <CartContent />
          </Suspense>
        </div>
      </Container>
    </section>
  );
}

async function CartContent() {
  const [cart, token] = await Promise.all([getCart(), sessionToken()]);
  // Keyed by the cart, so a page kept alive by the router shows the current cart when it comes back.
  return <CartView key={JSON.stringify(cart)} initialCart={cart} signedIn={Boolean(token)} />;
}

function CartSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-12" aria-busy="true" aria-label="Loading your cart">
      <div className="grid gap-4 lg:col-span-8">
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-48 rounded-3xl" />
      </div>
      <Skeleton className="h-80 rounded-3xl lg:col-span-4" />
    </div>
  );
}
