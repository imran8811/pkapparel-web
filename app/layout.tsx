import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const indexable = process.env.SITE_INDEXABLE === "true";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "PK Apparel | Denim manufacturer in Lahore, Pakistan",
    template: "%s | PK Apparel",
  },
  description:
    "Made-to-order jeans, denim jackets, shorts, cargo and chino pants for men, women and kids. In-house cutting, stitching and washing in Lahore, shipped worldwide by air or sea.",
  applicationName: "PK Apparel",
  openGraph: {
    type: "website",
    siteName: "PK Apparel",
    locale: "en_US",
  },
  robots: indexable ? undefined : { index: false, follow: false },
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
