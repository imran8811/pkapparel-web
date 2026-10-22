import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { Eyebrow } from "@/components/brand/eyebrow";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

export const metadata: Metadata = {
  title: "Style guide",
  robots: { index: false, follow: false },
};

const palettes = [
  {
    name: "Denim",
    note: "Cobalt blues (600 = logo blue #0048AC) for accents; navy 800-950 for text, dark sections and main buttons.",
    swatches: [
      ["50", "#f2f6fd"], ["100", "#e4ecfa"], ["200", "#c8d8f4"], ["300", "#9bb8ea"], ["400", "#5d8ddb"],
      ["500", "#2a67c9"], ["600", "#0048ac"], ["700", "#003b8e"], ["800", "#13204a"], ["900", "#0b132b"], ["950", "#070c1f"],
    ],
  },
  {
    name: "Stitch",
    note: "Accent. One key action per section, highlights.",
    swatches: [["300", "#f7b985"], ["400", "#f09a55"], ["500", "#e57a2e"], ["600", "#c8621c"], ["700", "#9f4b15"]],
  },
  {
    name: "Cotton",
    note: "Backgrounds and quiet surfaces.",
    swatches: [["50", "#fbfaf7"], ["100", "#f5f2eb"], ["200", "#eae4d8"], ["300", "#d9d0bf"]],
  },
] as const;

type Health = { status: string; database: string; time: string };

async function checkApi(): Promise<{ ok: true; health: Health } | { ok: false; message: string }> {
  try {
    return { ok: true, health: await api<Health>("/v1/health", { timeoutMs: 3000 }) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "The API could not be reached." };
  }
}

async function ApiStatus() {
  await connection();
  const result = await checkApi();

  if (!result.ok) {
    return (
      <p className="flex items-center gap-2 text-sm text-destructive">
        <span className="size-2.5 rounded-full bg-destructive" />
        {result.message}
      </p>
    );
  }

  const { health } = result;
  return (
    <p className="flex items-center gap-2 text-sm">
      <span className={`size-2.5 rounded-full ${health.status === "ok" ? "bg-emerald-500" : "bg-amber-500"}`} />
      API {health.status} · database {health.database} · {health.time}
    </p>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-dashed border-border py-12">
      <h2 className="mb-8 font-mono text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">{title}</h2>
      {children}
    </section>
  );
}

/** Development-only overview of the design system. Not available on the live site. */
export default function StyleguidePage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <Container className="py-16">
      <Eyebrow>Design system</Eyebrow>
      <h1 className="mt-5 text-5xl font-bold tracking-[-0.03em]">Indigo &amp; Stitch</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        Raw denim indigo, the orange of contrast stitching, warm cotton and bold industrial type.
      </p>
      <div className="mt-6 rounded-2xl border border-border bg-card px-5 py-4">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Checking API…</p>}>
          <ApiStatus />
        </Suspense>
      </div>

      <Section title="Colors">
        <div className="space-y-10">
          {palettes.map((palette) => (
            <div key={palette.name}>
              <p className="font-heading text-xl font-semibold">{palette.name}</p>
              <p className="text-sm text-muted-foreground">{palette.note}</p>
              <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-11">
                {palette.swatches.map(([step, hex]) => (
                  <div key={step}>
                    <div className="h-16 rounded-xl ring-1 ring-black/5" style={{ background: hex }} />
                    <p className="mt-2 font-mono text-[11px]">{step}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">{hex}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typography">
        <div className="space-y-6">
          <p className="text-[5.5rem] leading-[0.92] font-bold tracking-[-0.035em] font-heading">Display</p>
          <p className="text-5xl font-bold tracking-[-0.03em] font-heading">Heading 2 · Bricolage Grotesque</p>
          <p className="text-2xl font-semibold font-heading">Heading 3 · for cards and steps</p>
          <p className="max-w-2xl text-lg leading-relaxed">
            Body large · Geist Sans. Jeans, jackets, T-shirts, hoodies and polo shirts for men and women.
          </p>
          <p className="max-w-2xl text-sm text-muted-foreground">Body small · secondary information and captions.</p>
          <Eyebrow>Eyebrow · Geist Mono</Eyebrow>
          <p className="font-mono text-sm">PK-1058 · 98% cotton 2% elastane · 11 oz</p>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Shop wholesale</Button>
          <Button variant="accent">
            Place order <ArrowRight />
          </Button>
          <Button variant="outline">Request a quote</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Text link</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button>Default</Button>
          <Button size="lg">Large</Button>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-3xl bg-denim-900 p-6 twill-texture">
          <Button variant="accent">Accent on dark</Button>
          <Button variant="inverse">Inverse</Button>
          <Button variant="outline-inverse">Outline inverse</Button>
        </div>
      </Section>

      <Section title="Badges & form fields">
        <div className="flex flex-wrap gap-2">
          <Badge>In production</Badge>
          <Badge variant="secondary">MOQ 100 pcs</Badge>
          <Badge variant="outline">Stretch</Badge>
          <Badge variant="destructive">Payment overdue</Badge>
        </div>
        <div className="mt-8 grid max-w-xl gap-5 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="sg-company">Company name</Label>
            <Input id="sg-company" placeholder="Your company" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sg-email">Email</Label>
            <Input id="sg-email" type="email" placeholder="you@company.com" aria-invalid />
          </div>
        </div>
      </Section>

      <Section title="Signature details">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-border bg-card p-6">
            <p className="font-heading text-3xl font-bold">
              Made to <span className="stitch-underline">order</span>
            </p>
            <p className="mt-3 text-sm text-muted-foreground">Stitch underline for one key phrase per heading.</p>
          </div>
          <div className="rounded-3xl border border-border bg-card p-6">
            <span className="stitch-line block w-full text-stitch-500" />
            <p className="mt-4 text-sm text-muted-foreground">Stitch line for dividers and step connectors.</p>
          </div>
          <div className="rounded-3xl bg-denim-900 p-6 text-cotton-50 twill-texture">
            <p className="font-heading text-xl font-semibold">Twill texture</p>
            <p className="mt-3 text-sm text-cotton-50/70">Subtle diagonal weave on dark sections.</p>
          </div>
        </div>
      </Section>
    </Container>
  );
}
