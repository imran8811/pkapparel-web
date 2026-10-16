/** Uploaded files are served on the website's own domain (/uploads is proxied to the API). Safe for client components. */
export function mediaSrc(path: string): string {
  return `/${path.replace(/^\/+/, "")}`;
}
