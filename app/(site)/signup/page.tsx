import { AuthShell } from "@/components/account/auth-shell";
import { SignupForm } from "@/components/account/auth-forms";
import { countryOptions } from "@/lib/format";
import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata("Create a buyer account", "/signup");

export default function SignupPage() {
  return (
    <AuthShell
      wide
      eyebrow="Buyer account"
      title="Create a buyer account"
      intro="For brands, wholesalers, stores and online sellers. It takes a minute, and we send a link to confirm your email address."
    >
      <SignupForm countries={countryOptions()} />
    </AuthShell>
  );
}
