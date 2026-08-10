import type { Metadata } from "next";
import "./globals.css";
import SiteChrome from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "wpscanvas — Your Website, Powered by AI",
  description: "A website that runs your business while you sleep. Website, AI chatbot, Google reviews, and phone answering — one flat monthly fee.",
  keywords: "WPS Canvas, AI website, AI chatbot, Google reviews, AI phone answering, local business website, website subscription",
  authors: [{ name: "wpscanvas" }],
  openGraph: {
    type: "website",
    title: "wpscanvas — Your Website, Powered by AI",
    description: "Website, AI chatbot, reviews generator, and phone answering — all included in one subscription.",
    siteName: "wpscanvas",
  },
  twitter: {
    card: "summary_large_image",
    title: "wpscanvas — Your Website, Powered by AI",
    description: "Website, AI chatbot, reviews generator, and phone answering — all included in one subscription.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
