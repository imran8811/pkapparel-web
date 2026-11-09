import { Suspense } from "react";
import { Eyebrow } from "@/components/brand/eyebrow";
import { Container } from "@/components/layout/container";
import { StockAccountNav, StockAccountNavFallback } from "@/components/stock/stock-account-nav";

/** The stock account: the buyer's stock orders, payments and receipts. Data is loaded by the pages. */
export default function StockAccountLayout({ children }: LayoutProps<"/stock/account">) {
  return (
    <>
      <section className="border-b border-border bg-cotton-100/60">
        <Container className="pt-8 sm:pt-10">
          <Eyebrow>Stock account</Eyebrow>
          <div className="mt-4">
            {/* The tabs mark the current page from the URL, known only at request time under the order pages. */}
            <Suspense fallback={<StockAccountNavFallback />}>
              <StockAccountNav />
            </Suspense>
          </div>
        </Container>
      </section>
      <section className="py-10 sm:py-14">
        <Container>{children}</Container>
      </section>
    </>
  );
}
