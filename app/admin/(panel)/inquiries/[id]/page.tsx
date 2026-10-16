import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MailIcon, MessageCircleIcon, PhoneIcon } from "lucide-react";
import { InquiryFollowUpForm } from "@/components/admin/inquiry-follow-up-form";
import { NoAccess, PageHeader, Panel, Pill } from "@/components/admin/page-parts";
import { ApiError } from "@/lib/api";
import { detailLabel, INQUIRY_STATUSES, INQUIRY_TYPES } from "@/lib/admin/labels";
import { can } from "@/lib/admin/permissions";
import { adminApi, getStaff } from "@/lib/admin/session";
import { formatDateTime } from "@/lib/admin/time";
import type { Inquiry } from "@/lib/admin/types";
import { countryName } from "@/lib/format";
import { whatsappUrl } from "@/lib/links";

export const metadata: Metadata = { title: "Inquiry" };

export default async function InquiryPage({ params }: PageProps<"/admin/inquiries/[id]">) {
  const staff = await getStaff();
  if (!can(staff.role, "inquiries")) return <NoAccess />;

  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const inquiry = await adminApi<Inquiry>(`/v1/admin/inquiries/${id}`).catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  });

  const status = INQUIRY_STATUSES[inquiry.status];
  const details = Object.entries(inquiry.details);
  const replySubject = encodeURIComponent(`Re: your ${INQUIRY_TYPES[inquiry.type].toLowerCase()} (${inquiry.reference})`);
  const phoneDigits = inquiry.phone?.replace(/\D/g, "") ?? "";

  return (
    <>
      <PageHeader
        back={{ href: "/admin/inquiries", label: "Inquiries" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {inquiry.name}
            <Pill tone={status.tone}>{status.label}</Pill>
          </span>
        }
        description={`${INQUIRY_TYPES[inquiry.type]} ${inquiry.reference} · received ${formatDateTime(inquiry.created_at)}`}
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-6">
          <Panel title="Message">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{inquiry.message}</p>
            {details.length > 0 ? (
              <dl className="mt-6 grid gap-x-6 gap-y-3 border-t pt-5 text-sm sm:grid-cols-2">
                {details.map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-xs text-muted-foreground">{detailLabel(key)}</dt>
                    <dd className="mt-0.5 font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </Panel>

          <Panel title="Follow-up" description="Only staff see these notes.">
            <InquiryFollowUpForm key={inquiry.updated_at} id={inquiry.id} status={inquiry.status} notes={inquiry.notes ?? ""} />
            {inquiry.handled_by ? (
              <p className="mt-4 text-xs text-muted-foreground">
                Last updated by {inquiry.handled_by.name ?? "a former staff member"} · {formatDateTime(inquiry.updated_at)}
              </p>
            ) : null}
          </Panel>
        </div>

        <div className="grid gap-6">
          <Panel title="Contact">
            <dl className="grid gap-3 text-sm">
              {inquiry.company ? <Row label="Company" value={inquiry.company} /> : null}
              <Row label="Email" value={inquiry.email} />
              {inquiry.phone ? <Row label="Phone" value={inquiry.phone} /> : null}
              {inquiry.country_code ? <Row label="Country" value={countryName(inquiry.country_code)} /> : null}
            </dl>
            <div className="mt-5 grid gap-2">
              <a
                href={`mailto:${inquiry.email}?subject=${replySubject}`}
                className="flex items-center justify-center gap-2 rounded-full bg-denim-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-denim-700"
              >
                <MailIcon className="size-4" /> Reply by email
              </a>
              {phoneDigits.length >= 8 ? (
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={whatsappUrl(phoneDigits)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-sm hover:border-denim-300"
                  >
                    <MessageCircleIcon className="size-4" /> WhatsApp
                  </a>
                  <a href={`tel:+${phoneDigits}`} className="flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-sm hover:border-denim-300">
                    <PhoneIcon className="size-4" /> Call
                  </a>
                </div>
              ) : null}
            </div>
          </Panel>

          <Panel title="Technical details">
            <dl className="grid gap-3 text-xs">
              {inquiry.source_url ? <Row label="Sent from" value={inquiry.source_url} /> : null}
              {inquiry.ip_address ? <Row label="IP address" value={inquiry.ip_address} /> : null}
              {inquiry.user_agent ? <Row label="Browser" value={inquiry.user_agent} /> : null}
            </dl>
          </Panel>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words">{value}</dd>
    </div>
  );
}
