import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NoAccess, PageHeader } from "@/components/admin/page-parts";
import { QuotationForm } from "@/components/admin/quotation-form";
import { ApiError } from "@/lib/api";
import { can } from "@/lib/admin/permissions";
import { adminApi, getStaff } from "@/lib/admin/session";
import type { Quotation, QuotationDefaults } from "@/lib/admin/types";
import { countryOptions } from "@/lib/format";

export const metadata: Metadata = { title: "Edit quotation" };

export default async function EditQuotationPage({ params, searchParams }: PageProps<"/admin/quotations/[id]/edit">) {
  const staff = await getStaff();
  if (!can(staff.role, "quotations")) return <NoAccess />;
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  // "Make a revised copy" opens the new quotation here.
  const copied = (await searchParams).created === "1";

  let quotation: Quotation;
  let defaults: QuotationDefaults;
  try {
    [quotation, defaults] = await Promise.all([adminApi<Quotation>(`/v1/admin/quotations/${id}`), adminApi<QuotationDefaults>("/v1/admin/quotations/defaults")]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <>
      <PageHeader
        back={{ href: `/admin/quotations/${quotation.id}`, label: quotation.quotation_no }}
        title={`Edit quotation ${quotation.quotation_no}`}
        description="Changes show in the PDFs straight away. If it was already emailed, send it again so the buyer has the new prices."
      />
      {copied ? (
        <p className="mb-6 rounded-xl bg-denim-50 px-4 py-3 text-sm text-denim-800">
          A revised copy was made as <strong className="font-mono">{quotation.quotation_no}</strong>, dated today. Change the costs or prices, then save.
        </p>
      ) : null}
      {quotation.status !== "open" ? (
        <p className="rounded-xl bg-orange-50 px-4 py-3 text-sm text-stitch-700">
          This quotation is marked as {quotation.status}, so it cannot be edited. Reopen it first, or make a revised copy.{" "}
          <Link href={`/admin/quotations/${quotation.id}`} className="font-medium underline">
            Back to the quotation
          </Link>
        </p>
      ) : (
        <QuotationForm key={quotation.updated_at} quotation={quotation} defaults={defaults} countries={countryOptions()} />
      )}
    </>
  );
}
