import Script from "next/script";

const measurementId = process.env.NEXT_PUBLIC_GA_ID;

/**
 * Google Analytics 4, on the public pages only. Renders nothing without NEXT_PUBLIC_GA_ID.
 * Page changes inside the site are counted by GA's enhanced measurement (on by default for a web stream).
 * Its domains are allowed in the Content-Security-Policy in next.config.ts.
 */
export function GoogleAnalytics() {
  if (!measurementId) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} />
      <Script id="google-analytics">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${measurementId}');`}
      </Script>
    </>
  );
}
