import type { Metadata } from "next";
import Link from "next/link";
import { InvoiceForm } from "@/components/admin/invoice-form";
import { NoAccess, PageHeader } from "@/components/admin/page-parts";
import { buyerFromAccount } from "@/lib/admin/actions/invoices";
import { can } from "@/lib/admin/permissions";
import { adminApi, getStaff } from "@/lib/admin/session";
import type { InvoiceDefaults, InvoiceType } from "@/lib/admin/types";
import { countryOptions } from "@/lib/format";

export const metadata: Metadata = { title: "New invoice" };

const TYPES: InvoiceType[] = ["sample", "proforma", "commercial"];

/** /admin/invoices/new?type=sample&customer=12: the customer's page links here with the buyer filled in. */
export default async function NewInvoicePage({ searchParams }: PageProps<"/admin/invoices/new">) {
  const staff = await getStaff();
  if (!can(staff.role, "invoices")) return <NoAccess />;

  const search = (await searchParams) as { type?: string; customer?: string };
  const type = TYPES.find((value) => value === search.type) ?? "sample";
  const customerId = /^\d+$/.test(search.customer ?? "") ? Number(search.customer) : null;

  const [defaults, account] = await Promise.all([
    adminApi<InvoiceDefaults>("/v1/admin/invoices/defaults"),
    customerId ? buyerFromAccount(customerId) : Promise.resolve(null),
  ]);

  return (
    <>
      <PageHeader
        back={{ href: "/admin/invoices", label: "Invoices" }}
        title="New invoice"
        description="The number is given when you create it. You can still edit everything until the invoice is paid."
      />
      {!defaults.bank_ready ? (
        <p className="mb-6 rounded-xl bg-orange-50 px-4 py-3 text-sm text-stitch-700">
          The bank details are not filled in yet, so the invoice would say “our team will send you the bank details”.{" "}
          {staff.role === "admin" ? (
            <Link href="/admin/settings" className="font-medium underline">
              Add them in Settings
            </Link>
          ) : (
            "Ask an administrator to add them in Settings."
          )}
        </p>
      ) : null}
      <InvoiceForm
        initialType={type}
        defaults={defaults}
        countries={countryOptions()}
        account={account ? { ...account, label: `${account.buyer.company ?? account.buyer.contact_name} · ${account.buyer.email}` } : null}
      />
    </>
  );
}
