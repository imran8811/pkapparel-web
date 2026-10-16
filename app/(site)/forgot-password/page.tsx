import { AuthShell } from "@/components/account/auth-shell";
import { ForgotPasswordForm } from "@/components/account/auth-forms";
import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata("Forgot your password?", "/forgot-password");

export default function ForgotPasswordPage() {
  return (
    <AuthShell eyebrow="Buyer account" title="Forgot your password?" intro="Enter your email address and we will send you a link to choose a new password.">
      <ForgotPasswordForm />
    </AuthShell>
  );
}
