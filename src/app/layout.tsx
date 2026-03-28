import type { Metadata } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";
import { getSiteUrl } from "@/lib/site-config";
import "./globals.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const siteUrl = getSiteUrl();

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
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
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href={API_URL} crossOrigin="anonymous" />
      </head>
      <body className={`${outfit.variable} ${playfair.variable} font-sans antialiased selection:bg-primary/30 selection:text-white`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>{children}</AuthProvider>
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
