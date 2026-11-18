import type { Metadata } from "next";
import Link from "next/link";
import { PaperclipIcon } from "lucide-react";
import { NoAccess, PageHeader, Panel } from "@/components/admin/page-parts";
import { QuotationForm, type QuotationStart } from "@/components/admin/quotation-form";
import { ApiError } from "@/lib/api";
import { buyerFromAccount } from "@/lib/admin/actions/invoices";
import { detailLabel } from "@/lib/admin/labels";
import { can } from "@/lib/admin/permissions";
import { adminApi, getStaff } from "@/lib/admin/session";
import type { Inquiry, QuotationDefaults } from "@/lib/admin/types";
import { countryOptions } from "@/lib/format";

export const metadata: Metadata = { title: "New quotation" };

/**
 * /admin/quotations/new?inquiry=42 (a quote request's "Make a quotation") or ?customer=12 (a buyer account): the buyer
 * is filled in. From a quote request, its message and files stay in view while the styles are costed.
 */
export default async function NewQuotationPage({ searchParams }: PageProps<"/admin/quotations/new">) {
  const staff = await getStaff();
  if (!can(staff.role, "quotations")) return <NoAccess />;

  const search = (await searchParams) as { customer?: string; inquiry?: string };
  const idOf = (value?: string) => (/^\d+$/.test(value ?? "") ? Number(value) : null);
  const customerId = idOf(search.customer);
  const inquiryId = idOf(search.inquiry);

  const [defaults, account, inquiry] = await Promise.all([
    adminApi<QuotationDefaults>("/v1/admin/quotations/defaults"),
    customerId ? buyerFromAccount(customerId) : Promise.resolve(null),
    inquiryId
      ? adminApi<Inquiry>(`/v1/admin/inquiries/${inquiryId}`).catch((error: unknown) => {
          if (error instanceof ApiError && (error.status === 404 || error.status === 403)) return null;
          throw error;
        })
      : Promise.resolve(null),
  ]);

  const start: QuotationStart | null =
    account || inquiry
      ? {
          buyer: account?.buyer ?? {
            company: inquiry?.company ?? null,
            contact_name: inquiry?.name ?? null,
            email: inquiry?.email ?? null,
            phone: inquiry?.phone ?? null,
            address: null,
            country_code: inquiry?.country_code ?? "",
            tax_id: null,
          },
          customer: account ? { id: account.customerId, label: `${account.buyer.company ?? account.buyer.contact_name} · ${account.buyer.email}` } : null,
          inquiry: inquiry ? { id: inquiry.id, reference: inquiry.reference } : null,
        }
      : null;
  const details = inquiry ? Object.entries(inquiry.details) : [];

  return (
    <>
      <PageHeader
        back={{ href: "/admin/quotations", label: "Quotations" }}
        title="New quotation"
        description="Cost each style the buyer asked for; the price per piece is worked out as you type. The number is given when you create it."
      />
      {inquiry ? (
        <Panel title={`The quote request ${inquiry.reference}`} description={`From ${inquiry.name}${inquiry.company ? `, ${inquiry.company}` : ""}.`} className="mb-6">
          <p className="max-h-48 overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap">{inquiry.message}</p>
          {details.length > 0 ? (
            <dl className="mt-4 grid gap-x-6 gap-y-2 border-t pt-4 text-sm sm:grid-cols-3">
              {details.map(([key, value]) => (
                <div key={key} className="min-w-0">
                  <dt className="text-xs text-muted-foreground">{detailLabel(key)}</dt>
                  <dd className="break-words">{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {inquiry.files.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t pt-4">
              {inquiry.files.map((file) => (
                <li key={file.id}>
                  <a href={`/admin/inquiry-files/${file.id}`} download className="inline-flex items-center gap-1.5 text-sm font-medium text-denim-600 hover:underline">
                    <PaperclipIcon className="size-3.5" /> {file.name}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-4 text-xs text-muted-foreground">
            <Link href={`/admin/inquiries/${inquiry.id}`} className="hover:underline">
              Open the request
            </Link>
          </p>
        </Panel>
      ) : null}
      <QuotationForm defaults={defaults} countries={countryOptions()} start={start} />
    </>
  );
}
