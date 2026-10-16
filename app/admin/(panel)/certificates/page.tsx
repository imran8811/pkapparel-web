import type { Metadata } from "next";
import Image from "next/image";
import { AwardIcon, PencilIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/delete-button";
import { TextAreaField, TextField } from "@/components/admin/form";
import { ImageField } from "@/components/admin/image-field";
import { ItemDialog, ListItemSettings } from "@/components/admin/item-dialog";
import { EmptyState, NoAccess, PageHeader, Pill } from "@/components/admin/page-parts";
import { deleteCertification, saveCertification } from "@/lib/admin/actions/content";
import { can } from "@/lib/admin/permissions";
import { adminApi, getStaff } from "@/lib/admin/session";
import type { Certification } from "@/lib/admin/types";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Certificates" };

export default async function CertificatesPage() {
  const staff = await getStaff();
  if (!can(staff.role, "content")) return <NoAccess />;

  const certificates = await adminApi<Certification[]>("/v1/admin/certifications");
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHeader
        title="Certificates"
        description="Memberships, registrations and audits shown on the quality and about pages."
        actions={
          <ItemDialog
            title="Add a certificate"
            action={saveCertification}
            submitLabel="Add certificate"
            trigger={
              <Button size="sm">
                <PlusIcon />
                Add certificate
              </Button>
            }
          >
            <CertificateFields />
          </ItemDialog>
        }
      />

      {certificates.length === 0 ? (
        <EmptyState title="No certificates yet" />
      ) : (
        <ul className="overflow-hidden rounded-2xl border bg-white">
          {certificates.map((certificate) => {
            const expired = certificate.valid_until !== null && certificate.valid_until < today;
            return (
              <li key={certificate.id} className="flex items-center gap-4 border-b px-4 py-3.5 last:border-b-0 sm:px-5">
                <div className="relative aspect-[3/4] w-12 shrink-0 overflow-hidden rounded-md border bg-cotton-100">
                  {certificate.image_path ? (
                    <Image src={`/${certificate.image_path}`} alt="" fill sizes="48px" className="object-cover" />
                  ) : (
                    <AwardIcon className="absolute inset-0 m-auto size-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{certificate.name}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {[
                      certificate.issuer,
                      certificate.certificate_no ? `No. ${certificate.certificate_no}` : null,
                      certificate.valid_until ? `${expired ? "Expired" : "Valid until"} ${formatDate(certificate.valid_until)}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                {expired ? <Pill tone="orange">Expired</Pill> : null}
                {certificate.is_published ? null : <Pill tone="neutral">Hidden</Pill>}
                <div className="flex shrink-0">
                  <ItemDialog
                    title="Edit certificate"
                    action={saveCertification}
                    trigger={
                      <Button variant="ghost" size="icon-sm" aria-label={`Edit ${certificate.name}`}>
                        <PencilIcon />
                      </Button>
                    }
                  >
                    <input type="hidden" name="id" value={certificate.id} />
                    <CertificateFields certificate={certificate} />
                  </ItemDialog>
                  <DeleteButton
                    iconOnly
                    label={`Delete ${certificate.name}`}
                    title="Delete this certificate?"
                    description={certificate.name}
                    onConfirm={deleteCertification.bind(null, certificate.id)}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function CertificateFields({ certificate }: { certificate?: Certification }) {
  return (
    <>
      <TextField label="Name" name="name" defaultValue={certificate?.name} placeholder="e.g. Lahore Chamber of Commerce & Industry" maxLength={160} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Issued by" name="issuer" defaultValue={certificate?.issuer ?? ""} maxLength={160} />
        <TextField label="Certificate / membership number" name="certificate_no" defaultValue={certificate?.certificate_no ?? ""} maxLength={80} />
        <TextField label="Member since" name="member_since" type="date" defaultValue={certificate?.member_since ?? ""} />
        <TextField label="Valid until" name="valid_until" type="date" defaultValue={certificate?.valid_until ?? ""} hint="Leave empty if it does not expire." />
      </div>
      <TextAreaField label="Short description" name="description" defaultValue={certificate?.description ?? ""} rows={3} maxLength={500} />
      <ImageField
        name="image_path"
        folder="certificates"
        label="Certificate image"
        defaultValue={certificate?.image_path}
        previewClassName="aspect-[3/4] w-32"
        hint="A clear scan or photo. Hide personal ID numbers before uploading."
      />
      <ListItemSettings sortOrder={certificate?.sort_order} published={certificate?.is_published ?? true} />
    </>
  );
}
