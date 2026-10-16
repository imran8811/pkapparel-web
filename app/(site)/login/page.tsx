import { AuthShell } from "@/components/account/auth-shell";
import { LoginForm } from "@/components/account/auth-forms";
import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata("Log in", "/login");

export default function LoginPage() {
  return (
    <AuthShell eyebrow="Buyer account" title="Log in" intro="Order online, download your proforma invoices and follow your payments and production.">
      <LoginForm />
    </AuthShell>
  );
}
