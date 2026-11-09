import { ResetPasswordForm } from "@/components/account/auth-forms";
import { StockAuthShell } from "@/components/stock/stock-auth-shell";
import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata("Choose a new password", "/stock/reset-password");

export default function StockResetPasswordPage() {
  return (
    <StockAuthShell title="Choose a new password">
      <ResetPasswordForm base="/stock" />
    </StockAuthShell>
  );
}
