import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const AUTH_COOKIE_NAME = 'auth_token';
const COOKIE_MAX_AGE = 90 * 24 * 60 * 60;

function extractTokenFromSetCookie(setCookieHeaders: string[]): string | null {
    const prefix = `${AUTH_COOKIE_NAME}=`;
    for (const header of setCookieHeaders) {
        const part = header.split(';')[0]?.trim();
        if (part?.startsWith(prefix)) {
            return part.slice(prefix.length).trim();
        }
    }
    return null;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const hotelId = typeof body.hotelId === 'string' ? body.hotelId.trim() : '';
        if (!hotelId) {
            return NextResponse.json({ message: 'hotelId is required' }, { status: 400 });
        }

        const platformKey = request.headers.get('x-platform-key') || '';
        const res = await fetch(`${API_URL}/platform/hotels/${encodeURIComponent(hotelId)}/impersonate-admin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-platform-key': platformKey,
            },
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            return NextResponse.json(data, { status: res.status });
        }

        let token: string | null = (data as { token?: string }).token ?? null;
        if (!token) {
            const setCookies = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
            token = extractTokenFromSetCookie(setCookies);
        }
        if (!token) {
            const raw = res.headers.get('set-cookie');
            if (raw) token = extractTokenFromSetCookie([raw]);
        }

        const response = NextResponse.json({
            admin: (data as { admin?: unknown }).admin,
            hotel: (data as { hotel?: unknown }).hotel,
        });

        if (!token) {
            return NextResponse.json(
                { message: 'Impersonation succeeded but no token was returned; check API response.' },
                { status: 502 },
            );
        }

        response.cookies.set(AUTH_COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: COOKIE_MAX_AGE,
            path: '/',
        });

        return response;
    } catch (err) {
        console.error('Platform impersonate proxy error:', err);
        return NextResponse.json({ message: 'Impersonation failed' }, { status: 500 });
    }
}
