import type { Role } from "@/lib/admin/types";

/*
 * Who may use which part of the admin. The API enforces the same rules;
 * these only decide what the panel shows.
 */
const ACCESS = {
  content: ["admin", "editor"],
  inquiries: ["admin", "sales"],
  orders: ["admin", "sales", "production"],
  customers: ["admin", "sales"],
  /** Shipping rates and add-ons (prices used at checkout). */
  commerce: ["admin", "sales"],
  settings: ["admin"],
} as const satisfies Record<string, readonly Role[]>;

export type Area = keyof typeof ACCESS;

export function can(role: Role, area: Area): boolean {
  return (ACCESS[area] as readonly Role[]).includes(role);
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrator",
  editor: "Editor",
  sales: "Sales",
  production: "Production",
};
