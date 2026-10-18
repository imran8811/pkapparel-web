import { MissingPageReporter } from "@/components/layout/missing-page-reporter";
import { NotFoundPanel } from "@/components/layout/not-found-panel";

/** 404 inside public pages (keeps the site header and footer). The address is reported to Admin → Redirects. */
export default function SiteNotFound() {
  return (
    <>
      <NotFoundPanel />
      <MissingPageReporter />
    </>
  );
}
