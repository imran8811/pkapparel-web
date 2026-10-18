import { MissingPageReporter } from "@/components/layout/missing-page-reporter";
import { NotFoundPanel } from "@/components/layout/not-found-panel";

/** 404 for URLs that match no route (rendered without the site header/footer). The address is reported to Admin → Redirects. */
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col">
      <NotFoundPanel showLogo className="flex flex-1 items-center" />
      <MissingPageReporter />
    </main>
  );
}
