import Link from "next/link";
import { Ruler } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Prose } from "@/components/site/prose";
import { shippingModes } from "@/lib/shipping";
import { sizesText, specValue, type Product } from "@/lib/shop";

/** Description, specifications, sizes and shipping of a style (the parts that don't change with the color). */
export function ProductDetails({ product }: { product: Product }) {
  // The specs of this product type, labeled by the API (e.g. "Inseam" for jeans, "Neckline" for T-shirts).
  const specs = product.spec_fields.map(({ key, label }) => ({ label, value: specValue(key, product.specs[key]) })).filter(
    (row): row is { label: string; value: string } => row.value !== null,
  );
  // Colors whose fabric details differ from the style's, e.g. "Olive green: stretch cotton twill".
  const differences = product.colors.flatMap((color) =>
    product.spec_fields.filter(({ key }) => color.specs[key] && color.specs[key] !== product.specs[key]).map(
      ({ key, label }) => `${color.name}: ${label.toLowerCase()} ${specValue(key, color.specs[key])?.toLowerCase()}`,
    ),
  );

  return (
    <section className="border-t border-border py-16 sm:py-20">
      <Container className="grid grid-cols-1 gap-14 lg:grid-cols-12">
        <div className="grid min-w-0 grid-cols-1 content-start gap-12 lg:col-span-7">
          {product.description_html ? (
            <div>
              <h2 className="text-2xl font-bold tracking-tight">About this style</h2>
              <Prose html={product.description_html} className="mt-4 prose-base" />
              {product.features.length > 0 ? (
                <ul className="mt-5 flex flex-wrap gap-2">
                  {product.features.map((feature) => (
                    <li key={feature} className="rounded-full bg-secondary px-3 py-1.5 text-sm">
                      {feature}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          <div>
            <h2 className="text-2xl font-bold tracking-tight">Sizes and measurements</h2>
            <p className="mt-3 text-muted-foreground">
              {sizesText(product.size_system, product.sizes)}. Each size you order needs at least {product.rules.min_pcs_per_size} pieces, and each
              color at least {product.rules.moq_per_color}.
            </p>
            {product.size_chart ? (
              <div className="mt-5 overflow-x-auto rounded-2xl border border-border">
                <table className="w-full min-w-[32rem] text-sm">
                  <caption className="px-4 pt-3 pb-1 text-left text-xs text-muted-foreground">
                    {product.size_chart.name}, in {product.size_chart.unit === "in" ? "inches" : "centimeters"}
                    {product.size_chart.note ? `. ${product.size_chart.note}` : ""}
                  </caption>
                  <thead className="bg-cotton-100 text-left">
                    <tr>
                      <th scope="col" className="px-4 py-2.5 font-medium">
                        Size
                      </th>
                      {product.size_chart.measurements.map((name) => (
                        <th key={name} scope="col" className="px-4 py-2.5 font-medium whitespace-nowrap">
                          {name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {product.size_chart.rows.map((row) => (
                      <tr key={row.size} className="border-t border-border">
                        <th scope="row" className="px-4 py-2 text-left font-mono font-medium">
                          {row.size}
                        </th>
                        {row.values.map((value, index) => (
                          <td key={index} className="px-4 py-2 tabular-nums">
                            {value || "–"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-5 flex items-center gap-2 rounded-2xl bg-secondary px-4 py-3 text-sm">
                <Ruler aria-hidden className="size-4 text-denim-600" /> We send the size chart with your quote, or{" "}
                <Link href="/contact" className="font-medium text-denim-600 hover:underline">
                  ask us for it
                </Link>
                .
              </p>
            )}
          </div>
        </div>

        <aside className="grid min-w-0 grid-cols-1 content-start gap-10 lg:col-span-5">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Specifications</h2>
            <dl className="mt-4 divide-y divide-border rounded-2xl border border-border bg-white">
              {product.style_no ? <SpecRow label="Style no." value={product.style_no} /> : null}
              {specs.map((row) => (
                <SpecRow key={row.label} label={row.label} value={row.value} />
              ))}
              {product.piece_weight_g ? <SpecRow label="Weight per piece" value={`about ${product.piece_weight_g} g`} /> : null}
              <SpecRow label="Colors" value={product.colors.map((c) => `${c.name} (${c.code})`).join(", ")} />
            </dl>
            {differences.length > 0 ? (
              <ul className="mt-3 grid gap-1 text-xs text-muted-foreground">
                {differences.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            ) : null}
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight">Shipping</h2>
            <ul className="mt-4 grid gap-2 text-sm">
              {shippingModes.map((mode) => (
                <li key={mode.key} className="flex justify-between gap-4 rounded-xl bg-secondary px-4 py-2.5">
                  <span className="font-medium">{mode.name}</span>
                  <span className="text-muted-foreground">{mode.short}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Transit after production. Freight is quoted on your proforma invoice.{" "}
              <Link href="/shipping" className="underline underline-offset-2">
                More about shipping
              </Link>
            </p>
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
