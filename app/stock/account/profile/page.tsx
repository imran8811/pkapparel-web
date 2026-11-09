import { PasswordForm } from "@/components/account/profile-forms";
import { StockProfileForm } from "@/components/stock/stock-profile-form";
import { requireStockCustomer } from "@/lib/account/session";
import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata("Your details", "/stock/account/profile");

export default async function StockProfilePage() {
  const customer = await requireStockCustomer();

  return (
    <div className="grid grid-cols-1 gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Your details</h1>
        <p className="mt-2 text-muted-foreground">Your shop, contact details, email address and password.</p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        <div className="min-w-0 lg:col-span-8">
          {/* Keyed by the saved data, so a page kept alive by the router shows fresh values. */}
          <StockProfileForm key={JSON.stringify(customer)} customer={customer} />
        </div>
        <div className="min-w-0 lg:col-span-4">
          <PasswordForm />
        </div>
      </div>
    </div>
  );
}
