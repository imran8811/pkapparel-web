import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, Pill } from "@/components/admin/page-parts";
import { INQUIRY_STATUSES, INQUIRY_TYPES } from "@/lib/admin/labels";
import { adminApi, getStaff } from "@/lib/admin/session";
import { ADMIN_TIME_ZONE, formatRelative } from "@/lib/admin/time";
import type { Dashboard } from "@/lib/admin/types";
import { countryName } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

function greeting(): string {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: ADMIN_TIME_ZONE }).format(new Date()));
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

export default async function DashboardPage() {
  const [staff, dashboard] = await Promise.all([getStaff(), adminApi<Dashboard>("/v1/admin/dashboard")]);
  const { orders, customers, inquiries, content } = dashboard;

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${staff.name.split(" ")[0]}`}
        description="What needs attention today."
        actions={
          content ? (
            <Button asChild size="sm">
              <Link href="/admin/blog/new">
                <PlusIcon />
                New blog post
              </Link>
            </Button>
          ) : null
        }
      />

      {orders ? (
        <div className="mb-6">
          <h2 className="mb-3 font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">Wholesale shop</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Payments to check" value={orders.payments_to_check} href="/admin/orders?status=payment_review" highlight={orders.payments_to_check > 0} />
            <Stat label="Orders awaiting the deposit" value={orders.awaiting_deposit} href="/admin/orders?status=awaiting_deposit" />
            <Stat label="Open orders" value={orders.open} href="/admin/orders" />
            {customers ? <Stat label="New buyer accounts (30 days)" value={customers.new_30_days} href="/admin/customers" /> : null}
          </div>
        </div>
      ) : null}

      {inquiries ? (
        <div className="grid grid-cols-1 gap-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="New inquiries" value={inquiries.new} href="/admin/inquiries?status=new" highlight={inquiries.new > 0} />
            <Stat label="Open (new, in progress, quoted)" value={inquiries.open} href="/admin/inquiries" />
            <Stat label="Received in the last 30 days" value={inquiries.last_30_days} href="/admin/inquiries?status=all" />
          </div>

          <Panel title="Latest inquiries">
            {inquiries.latest.length === 0 ? (
              <p className="text-sm text-muted-foreground">No inquiries yet. Messages from the contact, quote and sample forms appear here.</p>
            ) : (
              <ul className="-my-3 divide-y">
                {inquiries.latest.map((inquiry) => (
                  <li key={inquiry.id}>
                    <Link href={`/admin/inquiries/${inquiry.id}`} className="group flex items-start gap-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                          <span className="font-medium group-hover:text-denim-600">{inquiry.name}</span>
                          {inquiry.company ? <span className="text-muted-foreground">· {inquiry.company}</span> : null}
                          {inquiry.country_code ? <span className="text-muted-foreground">· {countryName(inquiry.country_code)}</span> : null}
                        </p>
                        <p className="mt-0.5 truncate text-sm text-muted-foreground">
                          <span className="text-foreground/80">{INQUIRY_TYPES[inquiry.type]}:</span> {inquiry.preview}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Pill tone={INQUIRY_STATUSES[inquiry.status].tone}>{INQUIRY_STATUSES[inquiry.status].label}</Pill>
                        <span className="text-xs text-muted-foreground">{formatRelative(inquiry.created_at)}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/admin/inquiries" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-denim-600 hover:underline">
              All inquiries <ArrowRightIcon className="size-3.5" />
            </Link>
          </Panel>
        </div>
      ) : null}

      {content ? (
        <div className={inquiries ? "mt-6" : undefined}>
          <h2 className="mb-3 font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">Website content</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label="Blog posts"
              value={content.posts.published}
              href="/admin/blog"
              note={[
                content.posts.drafts ? `${content.posts.drafts} draft${content.posts.drafts === 1 ? "" : "s"}` : null,
                content.posts.scheduled ? `${content.posts.scheduled} scheduled` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            />
            <Stat label="FAQs" value={content.faqs} href="/admin/faqs" />
            <Stat label="Buyer reviews" value={content.testimonials} href="/admin/reviews" />
            <Stat label="Certificates" value={content.certifications} href="/admin/certificates" />
          </div>
        </div>
      ) : null}

    </>
  );
}

function Stat({ label, value, href, note, highlight }: { label: string; value: number; href: string; note?: string; highlight?: boolean }) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border bg-white p-5 transition-colors hover:border-denim-300 data-[highlight=true]:border-stitch-300 data-[highlight=true]:bg-orange-50/60"
      data-highlight={highlight ? "true" : undefined}
    >
      <p className="font-heading text-3xl font-semibold tracking-tight text-denim-950 tabular-nums">{value.toLocaleString("en-US")}</p>
      <p className="mt-1 text-sm text-muted-foreground group-hover:text-foreground">{label}</p>
      {note ? <p className="mt-2 text-xs text-muted-foreground">{note}</p> : null}
    </Link>
  );
}
