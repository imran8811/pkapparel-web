import type { Metadata } from "next";
import { DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NoAccess, PageHeader, Panel } from "@/components/admin/page-parts";
import { StockListingImport } from "@/components/admin/stock-listing-import";
import { can } from "@/lib/admin/permissions";
import { getStaff } from "@/lib/admin/session";
import { getStockSectionsAdmin } from "@/lib/admin/stock-sections";

export const metadata: Metadata = { title: "Import stock listings" };

export default async function StockListingImportPage() {
  const staff = await getStaff();
  if (!can(staff.role, "content")) return <NoAccess />;
  const { departments, categories, catalog } = await getStockSectionsAdmin();
  // The template's spec columns (the API's StockListingImport): every spec of the categories once, by its first label,
  // then the label. A spec named differently by two categories is read under either name.
  const specNames = new Map<string, string[]>();
  for (const category of categories) {
    for (const spec of catalog.types.find((type) => type.slug === category.product_type)?.specs ?? []) {
      const names = specNames.get(spec.key) ?? [];
      if (!names.includes(spec.label)) specNames.set(spec.key, [...names, spec.label]);
    }
  }
  const specColumns = [...[...specNames.values()].map((names) => (names.length > 1 ? `${names[0]} (or ${names.slice(1).join(", ")})` : names[0])), "Label"];

  // The template's columns (the API's StockListingImport), what to write in each, and whether it must be filled in.
  const columns: { name: string; required?: boolean; help: string }[] = [
    { name: "Name", required: true, help: "The listing's name, e.g. Men's slim stretch jeans." },
    { name: "Style no.", help: "Optional, e.g. PK-1051." },
    { name: "For", required: true, help: `The department: ${orList(departments.map((department) => department.name))}.` },
    { name: "Category", required: true, help: `${orList(categories.map((category) => category.name))}. Each category has its own specifications.` },
    { name: "Color", required: true, help: "e.g. Sky blue. Each color is a listing of its own: one line per color." },
    {
      name: "Color code",
      required: true,
      help: "Letters, digits and dashes, different for every color, e.g. 1051. Format the column as Text in Excel so a code like 0105 keeps its zero.",
    },
    { name: "Swatch", help: "Optional, e.g. #4a6fa5." },
    { name: "Set", required: true, help: "Each waist size x its pieces: 28x2, 30x2, 32x2, 34x2. Sizes 16 to 48, 1 to 24 pieces each." },
    { name: "Price per piece (Rs)", required: true, help: "e.g. 980. The set's price is its pieces times this." },
    { name: "Sets in stock", help: "Optional, recorded as received. Empty means none yet." },
    {
      name: specColumns.join(", "),
      help: "Optional, as in the listing form: each line keeps those of its category. Stretch is Stretch or Rigid.",
    },
    { name: "Description", help: "Optional plain text. An empty line starts a new paragraph." },
  ];

  return (
    <>
      <PageHeader
        back={{ href: "/admin/stock", label: "Stock" }}
        title="Import stock listings"
        description="Add many listings at once from an Excel file: one line per listing. Nothing is created until every line is right."
      />
      <div className="grid gap-6">
        <Panel title="1. Fill in the template" description="Download the template, open it in Excel and add a line for each listing under the column names.">
          <Button asChild variant="outline" size="sm">
            <a href="/admin/stock/import-listings/template" download>
              <DownloadIcon /> Download the template
            </a>
          </Button>
          <div className="mt-5 overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[36rem] text-sm">
              <thead className="bg-cotton-50 text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="w-56 px-4 py-2.5 font-medium">
                    Column
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    What to write
                  </th>
                </tr>
              </thead>
              <tbody>
                {columns.map((column) => (
                  <tr key={column.name} className="border-t align-top">
                    <td className="px-4 py-2.5 font-medium">
                      {column.name}
                      {column.required ? <span className="ml-1.5 text-xs font-normal text-stitch-700">required</span> : null}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{column.help}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <StockListingImport />
      </div>
    </>
  );
}

/** "Men, Women or Boys" */
function orList(names: string[]): string {
  return names.length <= 1 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}`;
}
