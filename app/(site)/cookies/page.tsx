import { LegalPage } from "@/components/site/legal-page";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Cookie policy",
  description: "The cookies used on the PK Apparel website.",
  path: "/cookies",
});

export default function CookiesPage() {
  return <LegalPage slug="cookies" />;
}
