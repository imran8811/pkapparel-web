import { StockLegalPage } from "@/components/stock/stock-legal-page";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy",
  description: "What we do with the details you give us when you contact us or order jeans from our stock.",
  path: "/stock/privacy",
});

export default function StockPrivacyPage() {
  return <StockLegalPage slug="stock-privacy" path="/stock/privacy" />;
}
