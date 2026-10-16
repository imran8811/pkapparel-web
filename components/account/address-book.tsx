"use client";

import { useState, useTransition } from "react";
import { LoaderCircle, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { AddressFields } from "@/components/account/address-fields";
import { ActionForm, CheckboxInput, FormMessage, SubmitButton } from "@/components/forms/action-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { deleteAddress, saveAddress } from "@/lib/account/actions/profile";
import type { Address } from "@/lib/account/types";
import { countryName } from "@/lib/format";

type Country = { code: string; name: string };

/** The buyer's delivery addresses: add, edit, make default, delete. */
export function AddressBook({ addresses, countries }: { addresses: Address[]; countries: Country[] }) {
  // null: closed · "new": add an address · a number: edit that address
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const current = typeof editing === "number" ? addresses.find((address) => address.id === editing) : undefined;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {addresses.map((address) => (
          <AddressCard key={address.id} address={address} onEdit={() => setEditing(address.id)} />
        ))}
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-border p-6 text-sm font-medium text-muted-foreground transition-colors hover:border-denim-300 hover:text-foreground"
        >
          <Plus className="size-5" /> Add an address
        </button>
      </div>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "Add an address" : "Edit address"}</DialogTitle>
            <DialogDescription>Where we deliver your goods (or where your forwarder sends them).</DialogDescription>
          </DialogHeader>
          {editing !== null ? (
            <ActionForm
              key={String(editing)}
              action={saveAddress.bind(null, typeof editing === "number" ? editing : null)}
              onSuccess={() => setEditing(null)}
              className="grid grid-cols-1 gap-5"
            >
              <AddressFields countries={countries} address={current} />
              {!current?.is_default ? <CheckboxInput name="is_default" label="Use this as my default delivery address" defaultChecked={addresses.length === 0} /> : null}
              <FormMessage />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <SubmitButton pendingLabel="Saving…">Save address</SubmitButton>
              </div>
            </ActionForm>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function AddressCard({ address, onEdit }: { address: Address; onEdit: () => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col rounded-3xl border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="flex min-w-0 items-center gap-2 font-medium">
          <MapPin aria-hidden className="size-4 shrink-0 text-denim-600" />
          <span className="truncate">{address.company}</span>
        </p>
        {address.is_default ? <span className="shrink-0 rounded-full bg-denim-50 px-2.5 py-0.5 text-xs font-medium text-denim-700">Default</span> : null}
      </div>
      <address className="mt-3 flex-1 text-sm leading-relaxed not-italic text-muted-foreground">
        {address.contact_name}, {address.phone}
        <br />
        {address.line1}
        {address.line2 ? `, ${address.line2}` : ""}
        <br />
        {[address.postal_code, address.city].filter(Boolean).join(" ")}
        {address.state ? `, ${address.state}` : ""}, {countryName(address.country_code)}
        {address.tax_id ? (
          <>
            <br />
            Import / tax ID: {address.tax_id}
          </>
        ) : null}
      </address>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      <div className="mt-4 flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onEdit}>
          <Pencil /> Edit
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          className="text-muted-foreground hover:text-destructive"
          onClick={() => {
            if (!window.confirm(`Delete the address of ${address.company}?`)) return;
            startTransition(async () => {
              const result = await deleteAddress(address.id);
              if (result.status === "error") setError(result.message ?? "The address could not be deleted.");
            });
          }}
        >
          {pending ? <LoaderCircle className="animate-spin" /> : <Trash2 />} Delete
        </Button>
      </div>
    </div>
  );
}
