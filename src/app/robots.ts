import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
    const base = getSiteUrl();
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: [
                    "/dashboard",
                    "/orders",
                    "/kitchen",
                    "/rooms",
                    "/settings",
                    "/staff",
                    "/menu-design",
                    "/superadmin",
                    "/login",
                    "/register",
                    "/forgot-password",
                    "/reset-password",
                    "/verify-email",
                    "/staff/",
                    "/admin/",
                ],
            },
        ],
        sitemap: `${base}/sitemap.xml`,
    };
}
