"use client";

import Link from "next/link";
import { ShoppingBag, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUiState } from "@/lib/account/use-ui-state";

/*
 * Account and cart links in the header. Pages are static, so the login state and cart count
 * come from the display cookie after hydration (the first paint shows the logged-out state).
 */

export function AccountLink() {
  const { signedIn } = useUiState();
  return (
    <Button asChild variant="ghost" size="icon" aria-label={signedIn ? "Your account" : "Log in"} title={signedIn ? "Your account" : "Log in"}>
      <Link href={signedIn ? "/account" : "/login"}>
        <UserRound className="size-5" />
      </Link>
    </Button>
  );
}

export function CartLink() {
  const { cartCount } = useUiState();
  return (
    <Button asChild variant="ghost" size="icon" aria-label={cartCount > 0 ? `Cart, ${cartCount} ${cartCount === 1 ? "color" : "colors"}` : "Cart"} className="relative">
      <Link href="/cart">
        <ShoppingBag className="size-5" />
        {cartCount > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-stitch-500 px-1 font-mono text-[10px] leading-none font-semibold text-denim-950">
            {cartCount > 99 ? "99+" : cartCount}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}
