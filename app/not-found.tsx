import { NotFoundPanel } from "@/components/layout/not-found-panel";

/** 404 for URLs that match no route (rendered without the site header/footer). */
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col">
      <NotFoundPanel showLogo className="flex flex-1 items-center" />
    </main>
  );
}
