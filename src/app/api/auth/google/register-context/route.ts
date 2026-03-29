import { createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";

const COOKIE = "g_oauth_register";
const TTL_MS = 10 * 60 * 1000;
const MIN_HOTEL = 2;
const MAX_LEN = 200;

function signPayload(payloadB64: string, secret: string): string {
    return createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

/**
 * Stores hotel + admin display name before redirecting to Google OAuth (register page only).
 * Signed with GOOGLE_OAUTH_BRIDGE_SECRET so the callback can trust it.
 */
export async function POST(request: NextRequest) {
    const secret = process.env.GOOGLE_OAUTH_BRIDGE_SECRET?.trim();
    if (!secret) {
        return NextResponse.json({ message: "Google register context is not configured" }, { status: 503 });
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
    }

    const o = body as { hotelName?: unknown; adminName?: unknown };
    const hotelName = typeof o.hotelName === "string" ? o.hotelName.trim() : "";
    const adminName = typeof o.adminName === "string" ? o.adminName.trim() : "";

    if (hotelName.length < MIN_HOTEL) {
        return NextResponse.json({ message: "Hotel name is required" }, { status: 400 });
    }
    if (hotelName.length > MAX_LEN || adminName.length > MAX_LEN) {
        return NextResponse.json({ message: "Name too long" }, { status: 400 });
    }
    if (adminName.length < 1) {
        return NextResponse.json({ message: "Your name is required" }, { status: 400 });
    }

    const payloadObj = { hotelName, adminName, exp: Date.now() + TTL_MS };
    const payloadB64 = Buffer.from(JSON.stringify(payloadObj)).toString("base64url");
    const sig = signPayload(payloadB64, secret);
    const value = `${payloadB64}.${sig}`;

    const res = NextResponse.json({ ok: true });
    const isProd = process.env.NODE_ENV === "production";
    res.cookies.set(COOKIE, value, {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        maxAge: 600,
        path: "/",
    });
    return res;
}
