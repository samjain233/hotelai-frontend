/**
 * Canonical site URL for metadataBase, sitemap, and robots.
 * Set NEXT_PUBLIC_SITE_URL in production (e.g. https://yourdomain.com).
 * On Vercel, falls back to the project's production domain so builds never ship localhost.
 */
export function getSiteUrl(): string {
    const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (raw) return raw.replace(/\/$/, "");
    const vercelProduction = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL?.trim();
    if (vercelProduction) return `https://${vercelProduction.replace(/\/$/, "")}`;
    return "http://localhost:3000";
}
