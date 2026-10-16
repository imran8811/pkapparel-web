"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AwardIcon,
  BadgePlusIcon,
  FactoryIcon,
  FileTextIcon,
  RulerIcon,
  ShirtIcon,
  TagsIcon,
  TruckIcon,
  UsersIcon,
  HelpCircleIcon,
  InboxIcon,
  LayoutDashboardIcon,
  MessageSquareQuoteIcon,
  NewspaperIcon,
  ReceiptTextIcon,
  SettingsIcon,
  UserIcon,
  type LucideIcon,
} from "lucide-react";
import { can, type Area } from "@/lib/admin/permissions";
import type { Role } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon; area?: Area };

const SECTIONS: { title?: string; items: NavItem[] }[] = [
  { items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboardIcon }] },
  {
    title: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ReceiptTextIcon, area: "orders" },
      { href: "/admin/customers", label: "Customers", icon: UsersIcon, area: "customers" },
      { href: "/admin/inquiries", label: "Inquiries", icon: InboxIcon, area: "inquiries" },
    ],
  },
  {
    title: "Shop",
    items: [
      { href: "/admin/products", label: "Styles", icon: ShirtIcon, area: "content" },
      { href: "/admin/size-charts", label: "Size charts", icon: RulerIcon, area: "content" },
      { href: "/admin/shop-texts", label: "Category texts", icon: TagsIcon, area: "content" },
      { href: "/admin/shipping", label: "Shipping rates", icon: TruckIcon, area: "commerce" },
      { href: "/admin/addons", label: "Add-ons", icon: BadgePlusIcon, area: "commerce" },
    ],
  },
  {
    title: "Website",
    items: [
      { href: "/admin/blog", label: "Blog", icon: NewspaperIcon, area: "content" },
      { href: "/admin/faqs", label: "FAQs", icon: HelpCircleIcon, area: "content" },
      { href: "/admin/reviews", label: "Buyer reviews", icon: MessageSquareQuoteIcon, area: "content" },
      { href: "/admin/certificates", label: "Certificates", icon: AwardIcon, area: "content" },
      { href: "/admin/factory", label: "Factory", icon: FactoryIcon, area: "content" },
      { href: "/admin/pages", label: "Legal pages", icon: FileTextIcon, area: "content" },
    ],
  },
  {
    title: "Settings",
    items: [
      { href: "/admin/settings", label: "Company & business", icon: SettingsIcon, area: "settings" },
      { href: "/admin/account", label: "My account", icon: UserIcon },
    ],
  },
];

export function NavLinks({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="grid gap-5">
      {SECTIONS.map((section, index) => {
        const items = section.items.filter((item) => !item.area || can(role, item.area));
        if (items.length === 0) return null;
        return (
          <div key={section.title ?? index} className="grid gap-0.5">
            {section.title ? (
              <p className="px-3 pb-1 font-mono text-[10px] tracking-[0.2em] text-cotton-50/45 uppercase">{section.title}</p>
            ) : null}
            {items.map((item) => {
              const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-cotton-50/75 transition-colors hover:bg-white/8 hover:text-white",
                    active && "bg-white/12 text-white shadow-[inset_3px_0_0_var(--color-stitch-500)]",
                  )}
                >
                  <item.icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
