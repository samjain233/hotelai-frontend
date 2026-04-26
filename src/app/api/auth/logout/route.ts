import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const AUTH_COOKIE_NAME = 'auth_token';
const AUTH_REFRESH_COOKIE_NAME = 'auth_refresh';

export async function POST() {
    try {
        await fetch(`${API_URL}/auth/logout`, { method: 'POST' });
    } catch {
        // ignore
    }

    const response = NextResponse.json({ message: 'Logged out' });
    response.cookies.delete(AUTH_COOKIE_NAME);
    response.cookies.delete(AUTH_REFRESH_COOKIE_NAME);
    return response;
}
