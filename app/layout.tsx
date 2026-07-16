import type { Metadata } from "next";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

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
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif.variable} antialiased`}
      >
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
