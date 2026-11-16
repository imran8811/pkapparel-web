/** Form helpers are shared with the public site: see lib/forms.ts. */
import { jsonList, number, text } from "@/lib/forms";

export * from "@/lib/forms";

/**
 * The first color of a new style or listing, from its "color_*" fields (FirstColorPanel), saved with it by the API,
 * which makes its code. Undefined when it was left empty (the add forms ask for it: see firstColorProblems).
 */
export function firstColor(form: FormData): Record<string, unknown> | undefined {
  const color = {
    name: text(form, "color_name"),
    images: jsonList<{ path: string; alt: string }>(form, "color_images"),
    ...(form.has("color_sets_in_stock") ? { sets_in_stock: number(form, "color_sets_in_stock") } : {}),
  };
  const filled = color.name !== "" || color.images.length > 0 || Boolean(color.sets_in_stock);
  return filled ? color : undefined;
}

/**
 * What the add forms still need before a new style or listing can be shown at once (it is created shown, and a shown
 * one needs a color with a photo): null when the color's name and a photo are there.
 */
export function firstColorProblems(form: FormData): Record<string, string> | null {
  const problems: Record<string, string> = {
    ...(jsonList(form, "color_images").length === 0 ? { color_images: "Add at least one photo. The style is shown as soon as it is created." } : {}),
    ...(text(form, "color_name") === "" ? { color_name: "Enter the color's name." } : {}),
  };
  return Object.keys(problems).length > 0 ? problems : null;
}

/** The API reports the first color's problems on "color.code", "color.images.0.alt"…; its fields are "color_code"… */
export function firstColorField(name: string): string | null {
  return name.startsWith("color.") ? `color_${name.slice("color.".length)}` : null;
}
