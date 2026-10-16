import { Suspense } from "react";
import { AccountNav, AccountNavFallback } from "@/components/account/account-nav";
import { Eyebrow } from "@/components/brand/eyebrow";
import { Container } from "@/components/layout/container";

/**
 * The buyer account: a tab bar above each page. Data is loaded by the pages, never here.
 * The tabs mark the current page from the URL, which under /account/orders/[orderNo] is only known
 * at request time, so they stream in behind a static fallback.
 */
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <section className="border-b border-border bg-cotton-100/60">
        <Container className="pt-8 sm:pt-10">
          <Eyebrow>Buyer account</Eyebrow>
          <div className="mt-4">
            <Suspense fallback={<AccountNavFallback />}>
              <AccountNav />
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
