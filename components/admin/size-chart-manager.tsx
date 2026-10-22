"use client";

import { useState } from "react";
import { PencilIcon, PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectField, TextField, useAdminForm } from "@/components/admin/form";
import { DeleteButton } from "@/components/admin/delete-button";
import { ItemDialog } from "@/components/admin/item-dialog";
import { EmptyState } from "@/components/admin/page-parts";
import { inputClass } from "@/components/admin/styles";
import { deleteSizeChart, saveSizeChart } from "@/lib/admin/actions/shop-texts";
import type { AdminSizeChart, CatalogDefinitions } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

type Systems = CatalogDefinitions["size_systems"];

/** Measurements a new chart can start from. */
const PRESETS = [
  { label: "Bottoms", measurements: ["Waist", "Hip", "Thigh", "Front rise", "Back rise", "Knee", "Leg opening", "Inseam"] },
  { label: "Tops", measurements: ["Chest (½)", "Body length", "Shoulder", "Sleeve length", "Hem (½)"] },
];

export function SizeChartManager({ charts, systems }: { charts: AdminSizeChart[]; systems: Systems }) {
  const systemLabel = (key: string) => systems.find((system) => system.key === key)?.label ?? key;
  return (
    <div className="grid grid-cols-1 gap-6">
      <div>
        <ItemDialog
          title="Add a size chart"
          action={saveSizeChart}
          submitLabel="Add size chart"
          trigger={
            <Button size="sm">
              <PlusIcon /> Add size chart
            </Button>
          }
        >
          <ChartFields chart={null} systems={systems} />
        </ItemDialog>
      </div>

      {charts.length === 0 ? <EmptyState title="No size charts yet" /> : null}

      {charts.map((chart) => (
        <section key={chart.id} className="rounded-2xl border bg-white p-5">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg font-semibold">{chart.name}</h2>
              <p className="text-sm text-muted-foreground">
                {systemLabel(chart.size_system)} · {chart.unit === "in" ? "inches" : "centimeters"} · {chart.size_rows.length} sizes · used by {chart.product_count} style
                {chart.product_count === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex">
              <ItemDialog
                title={`Edit ${chart.name}`}
                action={saveSizeChart}
                trigger={
                  <Button variant="ghost" size="icon-sm" aria-label={`Edit ${chart.name}`}>
                    <PencilIcon />
                  </Button>
                }
              >
                <input type="hidden" name="id" value={chart.id} />
                <ChartFields chart={chart} systems={systems} />
              </ItemDialog>
              <DeleteButton
                iconOnly
                label={`Delete ${chart.name}`}
                title={`Delete ${chart.name}?`}
                description={chart.product_count > 0 ? `${chart.product_count} style(s) use this chart and will show no size chart.` : "This cannot be undone."}
                onConfirm={() => deleteSizeChart(chart.id)}
              />
            </div>
          </header>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-1.5 pr-4 font-medium">Size</th>
                  {chart.measurements.map((name) => (
                    <th key={name} className="py-1.5 pr-4 font-medium whitespace-nowrap">
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chart.size_rows.map((row) => (
                  <tr key={row.size} className="border-t">
                    <td className="py-1.5 pr-4 font-mono">{row.size}</td>
                    {row.values.map((value, index) => (
                      <td key={index} className="py-1.5 pr-4 tabular-nums">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

/** Name, size system, unit and a grid of sizes × measurements. */
function ChartFields({ chart, systems }: { chart: AdminSizeChart | null; systems: Systems }) {
  const [measurements, setMeasurements] = useState<string[]>(chart?.measurements ?? ["Waist", "Hip", "Inseam"]);
  const [rows, setRows] = useState(chart?.size_rows ?? [{ size: "", values: ["", "", ""] }]);
  const [system, setSystem] = useState<string>(chart?.size_system ?? "waist");
  const sizes = systems.find((s) => s.key === system)?.sizes ?? null;
  const applyPreset = (names: string[]) => {
    setMeasurements(names);
    setRows((current) => current.map((row) => ({ ...row, values: names.map(() => "") })));
  };
  const { state } = useAdminForm();
  const gridError = Object.entries(state.fields ?? {}).find(([key]) => key.startsWith("size_rows") || key.startsWith("measurements"))?.[1];

  const addMeasurement = () => {
    setMeasurements((current) => [...current, ""]);
    setRows((current) => current.map((row) => ({ ...row, values: [...row.values, ""] })));
  };
  const removeMeasurement = (index: number) => {
    setMeasurements((current) => current.filter((_, i) => i !== index));
    setRows((current) => current.map((row) => ({ ...row, values: row.values.filter((_, i) => i !== index) })));
  };
  const setCell = (rowIndex: number, valueIndex: number, value: string) =>
    setRows((current) =>
      current.map((row, i) => (i === rowIndex ? { ...row, values: row.values.map((v, j) => (j === valueIndex ? value : v)) } : row)),
    );

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
        <TextField label="Name" name="name" defaultValue={chart?.name} placeholder="e.g. Women's jeans or Men's T-shirts" maxLength={120} fieldClassName="sm:col-span-2" />
        <SelectField
          label="Sizes"
          name="size_system"
          value={system}
          onChange={(event) => setSystem(event.target.value)}
          options={systems.map((s) => ({ value: s.key, label: s.label }))}
          hint={sizes ? `Rows use these sizes: ${sizes[0]} to ${sizes[sizes.length - 1]}. Styles with the same sizes can use this chart.` : "Rows can use any size name."}
        />
        <SelectField
          label="Unit"
          name="unit"
          defaultValue={chart?.unit ?? "in"}
          options={[
            { value: "in", label: "Inches" },
            { value: "cm", label: "Centimeters" },
          ]}
        />
      </div>
      {chart === null ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Start with the measurements for</span>
          {PRESETS.map((preset) => (
            <Button key={preset.label} type="button" variant="outline" size="xs" onClick={() => applyPreset(preset.measurements)}>
              {preset.label}
            </Button>
          ))}
        </div>
      ) : null}
      <input type="hidden" name="measurements" value={JSON.stringify(measurements)} />
      <input type="hidden" name="size_rows" value={JSON.stringify(rows)} />
      {sizes ? (
        <datalist id="chart-sizes">
          {sizes.map((size) => (
            <option key={size} value={size} />
          ))}
        </datalist>
      ) : null}
      <div className="overflow-x-auto rounded-xl border">
        <table className="text-sm">
          <thead className="bg-cotton-50">
            <tr>
              <th className="p-2 text-left font-medium">Size</th>
              {measurements.map((name, index) => (
                <th key={index} className="p-2">
                  <div className="flex items-center gap-1">
                    <input
                      value={name}
                      onChange={(event) => setMeasurements((current) => current.map((m, i) => (i === index ? event.target.value : m)))}
                      placeholder="Measurement"
                      aria-label={`Measurement ${index + 1} name`}
                      className={cn(inputClass, "h-8 w-28")}
                    />
                    <button type="button" aria-label={`Remove ${name || "measurement"}`} onClick={() => removeMeasurement(index)} className="text-muted-foreground hover:text-destructive">
                      <XIcon className="size-3.5" />
                    </button>
                  </div>
                </th>
              ))}
              <th className="p-2">
                <Button type="button" variant="ghost" size="xs" onClick={addMeasurement}>
                  <PlusIcon /> Column
                </Button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-t">
                <td className="p-2">
                  <input
                    value={row.size}
                    onChange={(event) => setRows((current) => current.map((r, i) => (i === rowIndex ? { ...r, size: event.target.value } : r)))}
                    placeholder={system === "letter" ? "e.g. M" : system === "waist" ? "e.g. 30" : "e.g. 4Y"}
                    list={sizes ? "chart-sizes" : undefined}
                    aria-label={`Row ${rowIndex + 1} size`}
                    className={cn(inputClass, "h-8 w-20 font-mono")}
                  />
                </td>
                {row.values.map((value, valueIndex) => (
                  <td key={valueIndex} className="p-2">
                    <input
                      value={value}
                      onChange={(event) => setCell(rowIndex, valueIndex, event.target.value)}
                      aria-label={`Size ${row.size || rowIndex + 1}, ${measurements[valueIndex] || "measurement"}`}
                      className={cn(inputClass, "h-8 w-28 tabular-nums")}
                    />
                  </td>
                ))}
                <td className="p-2">
                  <button
                    type="button"
                    aria-label={`Remove size ${row.size || rowIndex + 1}`}
                    onClick={() => setRows((current) => current.filter((_, i) => i !== rowIndex))}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <XIcon className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="outline" size="sm" onClick={() => setRows((current) => [...current, { size: "", values: measurements.map(() => "") }])}>
          <PlusIcon /> Add size
        </Button>
        {gridError ? <p className="text-sm text-destructive">{gridError}</p> : null}
      </div>
      <TextField label="Note" name="note" defaultValue={chart?.note ?? ""} placeholder="e.g. Garment measurements, laid flat" maxLength={500} />
    </>
  );
}
