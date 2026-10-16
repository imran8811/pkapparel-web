import { AuthShell } from "@/components/account/auth-shell";
import { ResetPasswordForm } from "@/components/account/auth-forms";
import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata("Choose a new password", "/reset-password");

export default function ResetPasswordPage() {
  return (
    <AuthShell eyebrow="Buyer account" title="Choose a new password" intro="After saving it, you are logged in and your other sessions end.">
      <ResetPasswordForm />
    </AuthShell>
  );
}
