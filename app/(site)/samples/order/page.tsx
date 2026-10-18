import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Eyebrow } from "@/components/brand/eyebrow";
import { Container } from "@/components/layout/container";
import { SampleOrderForm } from "@/components/samples/sample-order-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { panelClass } from "@/components/forms/styles";
import { ApiError } from "@/lib/api";
import { customerApi, requireCustomer } from "@/lib/account/session";
import { countryOptions } from "@/lib/format";
import { decodeItems, type SampleQuote } from "@/lib/samples";
import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata("Sample order", "/samples/order");

/** The sample order (login required): the samples chosen on /samples arrive as ?i=colorId|size|qty, plus ?custom=1. */
export default function SampleOrderPage({ searchParams }: PageProps<"/samples/order">) {
  return (
    <section className="bg-cotton-100/60 py-10 sm:py-14">
      <Container>
        <Link href="/samples" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to the samples
        </Link>
        <Eyebrow className="mt-6">Samples</Eyebrow>
        <h1 className="mt-4 text-4xl font-bold tracking-[-0.03em] sm:text-5xl">Sample order</h1>
        <div className="mt-8">
          <Suspense
            fallback={
              <div className="grid gap-6 lg:grid-cols-12" aria-busy="true" aria-label="Loading the sample order">
                <Skeleton className="h-96 rounded-3xl lg:col-span-7" />
                <Skeleton className="h-80 rounded-3xl lg:col-span-5" />
              </div>
            }
          >
            <SampleOrderContent searchParams={searchParams} />
          </Suspense>
        </div>
      </Container>
    </section>
  );
}

async function SampleOrderContent({ searchParams }: { searchParams: PageProps<"/samples/order">["searchParams"] }) {
  const params = (await searchParams) as { i?: string | string[]; custom?: string };
  const items = decodeItems(params.i === undefined ? [] : Array.isArray(params.i) ? params.i : [params.i]);
  const withCustom = params.custom === "1";
  const customer = await requireCustomer();

  if (items.length === 0 && !withCustom) {
    return <Notice text="Choose the samples you want first." />;
  }

  let quote: SampleQuote;
  try {
    quote = await customerApi<SampleQuote>("/v1/account/sample-orders/quote", {
      method: "POST",
      body: { items, custom: withCustom ? { description: "Custom-design sample", qty: 1 } : null },
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 422) {
      return <Notice text={Object.values(error.fields ?? {})[0] ?? "Some of these samples are not available. Please choose again."} />;
    }
    throw error;
  }

  return <SampleOrderForm initial={quote} items={items} withCustom={withCustom} customer={customer} countries={countryOptions()} />;
}

function Notice({ text }: { text: string }) {
  return (
    <div className={`${panelClass} max-w-xl`}>
      <p className="font-medium">{text}</p>
      <Button asChild className="mt-5">
        <Link href="/samples">Choose samples</Link>
      </Button>
    </div>
  );
}
