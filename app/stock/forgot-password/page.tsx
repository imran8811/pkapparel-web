import { ForgotPasswordForm } from "@/components/account/auth-forms";
import { StockAuthShell } from "@/components/stock/stock-auth-shell";
import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata("Forgot your password?", "/stock/forgot-password");

export default function StockForgotPasswordPage() {
  return (
    <StockAuthShell title="Forgot your password?" intro="Enter your email address and we send you a link to choose a new one.">
      <ForgotPasswordForm base="/stock" />
    </StockAuthShell>
  );
}
