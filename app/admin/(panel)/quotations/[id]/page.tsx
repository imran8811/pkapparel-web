import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalculatorIcon, DownloadIcon, EyeIcon, PencilIcon } from "lucide-react";
import { NoAccess, PageHeader, Panel } from "@/components/admin/page-parts";
import { QuotationActions } from "@/components/admin/quotation-actions";
import { QuotationStagePill, QuotationStyles, QuotationSummary } from "@/components/admin/quotation-parts";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { can } from "@/lib/admin/permissions";
import { adminApi, getStaff } from "@/lib/admin/session";
import { formatDateTime, formatDay } from "@/lib/admin/time";
import type { Quotation } from "@/lib/admin/types";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Quotation" };

export default async function QuotationPage({ params }: PageProps<"/admin/quotations/[id]">) {
  const staff = await getStaff();
  if (!can(staff.role, "quotations")) return <NoAccess />;
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const quotation = await adminApi<Quotation>(`/v1/admin/quotations/${id}`).catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  });
  const buyerName = quotation.buyer.company ?? quotation.buyer.contact_name ?? "";
  const styles = quotation.styles_count === 1 ? "1 style" : `${quotation.styles_count} styles`;

  return (
    <>
      <PageHeader
        back={{ href: "/admin/quotations", label: "Quotations" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono">{quotation.quotation_no}</span>
            <QuotationStagePill quotation={quotation} />
          </span>
        }
        description={`Quotation for ${buyerName} · ${styles}${quotation.total_qty > 0 ? ` · ${formatMoney(quotation.grand_total_cents, quotation.currency)}` : ""} · ${formatDay(quotation.issue_date)}`}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <a href={`/admin/quotations/${quotation.id}/pdf?view=1`} target="_blank" rel="noopener">
                <EyeIcon /> Preview PDF
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={`/admin/quotations/${quotation.id}/pdf`} download>
                <DownloadIcon /> Download
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={`/admin/quotations/${quotation.id}/costing?view=1`} target="_blank" rel="noopener" title="Every cost and the profit, for staff">
                <CalculatorIcon /> Costing sheet
              </a>
            </Button>
            {quotation.status === "open" ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/quotations/${quotation.id}/edit`}>
                  <PencilIcon /> Edit
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      {quotation.stage === "expired" ? (
        <p className="mb-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          The prices expired on {formatDay(quotation.valid_until)}. Edit the validity date (and the costs, if they changed) before sending it again, or make a revised copy.
        </p>
      ) : null}

      <div className="mb-6">
        <QuotationActions quotation={quotation} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
        <div className="grid min-w-0 gap-6 lg:col-span-2">
          <Panel title="Styles and prices" description="The buyer sees the price per piece. The costs and profit are only for staff (and on the costing sheet).">
            <QuotationStyles quotation={quotation} />
          </Panel>
          <Panel title="Quotation">
            <QuotationSummary quotation={quotation} />
          </Panel>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-6">
          <Panel title="Status">
            <dl className="grid gap-3 text-sm">
              <Item label="Stage" value={quotation.stage_label} />
              <Item label="Emailed" value={quotation.sent_at ? `${formatDateTime(quotation.sent_at)} to ${quotation.sent_to}` : "Not yet"} />
              {quotation.decided_at ? <Item label={quotation.status === "accepted" ? "Accepted" : "Declined"} value={formatDateTime(quotation.decided_at)} /> : null}
              <Item label="Made" value={`${formatDateTime(quotation.created_at)}${quotation.created_by ? ` by ${quotation.created_by}` : ""}`} />
              {quotation.updated_at !== quotation.created_at ? <Item label="Last changed" value={formatDateTime(quotation.updated_at)} /> : null}
              {quotation.inquiry ? (
                <Item
                  label="Quote request"
                  value={
                    <Link href={`/admin/inquiries/${quotation.inquiry.id}`} className="font-mono font-medium text-denim-600 hover:underline">
                      {quotation.inquiry.reference}
                    </Link>
                  }
                />
              ) : null}
              {quotation.customer ? (
                <Item
                  label="Buyer account"
                  value={
                    <Link href={`/admin/customers/${quotation.customer.id}`} className="font-medium text-denim-600 hover:underline">
                      {quotation.customer.company_name}
                    </Link>
                  }
                />
              ) : null}
            </dl>
          </Panel>

          {quotation.staff_notes ? (
            <Panel title="Staff notes">
              <p className="text-sm whitespace-pre-line">{quotation.staff_notes}</p>
            </Panel>
          ) : null}
        </div>
      </div>
    </>
  );
}

function Item({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
