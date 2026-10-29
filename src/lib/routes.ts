/**
 * Route classification shared by the auth provider, the API client and the admin shell.
 *
 * The guest menu lives at `/menu/<hotelSlug>` and admin pages live at `/menu` and `/menu/<sub-page>`,
 * so a prefix test alone cannot tell them apart. Admin sub-pages are listed explicitly here; the
 * backend reserves the same words so no hotel can claim them as a slug.
 */

/** Admin pages nested under /menu. Keep in sync with `RESERVED_HOTEL_SLUGS` in the backend. */
export const ADMIN_MENU_SUBPATHS = ["/menu/availability"] as const;

/** Guest-facing pages: `/menu/<slug>` and `/services/<slug>` (not the admin pages of the same name). */
export function isGuestRoute(pathname: string | null | undefined): boolean {
    if (!pathname) return false;
    if (ADMIN_MENU_SUBPATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return false;
    return /^\/(menu|services)\/[^/]+/.test(pathname);
}

/** Pages that never need a hotel session: landing, legal, guest menu. */
export function isPublicRoute(pathname: string | null | undefined): boolean {
    if (!pathname) return false;
    if (pathname === "/" || pathname === "/terms" || pathname === "/privacy") return true;
    return isGuestRoute(pathname);
}

const AUTH_PAGES = new Set([
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/verify-email/pending",
    "/staff/access",
]);

export function isAuthPage(pathname: string | null | undefined): boolean {
    return !!pathname && AUTH_PAGES.has(pathname);
}

/**
 * Routes where a 401 must not trigger a redirect to /login: public pages, the auth pages
 * themselves (redirect loop), and the platform admin (uses its own key, not the hotel JWT).
 */
export function isUnauthenticatedRoute(pathname: string | null | undefined): boolean {
    if (!pathname) return false;
    return isPublicRoute(pathname) || isAuthPage(pathname) || pathname.startsWith("/superadmin");
}

/**
 * Login URL that remembers where the user was, so a successful sign-in returns there.
 * Pass `window.location.pathname` and `window.location.search`.
 */
export function loginUrlFor(pathname: string, search = ""): string {
    const target = `${pathname}${search}`;
    if (!pathname || pathname === "/" || isAuthPage(pathname) || pathname === "/dashboard") return "/login";
    return `/login?next=${encodeURIComponent(target)}`;
}

/**
 * The `next` parameter from the current URL, if it is a safe same-origin path.
 * Rejects protocol-relative URLs (`//evil.com`), absolute URLs and auth pages.
 */
export function getSafeNextPath(search: string): string | null {
    const next = new URLSearchParams(search).get("next");
    if (!next) return null;
    if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return null;
    const pathOnly = next.split(/[?#]/)[0];
    if (isAuthPage(pathOnly) || pathOnly === "/") return null;
    return next;
}
