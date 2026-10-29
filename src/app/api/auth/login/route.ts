import { NextRequest, NextResponse } from 'next/server';
import { forwardNestSetCookies } from '@/lib/forwardNestSetCookies';
import { clientIpHeaders } from '@/lib/proxyClientHeaders';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...clientIpHeaders(request) },
            body: JSON.stringify(body),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            return NextResponse.json(data, { status: res.status });
        }

        const response = NextResponse.json({
            admin: data.admin,
            hotel: data.hotel,
        });
        forwardNestSetCookies(res, response);
        return response;
    } catch (err) {
        console.error('Auth proxy error:', err);
        return NextResponse.json({ message: 'Login failed' }, { status: 500 });
    }
}
