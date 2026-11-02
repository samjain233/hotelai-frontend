import { NextResponse, type NextRequest } from "next/server";
import { loginUrlFor, SESSION_COOKIES } from "@/lib/routes";

/**
 * Sends visitors with no session cookie to /login before an admin page renders. Only checks that a
 * cookie exists: the JWT secret lives on the Nest API, and an expired access token is still renewed
 * client-side from the refresh token. A cookie that turns out to be invalid falls through to
 * `AdminShell`, which redirects once `/auth/me` fails.
 *
 * Do not add the auth pages here to bounce signed-in users away from /login: a stale cookie would
 * loop /login → /dashboard → /login.
 */
export function proxy(request: NextRequest) {
    if (SESSION_COOKIES.some((name) => request.cookies.get(name)?.value)) {
        return NextResponse.next();
    }
    const { pathname, search } = request.nextUrl;
    return NextResponse.redirect(new URL(loginUrlFor(pathname, search), request.url));
}

export const config = {
    // Exact paths only: `/menu/<slug>` and `/services/<slug>` are guest pages and `/staff/access` is
    // a sign-in page. Every page under `src/app/(admin)` must be listed (enforced by proxy.test.ts).
    matcher: [
        "/dashboard",
        "/orders",
        "/front-desk",
        "/kitchen",
        "/services",
        "/menu",
        "/menu/availability",
        "/menu-design",
        "/analytics",
        "/rooms",
        "/service-catalogue",
        "/staff",
        "/settings",
    ],
};
