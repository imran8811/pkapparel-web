"use client";

import { useMemo, useState } from "react";
import { PencilIcon, PlusIcon, XIcon } from "lucide-react";
import { AdminForm, FormError, SubmitButton, TextField, useAdminForm } from "@/components/admin/form";
import { inputClass } from "@/components/admin/styles";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { saveZone } from "@/lib/admin/actions/commerce";
import type { ShippingZone } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

type Country = { code: string; name: string };
type Mode = "air" | "sea" | "courier";
type RateRow = { key: number; mode: Mode; from_qty: string; rate: string; fixed: string; transit_min_days: string; transit_max_days: string };

let nextKey = 1;

/** What a band's quantity counts, per mode. */
const UNITS: Record<Mode, string> = { air: "kg", sea: "CBM", courier: "piece" };

/** Suggested transit days for a new band. */
const TRANSIT: Record<Mode, [string, string]> = { air: ["5", "10"], sea: ["25", "45"], courier: ["3", "6"] };

function toRows(zone?: ShippingZone): RateRow[] {
  return (zone?.rates ?? []).map((rate) => ({
    key: nextKey++,
    mode: rate.mode,
    from_qty: String(rate.from_qty),
    rate: (rate.rate_cents / 100).toFixed(2),
    fixed: rate.fixed_cents ? (rate.fixed_cents / 100).toFixed(2) : "",
    transit_min_days: rate.transit_min_days?.toString() ?? "",
    transit_max_days: rate.transit_max_days?.toString() ?? "",
  }));
}

/** Add or edit a shipping zone: its countries and its air, sea and courier (samples) rate bands. */
export function ZoneDialog({ zone, zones, countries }: { zone?: ShippingZone; zones: ShippingZone[]; countries: Country[] }) {
  const [open, setOpen] = useState(false);
  // Opening the dialog again starts from the saved zone.
  const [round, setRound] = useState(0);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setRound((value) => value + 1);
      }}
    >
      <DialogTrigger asChild>
        {zone ? (
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${zone.name}`}>
            <PencilIcon />
          </Button>
        ) : (
          <Button size="sm">
            <PlusIcon /> Add a zone
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{zone ? `Edit ${zone.name}` : "Add a shipping zone"}</DialogTitle>
          <DialogDescription>Countries that share the same freight rates. A country can be in one zone only.</DialogDescription>
        </DialogHeader>
        <AdminForm key={round} action={saveZone.bind(null, zone?.id ?? null)} onSuccess={() => setOpen(false)} className="grid grid-cols-1 gap-5">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
            <TextField label="Name" name="name" defaultValue={zone?.name ?? ""} placeholder="e.g. Europe" maxLength={120} />
            <TextField label="Order" name="sort_order" type="number" min={0} defaultValue={zone?.sort_order ?? 0} />
          </div>
          <CountryPicker zone={zone} zones={zones} countries={countries} />
          <RatesEditor initial={toRows(zone)} />
          <FormError />
          <DialogFooter>
            <SubmitButton>{zone ? "Save zone" : "Add zone"}</SubmitButton>
          </DialogFooter>
        </AdminForm>
      </DialogContent>
    </Dialog>
  );
}

function CountryPicker({ zone, zones, countries }: { zone?: ShippingZone; zones: ShippingZone[]; countries: Country[] }) {
  const { state } = useAdminForm();
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set(zone?.countries ?? []));
  const [query, setQuery] = useState("");
  const taken = useMemo(() => {
    const map = new Map<string, string>();
    for (const other of zones) if (other.id !== zone?.id) for (const code of other.countries) map.set(code, other.name);
    return map;
  }, [zones, zone?.id]);
  const filtered = countries.filter((country) => `${country.name} ${country.code}`.toLowerCase().includes(query.trim().toLowerCase()));
  const toggle = (code: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });

  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium">Countries ({selected.size})</legend>
      {[...selected].map((code) => (
        <input key={code} type="hidden" name="countries" value={code} />
      ))}
      {selected.size > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {[...selected].sort().map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => toggle(code)}
              className="inline-flex items-center gap-1 rounded-full bg-denim-50 px-2.5 py-1 text-xs text-denim-800 hover:bg-denim-100"
              aria-label={`Remove ${countries.find((c) => c.code === code)?.name ?? code}`}
            >
              {countries.find((c) => c.code === code)?.name ?? code}
              <XIcon className="size-3" />
            </button>
          ))}
        </div>
      ) : null}
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a country" aria-label="Find a country" className={inputClass} />
      <div className="grid max-h-52 grid-cols-1 gap-0.5 overflow-y-auto rounded-lg border p-1.5 sm:grid-cols-2">
        {filtered.map((country) => {
          const inZone = taken.get(country.code);
          return (
            <label
              key={country.code}
              className={cn("flex items-center gap-2 rounded-md px-2 py-1 text-sm", inZone ? "text-muted-foreground" : "cursor-pointer hover:bg-cotton-50")}
            >
              <input type="checkbox" checked={selected.has(country.code)} disabled={Boolean(inZone)} onChange={() => toggle(country.code)} className="accent-denim-600" />
              <span className="truncate">
                {country.name}
                {inZone ? <span className="text-xs"> · in {inZone}</span> : null}
              </span>
            </label>
          );
        })}
      </div>
      {state.fields?.countries ? <p className="text-sm text-destructive">{state.fields.countries}</p> : null}
    </fieldset>
  );
}

function RatesEditor({ initial }: { initial: RateRow[] }) {
  const { state } = useAdminForm();
  const [rows, setRows] = useState<RateRow[]>(initial);
  const update = (key: number, changes: Partial<RateRow>) => setRows((current) => current.map((row) => (row.key === key ? { ...row, ...changes } : row)));
  const add = (mode: Mode) =>
    setRows((current) => [...current, { key: nextKey++, mode, from_qty: mode === "courier" ? "1" : "0", rate: "", fixed: "", transit_min_days: TRANSIT[mode][0], transit_max_days: TRANSIT[mode][1] }]);

  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-medium">Rates</legend>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Rates should cover delivery to the buyer&apos;s address (DAP: duties and taxes paid by the buyer). Air is priced per chargeable kg, sea (LCL) per CBM. Add bands for
        larger shipments, e.g. air from 100 kg at a lower rate; checkout picks the cheapest band. The fixed charge is added once per shipment.
        Courier rates price sample orders: a fixed amount plus a price per piece (without one, staff price the courier by hand).
      </p>
      <input
        type="hidden"
        name="rates"
        value={JSON.stringify(rows.map((row) => ({ mode: row.mode, from_qty: row.from_qty, rate: row.rate, fixed: row.fixed, transit_min_days: row.transit_min_days, transit_max_days: row.transit_max_days })))}
      />
      {rows.length === 0 ? <p className="rounded-lg bg-cotton-50 px-3 py-2 text-sm text-muted-foreground">No rates yet: checkout says “freight quoted” for these countries.</p> : null}
      {rows.map((row) => {
        const unit = UNITS[row.mode];
        return (
          <div key={row.key} className="grid grid-cols-2 gap-2 rounded-xl border p-3 sm:grid-cols-[6rem_repeat(3,minmax(0,1fr))_minmax(0,1.3fr)_auto] sm:items-end">
            <label className="grid gap-1 text-xs text-muted-foreground">
              Mode
              <select value={row.mode} onChange={(event) => update(row.key, { mode: event.target.value as Mode })} className={inputClass}>
                <option value="air">Air</option>
                <option value="sea">Sea</option>
                <option value="courier">Courier</option>
              </select>
            </label>
            <label className="grid gap-1 text-xs text-muted-foreground">
              From ({unit})
              <input type="number" min={0} step={row.mode === "courier" ? 1 : 0.001} value={row.from_qty} onChange={(event) => update(row.key, { from_qty: event.target.value })} className={inputClass} />
            </label>
            <label className="grid gap-1 text-xs text-muted-foreground">
              USD per {unit}
              <input type="number" min={0} step="0.01" value={row.rate} onChange={(event) => update(row.key, { rate: event.target.value })} className={inputClass} />
            </label>
            <label className="grid gap-1 text-xs text-muted-foreground">
              Fixed (USD)
              <input type="number" min={0} step="0.01" value={row.fixed} placeholder="0" onChange={(event) => update(row.key, { fixed: event.target.value })} className={inputClass} />
            </label>
            <div className="col-span-2 grid grid-cols-2 gap-2 sm:col-span-1">
              <label className="grid gap-1 text-xs text-muted-foreground">
                Transit from (days)
                <input type="number" min={1} value={row.transit_min_days} onChange={(event) => update(row.key, { transit_min_days: event.target.value })} className={inputClass} />
              </label>
              <label className="grid gap-1 text-xs text-muted-foreground">
                to (days)
                <input type="number" min={1} value={row.transit_max_days} onChange={(event) => update(row.key, { transit_max_days: event.target.value })} className={inputClass} />
              </label>
            </div>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove this rate" onClick={() => setRows((current) => current.filter((r) => r.key !== row.key))} className="justify-self-end text-muted-foreground">
              <XIcon />
            </Button>
          </div>
        );
      })}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => add("air")}>
          <PlusIcon /> Air rate
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => add("sea")}>
          <PlusIcon /> Sea rate
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => add("courier")}>
          <PlusIcon /> Courier rate (samples)
        </Button>
      </div>
      {state.fields?.rates ? <p className="text-sm text-destructive">{state.fields.rates}</p> : null}
    </fieldset>
  );
}
