import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · PK Apparel" },
  robots: { index: false, follow: false },
};

/** Everything under /admin: staff only, never indexed. */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      {children}
      <Toaster position="bottom-right" />
    </>
  );
}
