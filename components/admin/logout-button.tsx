"use client";

import { useTransition, type ReactNode } from "react";
import { logout } from "@/lib/admin/actions/auth";

/**
 * Logs out, then reloads the page completely. Next.js keeps recently visited pages
 * alive in the background (with their data), so a full reload makes sure nothing
 * from the admin stays in the browser for the next person at this computer.
 */
export function LogoutButton({ className, children }: { className?: string; children: ReactNode }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className={className}
      onClick={() =>
        startTransition(async () => {
          await logout().catch(() => undefined);
          window.location.replace("/admin/login");
        })
      }
    >
      {children}
    </button>
  );
}
