import { LegalPage } from "@/components/site/legal-page";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Terms of sale",
  description: "Terms of sale for wholesale, made-to-order orders from PK Apparel.",
  path: "/terms-of-sale",
});

export default function TermsOfSalePage() {
  return <LegalPage slug="terms-of-sale" />;
}
