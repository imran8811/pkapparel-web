import { LoginForm } from "@/components/account/auth-forms";
import { StockAuthShell } from "@/components/stock/stock-auth-shell";
import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata("Log in", "/stock/login");

export default function StockLoginPage() {
  return (
    <StockAuthShell title="Log in" intro="Order sets online and follow your orders, payments and receipts.">
      <LoginForm base="/stock" />
    </StockAuthShell>
  );
}
