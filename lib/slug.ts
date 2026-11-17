/*
 * Web addresses made from names, the way the API makes them (App\Core\Text::slug and styleSlug), so the admin's style
 * and listing forms can show the address while the name and style no. are typed.
 */

/** Letters the API's transliteration (Latin-ASCII) writes as other letters, which Unicode does not split up. */
const LATIN: Record<string, string> = { ß: "ss", æ: "ae", œ: "oe", ø: "o", đ: "d", ð: "d", ł: "l", þ: "th", ı: "i" };

/** "Men's Slim Jeans (copy)" → "men-s-slim-jeans-copy": no accents, lower case, any other characters a hyphen. */
export function slugify(text: string, maxLength = 190): string {
  const latin = text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[ßæœøđðłþı]/g, (letter) => LATIN[letter] ?? letter);
  return latin
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/, "");
}

/** What a style's or listing's web address is made from. */
export type AddressParts = { name: string; styleNo: string };

/**
 * "men-s-sky-blue-stretch-jeans-1051": the name's address, then `suffix` (a stock listing's color, when its address
 * has it), then the style no.'s, as the API's Text::styleSlug makes it. Empty without a name.
 */
export function styleAddress({ name, styleNo }: AddressParts, suffix = ""): string {
  const number = slugify(styleNo);
  const tail = `${suffix}${number ? `-${number}` : ""}`;
  const slug = slugify(name, 190 - tail.length);
  return slug === "" ? "" : `${slug}${tail}`;
}

/** A saved style or listing: what its address was made from, and the address it has (made from them or not). */
export type SavedAddress = AddressParts & { address: string };

/** The web address the name and style no. give; for the saved ones, the saved address, whatever it is. */
export function nameAddress(parts: AddressParts, saved: SavedAddress | null = null, suffix = ""): string {
  const same = saved && saved.address !== "" && slugify(parts.name) === slugify(saved.name) && slugify(parts.styleNo) === slugify(saved.styleNo);
  return same ? saved.address : styleAddress(parts, suffix);
}

/**
 * The web address once the name or style no. changed: what they give now, while it was empty or what they gave
 * before. An address staff typed themselves stays.
 */
export function addressFor(address: string, before: AddressParts, after: AddressParts, saved: SavedAddress | null = null, suffix = ""): string {
  return address === "" || address === nameAddress(before, saved, suffix) ? nameAddress(after, saved, suffix) : address;
}
