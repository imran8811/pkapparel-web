"use client";

import Link from "next/link";
import { ShoppingBag, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUiState } from "@/lib/account/use-ui-state";

/*
 * Account and stock cart links in the stock pages' header. Pages are static, so the login state and the stock cart
 * count come from the display cookie after hydration (the first paint shows the logged-out state).
 */

export function StockAccountLink() {
  const { signedIn } = useUiState();
  return (
    <Button asChild variant="ghost" size="icon" aria-label={signedIn ? "Your account" : "Log in"} title={signedIn ? "Your account" : "Log in"}>
      <Link href={signedIn ? "/stock/account" : "/stock/login"}>
        <UserRound className="size-5" />
      </Link>
    </Button>
  );
}

export function StockCartLink() {
  const { stockCartCount: count } = useUiState();
  return (
    <Button asChild variant="ghost" size="icon" aria-label={count > 0 ? `Cart, ${count} ${count === 1 ? "color" : "colors"}` : "Cart"} className="relative">
      <Link href="/stock/cart">
        <ShoppingBag className="size-5" />
        {count > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-stitch-500 px-1 font-mono text-[10px] leading-none font-semibold text-denim-950">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}
