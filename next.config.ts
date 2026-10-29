import type { NextConfig } from "next";
import { GUEST_MENU_IMAGE_HOSTS } from "./src/lib/guestMenuImageHosts";

const isDev = process.env.NODE_ENV !== "production";
const apiOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").origin;
  } catch {
    return "";
  }
})();

/** Enforced now: cannot break the app, and blocks clickjacking and base-tag / plugin injection. */
const enforcedCsp = ["frame-ancestors 'none'", "base-uri 'self'", "object-src 'none'"].join("; ");

/**
 * Full policy in report-only mode: violations show in the browser console without blocking anything.
 * Once it stays quiet in production, move it to `Content-Security-Policy`.
 */
const reportOnlyCsp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  [
    "connect-src 'self'",
    apiOrigin,
    "https://vercel.com",
    "https://*.vercel-storage.com",
    "https://va.vercel-scripts.com",
    "https://vitals.vercel-insights.com",
    isDev ? "ws: wss:" : "",
  ]
    .filter(Boolean)
    .join(" "),
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: enforcedCsp },
  { key: "Content-Security-Policy-Report-Only", value: reportOnlyCsp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // Single source of truth for allowed image hosts: src/lib/guestMenuImageHosts.ts
    remotePatterns: GUEST_MENU_IMAGE_HOSTS.map((hostname) => ({
      protocol: "https" as const,
      hostname,
      pathname: "/**",
    })),
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
