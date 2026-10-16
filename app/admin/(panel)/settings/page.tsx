import type { Metadata } from "next";
import { NoAccess, PageHeader } from "@/components/admin/page-parts";
import { SettingsForms } from "@/components/admin/settings-forms";
import { can } from "@/lib/admin/permissions";
import { adminApi, getStaff } from "@/lib/admin/session";
import type { AdminSettings } from "@/lib/admin/types";

export const metadata: Metadata = { title: "Company & business" };

export default async function SettingsPage() {
  const staff = await getStaff();
  if (!can(staff.role, "settings")) return <NoAccess />;

  const settings = await adminApi<AdminSettings>("/v1/admin/settings");

  return (
    <>
      <PageHeader
        title="Company & business"
        description="Facts used all over the website: contact details, addresses, links and the shop's business rules. Each section saves on its own."
      />
      <SettingsForms settings={settings} />
    </>
  );
}
