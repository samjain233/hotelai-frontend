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
        const body = await request.json();
        const res = await fetch(`${API_URL}/auth/staff/access`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            return NextResponse.json(data, { status: res.status });
        }

        let token: string | null = data.token ?? null;
        if (!token) {
            const setCookies = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
            token = extractTokenFromSetCookie(setCookies);
        }
        if (!token) {
            const raw = res.headers.get('set-cookie');
            if (raw) token = extractTokenFromSetCookie([raw]);
        }

        const response = NextResponse.json({ admin: data.admin, hotel: data.hotel });

        if (token) {
            response.cookies.set(AUTH_COOKIE_NAME, token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: COOKIE_MAX_AGE,
                path: '/',
            });
        }

        return response;
    } catch (err) {
        console.error('Staff access proxy error:', err);
        return NextResponse.json({ message: 'Access failed' }, { status: 500 });
    }
}
