import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";

const STATE_COOKIE = "g_oauth_state";
const REGISTER_COOKIE = "g_oauth_register";
const AUTH_COOKIE = "auth_token";
const COOKIE_MAX_AGE = 90 * 24 * 60 * 60; // ~3 months, match backend JWT

function backendBaseUrl(): string {
    return (
        process.env.API_URL?.replace(/\/$/, "") ||
        process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
        "http://localhost:5000"
    );
}

function parseRegisterCookie(
    raw: string | undefined,
    secret: string,
): { hotelName: string; adminName: string } | null {
    if (!raw || !secret) return null;
    const dot = raw.lastIndexOf(".");
    if (dot <= 0) return null;
    const payloadB64 = raw.slice(0, dot);
    const sig = raw.slice(dot + 1);
    const expected = createHmac("sha256", secret).update(payloadB64).digest("base64url");
    try {
        const a = Buffer.from(sig, "utf8");
        const b = Buffer.from(expected, "utf8");
        if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    } catch {
        return null;
    }
    let parsed: { hotelName?: string; adminName?: string; exp?: number };
    try {
        parsed = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as {
            hotelName?: string;
            adminName?: string;
            exp?: number;
        };
    } catch {
        return null;
    }
    if (typeof parsed.hotelName !== "string" || !parsed.hotelName.trim()) return null;
    if (typeof parsed.exp !== "number" || parsed.exp < Date.now()) return null;
    const adminName = typeof parsed.adminName === "string" ? parsed.adminName.trim() : "";
    if (!adminName) return null;
    return { hotelName: parsed.hotelName.trim(), adminName };
}

export async function GET(request: NextRequest) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const bridgeSecret = process.env.GOOGLE_OAUTH_BRIDGE_SECRET ?? "";

    const origin = request.nextUrl.origin;
    const registerCtx = parseRegisterCookie(request.cookies.get(REGISTER_COOKIE)?.value, bridgeSecret);

    const fail = (path: string) => {
        const r = NextResponse.redirect(`${origin}${path}`);
        r.cookies.delete(STATE_COOKIE);
        r.cookies.delete(REGISTER_COOKIE);
        return r;
    };

    const failAuth = (errorKey: string) => {
        const base = registerCtx ? "/register" : "/login";
        return fail(`${base}?error=${encodeURIComponent(errorKey)}`);
    };

    if (!clientId || !clientSecret || !bridgeSecret) {
        return failAuth("Google sign-in is not configured");
    }

    const errParam = request.nextUrl.searchParams.get("error");
    if (errParam) {
        return failAuth("google_denied");
    }

    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const cookieState = request.cookies.get(STATE_COOKIE)?.value;
    if (!code || !state || !cookieState || state !== cookieState) {
        return failAuth("oauth_state");
    }

    const redirectUri = `${origin}/api/auth/google/callback`;
    const client = new OAuth2Client(clientId, clientSecret, redirectUri);

    let idToken: string;
    try {
        const { tokens } = await client.getToken(code);
        if (!tokens.id_token) {
            return failAuth("google_token");
        }
        idToken = tokens.id_token;
    } catch {
        return failAuth("google_token");
    }

    let payload: { sub: string; email: string; name?: string };
    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: clientId,
        });
        const p = ticket.getPayload();
        if (!p?.sub || !p.email) {
            return failAuth("google_profile");
        }
        payload = { sub: p.sub, email: p.email, name: p.name || undefined };
    } catch {
        return failAuth("google_profile");
    }

    const syncBody: Record<string, string> = {
        googleId: payload.sub,
        email: payload.email.toLowerCase(),
        name: (payload.name || payload.email.split("@")[0]).trim(),
    };
    if (registerCtx) {
        syncBody.hotelName = registerCtx.hotelName;
        syncBody.adminName = registerCtx.adminName;
    }

    const syncRes = await fetch(`${backendBaseUrl()}/auth/google/sync`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Hotel-AI-Google-Sync": bridgeSecret,
        },
        body: JSON.stringify(syncBody),
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
        const base = registerCtx ? "/register" : "/login";
        return fail(`${base}?error=${encodeURIComponent(msg)}`);
    }

    const data = (await syncRes.json()) as { token: string };
    if (!data.token) {
        const base = registerCtx ? "/register" : "/login";
        return fail(`${base}?error=${encodeURIComponent("sync_failed")}`);
    }

    const isProd = process.env.NODE_ENV === "production";
    const nextRes = NextResponse.redirect(`${origin}/`);
    nextRes.cookies.delete(STATE_COOKIE);
    nextRes.cookies.delete(REGISTER_COOKIE);
    nextRes.cookies.set(AUTH_COOKIE, data.token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        maxAge: COOKIE_MAX_AGE,
        path: "/",
    });
    return nextRes;
}
