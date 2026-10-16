import { AddressBook } from "@/components/account/address-book";
import { countryOptions } from "@/lib/format";
import { customerApi } from "@/lib/account/session";
import type { Address } from "@/lib/account/types";
import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata("Your addresses", "/account/addresses");

export default async function AddressesPage() {
  const addresses = await customerApi<Address[]>("/v1/account/addresses");

  return (
    <div className="grid grid-cols-1 gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Delivery addresses</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Choose one at checkout. Each order keeps its own copy, so changing an address here never changes an order you placed.
        </p>
      </div>
      {/* Keyed by the saved data, so a page kept alive by the router shows fresh addresses. */}
      <AddressBook key={JSON.stringify(addresses)} addresses={addresses} countries={countryOptions()} />
    </div>
  );
}
