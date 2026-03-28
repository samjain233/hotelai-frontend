/**
 * Canonical site URL for metadataBase, sitemap, and robots.
 * Set NEXT_PUBLIC_SITE_URL in production (e.g. https://yourdomain.com).
 */
export function getSiteUrl(): string {
    const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (raw) return raw.replace(/\/$/, "");
    return "http://localhost:3000";
}
