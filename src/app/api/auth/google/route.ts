import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

const STATE_COOKIE = "g_oauth_state";

export async function GET(request: NextRequest) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
        return NextResponse.json({ message: "Google sign-in is not configured" }, { status: 503 });
    }

    const origin = request.nextUrl.origin;
    const redirectUri = `${origin}/api/auth/google/callback`;
    const state = randomBytes(16).toString("hex");

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid email profile",
        state,
        prompt: "select_account",
        access_type: "offline",
    });

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    const res = NextResponse.redirect(url);
    const isProd = process.env.NODE_ENV === "production";
    res.cookies.set(STATE_COOKIE, state, {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        maxAge: 600,
        path: "/",
    });
    return res;
}
