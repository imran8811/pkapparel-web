import type { Metadata } from "next";
import { DeleteButton } from "@/components/admin/delete-button";
import { EmptyState, NoAccess, PageHeader, Panel } from "@/components/admin/page-parts";
import { ZoneDialog } from "@/components/admin/zone-dialog";
import { deleteZone } from "@/lib/admin/actions/commerce";
import { can } from "@/lib/admin/permissions";
import { adminApi, getStaff } from "@/lib/admin/session";
import type { ShippingRate, ShippingZone } from "@/lib/admin/types";
import { countryName, countryOptions, formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Shipping rates" };

export default async function ShippingPage() {
  const staff = await getStaff();
  if (!can(staff.role, "commerce")) return <NoAccess />;

  const zones = await adminApi<ShippingZone[]>("/v1/admin/shipping/zones");
  const countries = countryOptions();

  return (
    <>
      <PageHeader
        title="Shipping rates"
        description="Freight estimates at checkout come from these rates. Buyers see them as estimates; the final freight is confirmed before shipment and paid with the balance."
        actions={<ZoneDialog zones={zones} countries={countries} />}
      />

      {zones.length === 0 ? (
        <EmptyState title="No shipping zones yet">
          Until you add zones, checkout tells buyers that the freight will be quoted. Start with your main markets (for example the USA, the UK and Europe), using your forwarder&apos;s
          rates.
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {zones.map((zone) => (
            <Panel key={zone.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-heading text-lg font-semibold">{zone.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{zone.countries.map(countryName).join(", ")}</p>
                </div>
                <div className="flex shrink-0 items-center">
                  <ZoneDialog zone={zone} zones={zones} countries={countries} />
                  <DeleteButton
                    iconOnly
                    label={`Delete ${zone.name}`}
                    title={`Delete ${zone.name}?`}
                    description="Its countries will get “freight quoted” at checkout until you add them to another zone."
                    onConfirm={deleteZone.bind(null, zone.id)}
                  />
                </div>
              </div>
              {zone.rates.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">No rates: freight is quoted for these countries.</p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[32rem] text-sm">
                    <thead className="text-left text-xs text-muted-foreground">
                      <tr>
                        <th className="py-1.5 pr-3 font-medium">Mode</th>
                        <th className="py-1.5 pr-3 font-medium">From</th>
                        <th className="py-1.5 pr-3 font-medium">Rate</th>
                        <th className="py-1.5 pr-3 font-medium">Fixed</th>
                        <th className="py-1.5 font-medium">Transit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {zone.rates.map((rate, index) => (
                        <tr key={index} className="border-t">
                          <td className="py-2 pr-3">{MODE_LABELS[rate.mode]}</td>
                          <td className="py-2 pr-3 tabular-nums">
                            {rate.from_qty} {unit(rate)}
                          </td>
                          <td className="py-2 pr-3 tabular-nums">
                            {formatMoney(rate.rate_cents)} / {unit(rate)}
                          </td>
                          <td className="py-2 pr-3 tabular-nums">{rate.fixed_cents ? formatMoney(rate.fixed_cents) : "–"}</td>
                          <td className="py-2 tabular-nums">{transit(rate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}

const MODE_LABELS: Record<ShippingRate["mode"], string> = { air: "Air", sea: "Sea", courier: "Courier" };

function unit(rate: ShippingRate): string {
  return { air: "kg", sea: "CBM", courier: "pcs" }[rate.mode];
}

function transit(rate: ShippingRate): string {
  if (rate.transit_min_days && rate.transit_max_days) return `${rate.transit_min_days}–${rate.transit_max_days} days`;
  return rate.transit_min_days || rate.transit_max_days ? `${rate.transit_min_days ?? rate.transit_max_days} days` : "–";
}
