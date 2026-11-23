import Link from "next/link";
import { Package, Ruler } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Prose } from "@/components/site/prose";
import { shippingModes } from "@/lib/shipping";
import { sizesText, specValue, type Packing, type Product } from "@/lib/shop";

/** Description, specifications, sizes, packing and shipping of a style (the parts that don't change with the color). */
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
              {sizesText(product.size_system, product.sizes)}. Other sizes can be added to your order. Each size you order needs at least{" "}
              {product.rules.min_pcs_per_size} pieces, and each color at least {product.rules.moq_per_color}.
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
                <Ruler aria-hidden className="size-4 shrink-0 text-denim-600" />
                <span>
                  We send the size chart with your quote, or{" "}
                  <Link href="/contact" className="font-medium text-denim-600 hover:underline">
                    ask us for it
                  </Link>
                  .
                </span>
              </p>
            )}
          </div>

          <PackingDetails packing={product.packing} />
        </div>

        <aside className="grid min-w-0 grid-cols-1 content-start gap-10 lg:col-span-5">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Specifications</h2>
            <dl className="mt-4 divide-y divide-border rounded-2xl border border-border bg-white">
              {product.style_no ? <SpecRow label="Style no." value={product.style_no} /> : null}
              {specs.map((row) => (
                <SpecRow key={row.label} label={row.label} value={row.value} />
              ))}
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

/** "650 g", "1.2 kg" */
const weight = (grams: number) => (grams >= 1000 ? `${(grams / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 })} kg` : `${grams} g`);

/** Millimetres as centimetres: 605 → "60.5" */
const cm = (mm: number) => (mm / 10).toLocaleString("en-US", { maximumFractionDigits: 1 });

/**
 * The style's packing as staff entered it (owner request 2026-11-23): weight per piece, pieces per carton, the carton's
 * size and volume, and a full carton's weight. Only what is known is shown; without any, buyers are told it comes with
 * their quote, as for a missing size chart.
 */
function PackingDetails({ packing }: { packing: Packing }) {
  const { piece_weight_g: piece, pcs_per_carton: pieces, carton_length_mm: length, carton_width_mm: width, carton_height_mm: height, carton_weight_g: carton } = packing;
  const net = piece && pieces ? piece * pieces : null;
  const rows = [
    piece ? { label: "Weight per piece", value: `about ${weight(piece)}` } : null,
    pieces ? { label: "Pieces per carton", value: pieces.toLocaleString("en-US") } : null,
    length && width && height
      ? { label: "Carton size", value: `${cm(length)} × ${cm(width)} × ${cm(height)} cm · ${((length * width * height) / 1e9).toFixed(3)} CBM` }
      : null,
    // A full carton: the pieces, with the empty carton when its weight is known.
    net ? { label: "Full carton", value: carton ? `about ${weight(net + carton)} gross, ${weight(net)} net` : `about ${weight(net)} net` } : null,
    !net && carton ? { label: "Empty carton", value: weight(carton) } : null,
  ].filter((row): row is { label: string; value: string } => row !== null);

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">Packing</h2>
      {rows.length > 0 ? (
        <>
          <dl className="mt-4 divide-y divide-border rounded-2xl border border-border bg-white">
            {rows.map((row) => (
              <SpecRow key={row.label} label={row.label} value={row.value} />
            ))}
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Approximate figures. Your freight estimate at checkout is worked out from them, and your shipment comes with a packing list of its cartons. Your own
            polybags or carton marks?{" "}
            <Link href="/private-label" className="underline underline-offset-2">
              See private label
            </Link>
            .
          </p>
        </>
      ) : (
        <p className="mt-5 flex items-center gap-2 rounded-2xl bg-secondary px-4 py-3 text-sm">
          <Package aria-hidden className="size-4 shrink-0 text-denim-600" />
          <span>
            We confirm the packing (pieces per carton, carton size and weight) with your quote, or{" "}
            <Link href="/contact" className="font-medium text-denim-600 hover:underline">
              ask us for it
            </Link>
            .
          </span>
        </p>
      )}
    </div>
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
