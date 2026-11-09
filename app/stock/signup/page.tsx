import { StockSignupForm } from "@/components/account/auth-forms";
import { StockAuthShell } from "@/components/stock/stock-auth-shell";
import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata("Create an account", "/stock/signup");

export default function StockSignupPage() {
  return (
    <StockAuthShell wide title="Create an account" intro="For shopkeepers and wholesalers. It takes a minute, and we send a link to confirm your email address.">
      <StockSignupForm />
    </StockAuthShell>
  );
}
