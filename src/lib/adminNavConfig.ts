/**
 * Phase 1 (default): hide ordering/ops tabs — hotels focus on menu + rooms + settings.
 * Set NEXT_PUBLIC_ENABLE_ORDERING_ADMIN_NAV=true to show Orders, Services, Kitchen.
 * Staff (/staff) is in the nav for OWNER and GENERAL_MANAGER; it is not gated by this flag.
 */
export const ENABLE_ORDERING_ADMIN_NAV =
    process.env.NEXT_PUBLIC_ENABLE_ORDERING_ADMIN_NAV === "true";

/** Admin sidebar hrefs hidden when ordering nav is disabled (staff management is separate). */
export const ORDERING_ADMIN_NAV_HREFS = ["/orders", "/services", "/kitchen"] as const;

export function isOrderingAdminNavPath(pathname: string): boolean {
    return ORDERING_ADMIN_NAV_HREFS.some(
        (p) => pathname === p || pathname.startsWith(`${p}/`),
    );
}

export function filterVisibleNavItems<T extends { href: string }>(items: T[]): T[] {
    if (ENABLE_ORDERING_ADMIN_NAV) return items;
    const hidden = new Set<string>(ORDERING_ADMIN_NAV_HREFS);
    return items.filter((item) => !hidden.has(item.href));
}
