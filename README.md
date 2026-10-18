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
   - The admin panel is at `/admin`. The first staff account is created in the API repository with `php bin/create-staff.php`; admins add the others under *Staff accounts*.

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
| `GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION` | Optional: the codes from Google Search Console and Bing Webmaster Tools ("HTML tag" verification, the `content` value only) |

## How it works

- **Caching:** public data (settings, content, blog, catalog) is cached with `"use cache"`, `cacheLife("max")` and cache tags. The functions are in `lib/site.ts`, `lib/content.ts` and `lib/catalog.ts`.
  - When staff change something, the API calls `POST /api/revalidate` with a secret and the affected tags, e.g. `products` and `product:<slug>`. The admin's server actions also call `updateTag`.
  - The tagged data expires at once (`revalidateTag(tag, { expire: 0 })`), so the next visitor gets the new version. Only pages using those tags are rebuilt.
  - Shop, category, product and blog post pages set `ensureStatic = "navigation"`: they are always served complete, never as a fallback shell that would still show old content.
- **Uploads:** images are served on this domain at `/uploads/...`. A rewrite in `next.config.ts` proxies them to the API, so image URLs never point at the API.
  - It is a `beforeFiles` rewrite: otherwise the catch-all page below would answer these URLs.
- **Old and changed addresses:**
  - `next.config.ts` redirects the old site's fixed URL patterns (old blog addresses, `/user-account` and others).
  - Old product links ending in an article number are redirected by the product page.
  - Staff manage other redirects in the admin (*Redirects*); changing a style's or post's address adds one there automatically. They are followed by `findRedirect()` (`lib/redirects.ts`, cache tag `redirects`) in the catch-all page `app/(site)/[...path]` and before the shop and blog pages show "not found".
  - These pages decide on the redirect or the 404 before anything streams, so both keep their HTTP status. For the same reason they export `instant = false`: reading the address at the top would otherwise raise the "URL data outside of Suspense" insight in development.
  - The "page not found" pages report the address (`MissingPageReporter`, `lib/actions/missing-pages.ts`). Staff see these addresses in *Redirects → Not found*, most visited first.
- **Error pages:** `app/(site)/error.tsx` (inside the site header and footer), `app/admin/(panel)/error.tsx`, and `app/global-error.tsx` when the root layout fails.
- **Security headers** (`next.config.ts`):
  - A Content-Security-Policy without per-request nonces, so pages stay static. Everything loads from this domain; adding a third-party script, font or frame means adding it to the policy.
  - On an `https://` site URL, also HSTS (one year) and `upgrade-insecure-requests`.
- **Admin panel (`app/admin`):**
  - Staff log in with their API account. The login token is kept in the HttpOnly cookie `pk_admin` (path `/admin`).
  - `proxy.ts` sends visitors without that cookie to the login page.
  - The API checks the token and the staff member's role on every request. `lib/admin/session.ts` is the only way admin pages reach the API.
  - `lib/admin/permissions.ts` mirrors the roles, only to hide what a role cannot use: production staff see stages and photos, sales staff the order workflow and a read-only payment queue, admins everything (only they confirm payments).
  - Forms post to server actions in `lib/admin/actions`.
  - **Orders:** the order page (`app/admin/(panel)/orders/[id]`) offers the next steps for its status: payments, production stages and photos, charges, documents, ready to ship, shipped, delivered, hold, cancel and notes. *Payments* is the queue of reported transfers.
  - **Dashboard:** admins see a launch checklist (what is still missing before the shop takes orders) until every item is done.
- **Wholesale shop (`app/(site)/wholesale-shop`):** URLs keep the old site's pattern, `/wholesale-shop/{segment}/{type}/{style}`.
  - Old product URLs ending in an article number (`…-1051`) redirect permanently to the style with that color selected.
  - The product page's order panel adds pieces to the cart; a prefilled quote request and WhatsApp stay available.
- **Buyer accounts, cart and checkout** (`/login`, `/signup`, `/cart`, `/checkout`, `/account/*`):
  - **Cookies:**
    - `pk_session` is the buyer's login token (HttpOnly, 30 days).
    - `pk_cart` identifies a guest's cart (HttpOnly). The API merges that cart into the account at login.
    - `pk_ui` is display-only (logged in, number of colors in the cart). The static header reads it in the browser; it holds nothing secret.
  - **Data access:** `lib/account/session.ts` is the only way buyer pages reach the API. A rejected login goes through `/account/session-ended`, which clears the cookies.
  - **Login required:** `proxy.ts` sends visitors without `pk_session` from `/account`, `/checkout` and `/samples/order` to the login page (with `?next=`, so the choice is kept).
  - **Forms** use `<ActionForm>` from `components/forms/action-form.tsx` (the public counterpart of the admin's `<AdminForm>`). Server actions live in `lib/account/actions`.
  - **The order page** shows the production timeline with photos, the shipment and tracking, and the documents (proforma and balance invoice, receipts, files staff share). Sample orders use the same pages with their own wording (no deposit, production or balance invoice).
  - **Downloads and private photos** go through route handlers that fetch the file from the API with the login token, so the token never reaches the browser:
    - buyers: `/account/orders/{orderNo}/` + `proforma-invoice`, `invoice`, `receipts/{receiptNo}`, `documents/{id}`, `photos/{id}`
    - admin: `/admin/orders/{id}/proforma-invoice` and `/invoice`, `/admin/payments/{id}/slip` and `/receipt`, `/admin/order-documents/{id}`, `/admin/order-photos/{id}`, `/admin/inquiry-files/{id}`
    - Photos are shown with a plain `<img>`, because the image optimizer would fetch them without the login cookie. They are shrunk in the browser before upload (one per request; the host accepts at most 4.5 MB per request).
  - **The email confirmation link** (`/verify-email?token=…`) is a route handler that confirms the address and redirects.
- **Quote requests, samples and reviews:**
  - **Files on the quote form** (`/request-quote`, `components/forms/file-attachments.tsx`) upload one by one through the `uploadInquiryFile` server action, up to 4 MB each (photos are shrunk in the browser first). The form sends the tokens the API returns.
  - **Samples:** `/samples` has the sample picker. Product pages link to it with `?style=…&color=…`. The choice goes to `/samples/order?i={colorId}|{size}|{qty}` (plus `&custom=1` for a sample of the buyer's own design), which shows the courier for the chosen address and places the order.
    - Custom designs are priced by staff first ("Send the price" on the admin order page).
    - Paid samples are deducted from the buyer's first bulk order once its deposit is confirmed.
  - **Reviews:** buyers write them from the emailed link (`/review?token=…`, no login needed) or from the order page (`/account/orders/{orderNo}/review`).
    - Staff approve them under *Buyer reviews → From orders*, and can add one to the home page.
    - Product pages show approved reviews, with the rating in their structured data.
  - **The minimum per size** (default 20 pieces of each size ordered in a color) is shown in the order panel and the cart. The API blocks checkout below it.
- **Next.js 16 differs from older versions:** `proxy.ts` instead of middleware, `<Image preload>`, `revalidateTag(tag, "max")`, Cache Components. Read the bundled docs in `node_modules/next/dist/docs/` before changing framework-level code (see `AGENTS.md`).

| Folder | What it contains |
|---|---|
| `app/(site)/` | public pages, blog, shop, cart, checkout and the buyer account |
| `app/admin/` | admin panel (`(panel)/` is everything behind the login) |
| `app/api/revalidate/` | cache refresh endpoint for the API |
| `components/` | `ui/` (shadcn), `layout/`, `site/`, `home/`, `shop/`, `forms/`, `account/`, `admin/`, `brand/` |
| `lib/` | API client, data functions, server actions, helpers |
| `assets/` | photos and the logo used in the code |
