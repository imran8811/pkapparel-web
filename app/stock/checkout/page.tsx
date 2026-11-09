import { Suspense } from "react";
import Link from "next/link";
import { Eyebrow } from "@/components/brand/eyebrow";
import { Container } from "@/components/layout/container";
import { StockCheckoutForm } from "@/components/stock/stock-checkout-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { requireStockCustomer, stockCustomerApi } from "@/lib/account/session";
import { privatePageMetadata } from "@/lib/seo";
import type { StockCheckout } from "@/lib/stock";

export const metadata = privatePageMetadata("Check out", "/stock/checkout");

export default function StockCheckoutPage() {
  return (
    <section className="bg-cotton-100/60 py-10 sm:py-14">
      <Container>
        <Eyebrow>Stock order</Eyebrow>
        <h1 className="mt-4 text-4xl font-bold tracking-[-0.03em] sm:text-5xl">Check out</h1>
        <div className="mt-8">
          <Suspense fallback={<Skeleton className="h-[32rem] rounded-3xl" />}>
            <CheckoutContent />
          </Suspense>
        </div>
      </Container>
    </section>
  );
}

async function CheckoutContent() {
  const customer = await requireStockCustomer();
  const checkout = await stockCustomerApi<StockCheckout>("/v1/account/stock-checkout");

  if (checkout.cart.lines.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed bg-white/60 px-6 py-16 text-center">
        <p className="font-heading text-xl font-semibold">Your cart is empty</p>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">Add the sets you need, then come back here.</p>
        <Button asChild className="mt-6">
          <Link href="/stock">See what is in stock</Link>
        </Button>
      </div>
    );
  }

  return <StockCheckoutForm key={JSON.stringify(checkout.cart)} checkout={checkout} customer={customer} />;
}
