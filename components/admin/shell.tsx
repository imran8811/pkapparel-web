import Link from "next/link";
import { ExternalLinkIcon, LogOutIcon } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { MobileNav } from "@/components/admin/mobile-nav";
import { NavLinks } from "@/components/admin/nav-links";
import { LogoutButton } from "@/components/admin/logout-button";
import { ROLE_LABELS } from "@/lib/admin/permissions";
import { getStaff } from "@/lib/admin/session";
import type { Staff } from "@/lib/admin/types";

/*
 * Parts of the admin frame that depend on who is logged in. Each one reads the
 * session, so the panel layout renders them inside <Suspense>.
 */

export function AdminBrand() {
  return (
    <Link href="/admin" className="flex items-center gap-3 text-white">
      <LogoMark className="h-8 w-auto" />
      <span className="font-mono text-[10px] leading-[1.6] tracking-[0.22em] text-cotton-50/60 uppercase">
        PK Apparel
        <br />
        Admin
      </span>
    </Link>
  );
}

export async function SidebarNav() {
  const staff = await getStaff();
  return (
    <>
      <div className="flex-1 overflow-y-auto px-3 py-6">
        <NavLinks role={staff.role} />
      </div>
      <div className="border-t border-white/10 p-3">
        <StaffCard staff={staff} />
      </div>
    </>
  );
}

export async function MobileBar() {
  const staff = await getStaff();
  return <MobileNav role={staff.role} footer={<StaffCard staff={staff} />} />;
}

function StaffCard({ staff }: { staff: Staff }) {
  return (
    <div className="grid grid-cols-1 gap-2">
      <div className="min-w-0 px-3">
        <p className="truncate text-sm font-medium text-white">{staff.name}</p>
        <p className="truncate text-xs text-cotton-50/55">{ROLE_LABELS[staff.role]}</p>
      </div>
      <div className="flex gap-1">
        <Link
          href="/"
          target="_blank"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-cotton-50/75 hover:bg-white/8 hover:text-white"
        >
          <ExternalLinkIcon className="size-3.5" />
          Website
        </Link>
        <LogoutButton className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-cotton-50/75 hover:bg-white/8 hover:text-white">
          <LogOutIcon className="size-3.5" />
          Log out
        </LogoutButton>
      </div>
    </div>
  );
}

export function NavSkeleton() {
  return (
    <div className="grid flex-1 content-start gap-2 px-6 py-6" aria-hidden>
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="h-4 animate-pulse rounded bg-white/10" style={{ width: `${55 + ((index * 17) % 35)}%` }} />
      ))}
    </div>
  );
}
