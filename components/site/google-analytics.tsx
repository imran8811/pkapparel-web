import Script from "next/script";

const containerId = process.env.NEXT_PUBLIC_GTM_ID;

/**
 * The Google tag for our Tag Manager container, on the public pages only. Renders nothing without NEXT_PUBLIC_GTM_ID.
 * Which tags run (GA4 included) is decided inside the container, so the GA4 Measurement ID is set there, not here.
 * Page changes inside the site are counted by GA's enhanced measurement (on by default for a web stream).
 * Its domains are allowed in the Content-Security-Policy in next.config.ts.
 */
export function GoogleAnalytics() {
  if (!containerId) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtm.js?id=${containerId}`} />
      <Script id="google-analytics">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());`}
      </Script>
    </>
  );
}
