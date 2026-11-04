import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const GOOGLE_STATE_COOKIE = "g_oauth_state";
/**
 * Marks a state value as a super-admin sign-in. Both flows share the one callback URL registered with
 * Google; the callback only trusts the prefix from the httpOnly state cookie, never from the query.
 */
export const PLATFORM_STATE_PREFIX = "p.";

/** Redirects to Google's consent screen and remembers `state` for the callback to compare. */
export function startGoogleOAuth(request: NextRequest, { platform }: { platform: boolean }): NextResponse {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
        return NextResponse.json({ message: "Google sign-in is not configured" }, { status: 503 });
    }

    const origin = request.nextUrl.origin;
    const nonce = randomBytes(16).toString("hex");
    const state = platform ? `${PLATFORM_STATE_PREFIX}${nonce}` : nonce;

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: `${origin}/api/auth/google/callback`,
        response_type: "code",
        scope: "openid email profile",
        state,
        prompt: "select_account",
        access_type: "offline",
    });

    const res = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
    res.cookies.set(GOOGLE_STATE_COOKIE, state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600,
        path: "/",
    });
    return res;
}
