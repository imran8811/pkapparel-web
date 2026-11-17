/*
 * Web addresses made from names, the way the API makes them (App\Core\Text::slug), so the admin's new style and listing
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

/**
 * The web address once the name changed: made from the new name while it was empty or made from the old name. An
 * address staff typed themselves stays.
 */
export function addressForName(address: string, oldName: string, newName: string): string {
  return address === "" || address === slugify(oldName) ? slugify(newName) : address;
}
