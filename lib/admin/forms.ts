/** Form helpers are shared with the public site: see lib/forms.ts. */
import { jsonList, number, optional, text } from "@/lib/forms";

export * from "@/lib/forms";

/**
 * The first color of a new style or listing, from its "color_*" fields (FirstColorPanel), saved with it by the API.
 * Undefined when it was left empty: the color is then added on the style's page.
 */
export function firstColor(form: FormData): Record<string, unknown> | undefined {
  const color = {
    code: text(form, "color_code"),
    name: text(form, "color_name"),
    hex: optional(form, "color_hex"),
    images: jsonList<{ path: string; alt: string }>(form, "color_images"),
    ...(form.has("color_sets_in_stock") ? { sets_in_stock: number(form, "color_sets_in_stock") } : {}),
  };
  const filled = color.code !== "" || color.name !== "" || color.images.length > 0 || Boolean(color.sets_in_stock);
  return filled ? color : undefined;
}

/** The API reports the first color's problems on "color.code", "color.images.0.alt"…; its fields are "color_code"… */
export function firstColorField(name: string): string | null {
  return name.startsWith("color.") ? `color_${name.slice("color.".length)}` : null;
}
