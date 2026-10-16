import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** A contextual call to action placed before the footer on inner pages. */
export function CtaPanel({
  title,
  body,
  primary = { href: "/wholesale-shop", label: "Shop wholesale" },
  secondary = { href: "/request-quote", label: "Request a quote" },
  className,
}: {
  title: string;
  body: string;
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string };
  className?: string;
}) {
  return (
    <section className={cn("py-16 sm:py-20", className)}>
      <Container>
        <div className="flex flex-col gap-8 rounded-[2rem] border border-border bg-card p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl leading-[1.05] font-bold tracking-[-0.03em] sm:text-4xl">{title}</h2>
            <p className="mt-4 text-lg text-muted-foreground">{body}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={primary.href}>
                {primary.label} <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={secondary.href}>{secondary.label}</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
