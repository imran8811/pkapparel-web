import type { Metadata } from "next";
import { NoAccess, PageHeader, Pill } from "@/components/admin/page-parts";
import { AddStaffButton, EditStaffButton, ResetPasswordButton } from "@/components/admin/staff-manager";
import { can, ROLE_LABELS } from "@/lib/admin/permissions";
import { adminApi, getStaff } from "@/lib/admin/session";
import { formatRelative } from "@/lib/admin/time";
import type { Role } from "@/lib/admin/types";

export const metadata: Metadata = { title: "Staff accounts" };

type StaffAccount = { id: number; name: string; email: string; role: Role; is_active: boolean; last_login_at: string | null; created_at: string };

export default async function StaffPage() {
  const staff = await getStaff();
  if (!can(staff.role, "settings")) return <NoAccess />;

  const accounts = await adminApi<StaffAccount[]>("/v1/admin/staff");

  return (
    <>
      <PageHeader
        title="Staff accounts"
        description="Who can log in to the admin, and what they can do. Switching an account off logs that person out at once."
        actions={<AddStaffButton />}
      />
      <ul className="overflow-hidden rounded-2xl border bg-white">
        {accounts.map((account) => (
          <li key={account.id} className="flex flex-wrap items-center gap-3 border-b px-4 py-3.5 last:border-b-0 sm:px-5">
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">{account.name}</span>
                {account.id === staff.id ? <span className="text-xs text-muted-foreground">(you)</span> : null}
              </p>
              <p className="truncate text-sm text-muted-foreground">{account.email}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={account.role === "admin" ? "blue" : "neutral"}>{ROLE_LABELS[account.role]}</Pill>
              {account.is_active ? null : <Pill tone="muted">Off</Pill>}
              <span className="text-xs text-muted-foreground">{account.last_login_at ? `Last login ${formatRelative(account.last_login_at)}` : "Never logged in"}</span>
            </div>
            <div className="flex shrink-0 items-center">
              <EditStaffButton account={account} isSelf={account.id === staff.id} />
              {account.id !== staff.id ? <ResetPasswordButton id={account.id} name={account.name} /> : null}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
