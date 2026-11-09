import { StockLegalPage } from "@/components/stock/stock-legal-page";
import { pageMetadata } from "@/lib/seo";
import { RETURN_DAYS } from "@/lib/stock";

export const metadata = pageMetadata({
  title: "Terms and returns",
  description: `Terms for orders of jeans from our stock: sets and prices, payment, cargo delivery or collection, and returns within ${RETURN_DAYS} days.`,
  path: "/stock/terms",
});

export default function StockTermsPage() {
  return <StockLegalPage slug="stock-terms" path="/stock/terms" />;
}
