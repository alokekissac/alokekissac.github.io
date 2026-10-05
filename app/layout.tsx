import { PageSky } from "@/components/background/PageSky";
import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@fontsource/instrument-serif/latin-400-italic.css";
import "./globals.css";
import { CustomCursor } from "@/components/layout/CustomCursor";
import { Navbar } from "@/components/layout/Navbar";
import { Providers } from "@/components/layout/Providers";
import { site } from "@/data/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: site.title,
  description: site.description,
  applicationName: `${site.name} — Portfolio`,
  authors: [{ name: site.name }],
  keywords: ["Aloke", "AI Engineer", "Full Stack Developer", "Machine Learning", "RAG", "LLM", "Next.js", "Dublin"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: site.name,
    title: site.title,
    description: site.description,
    locale: "en_IE",
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#06060a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only rounded-full bg-fg px-4 py-2 text-sm font-medium text-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200]"
        >
          Skip to content
        </a>
        <PageSky />
        <Providers>
          <Navbar />
          <main id="main" className="overflow-x-clip">{children}</main>
          <CustomCursor />
        </Providers>
        <div aria-hidden="true" className="grain pointer-events-none fixed inset-0 z-[60]" />
      </body>
    </html>
  );
}
