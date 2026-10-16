# PK Apparel website

pkapparel.com: the marketing website, the B2B made-to-order wholesale shop and the staff admin panel.
It is built with Next.js 16.4 (App Router, TypeScript, Tailwind CSS v4, shadcn/ui) with Cache Components.

**All data comes from the PHP API** (the separate `api` repository).
This app calls the API only from its server, through `lib/api.ts`, sending the shared client key, so the API address and key never reach browsers.

## Requirements

- **Node.js 20.9+.** Node 24 is used locally.
- **The PHP API,** running and reachable at `API_URL`.

## Set up locally

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill it in.
3. Start the API, then run `npm run dev`.
4. Open http://localhost:3000.
   - The design system is at `/styleguide` (development only).
   - The admin panel is at `/admin`. Staff accounts are created in the API repository with `php bin/create-staff.php`.

**Change `.env.local` rather than overriding variables on the command line** (e.g. `API_URL=… npm run dev`). A mismatch puts the browser into an endless reload loop.

## Commands

| Task | Command |
|---|---|
| Development server | `npm run dev` |
| Type-check | `npx tsc --noEmit` (after adding routes, run `npx next typegen` first) |
| Lint | `npm run lint` |
| Production build | `npm run build` |
| Run the production build | `npm start` |

**About the production build:**
- The build prerenders pages, so **the API must be reachable while building**.
- The `/uploads` proxy target is fixed at build time, so rebuild after changing `API_URL`.

## Configuration (`.env.local`)

`.env.local` holds secrets, so it is never committed. The template is `.env.example`.

| Variable | Meaning |
|---|---|
| `API_URL` | Where the PHP API runs, e.g. `http://127.0.0.1:8080` locally |
| `API_CLIENT_KEY` | Must equal `CLIENT_KEY` in the API's `.env` |
| `REVALIDATE_SECRET` | Must equal `REVALIDATE_SECRET` in the API's `.env` |
| `NEXT_PUBLIC_SITE_URL` | The public address of the site, used for canonical URLs, the sitemap and Open Graph |
| `SITE_INDEXABLE` | `true` only on the live site. Otherwise every page is `noindex` and `robots.txt` blocks crawlers. |

## How it works

- **Caching:** public data (settings, content, blog, catalog) is cached with `"use cache"`, `cacheLife("max")` and cache tags. The functions are in `lib/site.ts`, `lib/content.ts` and `lib/catalog.ts`.
  - When staff change something, the API calls `POST /api/revalidate` with a secret and the affected tags, e.g. `products` and `product:<slug>`. The admin's server actions also call `updateTag`.
  - The tagged data expires at once (`revalidateTag(tag, { expire: 0 })`), so the next visitor gets the new version. Only pages using those tags are rebuilt.
  - Shop, category, product and blog post pages set `ensureStatic = "navigation"`: they are always served complete, never as a fallback shell that would still show old content.
- **Uploads:** images are served on this domain at `/uploads/...`. A rewrite in `next.config.ts` proxies them to the API, so image URLs never point at the API.
- **Admin panel (`app/admin`):**
  - Staff log in with their API account. The login token is kept in the HttpOnly cookie `pk_admin` (path `/admin`).
  - `proxy.ts` sends visitors without that cookie to the login page.
  - The API checks the token and the staff member's role on every request. `lib/admin/session.ts` is the only way admin pages reach the API.
  - Forms post to server actions in `lib/admin/actions`.
- **Wholesale shop (`app/(site)/wholesale-shop`):** URLs keep the old site's pattern, `/wholesale-shop/{segment}/{type}/{style}`.
  - Old product URLs ending in an article number (`…-1051`) redirect permanently to the style with that color selected.
  - Until the cart exists, the product page's order panel sends a prefilled quote request.
- **Next.js 16 differs from older versions:** `proxy.ts` instead of middleware, `<Image preload>`, `revalidateTag(tag, "max")`, Cache Components. Read the bundled docs in `node_modules/next/dist/docs/` before changing framework-level code (see `AGENTS.md`).

| Folder | What it contains |
|---|---|
| `app/(site)/` | public pages, blog, shop |
| `app/admin/` | admin panel (`(panel)/` is everything behind the login) |
| `app/api/revalidate/` | cache refresh endpoint for the API |
| `components/` | `ui/` (shadcn), `layout/`, `site/`, `home/`, `shop/`, `forms/`, `admin/`, `brand/` |
| `lib/` | API client, data functions, server actions, helpers |
| `assets/` | photos and the logo used in the code |
