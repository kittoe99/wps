import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: "WPS Canvas | Create Websites and Print Your Art on Canvas",
  description: "Create a website in minutes and turn images into gallery‑quality canvas prints with WPS Canvas. AI tools, easy publishing, fast delivery.",
  keywords: "WPS Canvas, AI website builder, website creator, no-code website, professional website design, AI web design, website builder tool, create website, canvas printing, print canvas art",
  authors: [{ name: "WPS Canvas" }],
  openGraph: {
    type: "website",
    title: "WPS Canvas | Create Websites and Print Your Art on Canvas",
    description: "Create a website in minutes and turn images into gallery‑quality canvas prints with WPS Canvas. AI tools, easy publishing, fast delivery.",
    siteName: "WPS Canvas",
  },
  twitter: {
    card: "summary_large_image",
    title: "WPS Canvas | Create Websites and Print Your Art on Canvas",
    description: "Create a website in minutes and turn images into gallery‑quality canvas prints with WPS Canvas. AI tools, easy publishing, fast delivery.",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
