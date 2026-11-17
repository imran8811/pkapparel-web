/*
 * Web addresses made from names, the way the API makes them (App\Core\Text::slug), so the admin's style and listing
 * forms can show the address while the name is typed.
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

/** A saved style or listing: its name, and the web address it has (made from the name or not). */
export type SavedAddress = { name: string; address: string };

/**
 * The web address a name gives: the name's own, followed by `suffix` (a stock listing's color, e.g. "-sky-blue").
 * For the saved name, the saved address, whatever it is (numbered, or typed by staff).
 */
export function nameAddress(name: string, saved: SavedAddress | null = null, suffix = ""): string {
  const slug = slugify(name, 190 - suffix.length);
  if (saved && saved.address !== "" && slug === slugify(saved.name, 190 - suffix.length)) return saved.address;
  return slug === "" ? "" : `${slug}${suffix}`;
}

/**
 * The web address once the name changed: what the new name gives, while it was empty or what the old name gave. An
 * address staff typed themselves stays.
 */
export function addressForName(address: string, oldName: string, newName: string, saved: SavedAddress | null = null, suffix = ""): string {
  return address === "" || address === nameAddress(oldName, saved, suffix) ? nameAddress(newName, saved, suffix) : address;
}
