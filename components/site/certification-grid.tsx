import Image from "next/image";
import { BadgeCheck } from "lucide-react";
import { type Certification, mediaSrc } from "@/lib/content";
import { cn } from "@/lib/utils";

export function CertificationGrid({ certifications, className }: { certifications: Certification[]; className?: string }) {
  return (
    <ul className={cn("grid gap-4 md:grid-cols-2", className)}>
      {certifications.map((cert) => (
        <li key={cert.id} className="flex gap-5 rounded-3xl border border-border bg-card p-5 sm:p-6">
          {cert.image ? (
            <div className="relative aspect-[4/5] w-24 shrink-0 self-start overflow-hidden rounded-xl bg-cotton-100 ring-1 ring-border sm:w-28">
              <Image src={mediaSrc(cert.image.path)} alt={cert.image.alt} fill sizes="112px" className="object-cover" />
            </div>
          ) : (
            <div className="grid aspect-[4/5] w-24 shrink-0 place-items-center self-start rounded-xl bg-denim-50 sm:w-28">
              <BadgeCheck aria-hidden className="size-9 text-denim-600" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-heading text-lg leading-snug font-semibold">{cert.name}</p>
            {cert.issuer && <p className="mt-1 text-sm text-muted-foreground">{cert.issuer}</p>}
            <dl className="mt-3 space-y-1 font-mono text-xs text-muted-foreground">
              {cert.certificate_no && (
                <div className="flex gap-2">
                  <dt>No.</dt>
                  <dd className="text-foreground">{cert.certificate_no}</dd>
                </div>
              )}
              {cert.member_since && (
                <div className="flex gap-2">
                  <dt>Member since</dt>
                  <dd className="text-foreground">{new Date(cert.member_since).getUTCFullYear()}</dd>
                </div>
              )}
            </dl>
            {cert.description && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{cert.description}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}
