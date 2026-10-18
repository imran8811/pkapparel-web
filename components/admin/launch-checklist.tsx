"use client";

import { useTransition } from "react";
import Link from "next/link";
import { ArrowRightIcon, CircleCheckIcon, CircleIcon } from "lucide-react";
import { toast } from "sonner";
import { Panel } from "@/components/admin/page-parts";
import { tickLaunchItem } from "@/lib/admin/actions/launch";
import type { LaunchChecklistItem } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

/** What is still missing before the shop takes orders (admins). Hidden once every item is done. */
export function LaunchChecklist({ items }: { items: LaunchChecklistItem[] }) {
  const done = items.filter((item) => item.done).length;
  if (done === items.length) return null;

  return (
    <Panel
      title="Before the shop opens"
      description={`${done} of ${items.length} done. Most items tick themselves once the information is in the admin; tick the others when they are done. This list disappears when everything is done.`}
      className="mb-6"
    >
      <ul className="-my-2 divide-y">
        {items.map((item) => (
          <li key={item.key} className="flex items-start gap-3 py-2.5">
            {item.manual ? (
              <ManualTick item={item} />
            ) : item.done ? (
              <CircleCheckIcon aria-label="Done" className="mt-0.5 size-5 shrink-0 text-emerald-600" />
            ) : (
              <CircleIcon aria-label="Not done yet" className="mt-0.5 size-5 shrink-0 text-cotton-300" />
            )}
            <div className="min-w-0 flex-1 text-sm">
              {item.manual ? (
                <label htmlFor={`launch-${item.key}`} className={cn("cursor-pointer", item.done ? "text-muted-foreground" : "font-medium")}>
                  {item.label}
                </label>
              ) : (
                <p className={item.done ? "text-muted-foreground" : "font-medium"}>{item.label}</p>
              )}
              {item.note ? <p className="mt-0.5 text-xs text-muted-foreground">{item.note}</p> : null}
            </div>
            {item.href && !item.done ? (
              <Link href={item.href} className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-denim-600 hover:underline">
                Open <ArrowRightIcon className="size-3.5" />
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function ManualTick({ item }: { item: LaunchChecklistItem }) {
  const [pending, startTransition] = useTransition();
  return (
    <input
      id={`launch-${item.key}`}
      type="checkbox"
      checked={item.done}
      disabled={pending}
      onChange={(event) => {
        const done = event.target.checked;
        startTransition(async () => {
          const result = await tickLaunchItem(item.key, done);
          if (result.status !== "success") toast.error(result.message ?? "That did not work. Please try again.");
        });
      }}
      className="mt-0.5 size-5 shrink-0 accent-emerald-600"
    />
  );
}
