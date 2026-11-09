import { Container } from "@/components/layout/container";
import { Prose } from "@/components/site/prose";
import { specValue } from "@/lib/shop";
import { setContents, setsInStock, type StockStyle } from "@/lib/stock";

/** Description, specifications, the set and the stock of every color. */
export function StockDetails({ style }: { style: StockStyle }) {
  const specs = style.spec_fields
    .map(({ key, label }) => ({ label, value: specValue(key, style.specs[key]) }))
    .filter((row): row is { label: string; value: string } => row.value !== null);

  return (
    <section className="border-t border-border py-16 sm:py-20">
      <Container className="grid grid-cols-1 gap-14 lg:grid-cols-12">
        <div className="grid min-w-0 grid-cols-1 content-start gap-12 lg:col-span-7">
          {style.description_html ? (
            <div>
              <h2 className="text-2xl font-bold tracking-tight">About this style</h2>
              <Prose html={style.description_html} className="mt-4 prose-base" />
            </div>
          ) : null}

          <div>
            <h2 className="text-2xl font-bold tracking-tight">Stock by color</h2>
            <ul className="mt-4 grid gap-2 text-sm">
              {style.colors.map((color) => (
                <li key={color.slug} className="flex items-center justify-between gap-4 rounded-xl bg-secondary px-4 py-2.5">
                  <span className="flex items-center gap-2.5">
                    <span className="size-3.5 shrink-0 rounded-full ring-1 ring-black/10" style={{ backgroundColor: color.hex ?? "#c8d8f4" }} />
                    <span className="font-medium">{color.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{color.code}</span>
                  </span>
                  <span className={color.sets_in_stock > 0 ? "text-emerald-700" : "text-muted-foreground"}>{setsInStock(color.sets_in_stock)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="grid min-w-0 grid-cols-1 content-start gap-10 lg:col-span-5">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Specifications</h2>
            <dl className="mt-4 divide-y divide-border rounded-2xl border border-border bg-white">
              {style.style_no ? <SpecRow label="Style no." value={style.style_no} /> : null}
              {specs.map((row) => (
                <SpecRow key={row.label} label={row.label} value={row.value} />
              ))}
              <SpecRow label="One set" value={`${style.set.pieces} pieces: waist ${setContents(style.set.sizes)}`} />
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">Waist sizes in inches. A number in brackets is the pieces of that size in one set.</p>
          </div>
        </aside>
      </Container>
    </section>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-4 px-4 py-3 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
