"use client";

/*
 * When the root layout itself fails: a page of its own (no site styles load here), so it is styled inline.
 * The email is a fallback in case the website cannot reach its settings; keep it in sync with Company & business.
 */
export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#0b1530", color: "#f7f3ea", fontFamily: "system-ui, sans-serif" }}>
        <title>Something went wrong | PK Apparel</title>
        <main role="alert" style={{ maxWidth: 520, padding: 24, textAlign: "center" }}>
          <p style={{ letterSpacing: "0.25em", fontSize: 12, textTransform: "uppercase", color: "#f39b5b" }}>PK Apparel</p>
          <h1 style={{ fontSize: 36, margin: "12px 0" }}>Something went wrong.</h1>
          <p style={{ opacity: 0.75, lineHeight: 1.6 }}>
            The website could not load just now. Please try again in a moment, or email us at{" "}
            <a href="mailto:info@pkapparel.com" style={{ color: "#f7f3ea" }}>
              info@pkapparel.com
            </a>
            .
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{ marginTop: 24, padding: "12px 24px", borderRadius: 999, border: 0, background: "#e8712c", color: "#fff", fontSize: 16, cursor: "pointer" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
