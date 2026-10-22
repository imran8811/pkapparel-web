import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { siteUrl } from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  // Small labels and codes only: not preloaded, so it does not compete with the CSS and main fonts on a slow connection.
  preload: false,
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const indexable = process.env.SITE_INDEXABLE === "true";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "PK Apparel | Garment manufacturer in Lahore, Pakistan",
    template: "%s | PK Apparel",
  },
  description:
    "Made-to-order jeans, denim jackets, shorts, T-shirts, hoodies and polo shirts for men and women, and men's cargo and chino pants. Made in our own factory in Lahore, shipped worldwide by air or sea.",
  applicationName: "PK Apparel",
  openGraph: {
    type: "website",
    siteName: "PK Apparel",
    locale: "en_US",
  },
  robots: indexable ? undefined : { index: false, follow: false },
  // Search Console and Bing Webmaster Tools: the "HTML tag" verification codes (owner decision 2026-10-17).
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION } : undefined,
  },
};

export const viewport: Viewport = {
  themeColor: "#0b132b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
