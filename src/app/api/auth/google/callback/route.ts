import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";

const STATE_COOKIE = "g_oauth_state";
const AUTH_COOKIE = "auth_token";
const COOKIE_MAX_AGE = 90 * 24 * 60 * 60; // ~3 months, match backend JWT

function backendBaseUrl(): string {
    return (
        process.env.API_URL?.replace(/\/$/, "") ||
        process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
        "http://localhost:5000"
    );
}

export async function GET(request: NextRequest) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const bridgeSecret = process.env.GOOGLE_OAUTH_BRIDGE_SECRET;

    const origin = request.nextUrl.origin;
    const fail = (path: string) => {
        const r = NextResponse.redirect(`${origin}${path}`);
        r.cookies.delete(STATE_COOKIE);
        return r;
    };

    if (!clientId || !clientSecret || !bridgeSecret) {
        return fail("/login?error=" + encodeURIComponent("Google sign-in is not configured"));
    }

    const errParam = request.nextUrl.searchParams.get("error");
    if (errParam) {
        return fail("/login?error=google_denied");
    }

    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const cookieState = request.cookies.get(STATE_COOKIE)?.value;
    if (!code || !state || !cookieState || state !== cookieState) {
        return fail("/login?error=oauth_state");
    }

    const redirectUri = `${origin}/api/auth/google/callback`;
    const client = new OAuth2Client(clientId, clientSecret, redirectUri);

    let idToken: string;
    try {
        const { tokens } = await client.getToken(code);
        if (!tokens.id_token) {
            return fail("/login?error=google_token");
        }
        idToken = tokens.id_token;
    } catch {
        return fail("/login?error=google_token");
    }

    let payload: { sub: string; email: string; name?: string };
    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: clientId,
        });
        const p = ticket.getPayload();
        if (!p?.sub || !p.email) {
            return fail("/login?error=google_profile");
        }
        payload = { sub: p.sub, email: p.email, name: p.name || undefined };
    } catch {
        return fail("/login?error=google_profile");
    }

    const syncRes = await fetch(`${backendBaseUrl()}/auth/google/sync`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Hotel-AI-Google-Sync": bridgeSecret,
        },
        body: JSON.stringify({
            googleId: payload.sub,
            email: payload.email.toLowerCase(),
            name: (payload.name || payload.email.split("@")[0]).trim(),
        }),
    });

    if (!syncRes.ok) {
        const j = (await syncRes.json().catch(() => ({}))) as {
            message?: string | string[];
        };
        const msg = Array.isArray(j.message)
            ? j.message[0]
            : typeof j.message === "string"
              ? j.message
              : "sync_failed";
        return fail("/login?error=" + encodeURIComponent(msg));
    }

    const data = (await syncRes.json()) as { token: string };
    if (!data.token) {
        return fail("/login?error=sync_failed");
    }

    const isProd = process.env.NODE_ENV === "production";
    const nextRes = NextResponse.redirect(`${origin}/`);
    nextRes.cookies.delete(STATE_COOKIE);
    nextRes.cookies.set(AUTH_COOKIE, data.token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        maxAge: COOKIE_MAX_AGE,
        path: "/",
    });
    return nextRes;
}
