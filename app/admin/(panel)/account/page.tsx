import type { Metadata } from "next";
import { LogOutIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { LogoutButton } from "@/components/admin/logout-button";
import { PageHeader, Panel } from "@/components/admin/page-parts";
import { PasswordForm } from "@/components/admin/password-form";
import { ROLE_LABELS } from "@/lib/admin/permissions";
import { getStaff } from "@/lib/admin/session";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  const staff = await getStaff();

  return (
    <>
      <PageHeader title="My account" />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Panel title="Profile">
          <dl className="grid gap-4 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Name</dt>
              <dd className="mt-0.5 font-medium">{staff.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Email (used to log in)</dt>
              <dd className="mt-0.5 font-medium">{staff.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Role</dt>
              <dd className="mt-0.5 font-medium">{ROLE_LABELS[staff.role]}</dd>
            </div>
          </dl>
          <p className="mt-5 text-xs text-muted-foreground">To change your name, email or role, ask an administrator.</p>
          <div className="mt-5 border-t pt-5">
            <LogoutButton className={buttonVariants({ variant: "outline", size: "sm" })}>
              <LogOutIcon />
              Log out
            </LogoutButton>
          </div>
        </Panel>

        <Panel title="Change password" description="At least 10 characters. Other devices are logged out when you change it.">
          <PasswordForm />
        </Panel>
      </div>
    </>
  );
}
