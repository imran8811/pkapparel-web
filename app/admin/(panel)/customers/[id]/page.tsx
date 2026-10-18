import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MailIcon } from "lucide-react";
import { CustomerStatusForm } from "@/components/admin/customer-status-form";
import { EmptyState, NoAccess, OrderStatusPill, PageHeader, Panel, Pill } from "@/components/admin/page-parts";
import { ApiError } from "@/lib/api";
import { BUSINESS_TYPES } from "@/lib/account/types";
import { can } from "@/lib/admin/permissions";
import { adminApi, getStaff } from "@/lib/admin/session";
import { formatDateTime, formatDay } from "@/lib/admin/time";
import type { AdminCustomerDetail } from "@/lib/admin/types";
import { countryName, formatMoney } from "@/lib/format";
import { whatsappUrl } from "@/lib/links";

export const metadata: Metadata = { title: "Customer" };

export default async function CustomerPage({ params }: PageProps<"/admin/customers/[id]">) {
  const staff = await getStaff();
  if (!can(staff.role, "customers")) return <NoAccess />;
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  let customer: AdminCustomerDetail;
  try {
    customer = await adminApi<AdminCustomerDetail>(`/v1/admin/customers/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  const business = BUSINESS_TYPES.find((type) => type.value === customer.business_type)?.label;

  return (
    <>
      <PageHeader
        back={{ href: "/admin/customers", label: "Customers" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {customer.company_name}
            {customer.status === "blocked" ? <Pill tone="red">Blocked</Pill> : null}
            {!customer.email_verified ? <Pill tone="orange">Email not confirmed</Pill> : null}
          </span>
        }
        description={`${customer.contact_name} · ${business ?? customer.business_type} · ${countryName(customer.country_code)}`}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
        <div className="grid min-w-0 grid-cols-1 gap-6 lg:col-span-2">
          <Panel title="Orders">
            {customer.orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              <ul className="divide-y">
                {customer.orders.map((order) => (
                  <li key={order.id}>
                    <Link href={`/admin/orders/${order.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm hover:text-denim-600">
                      <span className="min-w-0">
                        <span className="font-mono font-medium">{order.order_no}</span>
                        <span className="ml-2 text-muted-foreground">
                          {formatDay(order.placed_at)} · {order.total_pcs} pcs · {order.styles.join(", ")}
                        </span>
                      </span>
                      <span className="flex items-center gap-3">
                        <span className="tabular-nums">{formatMoney(order.total_cents)}</span>
                        <OrderStatusPill status={order.status} dueNowCents={order.due_now_cents} kind={order.kind} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Addresses">
            {customer.addresses.length === 0 ? (
              <EmptyState title="No addresses yet">The buyer adds them at checkout.</EmptyState>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {customer.addresses.map((address) => (
                  <address key={address.id} className="rounded-xl border p-4 text-sm leading-relaxed not-italic text-muted-foreground">
                    <span className="font-medium text-foreground">{address.company}</span>
                    {address.is_default ? <span className="ml-2 text-xs text-denim-600">Default</span> : null}
                    <br />
                    {address.contact_name}, {address.phone}
                    <br />
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ""}
                    <br />
                    {[address.postal_code, address.city].filter(Boolean).join(" ")}
                    {address.state ? `, ${address.state}` : ""}, {countryName(address.country_code)}
                    {address.tax_id ? (
                      <>
                        <br />
                        Tax / import ID: {address.tax_id}
                      </>
                    ) : null}
                  </address>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <aside className="grid min-w-0 grid-cols-1 gap-6">
          <Panel title="Contact">
            <div className="grid gap-1.5 text-sm">
              <a href={`mailto:${customer.email}`} className="inline-flex items-center gap-1.5 break-all text-denim-600 hover:underline">
                <MailIcon className="size-4 shrink-0" /> {customer.email}
              </a>
              <a href={whatsappUrl(customer.phone.replace(/\D/g, ""))} target="_blank" rel="noopener noreferrer" className="text-denim-600 hover:underline">
                WhatsApp {customer.phone}
              </a>
              {customer.website ? (
                <a href={customer.website} target="_blank" rel="noopener noreferrer nofollow" className="break-all text-denim-600 hover:underline">
                  {customer.website}
                </a>
              ) : null}
            </div>
            <dl className="mt-4 grid gap-1 text-xs text-muted-foreground">
              <div>Joined {formatDateTime(customer.created_at)}</div>
              <div>{customer.email_verified_at ? `Email confirmed ${formatDateTime(customer.email_verified_at)}` : "Email not confirmed yet (needed to order)"}</div>
              <div>{customer.last_login_at ? `Last login ${formatDateTime(customer.last_login_at)}` : "Never logged in since signing up"}</div>
            </dl>
          </Panel>

          <Panel title="Account" description="Blocking logs the buyer out everywhere and stops logins. Orders stay as they are.">
            <CustomerStatusForm key={`${customer.status}${customer.staff_notes}`} customer={customer} />
          </Panel>
        </aside>
      </div>
    </>
  );
}
