import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ReviewForm, type ReviewContext } from "@/components/account/review-form";
import { Button } from "@/components/ui/button";
import { panelClass } from "@/components/forms/styles";
import { ApiError } from "@/lib/api";
import { submitOrderReview } from "@/lib/account/actions/reviews";
import { customerApi } from "@/lib/account/session";
import { countryName } from "@/lib/format";
import { privatePageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/account/orders/[orderNo]/review">) {
  const { orderNo } = await params;
  return privatePageMetadata(`Review order ${orderNo}`, `/account/orders/${orderNo}/review`);
}

export default async function OrderReviewPage({ params }: PageProps<"/account/orders/[orderNo]/review">) {
  const { orderNo } = await params;
  if (!/^PK-[0-9-]+$/.test(orderNo)) notFound();
  let context: ReviewContext;
  try {
    context = await customerApi<ReviewContext>(`/v1/account/orders/${orderNo}/review`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    if (error instanceof ApiError && error.status === 409) {
      return <Notice orderNo={orderNo} text="You can review an order once it is delivered." />;
    }
    throw error;
  }
  const back = (
    <Button asChild variant="outline">
      <Link href={`/account/orders/${orderNo}`}>Back to the order</Link>
    </Button>
  );

  return (
    <div className="grid grid-cols-1 gap-8">
      <div>
        <Link href={`/account/orders/${orderNo}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Order {orderNo}
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">How did your order go?</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {context.styles.join(", ")} · {context.total_pcs} pcs. Your review helps other buyers, and appears on the product pages once we have read it.
        </p>
      </div>
      <div className={`${panelClass} min-w-0 max-w-2xl`}>
        {context.submitted ? (
          <div className="grid gap-4">
            <p className="text-lg font-semibold">Thank you, we already have your review of this order.</p>
            {back}
          </div>
        ) : (
          <ReviewForm context={context} country={countryName(context.country_code ?? "")} action={submitOrderReview.bind(null, orderNo)} after={back} />
        )}
      </div>
    </div>
  );
}

function Notice({ orderNo, text }: { orderNo: string; text: string }) {
  return (
    <div className="grid grid-cols-1 gap-6">
      <Link href={`/account/orders/${orderNo}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Order {orderNo}
      </Link>
      <p className={panelClass}>{text}</p>
    </div>
  );
}
