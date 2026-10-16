import { Suspense } from "react";
import { AdminBrand, MobileBar, NavSkeleton, SidebarNav } from "@/components/admin/shell";

/**
 * The admin frame. The sidebar and header are static; the parts that depend on the
 * logged-in staff member (menu items for their role, name, log out) stream in.
 * Each page checks access through the API, so the layout itself does no auth check.
 */
export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh bg-cotton-50">
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col bg-denim-900 text-cotton-50 lg:flex">
        <div className="px-6 pt-6">
          <AdminBrand />
        </div>
        <Suspense fallback={<NavSkeleton />}>
          <SidebarNav />
        </Suspense>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-denim-900 px-4 text-white lg:hidden">
          <AdminBrand />
          <Suspense fallback={<span className="size-8" />}>
            <MobileBar />
          </Suspense>
        </header>
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
