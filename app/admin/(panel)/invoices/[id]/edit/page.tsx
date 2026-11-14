import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InvoiceForm } from "@/components/admin/invoice-form";
import { NoAccess, PageHeader } from "@/components/admin/page-parts";
import { ApiError } from "@/lib/api";
import { can } from "@/lib/admin/permissions";
import { adminApi, getStaff } from "@/lib/admin/session";
import type { Invoice, InvoiceDefaults } from "@/lib/admin/types";
import { countryOptions } from "@/lib/format";

export const metadata: Metadata = { title: "Edit invoice" };

export default async function EditInvoicePage({ params, searchParams }: PageProps<"/admin/invoices/[id]/edit">) {
  const staff = await getStaff();
  if (!can(staff.role, "invoices")) return <NoAccess />;
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  // "Make a copy" opens the new invoice here.
  const copied = (await searchParams).created === "1";

  let invoice: Invoice;
  let defaults: InvoiceDefaults;
  try {
    [invoice, defaults] = await Promise.all([adminApi<Invoice>(`/v1/admin/invoices/${id}`), adminApi<InvoiceDefaults>("/v1/admin/invoices/defaults")]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <>
      <PageHeader
        back={{ href: `/admin/invoices/${invoice.id}`, label: invoice.invoice_no }}
        title={`Edit ${invoice.type_label.toLowerCase()} ${invoice.invoice_no}`}
        description="Changes show in the PDF straight away. If it was already emailed, send it again so the buyer has the new version."
      />
      {copied ? (
        <p className="mb-6 rounded-xl bg-denim-50 px-4 py-3 text-sm text-denim-800">
          A copy was made as {invoice.type_label.toLowerCase()} <strong className="font-mono">{invoice.invoice_no}</strong>, dated today. Check the lines, charges and terms, then save.
        </p>
      ) : null}
      {invoice.status !== "open" ? (
        <p className="rounded-xl bg-orange-50 px-4 py-3 text-sm text-stitch-700">
          This invoice is {invoice.status === "paid" ? "paid" : "cancelled"}, so it cannot be edited.{" "}
          <Link href={`/admin/invoices/${invoice.id}`} className="font-medium underline">
            Back to the invoice
          </Link>
        </p>
      ) : (
        <InvoiceForm key={invoice.updated_at} invoice={invoice} defaults={defaults} countries={countryOptions()} />
      )}
    </>
  );
}
