import { LegalPage } from "@/components/site/legal-page";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy policy",
  description: "How PK Apparel collects, uses and protects personal information.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return <LegalPage slug="privacy" />;
}
