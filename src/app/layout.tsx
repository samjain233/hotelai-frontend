import type { Metadata } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";
import "./globals.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Hotel AI | Digital Room Service",
  description: "Professional hotel room service platform with QR-based ordering, real-time kitchen management, and AI-powered guest experience.",
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
      </body>
    </html>
  );
}
