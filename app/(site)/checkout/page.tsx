import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CheckoutForm } from "@/components/account/checkout-form";
import { Eyebrow } from "@/components/brand/eyebrow";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { panelClass } from "@/components/forms/styles";
import { countryOptions } from "@/lib/format";
import { customerApi, requireCustomer } from "@/lib/account/session";
import type { Checkout } from "@/lib/account/types";
import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata("Checkout", "/checkout");

export default function CheckoutPage() {
  return (
    <section className="bg-cotton-100/60 py-10 sm:py-14">
      <Container>
        <Link href="/cart" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to the cart
        </Link>
        <Eyebrow className="mt-6">Wholesale order</Eyebrow>
        <h1 className="mt-4 text-4xl font-bold tracking-[-0.03em] sm:text-5xl">Checkout</h1>
        <div className="mt-8">
          <Suspense fallback={<CheckoutSkeleton />}>
            <CheckoutContent />
          </Suspense>
        </div>
      </Container>
    </section>
  );
}

async function CheckoutContent() {
  const customer = await requireCustomer();
  const checkout = await customerApi<Checkout>("/v1/account/checkout");

  if (!checkout.cart.can_checkout) {
    return (
      <div className={`${panelClass} max-w-xl`}>
        <p className="font-medium">{checkout.cart.line_count === 0 ? "Your cart is empty." : "Your cart needs a look first."}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {checkout.cart.line_count === 0 ? "Add styles from the shop, then come back to check out." : checkout.cart.issues.join(" ")}
        </p>
        <Button asChild className="mt-5">
          <Link href={checkout.cart.line_count === 0 ? "/wholesale-shop" : "/cart"}>{checkout.cart.line_count === 0 ? "Go to the shop" : "Open the cart"}</Link>
        </Button>
      </div>
    );
  }

  // Keyed by the data, so a page kept alive by the router starts from fresh numbers.
  return <CheckoutForm key={JSON.stringify(checkout)} initial={checkout} customer={customer} countries={countryOptions()} />;
}

function CheckoutSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-12" aria-busy="true" aria-label="Loading the checkout">
      <div className="grid gap-4 lg:col-span-7">
        <Skeleton className="h-56 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
      <Skeleton className="h-96 rounded-3xl lg:col-span-5" />
    </div>
  );
}
