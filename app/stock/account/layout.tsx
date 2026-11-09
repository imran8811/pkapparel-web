import { Eyebrow } from "@/components/brand/eyebrow";
import { Container } from "@/components/layout/container";
import { StockAccountNav } from "@/components/stock/stock-account-nav";

/** The stock account: the buyer's stock orders, payments and receipts. Data is loaded by the pages. */
export default function StockAccountLayout({ children }: LayoutProps<"/stock/account">) {
  return (
    <>
      <section className="border-b border-border bg-cotton-100/60">
        <Container className="pt-8 sm:pt-10">
          <Eyebrow>Stock account</Eyebrow>
          <div className="mt-4">
            <StockAccountNav />
          </div>
        </Container>
      </section>
      <section className="py-10 sm:py-14">
        <Container>{children}</Container>
      </section>
    </>
  );
}
