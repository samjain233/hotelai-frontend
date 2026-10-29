import type { Metadata } from "next";
import { Cormorant_Garamond, IBM_Plex_Mono, Outfit, Oswald, Playfair_Display } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { SWRProvider } from "@/components/SWRProvider";
import { Toaster } from "sonner";
import { getSiteUrl } from "@/lib/site-config";
import "./globals.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const siteUrl = getSiteUrl();

// latin-ext carries the rupee sign (U+20B9), used on every price; preload it with the base subset.
const outfit = Outfit({
  subsets: ["latin", "latin-ext"],
  variable: "--font-outfit",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

// Condensed face for the "Board" guest menu template only. Not preloaded: browsers fetch
// the file lazily, so pages that never use `font-condensed` pay nothing beyond the @font-face rule.
const oswald = Oswald({
  subsets: ["latin", "latin-ext"],
  variable: "--font-oswald",
  preload: false,
});

// Garamond for the "Heritage" guest menu template only; same lazy-load reasoning as Oswald.
const cormorant = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  preload: false,
});

// Monospace for the "Bistro" guest menu template only (dish numbers and prices); lazy like the others.
const plexMono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  preload: false,
});

import { ThemeProvider } from "@/components/ThemeProvider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Hotel AI | Digital Room Service",
    template: "%s | Hotel AI",
  },
  description:
    "Professional hotel room service platform with QR-based ordering, real-time kitchen management, and AI-powered guest experience.",
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Hotel AI",
    title: "Hotel AI | Digital Room Service",
    description:
      "Professional hotel room service platform with QR-based ordering, real-time kitchen management, and AI-powered guest experience.",
    url: siteUrl,
    images: [{ url: "/android-chrome-512x512.png", width: 512, height: 512, alt: "Hotel AI" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hotel AI | Digital Room Service",
    description:
      "Professional hotel room service platform with QR-based ordering, real-time kitchen management, and AI-powered guest experience.",
    images: ["/android-chrome-512x512.png"],
  },
  icons: {
    icon: [
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Font variables live on <html> so Tailwind's :root --font-sans/--font-serif can resolve them.
  return (
    <html lang="en" className={`${outfit.variable} ${playfair.variable} ${oswald.variable} ${cormorant.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href={API_URL} crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased selection:bg-primary/30 selection:text-white">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SWRProvider>
            <AuthProvider>{children}</AuthProvider>
          </SWRProvider>
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
